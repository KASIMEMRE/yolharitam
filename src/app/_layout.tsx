import { DarkTheme, DefaultTheme, Stack, ThemeProvider } from 'expo-router';
import * as SplashScreen from 'expo-splash-screen';

import { AnimatedSplashOverlay } from '@/components/animated-icon';
import { XpToast } from '@/components/xp-toast';
import { Colors } from '@/constants/theme';
import { useColorScheme } from '@/hooks/use-color-scheme';
import { useTheme } from '@/hooks/use-theme';
import { AuthProvider, useAuth } from '@/lib/auth-context';

SplashScreen.preventAutoHideAsync();

export default function RootLayout() {
  const colorScheme = useColorScheme();
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

  // Telefondaki kayıtlı oturum okunurken hiçbir ekran gösterme (göz kırpmasın)
  if (loading) return null;

  return (
    // Sadece görünüm: başlık çubuğu ve zemin tema renginde. Mantık (Protected) aynı.
    <Stack
      screenOptions={{
        headerStyle: { backgroundColor: theme.background },
        headerShadowVisible: false,
        headerTintColor: theme.accentInk,
        headerTitleStyle: { fontWeight: '900' },
        contentStyle: { backgroundColor: theme.background },
      }}>
      {/* GİRİŞ YAPMAMIŞ kullanıcının görebileceği ekranlar */}
      <Stack.Protected guard={!session}>
        <Stack.Screen name="index" options={{ headerShown: false }} />
        {/* Giriş ekranının üst "sahnesi" accentSoft olduğu için başlık çubuğu da aynı renk (kesintisiz görünsün) */}
        <Stack.Screen
          name="login"
          options={{ title: '', headerStyle: { backgroundColor: theme.accentSoft } }}
        />
      </Stack.Protected>

      {/* GİRİŞ YAPMIŞ kullanıcının görebileceği ekranlar */}
      <Stack.Protected guard={!!session}>
        <Stack.Screen name="(tabs)" options={{ headerShown: false }} />
        <Stack.Screen name="onboarding" options={{ title: 'Yol haritanı seç' }} />
        {/* 3 soru + "haritan hazırlanıyor" anı. Başlık ve geri düğmesini ekranın kendisi ayarlar. */}
        <Stack.Screen name="roadmap-questions" options={{ title: 'Sana özel plan' }} />
        {/* Konu detayı (kaynaklar + durum işaretleme). Başlığı ekran kendisi koyar (bölüm adı). */}
        <Stack.Screen name="topic/[id]" options={{ title: 'Konu' }} />
        <Stack.Screen name="settings" options={{ title: 'Ayarlar' }} />
      </Stack.Protected>
    </Stack>
  );
}
