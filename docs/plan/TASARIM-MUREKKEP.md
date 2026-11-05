# Plan: Yeni görünüm — "B düzeni + Mürekkep & mercan"

Hazırlanma: 5 Kasım 2026 · Sahibi: Emre · Uygulayıcı: ekip (BACKLOG.md › TS-01 … TS-04)

## 1. Proje sahibinin isteği

> "Bu uygulamanın tasarımını aşırı yapay zekâ gibi buluyorum; bir de çok ekstra yerlerde açıklama satırları var."

Tuvalde üç yön çizildi. Emre **B · Sıcak ama olgun** düzenini ve **Renk 3 · Mürekkep + mercan** paletini seçti.

**Referans tuval (Claude tasarım tuvali, yalnız Emre'nin hesabında açılır):**
https://claude.ai/artifact/NYJ6XX4wiYXhaVzjjaBCjd

Ajanlar bu tuvali açamaz. Hedef görünümün tarifi bu dosyada; aşağıdaki değerler tuvaldeki çizimlerden alındı.

İlgili tuval ekranları:
- `Renk-3-Murekkep` (Yol Haritam, açık)
- `Koyu-3-Murekkep` (Yol Haritam, koyu)
- `B-Konu`, `B-Kesfet` (Konu ekranı ve Keşfet; bu ekranlar B düzeninde ama eski renkte çizildi, onlara da bu paleti uygula)

**Kısıt:** Hiçbir özellik kaybolmaz. `docs/plan/SADELIK-VE-MISAFIR.md` bölüm 5'teki envanter geçerliliğini korur. Değişenler yalnız görünüm, yazı tipi ve metindir.

## 2. Neden "yapay zekâ gibi" görünüyordu (düzeltilecekler)

1. **Her yerde açıklama satırı vardı.** Başlık, alan ve satırların altında gri alt yazılar duruyordu (16 `subtitle`/`hint`/`intro`, 55 küçük gri metin).
2. **Başlıkların yanında kutulu renkli simgeler vardı.** `ScreenHeader` simge kutusu, `IconTile`, liste satırlarında renkli kareler.
3. **Her şey fazla yuvarlak ve "oyuncak" gibiydi.** 16–28 px köşeler, butonların altında 4 px "3D" kenar, hap şeklinde seçimler.
4. **Renkler gökkuşağı gibiydi.** Altı renk ailesi aynı ekranda yarışıyordu; turkuaz-krem ikilisi hazır şablon havası veriyordu.
5. **Telefonun varsayılan yazı tipi kullanılıyordu.** Uygulamaya karakter katan bir yazı tipi yoktu.

## 3. Renk paleti (theme.ts, jeton adları AYNI kalır, değerler değişir)

Kural: **Bir ana renk (mürekkep) + tek vurgu (mercan) + nötrler.**

- **Mürekkep:** ana buton, seçili sekme çizgisi, "bitti" durumu, ilerleme çubuğu.
- **Mercan:** yalnız "şimdi / çalışıyorum", seri ve XP.
- **Harita renkleri (hue):** soluk tonlar. Yalnız küçük noktada (8–10 px) ve gerekirse yumuşak zeminde kullanılır; hiçbir zaman büyük dolgu ya da kenarlık olmaz.
- **Yazı rengi kuralı:** mercan yazı her zaman `markerInk`, nokta/dolgu `marker`. Kontrast 4.5:1 altına düşmez.

| Jeton | Açık | Koyu |
|---|---|---|
| text | `#1C1B1F` | `#F3F1EE` |
| background | `#FAF8F5` | `#141316` |
| card | `#FFFFFF` | `#1F1D21` |
| backgroundElement | `#F1EDE8` | `#1F1D21` |
| backgroundSelected | `#E8E4DF` | `#2B292E` |
| textSecondary | `#5F5C63` | `#A6A2A9` |
| border | `#E7E3DE` | `#2B292E` |
| borderStrong | `#77737A` | `#7C7880` |
| borderEdge | `#DDD6CE` | `#353238` |
| accent (ana eylem = mürekkep) | `#1C1B1F` | `#F3F1EE` |
| accentEdge | `#000000` | `#C9C5CC` |
| accentSoft | `#F1EDE8` | `#1F1D21` |
| accentInk | `#1C1B1F` | `#F3F1EE` |
| onAccent | `#FFFFFF` | `#141316` |
| marker (mercan) | `#E4572E` | `#F06A42` |
| markerEdge | `#B8401F` | `#B8502F` |
| markerSoft | `#FBE3DA` | `#3A1F17` |
| markerInk | `#C2401C` | `#FF8A66` |
| onMarker | `#FFFFFF` | `#141316` |
| sky / skySoft / skyInk / skyEdge | `#8C9AAD` / `#ECEFF3` / `#46566B` / `#6F7D90` | `#8C9AAD` / `#1E2229` / `#B4C0CF` / `#6F7D90` |
| violet / Soft / Ink / Edge | `#A497B0` / `#EFECF2` / `#5A4C6A` / `#85789A` | `#A497B0` / `#231F28` / `#C7BCD3` / `#85789A` |
| coral / Soft / Ink / Edge | `#C4917F` / `#F5ECE8` / `#7A4A3A` / `#A37564` | `#C4917F` / `#2A201C` / `#E0B9AA` / `#A37564` |
| berry / Soft / Ink / Edge | `#B8919F` / `#F4ECEF` / `#74485A` / `#977381` | `#B8919F` / `#281E22` / `#DDBCC8` / `#977381` |
| leaf / Soft / Ink / Edge | `#93A585` / `#EEF1EA` / `#4B5C3F` / `#76876A` | `#93A585` / `#1E231B` / `#BCCBB0` / `#76876A` |
| warningBackground / warningInk | değişmez | değişmez |

Not: `accent` artık "harita yeşili" değil, "mürekkep"tir. Yeşil zemin beklenen yerler (ör. "Bitti" rozetleri) mürekkep ya da nötr olur. `theme.ts` başındaki yorumları buna göre güncelle.

## 4. Yazı tipi

- **Başlıklar:** Bricolage Grotesque (600 SemiBold, 700 Bold): ekran başlığı, kart başlığı, büyük rakamlar.
- **Metin:** Figtree (400, 500, 600, 700): her şey.
- **Paketler:** `npx expo install @expo-google-fonts/bricolage-grotesque @expo-google-fonts/figtree` (JS paketi, Expo Go'da çalışır; `expo-font` zaten var).
- **Yükleme:** `useFonts` ile kök `_layout.tsx`'te, açılış ekranı (splash) gizlenmeden önce.
- **Dikkat:** React Native'de özel yazı tipinde `fontWeight` dosya seçmez. Her ağırlık ayrı `fontFamily` adıdır (`Figtree_600SemiBold` gibi). `ThemedText` türleri (title, cardTitle, default, small, …) doğru aileye eşlenir. Ekranlarda doğrudan `fontWeight: '700'` yazan yerler ya `ThemedText` türüne ya da `Fonts` sabitlerine çevrilir.
- **Ölçek (yaklaşık):** ekran başlığı 32/700 Bricolage · bölüm başlığı 19/600 Bricolage · kart başlığı 22/600 Bricolage · gövde 15–16 Figtree · küçük 13–14 Figtree · sekme etiketi 11 Figtree.

## 5. Biçim kuralları

- **Köşeler:** `Radius = { sm: 8, md: 10, lg: 14, xl: 18, pill: 999 }`. Kartlar 14, butonlar 10, giriş alanları 10. Hap (pill) yalnız küçük etiketlerde.
- **3D kenar yok:** `Edge` alt kenarı hiçbir bileşende çizilmez (`Button`, `Surface tone="primary"`, `OptionCard`, rozetler, `RouteSteps`…). Birincil butonun farkı dolgu rengiyle gelir (`accent` zemin + `onAccent` yazı).
- **Gölge yok** (ya da çok hafif). Ayrım için ince 1 px `border` çizgisi ve boşluk kullanılır.
- **Seçim kontrolleri:**
  - İki-üç seçenekli görünüm anahtarları ve sekmeler (harita sekmeleri, Roller/Beceriler, Lig/Arkadaşlar/Vitrin, Yapay zekâ sekmeleri): **altı çizili sekme**. Seçili olan 600 ağırlık + 2 px `accent` alt çizgi; diğerleri `textSecondary`; altta tam genişlik 1 px `border`.
  - Konu durumu (Çalışıyorum/Bitti/Atladım): üç eşit düğme, 44 px. Seçili "Çalışıyorum" = `markerSoft` zemin + `markerInk` yazı + 1.5 px `marker` iç kenar; seçili "Bitti" = `accent` dolgu + `onAccent`; seçili değilse 1 px `borderEdge` iç kenar.
- **Durum noktaları (konu satırları):** bitti = dolu `accent` nokta, çalışıyorum/şimdi = dolu `marker` nokta, başlanmadı = 1.5 px `borderStrong` halka, isteğe bağlı = kesikli halka. 10 px.
- **Simgeler:**
  - Ekran başlığının yanındaki simge kutusu kalkar.
  - `IconTile` (renkli kutulu simge) liste satırlarından ve başlıklardan kalkar.
  - Liste satırında simge gerekiyorsa çizgi simge `textSecondary` renginde, kutusuz, 20 px olur; ya da harita satırlarında yalnız 10 px hue noktası.
  - Sekme çubuğundaki simgeler kalır.
- **Harita çipleri yerine** üstte altı çizili harita sekmeleri: hue noktası + kısa ad ("Frontend") + sonda "+ Ekle".

## 6. Metin kuralları ("açıklama satırı diyeti")

1. **Açıklama satırı yalnız kullanıcının kararını değiştiriyorsa kalır.** Kalanlar:
   - hesap silme uyarısı,
   - yapay zekâya kişisel bilgi yazmama uyarısı,
   - harita kaldırınca ilerlemenin silineceği uyarısı,
   - hata mesajları,
   - e-posta onayı bilgisi.
2. **Kalkanlar:**
   - Bölüm başlıklarının altındaki tanıtım cümleleri ("Bir meslek için baştan sona izlenecek yol.", "Bu hafta kazandığın XP ile…").
   - Alan ipuçları ("Harita ya da konu adı yazabilirsin"); yer tutucu yeterli.
   - "Dokununca kaynak tarayıcıda aranır." gibi davranış anlatımları.
   - Ayarlar listesindeki satır alt yazıları.
   - "Bu konuda neredesin? Birini seç." gibi kontrolün kendisini anlatan cümleler.
3. **Kısa yaz.**
   - Buton: fiil + nesne ("Konuya devam et", "Projeni paylaş").
   - Ekran başlığı: tek kelime ya da iki kelime.
4. **Ton:** sakin ve net. Ünlem, "harika!", "hadi!" yok.
   - "Yapay zekâ" vurgusu, ışıltı (✨) simgesi ve "Senin için seçildi" süslemeleri kalkar.
   - Kişiselleştirme bilgisi düz yazı kalır: "Senin için öncelikli" `markerInk` renginde, simgesiz.
5. **Boş durumlar:** tek cümle + tek eylem.

## 7. Ekran ekran hedef (ayrıntı tuvalde)

- **Yol Haritam:**
  - Üstte "Merhaba, @ad" küçük yazı, altında "Yol Haritam" başlığı, sağda "…" menü.
  - Altı çizili harita sekmeleri.
  - "Şimdi" kartı:
    - `backgroundElement` zemin, 14 köşe.
    - Mercan noktalı "Şimdi · Bölüm" etiketi, Bricolage konu adı, özet.
    - Tam genişlik mürekkep "Konuya devam et" butonu.
    - İnce çizgiyle ayrılmış "Günün görevi: … · +30 XP ›" satırı.
  - Kutusuz üç istatistik (büyük Bricolage rakam + küçük etiket): "6/31 konu", "2 gün seri" (mercan), "120 XP".
  - "Harita" başlığı + sağda "Ağaç görünümü" bağlantısı.
  - Bölümler ince çizgili satırlar: tamamlanan bölüm "Bitti", açık bölümde 4 px ilerleme çubuğu ve noktalı konu satırları.
- **Konu:**
  - Geri bağlantısı (bölüm adı).
  - Hue noktası + harita adı, Bricolage başlık, tek satır meta (Önerilen · Başlangıç · ~3 saat), özet.
  - "Senin için öncelikli" satırı.
  - Üç durum düğmesi.
  - "Kaynaklar" başlığı + çizgili satırlar (↗).
  - "Yapay zekâ ile çalış" başlığı + altı çizili 3 sekme + çerçeveli ikincil buton.
  - En altta "Sonraki konu" satırı.
- **Keşfet:**
  - Başlık, arama alanı (`backgroundElement` zemin, büyüteç).
  - Altı çizili "Roller · 14 / Beceriler · 18".
  - Harita satırları: hue noktası + ad + tek satır kısaltılmış açıklama + sağda "43 konu".
- **Diğer ekranlar** (Gelişmeler, Topluluk, Profil, Ayarlar ve alt sayfaları, Başarımlar, Karşılama, Giriş/Kayıt, Onboarding, Harita önizleme, Vitrin paylaş) aynı dili kullanır:
  - Bricolage başlık, çizgili liste satırları, altı çizili sekmeler.
  - Ekranda tek mürekkep birincil buton, mercan yalnız durum/XP'de.
  - Kart içinde kart yok.

## 8. İş sırası

| Görev | Konu | Bağımlılık |
|---|---|---|
| TS-01 | Temel: renk jetonları, yazı tipleri, köşe/kenar, ortak bileşenler (Button, Surface, ListRow, ScreenHeader, SectionHeader, Segmented→altı çizili sekme, OptionCard, FilterChipRow, rozetler), AGENTS.md kuralları | — |
| TS-02 | Ana akış ekranları: Yol Haritam (+ağaç görünümü renkleri), Konu, Keşfet / Harita ekle kataloğu, Harita önizleme + metin diyeti | TS-01 |
| TS-03 | Diğer ekranlar: Gelişmeler, Topluluk (+vitrin paylaş), Profil, Başarımlar, Ayarlar + alt sayfalar, Karşılama, Giriş/Kayıt, Onboarding + metin diyeti | TS-01 |
| TS-04 | Son kabul: açık/koyu × 390/320 ekran turu, envanter, kontrast, kalan "yapay zekâ" izleri | TS-02, TS-03 |

TS-02 ve TS-03 farklı dosyalara dokunur, paralel yürüyebilir.
