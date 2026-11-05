import { type ComponentRef, forwardRef } from 'react';
import { ActivityIndicator, Pressable, StyleSheet, View, type PressableProps } from 'react-native';

import { Glyph } from '@/components/icon';
import { ThemedText } from '@/components/themed-text';
import { MinTouch, Radius, Spacing } from '@/constants/theme';
import { useTheme } from '@/hooks/use-theme';

// Uygulamanın tek buton bileşeni. Dört çeşit, hepsi DÜZ (alt kenar / gölge yok):
//  - primary: ana eylem (mürekkep dolgu + onAccent yazı), 10 köşe, 48 yükseklik
//  - secondary: ikincil eylem (zemin şeffaf, 1.5px mürekkep iç kenar)
//  - quiet: arka planı olmayan sessiz eylem (örn. "Çıkış yap"; yıkıcı eylem rengi coralInk)
//  - text: sade metin eylemi (örn. "Soruları atla"); mürekkep yazı, zemin yok, 44px dokunma alanı
// Basınca hafif opaklık düşer (başka hareket yok).
type ButtonProps = Omit<PressableProps, 'children' | 'style'> & {
  label: string;
  variant?: 'primary' | 'secondary' | 'quiet' | 'text';
  loading?: boolean;
  icon?: string; // simge (emoji adıyla; bkz. icon.tsx)
};

// Not: <Link asChild> içinde expo-router Pressable'a role="link" ekler; gezinme butonlarının
// ekran okuyucuda "bağlantı" diye okunması bilinçlidir (gerçekten başka ekrana gidiyorlar).
// forwardRef: <Link asChild> bu bileşene ref ve href/onPress verebilsin diye gerekli.
export const Button = forwardRef<ComponentRef<typeof View>, ButtonProps>(function Button(
  { label, variant = 'primary', loading = false, disabled = false, icon, ...rest },
  ref
) {
  const theme = useTheme();

  const inactive = disabled || loading;

  // Duruma göre renkler. Devre dışıyken opacity KULLANMIYORUZ (kontrastı bozar), ayrı renkler var.
  let face: string = theme.accent;
  let border: string = 'transparent';
  let textColor: 'onAccent' | 'text' | 'coralInk' | 'accentInk' | 'textSecondary' = 'onAccent';
  if (variant === 'secondary') {
    face = 'transparent';
    border = theme.accent;
    textColor = 'accentInk';
  } else if (variant === 'quiet') {
    face = 'transparent';
    textColor = 'coralInk';
  } else if (variant === 'text') {
    face = 'transparent';
    textColor = 'accentInk';
  }
  if (disabled && !loading) {
    textColor = 'textSecondary';
    if (variant === 'primary') {
      // Pasif buton sakin kalsın (koyu modda parlamasın)
      face = theme.backgroundSelected;
    } else if (variant === 'secondary') {
      border = theme.borderEdge;
    }
  }
  const isText = variant === 'text';
  const quiet = variant === 'quiet' || isText;
  const spinnerColor = theme[textColor];

  return (
    <Pressable
      ref={ref}
      {...rest}
      disabled={inactive}
      accessibilityRole="button"
      accessibilityLabel={rest.accessibilityLabel ?? label}
      accessibilityState={{ disabled: inactive, busy: loading }}
      style={({ pressed }) => [styles.pressable, isText && styles.pressableText, pressed && styles.pressed]}>
      <View
        style={[
          styles.face,
          isText ? styles.faceText : quiet ? styles.faceQuiet : null,
          { backgroundColor: face, borderColor: border },
        ]}>
        {loading ? (
          <ActivityIndicator color={spinnerColor} />
        ) : (
          <>
            {icon && <Glyph emoji={icon} size={isText ? 16 : 18} color={theme[textColor]} strokeWidth={2.25} />}
            <ThemedText type={isText ? 'smallBold' : 'button'} themeColor={textColor} style={styles.label}>
              {label}
            </ThemedText>
          </>
        )}
      </View>
    </Pressable>
  );
});

const styles = StyleSheet.create({
  pressable: { alignSelf: 'stretch' },
  pressed: { opacity: 0.75 },
  face: {
    minHeight: 48,
    paddingHorizontal: Spacing.four,
    borderRadius: Radius.md,
    // 1.5px: ikincil butonun iç kenarı; diğer çeşitlerde şeffaf (boyut sabit kalsın)
    borderWidth: 1.5,
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
