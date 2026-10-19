import { StyleSheet, View } from 'react-native';

import { ThemedText } from '@/components/themed-text';
import { Spacing } from '@/constants/theme';
import { useTheme } from '@/hooks/use-theme';

// Bir haritadaki güzergâh gibi: duraklar ve aralarındaki kesik çizgi.
// current = şu an hangi duraktayız (0'dan başlar)
type RouteStepsProps = {
  steps: string[];
  current: number;
};

export function RouteSteps({ steps, current }: RouteStepsProps) {
  const theme = useTheme();

  return (
    <View accessibilityRole="list">
      {steps.map((label, index) => {
        const isDone = index < current;
        const isCurrent = index === current;
        const isLast = index === steps.length - 1;

        return (
          <View key={label} style={styles.row} accessibilityRole="text">
            {/* Sol sütun: durak noktası + aşağı inen kesik çizgi */}
            <View style={styles.rail}>
              <View
                style={[
                  styles.stop,
                  isCurrent && { backgroundColor: theme.marker, borderColor: theme.marker },
                  isDone && { backgroundColor: theme.accent, borderColor: theme.accent },
                  !isCurrent && !isDone && { borderColor: theme.textSecondary },
                ]}
              />
              {!isLast && <View style={[styles.line, { borderColor: theme.textSecondary }]} />}
            </View>

            <ThemedText
              type={isCurrent ? 'smallBold' : 'small'}
              themeColor={isCurrent ? 'text' : 'textSecondary'}
              style={styles.label}>
              {label}
            </ThemedText>
          </View>
        );
      })}
    </View>
  );
}

const STOP = 14;

const styles = StyleSheet.create({
  row: { flexDirection: 'row', gap: Spacing.three },
  rail: { width: STOP, alignItems: 'center' },
  stop: { width: STOP, height: STOP, borderRadius: STOP / 2, borderWidth: 2 },
  line: { flex: 1, minHeight: 18, borderLeftWidth: 2, borderStyle: 'dashed', opacity: 0.5 },
  // Yazı satırı (20px) durak noktasından (14px) yüksek; ortalamak için 3px yukarı al
  label: { marginTop: -3, paddingBottom: Spacing.three },
});
