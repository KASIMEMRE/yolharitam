/**
 * Below are the colors that are used in the app. The colors are defined in the light and dark mode.
 * There are many other ways to style your app. For example, [Nativewind](https://www.nativewind.dev/), [Tamagui](https://tamagui.dev/), [unistyles](https://reactnativeunistyles.vercel.app), etc.
 */

import '@/global.css';

import { Platform } from 'react-native';

// Renk jetonları (design tokens): ekranlarda hiç hex yazılmaz, hep bu isimler kullanılır.
// Kural: renkli YAZI her zaman `*Ink`, renkli ZEMİN `*Soft`, kenarlık/ikon çerçevesi düz renk,
// 3D alt kenar `*Edge`. Böylece açık ve koyu modda kontrast tek yerden garanti edilir.
// Önemli: light ve dark AYNI anahtarlara sahip olmalı, yoksa ThemeColor tipi daralır.
export const Colors = {
  light: {
    text: '#14201C',
    background: '#FBFAF5',
    card: '#FFFFFF',
    backgroundElement: '#F1EFE6',
    backgroundSelected: '#E4E1D3',
    textSecondary: '#586360',
    border: '#E3DFD3',
    borderStrong: '#68716C',
    borderEdge: '#D6D1C0',
    // Marka renkleri: harita yeşili (ana eylem) ve patika işareti sarısı (aktif durak)
    accent: '#1E7B6A',
    accentEdge: '#145747',
    accentSoft: '#DDF1EB',
    accentInk: '#14604F',
    onAccent: '#FFFFFF', // accent zemin üstündeki yazı rengi
    marker: '#E9A23B',
    markerEdge: '#B87714',
    markerSoft: '#FCEFD2',
    markerInk: '#7A4D00',
    onMarker: '#2A1A00',
    // Kategori renk aileleri
    sky: '#2B7BD6',
    skyEdge: '#205CA1',
    skySoft: '#DEEBFB',
    skyInk: '#1B5AA6',
    coral: '#D9552B',
    coralEdge: '#A34020',
    coralSoft: '#FDE5DC',
    coralInk: '#A8401C',
    violet: '#7C4DDB',
    violetEdge: '#5D3AA4',
    violetSoft: '#EBE3FB',
    violetInk: '#5B30B5',
    berry: '#D14487',
    berryEdge: '#9D3365',
    berrySoft: '#FBE1EE',
    berryInk: '#A02A66',
    leaf: '#4C9A1F',
    leafEdge: '#397417',
    leafSoft: '#E5F3D9',
    leafInk: '#2F6A0E',
    warningBackground: '#FBEBD3', // hata/uyarı kutusu zemini
    warningInk: '#6B3F00',
  },
  dark: {
    text: '#F2F6F4',
    background: '#0B1210',
    card: '#16201C',
    backgroundElement: '#1B2622',
    backgroundSelected: '#26352F',
    textSecondary: '#A9B6B0',
    border: '#2C3B34',
    borderStrong: '#7F9288',
    borderEdge: '#33463E',
    accent: '#4CC2A6',
    accentEdge: '#2A8F77',
    accentSoft: '#12342C',
    accentInk: '#7FE0C8',
    onAccent: '#03241D',
    marker: '#F0B455',
    markerEdge: '#B8832A',
    markerSoft: '#3A2A0E',
    markerInk: '#F5C97A',
    onMarker: '#2A1A00',
    sky: '#5AA2F2',
    skyEdge: '#4175AE',
    skySoft: '#14263D',
    skyInk: '#9CC8FA',
    coral: '#F2866A',
    coralEdge: '#AE604C',
    coralSoft: '#3D1F17',
    coralInk: '#F8AE98',
    violet: '#A184F0',
    violetEdge: '#745FAD',
    violetSoft: '#251C42',
    violetInk: '#C6B4F8',
    berry: '#EE72AA',
    berryEdge: '#AB527A',
    berrySoft: '#3E1829',
    berryInk: '#F6A3C8',
    leaf: '#7CC24A',
    leafEdge: '#598C35',
    leafSoft: '#1D3010',
    leafInk: '#A8DB80',
    warningBackground: '#3B2B12',
    warningInk: '#F6D9A6',
  },
} as const;

export type ThemeColor = keyof typeof Colors.light & keyof typeof Colors.dark;

export const Fonts = Platform.select({
  ios: {
    /** iOS `UIFontDescriptorSystemDesignDefault` */
    sans: 'system-ui',
    /** iOS `UIFontDescriptorSystemDesignSerif` */
    serif: 'ui-serif',
    /** iOS `UIFontDescriptorSystemDesignRounded` */
    rounded: 'ui-rounded',
    /** iOS `UIFontDescriptorSystemDesignMonospaced` */
    mono: 'ui-monospace',
  },
  default: {
    sans: 'normal',
    serif: 'serif',
    rounded: 'normal',
    mono: 'monospace',
  },
  web: {
    sans: 'var(--font-display)',
    serif: 'var(--font-serif)',
    rounded: 'var(--font-rounded)',
    mono: 'var(--font-mono)',
  },
});

export const Spacing = {
  half: 2,
  one: 4,
  two: 8,
  three: 16,
  four: 24,
  five: 32,
  six: 64,
} as const;

export const BottomTabInset = Platform.select({ ios: 50, android: 80 }) ?? 0;
export const MaxContentWidth = 800;

// Köşe yuvarlaklığı, kenarlık kalınlığı ve 3D alt kenar kalınlığı: tek yerden değişsin diye sabit.
export const Radius = { sm: 10, md: 16, lg: 20, xl: 28, pill: 999 } as const;
export const Border = { thin: 1, thick: 2, chunky: 3 } as const;
export const Edge = 4; // "3D" butonların/kartların alt kenar kalınlığı
export const MinTouch = 44; // dokunma hedefi alt sınırı (dp)

// Gölge: yalnız boxShadow (RN 0.76+; iOS ve Android'de aynı çalışır, platforma göre shadow*/elevation yazmaya gerek yok).
// Koyu modda gölge görünmez, orada `useShadow()` hiçbir şey döndürmez.
export const Shadow = {
  card: { boxShadow: '0px 4px 12px rgba(20, 32, 28, 0.08)' },
  lifted: { boxShadow: '0px 8px 20px rgba(20, 32, 28, 0.16)' },
} as const;
