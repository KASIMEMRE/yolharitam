// XP deposu: puan kazandırma (awardXp), toplam XP ve aktif günleri okuma (useXp),
// ve ekranda kısa "+20 XP" bildirimi için son kazanım (useLastAward).
//
// Desen preferences.ts ile aynı: modül düzeyinde değer + aboneler (useSyncExternalStore).
// Puan kazanılınca TÜM ekranlar (Yol Haritam, Profil, bildirim) aynı anda güncellenir.
import { useFocusEffect } from 'expo-router';
import { useCallback, useSyncExternalStore } from 'react';

import { dayKey } from '@/constants/activity';
import type { XpKind } from '@/constants/xp';
import { useAuth } from '@/lib/auth-context';
import { matchesTodayTask } from '@/lib/daily-task';
import { supabase } from '@/lib/supabase';

type XpState = {
  total: number;
  days: Set<string>; // XP kazanılan günler (seri hesabı için)
  dailyDoneDays: Set<string>; // günün görevinin tamamlandığı günler
  loaded: boolean;
};
export type Award = { id: number; kind: XpKind; amount: number; label?: string };

const EMPTY_STATE = (): XpState => ({ total: 0, days: new Set(), dailyDoneDays: new Set(), loaded: false });
let state: XpState = EMPTY_STATE();
let lastAward: Award | null = null;
let awardSeq = 0;
const listeners = new Set<() => void>();
const emit = () => listeners.forEach((l) => l());
const subscribe = (l: () => void) => {
  listeners.add(l);
  return () => listeners.delete(l);
};


// Sürüm sayacı: state her değiştiğinde (ödül, oturum sıfırlama) artar.
// Uçuştaki bir tazeleme başladığındaki sürüm değiştiyse sonucu eskimiştir; atılır ve yeniden okunur.
let version = 0;
let inFlight: Promise<void> | null = null;

// Oturum değişince (çıkış / başka hesap) önceki kullanıcının XP'si ekranda kalmasın
let lastUserId: string | null | undefined;
supabase.auth.onAuthStateChange((_event, session) => {
  const uid = session?.user.id ?? null;
  if (lastUserId !== undefined && uid !== lastUserId) {
    version++;
    state = EMPTY_STATE();
    lastAward = null;
    emit();
  }
  lastUserId = uid;
});

// PostgREST bir istekte en çok 1000 satır döndürür; sayfa sayfa hepsini çekeriz.
const PAGE = 1000;
async function fetchAllEvents() {
  const rows: { kind: string; ref: string; amount: number; created_at: string }[] = [];
  for (let from = 0; ; from += PAGE) {
    const { data, error } = await supabase
      .from('xp_events')
      .select('kind, ref, amount, created_at')
      .order('id') // sayfalar arasında sıra sabit kalsın
      .range(from, from + PAGE - 1);
    if (error || !data) return null; // tablo yoksa ya da ağ hatası: mevcut değer kalır
    rows.push(...data);
    if (data.length < PAGE) return rows;
  }
}

async function runRefresh() {
  for (let attempt = 0; attempt < 3; attempt++) {
    const startVersion = version;
    const data = await fetchAllEvents();
    if (!data) return;
    if (startVersion !== version) continue; // okurken ödül/oturum değişti: sonuç eski, tekrar oku
    const days = new Set<string>();
    const dailyDoneDays = new Set<string>();
    let total = 0;
    for (const e of data) {
      total += e.amount;
      days.add(dayKey(new Date(e.created_at)));
      if (e.kind === 'daily') dailyDoneDays.add(e.ref);
    }
    state = { total, days, dailyDoneDays, loaded: true };
    emit();
    return;
  }
}

// Sunucudan toplamı yeniden okur (odak değişiminde çağrılır). Aynı anda tek istek uçar;
// ikinci çağıran aynı sözü bekler.
export function refreshXp(): Promise<void> {
  if (!inFlight) {
    inFlight = runRefresh()
      .catch(() => {}) // sessiz geç
      .finally(() => {
        inFlight = null;
      });
  }
  return inFlight;
}

