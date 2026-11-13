# Çökme takibi (Sentry): kurulum

Uygulama çöktüğünde ya da hata ekranı çıktığında hatanın nerede olduğunu görmek için Sentry kullanılır.
**DSN tanımlı değilse Sentry tamamen kapalıdır**; uygulama bugünkü gibi çalışır. Sentry yalnız yeni bir APK/AAB derlemesinde çalışır
(Expo Go'da ve geliştirme modunda hiçbir şey gönderilmez).

Gönderilen veri: hata ayrıntısı, cihaz modeli, işletim sistemi ve uygulama sürümü. Kullanıcı kimliği, e-posta, kullanıcı adı, ağ istekleri yok.

## Adımlar

1. **Hesap aç.** https://sentry.io adresinde ücretsiz (Developer) hesap aç.
2. **Proje oluştur.** Platform olarak "React Native" seç. Proje adını ve organizasyon kısa adını (URL'deki `…/organizations/<kısa-ad>/`) not al.
3. **DSN'yi al.** Proje › Settings › Client Keys (DSN) altındaki `https://…@…ingest.sentry.io/…` adresini kopyala.
4. **DSN'yi EAS'a ekle** (preview ve production için):
   ```bash
   npx eas-cli@latest env:create --name EXPO_PUBLIC_SENTRY_DSN --value "<DSN>" --environment preview --environment production --visibility sensitive
   ```
   Ya da expo.dev › proje › Environment variables › `EXPO_PUBLIC_SENTRY_DSN` ekle; ortam olarak Preview ve Production seç.
   (DSN gizli anahtar sayılmaz, uygulamanın içinde zaten durur; `sensitive` yine de güvenli seçimdir.)
5. **İsteğe bağlı: okunur hata satırları (kaynak haritası).** Bunu yapmazsan hatalar görünür ama satır numaraları derlenmiş koda işaret eder.
   - Sentry › Settings › Developer Settings › Personal/Organization Token ile bir **auth token** üret (izinler: `project:releases`, `org:read`).
   - EAS'a **secret** olarak ekle, koda ya da repoya yazma:
     ```bash
     npx eas-cli@latest env:create --name SENTRY_AUTH_TOKEN --value "<TOKEN>" --environment preview --environment production --visibility secret
     npx eas-cli@latest env:create --name SENTRY_ORG --value "<organizasyon-kısa-adı>" --environment preview --environment production
     npx eas-cli@latest env:create --name SENTRY_PROJECT --value "<proje-adı>" --environment preview --environment production
     ```
   - Üçü birlikte tanımlıysa yükleme kendiliğinden açılır (`app.config.js`). Biri eksikse yükleme atlanır, derleme bozulmaz.
6. **Yeni APK derle.** Sentry bir native modül olduğu için **OTA güncelleme (`eas update`) yetmez**; yeni bir yerel derleme gerekir:
   ```bash
   npx eas-cli@latest build --platform android --profile preview
   ```
   Eski APK'lar Sentry'siz çalışmaya devam eder.

## Deneme

Yeni APK'yı kurduktan sonra Sentry panelinde "Issues" altında bir kayıt görmek için geçici bir hata attırabilirsin
(örneğin bir ekranda `throw new Error('Sentry denemesi')` ve sonra geri al). Kayıt birkaç dakika içinde görünür.

## Notlar

- Kodun yeri: `src/lib/sentry.ts` (ayarlar), `src/app/_layout.tsx` (başlatma), `src/components/app-error.tsx` (hata ekranı bildirimi).
- Metro ayarı: `metro.config.js`. Kaynak haritası koşulu: `app.config.js`.
- Gizlilik politikası ve mağaza veri güvenliği formu bu özelliği anlatır (`docs/yasal/gizlilik-politikasi.md`, `docs/YAYIN.md`).
- Kaynak haritası yükleme yalnız yerel/EAS derlemesinde olur; OTA güncellemelerin haritası için `npx sentry-expo-upload-sourcemaps dist` gerekir (şimdilik gerekli değil).

## Sürüm notu
Sentry yerel (native) bir modül olduğu için uygulama sürümü 1.0.1'e yükseltildi. `runtimeVersion` politikası `appVersion` olduğundan 1.0.0 APK'lar bundan sonraki otomatik güncellemeleri almaz. Yeni APK'yı derleyip kurman gerekir: `npx eas-cli@latest build -p android --profile preview`.
