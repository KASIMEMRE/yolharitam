import type { ReactNode } from 'react';
import { ScrollView, StyleSheet, useWindowDimensions, View } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';

import { ThemedText } from '@/components/themed-text';
import { ThemedView } from '@/components/themed-view';
import { MaxContentWidth, Spacing } from '@/constants/theme';

// Ayarlar alt sayfalarının ortak çerçevesi: zemin + güvenli alan + kaydırma + kenar boşlukları.
// Neden ortak: altı sayfa aynı boşlukları paylaşıyor; başlığı üstteki gezinme çubuğu koyar.
// `intro`: sayfanın ne işe yaradığını anlatan tek satır (isteğe bağlı).
export function SettingsPage({ intro, children }: { intro?: string; children: ReactNode }) {
  const { width } = useWindowDimensions();
  const gutter = width < 360 ? Spacing.three : Spacing.four;
  return (
    <ThemedView style={styles.flex}>
      <SafeAreaView style={styles.flex} edges={['bottom']}>
        <ScrollView
          style={styles.flex}
          keyboardShouldPersistTaps="handled"
          contentContainerStyle={[styles.content, { padding: gutter }]}>
          <View style={styles.inner}>
            {intro ? (
              <ThemedText type="small" themeColor="textSecondary">
                {intro}
              </ThemedText>
            ) : null}
            {children}
          </View>
        </ScrollView>
      </SafeAreaView>
    </ThemedView>
  );
}

const styles = StyleSheet.create({
  flex: { flex: 1 },
  content: { alignItems: 'center' },
  inner: { width: '100%', maxWidth: MaxContentWidth, gap: Spacing.four },
});
