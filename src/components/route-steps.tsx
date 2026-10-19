import { useEffect, useRef, useState } from 'react';
import { StyleSheet, Text, useWindowDimensions, View } from 'react-native';
import Animated, {
  FadeIn,
  ZoomIn,
  useAnimatedStyle,
  useReducedMotion,
  useSharedValue,
  withDelay,
  withSequence,
  withSpring,
  withTiming,
} from 'react-native-reanimated';

import { ThemedText } from '@/components/themed-text';
import { Border, Radius, Spacing } from '@/constants/theme';
import { useTheme } from '@/hooks/use-theme';

// TrailMap: uygulamanın imzası olan "patika" çizimi. Duraklar ve aralarındaki noktalar,
// sadece View ile çizilir (SVG ya da ek paket yok). İki biçimi var:
//  - vertical: karşılama ekranında zikzaklı dikey patika
//  - horizontal: giriş ekranında küçük yatay patika; aktif durak (sarı) adımlar arasında kayar
// Duraklar gerçek 3 adımdır; sayı/yüzde gibi ilerleme iddiası yoktur.
export type TrailStop = { emoji: string; label: string };

type TrailMapProps = {
  stops: TrailStop[];
  current: number; // şu an hangi durak (0'dan başlar)
  variant?: 'vertical' | 'horizontal';
  caption?: boolean; // yatayda aktif adımın adını altta göster
  // false ise geçilmiş duraklar ✓ yapılmaz (giriş ekranında: bir şey TAMAMLANMIŞ gibi görünmesin)
  showDone?: boolean;
};

const OFFSETS = [-72, 56, -40]; // zikzak için her durağın yatay kayması
const TOP_PAD = 28; // 📍 pininin düşeceği boşluk

export function TrailMap({ stops, current, variant = 'vertical', caption = true, showDone = true }: TrailMapProps) {
  return variant === 'vertical' ? (
    <VerticalTrail stops={stops} current={current} />
  ) : (
    <HorizontalTrail stops={stops} current={current} caption={caption} showDone={showDone} />
  );
}
// Eski adla da kullanılabilsin (ürün belgesi "RouteSteps" diyor)
export { TrailMap as RouteSteps };

// Ekran okuyucu için tek cümlelik özet
function summary(stops: TrailStop[], current: number) {
  return (
    'Yolculuk adımları: ' +
    stops.map((s, i) => `${i + 1}. ${s.label}${i === current ? ', şu an' : ''}`).join('; ')
  );
}

