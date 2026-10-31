# Yol Haritam — Görev Listesi (Backlog)

Ajanlar "Sıradaki" bölümündeki en üstteki başlamamış görevi alır (bkz. AGENTS.md).
Önceliği proje sahibi belirler: sırayı değiştirmek için görevleri yukarı/aşağı taşı.

## Sıradaki

### UX-01 · Kullanılabilirlik denetimi ve en etkili iyileştirmeler (proje sahibinin isteği)
Amaç: uygulama daha kolay ve kullanışlı olsun. Önce DENETLE, sonra en çok fark yaratanları uygula.
- Ürün sorumlusu + tasarımcı ana akışları kullanıcı gözüyle gezer ve sürtünme noktalarını listeler:
  1) İlk açılış → kayıt → harita seçimi → ilk konuya ulaşma (kaç dokunuş? nerede takılır?)
  2) Yol Haritam ekranı: önemli bilgi (sıradaki konu, günün görevi) hemen görünüyor mu, ekran gereksiz uzun mu?
  3) Konu detayı: durum işaretleme, kaynak açma, quiz/soru sorma ne kadar kolay?
  4) Topluluk ve Ayarlar: aranan şey bulunuyor mu, gereksiz adım var mı?
- Bulguları etki/çaba ile sırala; en etkili 3-5 iyileştirmeyi TEK PR'da uygula (büyük yeniden tasarım yok).
- Mevcut tasarım dili ve simge seti korunur (simgeler: `src/components/icon.tsx`, emoji yazma).
- Kabul: PR açıklamasında bulgu listesi (uygulananlar + sonraya bırakılanlar), önce/sonra ekran görüntüleri,
  tsc + lint temiz. Sonraya bırakılanlar bu dosyaya yeni görev olarak eklenir.

### Y-07 · Boş, yükleniyor ve hata durumları
- Tüm ekranlarda ağ hatasında Türkçe, ne yapılacağını söyleyen mesaj + "Tekrar dene".
- Yükleniyor durumlarında yerleşimi zıplatmayan iskelet görünümler.

### Y-03 · Harita seçiminde arama
- Onboarding'deki harita listesinin üstünde arama kutusu: harita ve konu başlıklarında arasın
  (Türkçe karakterlere duyarsız: ı/i, ş/s…); sonuca basınca o harita seçilsin.
- Kabul: Arama boşken mevcut seçim akışı aynen çalışır.

## Beklemede (sırada değil)

### OTP-01 · E-postaya gelen kodla doğrulama (PR #4)
- Özel SMTP (ör. Brevo) bağlanıp "Confirm signup" şablonuna `{{ .Token }}` eklenene kadar bekliyor.
- Bu PR "2 açık ajan PR'ı" sınırına SAYILMAZ.

## Tamamlanan (PR açıldı)

