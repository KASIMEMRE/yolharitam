// Haftalık lig için hafta hesapları (saf fonksiyonlar, ağ yok).
//
// Neden elle hesap? Sunucu "hafta"yı Europe/Istanbul saatine göre, pazartesi 00:00'dan başlatır.
// Türkiye 2016'dan beri sabit UTC+3 kullanıyor (yaz saati yok). Bu yüzden Intl/saat dilimi
// kütüphanesi gerekmeden "3 saat ekle, UTC alanlarıyla hesapla, 3 saat çıkar" yeterli.
const ISTANBUL_OFFSET_MS = 3 * 60 * 60 * 1000;
const DAY_MS = 24 * 60 * 60 * 1000;

// İçinde bulunulan haftanın başı (pazartesi 00:00) ve sonu (gelecek pazartesi 00:00), İstanbul saatiyle.
export function weekRange(now: Date = new Date()): { start: Date; end: Date } {
  // "İstanbul duvar saati" gibi davranan kaydırılmış zaman: UTC alanları İstanbul saatini verir
  const shifted = new Date(now.getTime() + ISTANBUL_OFFSET_MS);
  const dayOfWeek = shifted.getUTCDay(); // 0 = pazar … 6 = cumartesi
  const sinceMonday = (dayOfWeek + 6) % 7; // pazartesi 0, pazar 6
  const midnight = Date.UTC(shifted.getUTCFullYear(), shifted.getUTCMonth(), shifted.getUTCDate());
  const startMs = midnight - sinceMonday * DAY_MS - ISTANBUL_OFFSET_MS;
  return { start: new Date(startMs), end: new Date(startMs + 7 * DAY_MS) };
}

// Hafta bitimine kalan tam gün sayısı (yukarı yuvarlanır; bugün de sayılır).
export function daysLeftInWeek(now: Date = new Date()): number {
  const { end } = weekRange(now);
  return Math.max(1, Math.ceil((end.getTime() - now.getTime()) / DAY_MS));
}

// Ekranda gösterilen metin: "Hafta bitimine 3 gün" ya da son günde "Hafta bugün bitiyor".
export function weekEndText(now: Date = new Date()): string {
  const days = daysLeftInWeek(now);
  return days <= 1 ? 'Hafta bugün bitiyor' : `Hafta bitimine ${days} gün`;
}
