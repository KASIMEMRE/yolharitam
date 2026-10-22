// "5 dk önce", "dün", "12 Eki" gibi kısa göreli zaman yazar. Saf fonksiyon: `now` dışarıdan
// verilebildiği için aynı girdiyle hep aynı sonuç döner (test etmek ve render'da tutarlı olmak kolay).
const MONTHS = ['Oca', 'Şub', 'Mar', 'Nis', 'May', 'Haz', 'Tem', 'Ağu', 'Eyl', 'Eki', 'Kas', 'Ara'];

export function relativeTime(iso: string, now: number = Date.now()): string {
  const then = new Date(iso).getTime();
  if (Number.isNaN(then)) return '';
  const minutes = Math.floor((now - then) / 60_000);
  // Saat farkı küçük negatifse (cihaz saati geride) "az önce" demek en doğrusu
  if (minutes < 1) return 'az önce';
  if (minutes < 60) return `${minutes} dk önce`;
  const hours = Math.floor(minutes / 60);
  if (hours < 24) return `${hours} saat önce`;
  const days = Math.floor(hours / 24);
  if (days === 1) return 'dün';
  if (days < 7) return `${days} gün önce`;
  const d = new Date(then);
  return `${d.getDate()} ${MONTHS[d.getMonth()]}`;
}
