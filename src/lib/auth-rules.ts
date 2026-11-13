// Hesap kuralları: kayıt ekranı ve ayarlar (şifre değiştirme) aynı alt sınırı kullansın diye tek yerde.
// Supabase Auth ayarındaki en düşük şifre uzunluğuyla uyumlu tutulmalı.
export const MIN_PASSWORD = 8;

// Sunucu kullanıcı adını reddettiyse (uygunsuz ya da ayrılmış ad) fırlattığı hata mesajı buradadır
// ('username_not_allowed', eski sürümde 'inappropriate_content'). Kelime listesi istemciye GÖMÜLMEZ:
// uygunluğu yalnız sunucu bilir; istemci sonucu (username_available = false ya da bu hata) tek mesaja çevirir.
export function isUsernameRejection(error: { message?: string } | null | undefined): boolean {
  const m = error?.message ?? '';
  return m.includes('username_not_allowed') || m.includes('inappropriate_content');
}
