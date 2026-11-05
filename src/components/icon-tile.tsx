import { StyleSheet, View } from 'react-native';

import { Glyph } from '@/components/icon';

import { Border, Radius } from '@/constants/theme';
import { HUES, type Hue } from '@/constants/visuals';
import { useTheme } from '@/hooks/use-theme';

// Soluk zeminli küçük kutu içinde çizgi simge. Yeni görünümde başlıklarda ve liste satırlarında KULLANILMAZ
// (kutusuz çizgi simge ya da hue noktası kullan); yalnız büyük sahne simgelerinde (karşılama, boş durum) kalır.
// İçerik "emoji" adıyla hangi simgenin çizileceğini söyler; çevirme tablosu icon.tsx içinde.
type IconTileProps = {
  emoji: string;
  tone?: Hue | 'neutral'; // 'neutral' = seviye gibi renk ailesi taşımayan öğeler
  size?: 40 | 48 | 64 | 96;
  locked?: boolean; // "Yakında" öğeleri: soluk zemin, kesikli kenar, kilit rozeti
};

export function IconTile({ emoji, tone = 'accent', size = 48, locked = false }: IconTileProps) {
  const theme = useTheme();

  let backgroundColor: string;
  let borderColor: string;
  let ink: string; // simgenin rengi: zeminle aynı renk ailesinin koyusu
  if (locked) {
    backgroundColor = theme.backgroundSelected;
    borderColor = theme.borderStrong;
    ink = theme.textSecondary;
  } else if (tone === 'neutral') {
    backgroundColor = theme.backgroundElement;
    borderColor = 'transparent';
    ink = theme.textSecondary;
  } else {
    // Düz soluk zemin, kenarlıksız
    backgroundColor = theme[HUES[tone].soft];
    borderColor = 'transparent';
    ink = theme[HUES[tone].ink];
  }

  return (
    // Süs olduğu için ekran okuyucudan gizli: anlam yanındaki metinde.
    <View
      accessibilityElementsHidden
      importantForAccessibility="no-hide-descendants"
      style={[
        styles.tile,
        {
          width: size,
          height: size,
          borderRadius: size >= 64 ? Radius.lg : Radius.sm,
          backgroundColor,
          borderColor,
          borderStyle: locked ? 'dashed' : 'solid',
        },
      ]}>
      <View style={{ opacity: locked ? 0.55 : 1 }}>
        <Glyph emoji={emoji} size={Math.round(size * 0.5)} color={ink} strokeWidth={size >= 64 ? 1.75 : 2} />
      </View>
      {locked && (
        <View style={[styles.lock, { backgroundColor: theme.card, borderColor: theme.border }]}>
          <Glyph emoji="🔒" size={11} color={theme.textSecondary} strokeWidth={2.5} />
        </View>
      )}
    </View>
  );
}

const styles = StyleSheet.create({
  tile: { alignItems: 'center', justifyContent: 'center', borderWidth: Border.thin },
  lock: {
    position: 'absolute',
    right: -6,
    bottom: -6,
    width: 20,
    height: 20,
    borderRadius: 10,
    borderWidth: Border.thin,
    alignItems: 'center',
    justifyContent: 'center',
  },
});
