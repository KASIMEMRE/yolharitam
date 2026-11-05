import { Pressable, StyleSheet, useWindowDimensions, View } from 'react-native';

import { Glyph } from '@/components/icon';
import { ThemedText } from '@/components/themed-text';
import { Border, MinTouch, Radius, Spacing } from '@/constants/theme';
import { useTheme } from '@/hooks/use-theme';

// Tek tip seçim kontrolü (Topluluk, Harita görünümü, Ayarlar, giriş/kayıt, yapay zekâ sekmeleri, konu durumu).
// İki görünümü var, API aynı:
//  - variant="tabs" (varsayılan): ALTI ÇİZİLİ SEKME. Seçili olan ağırlıklı yazı + 2px accent alt çizgi,
//    diğerleri textSecondary; altta tam genişlik 1px border çizgisi.
//  - variant="buttons": eşit genişlikte düğmeler (konu durumu: Çalışıyorum / Bitti / Atladım), 44px.
//    Seçili düğmenin rengi seçeneğin `tone` değerinden gelir.
// Ekran okuyucuda radiogroup/radio.
export type SegmentedOption<T extends string> = {
  id: T;
  label: string;
  icon?: string; // emoji adı (icon.tsx)
  accessibilityLabel?: string; // etiketten farklı okunacaksa
  // yalnız variant="buttons": seçiliyken görünüm. marker = mercan (çalışıyorum), accent = mürekkep dolgu (bitti),
  // neutral (varsayılan) = nötr
  tone?: 'marker' | 'accent' | 'neutral';
};

type SegmentedProps<T extends string> = {
  options: SegmentedOption<T>[];
  value: T | null; // null: hiçbiri seçili değil (allowDeselect ile kullanılır)
  onChange: (id: T) => void; // seçili olana tekrar dokununca da çağrılır; kaldırma kararı üstte
  size?: 'md' | 'sm';
  fill?: boolean; // true: tüm genişliği eşit paylaş; false: içeriği kadar yer kapla
  fullRule?: boolean; // yalnız tabs + fill=false: sekmeler içeriği kadar, alttaki ince çizgi tam genişlikte
  variant?: 'tabs' | 'buttons';
  label?: string; // radiogroup'un ekran okuyucu adı
  allowDeselect?: boolean; // seçili olana tekrar dokunmak seçimi kaldırır (ekran okuyucuya ipucu verir)
};

export function Segmented<T extends string>({
  options,
  value,
  onChange,
  size = 'md',
  fill = true,
  fullRule = false,
  variant = 'tabs',
  label,
  allowDeselect = false,
}: SegmentedProps<T>) {
  const theme = useTheme();
  const { width } = useWindowDimensions();
  // Dar ekranda (<360) 3+ parçada simge atılır ki etiket sığsın
  const hideIcons = fill && options.length > 2 && width < 360;
  const buttons = variant === 'buttons';

  return (
    <View
      accessibilityRole="radiogroup"
      accessibilityLabel={label}
      style={[
        buttons ? styles.buttonsRow : styles.track,
        !buttons && { borderBottomColor: theme.border },
        !fill && !buttons && (fullRule ? styles.trackRule : styles.trackHug),
      ]}>
      {options.map((o) => {
        const selected = o.id === value;

        // Düğme görünümü: seçili/seçili değil renkleri
        let btnStyle: object = { borderColor: theme.borderEdge, borderWidth: Border.thin };
        let color: 'accentInk' | 'textSecondary' | 'markerInk' | 'onAccent' | 'text' = 'text';
        if (buttons && selected) {
          if (o.tone === 'accent') {
            btnStyle = { backgroundColor: theme.accent, borderColor: theme.accent, borderWidth: 1.5 };
            color = 'onAccent';
          } else if (o.tone === 'marker') {
            btnStyle = { backgroundColor: theme.markerSoft, borderColor: theme.marker, borderWidth: 1.5 };
            color = 'markerInk';
          } else {
            btnStyle = { backgroundColor: theme.backgroundSelected, borderColor: theme.borderStrong, borderWidth: 1.5 };
          }
        }
        if (!buttons) color = selected ? 'accentInk' : 'textSecondary';

        return (
          <Pressable
            key={o.id}
            onPress={() => onChange(o.id)}
            accessibilityRole="radio"
            accessibilityState={{ selected }}
            accessibilityLabel={o.accessibilityLabel ?? o.label}
            accessibilityHint={allowDeselect && selected ? 'Seçimi kaldırmak için tekrar dokun' : undefined}
            style={({ pressed }) => [
              buttons ? styles.button : styles.item,
              fill && styles.itemFill,
              !buttons && size === 'sm' && styles.itemSm,
              // Seçili sekmenin alt çizgisi: her sekmede 2px sabit yer (şeffaf/accent), seçince zıplamasın.
              // marginBottom -1: çizgi, kapsayıcının 1px border çizgisinin üstüne biner.
              !buttons && { borderBottomColor: selected ? theme.accent : 'transparent' },
              buttons && btnStyle,
              pressed && styles.pressed,
            ]}>
            {o.icon && !hideIcons && (
              <Glyph
                emoji={o.icon}
                size={size === 'sm' ? 14 : 16}
                color={color === 'onAccent' ? theme.onAccent : theme[color]}
                strokeWidth={2.25}
              />
            )}
            <ThemedText
              type={selected || buttons ? 'smallBold' : 'small'}
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
  // Sekme satırı: altta tam genişlik 1px çizgi
  track: { flexDirection: 'row', borderBottomWidth: Border.thin },
  trackHug: { alignSelf: 'flex-start', gap: Spacing.three },
  trackRule: { gap: Spacing.three },
  item: {
    minHeight: MinTouch, // dokunma hedefi: sm'de de 44
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    gap: 6,
    paddingHorizontal: Spacing.two,
    borderBottomWidth: 2,
    marginBottom: -1,
  },
  itemFill: { flex: 1, minWidth: 0 },
  itemSm: { paddingHorizontal: Spacing.one },
  pressed: { opacity: 0.7 },
  // Düğme görünümü (konu durumu)
  buttonsRow: { flexDirection: 'row', gap: Spacing.two },
  button: {
    minHeight: MinTouch,
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    gap: 6,
    // Dar ekranda (320) üç eşit düğmede "Çalışıyorum" kısalmasın diye yan boşluk küçük
    paddingHorizontal: Spacing.one,
    borderRadius: Radius.md,
  },
});
