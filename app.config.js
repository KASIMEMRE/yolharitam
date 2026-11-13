// app.json'daki ayarları alır; yalnız Sentry eklentisinin kaynak haritası yüklemesini koşullandırır.
//
// Neden? Yükleme SENTRY_AUTH_TOKEN ister (gizli anahtar, EAS secret olarak tutulur). Token yokken
// yükleme açık kalırsa Android derlemesi hata verip durur. Bu yüzden token yoksa yükleme kapanır,
// derleme her zaman başarılı olur. Token tanımlanınca yükleme kendiliğinden açılır.
module.exports = ({ config }) => {
  const hasToken = !!process.env.SENTRY_AUTH_TOKEN;
  const org = process.env.SENTRY_ORG;
  const project = process.env.SENTRY_PROJECT;
  // Üçü birden yoksa sentry-cli yüklemeyi yapamaz; eksik parça varken de kapalı tut.
  const canUpload = hasToken && !!org && !!project;

  return {
    ...config,
    plugins: (config.plugins ?? []).map((plugin) => {
      const name = Array.isArray(plugin) ? plugin[0] : plugin;
      if (name !== '@sentry/react-native') return plugin;
      return [
        '@sentry/react-native',
        {
          ...(org ? { organization: org } : {}),
          ...(project ? { project } : {}),
          disableAutoUpload: !canUpload,
        },
      ];
    }),
  };
};
