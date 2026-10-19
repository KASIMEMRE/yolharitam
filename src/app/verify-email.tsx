import { Redirect, router, useLocalSearchParams } from 'expo-router';
import { useEffect, useRef, useState } from 'react';
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

// Bu ekranda 1. durak "Hesabını doğrula" olarak görünür; ilerleme iddiası yok (sahte ilerleme olmasın).
const STOPS = [{ ...AUTH_STEPS[0], label: 'Hesabını doğrula' }, ...AUTH_STEPS.slice(1)];

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
  // GERİ SAYIM: saniyeyi SAYMAK yerine bitiş zamanını saklarız. iOS uygulama arka plandayken
  // zamanlayıcıları durdurur; sayarsak geri dönünce sayaç eski değerde takılı kalır. Bitiş zamanı
  // ise gerçek saate bağlı olduğundan her zaman doğru kalır.
  // Girişten geldiyse kullanıcı kodu bulamıyor olabilir: bekleme yok, "Tekrar gönder" hemen aktif.
  const [resendAt, setResendAt] = useState(fromLogin ? 0 : Date.now() + RESEND_SECONDS * 1000);
  const [now, setNow] = useState(Date.now());
  const secondsLeft = Math.max(0, Math.ceil((resendAt - now) / 1000));
  // null = henüz bilmiyoruz. Ekran okuyucu açıksa alana otomatik odaklanmayız (başlığı duymadan atlamasın).
  const [screenReader, setScreenReader] = useState<boolean | null>(null);

  const canVerify = code.length >= MIN_DIGITS && code.length <= MAX_DIGITS && !busy && !resending;

  useEffect(() => {
    AccessibilityInfo.isScreenReaderEnabled()
      .then(setScreenReader)
      .catch(() => setScreenReader(false));
  }, []);

  // Her saniye `now`'u güncelleyen tek seferlik zamanlayıcı. Bağımlılık [secondsLeft, resendAt]:
  // her tikte efekt yeniden çalışıp bir sonrakini kurar. clearTimeout temizliği şart: ekran kapanırsa
  // (geri tuşu ya da doğrulama sonrası) bekleyen zamanlayıcı ekran yok olduktan sonra çalışmasın.
  useEffect(() => {
    if (secondsLeft <= 0) return;
    const id = setTimeout(() => {
      // Sayaç sıfıra inerken ekran okuyucuya TEK SEFER haber ver (her saniye anons etmek rahatsız eder).
      if (secondsLeft === 1) AccessibilityInfo.announceForAccessibility('Kodu tekrar gönderebilirsin');
      setNow(Date.now());
    }, 1000);
    return () => clearTimeout(id);
  }, [secondsLeft, resendAt]);

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

  // E-posta parametresi yoksa (örn. ekran doğrudan açıldı) çökmek yerine girişe dön.
  // Bu satır tüm hook'lardan SONRA durmalı: hook'ları koşullu çağırmak React kurallarına aykırıdır.
  if (!email) return <Redirect href="/login" />;

  async function handleVerify() {
    if (busy || !email) return; // çift basışı yok say (tek istek)
    setBusy(true);
    setError(null);
    setInfo(null);

    const { data, error } = await supabase.auth.verifyOtp({ email, token: code, type: 'signup' });
    if (error) {
      setError(toTurkish(error, 'verify'));
      const isCodeError = authErrorKind(error) === 'code';
      setErrorIsCode(isCodeError);
      if (isCodeError) playShake();
      setBusy(false); // kod alanı korunur, kullanıcı düzeltip tekrar deneyebilir
    } else if (!data.session) {
      // Beklenmedik: hata yok ama oturum da yok. Kullanıcı çıkmaza girmesin, şifreyle girmeye yönlendir.
      setError('Doğrulandı ama giriş tamamlanamadı. Giriş ekranından şifrenle gir.');
      setBusy(false);
    }
    // BAŞARIDA ne router.replace ne setBusy(false): verifyOtp oturumu kaydeder -> auth-context
    // onAuthStateChange ile session'ı günceller -> _layout'taki Stack.Protected bu ekranı kendiliğinden
    // kapatıp onboarding'i açar. Yönlendirmeyi elle yazarsak oturumla çelişebilir. busy'yi sıfırlamıyoruz
    // çünkü ekran kapanana kadar buton bir an aktif görünüp çift basışa izin vermesin.
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
      // Bekletme yalnız limit hatasında: ağ/diğer hatada istek hiç gitmemiş olabilir, kullanıcı hemen yeniden denesin.
      if (authErrorKind(error) === 'rateLimit') setResendAt(Date.now() + RESEND_SECONDS * 1000);
    } else {
      const message = 'Yeni kod gönderildi. En son gelen kodu kullan.';
      setInfo(message);
      // iOS'ta Banner'ın live region'ı okunmayabilir; elle duyuruyoruz.
      AccessibilityInfo.announceForAccessibility(message);
      setResendAt(Date.now() + RESEND_SECONDS * 1000);
    }
    setNow(Date.now());
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
              {!short && <TrailMap stops={STOPS} current={0} variant="horizontal" showDone={false} />}
            </View>

            <View
              style={[styles.form, { padding: gutter }]}
              onLayout={(e) => (formY.current = e.nativeEvent.layout.y)}>
              {fromLogin && !error && !info && (
                <Banner tone="info">
                  Bu hesabı henüz doğrulamadın. Daha önce gönderilen kodu gir ya da yeni kod iste.
                </Banner>
              )}

              {/* key: ekran okuyucu durumu öğrenilince alan bir kez yeniden kurulur ki autoFocus doğru uygulansın
                  (autoFocus yalnız ilk kurulumda işe yarar). Bedeli: bir karelik yeniden kurulma ve odak kaybı;
                  kabul ettik çünkü kullanıcı o an henüz yazmamıştır ve alternatifi ref yönetimi daha karmaşık. */}
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
                  // iOS number-pad'de Return tuşu yok; bu yalnız Android/donanım klavyesi için. Asıl yol "Doğrula" butonu.
                  onSubmitEditing={() => canVerify && handleVerify()}
                  accessibilityHint="E-postana gelen kodu yaz"
                  maxFontSizeMultiplier={1.3}
                  style={[styles.codeInput, code.length === 0 && styles.codeEmpty, { fontFamily: Fonts?.rounded }]}
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
                {/* Hesap numaralandırmayı önlemek için kayıtlı e-posta da bu ekrana gelir (login.tsx);
                    kod gelmeyen gerçek hesap sahibi buradan giriş yapmaya yönlenir. */}
                <ThemedText type="small" themeColor="textSecondary" style={styles.hintText}>
                  Kod birkaç dakika içinde gelmezse bu adresle zaten hesabın olabilir; giriş yapmayı dene.
                </ThemedText>
              </View>

              {/* "E-postayı değiştir": yıkıcı eylem görünümlü quiet Button yerine sakin bir metin bağlantısı.
                  router.back(): giriş/kayıt ekranı yığında duruyor, e-posta alanı dolu kalır. */}
              <Pressable
                onPress={() => router.back()}
                disabled={busy}
                hitSlop={8}
                accessibilityRole="button"
                accessibilityLabel="E-postayı değiştir"
                accessibilityHint="Önceki ekrana döner"
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
  emailText: { flexShrink: 1, minWidth: 0 }, // uzun adres kutu içinde alt satıra sarılır
  form: { gap: Spacing.four },
  // Kod tek bir "değer" olduğu için ortalı ve geniş harf aralıklı. paddingLeft, letterSpacing'in
  // son rakamdan sonra bıraktığı boşluğu dengeler (görsel ortalama).
  codeInput: {
    textAlign: 'center',
    fontSize: 28,
    fontWeight: '900',
    letterSpacing: Spacing.two,
    paddingLeft: Spacing.two,
    paddingRight: Spacing.two,
    minWidth: 0,
    fontVariant: ['tabular-nums'],
  },
  // Boşken placeholder "Kod" küçük ve normal yazı; rakamlar gelince büyük stil devreye girer
  codeEmpty: { fontSize: 17, fontWeight: '600', letterSpacing: 0 },
  resendGroup: { gap: Spacing.two },
  hintSlot: { minHeight: 40 }, // 2 satırlık yer ayrılır: metin değişince yerleşim zıplamaz
  hintText: { textAlign: 'center', fontVariant: ['tabular-nums'] },
  link: { minHeight: MinTouch, alignItems: 'center', justifyContent: 'center' },
  linkText: { textDecorationLine: 'underline' },
  footer: { paddingTop: Spacing.three, paddingBottom: Spacing.three, borderTopWidth: 2 },
});