function VerticalTrail({ stops, current }: { stops: TrailStop[]; current: number }) {
  const theme = useTheme();
  const reduceMotion = useReducedMotion();
  const { height, fontScale } = useWindowDimensions();
  const [W, setW] = useState(0);

  // Küçük ekranda (yükseklik < 700) her şey biraz küçülür
  const compact = height < 700;
  const STOP = compact ? 48 : 64;
  const GAP = compact ? 36 : 56;
  const emojiSize = compact ? 22 : 28;
  const N = stops.length;
  const totalHeight = TOP_PAD + N * STOP + (N - 1) * GAP + Spacing.two;

  // Dar ekranda zikzak genişliğini küçült ki duraklar taşmasın; büyük yazıda iyice daralt
  const s = fontScale > 1.3 ? 0.5 : Math.max(0, Math.min(1, (W / 2 - STOP / 2 - Spacing.two) / 72));
  const centers = stops.map((_, i) => ({
    x: W / 2 + OFFSETS[i % OFFSETS.length] * s,
    y: TOP_PAD + i * (STOP + GAP) + STOP / 2,
  }));

  // 📍 pin: yukarıdan düşer. Halka: aktif durakta bir kez nabız atar.
  const pinY = useSharedValue(reduceMotion ? 0 : -32);
  const pinOpacity = useSharedValue(reduceMotion ? 1 : 0);
  const pulse = useSharedValue(1);
  useEffect(() => {
    if (W === 0 || reduceMotion) return;
    pinOpacity.value = withDelay(300, withTiming(1, { duration: 120 }));
    pinY.value = withDelay(300, withSpring(0, { damping: 8, stiffness: 220 }));
    pulse.value = withDelay(550, withSequence(withTiming(1.15, { duration: 150 }), withTiming(1, { duration: 150 })));
  }, [W, reduceMotion, pinY, pinOpacity, pulse]);
  const pinStyle = useAnimatedStyle(() => ({
    opacity: pinOpacity.value,
    transform: [{ translateY: pinY.value }],
  }));
  const haloStyle = useAnimatedStyle(() => ({ transform: [{ scale: pulse.value }] }));

  // Duraklar arası 5 nokta: durağın kenarından biraz içeride başlar/biter
  const dots: { x: number; y: number; done: boolean; key: string }[] = [];
  for (let i = 0; i < N - 1 && W > 0; i++) {
    const a = centers[i];
    const b = centers[i + 1];
    const dist = Math.hypot(b.x - a.x, b.y - a.y);
    const ux = (b.x - a.x) / dist;
    const uy = (b.y - a.y) / dist;
    // +8: noktalar aktif durağın dış halkasına (6px) değmesin
    const margin = STOP / 2 + 8;
    const sx = a.x + ux * margin;
    const sy = a.y + uy * margin;
    const ex = b.x - ux * margin;
    const ey = b.y - uy * margin;
    for (let k = 0; k < 5; k++) {
      dots.push({ x: sx + ((ex - sx) * k) / 4, y: sy + ((ey - sy) * k) / 4, done: i < current, key: `${i}-${k}` });
    }
  }

  return (
    <View
      accessible
      accessibilityRole="text"
      accessibilityLabel={summary(stops, current)}
      style={[styles.vertical, { height: totalHeight }]}
      onLayout={(e) => setW(e.nativeEvent.layout.width)}>
      {/* Çocuklar ekran okuyucudan gizli: özet cümle zaten hepsini söylüyor */}
      <View
        importantForAccessibility="no-hide-descendants"
        accessibilityElementsHidden
        style={StyleSheet.absoluteFill}>
        {W > 0 &&
          dots.map((d, idx) => (
            <Animated.View
              key={d.key}
              entering={FadeIn.delay(reduceMotion ? 0 : 300 + idx * 40).duration(reduceMotion ? 150 : 200)}
              style={[
                styles.dot8,
                { left: d.x - 4, top: d.y - 4, backgroundColor: d.done ? theme.accent : theme.borderStrong },
              ]}
            />
          ))}

        {W > 0 &&
          stops.map((stop, i) => {
            const c = centers[i];
            const isCurrent = i === current;
            const isDone = i < current;
            const onLeft = OFFSETS[i % OFFSETS.length] < 0; // soldaysa etiket sağında
            let labelLeft: number;
            let labelWidth: number;
            if (onLeft) {
              labelLeft = c.x + STOP / 2 + 12;
              labelWidth = Math.min(140, W - labelLeft);
            } else {
              const rightEdge = c.x - STOP / 2 - 12;
              labelWidth = Math.min(140, rightEdge);
              labelLeft = rightEdge - labelWidth;
            }

            return (
              <View key={stop.label} style={StyleSheet.absoluteFill}>
                <Animated.View
                  entering={reduceMotion ? FadeIn.duration(150) : ZoomIn.springify().damping(11).delay(i * 150)}
                  style={{ position: 'absolute', left: c.x - STOP / 2, top: c.y - STOP / 2, width: STOP, height: STOP }}>
                  {isCurrent && (
                    <Animated.View
                      style={[
                        styles.halo,
                        { left: -6, top: -6, width: STOP + 12, height: STOP + 12, backgroundColor: theme.markerSoft },
                        haloStyle,
                      ]}
                    />
                  )}
                  <View
                    style={[
                      styles.stop,
                      { width: STOP, height: STOP },
                      isCurrent && { backgroundColor: theme.marker, borderColor: theme.markerEdge },
                      isDone && { backgroundColor: theme.accent, borderColor: theme.accentEdge },
                      !isCurrent && !isDone && { backgroundColor: theme.card, borderColor: theme.borderStrong },
                    ]}>
                    <Text
                      allowFontScaling={false}
                      style={
                        isDone
                          ? { fontSize: 24, fontWeight: 900, color: theme.onAccent }
                          : { fontSize: emojiSize, lineHeight: emojiSize + 6 }
                      }>
                      {isDone ? '✓' : stop.emoji}
                    </Text>
                  </View>
                </Animated.View>

                <View
                  style={[
                    styles.vLabel,
                    { top: c.y - 22, left: labelLeft, width: labelWidth, alignItems: onLeft ? 'flex-start' : 'flex-end' },
                  ]}>
                  <ThemedText
                    type={isCurrent ? 'cardTitle' : 'smallBold'}
                    themeColor={isCurrent ? 'text' : 'textSecondary'}
                    style={{ textAlign: onLeft ? 'left' : 'right' }}>
                    {stop.label}
                  </ThemedText>
                </View>
              </View>
            );
          })}

        {W > 0 && centers[current] && (
          <Animated.Text
            allowFontScaling={false}
            style={[
              styles.pin,
              { left: centers[current].x + STOP / 2 - 14, top: centers[current].y - STOP / 2 - 30 },
              pinStyle,
            ]}>
            📍
          </Animated.Text>
        )}
      </View>
    </View>
  );
}

