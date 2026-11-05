import { Redirect, router } from 'expo-router';
import { useEffect, useState } from 'react';
import { ScrollView, StyleSheet, useWindowDimensions } from 'react-native';
import Animated, { FadeIn, FadeInDown, useReducedMotion } from 'react-native-reanimated';
import { SafeAreaView } from 'react-native-safe-area-context';

import { Button } from '@/components/button';
import { ThemedText } from '@/components/themed-text';
import { ThemedView } from '@/components/themed-view';
import { MaxContentWidth, Spacing } from '@/constants/theme';
import { useAuth } from '@/lib/auth-context';
import { markWelcomeSeen, readWelcomeSeen } from '@/lib/welcome-seen';

// Karşılama ekranı: uygulama açılınca ilk görünen sayfa ("/")
export default function WelcomeScreen() {
  const { session } = useAuth();
  // null = cihazdaki "karşılamayı gördü" bilgisi henüz okunuyor
  const [seen, setSeen] = useState<boolean | null>(null);
  useEffect(() => {
    readWelcomeSeen().then(setSeen);
  }, []);
  const { width } = useWindowDimensions();
  const reduceMotion = useReducedMotion();
  const gutter = width < 360 ? Spacing.three : Spacing.four;
  // Dar ekranda büyük başlık sığmaz; küçült
  const narrow = width < 360;

  // Hareketi azalt açıksa yalnız yumuşak belirme; kayma/yay yok
  const enter = (delay: number) =>
    reduceMotion ? FadeIn.duration(150) : FadeInDown.duration(300).delay(delay);

  // Giriş yapmış kullanıcı karşılamayı görmez, doğrudan Yol Haritam sekmesine gider.
  // (Bu ekran korumalı grupta değil: expo-router 58 korunan "/" yerine grup adresine "/(tabs)" yönlendirip
  // web'de "sayfa bulunamadı" gösteriyordu. Yönlendirmeyi açık adresle kendimiz yapıyoruz.)
  if (session) return <Redirect href="/roadmap" />;

  // Okuma sürerken boş zemin göster: karşılama bir an görünüp sekmelere atlamasın (ekran zıplaması)
  if (seen === null) return <ThemedView style={styles.container} />;
  // Karşılamayı daha önce gören misafir doğrudan sekmelere gider
  if (seen) return <Redirect href="/roadmap" />;

  return (
    <ThemedView style={styles.container}>
      <SafeAreaView style={styles.safeArea}>
        {/* Sade karşılama: büyük Bricolage başlık + tek kısa cümle; süs illüstrasyonu yok */}
        <ScrollView contentContainerStyle={[styles.scroll, { paddingHorizontal: gutter }]}>
          <Animated.View entering={enter(0)}>
            <ThemedText type="display" accessibilityRole="header" style={narrow ? styles.titleNarrow : styles.title}>
              Yol Haritam
            </ThemedText>
          </Animated.View>
          <Animated.View entering={enter(100)}>
            <ThemedText themeColor="textSecondary" style={styles.lead}>
              Sana uyan yazılımcı yol haritasını seç, konu konu ilerle.
            </ThemedText>
          </Animated.View>
        </ScrollView>

        {/* Buton ScrollView'un dışında, altta sabit: küçük ekranda da hep görünür.
            Animasyon bitmeden de basılabilir (disabled yok). */}
        <Animated.View
          entering={enter(450)}
          style={[styles.footer, { paddingHorizontal: gutter }]}>
          {/* Birincil: hesap açmadan gezmek (misafir sekmeleri). replace: geri tuşu karşılamaya dönmesin. */}
          <Button
            label="Gezinmeye başla"
            onPress={() => {
              void markWelcomeSeen();
              router.replace('/roadmap');
            }}
          />
          {/* İkincil: hesabı olan geri dönen kullanıcı. Kayıt ekranı gezinirken kayıt kapısından açılır. */}
          <Button
            variant="secondary"
            label="Giriş yap"
            onPress={() => {
              void markWelcomeSeen();
              router.push({ pathname: '/login', params: { mode: 'login' } });
            }}
          />
        </Animated.View>
      </SafeAreaView>
    </ThemedView>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1, alignItems: 'center' },
  safeArea: { flex: 1, width: '100%', maxWidth: MaxContentWidth },
  // İçerik alta yakın, sola yaslı: butonlara doğru okunur
  scroll: { flexGrow: 1, justifyContent: 'flex-end', gap: Spacing.three, paddingTop: Spacing.five, paddingBottom: Spacing.five },
  title: { fontSize: 52, lineHeight: 56, letterSpacing: -1 },
  titleNarrow: { fontSize: 42, lineHeight: 46, letterSpacing: -0.8 },
  lead: { maxWidth: 320 },
  footer: { gap: Spacing.two, paddingTop: Spacing.two, paddingBottom: Spacing.three },
});
