# Yol Haritam — Görev Listesi (Backlog)

Ajanlar "Sıradaki" bölümündeki en üstteki başlamamış görevi alır (bkz. AGENTS.md).
Önceliği proje sahibi belirler: sırayı değiştirmek için görevleri yukarı/aşağı taşı.

## Sıradaki

> **Aktif plan: Play'e çıkış hazırlığı** (13 Kasım). PL-01 … PL-05 birbirinden bağımsız, paralel yürür.

### PL-02 · Çökme takibi (Sentry)
- `@sentry/react-native` (`npx expo install`), DSN `EXPO_PUBLIC_SENTRY_DSN` ortam değişkeninden; boşsa tamamen kapalı.
- Expo Go'da uygulama bozulmamalı. Kişisel veri gönderilmez (e-posta, kullanıcı adı yok; yalnız anonim kullanıcı kimliği değil, hiç kimlik yok).
- Gizlilik politikası ve YAYIN.md veri güvenliği bölümü güncellenir; kurulum adımları `docs/SENTRY.md`.

### PL-03 · XP'yi sunucuya taşımak 🗄️
- İstemci `xp_events` tablosuna doğrudan yazamasın; XP miktarını sunucu belirlesin (RPC / Edge Function).
- Quiz ve "sor" XP'si yalnız Edge Function gerçekten çalıştıysa verilsin. Aynı haritayı ikinci kez ekleyip puan toplama kapansın (`roadmaps(user_id, topic_path)` benzersiz).
- Mevcut XP toplamları ve lig bozulmaz.

### PL-04 · Kullanıcı adı filtresi 🗄️
- Uygunsuz kelime içeren kullanıcı adı kayıtta ve değiştirmede reddedilir (sunucuda zorunlu, istemcide anlaşılır mesaj).
- Var olan `banned_words` listesi kullanılır; ayrıca ayrılmış adlar (admin, yolharitam, destek…).
- `username_available` için hız sınırı.


