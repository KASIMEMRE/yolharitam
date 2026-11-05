/**
 * Below are the colors that are used in the app. The colors are defined in the light and dark mode.
 * There are many other ways to style your app. For example, [Nativewind](https://www.nativewind.dev/), [Tamagui](https://tamagui.dev/), [unistyles](https://reactnativeunistyles.vercel.app), etc.
 */

import '@/global.css';

import { Platform } from 'react-native';

// Renk jetonları (design tokens): ekranlarda hiç hex yazılmaz, hep bu isimler kullanılır.
// Palet: bir ana renk (mürekkep = `accent`) + tek vurgu (mercan = `marker`) + nötrler.
// Kural: renkli YAZI her zaman `*Ink`, renkli ZEMİN `*Soft`, nokta/dolgu düz renk, ince çerçeve `*Edge`.
// (Artık 3D alt kenar yok; `*Edge` yalnız koyu tonlu ince çerçeve rengi.) Böylece açık ve koyu modda
// kontrast tek yerden garanti edilir.
// Önemli: light ve dark AYNI anahtarlara sahip olmalı, yoksa ThemeColor tipi daralır.
export const Colors = {
  light: {
    text: '#1C1B1F',
    background: '#FAF8F5',
    card: '#FFFFFF',
    backgroundElement: '#F1EDE8',
    backgroundSelected: '#E8E4DF',
    textSecondary: '#5F5C63',
    border: '#E7E3DE',
    borderStrong: '#77737A',
    borderEdge: '#DDD6CE',
    // Marka renkleri: mürekkep (ana eylem, "bitti", ilerleme) ve mercan (yalnız "şimdi / çalışıyorum", seri, XP)
    accent: '#1C1B1F',
    accentEdge: '#000000',
    accentSoft: '#F1EDE8',
    accentInk: '#1C1B1F',
    onAccent: '#FFFFFF', // accent zemin üstündeki yazı rengi
    marker: '#E4572E',
    markerEdge: '#B8401F',
    markerSoft: '#FBE3DA',
    markerInk: '#C2401C',
    onMarker: '#FFFFFF',
    // Harita renk aileleri (hue): soluk tonlar; yalnız küçük noktada ya da yumuşak zeminde kullanılır
    sky: '#8C9AAD',
    skyEdge: '#6F7D90',
    skySoft: '#ECEFF3',
    skyInk: '#46566B',
    coral: '#C4917F',
    coralEdge: '#A37564',
    coralSoft: '#F5ECE8',
    coralInk: '#7A4A3A',
    violet: '#A497B0',
    violetEdge: '#85789A',
    violetSoft: '#EFECF2',
    violetInk: '#5A4C6A',
    berry: '#B8919F',
    berryEdge: '#977381',
    berrySoft: '#F4ECEF',
    berryInk: '#74485A',
    leaf: '#93A585',
    leafEdge: '#76876A',
    leafSoft: '#EEF1EA',
    leafInk: '#4B5C3F',
    warningBackground: '#FBEBD3', // hata/uyarı kutusu zemini
    warningInk: '#6B3F00',
  },
  dark: {
    text: '#F3F1EE',
    background: '#141316',
    card: '#1F1D21',
    backgroundElement: '#1F1D21',
    backgroundSelected: '#2B292E',
    textSecondary: '#A6A2A9',
    border: '#2B292E',
    borderStrong: '#7C7880',
    borderEdge: '#353238',
    accent: '#F3F1EE',
    accentEdge: '#C9C5CC',
    accentSoft: '#1F1D21',
    accentInk: '#F3F1EE',
    onAccent: '#141316',
    marker: '#F06A42',
    markerEdge: '#B8502F',
    markerSoft: '#3A1F17',
    markerInk: '#FF8A66',
    onMarker: '#141316',
    sky: '#8C9AAD',
    skyEdge: '#6F7D90',
    skySoft: '#1E2229',
    skyInk: '#B4C0CF',
    coral: '#C4917F',
    coralEdge: '#A37564',
    coralSoft: '#2A201C',
    coralInk: '#E0B9AA',
    violet: '#A497B0',
    violetEdge: '#85789A',
    violetSoft: '#231F28',
    violetInk: '#C7BCD3',
    berry: '#B8919F',
    berryEdge: '#977381',
    berrySoft: '#281E22',
    berryInk: '#DDBCC8',
    leaf: '#93A585',
    leafEdge: '#76876A',
    leafSoft: '#1E231B',
    leafInk: '#BCCBB0',
    warningBackground: '#3B2B12',
    warningInk: '#F6D9A6',
  },
} as const;

export type ThemeColor = keyof typeof Colors.light & keyof typeof Colors.dark;

// Yazı tipleri: başlıklar Bricolage Grotesque, metin Figtree. Bunlar `_layout.tsx`'te `useFonts` ile yüklenir.
// React Native'de özel yazı tipinde `fontWeight` dosya SEÇMEZ: her ağırlık ayrı aile adıdır
// (ör. 'Figtree_600SemiBold'). Bu yüzden ağırlığı stile değil, aşağıdaki aile adına yazıyoruz.
// Ekranlarda elle `fontWeight` yazma; `ThemedText` türlerini kullan.
export const Fonts = {
  sans: 'Figtree_400Regular',
  sansMedium: 'Figtree_500Medium',
  sansSemiBold: 'Figtree_600SemiBold',
  sansBold: 'Figtree_700Bold',
  display: 'BricolageGrotesque_600SemiBold',
  displayBold: 'BricolageGrotesque_700Bold',
  mono: Platform.select({ ios: 'Menlo', web: 'var(--font-mono)', default: 'monospace' }),
} as const;

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

// Köşe yuvarlaklığı ve kenarlık kalınlığı: tek yerden değişsin diye sabit.
// Kartlar 14 (lg), butonlar ve giriş alanları 10 (md), küçük öğeler 8 (sm). Hap (pill) yalnız küçük etiketlerde.
export const Radius = { sm: 8, md: 10, lg: 14, xl: 18, pill: 999 } as const;
export const Border = { thin: 1, thick: 2, chunky: 3 } as const;
export const MinTouch = 44; // dokunma hedefi alt sınırı (dp)

// Gölge: neredeyse yok. Ayrım için ince `border` çizgisi ve boşluk kullanılır; yalnız kutlama
// penceresi gibi ekranın üstünde yüzen öğelerde çok hafif bir gölge kalır.
// Koyu modda gölge görünmez, orada `useShadow()` hiçbir şey döndürmez.
export const Shadow = {
  card: { boxShadow: '0px 1px 2px rgba(28, 27, 31, 0.04)' },
  lifted: { boxShadow: '0px 4px 12px rgba(28, 27, 31, 0.08)' },
} as const;
