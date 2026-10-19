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
  if (isAuthRetryableFetchError(error) || m.includes('network') || m.includes('failed to fetch')) {
    return 'network';
  }
  return 'other';
}

// Supabase'in İngilizce hatalarını kullanıcının anlayacağı Türkçeye çevirir.
export function toTurkish(error: AuthLikeError, context: AuthContext = 'login'): string {
  const code = error.code ?? '';
  const m = error.message.toLowerCase();
  const kind = authErrorKind(error);

  if (kind === 'code') return 'Kod hatalı ya da süresi dolmuş. Kodu kontrol et ya da yeni kod iste.';
  if (kind === 'rateLimit') {
    return context === 'verify' || context === 'resend'
      ? 'Çok sık kod istedin ya da e-posta gönderim sınırına ulaşıldı. Birkaç dakika bekleyip tekrar dene.'
      : 'Çok fazla deneme yapıldı. Birkaç dakika sonra tekrar dene.';
  }
  if (kind === 'network') return 'İnternet bağlantısı yok gibi görünüyor. Bağlantını kontrol et.';

  if (code === 'invalid_credentials' || m.includes('invalid login credentials')) {
    return 'E-posta veya şifre hatalı.';
  }
  if (code === 'user_already_exists' || code === 'email_exists' || m.includes('already registered')) {
    return 'Bu e-postayla zaten bir hesap var. Giriş yapmayı dene.';
  }
  if (code === 'email_address_invalid') return 'Bu e-posta adresi geçerli görünmüyor.';
  if (code === 'email_address_not_authorized') return 'Bu adrese şu an e-posta gönderemiyoruz.';
  if (code === 'weak_password' || m.includes('password should be at least')) {
    return 'Şifre çok kısa. En az 6 karakter olmalı.';
  }

  // Tanımadığımız hata: kullanıcıya İngilizce ham mesaj göstermeyiz; geliştirici konsoldan görür.
  console.warn('Tanınmayan auth hatası:', code, error.message);
  return 'Bir sorun oluştu. Biraz sonra tekrar dene.';
}

// Kayıtta "e-posta zaten kayıtlı" mesajı iki yerden (hata + identities kontrolü) kullanılıyor.
export const ALREADY_REGISTERED_MESSAGE = 'Bu e-postayla zaten bir hesap var. Giriş yapmayı dene.';

// "Giriş yapılamadı: e-posta doğrulanmamış" hatası mı? Bu durumda hata kutusu yerine kod ekranına gideriz.
export function isEmailNotConfirmed(error: AuthLikeError): boolean {
  return error.code === 'email_not_confirmed' || error.message.toLowerCase().includes('email not confirmed');
}
