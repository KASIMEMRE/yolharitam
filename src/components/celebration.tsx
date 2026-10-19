import { useEffect, useRef } from 'react';
import { AccessibilityInfo, Modal, Pressable, StyleSheet } from 'react-native';
import Animated, {
  Easing,
  FadeIn,
  FadeInDown,
  useAnimatedStyle,
  useReducedMotion,
  useSharedValue,
  withSpring,
  withTiming,
  type SharedValue,
} from 'react-native-reanimated';

import { IconTile } from '@/components/icon-tile';
import { LevelBadge } from '@/components/level-badge';
import { ThemedText } from '@/components/themed-text';
import { Radius, Spacing } from '@/constants/theme';
import type { Hue } from '@/constants/visuals';
import { useShadow, useTheme } from '@/hooks/use-theme';

// Kısa kutlama: yol haritası BAŞARIYLA kaydedilince gösterilir (hata durumunda hiç çıkmaz).
// Konfeti için ağır kütüphane yok; 24 küçük kare/daire tek bir "progress" değeriyle hareket eder.
type CelebrationProps = {
  visible: boolean;
  emoji: string;
  hue: Hue;
  title: string;
  levelId: string;
  onDone: () => void;
};

const PARTICLE_COUNT = 24;
// Math.random yerine sabit sapma tablosu: her seferinde aynı, tahmin edilebilir görüntü
const JITTER = [0, 6, -4, 9, -7, 3];

export function Celebration({ visible, emoji, hue, title, levelId, onDone }: CelebrationProps) {
  const theme = useTheme();
  const shadow = useShadow();
  const reduceMotion = useReducedMotion();

  const backdrop = useSharedValue(0);
  const tileScale = useSharedValue(reduceMotion ? 1 : 0);
  const progress = useSharedValue(0);

  // onDone yalnız BİR kez çalışsın (hem zamanlayıcı hem dokunma tetikleyebilir)
  const doneRef = useRef(false);
  const timerRef = useRef<ReturnType<typeof setTimeout> | null>(null);
  const onDoneRef = useRef(onDone);
  useEffect(() => {
    onDoneRef.current = onDone;
  }, [onDone]);

  function finish() {
    if (doneRef.current) return;
    doneRef.current = true;
    if (timerRef.current) clearTimeout(timerRef.current);
    onDoneRef.current();
  }

  useEffect(() => {
    if (!visible) return;
    let cancelled = false;

    backdrop.value = withTiming(0.96, { duration: 150 });
    if (!reduceMotion) {
      tileScale.value = withSpring(1, { damping: 9, stiffness: 180, mass: 0.8 });
      progress.value = withTiming(1, { duration: 900, easing: Easing.out(Easing.cubic) });
    }
    AccessibilityInfo.announceForAccessibility(title);

    // Ekran okuyucu açıksa daha uzun bekle ki kullanıcı duyurusunu dinleyebilsin
    AccessibilityInfo.isScreenReaderEnabled().then((screenReader) => {
      if (cancelled) return;
      const duration = screenReader ? 2000 : reduceMotion ? 800 : 1600;
      timerRef.current = setTimeout(finish, duration);
    });

    // Ekrandan çıkılırsa zamanlayıcı takılı kalmasın
    return () => {
      cancelled = true;
      if (timerRef.current) clearTimeout(timerRef.current);
    };
    // finish ref'ler üzerinden çalıştığı için bağımlılık gerekmez
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [visible]);

  const backdropStyle = useAnimatedStyle(() => ({ opacity: backdrop.value }));
  const tileStyle = useAnimatedStyle(() => ({ transform: [{ scale: tileScale.value }] }));

  if (!visible) return null;

  const colors = [theme.accent, theme.marker, theme.sky, theme.coral, theme.violet, theme.berry, theme.leaf];

  return (
    // Modal: kutlama native başlık çubuğunu da kaplasın (normal View sadece ekran içeriğini kaplar).
    // Android geri tuşu da kutlamayı atlar.
    <Modal transparent animationType="none" statusBarTranslucent visible onRequestClose={finish}>
    <Pressable
      accessibilityRole="button"
      accessibilityLabel={`${title} Devam etmek için dokun`}
      onPress={finish}
      style={styles.overlay}>
      <Animated.View style={[StyleSheet.absoluteFill, { backgroundColor: theme.background }, backdropStyle]} />

      {!reduceMotion &&
        Array.from({ length: PARTICLE_COUNT }, (_, i) => (
          <Particle key={i} index={i} progress={progress} color={colors[i % colors.length]} />
        ))}

      <Animated.View style={[styles.center, tileStyle]}>
        {/* borderRadius IconTile 96'nın köşesiyle aynı: gölge kare görünmesin */}
        <Animated.View style={[shadow('lifted'), { borderRadius: Radius.xl }]}>
          <IconTile emoji={emoji} tone={hue} size={96} />
        </Animated.View>
      </Animated.View>

      <Animated.View
        entering={reduceMotion ? FadeIn.duration(150) : FadeInDown.duration(280).delay(250)}
        style={styles.text}>
        <ThemedText type="heading" style={styles.title}>
          {title}
        </ThemedText>
      </Animated.View>

      <Animated.View entering={FadeIn.duration(reduceMotion ? 150 : 250).delay(reduceMotion ? 0 : 400)} style={styles.badge}>
        <LevelBadge levelId={levelId} size="md" />
      </Animated.View>
    </Pressable>
    </Modal>
  );
}

// Tek konfeti parçası: merkezden dışarı uçar, hafifçe düşer, dönerken kaybolur.
function Particle({ index, progress, color }: { index: number; progress: SharedValue<number>; color: string }) {
  const angle = ((index * 15 + JITTER[index % JITTER.length]) * Math.PI) / 180;
  const distance = 110 + (index % 4) * 35;
  const size = 10 + (index % 3) * 3;
  const round = index % 2 === 0;
  const spin = index % 2 === 0 ? 360 : -360;

  const style = useAnimatedStyle(() => {
    const p = progress.value;
    return {
      opacity: p < 0.7 ? 1 : (1 - p) / 0.3,
      transform: [
        { translateX: Math.cos(angle) * distance * p },
        { translateY: Math.sin(angle) * distance * p + 70 * p * p }, // yer çekimi hissi
        { rotate: `${spin * p}deg` },
      ],
    };
  });

  return (
    <Animated.View
      pointerEvents="none"
      style={[
        styles.particle,
        { width: size, height: size, borderRadius: round ? size / 2 : 2, backgroundColor: color },
        style,
      ]}
    />
  );
}

const styles = StyleSheet.create({
  overlay: { position: 'absolute', top: 0, left: 0, right: 0, bottom: 0, alignItems: 'center', justifyContent: 'center', overflow: 'hidden', gap: Spacing.three },
  center: { alignItems: 'center', justifyContent: 'center' },
  text: { paddingHorizontal: Spacing.four },
  title: { textAlign: 'center', maxWidth: 320 },
  badge: { alignItems: 'center' },
  particle: { position: 'absolute', left: '50%', top: '42%' },
});
