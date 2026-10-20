import { StyleSheet, Text, View } from 'react-native';

import { ThemedText } from '@/components/themed-text';
import { Border, Radius, Spacing } from '@/constants/theme';
import { useTheme } from '@/hooks/use-theme';

// Hata (warning) ve bilgi (info) kutusu. Ekran okuyucu içeriği değişince okusun diye live region.
type BannerProps = {
  tone: 'warning' | 'info';
  children: string;
};

export function Banner({ tone, children }: BannerProps) {
  const theme = useTheme();
  const warning = tone === 'warning';

  return (
    <View
      accessibilityRole="alert"
      accessibilityLiveRegion="polite"
      style={[
        styles.box,
        {
          backgroundColor: warning ? theme.warningBackground : theme.accentSoft,
          borderColor: warning ? theme.markerEdge : theme.accent,
        },
      ]}>
      {/* Emoji süs: ekran okuyucu "uyarı işareti" diye okumasın */}
      <Text
        accessibilityElementsHidden
        importantForAccessibility="no"
        allowFontScaling={false}
        style={styles.emoji}>
        {warning ? '⚠️' : '✉️'}
      </Text>
      <ThemedText type="small" style={styles.text}>
        {children}
      </ThemedText>
    </View>
  );
}

const styles = StyleSheet.create({
  box: {
    flexDirection: 'row',
    alignItems: 'flex-start',
    gap: Spacing.two,
    padding: Spacing.three,
    borderRadius: Radius.md,
    borderWidth: Border.thick,
  },
  emoji: { fontSize: 18, lineHeight: 20 },
  text: { flex: 1, minWidth: 0 },
});
