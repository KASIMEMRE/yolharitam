import { useEffect, useRef } from 'react';
import { Pressable, StyleSheet, Text, useWindowDimensions, View } from 'react-native';
import Animated, {
  FadeIn,
  FadeInDown,
  useAnimatedStyle,
  useReducedMotion,
  useSharedValue,
  withSequence,
  withSpring,
  withTiming,
} from 'react-native-reanimated';

import { IconTile } from '@/components/icon-tile';
import { ThemedText } from '@/components/themed-text';
import { Border, Edge, MaxContentWidth, Radius, Spacing } from '@/constants/theme';
import { HUES, type Hue } from '@/constants/visuals';
import { useShadow, useTheme } from '@/hooks/use-theme';

// Seçenek kartı. Üç görünümü var:
//  - list: yatay satır (alt konular, seviyeler)
//  - tile: kare kutucuk (ana kategoriler, 2 sütunlu ızgarada)
//  - compact: ince özet satırı (seçilen konu, "Değiştir" yazısıyla)
// Kenarlık HER ZAMAN 3px; durum sadece renkten değişir, böylece seçince kart zıplamaz.
type OptionCardProps = {
  title: string;
  description?: string;
  selected?: boolean;
  onPress: () => void;
  icon?: string; // emoji
  hue?: Hue; // yalnız KATEGORİ kartlarında; seviye kartında verilmez (nötr kalır)
  variant?: 'list' | 'tile' | 'compact';
  role?: 'button' | 'radio';
  trailing?: 'chevron' | 'check' | 'none';
  ladder?: 1 | 2 | 3; // seviye kartında zorluk merdiveni (ilerleme DEĞİL)
  actionLabel?: string; // compact için sağdaki yazı
  hint?: string; // ekran okuyucu ipucu (ne olacağını söyler; ekran bilir, kart bilmez)
  index?: number; // liste girişinde sıralı beliriş için
};

