import { Pressable, ScrollView, StyleSheet, View } from 'react-native';

import { Glyph } from '@/components/icon';
import { ThemedText } from '@/components/themed-text';
import { Border, MinTouch, Radius, Spacing } from '@/constants/theme';
import { HUES, type Hue } from '@/constants/visuals';
import { useTheme } from '@/hooks/use-theme';

// Tek satır yatay kaydırmalı filtre çipleri. Lig, Vitrin, Gelişmeler ve proje formunda
// ayrı ayrı yazılmış üç kopya vardı; tek yerde toplandı.
// Çok haritası olan kullanıcıda çipler alt satırlara yığılmasın diye kaydırılır.
export type FilterChipOption<T extends string> = {
  id: T;
  label: string;
  icon?: string; // emoji adı (icon.tsx)
  dot?: Hue; // yalnız variant="tabs": etiketin önünde harita rengi noktası (10px)
  accessibilityLabel?: string; // etiketten farklı okunacaksa
};

type FilterChipRowProps<T extends string> = {
  options: FilterChipOption<T>[];
  value: T;
  onChange: (id: T) => void;
  role?: 'tab' | 'radio'; // tab: süzgeç · radio: zorunlu tek seçim (form)
  label?: string; // grubun ekran okuyucu adı
  // chips (varsayılan): düz çipler · tabs: altı çizili, yatay kaydırmalı sekmeler (Segmented ile aynı dil;
  // harita sayısı değişken olduğu için Segmented yerine kaydırılabilir olanı)
  variant?: 'chips' | 'tabs';
};

export function FilterChipRow<T extends string>({
  options,
  value,
  onChange,
  role = 'tab',
  label,
  variant = 'chips',
}: FilterChipRowProps<T>) {
  const theme = useTheme();
  if (variant === 'tabs') {
    return (
      <View style={[styles.tabsWrap, { borderBottomColor: theme.border }]}>
        <ScrollView
          horizontal
          showsHorizontalScrollIndicator={false}
          accessibilityRole={role === 'radio' ? 'radiogroup' : 'tablist'}
          accessibilityLabel={label}
          style={styles.scroll}
          contentContainerStyle={styles.tabs}>
          {options.map((o) => {
            const selected = o.id === value;
            return (
              <Pressable
                key={o.id}
                onPress={() => onChange(o.id)}
                accessibilityRole={role}
                accessibilityLabel={o.accessibilityLabel ?? o.label}
                accessibilityState={{ selected }}
                style={({ pressed }) => [
                  styles.tab,
                  { borderBottomColor: selected ? theme.accent : 'transparent', opacity: pressed ? 0.7 : 1 },
                ]}>
                {o.dot && <View style={[styles.dot, { backgroundColor: theme[HUES[o.dot].line] }]} />}
                <ThemedText type={selected ? 'smallBold' : 'small'} themeColor={selected ? 'accentInk' : 'textSecondary'} maxFontSizeMultiplier={1.3}>
                  {o.label}
                </ThemedText>
              </Pressable>
            );
          })}
        </ScrollView>
      </View>
    );
  }
  return (
    <ScrollView
      horizontal
      showsHorizontalScrollIndicator={false}
      accessibilityRole={role === 'radio' ? 'radiogroup' : 'tablist'}
      accessibilityLabel={label}
      style={styles.scroll}
      contentContainerStyle={styles.chips}>
      {options.map((o) => {
        const selected = o.id === value;
        return (
          <Pressable
            key={o.id}
            onPress={() => onChange(o.id)}
            accessibilityRole={role}
            accessibilityLabel={o.accessibilityLabel ?? o.label}
            accessibilityState={{ selected }}
            style={({ pressed }) => [
              styles.chip,
              {
                backgroundColor: selected ? theme.backgroundSelected : 'transparent',
                borderColor: selected ? theme.backgroundSelected : theme.border,
                opacity: pressed ? 0.75 : 1,
              },
            ]}>
            {o.icon && (
              <Glyph emoji={o.icon} size={14} color={selected ? theme.accentInk : theme.textSecondary} strokeWidth={2.25} />
            )}
            <ThemedText type="chip" themeColor={selected ? 'accentInk' : 'text'} maxFontSizeMultiplier={1.3}>
              {o.label}
            </ThemedText>
          </Pressable>
        );
      })}
    </ScrollView>
  );
}

const styles = StyleSheet.create({
  scroll: { flexGrow: 0 },
  // Sekme satırı: altta tam genişlik 1px çizgi; seçili sekmenin 2px çizgisi üstüne biner
  tabsWrap: { borderBottomWidth: Border.thin },
  tabs: { gap: Spacing.four, paddingRight: Spacing.three },
  tab: {
    minHeight: MinTouch,
    flexDirection: 'row',
    alignItems: 'center',
    gap: 6,
    borderBottomWidth: 2,
    marginBottom: -1,
  },
  dot: { width: 8, height: 8, borderRadius: 4 },
  chips: { gap: Spacing.two, paddingRight: Spacing.three },
  chip: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 6,
    minHeight: MinTouch,
    justifyContent: 'center',
    paddingHorizontal: Spacing.three,
    borderRadius: Radius.md,
    borderWidth: Border.thin,
  },
});
