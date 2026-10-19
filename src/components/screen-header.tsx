import { StyleSheet, View } from 'react-native';

import { IconTile } from '@/components/icon-tile';
import { ThemedText } from '@/components/themed-text';
import { Radius, Spacing } from '@/constants/theme';
import { HUES, type Hue } from '@/constants/visuals';
import { useTheme } from '@/hooks/use-theme';

// Sekme ekranlarının ortak başlığı: ikon + küçük üst yazı + büyük başlık + "patika" çizgisi.
type ScreenHeaderProps = {
  title: string;
  eyebrow?: string;
  emoji?: string;
  hue?: Hue;
};

export function ScreenHeader({ title, eyebrow, emoji, hue = 'accent' }: ScreenHeaderProps) {
  const theme = useTheme();

  return (
    <View style={styles.wrapper}>
      <View style={styles.row}>
        {emoji && <IconTile emoji={emoji} tone={hue} size={48} />}
        <View style={styles.texts}>
          {eyebrow && (
            <ThemedText type="eyebrow" themeColor="textSecondary">
              {eyebrow}
            </ThemedText>
          )}
          <ThemedText type="heading" accessibilityRole="header">
            {title}
          </ThemedText>
        </View>
      </View>
      {/* Süs: ince patika çizgisi, solda başlığın rengiyle kısa bir parça */}
      <View
        accessibilityElementsHidden
        importantForAccessibility="no-hide-descendants"
        style={[styles.track, { backgroundColor: theme.border }]}>
        <View style={[styles.trackFill, { backgroundColor: theme[HUES[hue].line] }]} />
      </View>
    </View>
  );
}

const styles = StyleSheet.create({
  wrapper: { gap: Spacing.two },
  row: { flexDirection: 'row', alignItems: 'center', gap: Spacing.three, paddingVertical: Spacing.two },
  texts: { flex: 1, minWidth: 0 },
  track: { height: 4, borderRadius: Radius.pill },
  trackFill: { width: 48, height: 4, borderRadius: Radius.pill },
});
