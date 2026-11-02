# Plan: Sadelik + Misafir gezintisi

Hazırlanma: 2 Kasım 2026 · Sahibi: Emre · Uygulayıcı: ekip (BACKLOG.md › SM-01 … SM-08, sırayla)

## 1. Proje sahibinin isteği (aynen)

> "Uygulama biraz sadelik istiyor; her şey iç içe geliyor. İç içe olmasın, sadelik olsun ama var olan özellikler de
> gitmesin. Ayrıca direkt giriş yapmak yerine önce uygulamayı biraz gezebilsin; giren kişi bir harita ya da bir şey
> seçerse giriş, yani kayıt olma ekranı gelsin."

İki hedef var:

1. **Sadelik.** Kart içinde kart, kutu içinde kutu, aynı ekranda yarışan çok sayıda renkli blok olmayacak.
   Her ekranın tek bir ana amacı ve en fazla bir birincil düğmesi olacak. Ayrıntılar bir dokunuşla açılacak.
2. **Misafir gezintisi.** Uygulama açılınca giriş formu çıkmayacak. Kişi haritaları, konuları, kaynakları ve
   haberleri hesap açmadan gezebilecek. Kendine ait bir şey yapmak istediğinde (harita seçmek, konu işaretlemek,
   yapay zekâyı kullanmak, toplulukta yer almak) kayıt ekranı gelecek. Kayıttan sonra yarım kalan iş kaldığı yerden
   devam edecek.

**Kısıt: hiçbir özellik kaybolmayacak.** Bölüm 5'teki envanterin her maddesi işin sonunda hâlâ erişilebilir olmalı.

## 2. Bugünkü durum (neden "iç içe" hissi var)

| Ekran | Sorun |
|---|---|
| Yol Haritam (`(tabs)/roadmap.tsx`, ~1050 satır) | Üst üste 6-7 renkli kart var: harita çipleri, Sıradaki konu, Günün görevi, Yolculuk kartı (içinde ilerleme ve plan düğmesi), momentum şeridi, görünüm anahtarı, bölüm kartları (içinde konu satırları). Neredeyse hepsi kenarlıklı ve 3D alt kenarlı; göz nereye bakacağını bilmiyor. |
| Konu (`topic/[id].tsx`) | Başlık kartı, kişisel not kutusu, kaynak kartları, durum seçici, kısayollar ve 3 yapay zekâ bloğu var. Her biri ayrı çerçeve içinde ve bloklar kendi içinde yine kutu içeriyor. |
| Profil | Kimlik, seviye kartı, "Şu anki haritan" kartı ve başarım kartları ayrı ayrı çerçeveli. |
| Ayarlar (~750 satır) | Tek uzun sayfa: Haritalarım, Görünüm, Hesap (kullanıcı adı, şifre, engellenenler, çıkış), Hakkında. Kartların içinde düğme kartları var. |
| Topluluk | Sekme çubuğunun altında filtre çipleri, onun altında kartlar var; kartların içinde yine onay kutuları açılıyor. |
| Oturum | `_layout.tsx` içindeki `Stack.Protected` yüzünden giriş yapmadan sekmelerin hiçbiri açılmıyor. Karşılama ekranından sonra doğrudan kayıt formu geliyor. |

## 3. Sadelik ilkeleri (bütün işler bunlara uyar)

1. **Tek seviye kart.** Bir kartın içinde başka bir kenarlıklı kutu olmaz. İç gruplama boşluk, ince ayırıcı çizgi
   ya da başlıkla yapılır.
2. **Birincil eylem tek.** Her ekranda yalnız bir öğe "3D" (dolgu rengi ve kalın alt kenar) görünür: o ekranın
   ana işi. Diğer kartlar düz olur: ince kenar ya da yalnız zemin rengi.
3. **Liste satırı, kart değil.** Ayarlar, haritalarım, kaynaklar, arkadaşlar gibi tekrar eden öğeler kart yığını yerine
   ayırıcılı liste satırı olur (`ListRow`: simge + başlık + alt satır + sağda ok veya eylem).
