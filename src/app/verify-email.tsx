import { Redirect, router, useLocalSearchParams } from 'expo-router';
import { useEffect, useMemo, useRef, useState } from 'react';
import {
  AccessibilityInfo,
  Keyboard,
  KeyboardAvoidingView,
  Platform,
  Pressable,
  ScrollView,
  StyleSheet,
  Text,
  useWindowDimensions,
  View,
} from 'react-native';
import Animated, {
  useAnimatedStyle,
  useReducedMotion,
  useSharedValue,
  withSequence,
  withTiming,
} from 'react-native-reanimated';
import { SafeAreaView } from 'react-native-safe-area-context';

import { Banner } from '@/components/banner';
import { Button } from '@/components/button';
import { TrailMap } from '@/components/route-steps';
import { TextField } from '@/components/text-field';
import { ThemedText } from '@/components/themed-text';
import { ThemedView } from '@/components/themed-view';
import { AUTH_STEPS } from '@/constants/auth-steps';
import { Border, Fonts, MinTouch, Radius, Spacing } from '@/constants/theme';
import { useTheme } from '@/hooks/use-theme';
import { authErrorKind, toTurkish } from '@/lib/auth-errors';
import { supabase } from '@/lib/supabase';

const RESEND_SECONDS = 60; // Supabase'in kendi "60 saniyede bir" kuralıyla uyumlu
const MIN_DIGITS = 6; // Panelde kod uzunluğu 6-10 arası ayarlanabilir; bu yüzden aralık kontrol ediyoruz
const MAX_DIGITS = 10;

