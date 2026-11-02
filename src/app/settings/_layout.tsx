import { Stack } from 'expo-router';
import { Platform } from 'react-native';

import { webHeaderLeft } from '@/components/header-back-button';
import { useTheme } from '@/hooks/use-theme';

// Doğrudan /settings/maps gibi bir adrese girilince (web yenileme, derin bağlantı) altında Ayarlar listesi
// bulunsun: geri düğmesi Profil'e değil, önce Ayarlar listesine götürür.
export const unstable_settings = { initialRouteName: 'index' };

// Ayarlar kendi iç Stack'ine sahip: kök Stack'teki `settings` kaydı başlığı gizler, başlıkları burada koyarız.
// Kök Stack'in başlık stili iç Stack'e geçmez; aynı görünüm için burada yeniden verilir.
export default function SettingsLayout() {
  const theme = useTheme();
  const web = Platform.OS === 'web';
  return (
    <Stack
      screenOptions={{
        headerStyle: { backgroundColor: theme.background },
        headerShadowVisible: false,
        headerTintColor: theme.accentInk,
        headerTitleStyle: { fontWeight: '900' },
        contentStyle: { backgroundColor: theme.background },
        // Web'de varsayılan geri oku küçük: 44pt'lik özel düğme (native'de sistemin geri düğmesi kalır)
        headerLeft: web ? webHeaderLeft('/settings') : undefined,
      }}>
      <Stack.Screen
        name="index"
        options={{ title: 'Ayarlar', headerLeft: web ? webHeaderLeft('/profile') : undefined }}
      />
      <Stack.Screen name="maps" options={{ title: 'Haritalarım' }} />
      <Stack.Screen name="appearance" options={{ title: 'Görünüm' }} />
      <Stack.Screen name="account" options={{ title: 'Hesap ve güvenlik' }} />
      <Stack.Screen name="blocked" options={{ title: 'Engellenen kullanıcılar' }} />
      <Stack.Screen name="about" options={{ title: 'Hakkında ve yasal' }} />
    </Stack>
  );
}
