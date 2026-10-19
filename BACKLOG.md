# Yol Haritam — Görev Listesi (Backlog)

Ajanlar "Sıradaki" bölümündeki en üstteki başlamamış görevi alır (bkz. AGENTS.md).
Önceliği proje sahibi belirler: sırayı değiştirmek için görevleri yukarı/aşağı taşı.

## Sıradaki

### Y-02 · Profil: görünen adı düzenleme
- Profil ekranında `TextField` ile görünen ad (`profiles.display_name`) düzenlenebilsin, "Kaydet" butonu.
- Ekran açılınca mevcut değer `profiles` tablosundan okunur.
- Yol Haritam sekmesinin başlığında "Merhaba, <ad>" gösterilsin (ad yoksa gösterme).
- Kabul: Kaydetme sırasında yükleniyor durumu, hata olursa Türkçe mesaj.

### Y-03 · Onboarding'i yeni tasarım diline uyarla + konu araması
- ✅ "Tasarım diline uyarla" kısmı tasarım yenileme PR'ı ile karşılandı (seçili kartlar ve buton `accent`). Kalan: arama.
- Üstte bir arama kutusu (`TextField`): yazınca tüm ağaçtaki YAPRAK konular arasında başlığa göre arasın,
  sonuçta tam yolu göstersin (örn. "Teknoloji › Yapay Zeka › RAG"); sonuca basınca doğrudan seviye seçimine geçsin.
- Türkçe karakterlere duyarsız arama (ı/i, ş/s vb.) için küçük bir yardımcı fonksiyon.
- Kabul: Arama boşken mevcut gezinme aynen çalışır.

### Y-04 · Yol haritası adımları: veri modeli + örnek içerik 🗄️
- Migration: `roadmap_steps` tablosu (id, roadmap_id → roadmaps, position int, title, description,
  estimated_hours int, created_at) ve `step_progress` tablosu (user_id, step_id, completed_at; birincil anahtar
  user_id+step_id). RLS: kullanıcı sadece kendi yol haritasının adımlarını görür, sadece kendi ilerlemesini yazar.
- AI gelene kadar: `src/constants/roadmap-templates.ts` içinde seviyeye göre genel bir şablon üreten fonksiyon
  (konu başlığını kullanarak 6-8 adım: temeller → pratik → proje). Onboarding kaydında adımlar da eklenir.
- Kabul: Migration RLS içerir; PR'da "Birleştirmeden önce migration uygulanmalı" notu.

### Y-05 · Yol Haritam ekranı: adımlar ve ilerleme
- Y-04'e bağlı. Adımlar dikey rota olarak listelensin (`RouteSteps` genişletilebilir veya yeni bileşen).
- Her adıma basınca tamamlandı/tamamlanmadı işaretlenir (`step_progress`).
- Üstte ilerleme özeti: "3 / 8 adım tamamlandı" ve ince bir ilerleme çubuğu.
- Kabul: Uygulama kapanıp açılınca ilerleme korunur.

### Y-06 · AI ile yol haritası üretimi (Edge Function, deploy yok)
- `supabase/functions/generate-roadmap/index.ts`: girdi { topic_path, level }, çıktı 6-10 adımlık JSON.
- LLM API anahtarı ortam değişkeninden okunur (`Deno.env.get(...)`), koda yazılmaz.
- Çıktı şeması doğrulanır; hatalı çıktıda şablona (Y-04) geri düşülür.
- Uygulama tarafı: fonksiyon varsa onu çağır, yoksa/hata verirse şablonu kullan.
- Kabul: PR açıklamasında deploy ve secret kurulum adımları yazılı.

### Y-07 · Boş, yükleniyor ve hata durumları
- Tüm ekranlarda ağ hatasında Türkçe, ne yapılacağını söyleyen mesaj + "Tekrar dene".
- Yükleniyor durumlarında yerleşimi zıplatmayan iskelet görünümler.

### Y-08 · Uygulama kimliği
- `app.json`: görünen ad "Yol Haritam", splash arka planı ve Android ikon zemini tema `accent` ile uyumlu.
- ✅ Sekme ikonları tasarım yenileme PR'ı ile karşılandı (`sf` + `md` ikonlar). Kalan: yukarıdaki `app.json` maddesi.