export function OptionCard({
  title,
  description,
  selected = false,
  onPress,
  icon,
  hue,
  variant = 'list',
  role = 'button',
  trailing = 'none',
  ladder,
  actionLabel,
  hint,
  index = 0,
}: OptionCardProps) {
  const theme = useTheme();
  const shadow = useShadow();
  const reduceMotion = useReducedMotion();
  const { width } = useWindowDimensions();

  const press = useSharedValue(0); // yüzün aşağı inme miktarı
  const scale = useSharedValue(1); // seçilince yaylanma
  const wobble = useSharedValue(0); // ikon sallanması (derece)

  const faceStyle = useAnimatedStyle(() => ({ transform: [{ translateY: press.value }] }));
  const scaleStyle = useAnimatedStyle(() => ({ transform: [{ scale: scale.value }] }));
  const wobbleStyle = useAnimatedStyle(() => ({ transform: [{ rotate: `${wobble.value}deg` }] }));

  function shake() {
    if (reduceMotion) return;
    wobble.set(withSequence(
      withTiming(-8, { duration: 50 }),
      withTiming(8, { duration: 50 }),
      withTiming(-4, { duration: 50 }),
      withTiming(0, { duration: 50 })
    ));
  }

  // Seçili durum false -> true olunca: kart yaylanır, ikon sallanır. İlk çizimde çalışmaz.
  const wasSelected = useRef(selected);
  useEffect(() => {
    if (selected && !wasSelected.current && !reduceMotion) {
      scale.set(withSequence(
        withSpring(1.03, { damping: 12, stiffness: 260 }),
        withSpring(1, { damping: 14, stiffness: 220 })
      ));
      wobble.set(withSequence(
        withTiming(-8, { duration: 50 }),
        withTiming(8, { duration: 50 }),
        withTiming(-4, { duration: 50 }),
        withTiming(0, { duration: 50 })
      ));
    }
    wasSelected.current = selected;
  }, [selected, reduceMotion, scale, wobble]);

  const tone = hue ? HUES[hue] : undefined;
  const isCompact = variant === 'compact';
  const isTile = variant === 'tile';

  // Renkleri duruma göre seç
  let background: string = theme.card;
  // Seçili olmayan tüm kartlar (kategori de seviye de) aynı sakin kenar dilini kullanır;
  // seçimi renk + ✓ halkası taşır.
  let border: string = theme.border;
  let plate: string = theme.borderEdge;
  if (isCompact) {
    border = theme.border;
  } else if (selected) {
    background = tone ? theme[tone.soft] : theme.accentSoft;
    border = tone ? theme[tone.line] : theme.accent;
    plate = tone ? theme[tone.edge] : theme.accentEdge;
  }

  // Izgara kutucuğunun genişliği: iki sütun + aralarındaki boşluk
  const gutter = width < 360 ? Spacing.three : Spacing.four;
  const tileWidth = (Math.min(width, MaxContentWidth) - 2 * gutter - Spacing.three) / 2;

  const radius = isCompact ? Radius.md : Radius.lg;

  const body = (
    <>
      {icon && (
        <Animated.View style={wobbleStyle}>
          <IconTile emoji={icon} tone={hue ?? 'neutral'} size={isTile ? 64 : isCompact ? 40 : 48} />
        </Animated.View>
      )}
      <View style={[styles.texts, isTile && styles.textsTile]}>
        <ThemedText type="cardTitle" style={isCompact && styles.flex}>
          {title}
        </ThemedText>
        {description && !isCompact && (
          <ThemedText type="small" themeColor="textSecondary">
            {description}
          </ThemedText>
        )}
        {ladder && (
          // Zorluk merdiveni: süs, sayı yok, ekran okuyucudan gizli
          <View
            accessibilityElementsHidden
            importantForAccessibility="no-hide-descendants"
            style={styles.ladder}>
            {[0, 1, 2].map((i) => (
              <View
                key={i}
                style={{
                  width: 10,
                  height: 14 + i * 6,
                  borderRadius: 3,
                  backgroundColor:
                    i < ladder
                      ? selected
                        ? theme.text
                        : theme.borderStrong
                      : // Seçili kartın zemini (accentSoft) üstünde backgroundSelected koyuda kaybolur
                        selected
                        ? theme.borderStrong
                        : theme.backgroundSelected,
                }}
              />
            ))}
          </View>
        )}
      </View>
      {isCompact && actionLabel && (
        <View style={styles.action}>
          <ThemedText type="smallBold" themeColor="accentInk">
            {actionLabel}
          </ThemedText>
        </View>
      )}
      {trailing === 'chevron' && (
        <Text
          accessibilityElementsHidden
          importantForAccessibility="no"
          allowFontScaling={false}
          style={[styles.chevron, { color: theme.textSecondary }]}>
          ›
        </Text>
      )}
      {trailing === 'check' && (
        <View
          accessibilityElementsHidden
          importantForAccessibility="no-hide-descendants"
          style={[
            styles.check,
            selected
              ? { backgroundColor: theme.accentInk, borderColor: theme.accentInk }
              : { borderColor: theme.borderStrong },
          ]}>
          {selected && (
            <Text allowFontScaling={false} style={[styles.checkMark, { color: theme.card }]}>
              ✓
            </Text>
          )}
        </View>
      )}
    </>
  );

  const entering = reduceMotion
    ? FadeIn.duration(150)
    : FadeInDown.duration(280)
        .springify()
        .damping(16)
        .delay(Math.min(index, 4) * 60);

  return (
    // Dıştaki sarmalayıcı sadece giriş animasyonu için; ölçek animasyonu içteki katmanda
    // (aynı elemanda iki animasyon türü çakışmasın diye).
    // Tile: aynı satırdaki kartlar eşit yükseklikte olsun diye zincirdeki her katman flex: 1
    <Animated.View entering={entering} style={isTile && { width: tileWidth, alignSelf: 'stretch' }}>
      <Animated.View style={[scaleStyle, isTile && styles.fill]}>
        <Pressable
          onPress={onPress}
          onPressIn={() => {
            press.set(reduceMotion ? Edge - 1 : withTiming(Edge - 1, { duration: 60 }));
            if (isTile) shake();
          }}
          onPressOut={() => {
            press.set(reduceMotion ? 0 : withSpring(0, { damping: 14, stiffness: 320, mass: 0.6 }));
          }}
          accessibilityRole={role}
          accessibilityLabel={isCompact ? `${title}. Konuyu değiştir` : undefined}
          accessibilityHint={hint}
          accessibilityState={role === 'radio' ? { checked: selected } : undefined}
          // Düz renkli zemin için gölge sarmalayıcıya; alt kenar plakası kartın kendi rengi
          style={[!isCompact && shadow('card'), { borderRadius: radius }, isTile && styles.fill]}>
          <View style={[{ borderRadius: radius }, !isCompact && { backgroundColor: plate }, isTile && styles.fill]}>
            <Animated.View
              style={[
                styles.face,
                {
                  backgroundColor: background,
                  borderColor: border,
                  borderRadius: radius,
                  borderWidth: isCompact ? Border.thick : Border.chunky,
                },
                isCompact
                  ? styles.compact
                  : [styles.faceFull, { marginBottom: Edge }, isTile ? styles.tile : styles.list],
                !isCompact && faceStyle,
                isTile && styles.fill,
              ]}>
              {body}
            </Animated.View>
          </View>
        </Pressable>
      </Animated.View>
    </Animated.View>
  );
}

const styles = StyleSheet.create({
  face: { flexDirection: 'row', alignItems: 'center' },
  faceFull: { padding: Spacing.three, gap: Spacing.three },
  list: { minHeight: 72 },
  tile: { minHeight: 148, flexDirection: 'column', alignItems: 'flex-start', gap: Spacing.two },
  compact: { minHeight: 56, paddingHorizontal: Spacing.three, gap: Spacing.three },
  flex: { flex: 1, minWidth: 0 },
  fill: { flex: 1 },
  texts: { flex: 1, minWidth: 0, gap: Spacing.half },
  textsTile: { flex: 0, alignSelf: 'stretch' },
  ladder: { flexDirection: 'row', alignItems: 'flex-end', gap: Spacing.one, marginTop: Spacing.two },
  action: { minHeight: 44, minWidth: 44, alignItems: 'center', justifyContent: 'center' },
  chevron: { fontSize: 28, lineHeight: 32 },
  check: {
    width: 28,
    height: 28,
    borderRadius: 14,
    borderWidth: Border.thick,
    alignItems: 'center',
    justifyContent: 'center',
  },
  checkMark: { fontSize: 16, lineHeight: 18, fontWeight: 900 },
});
