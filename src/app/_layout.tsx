import { BricolageGrotesque_600SemiBold } from '@expo-google-fonts/bricolage-grotesque/600SemiBold';
import { BricolageGrotesque_700Bold } from '@expo-google-fonts/bricolage-grotesque/700Bold';
import { Figtree_400Regular } from '@expo-google-fonts/figtree/400Regular';
import { Figtree_500Medium } from '@expo-google-fonts/figtree/500Medium';
import { Figtree_600SemiBold } from '@expo-google-fonts/figtree/600SemiBold';
import { Figtree_700Bold } from '@expo-google-fonts/figtree/700Bold';
import { useFonts } from 'expo-font';
import { DarkTheme, DefaultTheme, Stack, ThemeProvider } from 'expo-router';
import * as SplashScreen from 'expo-splash-screen';
import { Platform } from 'react-native';

import { AnimatedSplashOverlay } from '@/components/animated-icon';
import { AppErrorScreen } from '@/components/app-error';
import { webHeaderLeft } from '@/components/header-back-button';
import { XpToast } from '@/components/xp-toast';
import { Colors, Fonts } from '@/constants/theme';
import { useColorScheme } from '@/hooks/use-color-scheme';
import { useTheme } from '@/hooks/use-theme';
import { AuthProvider, useAuth } from '@/lib/auth-context';
import { usePendingIntentRunner } from '@/lib/auth-gate';
import { initSentry, wrapRoot } from '@/lib/sentry';

// Çökme takibi, her şeyden önce (modül yüklenirken) başlar. DSN yoksa hiçbir şey yapmaz.
initSentry();

SplashScreen.preventAutoHideAsync();

// Ekranlardan birinde yakalanmamış hata olursa Türkçe hata ekranı göster (Expo Router bu adı tanır)
export { AppErrorScreen as ErrorBoundary };

function RootLayout() {
  const colorScheme = useColorScheme();
  // Yazı tipi dosyalarını yükle. Her ağırlık ayrı aile adıdır (bkz. Fonts). Yüklenene kadar hiçbir şey
  // çizmiyoruz; yerel açılış ekranı (splash) AnimatedSplashOverlay çizilene kadar zaten açık kalır.
  // Yükleme hata verirse de (fontError) uygulamayı açarız: sistem yazı tipiyle çalışmaya devam eder.
  const [fontsLoaded, fontError] = useFonts({
    BricolageGrotesque_600SemiBold,
    BricolageGrotesque_700Bold,
    Figtree_400Regular,
    Figtree_500Medium,
    Figtree_600SemiBold,
    Figtree_700Bold,
  });
  if (!fontsLoaded && !fontError) return null;

  return (
    // Gezinme çerçevesinin (başlık, geçiş sırasındaki zemin) renkleri de bizim temadan gelsin
    <ThemeProvider value={navigationTheme(colorScheme)}>
      {/* AuthProvider en üstte: içindeki her ekran oturum bilgisine erişebilir */}
      <AuthProvider>
        <AnimatedSplashOverlay />
        <RootStack />
        {/* "+20 XP" bildirimi her ekranın üstünde görünsün diye kökte */}
        <XpToast />
      </AuthProvider>
    </ThemeProvider>
  );
}

// Sentry sarmalayıcısı kök bileşeni dinler; DSN yoksa bileşen aynen döner.
export default wrapRoot(RootLayout);

function navigationTheme(colorScheme: 'light' | 'dark' | 'unspecified' | null | undefined) {
  const dark = colorScheme === 'dark';
  const colors = Colors[dark ? 'dark' : 'light'];
  const base = dark ? DarkTheme : DefaultTheme;
  return {
    ...base,
    colors: { ...base.colors, background: colors.background, primary: colors.accent, card: colors.background },
  };
}

function RootStack() {
  const { session, loading } = useAuth();
  const theme = useTheme();
  // Girişten sonra bekleyen niyeti (örn. "bu haritayı seç") bir kez uygular. Hook kuralı: erken return'den önce.
  usePendingIntentRunner();

  // Telefondaki kayıtlı oturum okunurken hiçbir ekran gösterme (göz kırpmasın)
  if (loading) return null;

  return (
    // Sadece görünüm: başlık çubuğu ve zemin tema renginde. Mantık (Protected) aynı.
    <Stack
      screenOptions={{
        headerStyle: { backgroundColor: theme.background },
        headerShadowVisible: false,
        headerTintColor: theme.accentInk,
        headerTitleStyle: { fontFamily: Fonts.display },
        contentStyle: { backgroundColor: theme.background },
      }}>
      {/* Karşılama ("/"): herkese açık. Giriş yapmışsa ekranın kendisi /roadmap'e yönlendirir. */}
      <Stack.Screen name="index" options={{ headerShown: false }} />

      {/* HERKESE AÇIK ekranlar (misafir gezintisi): oturum olmadan da açılır.
          Hesap gerektiren işler ekranların içinde kayıt kapısına (useAuthGate) takılır. */}
      <Stack.Screen name="(tabs)" options={{ headerShown: false }} />
      {/* Katalog: misafir de haritalara bakabilir; seviye/devam adımında kayıt kapısına düşer */}
      <Stack.Screen name="onboarding" options={{ title: 'Yol haritanı seç' }} />
      {/* Harita önizleme (herkese açık): bölümler ve konular salt okunur; "Bu haritayı seç" kayıt kapısına düşer */}
      <Stack.Screen name="map/[id]" options={{ title: 'Harita' }} />
      {/* Konu detayı (kaynaklar + durum işaretleme). Başlığı ekran kendisi koyar (bölüm adı). */}
      <Stack.Screen name="topic/[id]" options={{ title: 'Konu' }} />

      {/* Yalnız GİRİŞ YAPMAMIŞ kullanıcının görebileceği ekran: oturum açılınca kapanır */}
      <Stack.Protected guard={!session}>
        {/* Giriş ekranı sade: başlık çubuğu boş, zemin rengi sayfayla aynı */}
        <Stack.Screen name="login" options={{ title: '' }} />
      </Stack.Protected>

      {/* Yalnız GİRİŞ YAPMIŞ kullanıcının görebileceği ekranlar */}
      <Stack.Protected guard={!!session}>
        {/* 3 soru + "haritan hazırlanıyor" anı. Başlık ve geri düğmesini ekranın kendisi ayarlar. */}
        <Stack.Screen name="roadmap-questions" options={{ title: 'Sana özel plan' }} />
        {/* Ayarlar bir klasör rotası: kendi iç Stack'i (settings/_layout.tsx) başlıkları koyar */}
        <Stack.Screen name="settings" options={{ headerShown: false }} />
        {/* Profil'deki "Tümü": tüm başarımlar */}
        <Stack.Screen
          name="achievements"
          options={{
            title: 'Başarımlar',
            headerLeft: Platform.OS === 'web' ? webHeaderLeft('/profile') : undefined,
          }}
        />
        {/* Topluluk › Vitrin için proje paylaşma formu */}
        <Stack.Screen
          name="showcase-new"
          options={{
            title: 'Projeni paylaş',
            // Web'de varsayılan geri oku küçük (30 px); doğrudan açılışta hiç görünmeyebiliyor: 44 pt'lik özel düğme
            headerLeft: Platform.OS === 'web' ? webHeaderLeft('/community') : undefined,
          }}
        />
      </Stack.Protected>
    </Stack>
  );
}