4. **Aşamalı gösterim.** Ayrıntı ilk bakışta değil, dokununca görünür: "Ayrıntılar" açılır alanı, alt sayfa veya
   ayrı ekran. İlk ekranda yalnız "şimdi ne yapmalıyım?" sorusunun cevabı durur.
5. **Renk az ve anlamlı.** Renkli zemin yalnız harita kimliği (hue) ve durum (bitti, çalışıyorum) için kullanılır.
   Uyarı ve bilgi kutuları gerçekten gerektiğinde çıkar.
6. **Boşluk ve hiza.** Bölümler arası `Spacing.five`, bölüm içi `Spacing.three`. Ekran başlıkları tek tip
   (`ScreenHeader`). Kenar boşlukları her ekranda aynı.
7. **Mevcut tasarım dili korunur:** tema renkleri, Lucide simgeleri (`icon.tsx`), Türkçe metinler, erişilebilirlik
   (44 pt dokunma alanı, ekran okuyucu etiketleri).

## 4. Hedef bilgi mimarisi

### 4.1 Misafir (oturum yok)

```
Karşılama ("/")
  ├─ [Gezinmeye başla]  → Sekmeler (misafir)
  └─ [Giriş yap]        → login (giriş modu)

Sekmeler (misafir)
  ├─ Keşfet        : 32 haritanın kataloğu (arama + rol/beceri) → Harita önizleme → Konu (salt okunur)
  ├─ Gelişmeler    : haberler (herkese açık)
  ├─ Topluluk      : tanıtım + "Katılmak için kayıt ol" (lig/arkadaş/vitrin önizlemesi, kişisel veri yok)
  └─ Profil        : "Hesap oluştur / Giriş yap" kartı + Görünüm (tema) + Hakkında/yasal
```

### 4.2 Kayıt kapısı (Auth gate)

Kayıt istenen eylemler:

- Harita önizlemede **"Bu haritayı seç"**
- Konuda **durum işaretleme**, **Alt konular / Quiz / Soru sor**
- Toplulukta **katıl**, **arkadaş ekle**, **proje paylaş**, **bildir / engelle**

Akış:

1. Misafir eylemi seçer.
2. Kayıt ekranı açılır: alttan sayfa ya da modal. Üstünde neden açıldığını söyleyen bir satır olur, ör. "Frontend
   haritasını kaydetmek için ücretsiz hesap oluştur".
3. Kişi kayıt olur. E-posta onayından sonra giriş yapar.
4. **Bekleyen niyet** (ör. `{ type: 'pick-map', mapId: 'frontend' }`) cihazda saklanır (AsyncStorage). İlk girişte
   okunur ve kişi doğrudan oraya götürülür: seviye seçimi → 3 soru → haritası hazır.

### 4.3 Giriş yapmış kullanıcı