export default function VerifyEmailScreen() {
  const theme = useTheme();
  const reduceMotion = useReducedMotion();
  const { width, height } = useWindowDimensions();
  const gutter = width < 360 ? Spacing.three : Spacing.four;
  const short = height < 700; // kısa ekranda süs olan patika çizilmez, kod alanı klavyenin üstünde kalsın
  const stagePad = short ? Spacing.two : undefined;

  // Route parametreleri her zaman metindir (veya dizi / yok olabilir) — kullanmadan önce kontrol ederiz.
  const params = useLocalSearchParams<{ email?: string; from?: string }>();
  const email = typeof params.email === 'string' ? params.email : null;
  const fromLogin = params.from === 'login';

  const [code, setCode] = useState('');
  const [busy, setBusy] = useState(false); // doğrulama isteği sürüyor
  const [resending, setResending] = useState(false); // tekrar gönder isteği sürüyor
  const [error, setError] = useState<string | null>(null);
  const [errorIsCode, setErrorIsCode] = useState(false); // yalnız "kod yanlış" ise alan kırmızı olur
  const [info, setInfo] = useState<string | null>(null);
  // Girişten geldiyse kullanıcı kodu bulamıyor olabilir: sayaç yok, "Tekrar gönder" hemen aktif.
  const [secondsLeft, setSecondsLeft] = useState(fromLogin ? 0 : RESEND_SECONDS);
  // null = henüz bilmiyoruz. Ekran okuyucu açıksa alana otomatik odaklanmayız (başlığı duymadan atlamasın).
  const [screenReader, setScreenReader] = useState<boolean | null>(null);

  const canVerify = code.length >= MIN_DIGITS && code.length <= MAX_DIGITS && !busy && !resending;

  useEffect(() => {
    AccessibilityInfo.isScreenReaderEnabled().then(setScreenReader);
  }, []);

  // GERİ SAYIM: saniyede bir kendini yeniden kuran tek seferlik zamanlayıcı.
  // - Bağımlılık [secondsLeft]: sayı her değiştiğinde efekt yeniden çalışır ve bir sonraki saniyeyi kurar.
  // - return () => clearTimeout(id) temizliği şart: kullanıcı ekrandan çıkarsa (geri tuşu ya da doğrulama
  //   sonrası ekran düşerse) bekleyen zamanlayıcı kapanmazsa, ekran yok olduktan sonra setState çağırır.
  useEffect(() => {
    if (secondsLeft <= 0) return;
    const id = setTimeout(() => {
      // Sayaç sıfıra inerken ekran okuyucuya TEK SEFER haber ver (her saniye anons etmek rahatsız eder).
      if (secondsLeft === 1) AccessibilityInfo.announceForAccessibility('Kodu tekrar gönderebilirsin');
      setSecondsLeft(secondsLeft - 1);
    }, 1000);
    return () => clearTimeout(id);
  }, [secondsLeft]);

  // Yanlış kodda alan iki kez hafifçe titrer (Hareketi Azalt açıksa titremez).
  const shake = useSharedValue(0);
  const shakeStyle = useAnimatedStyle(() => ({ transform: [{ translateX: shake.value }] }));
  function playShake() {
    if (reduceMotion) return;
    shake.value = withSequence(
      withTiming(-6, { duration: 50 }),
      withTiming(6, { duration: 50 }),
      withTiming(-6, { duration: 50 }),
      withTiming(6, { duration: 50 }),
      withTiming(0, { duration: 50 })
    );
  }

  // Klavye açılınca kod alanı klavyenin altında kalmasın diye sayfayı alana kaydır.
  // onLayout'taki y değerleri bir üst kapsayıcıya göre olduğundan formun y'si ile toplanır.
  const scrollRef = useRef<ScrollView>(null);
  const formY = useRef(0);
  const fieldY = useRef(0);
  useEffect(() => {
    const sub = Keyboard.addListener('keyboardDidShow', () => {
      scrollRef.current?.scrollTo({
        y: formY.current + fieldY.current - Spacing.three,
        animated: !reduceMotion && !screenReader,
      });
    });
    return () => sub.remove();
  }, [reduceMotion, screenReader]);

  // Bu ekranda 1. durak "Hesabını doğrula" olarak görünür; ilerleme iddiası yok (sahte ilerleme olmasın).
  const stops = useMemo(() => [{ ...AUTH_STEPS[0], emoji: '🔑', label: 'Hesabını doğrula' }, ...AUTH_STEPS.slice(1)], []);

  // E-posta parametresi yoksa (örn. ekran doğrudan açıldı) çökmek yerine girişe dön.
  // Bu satır tüm hook'lardan SONRA durmalı: hook'ları koşullu çağırmak React kurallarına aykırıdır.
  if (!email) return <Redirect href="/login" />;

  async function handleVerify() {
    if (busy || !email) return; // çift basışı yok say (tek istek)
    setBusy(true);
    setError(null);
    setInfo(null);

    const { error } = await supabase.auth.verifyOtp({ email, token: code, type: 'signup' });
    if (error) {
      setError(toTurkish(error, 'verify'));
      const isCodeError = authErrorKind(error) === 'code';
      setErrorIsCode(isCodeError);
      if (isCodeError) playShake();
      setBusy(false); // kod alanı korunur, kullanıcı düzeltip tekrar deneyebilir
    }
    // BAŞARI DALINDA HİÇBİR ŞEY YAPMIYORUZ: ne router.replace ne setState.
    // verifyOtp oturumu kaydeder -> auth-context onAuthStateChange ile session'ı günceller ->
    // _layout'taki Stack.Protected (guard={!session}) bu ekranı kendiliğinden kaldırıp onboarding'i açar.
    // Yönlendirmeyi elle yazarsak oturumla çelişebilir; ayrıca ekran zaten kapanacağı için
    // burada setBusy çağırmak "unmount olmuş bileşeni güncelleme" uyarısına yol açardı.
    // Bu yüzden buton, ekran kapanana kadar yükleniyor halinde kalır.
  }

  async function handleResend() {
    if (resending || busy || secondsLeft > 0 || !email) return;
    setResending(true);
    setError(null);
    setInfo(null);

    const { error } = await supabase.auth.resend({ type: 'signup', email });
    if (error) {
      setError(toTurkish(error, 'resend'));
      setErrorIsCode(false);
    } else {
      setInfo('Yeni kod gönderildi. En son gelen kodu kullan.');
    }
    // Başarıda da hatada da 60 sn bekletiriz: art arda basıp e-posta kotasını bitirmeyi önler.
    setSecondsLeft(RESEND_SECONDS);
    setResending(false);
  }

  const resendHint =
    secondsLeft > 0 ? `${secondsLeft} sn sonra yeniden isteyebilirsin` : 'Kod gelmediyse gereksiz (spam) klasörüne de bak.';

  return (
    <ThemedView style={styles.container}>
      <SafeAreaView style={styles.flex} edges={['bottom']}>
        <KeyboardAvoidingView style={styles.flex} behavior={Platform.OS === 'ios' ? 'padding' : 'height'}>
          <ScrollView
            ref={scrollRef}
            style={styles.flex}
            keyboardShouldPersistTaps="handled"
            keyboardDismissMode="on-drag">
            {/* SAHNE: giriş ekranıyla aynı dil */}
            <View
              style={[
                styles.stage,
                {
                  backgroundColor: theme.accentSoft,
                  paddingHorizontal: gutter,
                  ...(stagePad && { paddingTop: stagePad, paddingBottom: stagePad }),
                },
              ]}>
              <ThemedText
                type="heading"
                accessibilityRole="header"
                style={short && { fontSize: 28, lineHeight: 34 }}>
                E-postanı doğrula
              </ThemedText>
              <ThemedText>Aşağıdaki adrese bir kod gönderdik. Kodu buraya yaz.</ThemedText>
              <View style={[styles.emailBox, { backgroundColor: theme.card, borderColor: theme.accent }]}>
                <Text
                  accessibilityElementsHidden
                  importantForAccessibility="no"
                  allowFontScaling={false}
                  style={styles.emailEmoji}>
                  ✉️
                </Text>
                <ThemedText type="cardTitle" selectable style={styles.emailText}>
                  {email}
                </ThemedText>
              </View>
              {!short && <TrailMap stops={stops} current={0} variant="horizontal" showDone={false} />}
            </View>

            <View
              style={[styles.form, { padding: gutter }]}
              onLayout={(e) => (formY.current = e.nativeEvent.layout.y)}>
              {fromLogin && (
                <Banner tone="info">
                  Bu hesabı henüz doğrulamadın. Daha önce gönderilen kodu gir ya da yeni kod iste.
                </Banner>
              )}

              {/* key: ekran okuyucu durumu öğrenilince alan bir kez yeniden kurulur ki autoFocus doğru uygulansın
                  (autoFocus yalnız ilk kurulumda işe yarar). Bu an kullanıcı henüz bir şey yazmamıştır. */}
              <Animated.View
                key={String(screenReader === false)}
                style={shakeStyle}
                onLayout={(e) => (fieldY.current = e.nativeEvent.layout.y)}>
                <TextField
                  label="Doğrulama kodu"
                  placeholder="Kod"
                  value={code}
                  // Yapıştırılan "123 456" -> "123456": rakam dışını at, üst sınırı uygula
                  onChangeText={(t) => {
                    setCode(t.replace(/\D/g, '').slice(0, MAX_DIGITS));
                    setError(null); // yazmaya başlayınca hata kalkar
                    setErrorIsCode(false);
                  }}
                  invalid={errorIsCode}
                  keyboardType="number-pad"
                  autoComplete="one-time-code"
                  textContentType="oneTimeCode"
                  maxLength={MAX_DIGITS}
                  autoCorrect={false}
                  autoFocus={screenReader === false}
                  returnKeyType="done"
                  onSubmitEditing={() => canVerify && handleVerify()}
                  accessibilityHint="E-postana gelen kodu yaz"
                  maxFontSizeMultiplier={1.3}
                  style={[styles.codeInput, { fontFamily: Fonts?.rounded }]}
                />
              </Animated.View>

              {/* Tek yuva: hata, yeni kod bilgisinden önce gelir */}
              {error ? <Banner tone="warning">{error}</Banner> : info ? <Banner tone="info">{info}</Banner> : null}

              <View style={styles.resendGroup}>
                <Button
                  label="Tekrar gönder"
                  variant="secondary"
                  onPress={handleResend}
                  disabled={secondsLeft > 0 || busy}
                  loading={resending}
                />
                {/* Sayaç etikete DEĞİL ayrı metne yazılır: buton etiketi her saniye değişirse
                    ekran okuyucu sürekli konuşur. Bu metin canlı bölge değil, odaklanınca okunur. */}
                <View style={styles.hintSlot}>
                  <ThemedText type="small" themeColor="textSecondary" style={styles.hintText}>
                    {resendHint}
                  </ThemedText>
                </View>
              </View>

              {/* "E-postayı değiştir": yıkıcı eylem görünümlü quiet Button yerine sakin bir metin bağlantısı.
                  router.back(): giriş/kayıt ekranı yığında duruyor, e-posta alanı dolu kalır. */}
              <Pressable
                onPress={() => router.back()}
                disabled={busy}
                hitSlop={8}
                accessibilityRole="button"
                accessibilityLabel="E-postayı değiştir"
                accessibilityHint="Kayıt ekranına döner"
                style={styles.link}>
                <ThemedText
                  type="smallBold"
                  themeColor={busy ? 'textSecondary' : 'accentInk'}
                  style={styles.linkText}>
                  E-postayı değiştir
                </ThemedText>
              </Pressable>
            </View>
          </ScrollView>

          {/* Asıl eylem klavyenin üstünde sabit kalır */}
          <View
            style={[
              styles.footer,
              { paddingHorizontal: gutter, borderTopColor: theme.border, backgroundColor: theme.background },
            ]}>
            <Button label="Doğrula" onPress={handleVerify} disabled={!canVerify} loading={busy} />
          </View>
        </KeyboardAvoidingView>
      </SafeAreaView>
    </ThemedView>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1 },
  flex: { flex: 1 },
  stage: {
    gap: Spacing.three,
    paddingTop: Spacing.four,
    paddingBottom: Spacing.five,
    borderBottomLeftRadius: Radius.xl,
    borderBottomRightRadius: Radius.xl,
  },
  emailBox: {
    flexDirection: 'row',
    alignItems: 'center',
    alignSelf: 'flex-start',
    maxWidth: '100%',
    gap: Spacing.two,
    paddingVertical: Spacing.two,
    paddingHorizontal: Spacing.three,
    borderWidth: Border.thick,
    borderRadius: Radius.md,
  },
  emailEmoji: { fontSize: 18, lineHeight: 22 },
  emailText: { flexShrink: 1 }, // uzun adres kutu içinde alt satıra sarılır
  form: { gap: Spacing.four },
  // Kod tek bir "değer" olduğu için ortalı ve geniş harf aralıklı. paddingLeft, letterSpacing'in
  // son rakamdan sonra bıraktığı boşluğu dengeler (görsel ortalama).
  codeInput: {
    textAlign: 'center',
    fontSize: 28,
    fontWeight: '900',
    letterSpacing: Spacing.two,
    paddingLeft: Spacing.two,
    fontVariant: ['tabular-nums'],
  },
  resendGroup: { gap: Spacing.two },
  hintSlot: { minHeight: 40 }, // 2 satırlık yer ayrılır: metin değişince yerleşim zıplamaz
  hintText: { textAlign: 'center', fontVariant: ['tabular-nums'] },
  link: { minHeight: MinTouch, alignItems: 'center', justifyContent: 'center' },
  linkText: { textDecorationLine: 'underline' },
  footer: { paddingTop: Spacing.three, paddingBottom: Spacing.three, borderTopWidth: 2 },
});
