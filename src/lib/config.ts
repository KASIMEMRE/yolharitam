// Uygulamanın bağlandığı Supabase projesi.
//
// Değerler önce ortam değişkenlerinden (.env.local, EAS ortam değişkenleri) okunur; yoksa canlı proje
// kullanılır. Neden koda yazmak güvenli? Bu iki değer zaten her kullanıcının telefonundaki uygulama
// paketinin içinde durur: "publishable" (yayınlanabilir) anahtar herkese açık olacak şekilde tasarlanmıştır,
// verileri RLS kuralları korur. GİZLİ anahtarlar (service_role, GROQ_API_KEY) asla buraya yazılmaz;
// onlar yalnız Supabase sırlarında durur.
//
// Varsayılan değer olmasının nedeni: ortam değişkeni unutulmuş bir mağaza derlemesi açılışta çökmesin.
const PROD_URL = 'https://iylnlzzqpoazoxfsmytn.supabase.co';
const PROD_PUBLISHABLE_KEY = 'sb_publishable_QjMiCz_9KfP5E_F-z6nRqA_sISzKZDw';

export const SUPABASE_URL = process.env.EXPO_PUBLIC_SUPABASE_URL || PROD_URL;
export const SUPABASE_PUBLISHABLE_KEY = process.env.EXPO_PUBLIC_SUPABASE_PUBLISHABLE_KEY || PROD_PUBLISHABLE_KEY;

// Destek ve yasal sayfalar (mağaza formlarında da aynı adresler kullanılır)
export const SUPPORT_EMAIL = 'kasimemresekersoy@gmail.com';
const DOCS = 'https://github.com/KASIMEMRE/yolharitam/blob/main/docs/yasal';
export const PRIVACY_URL = `${DOCS}/gizlilik-politikasi.md`;
export const TERMS_URL = `${DOCS}/kullanim-kosullari.md`;
export const ACCOUNT_DELETION_URL = `${DOCS}/hesap-silme.md`;
