# TS-04 · Son kabul raporu (yeni görünüm)

Tarih: 5 Kasım 2026 · Kapsam: `docs/plan/TASARIM-MUREKKEP.md` (B düzeni + Mürekkep ve mercan) ve
`docs/plan/SADELIK-VE-MISAFIR.md` bölüm 5 (özellik envanteri) · Dal: `agent/TS-04-son-kabul`
(taban: `origin/main` 2e3720f, TS-01 … TS-03 birleşik)

## Nasıl denendi

- Web çıktısı (`expo export --platform web --clear`) kaynağın kopyasından alındı. Supabase **taklit**: Playwright
  `https://example.supabase.co/**` isteklerini yakalar ve örnek veriyle yanıtlar; gerçek sunucuya istek atılmadı.
- **Ekran turu:** 33 ekran/durum × 390 ve 320 px × açık ve koyu = 132 görüntü (düzeltmeden önce 31 ekran / 124 görüntü; sonra 33 ekran / 132 görüntü).
  Karşılama, giriş, kayıt, Keşfet, harita önizleme, konu (üye + misafir), Yol Haritam (liste, ağaç, boş durum, "…" menüsü),
  Gelişmeler, Topluluk (3 sekme + satır menüsü + misafir), Projeni paylaş, Profil (üye + misafir), Başarımlar,
  Ayarlar + 5 alt sayfa, onboarding (katalog, seviye, soru, hazırlanıyor), kutlama, "sayfa bulunamadı".
  Her ekranın 390 açık ve 320 koyu hâline gözle bakıldı (çoğunun dört hâline de).
- "Surface içinde Surface" uyarısı yalnız `__DEV__`'de çıktığı için denetim kopyasında `__DEV__ && nested` koşulu
  kaldırıldı (SM-08 yöntemi). **Hiçbir ekranda `pageerror` ya da uyarı çıkmadı** (düzeltme öncesi 124, sonrası 132 görüntü).
  Yatay taşma raporunda yalnız bilerek yatay kaydırılan satırlar çıktı (başarım şeridi, harita filtre sekmeleri).
- Sınır: yalnız web ve taklit veri. Native cihaz ve gerçek sunucu bu raporun dışında (bkz. "Açık kalanlar").

Ekran görüntüleri (repoya konmadı), hepsi `/tmp/claude-0/scratchpad/ts04/shots/` altında
(`<ekran>-<390|320>-<acik|koyu>.png` + `rapor-*.txt`):

| Klasör | İçerik |
|---|---|
| `before/` | Düzeltmeden önce (main) ekran turu |
| `after/` | İlk düzeltme turundan sonra |
| `after2/`, `final/` | Sonraki düzeltmelerden sonra; `final/` = PR'ın son hâli (132 görüntü) |
| `envanter/` | Envanter maddelerinin kanıt görüntüleri (tabloda `E ...`) |

Betikler: `/tmp/claude-0/scratchpad/ts04/` (`tour.js`, `inv3.js`, `inv4.js`, `contrast.js`).

## 1. Ekran turu bulguları

