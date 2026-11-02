# Telefondaki uygulamayı otomatik güncelleme

Telefondaki Yol Haritam uygulaması, GitHub'da `main` dalına her değişiklik girdiğinde kendini günceller
(EAS Update). Uygulamayı kapatıp açtığında yeni sürüm gelir; tekrar APK kurmak gerekmez.

## Bir kerelik kurulum

1. **Erişim anahtarı oluştur:** https://expo.dev/settings/access-tokens › *Create token* (ad: `github`). Çıkan
   anahtarı kopyala (bir daha gösterilmez, kimseyle paylaşma).
2. **GitHub'a ekle:** https://github.com/KASIMEMRE/yolharitam/settings/secrets/actions › *New repository secret*
   · Name: `EXPO_TOKEN` · Secret: kopyaladığın anahtar.
3. **Güncellemeyi alabilen APK'yı bir kez kur** (eski APK güncelleme özelliği olmadan derlendi):
   ```
   cd C:\Users\Emre\yolharitam
   git checkout -- app.json
   git pull
   npm install
   npx eas-cli@latest build -p android --profile preview
   ```
   Çıkan bağlantıdan yeni APK'yı indir ve kur (eskisinin üzerine kurulur; verilerin sunucuda olduğu için kaybolmaz).

## Sonrası

- `main`'e birleşen her değişiklik GitHub Actions ile otomatik yayınlanır (Actions sekmesinde "Uygulama güncellemesi").
- Telefonda: uygulamayı tamamen kapatıp aç → yeni sürümü indirir → bir sonraki açılışta kullanır.
- **Yeni APK ne zaman gerekir?** Yalnız yerel (native) bir paket eklenince ya da `app.json`'daki `version` artırılınca.
  Bu durumda adım 3'ü tekrarla.