> **Plan tamamlandı:** `docs/plan/TASARIM-MUREKKEP.md` — yeni görünüm (B düzeni + Mürekkep & mercan paleti). TS-01 … TS-04 tamamlandı (PR'lar açıldı); son kabul raporu: `docs/plan/TS-04-kabul-raporu.md`. Hiçbir özellik kaldırılmadı (envanter: `docs/plan/SADELIK-VE-MISAFIR.md` bölüm 5).


### MAĞAZA-01 · Şifremi unuttum akışı
- Giriş ekranında "Şifremi unuttum": e-postaya sıfırlama kodu/bağlantısı. Özel SMTP bağlandıktan sonra
  (OTP-01 ile birlikte) e-posta şablonuna kod eklenerek uygulama içinde tamamlanmalı.

### MAĞAZA-02 · Vitrin bildirimlerine operasyon yolu
- Yeni bildirim gelince geliştiriciye e-posta/uyarı (ör. Supabase webhook + e-posta servisi) ve bildirim sebebi seçimi
  (spam / zararlı / telif). Şimdilik 3 bildirimde otomatik gizleme var.



## Beklemede (sırada değil)

### OTP-01 · E-postaya gelen kodla doğrulama (PR #4)
- Özel SMTP (ör. Brevo) bağlanıp "Confirm signup" şablonuna `{{ .Token }}` eklenene kadar bekliyor.
- Bu PR "2 açık ajan PR'ı" sınırına SAYILMAZ.

## Tamamlanan (PR açıldı)

### PL-01 · Hata, boş ve yükleniyor durumları (Y-07'nin yerini alır)
- Veri çeken her ekranda ağ hatası "kayıt yok" gibi görünmemeli: Türkçe, ne yapılacağını söyleyen mesaj + "Tekrar dene".
- `useLatestRoadmap` ve diğer veri kancaları hata durumunu döndürsün; tek ortak hata bileşeni.
- Yükleniyor durumlarında yerleşimi zıplatmayan iskelet; okuma hatası ~7 sn yerine kısa sürede görünsün.
✅ Ortak `LoadError` bileşeni (ekran/satır içi), tüm veri ekranlarında hata dalı, okuma zaman aşımı 4 sn (yazma 15 sn), supabase-js otomatik yeniden denemesi kapatıldı, harita geçişi başarısızlığında bildirim, Haritalarım ve Yol Haritam konu listesi için iskelet.

### PL-05 · Sayaç tutarlılığı
- Ayarlar › Haritalarım "8 / 43" (tüm harita) ile Yol Haritam "6/31" (plan) aynı tanımla saysın: plan. Tek ortak yardımcı fonksiyon.
- ✅ Tek tanım "plan": `src/lib/plan-progress.ts` (`planProgress`, `sectionProgress`, `personalizationOf`, `roadmapPlanTopics`; sayma `computeProgress` ile aynı kural, kopya yok). Kullananlar: Yol Haritam (kişiselleştirme + bölüm sayaçları liste/ağaç), Ayarlar › Haritalarım (ek istek yok: seviye/kişiselleştirme zaten `roadmaps` satırında, yalnız `topic_progress` sorgusu artık tüm durumları okur), Konu ekranı kutlama yüzdesi, rozet hesabı (`achievements.ts`; artık kişisel işaretleri de sayar). Doğrulama: node betiğiyle 8 senaryo, web 390 px açık/koyu taklit veriyle iki ekran "4/25" ve "4 / 25" gösterdi.

### TS-04 · Son kabul (yeni görünüm)
- Tüm ekranlar açık/koyu × 390/320 px; kontrast ≥ 4.5:1; konsol hatası yok; envanter tekrar denetlenir; kalan "yapay zekâ" izleri (simge kutusu, gereksiz alt yazı, ✨, 3D kenar) temizlenir.
- ✅ Son kabul: 33 ekran/durum × 390/320 px × açık/koyu (132 görüntü) `pageerror` ve "Surface içinde Surface" uyarısı olmadan geçti; envanter 46/46 madde yeni görünümde ✅ (çoğu web + taklit veriyle, birkaç alt parça kodla). Kontrast: 3 çift 4.5:1 altındaydı, `theme.ts`'te düzeltildi (açık `markerInk` `#B73A17`, açık `onMarker` `#1C1B1F`); tüm metin/zemin çiftleri ≥ 4.5:1. Düzeltilenler: karşılama üstüne tek renkli patika çizimi (`TrailMark`), 5 haritanın `accent`/`marker` hue'su soluk ailelere taşındı (`MapHue` tipi artık bunu zorunlu kılar), bölüm notları nötr yazı, ağaç görünümü bölüm sayaçları plana göre (liste ile aynı), konu durum düğmesi 320 px'te "Çalışıyorum" kırpılması, kutlama penceresinde kart içinde kart, onboarding "Değiştir" satırı 320 px dikey boşluk, Projeni paylaş 320 px kenar boşluğu, boş kullanıcı adı ipucu satırları, harita menüsü ve önizleme başlığında tekrar eden metin; kullanılmayan `IconTile`, `RouteSteps`, `StatusChip`, `ProgressSummary` bileşeni, `useShadow`/`Shadow`, `QUESTIONS[].subtitle`, ✨ eşlemesi silindi. Splash/adaptive-icon arka planı `#1C1B1F` (`app.json` değişti: yeni APK'da görünür). Rapor: `docs/plan/TS-04-kabul-raporu.md`.

### TS-02 · Ana akış ekranları (Yol Haritam, Konu, Keşfet, Harita önizleme)
- Plan bölüm 7'deki tarif + metin diyeti (bölüm 6). Ağaç görünümü (`roadmap-tree`) yeni renklere uyar.
- Kabul: tarifteki yerleşim; gereksiz açıklama satırı yok; envanterin ilgili maddeleri çalışıyor.

