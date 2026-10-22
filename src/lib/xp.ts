// XP deposu: puan kazandırma (awardXp), toplam XP ve aktif günleri okuma (useXp),
// ve ekranda kısa "+20 XP" bildirimi için son kazanım (useLastAward).
//
// Desen preferences.ts ile aynı: modül düzeyinde değer + aboneler (useSyncExternalStore).
// Puan kazanılınca TÜM ekranlar (Yol Haritam, Profil, bildirim) aynı anda güncellenir.
import { useFocusEffect } from 'expo-router';
import { useCallback, useSyncExternalStore } from 'react';

import { dayKey } from '@/constants/activity';
import { XP, type XpKind } from '@/constants/xp';
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

type AwardInput = {
  kind: XpKind;
  ref: string; // olayın benzersiz anahtarı (aynı ref ikinci kez puan vermez)
  amount?: number; // verilmezse XP tablosundaki değer
  roadmapId?: string;
  topicId?: string;
  label?: string; // bildirimde gösterilecek özel metin
};

// Puan kazandırır. Dönüş: true = yeni puan verildi, false = daha önce verilmiş ya da kaydedilemedi.
// Günün görevini tamamlayan bir olaysa görev bonusu da otomatik verilir.
export async function awardXp(input: AwardInput): Promise<boolean> {
  const amount = input.amount ?? (input.kind === 'quiz_done' ? 0 : XP[input.kind as Exclude<XpKind, 'quiz_done'>]);
  if (!amount || amount < 1) return false;
  let isNew = true;
  try {
    const { error } = await supabase.from('xp_events').insert({ kind: input.kind, ref: input.ref.slice(0, 160), amount });
    if (error) {
      // 23505 = bu olay daha önce puan almış. Olay yine de OLDU; günün görevi o olay için seçildiyse
      // tamamlanabilsin diye aşağıdaki görev kontrolüne devam ederiz. Diğer hatalarda (tablo yok, ağ) sessiz çık.
      if (error.code !== '23505') return false;
      isNew = false;
      // Günlük bonus zaten alınmışsa günü işaretle: gereksiz tekrar istekleri atılmasın
      if (input.kind === 'daily') {
        state = { ...state, dailyDoneDays: new Set(state.dailyDoneDays).add(input.ref) };
        emit();
      }
    }
  } catch {
    return false;
  }
  const today = dayKey(new Date());
  if (isNew) {
    version++; // uçuştaki tazeleme bu ödülü ezmesin
    state = { ...state, total: state.total + amount, days: new Set(state.days).add(today) };
    lastAward = { id: ++awardSeq, kind: input.kind, amount, label: input.label };
    emit();
  }

  if (input.kind !== 'daily' && !state.dailyDoneDays.has(today)) {
    const completes = await matchesTodayTask({ kind: input.kind, roadmapId: input.roadmapId, topicId: input.topicId });
    if (completes) {
      const ok = await awardXp({ kind: 'daily', ref: today, label: '🎯 Günün görevi tamam!' });
      if (ok) {
        version++;
        state = { ...state, dailyDoneDays: new Set(state.dailyDoneDays).add(today) };
        emit();
      }
    }
  }
  return isNew;
}

// Toplam XP ve günler. Ekran odaklanınca sunucudan tazelenir.
export function useXp() {
  useFocusEffect(
    useCallback(() => {
      refreshXp();
    }, [])
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
