import { forwardRef, useState } from 'react';
import { ActivityIndicator, Pressable, StyleSheet, View, type PressableProps } from 'react-native';
import Animated, {
  useAnimatedStyle,
  useReducedMotion,
  useSharedValue,
  withSpring,
  withTiming,
} from 'react-native-reanimated';

import { ThemedText } from '@/components/themed-text';
import { Border, Edge, Radius, Spacing } from '@/constants/theme';
import { useTheme } from '@/hooks/use-theme';

// Uygulamanın tek buton bileşeni. Üç çeşit:
//  - primary: ana eylem (yeşil, "3D" alt kenarlı)
//  - secondary: ikincil eylem (kart rengi, kenarlıklı)
//  - quiet: arka planı olmayan sessiz eylem (örn. "Çıkış yap")
// "3D" his: üstteki yüz, basılınca alt kenar plakasının üstüne 3px iner; bırakınca yaylanarak döner.
type ButtonProps = Omit<PressableProps, 'children' | 'style'> & {
  label: string;
  variant?: 'primary' | 'secondary' | 'quiet';
  loading?: boolean;
  icon?: string; // emoji
};

// Not: <Link asChild> içinde expo-router Pressable'a role="link" ekler; gezinme butonlarının
// ekran okuyucuda "bağlantı" diye okunması bilinçlidir (gerçekten başka ekrana gidiyorlar).
// forwardRef: <Link asChild> bu bileşene ref ve href/onPress verebilsin diye gerekli.
export const Button = forwardRef<View, ButtonProps>(function Button(
  { label, variant = 'primary', loading = false, disabled = false, icon, onPressIn, onPressOut, ...rest },
  ref
) {
  const theme = useTheme();
  const reduceMotion = useReducedMotion();
  const offset = useSharedValue(0);
  const [pressed, setPressed] = useState(false); // quiet için basılı zemin

  const inactive = disabled || loading;
  const faceStyle = useAnimatedStyle(() => ({ transform: [{ translateY: offset.value }] }));

  // Duruma göre renkler. Devre dışıyken opacity KULLANMIYORUZ (kontrastı bozar), ayrı renkler var.
  let face: string = theme.accent;
  let border: string = theme.accent;
  let plate: string = theme.accentEdge;
  let textColor: 'onAccent' | 'text' | 'coralInk' | 'textSecondary' = 'onAccent';
  if (variant === 'secondary') {
    face = theme.card;
    border = theme.border;
    plate = theme.borderEdge;
    textColor = 'text';
  } else if (variant === 'quiet') {
    face = pressed ? theme.coralSoft : 'transparent';
    border = 'transparent';
    plate = 'transparent';
    textColor = 'coralInk';
  }
  if (disabled && !loading) {
    textColor = 'textSecondary';
    if (variant !== 'quiet') {
      // Pasif buton sakin kalsın (koyu modda parlamasın): zemin + normal kenar + kenar plakası
      face = theme.backgroundSelected;
      border = theme.border;
      plate = theme.borderEdge;
    }
  }
  const quiet = variant === 'quiet';
  const spinnerColor = theme[variant === 'primary' ? 'onAccent' : textColor === 'coralInk' ? 'coralInk' : 'text'];

  return (
    <Pressable
      ref={ref}
      {...rest}
      disabled={inactive}
      accessibilityRole="button"
      accessibilityLabel={label}
      accessibilityState={{ disabled: inactive, busy: loading }}
      onPressIn={(e) => {
        setPressed(true);
        if (!quiet) offset.value = reduceMotion ? Edge - 1 : withTiming(Edge - 1, { duration: 60 });
        onPressIn?.(e);
      }}
      onPressOut={(e) => {
        setPressed(false);
        if (!quiet) {
          offset.value = reduceMotion ? 0 : withSpring(0, { damping: 14, stiffness: 320, mass: 0.6 });
        }
        onPressOut?.(e);
      }}
      style={styles.pressable}>
      <View style={[styles.plate, !quiet && { backgroundColor: plate }]}>
        <Animated.View
          style={[
            styles.face,
            quiet ? styles.faceQuiet : { marginBottom: Edge },
            { backgroundColor: face, borderColor: border },
            !quiet && faceStyle,
          ]}>
          {loading ? (
            <ActivityIndicator color={spinnerColor} />
          ) : (
            <>
              {icon && <ThemedText type="button">{icon}</ThemedText>}
              <ThemedText type="button" themeColor={textColor} style={styles.label}>
                {label}
              </ThemedText>
            </>
          )}
        </Animated.View>
      </View>
    </Pressable>
  );
});

const styles = StyleSheet.create({
  pressable: { alignSelf: 'stretch' },
  plate: { borderRadius: Radius.md },
  face: {
    minHeight: 52,
    paddingHorizontal: Spacing.four,
    borderRadius: Radius.md,
    borderWidth: Border.thick,
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    gap: Spacing.two,
  },
  faceQuiet: { minHeight: 48 },
  label: { textAlign: 'center', flexShrink: 1 },
});
