import type { ErrorBoundaryProps } from 'expo-router';
import { StyleSheet, View } from 'react-native';

import { Button } from '@/components/button';
import { IconTile } from '@/components/icon-tile';
import { ThemedText } from '@/components/themed-text';
import { Spacing } from '@/constants/theme';
import { useTheme } from '@/hooks/use-theme';

// Beklenmedik bir çizim hatasında Expo Router'ın İngilizce varsayılan ekranı yerine bu çıkar.
// "Tekrar dene" hatalı ekranı yeniden çizer; kullanıcının verisi kaybolmaz (her şey sunucuda).
export function AppErrorScreen({ error, retry }: ErrorBoundaryProps) {
  const theme = useTheme();
  if (__DEV__) console.warn('Ekran hatası:', error);
  return (
    <View style={[styles.wrap, { backgroundColor: theme.background }]}>
      <IconTile emoji="⚠️" tone="marker" size={64} />
      <ThemedText type="heading" style={styles.center} accessibilityRole="header">
        Bir şeyler ters gitti
      </ThemedText>
      <ThemedText themeColor="textSecondary" style={styles.center}>
        Bu ekran açılırken beklenmedik bir sorun oluştu. İlerlemen güvende; tekrar denemen yeterli.
      </ThemedText>
      <Button icon="🔄" label="Tekrar dene" onPress={retry} />
    </View>
  );
}

const styles = StyleSheet.create({
  wrap: { flex: 1, alignItems: 'center', justifyContent: 'center', gap: Spacing.three, padding: Spacing.four },
  center: { textAlign: 'center' },
});
