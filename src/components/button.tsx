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
import { Border, Edge, MinTouch, Radius, Spacing } from '@/constants/theme';
import { useTheme } from '@/hooks/use-theme';

// Uygulamanın tek buton bileşeni. Dört çeşit:
//  - primary: ana eylem (yeşil, "3D" alt kenarlı)
//  - secondary: ikincil eylem (kart rengi, kenarlıklı)
//  - quiet: arka planı olmayan sessiz eylem (örn. "Çıkış yap"; yıkıcı eylem rengi coralInk)
//  - text: sade metin eylemi (örn. "Soruları atla"); yeşil yazı, zemin yok, 44px dokunma alanı
// "3D" his: üstteki yüz, basılınca alt kenar plakasının üstüne 3px iner; bırakınca yaylanarak döner.
type ButtonProps = Omit<PressableProps, 'children' | 'style'> & {
  label: string;
  variant?: 'primary' | 'secondary' | 'quiet' | 'text';
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
  let textColor: 'onAccent' | 'text' | 'coralInk' | 'accentInk' | 'textSecondary' = 'onAccent';
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
  } else if (variant === 'text') {
    face = pressed ? theme.accentSoft : 'transparent';
    border = 'transparent';
    plate = 'transparent';
    textColor = 'accentInk';
  }
  if (disabled && !loading) {
    textColor = 'textSecondary';
    if (variant !== 'quiet' && variant !== 'text') {
      // Pasif buton sakin kalsın (koyu modda parlamasın): zemin + normal kenar + kenar plakası
      face = theme.backgroundSelected;
      border = theme.border;
      plate = theme.borderEdge;
    }
  }
  const isText = variant === 'text';
  // quiet ve text'te 3D alt kenar plakası ve basılınca inme efekti yok
  const quiet = variant === 'quiet' || isText;
  const spinnerColor =
    theme[variant === 'primary' ? 'onAccent' : textColor === 'coralInk' || textColor === 'accentInk' ? textColor : 'text'];

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
      style={[styles.pressable, isText && styles.pressableText]}>
      <View style={[styles.plate, !quiet && { backgroundColor: plate }]}>
        <Animated.View
          style={[
            styles.face,
            isText ? styles.faceText : quiet ? styles.faceQuiet : { marginBottom: Edge },
            { backgroundColor: face, borderColor: border },
            !quiet && faceStyle,
          ]}>
          {loading ? (
            <ActivityIndicator color={spinnerColor} />
          ) : (
            <>
              {icon && <ThemedText type={isText ? 'smallBold' : 'button'}>{icon}</ThemedText>}
              <ThemedText type={isText ? 'smallBold' : 'button'} themeColor={textColor} style={styles.label}>
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
  // text: ortalı, küçük yazı; dokunma alanı en az MinTouch (44)
  pressableText: { alignSelf: 'center' },
  faceText: { minHeight: MinTouch, paddingHorizontal: Spacing.three },
  label: { textAlign: 'center', flexShrink: 1 },
});
