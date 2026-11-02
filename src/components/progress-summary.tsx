import { useEffect } from 'react';
import { StyleSheet, View } from 'react-native';
import Animated, { useAnimatedStyle, useReducedMotion, useSharedValue, withTiming } from 'react-native-reanimated';

import { ThemedText } from '@/components/themed-text';
import { Border, Radius, Spacing } from '@/constants/theme';
import { useTheme } from '@/hooks/use-theme';

// İlerleme özeti: "N / M konu tamamlandı" + ince çubuk + kalan süre.
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

export function ProgressSummary({ done, total, remainingHours, weeks, compact = false }: Props) {
  const theme = useTheme();
  const reduceMotion = useReducedMotion();
  const ratio = total > 0 ? done / total : 0;

  // Çubuk genişliği yumuşakça değişir; reduce motion açıksa anında
  const fill = useSharedValue(ratio);
  useEffect(() => {
    fill.set(reduceMotion ? ratio : withTiming(ratio, { duration: 300 }));
  }, [ratio, reduceMotion, fill]);
  const fillStyle = useAnimatedStyle(() => ({ width: `${fill.value * 100}%` }));

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
      {/* Çubuk ekran okuyucuya sayısal değer verir; metin zaten yukarıda olduğu için ayrıca okunmaz */}
      <View
        accessible
        accessibilityRole="progressbar"
        accessibilityLabel="İlerleme"
        accessibilityValue={{ min: 0, max: total, now: done, text: `${total} konunun ${done} tanesi tamamlandı` }}
        style={[styles.track, compact && styles.trackThin, { backgroundColor: theme.backgroundSelected, borderColor: theme.border }]}>
        <Animated.View style={[styles.fill, { backgroundColor: theme.accent }, fillStyle]} />
      </View>
      {!compact && (
        <ThemedText type="small" themeColor="textSecondary">
          {done === 0 ? 'İlk konuyu bitirince çubuğun dolmaya başlar. ' : ''}
          {remainingText}
        </ThemedText>
      )}
    </View>
  );
}

const styles = StyleSheet.create({
  box: { gap: Spacing.two },
  track: { height: 12, borderRadius: Radius.pill, borderWidth: Border.thin, overflow: 'hidden' },
  trackThin: { height: 8 },
  fill: { height: '100%', borderRadius: Radius.pill },
});
