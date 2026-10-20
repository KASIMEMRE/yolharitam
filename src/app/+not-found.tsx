import { Link, Redirect, Stack, usePathname } from 'expo-router';
import { StyleSheet, View } from 'react-native';

import { Button } from '@/components/button';
import { ThemedText } from '@/components/themed-text';
import { ThemedView } from '@/components/themed-view';
import { MaxContentWidth, Spacing } from '@/constants/theme';
import { useAuth } from '@/lib/auth-context';

// Eşleşmeyen adres için Türkçe 404 ekranı (Expo Router "+not-found" dosyasını otomatik kullanır).
export default function NotFoundScreen() {
  const { session } = useAuth();
  const pathname = usePathname();

  // Oturum açıkken "/" ve "/login" korumalı (yalnız girişsizlere açık) olduğu için buraya düşer;
  // bu bir hata değil, kullanıcıyı doğrudan Yol Haritam'a alırız.
  if (session && (pathname === '/' || pathname === '/login')) return <Redirect href="/roadmap" />;

  return (
    <ThemedView style={styles.container}>
      <Stack.Screen options={{ title: '' }} />
      <View style={styles.inner}>
        <ThemedText type="display" style={styles.center}>
          🧭
        </ThemedText>
        <ThemedText type="heading" style={styles.center}>
          Bu sayfa bulunamadı
        </ThemedText>
        <ThemedText themeColor="textSecondary" style={styles.center}>
          Aradığın adres yanlış ya da artık yok olabilir.
        </ThemedText>
        {/* "/" -> giriş yapmışsa Yol Haritam'a, yapmamışsa karşılamaya yönlendirilir (Stack.Protected) */}
        <Link href="/" asChild>
          <Button label="Ana sayfaya dön" />
        </Link>
      </View>
    </ThemedView>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1, alignItems: 'center', justifyContent: 'center', padding: Spacing.four },
  inner: { width: '100%', maxWidth: MaxContentWidth, gap: Spacing.three },
  center: { textAlign: 'center' },
});
