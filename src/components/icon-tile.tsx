import { StyleSheet, Text, View } from 'react-native';

import { Border } from '@/constants/theme';
import { HUES, type Hue } from '@/constants/visuals';
import { useTheme } from '@/hooks/use-theme';

// Renkli kutu içinde emoji: kategori, konu ve seviye ikonlarının hepsi bu bileşenle çizilir.
// Emoji kullanmamızın nedeni: ek paket gerekmez, iOS/Android/Expo Go'da aynı çalışır.
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
  if (locked) {
    backgroundColor = theme.backgroundSelected;
    borderColor = theme.borderStrong;
  } else if (tone === 'neutral') {
    backgroundColor = theme.backgroundElement;
    borderColor = theme.border;
  } else {
    backgroundColor = theme[HUES[tone].soft];
    borderColor = theme[HUES[tone].line];
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
          borderRadius: size * 0.28,
          backgroundColor,
          borderColor,
          borderStyle: locked ? 'dashed' : 'solid',
        },
      ]}>
      {/* allowFontScaling kapalı: büyük yazı boyutunda emoji kutudan taşmasın */}
      <Text
        allowFontScaling={false}
        style={{ fontSize: size * 0.5, lineHeight: size * 0.62, opacity: locked ? 0.55 : 1 }}>
        {emoji}
      </Text>
      {locked && (
        <View style={[styles.lock, { backgroundColor: theme.card, borderColor: theme.border }]}>
          <Text allowFontScaling={false} style={styles.lockEmoji}>
            🔒
          </Text>
        </View>
      )}
    </View>
  );
}

const styles = StyleSheet.create({
  tile: { alignItems: 'center', justifyContent: 'center', borderWidth: Border.thick },
  lock: {
    position: 'absolute',
    right: -6,
    bottom: -6,
    width: 20,
    height: 20,
    borderRadius: 10,
    borderWidth: Border.thick,
    alignItems: 'center',
    justifyContent: 'center',
  },
  lockEmoji: { fontSize: 10, lineHeight: 12 },
});