| # | Bulgu | Durum |
|---|---|---|
| 1 | Karşılama üst yarısı tamamen boştu | Düzeltildi: tek renkli patika çizimi (`TrailMark`) |
| 2 | Fullstack (`accent`) ve Siber Güvenlik, AWS, JavaScript, Python (`marker`) haritaları mürekkep/mercan hue'su taşıyordu | Düzeltildi: soluk ailelere taşındı; `MapHue` tipi artık `accent`/`marker`'ı yasaklar |
| 3 | Bölüm notu ("Önce temeli sağlam kur.") ağaçta ve listede mercan renkteydi | Düzeltildi: nötr `textSecondary`. Aynı şekilde konudaki "Biliyorsan atlayabilirsin" ve "Mini alıştırma" kutusu (mercan zemin + kenar) nötre çekildi |
| 4 | Ağaç görünümünde bölüm sayaçları tüm konuları sayıyordu ("HTML 2/5"), liste plana göre ("2/4") | Düzeltildi: ağaç da plana göre sayar |
| 5 | 320 px: konu durum düğmesinde "Çalışıyorum" kırpılıyordu ("Çalışıyoru…") | Düzeltildi: düğme yan boşluğu küçüldü (`Segmented` buttons) |
| 6 | 320 px: onboarding seviye ekranında "Değiştir" satırında iki satırlık ad kenara yapışıyordu | Düzeltildi: `OptionCard compact` dikey boşluk |
| 7 | Kutlama penceresi: kartın içinde ikinci soluk zemin (kart içinde kart) | Düzeltildi: iç zemin kalktı, ilerleme çubuğu `backgroundSelected` |
| 8 | 320 px: Projeni paylaş ekranında kenar boşluğu 24 (diğer ekranlar 16) | Düzeltildi |
| 9 | Harita önizlemede üst çubuk başlığı ile sayfa başlığı aynı ad | Düzeltildi: üst çubuk "Harita" |
| 10 | "…" menüsünde harita açıklaması (tagline) tekrarı | Düzeltildi: kaldırıldı |
| 11 | Kayıt ve Hesap ekranlarında boşken "3-20 karakter: küçük harf…" ipucu satırı | Düzeltildi: kural yalnız yanlış yazılınca söylenir |
| 12 | "Günün görevi tamam!" XP etiketi (🎯 + ünlem) | Düzeltildi: "Günün görevi tamamlandı" |
| 13 | Hazırlanıyor ekranı: patika animasyonu ara karede göründü | Sorun yok: animasyon, 1.6 sn sonra "Yol haritan hazır" |
| 14 | XP bildirimi web'de konu başlığına biniyor | Bilinen (SM-08 önerisi), BACKLOG'da |
| 15 | Hata/yıkıcı eylem rengi `coral` (aynı zamanda harita rengi); Haritalarım sayacı tüm harita, Yol Haritam plan; Lig madalyaları ve iki başarım mercan/mürekkep hue | Büyük/riskli: BACKLOG "Öneriler"e eklendi |

## 2. Kontrast (WCAG 2.1)

Tema jetonlarından `contrast.js` ile hesaplandı: metin/zemin çiftleri için eşik **4.5:1**, çerçeve ve nokta için
**3:1**. Hue noktaları (yanında ad yazılı süs noktaları) eşiksiz, bilgi amaçlı.

**Düzeltmeden önce 3 çift altındaydı** (hepsi açık tema):

| Çift | Önce | Sonra |
|---|---|---|
| `markerInk` / `backgroundElement` | 4.46 | 4.96 (`#C2401C` → `#B73A17`) |
| `markerInk` / `markerSoft` | 4.23 | 4.71 |
| `onMarker` / `marker` | 3.68 (beyaz) | 4.65 (`#FFFFFF` → `#1C1B1F`) |

Düzeltme yalnız `src/constants/theme.ts`; plan tablosu (`TASARIM-MUREKKEP.md`) güncellendi. **Sonuç: 0 başarısız çift.**
Tüm oranlar (düzeltme sonrası):

