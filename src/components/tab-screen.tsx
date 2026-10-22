import type { ReactNode } from 'react';
import { Platform, RefreshControl, ScrollView, StyleSheet, useWindowDimensions, View } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';

import { ThemedView } from '@/components/themed-view';
import { BottomTabInset, MaxContentWidth, Spacing } from '@/constants/theme';

// Sekme ekranlarının ortak çerçevesi: güvenli alan + kaydırılabilir içerik + kenar boşlukları.
// Neden ortak: üç sekme ekranı aynı boşlukları ve web sekme çubuğu payını paylaşıyor.
// onRefresh verilirse ekran aşağı çekilerek yenilenebilir (yoksa davranış değişmez).
type TabScreenProps = { children: ReactNode; onRefresh?: () => void; refreshing?: boolean };

export function TabScreen({ children, onRefresh, refreshing = false }: TabScreenProps) {
  const { width } = useWindowDimensions();
  const gutter = width < 360 ? Spacing.three : Spacing.four;
  // Web'de sekme çubuğu içeriğin ÜSTÜNE biner (geniş ekranda üstte, dar ekranda altta): pay bırak
  const web = Platform.OS === 'web';
  const webTop = web && width >= 600 ? 80 : 0;
  const webBottom = web && width < 600 ? 80 : 0;

  return (
    <ThemedView style={styles.container}>
      <SafeAreaView style={styles.container} edges={['top']}>
        {/* Klavye açıkken butona tek dokunuşla basılsın (handled), kaydırınca klavye kapansın,
            odaklı alan klavyenin altında kalmasın (automaticallyAdjustKeyboardInsets) */}
        <ScrollView
          keyboardShouldPersistTaps="handled"
          keyboardDismissMode="on-drag"
          automaticallyAdjustKeyboardInsets
          refreshControl={onRefresh ? <RefreshControl refreshing={refreshing} onRefresh={onRefresh} /> : undefined}
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
