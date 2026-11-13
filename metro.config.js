// Metro, uygulamanın JavaScript paketini üreten araçtır.
// Sentry sürümü her pakete bir "Debug ID" damgalar; böylece çökme kaydındaki satır numaraları
// kaynak haritasıyla okunabilir hale gelir. Token yoksa yalnız damga eklenir, hiçbir şey yüklenmez.
const { getSentryExpoConfig } = require('@sentry/react-native/metro');

module.exports = getSentryExpoConfig(__dirname);
