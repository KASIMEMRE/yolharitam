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

let state: XpState = { total: 0, days: new Set(), dailyDoneDays: new Set(), loaded: false };
let lastAward: Award | null = null;
let awardSeq = 0;
const listeners = new Set<() => void>();
const emit = () => listeners.forEach((l) => l());
const subscribe = (l: () => void) => {
  listeners.add(l);
  return () => listeners.delete(l);
};

// Sunucudan toplamı yeniden okur (odak değişiminde çağrılır)
export async function refreshXp() {
  try {
    const { data, error } = await supabase.from('xp_events').select('kind, ref, amount, created_at');
    if (error || !data) return; // tablo henüz yoksa ya da ağ hatası: mevcut değer kalır
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
  } catch {
    // sessiz geç
  }
}

type AwardInput = {
  kind: XpKind;
  ref: string; // olayın benzersiz anahtarı (aynı ref ikinci kez puan vermez)
  amount?: number; // verilmezse XP tablosundaki değer
  roadmapId?: string;
  topicId?: string;
  label?: string; // bildirimde gösterilecek özel metin
};

// Puan kazandırır. Dönüş: true = puan verildi, false = daha önce verilmiş ya da kaydedilemedi.
// Günün görevini tamamlayan bir olaysa görev bonusu da otomatik verilir.
export async function awardXp(input: AwardInput): Promise<boolean> {
  const amount = input.amount ?? (input.kind === 'quiz_done' ? 0 : XP[input.kind as Exclude<XpKind, 'quiz_done'>]);
  if (!amount || amount < 1) return false;
  try {
    const { error } = await supabase.from('xp_events').insert({ kind: input.kind, ref: input.ref.slice(0, 160), amount });
    if (error) return false; // 23505 = bu olay zaten puan verdi; diğerleri (tablo yok, ağ) sessiz geçer
  } catch {
    return false;
  }
  const today = dayKey(new Date());
  state = { ...state, total: state.total + amount, days: new Set(state.days).add(today) };
  lastAward = { id: ++awardSeq, kind: input.kind, amount, label: input.label };
  emit();

  if (input.kind !== 'daily' && !state.dailyDoneDays.has(today)) {
    const completes = await matchesTodayTask({ kind: input.kind, roadmapId: input.roadmapId, topicId: input.topicId });
    if (completes) {
      const ok = await awardXp({ kind: 'daily', ref: today, label: '🎯 Günün görevi tamam!' });
      if (ok) {
        state = { ...state, dailyDoneDays: new Set(state.dailyDoneDays).add(today) };
        emit();
      }
    }
  }
  return true;
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
