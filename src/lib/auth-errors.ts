import { isAuthRetryableFetchError } from '@supabase/supabase-js';

// Supabase'in hata nesnesinden ihtiyacımız olan alanlar. AuthError bunu karşılar;
// ağ kopukken fırlayan düz Error da (code olmadan) bu şekle uyar.
type AuthLikeError = { message: string; code?: string };

// Hangi ekranda/işlemde oluştu? Aynı hata kodu bağlama göre farklı Türkçe istiyor.
export type AuthContext = 'login' | 'signup' | 'verify' | 'resend';

// Hatanın "türü": ekran buna göre davranır (örn. kod alanı yalnız 'code' için kırmızı olur).
export type AuthErrorKind = 'code' | 'rateLimit' | 'network' | 'other';

// Önce `error.code`'a bakıyoruz, mesaj metnine yalnız yedek olarak. Çünkü mesajlar İngilizce
// ve Supabase sürümleriyle değişebilir; `code` ise sabit ve makine okumaya uygun bir anahtardır.
export function authErrorKind(error: AuthLikeError): AuthErrorKind {
  const code = error.code ?? '';
  const m = error.message.toLowerCase();

  if (code === 'otp_expired' || m.includes('expired or is invalid') || m.includes('token has expired')) {
    return 'code';
  }
  if (
    code === 'over_email_send_rate_limit' ||
    code === 'over_request_rate_limit' ||
    m.includes('rate limit') ||
    m.includes('too many') ||
    m.includes('security purposes') // "...after 60 seconds" cümlesi böyle başlar
  ) {
    return 'rateLimit';
  }
  // Ağ kopukken kütüphane "retryable fetch" hatası verir; bazen düz "Network request failed" gelir.
  // "load failed" = Safari, "networkerror" = Firefox ("NetworkError when attempting to fetch...").
  if (
    isAuthRetryableFetchError(error) ||
    m.includes('network') ||
    m.includes('failed to fetch') ||
    m.includes('load failed') ||
    m.includes('networkerror')
  ) {
    return 'network';
  }
  return 'other';
}

// Yalnız toTurkish içinde kullanılır: "Confirm email" KAPALIYKEN Supabase açık `user_already_exists` hatası döner.
const ALREADY_REGISTERED_MESSAGE = 'Bu e-postayla zaten bir hesap var. Giriş yapmayı dene.';

// Supabase'in İngilizce hatalarını kullanıcının anlayacağı Türkçeye çevirir.
export function toTurkish(error: AuthLikeError, context: AuthContext = 'login'): string {
  const code = error.code ?? '';
  const m = error.message.toLowerCase();
  const kind = authErrorKind(error);

  if (kind === 'code') return 'Kod hatalı ya da süresi dolmuş. Kodu kontrol et ya da yeni kod iste.';
  if (kind === 'rateLimit') {
    if (context === 'verify' || context === 'resend') {
      // Doğrulamada "çok fazla deneme" ile e-posta gönderim sınırı farklı şeylerdir.
      if (code === 'over_request_rate_limit' && context === 'verify') {
        return 'Çok fazla deneme yaptın. Biraz bekleyip tekrar dene.';
      }
      // Sabit metin: saniyeyi ekran kendi sayacıyla gösterir (canlı bölgede değişen sayı olmasın).
      return 'Çok sık kod istedin. Sayaç bitince tekrar dene.';
    }
    return 'Çok fazla deneme yapıldı. Birkaç dakika sonra tekrar dene.';
  }
  if (kind === 'network') return 'İnternet bağlantısı yok gibi görünüyor. Bağlantını kontrol et.';

  if (code === 'invalid_credentials' || m.includes('invalid login credentials')) {
    return 'E-posta veya şifre hatalı.';
  }
  if (code === 'user_already_exists' || code === 'email_exists' || m.includes('already registered')) {
    return ALREADY_REGISTERED_MESSAGE;
  }
  if (code === 'email_address_invalid') return 'Bu e-posta adresi geçerli görünmüyor.';
  if (code === 'email_address_not_authorized') return 'Bu adrese şu an e-posta gönderemiyoruz.';
  if (code === 'weak_password' || m.includes('password should be at least')) {
    return m.includes('at least 6') || m.includes('password should be at least')
      ? 'Şifre çok kısa. En az 6 karakter olmalı.'
      : 'Şifre yeterince güçlü değil. Daha uzun yap; harf, rakam ve işaret karıştır.';
  }

  // Tanımadığımız hata: kullanıcıya İngilizce ham mesaj göstermeyiz; geliştirici konsoldan görür.
  console.warn('Tanınmayan auth hatası:', code, error.message);
  return 'Bir sorun oluştu. Biraz sonra tekrar dene.';
}

// "Giriş yapılamadı: e-posta doğrulanmamış" hatası mı? Bu durumda hata kutusu yerine kod ekranına gideriz.
export function isEmailNotConfirmed(error: AuthLikeError): boolean {
  return error.code === 'email_not_confirmed' || error.message.toLowerCase().includes('email not confirmed');
}

// Limit hatasının mesajında "...after 42 seconds" gibi bir süre varsa saniyeyi verir, yoksa null.
export function rateLimitSeconds(error: AuthLikeError): number | null {
  // Süreyi çıkaran tek yer burası (toTurkish artık kendi regex'ini taşımıyor).
  const found = /after (\d+) second/.exec(error.message.toLowerCase())?.[1];
  return found ? Number(found) : null;
}