- ✅ Yol Haritam: altı çizili harita sekmeleri (hue noktası + kısa ad + "+ Ekle"), "Şimdi" kartı (mercan noktalı etiket, mürekkep "Konuya devam et", çizgili "Günün görevi" satırı), kutusuz 3 istatistik (ayrıntı dokununca), "Ağaç/Liste görünümü" tek bağlantı-geçiş, çizgili bölüm satırları + 4px çubuk + noktalı konu satırları; ağaç düğümleri düz 1px, bölüm başlıkları nötr, ✨ yerine mercan nokta. Konu: geri bağlantısı, durum seçici açıklamasız, çizgili Kaynaklar, altı çizili yapay zekâ sekmeleri (panel alt yazıları yok), "Sonraki konu" en altta çizgili satır (konu Bitti ise birincil düğme). Keşfet/katalog: dolgulu arama alanı, "Roller · 14 / Beceriler · 18", tek satır tagline + "N konu". Harita önizleme: çizgili bölüm satırları + tek birincil düğme. Ortak bileşenlere yalnız ekleme: `ProgressBar`, `StatusDot`, `Segmented fullRule`, `SectionHeader` action `underline`, `ListRow subtitleEllipsize`.

### TS-01 · Temel: renkler, yazı tipleri, ortak bileşenler
- `theme.ts` renk jetonları plan bölüm 3'teki tabloya göre (açık + koyu); `Radius` küçülür; 3D `Edge` hiçbir yerde çizilmez.
- Bricolage Grotesque + Figtree (`npx expo install @expo-google-fonts/bricolage-grotesque @expo-google-fonts/figtree`), kök `_layout.tsx`'te yüklenir; `ThemedText` türleri ve `Fonts` yeni ailelere eşlenir.
- Ortak bileşenler yeni dile geçer: `Button` (düz dolgu), `Surface`, `ListRow` (kutulu simge yok), `ScreenHeader` (simge kutusu yok), `SectionHeader` (alt yazı yok), `Segmented` → altı çizili sekme, `OptionCard`, `FilterChipRow`, rozetler, `IconTile` kullanımı kaldırılır.
- `AGENTS.md`: "Sadelik kuralları"na plan bölüm 5–6 (biçim + metin kuralları) eklenir.
- Kabul: tsc + lint temiz; uygulama açık/koyu temada açılıyor; hiçbir ekranda 3D kenar ve simge kutusu kalmadı.
- ✅ Mürekkep+mercan renk jetonları (açık/koyu), Bricolage Grotesque + Figtree (`useFonts`, `ThemedText`/`Fonts` yeni ailelerde), `Radius` küçüldü, 3D `Edge` kaldırıldı; `Button`, `Surface`, `ListRow` (kutusuz simge / `dot`), `ScreenHeader`, `SectionHeader` (alt yazısız), `Segmented` (altı çizili + `variant="buttons"`), `OptionCard`, `FilterChipRow`, rozetler ve sekme çubuğu düz yeni dile geçti.

### TS-03 · Diğer ekranlar
- Gelişmeler, Topluluk (+vitrin paylaş), Profil, Başarımlar, Ayarlar + 5 alt sayfa, Karşılama, Giriş/Kayıt, Onboarding: aynı dil + metin diyeti.
- Kabul: tarifteki dil; gereksiz açıklama satırı yok; envanterin ilgili maddeleri çalışıyor.
- ✅ Gelişmeler/Topluluk/Vitrin filtreleri altı çizili sekme (`FilterChipRow variant="tabs"`, hue noktası), haber ve vitrin satırları çizgili liste, boş durumlar simgesiz tek cümle; Profil (üye + misafir) tek mürekkep buton, ince halkalı `Avatar` + sade rozet, Başarımlar sade rozetli satırlar + "N / M" sayısı (`SectionHeader count`); Ayarlar satır alt yazıları ve tanıtım cümleleri kalktı; Karşılama yalnız büyük başlık + tek cümle + iki buton; Giriş/Kayıt renkli sahne ve patikasız; Onboarding soru ekranı kutusuz bağlam satırı, hazırlanıyor/kutlama/hata ekranlarında simge kutusu ve gökkuşağı konfeti yok. Mantık ve veri akışı değişmedi.

