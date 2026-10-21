import { useColorScheme as useSystemColorScheme } from 'react-native';

import { usePreferences } from '@/lib/preferences';

// Etkin tema: Ayarlar'da "Sistem" seçiliyse telefonun teması, değilse kullanıcının seçtiği.
export function useColorScheme() {
  const system = useSystemColorScheme();
  const { theme } = usePreferences();
  return theme === 'system' ? system : theme;
}
