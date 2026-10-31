// Supabase/PostgREST hatalarını ekranların anlayacağı 4 türe ayırır.
//
// Neden `error.message` değil `error.code`? Mesaj İngilizce ve teknik (kullanıcıya gösterilmez),
// ayrıca metni değişebilir. Kod ise sabittir. Hata nesnesi her zaman PostgrestError örneği olmayabilir
// (düz nesne gelebilir), bu yüzden `instanceof` yerine yalnız `.code` okunur.
export type DbErrorKind = 'schema' | 'duplicate' | 'network' | 'other';

type DbError = { code?: string; message?: string } | null | undefined;

// Tablo, sütun ya da fonksiyon veritabanında YOK: migration henüz uygulanmamış demektir.
//  PGRST202 fonksiyon yok · PGRST204 sütun yok (insert/update) · PGRST205 tablo yok
//  42P01 tablo yok · 42703 sütun yok (select) · 42883 fonksiyon yok (Postgres ham kodları)
const SCHEMA_CODES = ['PGRST202', 'PGRST204', 'PGRST205', '42P01', '42703', '42883'];

export function classifyError(error: DbError): DbErrorKind {
  const code = error?.code;
  // Zaman aşımında (AbortController) supabase-js "AbortError: …" mesajıyla döner: ağ sorunu sayılır.
  if (/^AbortError/.test(error?.message ?? '')) return 'network';
  // Tarayıcıların ağ hatası metinleri: Chrome "Failed to fetch", Safari "Load failed", Firefox "NetworkError…"
  if (/failed to fetch|load failed|networkerror/i.test(error?.message ?? '')) return 'network';
  if (code === undefined) return 'other';
  if (SCHEMA_CODES.includes(code)) return 'schema';
  // 23505 = benzersizlik kısıtı ihlali: aynı yol haritası için adımlar zaten var.
  if (code === '23505') return 'duplicate';
  // İstek sunucuya hiç ulaşamadıysa (internet yok) supabase-js code'u BOŞ metin ('') yapar;
  // gerçek veritabanı hatalarında dolu bir kod vardır.
  if (code === '') return 'network';
  return 'other';
}

// Kullanıcıya gösterilen sabit Türkçe metinler (hata mesajı ASLA doğrudan gösterilmez).
export const ERROR_TEXT = {
  // Kayıt sırasında
  saveSchema: 'Şu an kaydedilemiyor. Biraz sonra tekrar dene.',
  // Liste okunurken
  loadSchema: 'Şu an yüklenemiyor. Biraz sonra tekrar dene.',
  network: 'Bağlantı sorunu var. İnternetini kontrol edip tekrar dene.',
  other: 'Bir şeyler ters gitti. Biraz sonra tekrar dene.',
  // Profil'de başarımlar okunurken
  achievementsFailed: 'Başarımların yüklenemedi. İnternet bağlantını kontrol edip tekrar dene.',
  // Profil'de görünen ad okunurken / kaydedilirken
  profileLoadFailed: 'Adın yüklenemedi. İnternet bağlantını kontrol edip tekrar dene.',
  profileSaveFailed: 'Adın kaydedilemedi. Biraz sonra tekrar dene.',
  // Yol haritaları listesi okunurken
  mapsLoadFailed: 'Haritaların yüklenemedi. İnternet bağlantını kontrol edip tekrar dene.',
  // Gelişmeler sekmesinde haberler okunurken
  newsLoadFailed: 'Haberler yüklenemedi. İnternet bağlantını kontrol edip tekrar dene.',
  // Topluluk: kullanıcı adı ve lig
  usernameLoadFailed: 'Kullanıcı adın yüklenemedi. İnternet bağlantını kontrol edip tekrar dene.',
  usernameSaveFailed: 'Kullanıcı adı kaydedilemedi. Biraz sonra tekrar dene.',
  usernameTaken: 'Bu kullanıcı adı alınmış.',
  inappropriate: 'Bu metin uygunsuz ifade içeriyor gibi görünüyor. Lütfen değiştir.',
  usernameCheckFailed: 'Uygunluk şu an denetlenemedi. Yine de kaydetmeyi deneyebilirsin.',
  leagueLoadFailed: 'Lig sıralaması yüklenemedi. İnternet bağlantını kontrol edip tekrar dene.',
  // Topluluk: arkadaşlar ve proje vitrini
  friendsLoadFailed: 'Arkadaşların yüklenemedi. İnternet bağlantını kontrol edip tekrar dene.',
  friendActionFailed: 'İşlem tamamlanamadı. İnternet bağlantını kontrol edip tekrar dene.',
  showcaseLoadFailed: 'Projeler yüklenemedi. İnternet bağlantını kontrol edip tekrar dene.',
  showcaseActionFailed: 'İşlem tamamlanamadı. İnternet bağlantını kontrol edip tekrar dene.',
  showcaseSaveFailed: 'Projen paylaşılamadı. İnternet bağlantını kontrol edip tekrar dene.',
  showcaseLimit: 'Proje sınırına ulaştın (harita başına 5, toplam 20). Önce eskilerinden birini sil.',
  reportTooSoon: 'Yeni hesaplar bildirim yapmadan önce 1 gün beklemeli.',
  reportLimit: 'Bugün çok fazla bildirim yaptın. Yarın tekrar dene.',
  roadmapLimit: "En fazla 30 harita ekleyebilirsin. Eskilerden birini Ayarlar'dan kaldır.",
  // Adım işaretlenirken
  markFailed: 'İşaret kaydedilemedi. İnternet bağlantını kontrol edip tekrar dene.',
  markSchema: 'İşaret kaydedilemedi. Biraz sonra tekrar dene.',
  session: 'Oturumun kapanmış. Lütfen yeniden giriş yap.',
} as const;
