import { Children, Fragment, type ReactNode } from 'react';
import { Pressable, StyleSheet, View } from 'react-native';

import { Glyph } from '@/components/icon';
import { IconTile } from '@/components/icon-tile';
import { Surface } from '@/components/surface';
import { ThemedText } from '@/components/themed-text';
import { Border, MinTouch, Spacing } from '@/constants/theme';
import type { Hue } from '@/constants/visuals';
import { useTheme } from '@/hooks/use-theme';

// Liste satırı: tekrar eden öğeler (ayarlar, haritalarım, kaynaklar) kart yığını yerine bu satırla dizilir.
// `icon` emoji adıdır (icon.tsx). Düz simge Glyph ile; `iconTile` verilirse renkli IconTile (40) ile çizilir.
type ListRowProps = {
  icon?: string;
  iconTile?: Hue | 'neutral';
  title: string;
  subtitle?: string;
  right?: ReactNode; // sağda rozet / değer / düğme
  chevron?: boolean; // sağda ">" oku
  onPress?: () => void;
  destructive?: boolean; // yıkıcı eylem (ör. Çıkış yap): coral yazı
  accessibilityLabel?: string;
};

export function ListRow({
  icon,
  iconTile,
  title,
  subtitle,
  right,
  chevron = false,
  onPress,
  destructive = false,
  accessibilityLabel,
}: ListRowProps) {
  const theme = useTheme();
  const ink = destructive ? 'coralInk' : 'text';

  const body = (pressed: boolean) => (
    <View style={[styles.row, pressed && { backgroundColor: theme.backgroundElement }]}>
      {icon &&
        (iconTile ? (
          <IconTile emoji={icon} tone={iconTile} size={40} />
        ) : (
          <Glyph emoji={icon} size={22} color={destructive ? theme.coralInk : theme.accentInk} />
        ))}
      <View style={styles.texts}>
        <ThemedText type="smallBold" themeColor={ink}>
          {title}
        </ThemedText>
        {subtitle ? (
          <ThemedText type="small" themeColor="textSecondary">
            {subtitle}
          </ThemedText>
        ) : null}
      </View>
      {right}
      {chevron && <Glyph emoji="›" size={20} color={theme.textSecondary} />}
    </View>
  );

  if (!onPress) return body(false);
  return (
    <Pressable
      onPress={onPress}
      accessibilityRole="button"
      accessibilityLabel={accessibilityLabel ?? (subtitle ? `${title}. ${subtitle}` : title)}>
      {({ pressed }) => body(pressed)}
    </Pressable>
  );
}

// Satırları tek bir düz kartın içinde, ince ayırıcıyla dizer. Ayırıcı ilk satırda yok.
export function ListGroup({ children }: { children: ReactNode }) {
  const theme = useTheme();
  const rows = Children.toArray(children);
  return (
    <Surface tone="plain" padded={false} style={styles.group}>
      {rows.map((row, i) => (
        <Fragment key={i}>
          {i > 0 && <View style={[styles.divider, { backgroundColor: theme.border }]} />}
          {row}
        </Fragment>
      ))}
    </Surface>
  );
}

const styles = StyleSheet.create({
  row: {
    minHeight: 56,
    flexDirection: 'row',
    alignItems: 'center',
    gap: Spacing.three,
    paddingHorizontal: Spacing.three,
    paddingVertical: Spacing.two,
  },
  texts: { flex: 1, minWidth: 0, gap: Spacing.half, minHeight: MinTouch, justifyContent: 'center' },
  divider: { height: Border.thin, marginLeft: Spacing.three },
  // Satır basılı zemini köşelerden taşmasın
  group: { gap: 0, overflow: 'hidden' },
});