### SM-08 · Son kabul (ürün sorumlusu + testçi + tasarımcı)
- Plan bölüm 5'teki **özellik envanterinin her maddesi** tek tek denenir; tablo halinde PR'a eklenir (✅/❌ + ekran görüntüsü).
- Misafir akışı uçtan uca: aç → gez → harita seç → kayıt → onay → giriş → seviye adımı → harita hazır.
- Tüm ekranlar açık/koyu, 390/320 px; konsolda hata yok; tasarımcı sadelik ilkelerine göre denetler.
- Eksik/bozuk bulunan her şey aynı PR'da düzeltilir ya da yeni görev olarak eklenir.
- ✅ Son kabul tamamlandı: envanter 49/49 ✅ (web + taklit veri), misafir akışı uçtan uca 54/54 geçti, 116 ekran görüntüsü (390/320 px × açık/koyu) `pageerror` ve "Surface içinde Surface" uyarısı olmadan geçti. Düzeltilenler: Yol Haritam başlığı (320 px tek satır) ve özet istatistik satırı (tek satır), 320 px sekme etiketleri, Keşfet/Harita ekle kataloğu `ListRow` listesi, Başarımlar düz kartlar, Haritalarım "Aç" sessiz düğme, Giriş/Kayıt `Segmented`, Lig/Vitrin/destek e-postası kırpılmaları, "Projeni paylaş" web geri düğmesi. Rapor: `docs/plan/SM-08-kabul-raporu.md`.

### SM-04 · Yol Haritam sadeleştirme
- Üstten aşağı hedef düzen: başlık (selam + harita değiştirici tek satır) → **tek birincil kart "Şimdi"**
  (Sıradaki konu; günün görevi aynı konuysa rozet olarak, farklıysa kartın altında ikinci satır) → düz özet
  satırı (ilerleme çubuğu + seri + XP + haftalık hedef; dokununca ayrıntı alt sayfası) → "Harita" bölümü
  (SectionHeader + Segmented ağaç/liste) → bölümler.
- Yolculuk kartı ayrı bir kart olmaktan çıkar: harita adı/kimliği başlığa, "Planımı güncelle" ve harita
  ayarları başlıktaki "…" menüsüne ya da Ayarlar › Haritalarım'a taşınır.
- Bölüm kartları: kart içinde kart yok; bölüm başlığı + ayırıcılı konu satırları (`ListRow`).
- Kişisel not ve kullanıcı adı kartları en fazla bir satır bilgi şeridi.
- Kabul: ilk ekranda en fazla 1 birincil (3D) öğe; iç içe kenarlıklı kutu yok; envanterdeki Haritalar ve
  İlerleme maddelerinin hepsine hâlâ ulaşılıyor; önce/sonra görüntüler.
- ✅ Yol Haritam (oturumlu) sadeleştirildi: tek birincil "Şimdi" kartı (sıradaki konu + günün görevi rozet/ikinci satır/onay), düz özet satırı (ilerleme, seri, XP, haftalık hedef; dokununca ayrıntı), "Harita" bölümü (Ağaç/Liste `Segmented`; liste `ListGroup`/`ListRow`), Yolculuk kartı kalktı (kimlik + "Planımı güncelle" + "Harita ayarları" başlıktaki "…" menüsünde), kullanıcı adı tek satırlık şerit.

### SM-06 · Profil ve Ayarlar sadeleştirme
- **Profil:** kimlik (avatar, @kullanıcı adı) → düz seviye/XP satırı → rozetler (yatay şerit, "Tümü" ile tam liste)
  → ListRow'lar: Haritalarım, Ayarlar. Ayrı kartlar azaltılır.
- **Ayarlar** alt sayfalara: `settings/index` (ListRow listesi) → `settings/maps`, `settings/appearance`,
  `settings/account` (kullanıcı adı, şifre, çıkış, en altta hesap silme), `settings/blocked`, `settings/about`
  (sürüm, yapay zekâ notu, gizlilik, koşullar, destek). Mevcut bileşenler taşınır, mantık değişmez.
- Kabul: envanterdeki Hesap ve Ayarlar maddelerinin hepsi alt sayfalarda; hesap silme akışı aynen çalışıyor;
  geri gezinme web ve native'de doğru.
- ✅ Ayarlar `settings/` klasörüne bölündü (liste + Haritalarım, Görünüm, Hesap ve güvenlik, Engellenenler, Hakkında); Profil kimlik → düz seviye → başarım şeridi ("Tümü" → `/achievements`) → Haritalarım/Ayarlar listesi. Mantık aynı, yalnız düzen.

