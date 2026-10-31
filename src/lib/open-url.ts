import { openBrowserAsync } from 'expo-web-browser';
import { Linking } from 'react-native';

// Dış bağlantıyı açar. Yalnız https kabul edilir: haber ve vitrin linkleri dışarıdan geldiği için
// javascript:, intent: gibi tehlikeli şemalar hiç açılmamalı (sunucu da kontrol eder; bu ikinci güvence).
// Açmayı denediyse true, reddettiyse false döner.
export async function openExternalUrl(url: string): Promise<boolean> {
  if (!/^https:\/\//.test(url)) return false;
  try {
    // Uygulama içi tarayıcı; web'de çalışmazsa sistemin linkine düşeriz
    await openBrowserAsync(url);
  } catch {
    Linking.openURL(url).catch(() => {});
  }
  return true;
}
