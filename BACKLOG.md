# Yol Haritam — Görev Listesi (Backlog)

Ajanlar "Sıradaki" bölümündeki en üstteki başlamamış görevi alır (bkz. AGENTS.md).
Önceliği proje sahibi belirler: sırayı değiştirmek için görevleri yukarı/aşağı taşı.

## Sıradaki

### Y-01 · Karşılama ekranını yeni tasarım diline uyarla
- `src/app/index.tsx`: giriş ekranındaki tasarım dili (accent buton, `RouteSteps` ile 3 adımlı rota) kullanılsın.
- Uygulamanın ne işe yaradığını tek cümleyle anlatan kısa bir metin.
- Buton: tema `accent` zemin, `onAccent` yazı.
- Kabul: Açık ve koyu modda okunaklı; küçük ekranlarda taşma yok.

### Y-02 · Profil: görünen adı düzenleme
- Profil ekranında `TextField` ile görünen ad (`profiles.display_name`) düzenlenebilsin, "Kaydet" butonu.
- Ekran açılınca mevcut değer `profiles` tablosundan okunur.
- Yol Haritam sekmesinin başlığında "Merhaba, <ad>" gösterilsin (ad yoksa gösterme).
- Kabul: Kaydetme sırasında yükleniyor durumu, hata olursa Türkçe mesaj.

### Y-03 · Onboarding'i yeni tasarım diline uyarla + konu araması
- Seçili kartlar ve buton `accent` rengini kullansın.
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
- Sekme ikonları: şablondan kalan ikonlar yerine sekmelere uygun ikonlar (Expo Go uyumlu yöntemle).

### Y-09 · "Gelişmeler" sekmesi: veri modeli ve kaynak listesi 🗄️
- Migration: `news_sources` (id, name, url, rss_url, topic_paths text[]) ve `news_items`
  (id, source_id, title, summary, url, published_at, topic_paths text[]); RLS: herkes okuyabilir, kimse yazamaz
  (yazma sadece sunucu tarafında).
- Teknoloji kategorisi için 10-15 güvenilir RSS kaynağı (resmi bloglar) seed migration olarak.
- Kabul: Telif kuralı: sadece başlık, kısa özet ve link saklanır.

## Tamamlanan (PR açıldı)

(henüz yok)
