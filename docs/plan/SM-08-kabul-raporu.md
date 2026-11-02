# SM-08 · Son kabul raporu

Tarih: 2 Kasım 2026 · Kapsam: `docs/plan/SADELIK-VE-MISAFIR.md` bölüm 3 (ilkeler) ve bölüm 5 (özellik envanteri)
· Dal: `agent/SM-08-son-kabul` (taban: `main` b5a4e6a, SM-01 … SM-07 birleşik)

## Nasıl denendi

- Web çıktısı (`expo export --platform web`) kaynağın kopyasından alındı; Supabase **taklit**: Playwright ile
  `https://example.supabase.co/**` istekleri yakalanıp örnek veriyle yanıtlandı. Gerçek Supabase'e istek atılmadı.
- Üç betik: **ekran turu** (29 ekran/durum × 390 ve 320 px × açık ve koyu = 116 görüntü), **misafir akışı**
  (uçtan uca), **envanter denetimi** (her maddeyi tıklayıp gerekli isteğin atıldığını/metnin göründüğünü doğrular).
  Topluluk eylemleri için SM-07'nin etkileşim betiği de yeniden koşuldu.
- "Surface içinde Surface" uyarısı yalnız geliştirme (`__DEV__`) modunda çıktığı için denetim yapısında
  kaynak kopyada `__DEV__` koşulu kaldırılıp web çıktısı öyle alındı. Uyarı da `pageerror` de **hiçbir ekranda çıkmadı**.
- Sınır: yalnız web ve taklit veri. Native cihaz ve gerçek sunucu bu raporun dışındadır (aşağıda "Açık kalanlar").

Ekran görüntüleri (repoya konmadı), hepsi `/tmp/claude-0/scratchpad/sm08/shots/` altında:

| Klasör | İçerik |
|---|---|
| `before/` | Düzeltmeden önce 116 ekran görüntüsü (`<ekran>-<390\|320>-<acik\|koyu>.png`) + `rapor.txt` |
| `after/` | Düzeltmeden sonra aynı 116 görüntü + `rapor.txt` |
| `after-akis/` | Misafir akışının adım adım görüntüleri (390 açık ve 320 koyu) |
| `envanter/` | Envanter maddelerinin kanıt görüntüleri + `inv-log.txt` (betik çıktısı) |

Aşağıdaki tabloda yol kısaltması: **S** = `/tmp/claude-0/scratchpad/sm08/shots/`. Her görüntünün 320 koyu eşi de aynı klasördedir.

## 1. Özellik envanteri (plan bölüm 5)

Doğrulama sütunu: **web** = taklit veriyle web'de denendi (betik çıktısı `S envanter/inv-log.txt`); **kod** = web'de
tetiklenemedi, kodda ve yapılandırmada doğrulandı.

