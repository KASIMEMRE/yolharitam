import { StyleSheet, View } from 'react-native';

import { Glyph } from '@/components/icon';

import { ThemedText } from '@/components/themed-text';
import { LEVELS } from '@/constants/onboarding';
import { Border, Radius, Spacing } from '@/constants/theme';
import { LEVEL_STYLE } from '@/constants/visuals';
import { useTheme } from '@/hooks/use-theme';

// Seçilmiş seviyeyi gösteren küçük rozet. Nötr renkli (renk yalnız kategoriye ait).
// Bilinmeyen seviye id'si gelirse hiçbir şey çizilmez (çökmesin).
// Not: "kazandın / seviye atladın" dili yok; bu sadece kullanıcının SEÇTİĞİ seviye.
type LevelBadgeProps = {
  levelId?: string | null;
  size?: 'sm' | 'md';
};

export function LevelBadge({ levelId, size = 'sm' }: LevelBadgeProps) {
  const theme = useTheme();
  const style = levelId ? LEVEL_STYLE[levelId] : undefined;
  const title = LEVELS.find((l) => l.id === levelId)?.title;
  if (!style || !title) return null;

  const md = size === 'md';
  return (
    <View
      accessible
      accessibilityRole="text"
      accessibilityLabel={`Seviye: ${title}`}
      style={[
        styles.chip,
        {
          backgroundColor: theme.backgroundElement,
          borderColor: 'transparent',
          paddingVertical: md ? Spacing.two : Spacing.one,
          paddingHorizontal: md ? Spacing.three : Spacing.two,
        },
      ]}>
      <Glyph emoji={style.emoji} size={md ? 18 : 14} color={theme.textSecondary} strokeWidth={2.25} />
      <ThemedText type="chip" themeColor="textSecondary" maxFontSizeMultiplier={1.3}>
        {title}
      </ThemedText>
    </View>
  );
}

const styles = StyleSheet.create({
  chip: {
    flexDirection: 'row',
    alignItems: 'center',
    alignSelf: 'flex-start',
    gap: Spacing.one,
    borderRadius: Radius.sm,
    borderWidth: Border.thin,
  },
});
