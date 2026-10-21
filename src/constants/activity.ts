// Seri (streak) ve haftalık hedef hesabı. SAF modül: tarih listesi alır, sayı döndürür.
//
// Veri kaynağı topic_progress.updated_at: kullanıcı bir konuyu işaretlediği her gün "aktif gün" sayılır.
// Bilinen sınır: aynı konunun işaretini sonradan değiştirirsen eski günün kaydı yerine yeni gün yazılır.
// Ayrı bir etkinlik tablosu tutmadan iş görecek kadar doğru bir yaklaşımdır.

import { WEEKLY_HOURS, type WeeklyHoursId } from '@/constants/plan';

// Yerel saate göre gün anahtarı: '2026-10-21'. (toISOString UTC'ye çevirir; gece yarısı civarında
// Türkiye'de günü yanlış sayardı, bu yüzden yerel parçalardan kuruyoruz.)
export function dayKey(date: Date): string {
  const m = String(date.getMonth() + 1).padStart(2, '0');
  const d = String(date.getDate()).padStart(2, '0');
  return `${date.getFullYear()}-${m}-${d}`;
}

function addDays(date: Date, n: number): Date {
  const x = new Date(date);
  x.setDate(x.getDate() + n);
  return x;
}

// Bugünden (ya da bugün henüz etkinlik yoksa dünden) geriye kesintisiz aktif gün sayısı.
// Dün aktifsen ve bugün henüz bir şey yapmadıysan seri BOZULMAZ; gün bitene kadar şansın var.
//
// SERİ KORUYUCU: her takvim haftasında (pazartesi-pazar) BİR boş gün affedilir. Boş gün seriye
// sayılmaz ama seriyi de bozmaz. Art arda iki boş gün ya da aynı haftada ikinci boş gün seriyi bitirir.
// Koruyucu otomatik çalışır; ayrıca saklanmaz, her seferinde tarihlerden yeniden hesaplanır.
export function computeStreak(activeDays: ReadonlySet<string>, now: Date = new Date()) {
  const activeToday = activeDays.has(dayKey(now));
  let cursor = activeToday ? now : addDays(now, -1);
  let streak = 0;
  const frozenWeeks = new Set<string>(); // koruyucusu kullanılmış haftalar (pazartesinin gün anahtarı)
  let frozenDay: string | null = null;
  for (let guard = 0; guard < 3660; guard++) {
    const key = dayKey(cursor);
    if (activeDays.has(key)) {
      streak += 1;
      cursor = addDays(cursor, -1);
      continue;
    }
    // Boş gün: bu haftanın koruyucusu kullanılmadıysa VE bir önceki gün aktifse köprü kur
    const week = dayKey(startOfWeek(cursor));
    const before = addDays(cursor, -1);
    if (!frozenWeeks.has(week) && activeDays.has(dayKey(before))) {
      frozenWeeks.add(week);
      if (frozenDay === null) frozenDay = key;
      cursor = before;
      continue;
    }
    break;
  }
  const thisWeek = dayKey(startOfWeek(now));
  return {
    streak,
    activeToday,
    // Bu haftanın koruyucusu seriyi korumak için kullanıldı mı?
    freezeUsedThisWeek: frozenWeeks.has(thisWeek),
    frozenDay,
  };
}

// Haftanın başı: pazartesi 00:00 (yerel)
export function startOfWeek(now: Date = new Date()): Date {
  const x = new Date(now);
  x.setHours(0, 0, 0, 0);
  const diff = (x.getDay() + 6) % 7; // pazartesi = 0
  return addDays(x, -diff);
}

// Bu hafta bitirilen konuların tahmini saatleri, haftalık hedefe (seçilen haftalık süre) karşı
export function weeklyProgress(
  doneThisWeek: { hours: number }[],
  weekly: WeeklyHoursId
): { hours: number; target: number; ratio: number } {
  const hours = doneThisWeek.reduce((sum, t) => sum + t.hours, 0);
  const target = WEEKLY_HOURS[weekly];
  return { hours, target, ratio: target > 0 ? Math.min(1, hours / target) : 0 };
}
