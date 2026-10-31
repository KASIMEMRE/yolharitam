import { StyleSheet, View } from 'react-native';

import { Glyph } from '@/components/icon';

import { ThemedText } from '@/components/themed-text';
import { Border, Radius, Spacing } from '@/constants/theme';
import { useTheme } from '@/hooks/use-theme';

// Hata (warning), bilgi (info) ve başarı (success) kutusu. Ekran okuyucu içeriği değişince okusun diye live region.
type BannerProps = {
  tone: 'warning' | 'info' | 'success';
  children: string;
};

export function Banner({ tone, children }: BannerProps) {
  const theme = useTheme();
  const warning = tone === 'warning';
  const success = tone === 'success';

  return (
    <View
      // Başarı "alert" (acil uyarı) gibi okunmasın; yalnız live region yeter
      accessibilityRole={success ? undefined : 'alert'}
      accessibilityLiveRegion="polite"
      style={[
        styles.box,
        {
          backgroundColor: warning ? theme.warningBackground : theme.accentSoft,
          borderColor: warning ? theme.markerEdge : theme.accent,
        },
      ]}>
      {/* Simge süs: ekran okuyucu "uyarı işareti" diye okumasın (Glyph kendini gizler) */}
      <View style={styles.icon}>
        <Glyph
          emoji={warning ? '⚠️' : success ? '✅' : 'ℹ️'}
          size={18}
          color={warning ? theme.markerInk : theme.accentInk}
          strokeWidth={2.25}
        />
      </View>
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
  icon: { paddingTop: 1 },
  text: { flex: 1, minWidth: 0 },
});
