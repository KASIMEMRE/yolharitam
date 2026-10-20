import { useEffect } from 'react';
import { StyleSheet, useWindowDimensions, View } from 'react-native';
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

// Onboarding'in üç adımı: 1 Konu, 2 Seviye, 3 Sorular. Veri ilerlemesi değil, sadece "neredesin" göstergesi.
// Etiket yok (yer açmak için); bilgi ekran okuyucuya accessibilityLabel ile verilir.
type StepIndicatorProps = { current: 0 | 1 | 2 };

const DOT = 24;
const LABELS = ['Konu seç', 'Seviye seç', 'Sorular'];

export function StepIndicator({ current }: StepIndicatorProps) {
  const theme = useTheme();
  const reduceMotion = useReducedMotion();
  const { width } = useWindowDimensions();
  // Dar ekranda (320) bağlantılar kısalır, üç daire yine de yan yana sığar.
  const linkWidth = width < 360 ? 8 : 16;

  // İki bağlantı çizgisi: her birinin dolgusu 0..1 (1 = o adıma ulaşıldı)
  const fill1 = useSharedValue(current >= 1 ? 1 : 0);
  const fill2 = useSharedValue(current >= 2 ? 1 : 0);
  // Yeni etkin olan dairenin zıplaması (2. ve 3. daire için ayrı değer)
  const pop2 = useSharedValue(1);
  const pop3 = useSharedValue(1);

  useEffect(() => {
    // current değişince çizgiler dolar / boşalır, yeni daire hafifçe büyüyüp yerine oturur
    fill1.set(reduceMotion ? (current >= 1 ? 1 : 0) : withTiming(current >= 1 ? 1 : 0, { duration: 300 }));
    fill2.set(reduceMotion ? (current >= 2 ? 1 : 0) : withTiming(current >= 2 ? 1 : 0, { duration: 300 }));
    if (!reduceMotion && current > 0) {
      const target = current === 1 ? pop2 : pop3;
      target.set(withSequence(
        withTiming(0.8, { duration: 0 }),
        withSpring(1.1, { damping: 10, stiffness: 220 }),
        withSpring(1, { damping: 10, stiffness: 220 })
      ));
    }
  }, [current, reduceMotion, fill1, fill2, pop2, pop3]);

  const fill1Style = useAnimatedStyle(() => ({ width: linkWidth * fill1.value }));
  const fill2Style = useAnimatedStyle(() => ({ width: linkWidth * fill2.value }));
  const pop2Style = useAnimatedStyle(() => ({ transform: [{ scale: pop2.value }] }));
  const pop3Style = useAnimatedStyle(() => ({ transform: [{ scale: pop3.value }] }));

  // Bir dairenin görünümü: etkin = sarı (marker), bitmiş = yeşil ✓, bekleyen = nötr
  function dotLook(index: number) {
    if (index === current) {
      return { backgroundColor: theme.marker, borderColor: theme.markerEdge, text: String(index + 1), color: 'onMarker' as const };
    }
    if (index < current) {
      return { backgroundColor: theme.accent, borderColor: theme.accentEdge, text: '✓', color: 'onAccent' as const };
    }
    return { backgroundColor: theme.card, borderColor: theme.borderStrong, text: String(index + 1), color: 'textSecondary' as const };
  }

  const dots = [0, 1, 2].map((i) => ({ look: dotLook(i), style: i === 1 ? pop2Style : i === 2 ? pop3Style : undefined }));

  return (
    <View
      accessible
      accessibilityRole="text"
      accessibilityLabel={`Adım ${current + 1} / 3: ${LABELS[current]}`}
      style={styles.row}>
      {dots.map((dot, i) => (
        <View key={i} style={styles.row}>
          {i > 0 && (
            <View style={[styles.link, { width: linkWidth, backgroundColor: theme.border }]}>
              <Animated.View style={[styles.linkFill, { backgroundColor: theme.accent }, i === 1 ? fill1Style : fill2Style]} />
            </View>
          )}
          <Animated.View
            style={[styles.dot, { backgroundColor: dot.look.backgroundColor, borderColor: dot.look.borderColor }, dot.style]}>
            <ThemedText type="chip" allowFontScaling={false} themeColor={dot.look.color} style={styles.dotText}>
              {dot.look.text}
            </ThemedText>
          </Animated.View>
        </View>
      ))}
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
  link: { height: 4, borderRadius: Radius.pill, overflow: 'hidden' },
  linkFill: { height: 4 },
});
