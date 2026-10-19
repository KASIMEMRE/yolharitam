import { DarkTheme, DefaultTheme, Stack, ThemeProvider } from 'expo-router';
import * as SplashScreen from 'expo-splash-screen';
import { useColorScheme } from 'react-native';

import { AnimatedSplashOverlay } from '@/components/animated-icon';
import { AuthProvider, useAuth } from '@/lib/auth-context';

SplashScreen.preventAutoHideAsync();

export default function RootLayout() {
  const colorScheme = useColorScheme();
  return (
    <ThemeProvider value={colorScheme === 'dark' ? DarkTheme : DefaultTheme}>
      {/* AuthProvider en üstte: içindeki her ekran oturum bilgisine erişebilir */}
      <AuthProvider>
        <AnimatedSplashOverlay />
        <RootStack />
      </AuthProvider>
    </ThemeProvider>
  );
}

function RootStack() {
  const { session, loading } = useAuth();

  // Telefondaki kayıtlı oturum okunurken hiçbir ekran gösterme (göz kırpmasın)
  if (loading) return null;

  return (
    <Stack>
      {/* GİRİŞ YAPMAMIŞ kullanıcının görebileceği ekranlar */}
      <Stack.Protected guard={!session}>
        <Stack.Screen name="index" options={{ headerShown: false }} />
        <Stack.Screen name="login" options={{ title: '' }} />
      </Stack.Protected>

      {/* GİRİŞ YAPMIŞ kullanıcının görebileceği ekranlar */}
      <Stack.Protected guard={!!session}>
        <Stack.Screen name="(tabs)" options={{ headerShown: false }} />
        <Stack.Screen name="onboarding" options={{ title: 'Konunu seç' }} />
      </Stack.Protected>
    </Stack>
  );
}