### SM-05 · Konu ekranı sadeleştirme
- Düzen: başlık alanı (harita · bölüm, konu adı, tek satır meta: seviye · süre · işaret; çerçevesiz) → durum
  `Segmented` (birincil) → "Sonraki konu" → **Kaynaklar** (ListRow listesi) → **Yapay zekâ** bölümü: üç sekmeli
  tek alan (Alt konular / Quiz / Soru sor) — üç ayrı kutu yerine tek kutu, sekmeyle içerik değişir.
- Kişisel odak/atla bilgisi başlığın altında tek satır rozet; ayrı kutu değil.
- Kısayol çipleri kaldırılabilir (yapay zekâ alanı artık tek ve görünür), ama "aşağı kaydırmadan bulunabilir"
  şartı korunur.
- Kabul: kart içinde kart yok; XP/kutlama/ilerleme davranışı aynı; misafir sürümü (SM-03) bozulmadı.
- ✅ Konu ekranı: çerçevesiz başlık + tek satır meta, tek satır kişisel işaret, `Segmented` durum seçici (birincil), Kaynaklar `ListGroup`, tek alanlı 3 sekmeli "Yapay zekâ ile çalış" (kısayol çipleri kaldırıldı); `Segmented`'e `allowDeselect` eklendi; salt okunur görünüm korundu.

### SM-07 · Topluluk ve Gelişmeler sadeleştirme
- Topluluk: `Segmented` (Lig · Arkadaşlar · Vitrin) → her sekmede tek liste. Lig ve arkadaş satırları `ListRow`;
  onay kutuları satırın içinde değil alt sayfada/diyalogda. Vitrin kartlarında eylemler (Bildir, Engelle, Sil)
  "…" menüsüne toplanır; kartta yalnız başlık, açıklama, sahibi ve bağlantılar.
- Gelişmeler: haber kartları düz liste (başlık, kaynak · zaman, kısa özet); filtre çipleri tek satır yatay kaydırma.
- Kabul: envanterdeki Topluluk ve Gelişmeler maddelerinin hepsi çalışıyor; kart içinde kart yok.
- ✅ Özet: Topluluk üç sekmede tek düz liste (Lig/Arkadaşlar `ListGroup`+`ListRow`, Vitrin düz `Surface`); satır eylemleri "…" ile alttan sayfa (`RowMenu`, onay sayfada); çipler tek satır (`FilterChipRow`); Gelişmeler düz haber listesi. Kullanıcı adı kapısı kutusuz. Yeni paket yok.

### SM-01 · Ortak sade bileşenler ve kurallar
- Yeni bileşenler (`src/components/`):
  - `Surface`: tek seviye kart. `tone` (düz/hafif/birincil); yalnız `primary` 3D alt kenarlı. İç içe kullanılırsa
    geliştirmede uyarı versin (context ile).
  - `ListRow`: simge (Glyph veya IconTile 40) + başlık + alt satır + sağda ok/eylem/rozet; ayırıcılı liste; 44 pt+.
  - `SectionHeader`: bölüm başlığı + isteğe bağlı sağ bağlantı ("Tümü", "Düzenle").
  - `Segmented`: tek tip segment kontrolü (bugün Topluluk, ViewSwitch, Ayarlar Choice ve konu durumu ayrı ayrı yazılmış).
- Mevcut tekrarlar bunlara taşınır, görünüm değişikliği bu PR'da sınırlı kalır (asıl ekran işleri SM-04…07).
- AGENTS.md "Ortak bileşenler" listesine ekle ve sadelik ilkelerini (plan bölüm 3) kısa madde olarak yaz.
- Kabul: tsc + lint temiz; dört bileşenin açık/koyu ekran görüntüsü; en az 3 ekranda tekrar eden kod bu bileşenlere geçti.
- ✅ `Surface`, `ListRow`/`ListGroup`, `SectionHeader`, `Segmented` eklendi; Harita görünüm anahtarı, Topluluk segmenti ve Ayarlar seçicisi `Segmented`'e taşındı.