### Y-09 · "Gelişmeler" sekmesi: veri modeli ve kaynak listesi 🗄️
- Migration: `news_sources` (id, name, url, rss_url, topic_paths text[]) ve `news_items`
  (id, source_id, title, summary, url, published_at, topic_paths text[]); RLS: herkes okuyabilir, kimse yazamaz
  (yazma sadece sunucu tarafında).
- Teknoloji kategorisi için 10-15 güvenilir RSS kaynağı (resmi bloglar) seed migration olarak.
- Kabul: Telif kuralı: sadece başlık, kısa özet ve link saklanır.

## Tamamlanan (PR açıldı)

### Y-01 · Karşılama ekranını yeni tasarım diline uyarla
- `src/app/index.tsx`: giriş ekranındaki tasarım dili (accent buton, `RouteSteps` ile 3 adımlı rota) kullanılsın.
- Uygulamanın ne işe yaradığını tek cümleyle anlatan kısa bir metin.
- Buton: tema `accent` zemin, `onAccent` yazı.
- Kabul: Açık ve koyu modda okunaklı; küçük ekranlarda taşma yok.
- Tasarım yenileme PR'ı ile karşılandı (karşılama dahil tüm ekranlar yeniden tasarlandı; PR #1 kapatılabilir).

### TY · Oyunlaştırılmış tasarım yenileme (proje sahibinin doğrudan isteği)
- Tüm ekranlar (karşılama, giriş, onboarding, Yol Haritam, Gelişmeler, Profil, sekmeler) yeni tasarım sistemiyle yenilendi.
- Sahte veri yok: ilerleme, haber ve başarım alanları "Yakında" olarak kilitli.

### OTP-01 · E-posta doğrulaması kodla
- Kayıttan sonra e-postaya gelen kod `src/app/verify-email.tsx` ekranında girilir (`verifyOtp`); "Tekrar gönder" 60 sn geri sayımlıdır.
- Girişte "Email not confirmed" hatası kod ekranına yönlendirir; hata çevirileri `src/lib/auth-errors.ts` içinde ortaklaştı.

## Öneriler (ekipten)

Sıraya konmadı; önceliği proje sahibi verir.

- **Özel yuvarlak font (Nunito)** (tasarım yenilemesinden): Android'de başlıklar düz Roboto; `@expo-google-fonts/nunito` (yalnız JS, Expo Go uyumlu) ile oyunsu tipografi. Yeni bağımlılık + splash'te font yükleme gerektirir.
- **ESLint yapılandırması**: repoda `eslint.config.js` yok; AGENTS.md'deki "lint geçmeli" kuralı uygulanamıyor. `eslint-config-expo` eklenmeli.
- **Ağ hatası ile "kayıt yok" ayrımı**: `useLatestRoadmap` hata durumunu döndürmeli, ekranlar "Yüklenemedi, tekrar dene" göstermeli (Y-07 ile birlikte).
- **Ortak `TopicCard` bileşeni**: Yol Haritam ve Profil'deki konu kartları benzer stil taşıyor.
- **Şablon kalıntılarını temizle**: kullanılmayan `external-link.tsx`, `hint-row.tsx`, `AnimatedIcon`, `assets/images/tabIcons/*`; açılış ekranı (`AnimatedSplashOverlay`) hâlâ Expo logosu.
- **Alt kategori ikonları**: alt kategori listesinde tüm kartlar kategorinin emojisini taşıyor; alt kategoriye özel emoji eklenebilir.
- **"Yolculuk başlıyor" çipi**: Y-04/Y-05 ile gerçek adımlar gelince kaldırılmalı/güncellenmeli.
- **Şifremi unuttum akışı**: OTP altyapısı hazır (`verifyOtp` type 'recovery'). Ortak `AuthScreenLayout`: login ve verify-email iskeleti tekrar ediyor.
- **CAPTCHA ve rate limit**: kayıt/doğrulama için CAPTCHA ve Supabase rate limit ayarlarının gözden geçirilmesi.
- **Özel SMTP**: Supabase'e özel SMTP bağlanması (varsayılan e-posta limiti çok düşük).
