import { useEffect } from 'react';
import { StyleSheet, View } from 'react-native';
import Animated, { useAnimatedStyle, useReducedMotion, useSharedValue, withTiming } from 'react-native-reanimated';

import { ThemedText } from '@/components/themed-text';
import { Border, Radius, Spacing } from '@/constants/theme';
import { useTheme } from '@/hooks/use-theme';

// İlerleme özeti: "N / M adım tamamlandı" + ince çubuk + kalan süre.
// Tüm sayılar GERÇEK veriden gelir (adımlar ve step_progress); burada hiçbir şey saklanmaz/uydurulmaz.
type Props = {
  done: number;
  total: number;
  remainingHours: number; // tamamlanmamış adımların estimated_hours toplamı
};

export function ProgressSummary({ done, total, remainingHours }: Props) {
  const theme = useTheme();
  const reduceMotion = useReducedMotion();
  const ratio = total > 0 ? done / total : 0;

  // Çubuk genişliği yumuşakça değişir; reduce motion açıksa anında
  const fill = useSharedValue(ratio);
  useEffect(() => {
    fill.set(reduceMotion ? ratio : withTiming(ratio, { duration: 300 }));
  }, [ratio, reduceMotion, fill]);
  const fillStyle = useAnimatedStyle(() => ({ width: `${fill.value * 100}%` }));

  const hours = Math.round(remainingHours);
  const remainingText =
    done === total ? 'Tüm adımları tamamladın.' : `Kalan süre: yaklaşık ${hours} saat`;

  return (
    <View style={styles.box}>
      <ThemedText type="cardTitle">
        {done} / {total} adım tamamlandı
      </ThemedText>
      {/* Çubuk ekran okuyucuya sayısal değer verir; metin zaten yukarıda olduğu için ayrıca okunmaz */}
      <View
        accessible
        accessibilityRole="progressbar"
        accessibilityLabel="İlerleme"
        accessibilityValue={{ min: 0, max: total, now: done, text: `${total} adımın ${done} tanesi tamamlandı` }}
        style={[styles.track, { backgroundColor: theme.backgroundSelected, borderColor: theme.border }]}>
        <Animated.View style={[styles.fill, { backgroundColor: theme.accent }, fillStyle]} />
      </View>
      <ThemedText type="small" themeColor="textSecondary">
        {done === 0 ? 'İlk adımı bitirince çubuğun dolmaya başlar. ' : ''}
        {remainingText}
      </ThemedText>
    </View>
  );
}

const styles = StyleSheet.create({
  box: { gap: Spacing.two },
  track: { height: 12, borderRadius: Radius.pill, borderWidth: Border.thin, overflow: 'hidden' },
  fill: { height: '100%', borderRadius: Radius.pill },
});