| # | Madde | Yer (bugün) | Sonuç | Doğrulama · görüntü |
|---|---|---|---|---|
| 1 | Kayıt: benzersiz @kullanıcı adı, canlı müsaitlik, şifre ≥ 8, koşulları kabul | `login.tsx` (kayıt modu) | ✅ | web · `S envanter/H1-kayit-dolu-390-acik.png` |
| 2 | Giriş | `login.tsx` (giriş modu); karşılama "Giriş yap"; kayıt kapısı | ✅ | web · `S after-akis/07-login-dolu-390-acik.png` |
| 3 | E-posta onayı bilgisi | `login.tsx` bilgi kutusu | ✅ | web · `S envanter/H3-eposta-onay-390-acik.png` |
| 4 | Çıkış | Ayarlar › Hesap ve güvenlik › "Çıkış yap" | ✅ | web · `S envanter/H4-cikis-sonrasi-390-acik.png` |
| 5 | Şifre değiştirme (mevcut şifre doğrulamalı) | Ayarlar › Hesap ve güvenlik | ✅ | web · `S envanter/H5-sifre-formu-390-acik.png` |
| 6 | Kullanıcı adı değiştirme | Ayarlar › Hesap ve güvenlik | ✅ | web · `S envanter/H-hesap-390-acik.png` |
| 7 | Hesap silme (şifre + "SİL") | Hesap ve güvenlik sayfasının en altı | ✅ | web (form açılır, onaysız düğme kapalı; gerçek silme çağrısı atılmadı) · `S envanter/H7-hesap-silme-390-acik.png` |
| 8 | Engellenenler ve engeli kaldırma | Ayarlar › Engellenen kullanıcılar | ✅ | web · `S envanter/H8-engellenenler-390-acik.png` |
| 9 | 32 harita, rol/beceri ayrımı | Keşfet (misafir) ve "Harita ekle" (üye): `RoadmapCatalog` | ✅ | web (32 satır, iki grup) · `S envanter/M1-katalog-390-acik.png` |
| 10 | Arama | `RoadmapCatalog` arama kutusu | ✅ | web · `S after-akis/03-kesfet-arama-390-acik.png` |
| 11 | Seviye seçimi | `onboarding.tsx` | ✅ | web · `S after-akis/08-seviye-adimi-390-acik.png` |
| 12 | 3 soru (tek dokunuş) | `roadmap-questions.tsx` | ✅ | web · `S envanter/M4-son-soru-390-acik.png` |
| 13 | Yapay zekâ kişiselleştirmesi (öncelikli, atlanabilir, bölüm notları) | `roadmap-questions.tsx` → `personalize-roadmap`; sonuç Yol Haritam'da | ✅ | web (çağrı + kayıt + "Yol haritan hazır") · `S envanter/M4-hazir-390-acik.png` |
| 14 | Birden çok harita, haritalar arası geçiş | Yol Haritam üstü harita değiştirici | ✅ | web · `S after/yol-haritam-390-acik.png` |
| 15 | Harita ekleme ve kaldırma | Değiştirici "Harita ekle"; Ayarlar › Haritalarım (kaldırma iki adımlı onay) | ✅ | web · `S envanter/M6-kaldir-onay-390-acik.png` |
| 16 | Eski kayıtları temizleme | Ayarlar › Haritalarım › "Eski kayıtları temizle" | ✅ | web · `S envanter/M7-eski-kayit-390-acik.png` |
| 17 | Ağaç/liste görünümü ve varsayılan görünüm tercihi | Yol Haritam "Harita" bölümü; Ayarlar › Görünüm | ✅ | web · `S envanter/M8-liste-390-acik.png`, `M8-varsayilan-390-acik.png` |
| 18 | "Planımı güncelle" | Yol Haritam başlığındaki "…" menüsü | ✅ | web · `S envanter/M9-menu-390-acik.png` |
| 19 | Konu durumu (bitti / çalışıyorum / atladım) | `topic/[id].tsx` durum `Segmented` | ✅ | web (kayıt isteği atılır) · `S envanter/I9-bitti-xp-390-acik.png` |
| 20 | Sıradaki konu | Yol Haritam "Şimdi" kartı | ✅ | web · `S after/yol-haritam-390-acik.png` |
| 21 | Günün görevi (+30 XP) | "Şimdi" kartı (ikinci satır/rozet) | ✅ | web · aynı görüntü |
| 22 | XP ve seviyeler | Yol Haritam özet satırı; Profil seviye satırı | ✅ | web · `S after/profil-390-acik.png` |
| 23 | Seri ve seri koruyucu | Yol Haritam özet satırı → ayrıntı | ✅ | web · `S envanter/I5-ozet-ayrinti-390-acik.png` |
| 24 | Haftalık hedef | Özet satırı ve ayrıntısı | ✅ | web · aynı görüntü |
| 25 | Bölüm ve harita kutlaması | `milestone-celebration.tsx` (konu ekranında) | ✅ | web (bölüm kutlaması); harita kutlaması aynı bileşenin `roadmap` türü, kodda · `S envanter/I7-bolum-kutlama-390-acik.png` |
| 26 | Başarımlar (rozetler) | Profil şeridi → `/achievements` | ✅ | web · `S after/achievements-390-acik.png` |
| 27 | "+XP" bildirimi | `xp-toast.tsx` (kökte) | ✅ | web · `S envanter/I9-bitti-xp-390-acik.png` |
| 28 | İlerleme özeti (konu sayısı, kalan süre) | Özet satırı + ayrıntı | ✅ | web · `S envanter/I5-ozet-ayrinti-390-acik.png` |
| 29 | Konu: özet, seviye, süre, işaret | `topic/[id].tsx` başlık | ✅ | web · `S after/konu-uye-390-acik.png` |
| 30 | Konu: kişisel not/odak | başlığın altında tek satır | ✅ | web · aynı görüntü |
| 31 | Konu: kaynaklar (tarayıcıda arama) | Kaynaklar `ListGroup` | ✅ | web · aynı görüntü |
| 32 | Konu: alt konular | Yapay zekâ bölümü › Alt konular | ✅ | web · `S envanter/K4-alt-konular-390-acik.png` |
| 33 | Konu: quiz | Yapay zekâ bölümü › Quiz | ✅ | web · `S envanter/K5-quiz-390-acik.png` |
| 34 | Konu: yapay zekâya sor (kota, kişisel bilgi uyarısı, hata notu, "Bildir") | Yapay zekâ bölümü › Soru sor | ✅ | web (kalan hak, uyarı, not, Bildir); 429 "günlük hak doldu" metni kodda · `S envanter/K6-soru-sor-390-acik.png` |
| 35 | Konu: sonraki konu | durum seçicinin altı | ✅ | web · `S after/konu-uye-390-acik.png` |
| 36 | Gelişmeler: haberler (Türkçe çeviri) | `news.tsx` | ✅ | web (çeviri + dipnot) · `S envanter/G-gelismeler-390-acik.png` |
| 37 | Gelişmeler: harita filtresi | `news.tsx` filtre çipleri | ✅ | web · aynı görüntü |
| 38 | Gelişmeler: kaynağa git | haber satırı (bağlantı) | ✅ | web · aynı görüntü |
| 39 | Topluluk: haftalık lig + harita filtresi | Topluluk › Lig | ✅ | web · `S after/topluluk-lig-390-acik.png` |
| 40 | Topluluk: arkadaşlar (istek gönder, kabul, geri çek, çıkar; seri ve bugünkü çalışma) | Topluluk › Arkadaşlar | ✅ | web (SM-07 etkileşim betiği); "reddet" düğmesi ekranda, aynı RPC; kodda · `S after/topluluk-arkadaslar-390-acik.png` |
| 41 | Arkadaşların bugün özeti | Yol Haritam özet ayrıntısı (`FriendsTodayCard`) | ✅ | web · `S envanter/I5-ozet-ayrinti-390-acik.png` |
| 42 | Proje vitrini: paylaş, sil, bildir, engelle, harita filtresi | Topluluk › Vitrin + `showcase-new` | ✅ | web (SM-07 betiği) · `S after/topluluk-vitrin-390-acik.png` |
| 43 | Vitrin: "Daha fazla göster" | `showcase-panel.tsx` (`hasMore`) | ✅ | kod (taklit 20'den az proje döndürür) |
| 44 | Tema (sistem/açık/koyu) | Ayarlar › Görünüm; misafir Profil | ✅ | web · `S after/settings-appearance-390-acik.png`, `S after-akis/12-profil-koyu-secili-390-acik.png` |
| 45 | Gizlilik, koşullar, destek e-postası | Ayarlar › Hakkında ve yasal; misafir Profil | ✅ | web · `S after/settings-about-390-acik.png` |
| 46 | Sürüm | Hakkında ve yasal | ✅ | web · aynı görüntü |
| 47 | Yapay zekâ uyarısı | Hakkında ve yasal + konu ekranı notu | ✅ | web · aynı görüntü |
| 48 | Türkçe hata ekranı | `app-error.tsx` (`ErrorBoundary` kökte dışa aktarılır); `+not-found.tsx` | ✅ | kod (hata sınırı); bulunamadı ekranı web · `S envanter/A5-bulunamadi-390-acik.png` |
| 49 | Otomatik güncelleme (EAS Update) | `app.json` › `updates.url`, `runtimeVersion` | ✅ | kod/yapılandırma |

**Özet: 49 madde, 49 ✅, 0 ❌.** Hiçbir madde kaybolmamış ya da erişilemez değil. Yeri değişenler (Ayarlar alt sayfaları,
Keşfet, "…" menüsü) bölüm 4'teki hedef bilgi mimarisiyle uyumlu.

## 2. Misafir akışı (uçtan uca, web, taklit Supabase)

27 adım × (390 açık + 320 koyu) = 54 denetim, **54 geçti, 0 hata** (`S after-akis/`).

| Adım | Beklenen | Sonuç | Görüntü |
|---|---|---|---|
| `/` karşılama | "Gezinmeye başla" birincil, "Giriş yap" ikincil | ✅ | `S after-akis/01-karsilama-390-acik.png` |
| "Gezinmeye başla" | Keşfet (`/roadmap`), 32 haritalık katalog | ✅ | `02-kesfet-390-acik.png` |
| Arama ("kubernetes") | eşleşen haritalar listelenir | ✅ | `03-kesfet-arama-390-acik.png` |
| Harita seç | `/map/frontend` önizleme, "Bu haritayı seç" | ✅ | `04-harita-onizleme-390-acik.png` |
| Konuya dokun | salt okunur konu; durum seçici yok; kayıt kapısı kartı | ✅ | `05-konu-misafir-390-acik.png` |
| Konudan kapıya dokun, "Şimdilik gez" | login açılır; "Şimdilik gez" konuya geri döner | ✅ | `05b-konu-login-390-acik.png` |
| "Bu haritayı seç" | login (kayıt modu), **reason satırı** görünür | ✅ | `06-login-reason-390-acik.png` |
| "Şimdilik gez" | önizlemeye geri | ✅ | — |
| (taklit) giriş | giriş isteği atılır; **bekleyen niyet** işlenir → `/onboarding?map=frontend` "Hangi seviyedesin?" | ✅ | `07-login-dolu-…`, `08-seviye-adimi-390-acik.png` |
| Seviye + "Devam et" | `/roadmap-questions` (3 soru) | ✅ | `09-sorular-390-acik.png` |
| Gelişmeler (misafir) | haber akışı görünür | ✅ | `10-gelismeler-390-acik.png` |
| Topluluk (misafir) | tanıtım + "Katılmak için kayıt ol" → kayıt kapısı; "Şimdilik gez" geri | ✅ | `11-topluluk-390-acik.png` |
| Profil (misafir) | hesap kartı + tema anahtarı çalışır + gizlilik/koşullar/destek | ✅ | `12-profil-koyu-secili-390-acik.png` |

Kayıt formunun kendisi (canlı ad denetimi, şifre kuralı, koşullar, e-posta onayı bilgisi) envanter 1-3'te ayrıca denendi.

## 3. Ekran ekran bulgular ve düzeltmeler

Sütun "Önce → Sonra": `S before/…` ve `S after/…` aynı adla (`<ekran>-<390|320>-<acik|koyu>.png`).

| Ekran | Bulgu | Düzeltme |
|---|---|---|
| Karşılama | Sorun yok | — |
| Giriş / kayıt | Giriş-Kayıt anahtarı elle yazılmış ayrı bir segment (tek tip `Segmented` ilkesine aykırı) | `Segmented` kullanıldı (`login.tsx`); davranış aynı |
| Keşfet (misafir) | 32 haritalık liste, her biri 3D kenarlı büyük kart: "tekrar eden öğe = liste satırı" ve "tek birincil öğe" ilkelerine aykırı | `RoadmapCatalog` artık iki `ListGroup` (rol / beceri) + `ListRow` (renkli `IconTile`, ok); başlıklar `SectionHeader` |
| Harita ekle (onboarding katalog) | Aynı katalog bileşeni, aynı sorun | Aynı düzeltme (ortak bileşen) |
| Harita önizleme | Sorun yok | — |
| Konu (misafir ve üye) | Sorun yok. Not: uzun konu adında "Sonraki konu: …" düğmesi iki satıra iner (kırpılmaz) | Açık kalan (aşağıda) |
| Yol Haritam | (a) 320 px'te "Yol Haritam" başlığı "…" düğmesi yüzünden iki satıra iniyordu. (b) 390 px'te özet satırında üçüncü istatistik ("15 / 4 sa") alt satıra kayıyordu | (a) `ScreenHeader` dar ekranda (< 360) simge 40, başlık 28 punto: tek satır; tüm sekme başlıkları aynı kuralı alır. (b) İstatistik satırında "Meraklı · 120 XP" → "120 XP" (seviye adı Profil'de ve ekran okuyucu etiketinde duruyor); 320 px'te "2 gün seri" → "2 gün" + dar boşluk. İkisi de tek satırda. (Not: istatistikler `progress-summary.tsx`'te değil `roadmap.tsx` `SummaryRow` içinde; `ProgressSummary` compact modu zaten tek satır) |
| Alt sekme çubuğu (web) | 320 px'te "Yol Haritam" ve "Gelişmeler" etiketleri "…" ile kırpılıyordu (web'de `adjustsFontSizeToFit` çalışmıyor) | 320 px'te etiket 12 punto, sekmeler arası boşluk daraltıldı (`app-tabs.web.tsx`) |
| Gelişmeler | Sorun yok | — |
| Topluluk › Lig | 320 px'te "Hafta bitimine … · Puan: bu haftaki …" kırpılıyordu | Tek satır sınırı kaldırıldı, gerekirse alt satıra iner |
| Topluluk › Vitrin | 320 px'te "@ad · Harita adı" üst satırı kırpılıyordu | Tek satır sınırı kaldırıldı |
| Topluluk › Arkadaşlar | Sorun yok | — |
| Projeni paylaş | Web başlığında geri düğmesi küçük ve doğrudan açılışta hiç yoktu (diğer alt ekranlardaki 44 pt'lik düğme burada eksikti) | `webHeaderLeft('/community')` eklendi (`_layout.tsx`); native etkilenmez |
| Profil (misafir) | 320 px'te destek e-postası harf ortasından bölünüyordu ("…@gmai / l.com") | `ListRow` `subtitleLines` özelliği; e-posta tek satır, ortadan kısaltılır |
| Profil (üye) | Sorun yok | — |
| Başarımlar | 9 kart, kazanılanların hepsi renkli kalın kenarlı 3D: "renk az, tek birincil" ilkesine aykırı | Kartlar düz (ince kenar, 3D alt kenar yok); renk kimliği yalnız simge kutusunda; "Kazanıldı" çipi aynen |
| Ayarlar ana + Görünüm, Hesap, Engellenenler, Hakkında | Sorun yok | — |
| Ayarlar › Haritalarım | "Aç" düğmesi satır içinde 3D (altındaki "Harita ekle" ile üçüncü 3D öğe) | "Aç" sessiz metin düğmesi oldu (`Button variant="text"`); "Kaldır" ile aynı hizada |
| Onboarding (seviye) ve 3 soru | Her adımda 3-4 seçenek kartı 3D; bunlar tek seçimli sihirbaz adımı | Değiştirilmedi: tasarım kararı gerektirir (BACKLOG "Öneriler") |

**Konsol:** önce 116/116, sonra 116/116 ekran-durumunda `pageerror` yok ve "Surface içinde Surface" uyarısı yok
(`S before/rapor.txt`, `S after/rapor.txt`). Envanter ve akış koşularında da temiz.

## 4. Değişen dosyalar

`src/components/screen-header.tsx`, `src/components/app-tabs.web.tsx`, `src/components/roadmap-catalog.tsx`,
`src/components/list-row.tsx`, `src/components/achievements-section.tsx`, `src/components/settings/maps-section.tsx`,
`src/components/community/league-panel.tsx`, `src/components/community/showcase-panel.tsx`,
`src/components/header-back-button.tsx`, `src/app/(tabs)/roadmap.tsx`, `src/app/(tabs)/profile.tsx`,
`src/app/login.tsx`, `src/app/_layout.tsx`, `BACKLOG.md`, bu rapor. Mantık, veri akışı ve bağımlılıklar değişmedi;
veritabanı/migration yok; yeni paket yok.

## 5. Açık kalanlar

Hepsi `BACKLOG.md` › "Öneriler (ekipten)" bölümüne eklendi:

- Sihirbaz seçenek kartları (seviye + 3 soru): her adımda 3-4 adet 3D kart.
- "Sonraki konu: <ad>" düğmesinde uzun ad iki satıra iniyor.
- "+XP" bildirimi (web) konu ekranında başlığın üstüne biniyor.
- Native cihaz (Expo Go) denemesi bu raporda yok; yalnız web + taklit veri. Gerçek sunucuyla kayıt/e-posta onayı/silme
  uçtan uca denenmedi.
- Bu denetimin betikleri repoda değil: otomatik uçtan uca test (Playwright) önerisi.