| Yazı / nesne | Zemin | Eşik | Açık | Koyu |
|---|---|---|---|---|
| text | background | 4.5:1 | 16.16 | 16.42 |
| textSecondary | background | 4.5:1 | 6.20 | 7.37 |
| text | card | 4.5:1 | 17.13 | 14.83 |
| textSecondary | card | 4.5:1 | 6.57 | 6.66 |
| text | backgroundElement | 4.5:1 | 14.70 | 14.83 |
| textSecondary | backgroundElement | 4.5:1 | 5.64 | 6.66 |
| text | backgroundSelected | 4.5:1 | 13.54 | 12.76 |
| textSecondary | backgroundSelected | 4.5:1 | 5.19 | 5.73 |
| markerInk | background | 4.5:1 | 5.46 | 8.00 |
| markerInk | card | 4.5:1 | 5.78 | 7.23 |
| markerInk | backgroundElement | 4.5:1 | 4.96 | 7.23 |
| markerInk | markerSoft | 4.5:1 | 4.71 | 6.54 |
| accentInk | background | 4.5:1 | 16.16 | 16.42 |
| accentInk | card | 4.5:1 | 17.13 | 14.83 |
| accentInk | backgroundElement | 4.5:1 | 14.70 | 14.83 |
| accentInk | accentSoft | 4.5:1 | 14.70 | 14.83 |
| onAccent | accent | 4.5:1 | 17.13 | 16.42 |
| onMarker | marker | 4.5:1 | 4.65 | 6.03 |
| warningInk | warningBackground | 4.5:1 | 7.67 | 9.99 |
| text | markerSoft | 4.5:1 | 13.95 | 13.42 |
| textSecondary | markerSoft | 4.5:1 | 5.35 | 6.02 |
| text | skySoft | 4.5:1 | 14.85 | 14.15 |
| textSecondary | skySoft | 4.5:1 | 5.69 | 6.35 |
| text | coralSoft | 4.5:1 | 14.72 | 14.09 |
| textSecondary | coralSoft | 4.5:1 | 5.64 | 6.33 |
| text | violetSoft | 4.5:1 | 14.64 | 14.35 |
| textSecondary | violetSoft | 4.5:1 | 5.61 | 6.44 |
| text | berrySoft | 4.5:1 | 14.76 | 14.34 |
| textSecondary | berrySoft | 4.5:1 | 5.66 | 6.44 |
| text | leafSoft | 4.5:1 | 15.01 | 14.20 |
| textSecondary | leafSoft | 4.5:1 | 5.76 | 6.38 |
| skyInk | background | 4.5:1 | 7.07 | 10.03 |
| skyInk | card | 4.5:1 | 7.49 | 9.06 |
| skyInk | skySoft | 4.5:1 | 6.49 | 8.65 |
| coralInk | background | 4.5:1 | 6.91 | 10.30 |
| coralInk | card | 4.5:1 | 7.32 | 9.31 |
| coralInk | coralSoft | 4.5:1 | 6.29 | 8.84 |
| violetInk | background | 4.5:1 | 7.40 | 10.19 |
| violetInk | card | 4.5:1 | 7.85 | 9.21 |
| violetInk | violetSoft | 4.5:1 | 6.71 | 8.91 |
| berryInk | background | 4.5:1 | 7.03 | 10.67 |
| berryInk | card | 4.5:1 | 7.45 | 9.64 |
| berryInk | berrySoft | 4.5:1 | 6.42 | 9.32 |
| leafInk | background | 4.5:1 | 6.83 | 10.85 |
| leafInk | card | 4.5:1 | 7.24 | 9.80 |
| leafInk | leafSoft | 4.5:1 | 6.34 | 9.38 |
| borderStrong | background | 3:1 | 4.39 | 4.28 |
| borderStrong | card | 3:1 | 4.65 | 3.87 |
| marker | background | 3:1 | 3.47 | 6.03 |
| marker | card | 3:1 | 3.68 | 5.45 |
| sky | background | — | 2.70 | 6.47 |
| coral | background | — | 2.57 | 6.79 |
| violet | background | — | 2.60 | 6.73 |
| berry | background | — | 2.61 | 6.69 |
| leaf | background | — | 2.49 | 7.02 |

## 3. Özellik envanteri (plan bölüm 5)

Doğrulama: **web** = taklit veriyle web'de denendi (betik çıktıları `/tmp/claude-0/scratchpad/ts04/inv*.log`);
**kod** = web'de tetiklenemedi, kodda doğrulandı. `E ...` = `shots/envanter/` altındaki görüntü.
SM-08'deki 46 maddelik tablo temel alındı; "Yeni yer" sütunu yeni görünümdeki yeri gösterir.

