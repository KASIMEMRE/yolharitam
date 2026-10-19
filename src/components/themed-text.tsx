import { StyleSheet, Text, type TextProps } from 'react-native';

import { Fonts, ThemeColor } from '@/constants/theme';
import { useTheme } from '@/hooks/use-theme';

export type ThemedTextProps = TextProps & {
  type?:
    | 'default'
    | 'title'
    | 'small'
    | 'smallBold'
    | 'subtitle'
    | 'link'
    | 'linkPrimary'
    | 'display'
    | 'heading'
    | 'cardTitle'
    | 'eyebrow'
    | 'button'
    | 'chip';
  themeColor?: ThemeColor;
};

export function ThemedText({ style, type = 'default', themeColor, ...rest }: ThemedTextProps) {
  const theme = useTheme();

  // linkPrimary'nin rengi artık sabit hex değil, temadan gelir (açık/koyu modda otomatik değişir).
  const color = themeColor ?? (type === 'linkPrimary' ? 'accentInk' : 'text');

  return (
    <Text
      style={[
        { color: theme[color] },
        type === 'default' && styles.default,
        type === 'title' && styles.title,
        type === 'small' && styles.small,
        type === 'smallBold' && styles.smallBold,
        type === 'subtitle' && styles.subtitle,
        type === 'link' && styles.link,
        type === 'linkPrimary' && styles.linkPrimary,
        type === 'display' && styles.display,
        type === 'heading' && styles.heading,
        type === 'cardTitle' && styles.cardTitle,
        type === 'eyebrow' && styles.eyebrow,
        type === 'button' && styles.button,
        type === 'chip' && styles.chip,
        style,
      ]}
      {...rest}
    />
  );
}

// Ağırlık kuralı: başlık/buton 900, vurgu 700, gövde 400. Başka ağırlık kullanılmaz;
// Android sistem fontunda 700 ve üstü zaten aynı kalınlıkta görünür.
const styles = StyleSheet.create({
  small: { fontSize: 14, lineHeight: 20, fontWeight: 400 },
  smallBold: { fontSize: 14, lineHeight: 20, fontWeight: 700 },
  default: { fontSize: 16, lineHeight: 24, fontWeight: 400 },
  title: { fontSize: 48, fontWeight: 600, lineHeight: 52 },
  subtitle: { fontSize: 32, lineHeight: 44, fontWeight: 600 },
  link: { lineHeight: 30, fontSize: 14 },
  linkPrimary: { lineHeight: 30, fontSize: 14 },
  // iOS'ta yuvarlak (rounded) font başlıklara oyunsu bir hava katar; Android'de normal font.
  display: { fontFamily: Fonts.rounded, fontSize: 48, lineHeight: 52, fontWeight: 900, letterSpacing: -1 },
  heading: { fontFamily: Fonts.rounded, fontSize: 32, lineHeight: 38, fontWeight: 900, letterSpacing: -0.5 },
  cardTitle: { fontFamily: Fonts.rounded, fontSize: 18, lineHeight: 24, fontWeight: 900 },
  // textTransform kullanılmaz: Türkçede i/İ büyük harfe yanlış dönüşür.
  eyebrow: { fontSize: 14, lineHeight: 18, fontWeight: 700, letterSpacing: 0.4 },
  button: { fontFamily: Fonts.rounded, fontSize: 17, lineHeight: 22, fontWeight: 900, letterSpacing: 0.2 },
  chip: { fontSize: 14, lineHeight: 18, fontWeight: 700 },
});
