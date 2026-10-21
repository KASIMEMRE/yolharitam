import { useEffect, useState } from 'react';
import { Modal, Platform, Share, StyleSheet, Text, useWindowDimensions, View } from 'react-native';
import Animated, {
  Easing,
  FadeIn,
  useAnimatedStyle,
  useReducedMotion,
  useSharedValue,
  withDelay,
  withTiming,
  ZoomIn,
} from 'react-native-reanimated';

import { Button } from '@/components/button';
import { ThemedText } from '@/components/themed-text';
import type { DevRoadmap } from '@/constants/dev-roadmaps';
import { Border, Radius, Spacing } from '@/constants/theme';
import { HUES } from '@/constants/visuals';
import { useTheme } from '@/hooks/use-theme';

export type Milestone = {
  kind: 'section' | 'roadmap';
  title: string; // bölüm adı ya da harita adı
  emoji: string;
  percent: number; // haritanın yüzde kaçı bitti
  xp: number; // bu anda kazanılan toplam XP
};

// Bölüm ya da harita bitince açılan kutlama: konfeti + paylaşılabilir ilerleme kartı.
// Paylaşım metin olarak yapılır (telefonun paylaş menüsü); kart ekranda durur, istersen ekran görüntüsü alırsın.
export function MilestoneCelebration({
  milestone,
  map,
  onClose,
}: {
  milestone: Milestone | null;
  map: DevRoadmap;
  onClose: () => void;
}) {
  const theme = useTheme();
  const hue = HUES[map.hue];
  const [shareNote, setShareNote] = useState<string | null>(null);

  if (!milestone) return null;
  const isRoadmap = milestone.kind === 'roadmap';
  const headline = isRoadmap ? 'Haritayı tamamladın!' : 'Bölüm tamam!';
  const message = isRoadmap
    ? `${map.title} yol haritasını baştan sona tamamladım! 🏁`
    : `${map.title} yol haritasında “${milestone.title}” bölümünü bitirdim. Yolun %${milestone.percent}'i geride! 🚀`;

  async function share() {
    const text = `${message}\n\nYol Haritam ile öğreniyorum.`;
    setShareNote(null);
    try {
      await Share.share({ message: text });
    } catch {
      // Web'de paylaş menüsü yoksa panoya kopyala
      if (Platform.OS === 'web' && typeof navigator !== 'undefined' && navigator.clipboard) {
        await navigator.clipboard.writeText(text);
        setShareNote('Metin panoya kopyalandı; istediğin yere yapıştırabilirsin.');
      } else {
        setShareNote('Paylaşılamadı.');
      }
    }
  }

  return (
    <Modal transparent animationType="fade" visible onRequestClose={onClose}>
      <View style={[styles.backdrop, { backgroundColor: 'rgba(0,0,0,0.55)' }]}>
        <Confetti />
        <Animated.View
          entering={ZoomIn.springify().damping(12)}
          accessibilityViewIsModal
          style={[styles.sheet, { backgroundColor: theme.background, borderColor: theme[hue.line] }]}>
          {/* Paylaşılabilir kart */}
          <View style={[styles.card, { backgroundColor: theme[hue.soft], borderColor: theme[hue.line] }]}>
            <Text allowFontScaling={false} style={styles.bigEmoji}>
              {isRoadmap ? '🏆' : milestone.emoji}
            </Text>
            <ThemedText type="eyebrow" themeColor={hue.ink}>
              {map.emoji} {map.title}
            </ThemedText>
            <ThemedText type="heading" style={styles.center} accessibilityRole="header">
              {headline}
            </ThemedText>
            {!isRoadmap && (
              <ThemedText style={styles.center}>“{milestone.title}” bölümünü bitirdin.</ThemedText>
            )}
            <ProgressRing percent={milestone.percent} />
            <ThemedText type="smallBold" themeColor={hue.ink}>
              {`Yolun %${milestone.percent}'i geride`}
            </ThemedText>
            {milestone.xp > 0 && (
              <View style={[styles.xpPill, { backgroundColor: theme.markerSoft, borderColor: theme.markerEdge }]}>
                <ThemedText type="smallBold" themeColor="markerInk">
                  ⭐ +{milestone.xp} XP
                </ThemedText>
              </View>
            )}
            <ThemedText type="small" themeColor="textSecondary">
              Yol Haritam
            </ThemedText>
          </View>

          {shareNote && (
            <ThemedText type="small" themeColor="textSecondary" style={styles.center}>
              {shareNote}
            </ThemedText>
          )}
          <Button icon="📣" label="Paylaş" onPress={share} />
          <Button variant="text" label="Devam et" onPress={onClose} />
        </Animated.View>
      </View>
    </Modal>
  );
}

