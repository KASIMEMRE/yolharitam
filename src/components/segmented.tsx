import { Pressable, StyleSheet, useWindowDimensions, View } from 'react-native';

import { Glyph } from '@/components/icon';
import { ThemedText } from '@/components/themed-text';
import { Border, MinTouch, Radius, Spacing } from '@/constants/theme';
import { useTheme } from '@/hooks/use-theme';

// Tek tip segment kontrolü (Topluluk, Harita görünümü, Ayarlar ve konu durumu ayrı ayrı yazılmıştı).
// Görünüm: kapsül iz + seçili parça kart zemini ve vurgu kenarı. Kenar HER ZAMAN 2px (şeffaf/vurgu),
// böylece seçince parça zıplamaz. Ekran okuyucuda radiogroup/radio.
export type SegmentedOption<T extends string> = {
  id: T;
  label: string;
  icon?: string; // emoji adı (icon.tsx)
  accessibilityLabel?: string; // etiketten farklı okunacaksa
};

type SegmentedProps<T extends string> = {
  options: SegmentedOption<T>[];
  value: T | null; // null: hiçbiri seçili değil (allowDeselect ile kullanılır)
  onChange: (id: T) => void; // seçili olana tekrar dokununca da çağrılır; kaldırma kararı üstte
  size?: 'md' | 'sm';
  fill?: boolean; // true: tüm genişliği eşit paylaş; false: içeriği kadar yer kapla
  label?: string; // radiogroup'un ekran okuyucu adı
  allowDeselect?: boolean; // seçili olana tekrar dokunmak seçimi kaldırır (ekran okuyucuya ipucu verir)
};

export function Segmented<T extends string>({
  options,
  value,
  onChange,
  size = 'md',
  fill = true,
  label,
  allowDeselect = false,
}: SegmentedProps<T>) {
  const theme = useTheme();
  const { width } = useWindowDimensions();
  // Dar ekranda (<360) 3+ parçada simge atılır ki etiket sığsın
  const hideIcons = fill && options.length > 2 && width < 360;

  return (
    <View
      accessibilityRole="radiogroup"
      accessibilityLabel={label}
      style={[
        styles.track,
        !fill && styles.trackHug,
        { backgroundColor: theme.backgroundSelected, borderColor: theme.border },
      ]}>
      {options.map((o) => {
        const selected = o.id === value;
        const color = selected ? 'accentInk' : 'textSecondary';
        return (
          <Pressable
            key={o.id}
            onPress={() => onChange(o.id)}
            accessibilityRole="radio"
            accessibilityState={{ selected }}
            accessibilityLabel={o.accessibilityLabel ?? o.label}
            accessibilityHint={allowDeselect && selected ? 'Seçimi kaldırmak için tekrar dokun' : undefined}
            style={[
              styles.item,
              fill && styles.itemFill,
              size === 'sm' && styles.itemSm,
              selected && { backgroundColor: theme.card, borderColor: theme.accent },
            ]}>
            {o.icon && !hideIcons && (
              <Glyph emoji={o.icon} size={size === 'sm' ? 14 : 16} color={theme[color]} strokeWidth={2.25} />
            )}
            <ThemedText
              type="smallBold"
              themeColor={color}
              numberOfLines={1}
              adjustsFontSizeToFit
              minimumFontScale={0.85}
              maxFontSizeMultiplier={1.3}>
              {o.label}
            </ThemedText>
          </Pressable>
        );
      })}
    </View>
  );
}

const styles = StyleSheet.create({
  track: { flexDirection: 'row', borderRadius: Radius.pill, borderWidth: Border.thin, padding: 2 },
  trackHug: { alignSelf: 'flex-start' },
  item: {
    minHeight: MinTouch, // dokunma hedefi: sm'de de 44
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    gap: 6,
    paddingHorizontal: Spacing.three,
    borderRadius: Radius.pill,
    borderWidth: Border.thick,
    borderColor: 'transparent',
  },
  itemFill: { flex: 1, minWidth: 0, paddingHorizontal: Spacing.one },
  itemSm: { paddingHorizontal: Spacing.two },
});