// Sunucunun (award_xp RPC) kendi başına verebildiği türler. quiz_done ve ask HARİÇ: onların kanıtı
// yapay zekâ çağrısının başarıyla bitmesidir, bunu yalnız topic-assist Edge Function'ı bilir ve puanı
// kendisi yazar (bkz. reportServerAward).
type RpcKind = Exclude<XpKind, 'quiz_done' | 'ask'>;
type AwardInput = {
  kind: RpcKind;
  ref: string; // olayın benzersiz anahtarı (aynı ref ikinci kez puan vermez)
  roadmapId?: string;
  topicId?: string;
  label?: string; // bildirimde gösterilecek özel metin
};

// Verilen puanı yerel duruma işler ve bildirimi tetikler. Tutarı SUNUCU söyler; burada hesaplanmaz.
function applyAward(kind: XpKind, amount: number, label?: string) {
  version++; // uçuştaki tazeleme bu ödülü ezmesin
  state = { ...state, total: state.total + amount, days: new Set(state.days).add(dayKey(new Date())) };
  lastAward = { id: ++awardSeq, kind, amount, label };
  emit();
}

// Bu olay günün görevini tamamlıyorsa görev bonusunu ister (bonusu da sunucu verir).
async function completeDailyIfMatches(event: { kind: XpKind; roadmapId?: string; topicId?: string }) {
  const today = dayKey(new Date());
  if (event.kind === 'daily' || state.dailyDoneDays.has(today)) return;
  const completes = await matchesTodayTask({ kind: event.kind, roadmapId: event.roadmapId, topicId: event.topicId });
  if (!completes) return;
  const ok = await awardXp({ kind: 'daily', ref: today, label: 'Günün görevi tamamlandı' });
  if (ok) {
    version++;
    state = { ...state, dailyDoneDays: new Set(state.dailyDoneDays).add(today) };
    emit();
  }
}

// Puan ister. Dönüş: true = yeni puan verildi, false = daha önce verilmiş, reddedildi ya da kaydedilemedi.
// İstemci tutar göndermez: sunucu award_xp(kind, ref) içinde tutarı sabit tablodan alır ve kanıtı
// (konu gerçekten bitti mi, harita bu kullanıcıya mı ait) kendisi doğrular.
// Günün görevini tamamlayan bir olaysa görev bonusu da otomatik istenir.
export async function awardXp(input: AwardInput): Promise<boolean> {
  let amount = 0;
  try {
    const { data, error } = await supabase.rpc('award_xp', { p_kind: input.kind, p_ref: input.ref.slice(0, 160) });
    // Hata (kanıt yok, tavan, ağ): sessiz çık. Başarıda dönen sayı verilen puandır; 0 = daha önce verilmiş.
    if (error || typeof data !== 'number') return false;
    amount = data;
  } catch {
    return false;
  }
  const isNew = amount > 0;
  if (isNew) {
    applyAward(input.kind, amount, input.label);
  } else if (input.kind === 'daily') {
    // Günlük bonus zaten alınmışsa günü işaretle: gereksiz tekrar istekleri atılmasın
    state = { ...state, dailyDoneDays: new Set(state.dailyDoneDays).add(input.ref) };
    emit();
  }
  // Olay yine de OLDU (puan daha önce verilmiş olsa bile): günün görevi o olay için seçildiyse tamamlanabilsin
  await completeDailyIfMatches(input);
  return isNew;
}

// topic-assist'in puanını (quiz, soru) ekrana yansıtır. Puan SUNUCUDA yazıldı; `amount` Edge Function'ın
// cevabındaki xp_awarded değeridir. 0 = puan verilmedi (daha önce alınmış ya da reddedilmiş): bildirim çıkmaz.
export async function reportServerAward(input: {
  kind: 'quiz_done' | 'ask';
  amount: number;
  topicId?: string;
  roadmapId?: string;
  label?: string;
}): Promise<boolean> {
  const isNew = Number.isFinite(input.amount) && input.amount > 0;
  if (isNew) applyAward(input.kind, input.amount, input.label);
  await completeDailyIfMatches(input);
  return isNew;
}

// Toplam XP ve günler. Ekran odaklanınca sunucudan tazelenir.
export function useXp() {
  const { session } = useAuth();
  const uid = session?.user.id;
  useFocusEffect(
    useCallback(() => {
      if (!uid) return; // misafir: xp_events sorgusu atılmaz
      refreshXp();
    }, [uid])
  );
  return useSyncExternalStore(
    subscribe,
    () => state,
    () => state
  );
}

export function useLastAward(): Award | null {
  return useSyncExternalStore(
    subscribe,
    () => lastAward,
    () => null
  );
}
