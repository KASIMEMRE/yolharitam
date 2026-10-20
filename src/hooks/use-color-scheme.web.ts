import { useSyncExternalStore } from 'react';
import { useColorScheme as useRNColorScheme } from 'react-native';

// Değişmeyen bir "dış kaynağa" abonelik: dinlenecek bir şey yok, boş temizlik döndürür.
const subscribe = () => () => {};

/**
 * Web'de sayfa önce sunucuda (statik) üretilir; orada kullanıcının tema tercihi bilinmez.
 * useSyncExternalStore iki değer ister:
 *  - getSnapshot (tarayıcıda): true  → sayfa tarayıcıda canlandı (hydration bitti)
 *  - getServerSnapshot (sunucuda ve ilk canlanmada): false
 * Böylece eski useEffect + setState yöntemine gerek kalmadan aynı sonuç alınır
 * ve "effect içinde setState" uyarısı (gereksiz ikinci render) ortadan kalkar.
 */
export function useColorScheme() {
  const hasHydrated = useSyncExternalStore(
    subscribe,
    () => true,
    () => false
  );

  const colorScheme = useRNColorScheme();

  return hasHydrated ? colorScheme : 'light';
}
