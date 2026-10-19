import { Link } from 'expo-router';
import { Platform, Pressable, ScrollView, StyleSheet, View } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';

import { RouteSteps } from '@/components/route-steps';
import { ThemedText } from '@/components/themed-text';
import { ThemedView } from '@/components/themed-view';
import { WebBadge } from '@/components/web-badge';
import { MaxContentWidth, Spacing } from '@/constants/theme';
import { useTheme } from '@/hooks/use-theme';

// Giriş ekranıyla aynı üç durak: kullanıcı yolculuğu baştan görsün
const STEPS = ['Hesabını oluştur', 'Konunu ve seviyeni seç', 'Kişisel yol haritanı al'];

// Karşılama ekranı: uygulama açılınca ilk görünen sayfa ("/")
export default function WelcomeScreen() {
  const theme = useTheme();

  return (
    <ThemedView style={styles.container}>
      <SafeAreaView style={styles.safeArea}>
        {/* ScrollView: küçük ekranlarda veya büyük yazı boyutunda içerik taşarsa kaydırılabilsin */}
        <ScrollView contentContainerStyle={styles.content}>
          <View style={styles.intro}>
            <ThemedText type="smallBold" themeColor="accent">
              YOL HARİTAM
            </ThemedText>
            <ThemedText type="subtitle">Öğrenme rotanı birlikte çizelim</ThemedText>
            <ThemedText themeColor="textSecondary">
              Yol Haritam, seçtiğin konu ve seviyene göre sana özel bir öğrenme yol haritası
              hazırlar.
            </ThemedText>
          </View>

          {/* current={0}: ilk durak vurgulanır, yani yolculuk buradan başlıyor */}
          <RouteSteps steps={STEPS} current={0} />

          {/* Link asChild: Link kendi görünümünü çizmez, içindeki Pressable'a basılınca gezinmeyi tetikler */}
          <Link href="/login" asChild>
            <Pressable
              accessibilityRole="button"
              style={({ pressed }) => [
                styles.button,
                { backgroundColor: theme.accent },
                pressed && styles.pressed,
              ]}>
              <ThemedText type="smallBold" style={{ color: theme.onAccent }}>
                Başla →
              </ThemedText>
            </Pressable>
          </Link>
        </ScrollView>

        {Platform.OS === 'web' && <WebBadge />}
      </SafeAreaView>
    </ThemedView>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
  },
  safeArea: {
    flex: 1,
  },
  content: {
    flexGrow: 1,
    justifyContent: 'center',
    padding: Spacing.four,
    gap: Spacing.four,
    maxWidth: MaxContentWidth,
    width: '100%',
    alignSelf: 'center',
  },
  intro: {
    gap: Spacing.two,
  },
  button: {
    paddingVertical: Spacing.three,
    borderRadius: Spacing.five,
    alignItems: 'center',
    justifyContent: 'center',
    minHeight: 52,
  },
  pressed: {
    opacity: 0.8,
  },
});
