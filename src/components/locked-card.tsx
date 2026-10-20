import { StyleSheet, View } from 'react-native';

import { IconTile } from '@/components/icon-tile';
import { StatusChip } from '@/components/level-badge';
import { ThemedText } from '@/components/themed-text';
import { Border, Radius, Spacing } from '@/constants/theme';
import { useTheme } from '@/hooks/use-theme';

// Henüz çalışmayan özellikler için DÜRÜST yer tutucu: soluk zemin, kesikli kenar, kilit ve "Yakında".
// Bilerek ilerleme halkası/sayı/çubuk YOK; yoksa çalışıyormuş gibi görünürdü.
// Pressable değil: basılabilir gibi durup hiçbir şey yapmasın.
type LockedCardProps = {
  emoji: string;
  title: string;
  description: string;
  compact?: boolean;
};

export function LockedCard({ emoji, title, description, compact = false }: LockedCardProps) {
  const theme = useTheme();

  return (
    <View
      accessible
      accessibilityRole="text"
      accessibilityLabel={`${title}. Yakında. ${description}`}
      style={[
        styles.card,
        { backgroundColor: theme.backgroundElement, borderColor: theme.borderStrong },
      ]}>
      <IconTile emoji={emoji} size={compact ? 40 : 64} locked />
      <View style={styles.texts}>
        <View style={styles.titleRow}>
          <ThemedText type="cardTitle">{title}</ThemedText>
          <StatusChip label="Yakında" emoji="🔒" tone="neutral" />
        </View>
        <ThemedText type="small" themeColor="textSecondary">
          {description}
        </ThemedText>
      </View>
    </View>
  );
}

const styles = StyleSheet.create({
  card: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: Spacing.three,
    padding: Spacing.three,
    borderRadius: Radius.lg,
    borderWidth: Border.thick,
    borderStyle: 'dashed', // kesikli kenar yalnız kilitli öğelerde kullanılır
  },
  texts: { flex: 1, minWidth: 0, gap: Spacing.one },
  titleRow: { flexDirection: 'row', flexWrap: 'wrap', alignItems: 'center', gap: Spacing.two },
});
