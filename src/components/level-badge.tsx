import { StyleSheet, Text, View } from 'react-native';

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
          backgroundColor: theme.card,
          borderColor: theme.borderStrong,
          paddingVertical: md ? Spacing.two : Spacing.one,
          paddingHorizontal: md ? Spacing.three : Spacing.two,
        },
      ]}>
      <Text allowFontScaling={false} style={{ fontSize: md ? 18 : 14, lineHeight: md ? 22 : 18 }}>
        {style.emoji}
      </Text>
      <ThemedText type="chip" maxFontSizeMultiplier={1.3}>
        {title}
      </ThemedText>
    </View>
  );
}

// "Yakında" gibi durum etiketleri için küçük çip (LevelBadge ile aynı biçim).
type StatusChipProps = {
  label: string;
  emoji?: string;
  tone: 'marker' | 'neutral';
};

export function StatusChip({ label, emoji, tone }: StatusChipProps) {
  const theme = useTheme();
  const marker = tone === 'marker';
  return (
    <View
      style={[
        styles.chip,
        {
          backgroundColor: marker ? theme.markerSoft : theme.backgroundSelected,
          borderColor: marker ? theme.markerEdge : theme.borderStrong,
          paddingVertical: Spacing.one,
          paddingHorizontal: Spacing.two,
        },
      ]}>
      {emoji && (
        <Text allowFontScaling={false} style={styles.emoji}>
          {emoji}
        </Text>
      )}
      <ThemedText type="chip" themeColor={marker ? 'markerInk' : 'text'} maxFontSizeMultiplier={1.3}>
        {label}
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
    borderRadius: Radius.pill,
    borderWidth: Border.thick,
  },
  emoji: { fontSize: 14, lineHeight: 18 },
});
