import { useEffect } from 'react';
import { StyleSheet, View } from 'react-native';
import Animated, { useAnimatedStyle, useReducedMotion, useSharedValue, withTiming } from 'react-native-reanimated';

import { ThemedText } from '@/components/themed-text';
import { Spacing } from '@/constants/theme';
import { useTheme } from '@/hooks/use-theme';

// İlerleme çubuğu (4px, düz) ve özeti: "N / M konu tamamlandı" + çubuk + kalan süre.
// Tüm sayılar GERÇEK veriden gelir (adımlar ve step_progress); burada hiçbir şey saklanmaz/uydurulmaz.
type Props = {
  done: number;
  total: number;
  remainingHours: number; // planda bitmemiş konuların tahmini saat toplamı
  weeks?: number; // (isteğe bağlı) tüm planın tahmini süresi, hafta olarak
  // compact: Yol Haritam'ın düz özet satırı için; yalnız "N / M konu" + çubuk (kalan süre ayrıntıda gösterilir)
  compact?: boolean;
};

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

export function ProgressSummary({ done, total, remainingHours, weeks, compact = false }: Props) {
  const ratio = total > 0 ? done / total : 0;
  const remainingText = remainingLabel(done, total, remainingHours, weeks);

  return (
    <View style={styles.box}>
      {compact ? (
        <ThemedText type="smallBold">
          {done} / {total} konu
        </ThemedText>
      ) : (
        <ThemedText type="cardTitle">
          {done} / {total} konu tamamlandı
        </ThemedText>
      )}
      <ProgressBar
        ratio={ratio}
        accessibilityLabel="İlerleme"
        accessibilityValue={{ min: 0, max: total, now: done, text: `${total} konunun ${done} tanesi tamamlandı` }}
      />
      {!compact && (
        <ThemedText type="small" themeColor="textSecondary">
          {remainingText}
        </ThemedText>
      )}
    </View>
  );
}

const styles = StyleSheet.create({
  box: { gap: Spacing.two },
  track: { height: 4, borderRadius: 2, overflow: 'hidden' },
  fill: { height: '100%', borderRadius: 2 },
});
