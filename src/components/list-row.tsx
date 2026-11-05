import { Children, Fragment, type ReactNode } from 'react';
import { Pressable, StyleSheet, View } from 'react-native';

import { Glyph } from '@/components/icon';
import { ThemedText } from '@/components/themed-text';
import { Border, MinTouch, Radius, Spacing } from '@/constants/theme';
import { HUES, type Hue } from '@/constants/visuals';
import { useTheme } from '@/hooks/use-theme';

// Liste satırı: tekrar eden öğeler (ayarlar, haritalarım, kaynaklar) kart yığını yerine bu satırla dizilir.
// Solda isteğe bağlı: `icon` (emoji adı, icon.tsx) kutusuz 20px textSecondary çizgi simge,
// ya da `dot` (harita rengi) 10px nokta. Renkli kutulu simge YOK.
type ListRowProps = {
  left?: ReactNode; // solda özel öğe (ör. lig sırası/madalya); simge yerine geçer
  icon?: string;
  dot?: Hue; // harita kimliği için 10px renk noktası
  title: string;
  subtitle?: string;
  subtitleLines?: number; // uzun, boşluksuz alt yazı (e-posta) için: orta kısaltma ile tek satır
  right?: ReactNode; // sağda rozet / değer / düğme
  chevron?: boolean; // sağda ">" oku
  onPress?: () => void;
  destructive?: boolean; // yıkıcı eylem (ör. Çıkış yap): coral yazı
  accessibilityLabel?: string;
};

export function ListRow({
  left,
  icon,
  dot,
  title,
  subtitle,
  subtitleLines,
  right,
  chevron = false,
  onPress,
  destructive = false,
  accessibilityLabel,
}: ListRowProps) {
  const theme = useTheme();
  const ink = destructive ? 'coralInk' : 'text';

  const body = (pressed: boolean) => (
    <View style={[styles.row, pressed && { backgroundColor: theme.backgroundElement, borderRadius: Radius.sm }]}>
      {left}
      {dot && <View style={[styles.dot, { backgroundColor: theme[HUES[dot].line] }]} />}
      {icon && !dot && <Glyph emoji={icon} size={20} color={destructive ? theme.coralInk : theme.textSecondary} />}
      <View style={styles.texts}>
        <ThemedText type="defaultSemiBold" themeColor={ink} style={styles.title}>
          {title}
        </ThemedText>
        {subtitle ? (
          <ThemedText type="small" themeColor="textSecondary" numberOfLines={subtitleLines} ellipsizeMode="middle">
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

// Satırları kutusuz, ince ayırıcı çizgilerle dizer. Ayırıcı ilk satırda yok.
export function ListGroup({ children }: { children: ReactNode }) {
  const theme = useTheme();
  const rows = Children.toArray(children);
  return (
    <View>
      {rows.map((row, i) => (
        <Fragment key={i}>
          {i > 0 && <View style={[styles.divider, { backgroundColor: theme.border }]} />}
          {row}
        </Fragment>
      ))}
    </View>
  );
}

const styles = StyleSheet.create({
  row: {
    minHeight: 56,
    flexDirection: 'row',
    alignItems: 'center',
    gap: Spacing.three,
    paddingVertical: Spacing.two,
  },
  title: { fontSize: 15, lineHeight: 22 },
  dot: { width: 10, height: 10, borderRadius: 5 },
  texts: { flex: 1, minWidth: 0, gap: Spacing.half, minHeight: MinTouch, justifyContent: 'center' },
  divider: { height: Border.thin },
});