// Basit yüzde göstergesi: dolan yatay çubuk (halka çizimi için SVG gerekmesin)
function ProgressRing({ percent }: { percent: number }) {
  const theme = useTheme();
  const reduceMotion = useReducedMotion();
  const width = useSharedValue(reduceMotion ? percent : 0);
  useEffect(() => {
    if (!reduceMotion) width.set(withDelay(250, withTiming(percent, { duration: 700 })));
  }, [percent, reduceMotion, width]);
  const style = useAnimatedStyle(() => ({ width: `${width.value}%` }));
  return (
    <View
      accessibilityRole="progressbar"
      accessibilityValue={{ min: 0, max: 100, now: percent }}
      style={[styles.track, { backgroundColor: theme.card, borderColor: theme.border }]}>
      <Animated.View style={[styles.fill, { backgroundColor: theme.accent }, style]} />
    </View>
  );
}

// Konfeti: sabit tablolu parçalar (her seferinde aynı, tahmin edilebilir), yukarıdan düşer.
// "Hareketi azalt" açıksa hiç gösterilmez.
const PIECES = ['🎉', '✨', '⭐', '🟩', '🟨', '🎊', '✨', '🟦', '⭐', '🎉', '🟥', '✨', '🎊', '🟩'];
const OFFSETS = [0.05, 0.14, 0.22, 0.3, 0.38, 0.46, 0.54, 0.6, 0.68, 0.75, 0.82, 0.9, 0.95, 0.42];
const DELAYS = [0, 120, 60, 200, 40, 160, 90, 240, 10, 180, 70, 130, 220, 100];

function Confetti() {
  const reduceMotion = useReducedMotion();
  const { width, height } = useWindowDimensions();
  if (reduceMotion) return null;
  return (
    <View pointerEvents="none" style={StyleSheet.absoluteFill}>
      {PIECES.map((p, i) => (
        <Piece key={i} emoji={p} x={OFFSETS[i] * width} delay={DELAYS[i]} fall={height * 0.9} spin={i % 2 ? 1 : -1} />
      ))}
    </View>
  );
}

function Piece({ emoji, x, delay, fall, spin }: { emoji: string; x: number; delay: number; fall: number; spin: number }) {
  const t = useSharedValue(0);
  useEffect(() => {
    t.set(withDelay(delay, withTiming(1, { duration: 1800, easing: Easing.out(Easing.quad) })));
  }, [delay, t]);
  const style = useAnimatedStyle(() => ({
    transform: [{ translateY: -40 + t.value * fall }, { rotate: `${t.value * 360 * spin}deg` }],
    opacity: 1 - Math.max(0, t.value - 0.75) * 4,
  }));
  return (
    <Animated.Text entering={FadeIn} allowFontScaling={false} style={[styles.piece, { left: x }, style]}>
      {emoji}
    </Animated.Text>
  );
}

const styles = StyleSheet.create({
  backdrop: { flex: 1, alignItems: 'center', justifyContent: 'center', padding: Spacing.four },
  sheet: {
    width: '100%',
    maxWidth: 380,
    gap: Spacing.three,
    padding: Spacing.three,
    borderRadius: Radius.xl,
    borderWidth: Border.thick,
  },
  card: {
    alignItems: 'center',
    gap: Spacing.two,
    padding: Spacing.four,
    borderRadius: Radius.lg,
    borderWidth: Border.thick,
  },
  bigEmoji: { fontSize: 56, lineHeight: 66 },
  center: { textAlign: 'center' },
  track: { width: '100%', height: 14, borderRadius: Radius.pill, borderWidth: Border.thin, overflow: 'hidden' },
  fill: { height: '100%', borderRadius: Radius.pill },
  xpPill: { paddingVertical: Spacing.one, paddingHorizontal: Spacing.three, borderRadius: Radius.pill, borderWidth: Border.thick },
  piece: { position: 'absolute', top: 0, fontSize: 24 },
});