function HorizontalTrail({
  stops,
  current,
  caption,
  showDone,
}: {
  stops: TrailStop[];
  current: number;
  caption: boolean;
  showDone: boolean;
}) {
  const theme = useTheme();
  const reduceMotion = useReducedMotion();
  const [W, setW] = useState(0);
  const STOP = 36;
  const HALO = 6;
  const N = stops.length;
  const step = N > 1 ? (W - STOP - 2 * HALO) / (N - 1) : 0;
  const xs = stops.map((_, i) => HALO + i * step);

  // Sarı "işaret" durakların ALTINDA durur ve mod değişince yaylanarak yeni durağa kayar.
  const markerX = useSharedValue(0);
  const placed = useRef(false);
  const target = (xs[current] ?? HALO) - HALO;
  useEffect(() => {
    if (W === 0) return;
    if (!placed.current || reduceMotion) {
      markerX.value = target; // ilk çizimde animasyonsuz doğrudan yerine
      placed.current = true;
    } else {
      markerX.value = withSpring(target, { damping: 16, stiffness: 260, mass: 0.8 });
    }
  }, [W, target, reduceMotion, markerX]);
  const markerStyle = useAnimatedStyle(() => ({ transform: [{ translateX: markerX.value }] }));

  return (
    <View>
      <View
        accessible
        accessibilityRole="text"
        accessibilityLabel={`Adım ${current + 1} / ${N}: ${stops[current]?.label ?? ''}`}
        style={styles.horizontal}
        onLayout={(e) => setW(e.nativeEvent.layout.width)}>
        <View
          importantForAccessibility="no-hide-descendants"
          accessibilityElementsHidden
          style={StyleSheet.absoluteFill}>
          {W > 0 && (
            <>
              <Animated.View
                style={[styles.marker, { width: STOP + 2 * HALO, height: STOP + 2 * HALO, backgroundColor: theme.markerSoft }, markerStyle]}>
                <View
                  style={{
                    width: STOP,
                    height: STOP,
                    borderRadius: Radius.pill,
                    backgroundColor: theme.marker,
                    borderWidth: Border.chunky,
                    borderColor: theme.markerEdge,
                  }}
                />
              </Animated.View>

              {/* Duraklar arası 3'er nokta */}
              {stops.slice(0, -1).flatMap((_, i) =>
                [1, 2, 3].map((q) => {
                  const from = xs[i] + STOP + 6;
                  const to = xs[i + 1] - 6;
                  return (
                    <View
                      key={`${i}-${q}`}
                      style={[
                        styles.dot6,
                        {
                          left: from + ((to - from) * q) / 4 - 3,
                          top: HALO + STOP / 2 - 3,
                          backgroundColor: showDone && i < current ? theme.accent : theme.borderStrong,
                        },
                      ]}
                    />
                  );
                })
              )}

              {stops.map((stop, i) => {
                const isCurrent = i === current;
                const isDone = showDone && i < current;
                return (
                  <Animated.View
                    key={stop.label}
                    // Duraklar yalnız ilk çizimde belirir; mod değişince yeniden animasyon yok
                    entering={reduceMotion ? FadeIn.duration(150) : ZoomIn.springify().damping(11).delay(i * 100)}
                    style={[
                      styles.stopSmall,
                      { left: xs[i], top: HALO, width: STOP, height: STOP },
                      isCurrent && { borderColor: 'transparent' },
                      isDone && { backgroundColor: theme.accent, borderColor: theme.accentEdge },
                      !isCurrent && !isDone && { backgroundColor: theme.card, borderColor: theme.borderStrong },
                    ]}>
                    <Text
                      allowFontScaling={false}
                      style={isDone ? { fontSize: 18, fontWeight: 900, color: theme.onAccent } : { fontSize: 18, lineHeight: 22 }}>
                      {isDone ? '✓' : stop.emoji}
                    </Text>
                  </Animated.View>
                );
              })}
            </>
          )}
        </View>
      </View>
      {caption && stops[current] && (
        <Animated.View key={current} entering={FadeIn.duration(150)} style={styles.caption}>
          <ThemedText type="smallBold" themeColor="accentInk">
            {stops[current].label}
          </ThemedText>
        </Animated.View>
      )}
    </View>
  );
}

const styles = StyleSheet.create({
  vertical: { alignSelf: 'center', width: '100%', maxWidth: 360 },
  stop: { borderRadius: Radius.pill, borderWidth: Border.chunky, alignItems: 'center', justifyContent: 'center' },
  halo: { position: 'absolute', borderRadius: Radius.pill },
  dot8: { position: 'absolute', width: 8, height: 8, borderRadius: 4 },
  vLabel: { position: 'absolute', minHeight: 44, justifyContent: 'center' },
  pin: { position: 'absolute', fontSize: 28, lineHeight: 34 },
  horizontal: { alignSelf: 'stretch', height: 48 },
  marker: { position: 'absolute', left: 0, top: 0, borderRadius: Radius.pill, alignItems: 'center', justifyContent: 'center' },
  stopSmall: {
    position: 'absolute',
    borderRadius: Radius.pill,
    borderWidth: Border.chunky,
    alignItems: 'center',
    justifyContent: 'center',
  },
  dot6: { position: 'absolute', width: 6, height: 6, borderRadius: 3 },
  caption: { marginTop: Spacing.two },
});
