/**
 * Learn more about light and dark modes:
 * https://docs.expo.dev/guides/color-schemes/
 */

import { Colors, Shadow } from '@/constants/theme';
import { useColorScheme } from '@/hooks/use-color-scheme';

export function useTheme() {
  const scheme = useColorScheme();
  const theme = scheme === 'dark' ? 'dark' : 'light'; // sistem teması bilinmiyorsa (null) açık tema

  return Colors[theme];
}

// Gölge yardımcısı: koyu modda gölge işe yaramaz (zemin zaten koyu), orada kenar çizgisi yeterli.
export function useShadow() {
  const scheme = useColorScheme();
  return (level: keyof typeof Shadow) => (scheme === 'dark' ? undefined : Shadow[level]);
}
