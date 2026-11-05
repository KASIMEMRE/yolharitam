import { StyleSheet, View } from 'react-native';

import { Glyph } from '@/components/icon';
import { ThemedText } from '@/components/themed-text';
import { Border } from '@/constants/theme';
import { HUES, type Hue } from '@/constants/visuals';
import { useTheme } from '@/hooks/use-theme';

// E-postanın baş harfinden avatar. (Görünen ad özelliği henüz yok: Y-02.)
// İstenirse sağ altta seçili konunun kategori rozeti görünür.
type AvatarProps = {
  email?: string | null;
  size?: 72 | 96;
  badgeEmoji?: string;
  badgeHue?: Hue;
};

export function Avatar({ email, size = 96, badgeEmoji, badgeHue }: AvatarProps) {
  const theme = useTheme();
  // toLocaleUpperCase('tr-TR'): Türkçede i -> İ doğru büyür
  const letter = email?.trim().charAt(0).toLocaleUpperCase('tr-TR') || '?';

  return (
    // Süs: e-posta metni zaten ayrıca okunuyor
    <View accessibilityElementsHidden importantForAccessibility="no-hide-descendants">
      <View
        style={[
          styles.circle,
          {
            width: size,
            height: size,
            borderRadius: size / 2,
            backgroundColor: theme.accentSoft,
            // Avatar basılabilir değil: düz, ince (2pt) halka
            borderColor: theme.accent,
          },
        ]}>
        <ThemedText
          type="display"
          themeColor="accentInk"
          maxFontSizeMultiplier={1.2}
          style={{ fontSize: size === 96 ? 40 : 30, lineHeight: size === 96 ? 44 : 34 }}>
          {letter}
        </ThemedText>
      </View>
      {badgeEmoji && (
        // Rozet: kutu yok; zeminle aynı renkli küçük halka içinde çizgi simge (harita rengi yalnız simgede)
        <View style={[styles.badge, { backgroundColor: theme.background, borderColor: theme.borderEdge }]}>
          <Glyph emoji={badgeEmoji} size={18} color={badgeHue ? theme[HUES[badgeHue].ink] : theme.textSecondary} strokeWidth={2.25} />
        </View>
      )}
    </View>
  );
}

const styles = StyleSheet.create({
  circle: { alignItems: 'center', justifyContent: 'center', borderWidth: Border.thick },
  // Rozet harfi kapatmasın diye avatarın sağ alt köşesinden dışarı taşar
  badge: {
    position: 'absolute',
    right: -6,
    bottom: -4,
    width: 36,
    height: 36,
    borderRadius: 18,
    borderWidth: Border.thin,
    alignItems: 'center',
    justifyContent: 'center',
  },
});