### Y-08 · Uygulama kimliği
- Görünen ad "Yol Haritam", yeni uygulama simgesi, açılış ekranı ve favicon (modern simgeler PR'ı, #39).

### Y-06 · AI ile yol haritası
- Yerine `personalize-roadmap` geldi (yapay zekâ haritayı kişiye göre işaretler).

### Y-01 · Karşılama ekranını yeni tasarım diline uyarla
- `src/app/index.tsx`: giriş ekranındaki tasarım dili (accent buton, `RouteSteps` ile 3 adımlı rota) kullanılsın.
- Uygulamanın ne işe yaradığını tek cümleyle anlatan kısa bir metin.
- Buton: tema `accent` zemin, `onAccent` yazı.
- Kabul: Açık ve koyu modda okunaklı; küçük ekranlarda taşma yok.
- Tasarım yenileme PR'ı ile karşılandı (karşılama dahil tüm ekranlar yeniden tasarlandı; PR #1 kapatılabilir).

### TY · Oyunlaştırılmış tasarım yenileme (proje sahibinin doğrudan isteği)
- Tüm ekranlar (karşılama, giriş, onboarding, Yol Haritam, Gelişmeler, Profil, sekmeler) yeni tasarım sistemiyle yenilendi.
- Sahte veri yok: ilerleme, haber ve başarım alanları "Yakında" olarak kilitli.

### Y-04 · Yol haritası adımları: soru akışı + şablonla adım üretimi + adım listesi 🗄️
- Onboarding'de seviyeden sonra 3 soru (haftalık süre, hedef, öğrenme tarzı); cevaplara göre `roadmap-templates.ts`
  şablonuyla 6-8 adım üretilir. Kayıt tek RPC çağrısıyla (roadmap + cevaplar + adımlar atomik) yapılır.
- Yol Haritam'da adımlar evrelere göre listelenir; adımı olmayan mevcut kullanıcı "Adımlarımı oluştur" ile aynı soruları yanıtlar.
- Migration: `roadmap_steps`, `step_progress` (bu PR'da kullanılmıyor), `roadmaps` cevap sütunları, 2 RPC, RLS dahil.
- Not: "Yolculuk başlıyor" çipi kaldırıldı, yerine gerçek özet (adım sayısı, toplam saat, tahmini hafta) geldi.

### Y-05 · Yol Haritam ekranı: adımlar ve ilerleme
- Y-04'e bağlı. Liste görünümü Y-04 PR'ında yapıldı (`RoadmapStepList`); kalan: işaretleme ve ilerleme özeti.
- Adımlar dikey rota olarak listelensin (`RouteSteps` genişletilebilir veya yeni bileşen).
- Her adıma basınca tamamlandı/tamamlanmadı işaretlenir (`step_progress`).
- Üstte ilerleme özeti: "3 / 8 adım tamamlandı" ve ince bir ilerleme çubuğu.
- Kabul: Uygulama kapanıp açılınca ilerleme korunur.
- ✅ Adım kartı onay kutusu (insert/delete ile `step_progress`), iyimser güncelleme, `ProgressSummary` (N / M + çubuk + kalan süre), "Sıradaki adım", "Evre tamamlandı", yol bitince `Celebration`.

### Y-10 · Başarımlar
- Profil'deki kilitli "Başarımlar" kartı yerine 9 gerçek rozet (`src/constants/achievements.ts`, saf hesap) ve `use-achievements` hook'u.
- Rozetler veritabanında saklanmaz, adım/ilerleme verisinden her açılışta türetilir (tablo/migration yok); bir adımın işareti geri alınırsa rozet kaybolabilir.
- Kazanılanlar renkli, kazanılmayanlar soluk + nasıl kazanılacağı + gerçek ilerleme ("2 / 3 adım"). "Rozet kazanıldı" bildirimi kapsam dışı.

### Y-02 · Profil: görünen adı düzenleme
- Profil'de "Görünen ad" kartı (`TextField` + "Kaydet"); ad `profiles.display_name` alanından okunur/yazılır (şema değişikliği yok).
  Yol Haritam başlığında "Merhaba, <ad>" gösterilir (ad yoksa hiç çizilmez). Okuma ortak `use-display-name` hook'unda.
- Kaydetme: yükleniyor durumu, kırpılmış ad, Türkçe başarı/hata Banner'ı (`Banner` yeni `success` tonu).
- Seçilen yorumlar: ad silinemez (boş kayıt engellenir); 40 karakter sınırı yalnız uygulamada (veritabanı kısıtı yok);
  değişmemişken "Kaydet" pasif. Not: `ScreenHeader` minimum yüksekliği 64 -> 72 oldu (tüm sekme başlıkları 8 pt uzadı).

### QA-01 · Uygulama geneli hata taraması ve düzeltmeleri (proje sahibinin doğrudan isteği)
- Çevrimdışıyken "haritan yok" yerine "yüklenemedi + Tekrar dene" (Yol Haritam, Profil, Gelişmeler, Ayarlar); konu ekranında sonsuz iskelet giderildi.
- XP/günün görevi: hesap değişince sıfırlama, 1000 satır sınırı, eşzamanlı tazeleme, tamamlanamayan görev; konu/plan kişiselleştirmesi iki ekranda aynı.
- Edge Function (deploy bekliyor): topic-assist önbellek zehirlenmesi ve kota yarışı; personalize-roadmap gerçek kullanıcı doğrulaması.

### Y-09 · "Gelişmeler" sekmesi: haber akışı 🗄️
- Migration: `news_sources` (id, name, url, rss_url, topic_paths text[]) ve `news_items`
  (id, source_id, title, summary, url, published_at, topic_paths text[]); RLS: herkes okuyabilir, kimse yazamaz
  (yazma sadece sunucu tarafında).
- Teknoloji kategorisi için 10-15 güvenilir RSS kaynağı (resmi bloglar) seed migration olarak.
- Kabul: Telif kuralı: sadece başlık, kısa özet ve link saklanır.
- ✅ 18 resmi kaynak (seed), `fetch-news` Edge Function (RSS/Atom ayrıştırma), pg_cron ile yarım saatte bir sunucuda çekim,
  Gelişmeler ekranı (harita filtre çipleri, haber kartı, aşağı çekip yenileme, boş/hata/yükleniyor durumları).
- Proje sahibinin açık izniyle migration canlıya uygulandı ve fonksiyon deploy edildi (ilk çekim: 18 kaynak, 175 haber).

### Y-11 · Gelişmeler: haberler Türkçe (proje sahibinin doğrudan isteği) 🗄️
- `fetch-news` yeni haberlerin başlık ve kısa özetini yapay zekâyla (Groq) Türkçeye çevirir (`title_tr`, `summary_tr`); her çalıştırmada en çok 30 haber, eskiler sırayla tamamlanır.
- Ekran Türkçesi varsa onu, yoksa orijinali gösterir. Yalnız kısa parçalar çevrilir (telif: tam metin yok).

### Y-12 · Sosyal katman: haftalık lig, çalışma arkadaşı, proje vitrini (proje sahibinin doğrudan isteği) 🗄️
- Yeni "Topluluk" sekmesi (Lig | Arkadaşlar | Vitrin) ve benzersiz kullanıcı adı (`profiles.username`).
- Haftalık lig: aynı haritayı takip edenler arasında bu haftaki XP sıralaması (`league_week`).
- Çalışma arkadaşı: kullanıcı adıyla istek, kabul/ret, arkadaşın serisi ve bugünkü çalışması; Yol Haritam'da "Arkadaşların bugün" kartı.
- Proje vitrini: GitHub linkiyle proje paylaşma, haritaya göre süzme, bildir/sil; konu ekranında "Projeni vitrine ekle".
- XP bütünlüğü: `xp_events_guard` tetikleyicisi (sabit tutarlar, sahiplik, sıra, günlük tavanlar) — lig adil olsun.

### SEC-01 · Güvenlik denetimi ve sıkılaştırma 🗄️
- Veritabanı: zaman damgalarını sunucu basar, harita/vitrin/bildirim/arkadaş isteği sınırları, `personalize_requests` kota tablosu (migration canlıya uygulandı).
- Edge Function'lar: `personalize-roadmap` günlük kota (10), `topic-assist` kota yarışı ve önbellek ezme düzeltmesi, `fetch-news` çeviri yalnız cron'da + ham hata mesajı saklanmaz, `generate-roadmap` kapatıldı (410).
- Uygulama: `https` dışı linkler açılmaz (`open-url.ts`), şifre alt sınırı her yerde 8, hesap silmede şifre doğrulaması, yeni sunucu sınırları için Türkçe mesajlar.

## Öneriler (ekipten)

Sıraya konmadı; önceliği proje sahibi verir.

- **Özel yuvarlak font (Nunito)** (tasarım yenilemesinden): Android'de başlıklar düz Roboto; `@expo-google-fonts/nunito` (yalnız JS, Expo Go uyumlu) ile oyunsu tipografi. Yeni bağımlılık + splash'te font yükleme gerektirir.
- **Ağ hatası ile "kayıt yok" ayrımı**: `useLatestRoadmap` hata durumunu döndürmeli, ekranlar "Yüklenemedi, tekrar dene" göstermeli (Y-07 ile birlikte).
- **Ortak `TopicCard` bileşeni**: Yol Haritam ve Profil'deki konu kartları benzer stil taşıyor.
- **Şablon kalıntılarını temizle**: kullanılmayan `external-link.tsx`, `hint-row.tsx`, `AnimatedIcon`, `assets/images/tabIcons/*`; açılış ekranı (`AnimatedSplashOverlay`) hâlâ Expo logosu.
- **Alt kategori ikonları**: alt kategori listesinde tüm kartlar kategorinin emojisini taşıyor; alt kategoriye özel emoji eklenebilir.
- **Okuma hatasında "Tekrar dene" ve kısa zaman aşımı** (Y-02'den): supabase-js GET isteklerini birkaç kez yeniden denediği için "Adın yüklenemedi" uyarısı ~7 sn sonra çıkıyor (Y-07 ile birlikte ele alınabilir).
- **Pasif buton kontrastı** (Y-02'den): `Button` pasifken etiket koyu modda zor seçiliyor; disabled etiket rengi `textSecondary`'ye yaklaştırılabilir.
- **Selamlamayı belirginleştirme** (Y-02'den): "Merhaba, <ad>" eyebrow'u küçük ve silik; tema renkleriyle bir kademe daha belirgin yapılabilir.
- **XP'yi sunucuda hesaplamak** (QA-01'den): XP satırları istemciden yazılıyor (300'e kadar); lig/sıralama gelmeden önce RPC ile sunucuya taşınmalı. Toplam da RPC ile hesaplanabilir.
- **Aynı haritanın iki kez eklenmesini engelleme** (QA-01'den): `roadmaps(user_id, topic_path)` benzersiz kısıtı + upsert (önce kopyaları temizleyen migration).
- **topic-assist önbellek anahtarına özet (hash)** (QA-01'den): şimdilik içerik `_src` ile doğrulanıyor; kalıcı çözüm anahtara hash eklemek (migration).
- **pg_net/cron kayıt temizliği** (Y-09'dan): `net._http_response` ve `cron.job_run_details` zamanla büyür; haftalık temizlik işi eklenebilir.
- **Push bildirimi** (Y-12'den): "Ahmet bugün 2 konu bitirdi" şimdilik uygulama içi kart; gerçek bildirim için development build + expo-notifications gerekir (Expo Go'da yok).
- **Kullanıcı adı denetimi ve hız sınırı** (Y-12'den): küfür filtresi, `username_available`/`friend_request` için hız sınırı.
- **XP'yi tamamen sunucuya taşımak** (Y-12'den): tetikleyici hileyi büyük ölçüde engelliyor ama sunucu harita içeriğini bilmiyor; aynı haritayı ikinci kez ekleyip konuları yeniden bitirmek günlük tavana kadar puan getirir.
- **Kullanıcı adı taraması için hız sınırı / CAPTCHA** (SEC-01'den): `username_available` anon çağrılabiliyor; kullanıcı adları toplu taranabilir.
- **Web için Content-Security-Policy** (SEC-01'den): web yayınında başlık olarak eklenmeli.
- **XP'yi tamamen sunucuya taşımak (quiz/ask kanıtı)** (SEC-01'den): quiz ve soru-cevap XP'si için sunucu tarafında yapıldığının kanıtı (Edge Function sonucu) aranmalı.
- **pg_net uzantısını `extensions` şemasına taşımak** (SEC-01'den): Supabase uyarısı; silip yeniden kurmayı gerektirdiği için ertelendi.

## Yayından sonra
- [ ] **Yapay zekâ katmanı ücretli abonelik (freemium):** kişisel işaretleme (`src/lib/personalize-roadmap.ts` → `personalize-roadmap` Edge Function) abonelere açık olsun; ücretsiz kullanıcılar kural tabanlı işaretlemeyi görür. Mağaza içi satın alma (RevenueCat vb.) + sunucu tarafında abonelik kontrolü.
- [ ] **Yeni yol haritaları:** React, TypeScript, Node.js, Docker, Kubernetes, Veri Bilimci, Sistem Tasarımı… (aynı veri yapısıyla, `src/constants/dev-roadmaps/`).
- [ ] **Konuya "Yapay zekâya sor" butonu:** konu detayında soru sorma (ücretli katmana aday).