Sekmeler bugünkü gibi kalır: Yol Haritam · Gelişmeler · Topluluk · Profil. Keşfet kataloğu "Harita ekle"den açılır
(bugünkü onboarding'in yeni hâli). Ayarlar alt sayfalara bölünür (bkz. SM-06).

## 5. Özellik envanteri (hiçbiri kaybolmayacak)

Her PR'ın açıklamasında bu listenin ilgili maddeleri işaretlenir. SM-08'de hepsi tek tek denetlenir.

**Hesap ve oturum:** kayıt (benzersiz @kullanıcı adı, canlı müsaitlik denetimi, şifre en az 8, koşulları kabul) ·
giriş · e-posta onayı bilgisi · çıkış · şifre değiştirme (mevcut şifre doğrulamalı) · kullanıcı adı değiştirme ·
hesap silme (şifre + "SİL") · engellenen kullanıcılar ve engeli kaldırma

**Haritalar:** 32 harita, rol/beceri ayrımı · arama · seviye seçimi · 3 soru (tek dokunuş) · yapay zekâ
kişiselleştirmesi (öncelikli konular, atlanabilirler, bölüm notları) · birden çok harita ve haritalar arası geçiş ·
harita ekleme ve kaldırma · eski kayıtları temizleme · ağaç/liste görünümü ve varsayılan görünüm tercihi ·
"Planımı güncelle"

**İlerleme ve motivasyon:** konu durumu (bitti/çalışıyorum/atladım) · sıradaki konu · günün görevi (+30 XP) ·
XP ve seviyeler · seri ve seri koruyucu · haftalık hedef · bölüm ve harita kutlaması · başarımlar (rozetler) ·
"+XP" bildirimi · ilerleme özeti (konu sayısı, kalan süre)

**Konu ekranı:** özet, seviye, süre, işaret · kişisel not/odak bilgisi · kaynaklar (tarayıcıda arama) ·
alt konular, quiz, yapay zekâya sor (kota, kişisel bilgi uyarısı, hata notu ve "Bildir") · sonraki konu

**Gelişmeler:** haberler (Türkçe çeviri), harita filtresi, kaynağa git

**Topluluk:** haftalık lig (harita filtresi) · arkadaşlar (istek gönder, kabul et, reddet, geri çek, çıkar; seri ve
bugünkü çalışma) · arkadaşların bugün özeti · proje vitrini (paylaş, sil, bildir, engelle, harita filtresi, daha
fazla göster)

**Ayarlar ve diğer:** tema (sistem/açık/koyu) · gizlilik politikası, kullanım koşulları, destek e-postası ·
sürüm · yapay zekâ uyarısı · Türkçe hata ekranı · otomatik güncelleme (EAS Update)

## 6. İş sırası (BACKLOG.md'deki görevler)

| Görev | Konu | Bağımlılık | 🗄️ |
|---|---|---|---|
| SM-01 | Ortak sade bileşenler (`Surface`, `ListRow`, `SectionHeader`, `Segmented`) ve kurallar | — | |
| SM-02 | Misafir modu altyapısı: rota korumaları, kayıt kapısı, bekleyen niyet | — | ✓ |
| SM-03 | Misafir ekranları: Keşfet, harita önizleme, salt okunur konu, misafir sekmeleri | SM-02 | |
| SM-04 | Yol Haritam sadeleştirme | SM-01 | |
| SM-05 | Konu ekranı sadeleştirme | SM-01, SM-03 | |
| SM-06 | Profil ve Ayarlar sadeleştirme (Ayarlar alt sayfalara) | SM-01 | |
| SM-07 | Topluluk ve Gelişmeler sadeleştirme | SM-01 | |
| SM-08 | Son kabul: özellik envanteri denetimi, tam tur test, önce/sonra görüntüler | hepsi | |

Her görevin ayrıntılı adımları ve kabul kriterleri BACKLOG.md'de. Her PR tek görev; `npx tsc --noEmit` ve
`npx expo lint` temiz; açık ve koyu temada, 390 ve 320 px genişlikte önce/sonra ekran görüntüleri PR'a eklenir.

## 7. Karar notları (soru sorulmadan alınan kararlar)

- **Misafir ilerlemesi cihazda tutulmaz.** Misafir konu işaretleyemez; işaretlemek kayıt kapısını açar. Neden:
  kayıttan sonra veriyi taşımak (cihaz → sunucu) karmaşık ve hataya açık. Bekleyen niyet tek bir eylemle sınırlı.
- **Haberler herkese açık olur.** `news_items` ve `news_sources` için `anon` okuma politikası eklenir (SM-02, 🗄️).
  İçerik zaten herkese açık bloglardan geliyor. Yazma yetkisi yine yok.
- **Topluluk misafire kişisel veri göstermez.** Lig ve vitrin RPC'leri `authenticated` olarak kalır. Misafir
  yalnız tanıtım metni ve örnek görsel (sahte veri değil, açıklayıcı çizim veya ikon) görür.
- **Yapay zekâ misafire kapalı.** Kota ve maliyet yüzünden kayıt gerektirir.
- **Karşılama ekranı kalır ama tek dokunuşla geçilir.** "Gezinmeye başla" birincil düğmedir. Yeni kullanıcı her
  açılışta karşılamayı görmesin diye "gördü" bilgisi cihazda saklanır.
- **Ayarlar sayfası bölünür.** Ana sayfada liste satırları olur (Haritalarım, Görünüm, Hesap ve güvenlik,
  Engellenenler, Hakkında ve yasal). Her biri kendi ekranını açar. Hesap silme Hesap ekranının en altında kalır.
