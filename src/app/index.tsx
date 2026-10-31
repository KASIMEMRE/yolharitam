import { Link, Redirect } from 'expo-router';
import { ScrollView, StyleSheet, useWindowDimensions, View } from 'react-native';
import Animated, { FadeIn, FadeInDown, useReducedMotion } from 'react-native-reanimated';
import { SafeAreaView } from 'react-native-safe-area-context';

import { Button } from '@/components/button';
import { TrailMap } from '@/components/route-steps';
import { ThemedText } from '@/components/themed-text';
import { ThemedView } from '@/components/themed-view';
import { MaxContentWidth, Spacing } from '@/constants/theme';
import { useAuth } from '@/lib/auth-context';

// Üç gerçek adım: uygulamanın gerçekten izlediği yol
const STOPS = [
  { emoji: '🔑', label: 'Hesabını oluştur' },
  { emoji: '🧭', label: 'Yol haritanı ve seviyeni seç' },
  { emoji: '🗺️', label: 'Kişisel yol haritanı al' },
];

// Karşılama ekranı: uygulama açılınca ilk görünen sayfa ("/")
export default function WelcomeScreen() {
  const { session } = useAuth();
  const { width } = useWindowDimensions();
  const reduceMotion = useReducedMotion();
  const gutter = width < 360 ? Spacing.three : Spacing.four;
  // Dar ekranda 48pt başlık (≈290pt geniş) sığmaz; küçült
  const narrow = width < 360;

  // Hareketi azalt açıksa yalnız yumuşak belirme; kayma/yay yok
  const enter = (delay: number) =>
    reduceMotion ? FadeIn.duration(150) : FadeInDown.duration(300).delay(delay);

  // Giriş yapmış kullanıcı karşılamayı görmez, doğrudan Yol Haritam sekmesine gider.
  // (Bu ekran korumalı grupta değil: expo-router 58 korunan "/" yerine grup adresine "/(tabs)" yönlendirip
  // web'de "sayfa bulunamadı" gösteriyordu. Yönlendirmeyi açık adresle kendimiz yapıyoruz.)
  if (session) return <Redirect href="/roadmap" />;

  return (
    <ThemedView style={styles.container}>
      <SafeAreaView style={styles.safeArea}>
        <ScrollView contentContainerStyle={[styles.scroll, { paddingHorizontal: gutter }]}>
          <Animated.View entering={enter(0)}>
            <ThemedText
              type="display"
              style={[styles.center, narrow && { fontSize: 40, lineHeight: 44 }]}>
              Yol Haritam
            </ThemedText>
          </Animated.View>
          <Animated.View entering={enter(100)}>
            <ThemedText themeColor="textSecondary" style={[styles.center, styles.lead]}>
              Frontend’den yapay zekâya: sana uyan yazılımcı yol haritasını seç, konu konu ilerle.
            </ThemedText>
          </Animated.View>

          <View style={styles.trail}>
            <TrailMap stops={STOPS} current={0} variant="vertical" />
          </View>
        </ScrollView>

        {/* Buton ScrollView'un dışında, altta sabit: küçük ekranda da hep görünür.
            Animasyon bitmeden de basılabilir (disabled yok). */}
        <Animated.View
          entering={enter(450)}
          style={[styles.footer, { paddingHorizontal: gutter }]}>
          {/* Link: başka bir ekrana geçiş. asChild = Link'in davranışını Button'a ver */}
          {/* Yeni kullanıcı doğrudan kayıt formuna gider; mode parametresini login.tsx okur */}
          <Link href={{ pathname: '/login', params: { mode: 'signup' } }} asChild>
            <Button label="Yolculuğa başla" />
          </Link>
          {/* Hesabı olan geri dönen kullanıcı için ayrı, ikincil yol */}
          <Link href={{ pathname: '/login', params: { mode: 'signin' } }} asChild>
            <Button variant="secondary" label="Hesabım var, giriş yap" />
          </Link>
        </Animated.View>
      </SafeAreaView>
    </ThemedView>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1, alignItems: 'center' },
  safeArea: { flex: 1, width: '100%', maxWidth: MaxContentWidth },
  scroll: { flexGrow: 1, paddingTop: Spacing.five, paddingBottom: Spacing.three },
  center: { textAlign: 'center' },
  lead: { alignSelf: 'center', maxWidth: 320, marginTop: Spacing.two },
  // Kalan alanda dikey ortala: uzun ekranda patika üstte yapışık kalmasın
  trail: { flex: 1, justifyContent: 'center', marginTop: Spacing.four },
  footer: { gap: Spacing.two, paddingTop: Spacing.two, paddingBottom: Spacing.three },
});
