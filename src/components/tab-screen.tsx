import type { ReactNode } from 'react';
import { Platform, ScrollView, StyleSheet, useWindowDimensions, View } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';

import { ThemedView } from '@/components/themed-view';
import { BottomTabInset, MaxContentWidth, Spacing } from '@/constants/theme';

// Sekme ekranlarının ortak çerçevesi: güvenli alan + kaydırılabilir içerik + kenar boşlukları.
// Neden ortak: üç sekme ekranı aynı boşlukları ve web sekme çubuğu payını paylaşıyor.
export function TabScreen({ children }: { children: ReactNode }) {
  const { width } = useWindowDimensions();
  const gutter = width < 360 ? Spacing.three : Spacing.four;
  // Web'de sekme çubuğu içeriğin ÜSTÜNE biner (geniş ekranda üstte, dar ekranda altta): pay bırak
  const web = Platform.OS === 'web';
  const webTop = web && width >= 600 ? 80 : 0;
  const webBottom = web && width < 600 ? 80 : 0;

  return (
    <ThemedView style={styles.container}>
      <SafeAreaView style={styles.container} edges={['top']}>
        <ScrollView
          contentContainerStyle={{
            padding: gutter,
            paddingTop: gutter + webTop,
            paddingBottom: BottomTabInset + Spacing.five + webBottom,
          }}>
          <View style={styles.content}>{children}</View>
        </ScrollView>
      </SafeAreaView>
    </ThemedView>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1 },
  content: { width: '100%', maxWidth: MaxContentWidth, alignSelf: 'center', gap: Spacing.four },
});
