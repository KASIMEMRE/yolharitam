import { useEffect } from 'react';
import { StyleSheet, View } from 'react-native';
import Animated, {
  useAnimatedStyle,
  useReducedMotion,
  useSharedValue,
  withSequence,
  withSpring,
  withTiming,
} from 'react-native-reanimated';

import { ThemedText } from '@/components/themed-text';
import { Border, Radius, Spacing } from '@/constants/theme';
import { useTheme } from '@/hooks/use-theme';

// Onboarding'in iki adımı: 1 Konu, 2 Seviye. Veri ilerlemesi değil, sadece "neredesin" göstergesi.
// Etiket yok (yer açmak için); bilgi ekran okuyucuya accessibilityLabel ile verilir.
type StepIndicatorProps = { current: 0 | 1 };

const DOT = 24;

export function StepIndicator({ current }: StepIndicatorProps) {
  const theme = useTheme();
  const reduceMotion = useReducedMotion();
  const fill = useSharedValue(current); // bağlantı çizgisinin dolgusu 0..1
  const pop = useSharedValue(1); // 2. dairenin zıplaması

  useEffect(() => {
    // current değişince çizgi dolar / boşalır, 2. daire hafifçe büyüyüp yerine oturur
    fill.value = reduceMotion ? current : withTiming(current, { duration: 300 });
    if (!reduceMotion && current === 1) {
      pop.value = withSequence(
        withTiming(0.8, { duration: 0 }),
        withSpring(1.1, { damping: 10, stiffness: 220 }),
        withSpring(1, { damping: 10, stiffness: 220 })
      );
    }
  }, [current, reduceMotion, fill, pop]);

  const fillStyle = useAnimatedStyle(() => ({ width: 16 * fill.value }));
  const popStyle = useAnimatedStyle(() => ({ transform: [{ scale: pop.value }] }));

  return (
    <View
      accessible
      accessibilityRole="text"
      accessibilityLabel={current === 0 ? 'Adım 1 / 2: Konu seç' : 'Adım 2 / 2: Seviye seç'}
      style={styles.row}>
      {/* 1. daire: aktifken sarı (marker), bitince yeşil ✓ */}
      <View
        style={[
          styles.dot,
          current === 0
            ? { backgroundColor: theme.marker, borderColor: theme.markerEdge }
            : { backgroundColor: theme.accent, borderColor: theme.accentEdge },
        ]}>
        <ThemedText
          type="chip"
          allowFontScaling={false}
          themeColor={current === 0 ? 'onMarker' : 'onAccent'}
          style={styles.dotText}>
          {current === 0 ? '1' : '✓'}
        </ThemedText>
      </View>
      <View style={[styles.link, { backgroundColor: theme.border }]}>
        <Animated.View style={[styles.linkFill, { backgroundColor: theme.accent }, fillStyle]} />
      </View>
      <Animated.View
        style={[
          styles.dot,
          current === 1
            ? { backgroundColor: theme.marker, borderColor: theme.markerEdge }
            : { backgroundColor: theme.card, borderColor: theme.borderStrong },
          popStyle,
        ]}>
        <ThemedText
          type="chip"
          allowFontScaling={false}
          themeColor={current === 1 ? 'onMarker' : 'textSecondary'}
          style={styles.dotText}>
          2
        </ThemedText>
      </Animated.View>
    </View>
  );
}

const styles = StyleSheet.create({
  row: { flexDirection: 'row', alignItems: 'center', gap: Spacing.one },
  dot: {
    width: DOT,
    height: DOT,
    borderRadius: Radius.pill,
    borderWidth: Border.thick,
    alignItems: 'center',
    justifyContent: 'center',
  },
  dotText: { fontSize: 14, lineHeight: 16, fontWeight: 900 },
  link: { width: 16, height: 4, borderRadius: Radius.pill, overflow: 'hidden' },
  linkFill: { height: 4 },
});
