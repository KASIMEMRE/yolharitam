# Yol Haritam — Mağazaya Çıkış Kontrol Listesi

Kod tarafındaki hazırlık tamam (31 Ekim 2026). Bu listede **yalnızca proje sahibinin yapabileceği** adımlar var:
hesap açmak, ödeme yapmak, mağaza formlarını doldurmak.

## 0. Hazır olanlar ✅

- Uygulama kimliği: `com.kasimemre.yolharitam` (iOS ve Android, `app.json`). Mağazaya bir kez çıktıktan sonra değişmez.
- `eas.json`: `preview` (Android APK, test için) ve `production` profilleri; sürüm numarası EAS'ta otomatik artar.
- Supabase adresi ve yayınlanabilir anahtar koda gömülü (`src/lib/config.ts`): EAS'ta ortam değişkeni tanımlamaya gerek yok.
- Uygulama içinde hesap silme (Ayarlar › Hesabımı sil), gizlilik politikası, kullanım koşulları, destek e-postası.
- Kayıtta "Kullanım Koşulları ve Gizlilik Politikası'nı kabul" satırı.
- Topluluk güvenliği: bildir, engelle (Ayarlar'dan engeli kaldırma), uygunsuz kelime filtresi, 3 bildirimde otomatik gizleme.
- Yapay zekâ yanıtlarında "hata içerebilir" notu ve "Bildir" bağlantısı; soru kutusunda kişisel bilgi uyarısı.
- Uygulama simgesi, açılış ekranı, Türkçe hata ekranı, ağ isteklerinde zaman aşımı.

**Herkese açık sayfalar** (mağaza formlarına bu adresleri yaz):

| Sayfa | Adres |
|---|---|
| Gizlilik politikası | https://github.com/KASIMEMRE/yolharitam/blob/main/docs/yasal/gizlilik-politikasi.md |
| Kullanım koşulları | https://github.com/KASIMEMRE/yolharitam/blob/main/docs/yasal/kullanim-kosullari.md |
| Hesap silme (Play formu) | https://github.com/KASIMEMRE/yolharitam/blob/main/docs/yasal/hesap-silme.md |
| Destek e-postası | kasimemresekersoy@gmail.com |

> Destek adresini değiştirmek istersen: `src/lib/config.ts` (`SUPPORT_EMAIL`) ve `docs/yasal/*.md`.

> ⚠️ Yasal sayfa adresleri GitHub'daki `main` dalını ve reponun **herkese açık** olmasını gerektirir. Repoyu özel yaparsan
> bu bağlantılar çalışmaz; o zaman sayfaları başka bir yerde (ör. GitHub Pages, Notion) yayınlayıp `src/lib/config.ts`'i güncelle.

## 1. Hesaplar (bir kere)

- [ ] **Expo hesabı** (ücretsiz): https://expo.dev/signup
- [ ] **Google Play Console** (25 $ tek seferlik): https://play.google.com/console — kişisel hesaplarda ilk yayından önce
      **12 test kullanıcısıyla 14 gün kapalı test** şartı var; takvime ekle.
- [ ] **Apple Developer Program** (99 $/yıl, iOS için): https://developer.apple.com/programs/

## 2. İlk derleme

Bilgisayarında, proje klasöründe:

```bash
npm install
npx eas-cli@latest login
npx eas-cli@latest init            # projeyi Expo hesabına bağlar (app.json'a projectId ekler; bunu commit'le)
npx eas-cli@latest build --profile preview --platform android   # telefona kurulacak test APK'sı
```

APK'yı telefona kurup baştan sona dene (kayıt → e-posta onayı → harita → konu → topluluk → hesap silme).
Sorun yoksa mağaza derlemesi:

```bash
npx eas-cli@latest build --profile production --platform android   # Play için .aab
npx eas-cli@latest build --profile production --platform ios       # App Store (Apple hesabı gerekir)
npx eas-cli@latest submit --platform android                       # ya da Play Console'a elle yükle
```

## 3. Supabase ayarları (panel)

- [ ] **Authentication › URL Configuration › Site URL**: e-posta onay bağlantısına tıklayan kişi buraya gider.
      Şu adres olmalı: `https://github.com/KASIMEMRE/yolharitam/blob/main/docs/yasal/eposta-onaylandi.md`
      (Bu ayar yapıldı mı diye kontrol et; yoksa kullanıcı onaydan sonra hata sayfası görür.)
- [ ] **Özel SMTP** (önerilir): Supabase'in ücretsiz e-posta servisi saatte birkaç e-postayla sınırlı. Yayından sonra
      kayıt e-postaları gecikmesin diye ücretsiz bir servis bağla (örn. Brevo: Authentication › Emails › SMTP Settings).
      Bunu yapınca e-posta kodu ile doğrulama (PR #4) da açılabilir.
- [ ] (İsteğe bağlı, Pro plan) Leaked password protection.

## 4. Mağaza formları

**Uygulama bilgileri**
- Ad: Yol Haritam · Kategori: Eğitim · Yaş: 13+ (Apple) / Teen-12+ (Google IARC anketi)
- Kısa açıklama (Play, 80 karakter): `Yazılımcı yol haritanı seç, konu konu ilerle; yapay zekâ ve arkadaşlarınla öğren.`
- Alt başlık (App Store, 30 karakter): `Yazılımcı yol haritası`
- Anahtar kelimeler (App Store): `yazılım,yol haritası,kodlama,programlama,frontend,backend,python,sql,öğren,yapay zekâ,roadmap,geliştirici`
- Uzun açıklama: aşağıda.

**Veri güvenliği (Play) / App Privacy (Apple)**
- Toplanan: e-posta (hesap), kullanıcı adı (herkese görünür), uygulama etkinliği (ilerleme, XP), kullanıcı içeriği (vitrin projeleri, yapay zekâya sorulan sorular).
- Paylaşılan: yapay zekâ sorusu ve konu bilgisi Groq'a işlenmek üzere gider (kimlik bilgisi olmadan).
- Konum, rehber, fotoğraf, cihaz/reklam kimliği: **toplanmıyor**. Reklam ve takip: **yok** (Apple: "Data not used to track you").
- Aktarım şifreli: evet. Kullanıcı verisinin silinmesini isteyebilir: evet (uygulama içi + hesap silme sayfası).
- Uygulamada kullanıcı içeriği var: evet (bildir, engelle, filtre mevcut).
- Şifreleme ihracatı: yalnız standart HTTPS (`ITSAppUsesNonExemptEncryption: false` ayarlı).

**Apple inceleme hesabı** (App Store Connect › App Review Information)
- [ ] Onaylanmış bir test hesabı aç (e-posta + şifre), bir harita seç, birkaç konu işaretle, vitrine örnek proje ekle.
      Bu bilgileri inceleme notuna yaz; e-posta onayı gerektiği için inceleyen kişi kendi hesabını açamayabilir.

**Ekran görüntüleri** (telefon; Play en az 2, önerilen 5-8): karşılama · harita seçimi · Yol Haritam (günün görevi) ·
konu ekranı (yapay zekâ) · Gelişmeler · Topluluk ligi · Profil. Test hesabında gerçek veriyle çek.
Play ayrıca 512×512 simge (`assets/images/icon.png` küçültülerek) ve 1024×500 öne çıkan görsel ister.

### Uzun açıklama taslağı

> Yol Haritam, yazılım öğrenirken "şimdi ne çalışmalıyım?" sorusunu cevaplayan Türkçe bir yol haritası uygulamasıdır.
>
> 32 yol haritası, 1.000'den fazla konu: Frontend, Backend, iOS, Android, DevOps, Yapay Zekâ, MLOps, Veri Mühendisliği, Siber Güvenlik, Oyun Geliştirme gibi rol haritalarından ya da JavaScript, Python, Java, Go, Rust, Kubernetes, AWS, SQL, Veri Yapıları gibi beceri haritalarından birini seç. Seviyeni belirle; harita sana göre şekillensin. Her konuda özet, tahmini süre ve seçilmiş kaynaklar var.
>
> NELER YAPABİLİRSİN
> • Konu konu ilerle: Her konuyu "bitirdim", "çalışıyorum" ya da "atladım" diye işaretle. Günün görevi ve sıradaki konun hep en üstte.
> • Yapay zekâyla kişiselleştir: Birkaç soruyu yanıtla; yapay zekâ haritayı sana göre işaretler: önce çalışman gerekenler, atlayabileceklerin, bölüm notları.
> • Konuyu anla: Her konuda alt başlıklar, mini quiz ve "Yapay zekâya sor".
> • Gelişmeleri takip et: Seçtiğin konulara bağlı yazılım haberleri, Türkçe başlık ve özetlerle.
> • Birlikte çalış: Haftalık ligde yarış, çalışma arkadaşı ekle, projelerini vitrinde paylaş.
> • Rozetler kazan, serini koru, ilerlemeni gör.
>
> Reklam yok, takip yok. Hesabını ve tüm verilerini uygulamadan istediğin an silebilirsin.
>
> Yol Haritam, roadmap.sh projesinden ilham alır ancak onunla bağlantılı değildir; içerikler Türkçe ve Yol Haritam'a aittir.

## 5. Yayından sonra

- Vitrin bildirimlerine 24 saat içinde bak (Supabase › Table Editor › `showcase_reports`; 3 bildirim alan proje zaten otomatik gizlenir).
- Destek e-postasını takip et.
- Sonraki işler BACKLOG.md'de: şifremi unuttum, e-posta koduyla doğrulama (SMTP sonrası), kullanılabilirlik devam görevleri.
