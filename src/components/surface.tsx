import { createContext, useContext, type ReactNode } from 'react';
import { Pressable, StyleSheet, View, type StyleProp, type ViewStyle } from 'react-native';

import { Border, Edge, Radius, Spacing } from '@/constants/theme';
import { HUES, type Hue } from '@/constants/visuals';
import { useTheme } from '@/hooks/use-theme';

// Tek seviye kart. Sadelik kuralı: kartın içinde başka kart olmaz; iç gruplama boşluk,
// ince ayırıcı ya da başlıkla yapılır. Üç ton:
//  - plain: kart zemini + ince kenar (varsayılan)
//  - soft: yalnız yumuşak zemin, kenar yok
//  - primary: renkli zemin + kalın alt kenar ("3D"); ekranda TEK birincil öğe için
// `hue` verilirse renk ailesi (harita kimliği) kullanılır; verilmezse marka yeşili / nötr.
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
  let edgeColor: string = theme.borderEdge;
  if (tone === 'soft') {
    backgroundColor = family ? theme[family.soft] : theme.backgroundElement;
    borderColor = 'transparent';
  } else if (tone === 'primary') {
    // Mevcut 3D kartlarla (OptionCard seçili hali) aynı kalıp: yumuşak zemin + renkli kenar + alt plaka
    backgroundColor = family ? theme[family.soft] : theme.accentSoft;
    borderColor = family ? theme[family.line] : theme.accent;
    edgeColor = family ? theme[family.edge] : theme.accentEdge;
  } else if (family) {
    borderColor = theme[family.line];
  }

  const face: StyleProp<ViewStyle> = [
    styles.face,
    padded && styles.padded,
    { backgroundColor, borderColor },
    tone === 'primary' && { borderWidth: Border.thick, borderBottomWidth: Edge, borderBottomColor: edgeColor },
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
      // Basınca hafif aşağı kayma: mevcut kartlardaki kalıp
      style={({ pressed }) => [face, pressed && styles.pressed]}>
      {content}
    </Pressable>
  );
}

const styles = StyleSheet.create({
  face: { borderRadius: Radius.lg, borderWidth: Border.thin, gap: Spacing.three },
  padded: { padding: Spacing.three },
  pressed: { transform: [{ translateY: 2 }] },
});
