import type { ErrorBoundaryProps } from 'expo-router';
import { useEffect } from 'react';
import { StyleSheet, View } from 'react-native';

import { Button } from '@/components/button';
import { ThemedText } from '@/components/themed-text';
import { Spacing } from '@/constants/theme';
import { useTheme } from '@/hooks/use-theme';
import { reportError } from '@/lib/sentry';

// Beklenmedik bir çizim hatasında Expo Router'ın İngilizce varsayılan ekranı yerine bu çıkar.
// "Tekrar dene" hatalı ekranı yeniden çizer; kullanıcının verisi kaybolmaz (her şey sunucuda).
export function AppErrorScreen({ error, retry }: ErrorBoundaryProps) {
  const theme = useTheme();
  if (__DEV__) console.warn('Ekran hatası:', error);
  // Hata sınırı hatayı yakaladığı için Sentry kendiliğinden görmez; buradan bildiriyoruz.
  useEffect(() => {
    reportError(error);
  }, [error]);
  return (
    <View style={[styles.wrap, { backgroundColor: theme.background }]}>
      <ThemedText type="heading" style={styles.center} accessibilityRole="header">
        Bir şeyler ters gitti
      </ThemedText>
      <ThemedText themeColor="textSecondary" style={styles.center}>
        İlerlemen güvende. Tekrar dene.
      </ThemedText>
      <Button label="Tekrar dene" onPress={retry} />
    </View>
  );
}

const styles = StyleSheet.create({
  wrap: { flex: 1, alignItems: 'center', justifyContent: 'center', gap: Spacing.three, padding: Spacing.four },
  center: { textAlign: 'center' },
});