### SM-02 · Misafir modu altyapısı 🗄️
- `src/app/_layout.tsx`: `(tabs)`, `topic/[id]` ve keşif/önizleme ekranları oturumsuz da açılabilsin. Korumalı kalanlar:
  `roadmap-questions`, `settings` (alt sayfalarıyla), `showcase-new`. `login` hem oturumsuzken açık kalsın.
- `src/lib/auth-gate.ts` + `useAuthGate()`:
  `requireAuth(intent, reason)` → oturum varsa `true`; yoksa login'i `mode=signup` ve `reason` ile açar, niyeti
  AsyncStorage'a yazar (`yolharitam.pending-intent.v1`).
  Niyet tipleri: `pick-map {mapId}`, `open-topic {mapId, topicId}`, `community {tab}`.
- Girişten sonra (auth-context'te oturum oluşunca) bekleyen niyet okunur, tek seferlik uygulanır ve silinir:
  `pick-map` → `/onboarding?map=…` (seviye adımı), `open-topic` → konu ekranı, `community` → Topluluk.
- `login.tsx`: üstte `reason` satırı ("Frontend haritasını kaydetmek için ücretsiz hesap oluştur"); "Şimdilik gez" ile kapat.
- Karşılama (`index.tsx`): birincil "Gezinmeye başla" → sekmeler (misafir), ikincil "Giriş yap". Gördü bilgisi
  cihazda saklanır (bir kez gösterilir; çıkış yapınca yeniden gösterilebilir).
- Migration: `news_items` ve `news_sources` için `anon` SELECT politikası ve grant (yalnız okuma). `database.types.ts` değişmez.
- Kabul: oturumsuz açılışta formsuz gezilebiliyor; "Bu haritayı seç" → kayıt → (onay sonrası) ilk girişte seviye
  adımına düşüyor; niyet bir kez uygulanıyor; oturumlu kullanıcının akışı bozulmadı; ağ hatasında yönlendirme döngüsü yok.

### Y-03 · Harita seçiminde arama
- Onboarding'deki harita listesinin üstünde arama kutusu: harita ve konu başlıklarında arasın
  (Türkçe karakterlere duyarsız: ı/i, ş/s…); sonuca basınca o harita seçilsin.
- Kabul: Arama boşken mevcut seçim akışı aynen çalışır.
- ✅ Harita seçiminde arama (ad, açıklama, konu başlıkları; Türkçe karakter duyarsız).

### UX-07 · Kurulum hatası ekranı ve isteğe bağlı kullanıcı adı (UX-01'den)
- `.env.local` yokken beyaz ekran yerine anlamlı hata (`src/lib/supabase.ts`).
- Kayıtta kullanıcı adını isteğe bağlı yapıp ilk girişte sormak (veritabanı `handle_new_user` etkilenir, 🗄️ olabilir).
- ✅ Supabase değerleri config.ts'te varsayılan (beyaz ekran yok); kullanıcı adı kayıtta kalıyor (tek ad kararı).

### UX-04 · Giriş formunda klavye akışı (UX-01'den)
- Alanlar arası `returnKeyType="next"` ile odak geçişi (`ref` zinciri), son alanda "go" formu gönderir.
- ✅ İçerik genişletme PR'ında yapıldı.

### UX-03 · Sorularda tek dokunuş (UX-01'den)
- roadmap-questions'ta seçeneğe basınca kısa gecikmeyle sonraki soruya geç; son soruda "Haritamı hazırla" onayı kalsın.
- Ekran okuyucu ve yanlış dokunmayı geri alma (üstteki geri) test edilmeli.
- ✅ İçerik genişletme PR'ında yapıldı.

### UX-02 · Kayıttan sonra doğrudan harita seçimi (UX-01'den)
- Hiç haritası olmayan yeni kullanıcı Yol Haritam'a düşünce harita seçimi bir kez otomatik açılsın (boş durum ekranı atlanır).
- Döngü olmasın: "bu oturumda bir kez" bayrağı; okuma hatasında (ağ) yönlendirme yapılmaz, yalnız "kayıt yok" durumunda.
- ✅ İçerik genişletme PR'ında yapıldı.

### UX-05 · Yol Haritam ve konu ekranını sadeleştirme (UX-01'den)
- Momentum + Arkadaşlar kartları tek şeritte (seri, seviye/XP, haftalık hedef; dokununca ayrıntı + arkadaşlar). JourneyCard ile ProgressSummary birleşti (konu sayısı/süre tek yerde).
- Konu ekranında 3 durum kartı yerine kompakt 3'lü seçici (radio rolü, 44 pt). Davranış değişmedi.

### UX-06 · Yapay zekâ araçları ve plan güncellemenin bulunurluğu (UX-01'den)
- Konu ekranında durumun altında "Alt konular / Quiz çöz / Yapay zekâya sor" kısayolları (ilgili bloğa kaydırır).
- "Planımı güncelle" Yolculuk kartının içinde ikincil düğme (aynı `/roadmap-questions` bağlantısı).

### UX-01 · Kullanılabilirlik denetimi ve en etkili iyileştirmeler
- Denetim (ürün sorumlusu + tasarımcı) sonrası 5 iyileştirme: Yol Haritam'da "Günün görevi / Sıradaki konu" en üstte (aynı konuysa tek kart);
  konu ekranında kaynaklar dokununca tarayıcıda aranır; "Sonraki konu" durum seçiminin hemen altında; karşılamadan kayıt/giriş ayrı düğmeler;
  Profil başlığında Ayarlar dişlisi ve Ayarlar > Haritalarım'da "Harita ekle". Ek: 44 pt dokunma alanları, arayüzdeki emojiler simgeye çevrildi.
- Sonraya bırakılanlar: UX-02..UX-07 (Sıradaki bölümünde). Ders notu: `docs/dersler/UX-01.md`.

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

### SM-03 · Misafir ekranları: Keşfet, harita önizleme, salt okunur konu
- **Keşfet** (misafirde "Yol Haritam" sekmesinin yerine, adı "Keşfet"): onboarding'deki katalog + arama bileşen
  olarak ayrıştırılır (`RoadmapCatalog`), hem burada hem "Harita ekle"de kullanılır.
- **Harita önizleme** (yeni rota `map/[id]`): başlık, kısa açıklama, bölüm/konu sayısı, toplam süre; bölümler
  açılır liste ya da ağaç (salt okunur, `RoadmapTree` yeniden kullanılır); altta tek birincil düğme
  "Bu haritayı seç" (misafirde kayıt kapısı, oturumluda seviye adımı).
- **Konu (salt okunur):** özet, seviye/süre, kaynaklar misafire açık. Durum seçici ve yapay zekâ blokları yerine
  tek satır: "İlerlemeni kaydetmek ve yapay zekâyı kullanmak için ücretsiz hesap oluştur" + düğme (kayıt kapısı,
  niyet `open-topic`).
- **Topluluk (misafir):** kısa tanıtım (lig, arkadaşlar, vitrin ne işe yarar) + "Katılmak için kayıt ol". RPC çağrılmaz.
- **Profil (misafir):** "Hesap oluştur / Giriş yap" kartı; Görünüm (tema) ve Hakkında/yasal bağlantıları.
- **Gelişmeler:** misafirde de çalışır (filtre: tüm haritalar).
- Kabul: misafir dört sekmede de hata/iskelet takılması görmeden geziyor; hiçbir ekranda RLS hatası yok;
  32 haritanın önizlemesi açılıyor; açık/koyu, 320 px görüntüler.
- ✅ `RoadmapCatalog` ayrıştırıldı; misafirde Keşfet sekmesi, herkese açık `map/[id]` önizleme, salt okunur konu (misafir ve haritayı takip etmeyen kullanıcı), sade Topluluk tanıtımı ve Profil (hesap kartı + tema + yasal) eklendi; karşılama durakları güncellendi; `GuestPrompt` silindi.


## Öneriler (ekipten)
- `useActivity` hata durumunu döndürmüyor; hatada seri/haftalık hedef kartı sessizce gizleniyor (PL-01 dışı bırakıldı).

Sıraya konmadı; önceliği proje sahibi verir.

- **Hata/yıkıcı eylem için ayrı renk jetonu** (TS-04'ten): hata yazısı, geçersiz alan çerçevesi, "Çıkış yap"/"Engelle" gibi eylemler `coral`/`coralInk` kullanıyor; bu aynı zamanda bir harita rengi (Java, Mobil, Rust…). Küçük noktada karışmıyor ama anlam ayrımı için `danger`/`dangerInk` jetonu eklenmeli (theme.ts + `Button quiet` + `TextField invalid` + `Banner`).
- **Başarım ve lig renkleri** (TS-04'ten): `achievements.ts` bazı rozetlerde `accent`/`marker` hue; Lig'de 1. madalya `markerEdge`, 3. `coralEdge` (koyu temada birbirine yakın). Plan "mercan yalnız durum/XP" dediği için nötr tonlara çekilebilir.
- **Native cihazda görsel doğrulama** (TS-04'ten): kabul yalnız web + taklit veriyle yapıldı. Android/iOS'ta yeni splash/adaptive-icon rengi (yeni APK), Figtree/Bricolage yüklemesi, `adjustsFontSizeToFit` ve "…" menüsünün alt sayfası gerçek cihazda gözle denenmeli. Uygulama simgesi PNG'si (`icon.png`) hâlâ eski teal zemin; yeni palete göre yeniden çizilmeli.
- **Web üst çubuk geri düğmesi** (TS-04'ten): web'de `‹` metin karakteri kalın ve varsayılan yazı tipinde; Lucide `ChevronLeft` ile aynı çizgi kalınlığına getirilebilir (yalnız web, native sistem oku).

- **Sihirbaz seçenek kartları** (SM-08'den): seviye ve 3 soru adımlarında her seçenek 3D `OptionCard`; "tek birincil öğe" ilkesine göre seçenekler düz olup yalnız seçili kart/birincil düğme 3D olabilir (ya da açıklamalı radyo `ListRow`). Tasarım kararı gerektirir.
- **"Sonraki konu: <ad>" düğmesi** (SM-08'den): uzun konu adında etiket iki satıra iniyor (kırpılmıyor ama düğme şişiyor); etiket "Sonraki konu", ad ikinci satır/alt yazı olabilir.
- **"+XP" bildirimi başlığa biniyor** (SM-08'den, web): konu ekranında üst başlık çubuğunun üstüne oturuyor; bildirimin üst payı başlık yüksekliğini hesaba katmalı.
- **Otomatik uçtan uca test** (SM-08'den): bu denetimin Playwright + taklit Supabase betikleri repoda değil; "Surface içinde Surface" uyarısı yalnız geliştirmede çıktığı için bir CI adımı (geliştirme kipinde web) gerekir. Native cihaz (Expo Go) ve gerçek sunucuyla kayıt/e-posta onayı/hesap silme uçtan uca ayrıca denenmeli.
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

- **Erişilebilirlik etiketlerini görünür metinle hizalama** (UX-01'den): "Harita ekle" çipinin etiketi "Yeni harita ekle", Harita/Liste anahtarının etiketi "Harita görünümü"; sesli kontrol için etiket görünür metinle başlamalı.
- **Aynı konuyu açan iki kart** (UX-01'den): günün görevi quiz/bitir türündeyken sıradaki konuyla aynı konuysa iki kart da görünür; birleştirilebilir.
- **Gün değişiminde günün görevi** (UX-01'den): uygulama gece yarısı açık kalırsa görev bayat kalır; `AppState` ile yeniden hesaplanabilir.

## Yayından sonra
- [ ] **Yapay zekâ katmanı ücretli abonelik (freemium):** kişisel işaretleme (`src/lib/personalize-roadmap.ts` → `personalize-roadmap` Edge Function) abonelere açık olsun; ücretsiz kullanıcılar kural tabanlı işaretlemeyi görür. Mağaza içi satın alma (RevenueCat vb.) + sunucu tarafında abonelik kontrolü.
- [ ] **Yeni yol haritaları:** React, TypeScript, Node.js, Docker, Kubernetes, Veri Bilimci, Sistem Tasarımı… (aynı veri yapısıyla, `src/constants/dev-roadmaps/`).
- [ ] **Konuya "Yapay zekâya sor" butonu:** konu detayında soru sorma (ücretli katmana aday).
