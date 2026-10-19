import { DarkTheme, DefaultTheme, Stack, ThemeProvider } from 'expo-router';
import * as SplashScreen from 'expo-splash-screen';
import { useColorScheme } from 'react-native';

import { AnimatedSplashOverlay } from '@/components/animated-icon';

SplashScreen.preventAutoHideAsync();

// Kök düzen: Uygulamadaki tüm ekranlar bu "Stack" (yığın) içinde.
// Stack'te yeni açılan ekran öncekinin üstüne biner, geri tuşu bir öncekine döner.
export default function RootLayout() {
  const colorScheme = useColorScheme();
  return (
    <ThemeProvider value={colorScheme === 'dark' ? DarkTheme : DefaultTheme}>
      <AnimatedSplashOverlay />
      <Stack>
        {/* Karşılama ekranı: üst başlık çubuğu yok */}
        <Stack.Screen name="index" options={{ headerShown: false }} />
        {/* Alan + seviye seçimi: üstte başlık ve geri butonu olsun */}
        <Stack.Screen name="onboarding" options={{ title: 'Alanını seç' }} />
        {/* Sekmeli ana bölüm: başlıkları sekmelerin kendisi yönetiyor */}
        <Stack.Screen name="(tabs)" options={{ headerShown: false }} />
      </Stack>
    </ThemeProvider>
  );
}
