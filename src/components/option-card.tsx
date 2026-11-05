import { Pressable, StyleSheet, Text, useWindowDimensions, View } from 'react-native';
import Animated, { FadeIn, FadeInDown, useReducedMotion } from 'react-native-reanimated';

import { Glyph } from '@/components/icon';
import { ThemedText } from '@/components/themed-text';
import { Border, MaxContentWidth, Radius, Spacing } from '@/constants/theme';
import { HUES, type Hue } from '@/constants/visuals';
import { useTheme } from '@/hooks/use-theme';

// Seçenek kartı. Üç görünümü var:
//  - list: yatay satır (alt konular, seviyeler)
//  - tile: kare kutucuk (ana kategoriler, 2 sütunlu ızgarada)
//  - compact: ince özet satırı (seçilen konu, "Değiştir" yazısıyla)
// DÜZ görünüm: alt kenar/gölge yok. Kenarlık HER ZAMAN 1.5px; durum sadece renkten değişir (seçili = mürekkep
// kenar + soluk zemin), böylece seçince kart zıplamaz. Simge kutusuz, çizgi simge olarak solda durur.
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
  const reduceMotion = useReducedMotion();
  const { width } = useWindowDimensions();

  const tone = hue ? HUES[hue] : undefined;
  const isCompact = variant === 'compact';
  const isTile = variant === 'tile';

  // Renkleri duruma göre seç: seçili kart soluk zemin + mürekkep (ya da harita rengi) kenar
  let background: string = theme.card;
  let border: string = theme.border;
  if (!isCompact && selected) {
    background = tone ? theme[tone.soft] : theme.backgroundElement;
    border = tone ? theme[tone.line] : theme.accent;
  }

  // Izgara kutucuğunun genişliği: iki sütun + aralarındaki boşluk
  const gutter = width < 360 ? Spacing.three : Spacing.four;
  const tileWidth = (Math.min(width, MaxContentWidth) - 2 * gutter - Spacing.three) / 2;

  const radius = isCompact ? Radius.md : Radius.lg;

  const body = (
    <>
      {icon && (
        <Glyph
          emoji={icon}
          size={isTile ? 28 : 22}
          color={tone ? theme[tone.ink] : theme.textSecondary}
          strokeWidth={2}
        />
      )}
      <View style={[styles.texts, isTile && styles.textsTile]}>
        <ThemedText type="cardTitle" style={[styles.title, isCompact && styles.flex]}>
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
                  backgroundColor: i < ladder ? (selected ? theme.text : theme.borderStrong) : theme.backgroundSelected,
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
              ? { backgroundColor: theme.accent, borderColor: theme.accent }
              : { borderColor: theme.borderStrong },
          ]}>
          {selected && (
            <Text allowFontScaling={false} style={[styles.checkMark, { color: theme.onAccent }]}>
              ✓
            </Text>
          )}
        </View>
      )}
    </>
  );

  const entering = reduceMotion
    ? FadeIn.duration(150)
    : FadeInDown.duration(240).delay(Math.min(index, 4) * 50);

  return (
    // Sarmalayıcı yalnız giriş animasyonu için.
    // Tile: aynı satırdaki kartlar eşit yükseklikte olsun diye zincirdeki her katman flex: 1
    <Animated.View entering={entering} style={isTile && { width: tileWidth, alignSelf: 'stretch' }}>
      <Pressable
        onPress={onPress}
        accessibilityRole={role}
        accessibilityLabel={isCompact ? `${title}. Konuyu değiştir` : undefined}
        accessibilityHint={hint}
        accessibilityState={role === 'radio' ? { checked: selected } : undefined}
        style={({ pressed }) => [
          styles.face,
          {
            backgroundColor: background,
            borderColor: border,
            borderRadius: radius,
            borderWidth: 1.5,
            opacity: pressed ? 0.75 : 1,
          },
          isCompact ? styles.compact : [styles.faceFull, isTile ? styles.tile : styles.list],
          isTile && styles.fill,
        ]}>
        {body}
      </Pressable>
    </Animated.View>
  );
}

const styles = StyleSheet.create({
  face: { flexDirection: 'row', alignItems: 'center' },
  faceFull: { padding: Spacing.three, gap: Spacing.three },
  list: { minHeight: 64 },
  tile: { minHeight: 120, flexDirection: 'column', alignItems: 'flex-start', gap: Spacing.two },
  // Dar ekranda ad iki satıra inebilir; dikey boşluk olmazsa metin kenara yapışıyordu
  compact: { minHeight: 56, paddingHorizontal: Spacing.three, paddingVertical: Spacing.two, gap: Spacing.three },
  flex: { flex: 1, minWidth: 0 },
  fill: { flex: 1 },
  title: { fontSize: 18, lineHeight: 24 },
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
  checkMark: { fontSize: 16, lineHeight: 18 },
});
