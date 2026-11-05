import { StyleSheet, Text, type TextProps } from 'react-native';

import { Fonts, ThemeColor } from '@/constants/theme';
import { useTheme } from '@/hooks/use-theme';

export type ThemedTextProps = TextProps & {
  type?:
    | 'default'
    | 'defaultSemiBold'
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
        type === 'defaultSemiBold' && styles.defaultSemiBold,
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

// Yazı tipi kuralı: başlıklar Bricolage Grotesque (600/700), metin Figtree (400/600).
// Özel yazı tipinde `fontWeight` dosya seçmez; her ağırlık ayrı `fontFamily` adıdır (bkz. Fonts).
// Bu yüzden stillerde `fontWeight` YOK, ağırlık aile adından gelir.
// Ölçek: ekran başlığı 32/700 · bölüm başlığı 19/600 · kart başlığı 22/600 · gövde 16 · küçük 14.
const styles = StyleSheet.create({
  small: { fontFamily: Fonts.sans, fontSize: 14, lineHeight: 20 },
  smallBold: { fontFamily: Fonts.sansSemiBold, fontSize: 14, lineHeight: 20 },
  default: { fontFamily: Fonts.sans, fontSize: 16, lineHeight: 24 },
  defaultSemiBold: { fontFamily: Fonts.sansSemiBold, fontSize: 16, lineHeight: 24 },
  title: { fontFamily: Fonts.displayBold, fontSize: 40, lineHeight: 46, letterSpacing: -0.8 },
  // Bölüm başlığı (SectionHeader)
  subtitle: { fontFamily: Fonts.display, fontSize: 19, lineHeight: 25 },
  link: { fontFamily: Fonts.sansSemiBold, lineHeight: 30, fontSize: 14 },
  linkPrimary: { fontFamily: Fonts.sansSemiBold, lineHeight: 30, fontSize: 14 },
  // Büyük rakamlar / kutlama başlığı
  display: { fontFamily: Fonts.displayBold, fontSize: 40, lineHeight: 46, letterSpacing: -0.8 },
  // Ekran başlığı
  heading: { fontFamily: Fonts.displayBold, fontSize: 32, lineHeight: 38, letterSpacing: -0.5 },
  cardTitle: { fontFamily: Fonts.display, fontSize: 22, lineHeight: 28, letterSpacing: -0.2 },
  // textTransform kullanılmaz: Türkçede i/İ büyük harfe yanlış dönüşür.
  eyebrow: { fontFamily: Fonts.sansSemiBold, fontSize: 13, lineHeight: 18, letterSpacing: 0.3 },
  button: { fontFamily: Fonts.sansSemiBold, fontSize: 16, lineHeight: 22 },
  chip: { fontFamily: Fonts.sansSemiBold, fontSize: 14, lineHeight: 18 },
});
