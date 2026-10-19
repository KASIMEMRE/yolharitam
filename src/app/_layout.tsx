import { DarkTheme, DefaultTheme, Stack, ThemeProvider } from 'expo-router';
import * as SplashScreen from 'expo-splash-screen';
import { useColorScheme } from 'react-native';

import { AnimatedSplashOverlay } from '@/components/animated-icon';
import { Colors } from '@/constants/theme';
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
        {/* Kod ekranı da oturumsuz kullanıcıya ait: doğrulama bitip oturum gelince bu grup kapanır
            ve ekran kendiliğinden düşer (elle router.replace gerekmez). Başlık login ile aynı. */}
        <Stack.Screen
          name="verify-email"
          options={{ title: '', headerStyle: { backgroundColor: theme.accentSoft }, headerBackButtonDisplayMode: 'minimal' }}
        />
      </Stack.Protected>

      {/* GİRİŞ YAPMIŞ kullanıcının görebileceği ekranlar */}
      <Stack.Protected guard={!!session}>
        <Stack.Screen name="(tabs)" options={{ headerShown: false }} />
        <Stack.Screen name="onboarding" options={{ title: 'Konunu seç' }} />
      </Stack.Protected>
    </Stack>
  );
}
