import { View } from 'react-native';

import { Glyph } from '@/components/icon';
import { useTheme } from '@/hooks/use-theme';

// "Buradasın" iğnesi: mercan dolgulu harita iğnesi, ortasında beyaz nokta.
// Karşılama patikası, harita hazırlanırken çizilen yol ve Yol Haritam başlığında aynı iğne kullanılır.
export function MapPin({ size = 28 }: { size?: number }) {
  const theme = useTheme();
  return (
    <View accessibilityElementsHidden importantForAccessibility="no-hide-descendants">
      <Glyph emoji="📍" size={size} color={theme.coralEdge} fill={theme.coral} strokeWidth={1.75} />
    </View>
  );
}
