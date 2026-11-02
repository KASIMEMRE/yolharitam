// "Karşılama ekranı görüldü" bilgisi cihazda tutulur: kişi bir kez "Gezinmeye başla" ya da "Giriş yap"
// dediyse sonraki açılışlarda karşılamayı tekrar görmeden doğrudan sekmelere gider.
import AsyncStorage from '@react-native-async-storage/async-storage';

const KEY = 'yolharitam.welcome-seen.v1';

// Okuma hata verirse "görmedi" say: en kötü ihtimal karşılamayı bir kez daha göstermek.
export async function readWelcomeSeen(): Promise<boolean> {
  try {
    return (await AsyncStorage.getItem(KEY)) === '1';
  } catch {
    return false;
  }
}

export async function markWelcomeSeen(): Promise<void> {
  try {
    await AsyncStorage.setItem(KEY, '1');
  } catch {
    // yut: kaydedilemezse yalnız bir sonraki açılışta karşılama yine görünür
  }
}
