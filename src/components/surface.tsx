import { createContext, useContext, type ReactNode } from 'react';
import { Pressable, StyleSheet, View, type StyleProp, type ViewStyle } from 'react-native';

import { Border, Radius, Spacing } from '@/constants/theme';
import { HUES, type Hue } from '@/constants/visuals';
import { useTheme } from '@/hooks/use-theme';

// Tek seviye kart (14 köşe). Sadelik kuralı: kartın içinde başka kart olmaz; iç gruplama boşluk,
// ince ayırıcı ya da başlıkla yapılır. Üç ton, hepsi DÜZ (alt kenar / gölge yok):
//  - plain: kart zemini + 1px kenar (varsayılan)
//  - soft: yalnız yumuşak zemin (backgroundElement), kenarlıksız
//  - primary: soft ile aynı görünüm; ekranda TEK birincil öğe (örn. "Şimdi" kartı) için işaret
// `hue` verilirse o harita renginin soluk zemini kullanılır; verilmezse nötr.
export type SurfaceTone = 'plain' | 'soft' | 'primary';

type SurfaceProps = {
  tone?: SurfaceTone;
  hue?: Hue;
  onPress?: () => void;
  padded?: boolean; // iç boşluk (liste gibi kenara dayalı içerik için false)
  accessibilityLabel?: string;
  accessibilityHint?: string;
  style?: StyleProp<ViewStyle>;
  children: ReactNode;
};

// İç içe kullanımı yakalamak için: Surface çocuklarını bu bağlama sarar.
const InsideSurface = createContext(false);

export function Surface({
  tone = 'plain',
  hue,
  onPress,
  padded = true,
  accessibilityLabel,
  accessibilityHint,
  style,
  children,
}: SurfaceProps) {
  const theme = useTheme();
  const nested = useContext(InsideSurface);
  if (__DEV__ && nested) {
    console.warn('Surface içinde Surface: sadelik kuralı (kart içinde kart yok)');
  }

  const family = hue ? HUES[hue] : null;
  let backgroundColor: string = theme.card;
  let borderColor: string = theme.border;
  if (tone === 'soft' || tone === 'primary') {
    backgroundColor = family ? theme[family.soft] : theme.backgroundElement;
    borderColor = 'transparent';
  }

  const face: StyleProp<ViewStyle> = [
    styles.face,
    padded && styles.padded,
    { backgroundColor, borderColor },
    style,
  ];

  const content = <InsideSurface.Provider value>{children}</InsideSurface.Provider>;

  if (!onPress) {
    return <View style={face}>{content}</View>;
  }
  return (
    <Pressable
      onPress={onPress}
      accessibilityRole="button"
      accessibilityLabel={accessibilityLabel}
      accessibilityHint={accessibilityHint}
      // Basınca hafif opaklık (kayma yok)
      style={({ pressed }) => [face, pressed && styles.pressed]}>
      {content}
    </Pressable>
  );
}

const styles = StyleSheet.create({
  face: { borderRadius: Radius.lg, borderWidth: Border.thin, gap: Spacing.three },
  padded: { padding: Spacing.three },
  pressed: { opacity: 0.75 },
});
