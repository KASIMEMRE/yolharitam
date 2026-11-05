import { useEffect } from 'react';
import { StyleSheet, View } from 'react-native';
import Animated, { useAnimatedStyle, useReducedMotion, useSharedValue, withTiming } from 'react-native-reanimated';

import { useTheme } from '@/hooks/use-theme';

// Kalan süre cümlesi: özet satırının açılan ayrıntısı da aynı metni kullansın diye dışarı açıldı
export function remainingLabel(done: number, total: number, remainingHours: number, weeks?: number) {
  const hours = Math.round(remainingHours);
  if (done === total) return 'Planındaki tüm konuları bitirdin.';
  return `Kalan süre: yaklaşık ${hours} saat${weeks ? ` · plan yaklaşık ${weeks} hafta` : ''}`;
}

// 4px ince ilerleme çubuğu: bölüm satırları, haftalık hedef, seviye ve özet aynı çubuğu kullanır.
// `accessibilityLabel` verilmezse çubuk süstür (yanındaki metin zaten söylüyor) ve ekran okuyucudan gizlenir.
export function ProgressBar({
  ratio,
  color,
  accessibilityLabel,
  accessibilityValue,
}: {
  ratio: number; // 0-1
  color?: string; // verilmezse mürekkep (accent)
  accessibilityLabel?: string;
  accessibilityValue?: { min: number; max: number; now: number; text: string };
}) {
  const theme = useTheme();
  const reduceMotion = useReducedMotion();
  const clamped = Math.max(0, Math.min(1, ratio));

  // Çubuk genişliği yumuşakça değişir; reduce motion açıksa anında
  const fill = useSharedValue(clamped);
  useEffect(() => {
    fill.set(reduceMotion ? clamped : withTiming(clamped, { duration: 300 }));
  }, [clamped, reduceMotion, fill]);
  const fillStyle = useAnimatedStyle(() => ({ width: `${fill.value * 100}%` }));

  const a11y = accessibilityLabel
    ? { accessible: true, accessibilityRole: 'progressbar' as const, accessibilityLabel, accessibilityValue }
    : { accessible: false, importantForAccessibility: 'no-hide-descendants' as const };

  return (
    <View {...a11y} style={[styles.track, { backgroundColor: theme.backgroundSelected }]}>
      <Animated.View style={[styles.fill, { backgroundColor: color ?? theme.accent }, fillStyle]} />
    </View>
  );
}

const styles = StyleSheet.create({
  track: { height: 4, borderRadius: 2, overflow: 'hidden' },
  fill: { height: '100%', borderRadius: 2 },
});