| # | Madde | Yeni yer | Sonuç | Doğrulama · kanıt |
|---|---|---|---|---|
| 1 | Kayıt: benzersiz @kullanıcı adı, canlı müsaitlik, şifre ≥ 8, koşulları kabul | Giriş/Kayıt › "Kayıt ol" sekmesi | ✅ web | H1 · `E H1-kayit-dolu-390-acik.png` |
| 2 | Giriş | Giriş/Kayıt › "Giriş yap"; karşılama düğmesi | ✅ web | H5 (login isteği) · tur: `giris-*` |
| 3 | E-posta onayı bilgisi | Kayıt sonrası bilgi satırı | ✅ web | H3 · `E H3-eposta-onay-390-acik.png` |
| 4 | Çıkış | Ayarlar › Hesap ve güvenlik › "Çıkış yap" | ✅ web | H4 · `E H4-cikis-sonrasi-390-acik.png` |
| 5 | Şifre değiştirme (mevcut şifre doğrulamalı) | Ayarlar › Hesap ve güvenlik | ✅ web | H5 · `E H5-sifre-formu-390-acik.png` |
| 6 | Kullanıcı adı değiştirme | Ayarlar › Hesap ve güvenlik | ✅ web | H6 (PATCH profiles) · `E H-hesap-390-acik.png` |
| 7 | Hesap silme (şifre + "SİL") | Hesap ve güvenlik sayfasının en altı | ✅ web | H7 (form açılır, onaysız düğme kapalı; gerçek silme çağrısı atılmadı) · `E H7-hesap-silme-390-acik.png` |
| 8 | Engellenenler ve engeli kaldırma | Ayarlar › Engellenen kullanıcılar | ✅ web | H8 · `E H8-engellenenler-390-acik.png` |
| 9 | 32 harita, rol/beceri ayrımı | Keşfet / Harita ekle: "Roller · 14" + "Beceriler · 18" sekmeleri | ✅ web | M1 (14 + 18 = 32) · `E M1-katalog-beceriler-390-acik.png` |
| 10 | Arama | Katalog arama alanı | ✅ web | M2 (sonuç + boş sonuç iletisi) · `E M2-arama-390-acik.png` |
| 11 | Seviye seçimi | Onboarding › "Hangi seviyedesin?" | ✅ web | Tur `onboarding-seviye-*` + M4 akışı |
| 12 | 3 soru (tek dokunuş) | Onboarding › sorular | ✅ web | M4 · `E M4-son-soru-390-acik.png` |
| 13 | Yapay zekâ kişiselleştirmesi (öncelikli, atlanabilir, bölüm notları) | Sorular › hazırla → Yol Haritam (bölüm notu nötr yazı) | ✅ web | M4 (personalize-roadmap çağrısı + kayıt) · `E M4-hazir-390-acik.png` |
| 14 | Birden çok harita ve haritalar arası geçiş | Yol Haritam altı çizili harita sekmeleri | ✅ web | M5 (PATCH roadmaps), M3 · `E M3-backend-390-acik.png` |
| 15 | Harita ekleme ve kaldırma | Sekmelerde "+ Ekle"; Ayarlar › Haritalarım (iki adımlı onay) | ✅ web | M6 (onay metni + DELETE roadmaps) · `E M6-kaldir-onay-390-acik.png` |
| 16 | Eski kayıtları temizleme | Ayarlar › Haritalarım › "Eski kayıtları temizle" | ✅ web | M7 · `E M7-eski-kayit-390-acik.png` |
| 17 | Ağaç/liste görünümü ve varsayılan görünüm tercihi | Yol Haritam "Harita" başlığındaki bağlantı; Ayarlar › Görünüm | ✅ web | M8 · tur `yol-haritam-agac-*`, `E M8-varsayilan-390-acik.png` |
| 18 | "Planımı güncelle" | Yol Haritam "…" menüsü (alt sayfa) | ✅ web | M9 (sorulara roadmapId ile gider) · `E M9-menu-390-acik.png` |
| 19 | Konu durumu (bitti / çalışıyorum / atladım) | Konu › üç durum düğmesi | ✅ web | I1 (POST topic_progress) · tur `konu-uye-*` |
| 20 | Sıradaki konu | Yol Haritam "Şimdi" kartı | ✅ web | I2 · `E I-yol-haritam-390-acik.png` |
| 21 | Günün görevi (+30 XP) | "Şimdi" kartının altındaki çizgili satır | ✅ web | I3 · aynı görüntü |
| 22 | XP ve seviyeler | Yol Haritam istatistik ayrıntısı; Profil seviye satırı | ✅ web | I4 · `E I5-ozet-ayrinti-390-acik.png`, tur `profil-uye-*` |
| 23 | Seri ve seri koruyucu | Yol Haritam istatistik ayrıntısı | ✅ web | I5 · aynı görüntü |
| 24 | Haftalık hedef | Yol Haritam istatistik ayrıntısı | ✅ web | I6 · aynı görüntü |
| 25 | Bölüm ve harita kutlaması | Konu ekranında kutlama penceresi | ✅ web (bölüm); harita türü kodda | I7 · `E I7-bolum-kutlama-390-acik.png`, tur `kutlama-*` |
| 26 | Başarımlar (rozetler) | Profil şeridi → Başarımlar | ✅ web | I8 (5 / 9, dokuz rozet adı) · tur `basarimlar-*` |
| 27 | "+XP" bildirimi | Kökte `xp-toast` | ✅ web | I9 · `E I9-bitti-xp-390-acik.png` |
| 28 | İlerleme özeti (konu sayısı, kalan süre) | İstatistik satırı + ayrıntı | ✅ web | I10 · `E I5-ozet-ayrinti-390-acik.png` |
| 29 | Konu: özet, seviye, süre, işaret | Konu başlığı + tek satır meta | ✅ web | K1 · tur `konu-uye-*` |
| 30 | Konu: kişisel not/odak | Başlığın altında tek satır (nötr / "Senin için öncelikli") | ✅ web | K2 |
| 31 | Konu: kaynaklar (tarayıcıda arama) | "Kaynaklar" çizgili satırlar | ✅ web | K3 |
| 32 | Konu: alt konular | "Yapay zekâ ile çalış" › Alt konular | ✅ web | K4 · `E K4-alt-konular-390-acik.png` |
| 33 | Konu: quiz | "Yapay zekâ ile çalış" › Quiz | ✅ web | K5 · `E K5-quiz-390-acik.png` |
| 34 | Konu: yapay zekâya sor (kota, kişisel bilgi uyarısı, hata notu, "Bildir") | "Yapay zekâ ile çalış" › Soru sor | ✅ web (429 "günlük hak doldu" metni kodda) | K4, K6 · `E K6-soru-sor-390-acik.png` |
| 35 | Konu: sonraki konu | Konunun en altında çizgili satır | ✅ web | K7 |
| 36 | Gelişmeler: haberler (Türkçe çeviri) | Gelişmeler | ✅ web | G1 · `E G-gelismeler-390-acik.png` |
| 37 | Gelişmeler: harita filtresi | Altı çizili filtre sekmeleri | ✅ web | G2; Topluluk betiği "haber filtre çipi" |
| 38 | Gelişmeler: kaynağa git | Haber satırı bağlantısı | ✅ web | G3 |
| 39 | Topluluk: haftalık lig + harita filtresi | Topluluk › Lig | ✅ web | Topluluk betiği "lig harita çipi" · tur `topluluk-lig-*` |
| 40 | Topluluk: arkadaşlar (istek gönder, kabul, reddet, geri çek, çıkar; seri ve bugünkü çalışma) | Topluluk › Arkadaşlar | ✅ web | İstek, kabul, geri çek onayı, çıkar + engelle OK; T3 (reddet düğmesi, seri/bugün satırı) |
| 41 | Arkadaşların bugün özeti | Yol Haritam istatistik ayrıntısı | ✅ web | T4 |
| 42 | Proje vitrini: paylaş, sil, bildir, engelle, harita filtresi | Topluluk › Vitrin + Projeni paylaş | ✅ web | Topluluk betiği: bildir + teşekkür, engelle, sil, filtre, form · tur `vitrin-paylas-*` |
| 43 | Vitrin: "Daha fazla göster" | `showcase-panel.tsx` (`hasMore`) | ✅ kod (taklit 20'den az proje döndürür) | Kod okundu, TS-03 sonrası değişmedi |
| 44 | Tema (sistem/açık/koyu) | Ayarlar › Görünüm; misafir Profil | ✅ web | A1 · tur `ayar-gorunum-*`, `profil-misafir-*` |
| 45 | Gizlilik, koşullar, destek e-postası | Ayarlar › Hakkında ve yasal; misafir Profil | ✅ web | A2 · tur `ayar-hakkinda-*` |
| 46 | Sürüm · yapay zekâ uyarısı · Türkçe hata ekranı | Hakkında ve yasal; "Bu sayfa bulunamadı" | ✅ web (hata sınırı `app-error` kodda) | A3, A4, A5 · `E E1-bulunamadi-390-acik.png` |

**Özet: 46/46 madde yeni görünümde çalışıyor** (çoğu web + taklit veriyle denendi; vitrin "Daha fazla göster", harita türü kutlaması, `app-error` ekranı ve 429 metni kodla doğrulandı). Envanter betiğinin ilk koşusunda 4 madde yeni arayüz etiketleri yüzünden "başarısız" göründü
(Keşfet "N konu" düğmeleri, ağaç/liste anahtarı, özet metni, başarım sayısı metni); bunlar özellik kaybı değil, betik
seçicisiydi ve yeni etiketlerle yeniden denenip geçti (`inv2.js`, `inv4.js`).

## 4. Yapılan düzeltmeler (dosyalar)

- `src/constants/theme.ts`: `markerInk`, `onMarker` (açık) kontrast düzeltmesi; kullanılmayan `Shadow`, `Border.chunky` silindi.
- `src/app/index.tsx` + yeni `src/components/trail-mark.tsx`: karşılama patikası (`react-native-svg` zaten bağımlılıkta).
- `src/constants/dev-roadmaps/{fullstack,cyber-security,aws,javascript,python}.ts`, `types.ts`, `visuals.ts`: hue taşıma + `MapHue` tipi (konu id'leri değişmedi).
- `src/app/(tabs)/roadmap.tsx`, `src/components/roadmap-tree.tsx`, `src/app/topic/[id].tsx`, `src/components/topic-assist.tsx`: mercan yalnız durum/XP; ağaç sayaçları plana göre; menü tagline'ı kalktı.
- `app.json` + `src/components/animated-icon.tsx`: splash ve adaptive-icon arka planı `#1E7B6A` → `#1C1B1F` (mürekkep).
  Simge görselindeki yol beyaz olduğu için açık zemin yerine koyu mürekkep seçildi (açık zeminde yol görünmezdi).
  **`app.json` değişti: yalnız yeni APK'da görünür, OTA ile gelmez.** Uygulama simgesi PNG'sine dokunulmadı.
- `src/components/segmented.tsx`, `option-card.tsx`, `milestone-celebration.tsx`, `src/app/showcase-new.tsx`, `src/app/map/[id].tsx`: 320 px ve tutarlılık düzeltmeleri.
- `src/app/login.tsx`, `src/components/community/username-gate.tsx`, `src/lib/xp.ts`: metin diyeti.
- Silindi: `icon-tile.tsx`, `route-steps.tsx` (hiçbir yerden çağrılmıyordu), `StatusChip`, `ProgressSummary` (eski kısım;
  `ProgressBar` ve `remainingLabel` kaldı), `useShadow`, `QUESTIONS[].subtitle`, ✨ → `Sparkles` eşlemesi.
- `AGENTS.md`, `docs/plan/TASARIM-MUREKKEP.md`, `BACKLOG.md`: silinen bileşen adları ve plan tablosu güncellendi.

Taramada **temiz çıkanlar:** ekranlarda elle `fontWeight` yok, 3D `Edge` kalıntısı yok, theme.ts dışında hex renk yok
(yalnız üç `rgba(0,0,0,…)` perde rengi: kutlama, satır menüsü, "…" menüsü; temadan bağımsız), ünlem yok, "✨" yok.

## 5. Açık kalanlar (BACKLOG "Öneriler"de)

- Hata/yıkıcı eylem için ayrı renk jetonu (`danger`).
- Haritalarım sayacı (tüm harita) ile Yol Haritam sayacı (plan) tutarsız.
- Lig madalyaları ve iki başarım rozetinde `marker`/`accent` hue.
- Native cihazda (Expo Go, yeni APK) görsel doğrulama; `icon.png` hâlâ eski teal zemin.
- Web üst çubuk geri düğmesi `‹` karakteri; XP bildirimi başlığa biniyor (eski öneri).
