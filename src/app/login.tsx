import { router } from 'expo-router';
import { useEffect, useRef, useState } from 'react';
import {
  KeyboardAvoidingView,
  Platform,
  Pressable,
  ScrollView,
  StyleSheet,
  useWindowDimensions,
  View,
} from 'react-native';
import Animated, { FadeIn } from 'react-native-reanimated';
import { SafeAreaView } from 'react-native-safe-area-context';

import { Banner } from '@/components/banner';
import { Button } from '@/components/button';
import { TrailMap } from '@/components/route-steps';
import { TextField } from '@/components/text-field';
import { ThemedText } from '@/components/themed-text';
import { ThemedView } from '@/components/themed-view';
import { AUTH_STEPS } from '@/constants/auth-steps';
import { Border, Radius, Spacing } from '@/constants/theme';
import { useTheme } from '@/hooks/use-theme';
import { isEmailNotConfirmed, toTurkish } from '@/lib/auth-errors';
import { supabase } from '@/lib/supabase';

// Giriş modunda ilk durak "hesap oluştur" değil "giriş yap" (etiketler benzersiz kalmalı: React key)
const LOGIN_STOPS = [{ ...AUTH_STEPS[0], label: 'Giriş yap' }, ...AUTH_STEPS.slice(1)];

type Mode = 'login' | 'signup';

export default function LoginScreen() {
  const theme = useTheme();
  const { width, height } = useWindowDimensions();
  const gutter = width < 360 ? Spacing.three : Spacing.four;
  // Kısa ekranda (örn. 320x568) sahne daha az boşluk bıraksın ki şifre alanı ilk ekranda görünsün
  const short = height < 700;
  const stagePad = short ? Spacing.two : undefined;
  const [mode, setMode] = useState<Mode>('login');
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [showPassword, setShowPassword] = useState(false);
  const [busy, setBusy] = useState(false);
  const [error, setError] = useState<string | null>(null);
  // Hata kutusu formun en altında; küçük ekranlarda görünür alanın dışında kalabiliyor.
  // Hata çıkınca sayfayı en alta kaydırıyoruz ki kullanıcı mesajı mutlaka görsün.
  const scrollRef = useRef<ScrollView>(null);
  useEffect(() => {
    if (error) scrollRef.current?.scrollToEnd({ animated: true });
  }, [error]);

  // Türetilmiş değerler
  const emailValid = /^\S+@\S+\.\S+$/.test(email.trim());
  const passwordValid = password.length >= 6;
  const canSubmit = emailValid && passwordValid && !busy;

  function switchMode(next: Mode) {
    setMode(next);
    setError(null);
  }

  // Kod ekranına git. `push` kullanıyoruz (replace DEĞİL): geri dönünce bu ekran ve yazılan e-posta
  // yığında durur, "E-postayı değiştir" tam olarak buraya döner. Şifreyi taşımayız (verifyOtp istemez).
  // Başarıdan sonra `router.replace` ile içeri girmeyi de elle yapmıyoruz: kod doğrulanınca oturum
  // oluşur, Stack.Protected (_layout.tsx) kullanıcıyı kendisi içeri alır. Tek doğruluk kaynağı oturumdur.
  function goToVerify(from: 'login' | 'signup', mail: string) {
    setPassword('');
    router.push({ pathname: '/verify-email', params: { email: mail, from } });
  }

  async function handleSubmit() {
    setBusy(true);
    setError(null);

    const credentials = { email: email.trim(), password };

    if (mode === 'login') {
      const { error } = await supabase.auth.signInWithPassword(credentials);
      if (error && isEmailNotConfirmed(error)) {
        // Hesap var ama doğrulanmamış (şifre doğru). Çıkmaz yerine kod ekranına yolla.
        // Burada otomatik "tekrar gönder" YOK: e-posta kotasını yer, önceki kod hâlâ geçerli olabilir.
        goToVerify('login', credentials.email);
      } else if (error) {
        setError(toTurkish(error, 'login'));
      }
      // Başarılıysa Stack.Protected bizi otomatik içeri alır.
    } else {
      const { data, error } = await supabase.auth.signUp(credentials);
      if (error) {
        setError(toTurkish(error, 'signup'));
      } else if (!data.session) {
        // KULLANICI VARLIĞINI SIZDIRMAMA: "Confirm email" açıkken, zaten doğrulanmış bir e-postayla kayıt
        // denenirse Supabase hata dönmez; sahte kullanıcı döner (`identities` boş dizi) ve e-posta gitmez.
        // Bunu "bu e-posta kayıtlı" diye açıkça söylersek herkes bir e-postanın üye olup olmadığını
        // öğrenebilir (hesap numaralandırma). Bu yüzden yeni kayıtla AYNI yola gidiyoruz: iki durum
        // dışarıdan ayırt edilemez. Kod ekranı da "kod gelmezse zaten hesabın olabilir" diyerek
        // gerçek sahibini yönlendirir. (`identities` kontrolüne bu yüzden artık gerek yok.)
        goToVerify('signup', credentials.email);
      }
      // data.session doluysa (panelde "Confirm email" kapalı) Stack.Protected içeri alır.
    }

    // Başarıda ekran Stack.Protected ile kapanabilir; ama kod ekranına push'ta bu ekran yığında kalır,
    // geri dönülünce buton takılı kalmasın diye busy burada sıfırlanır.
    setBusy(false);
  }

  return (
    <ThemedView style={styles.container}>
      <SafeAreaView style={styles.flex} edges={['bottom']}>
        {/* Klavye açılınca içerik yukarı itilsin, alanlar klavyenin altında kalmasın */}
        <KeyboardAvoidingView
          style={styles.flex}
          // iOS 'padding', Android 'height': Android'de pencere kendiliğinden küçülmeyebilir (edge-to-edge);
          // 'height' sabit alt butonun klavyenin altında kalmasını önler.
          behavior={Platform.OS === 'ios' ? 'padding' : 'height'}>
          <ScrollView ref={scrollRef} style={styles.flex} keyboardShouldPersistTaps="handled">
            {/* SAHNE: kenarlara taşan yumuşak yeşil blok. İçinde başlık ve küçük yatay patika;
                mod değişince sarı aktif durak yeni adıma kayar. */}
            <View
              style={[
                styles.stage,
                {
                  backgroundColor: theme.accentSoft,
                  paddingHorizontal: gutter,
                  ...(stagePad && { paddingTop: stagePad, paddingBottom: stagePad }),
                },
              ]}>
              <Animated.View key={mode} entering={FadeIn.duration(150)}>
                <ThemedText
                  type="heading"
                  accessibilityRole="header"
                  style={short && { fontSize: 28, lineHeight: 34 }}>
                  {mode === 'login' ? 'Rotana devam et' : 'Rotanı oluşturalım'}
                </ThemedText>
              </Animated.View>
              {/* Kullanıcı bu ekranda hesap adımındadır: aktif durak hep ilk durak.
                  (Önceden girişte 2. durak vurgulanıyor ve "Konunu ve seviyeni seç" yazıyordu;
                  o sırada e-posta/şifre girildiği için yanlış yönlendiriyordu.) */}
              <TrailMap
                stops={mode === 'login' ? LOGIN_STOPS : AUTH_STEPS}
                current={0}
                variant="horizontal"
                showDone={false}
              />
            </View>

            <View style={[styles.form, { padding: gutter }]}>
              {/* Giriş / Kayıt seçici */}
              <View
                style={[
                  styles.segment,
                  { backgroundColor: theme.backgroundElement, borderColor: theme.border },
                ]}
                accessibilityRole="tablist">
                {(['login', 'signup'] as const).map((m) => {
                  const active = mode === m;
                  return (
                    <Pressable
                      key={m}
                      onPress={() => switchMode(m)}
                      accessibilityRole="tab"
                      accessibilityState={{ selected: active }}
                      style={[
                        styles.segmentItem,
                        {
                          borderColor: active ? theme.accent : 'transparent',
                          backgroundColor: active ? theme.accentSoft : 'transparent',
                        },
                      ]}>
                      <ThemedText type="smallBold" themeColor={active ? 'accentInk' : 'textSecondary'}>
                        {m === 'login' ? 'Giriş yap' : 'Kayıt ol'}
                      </ThemedText>
                    </Pressable>
                  );
                })}
              </View>

              <TextField
                label="E-posta"
                placeholder="ornek@mail.com"
                value={email}
                onChangeText={setEmail}
                autoCapitalize="none"
                keyboardType="email-address"
                autoComplete="email"
                textContentType="emailAddress"
                returnKeyType="next"
                // Kayıtta beklentiyi önceden söyle: kod bu adrese e-postayla gelecek
                hint={mode === 'signup' ? 'Doğrulama kodu bu adrese gelecek.' : undefined}
              />

              <TextField
                label="Şifre"
                placeholder={mode === 'signup' ? 'Yeni bir şifre belirle' : 'Şifren'}
                value={password}
                onChangeText={setPassword}
                secureTextEntry={!showPassword}
                autoComplete={mode === 'login' ? 'current-password' : 'new-password'}
                textContentType={mode === 'login' ? 'password' : 'newPassword'}
                returnKeyType="go"
                onSubmitEditing={() => canSubmit && handleSubmit()}
                hint={mode === 'signup' ? (passwordValid ? '✓ En az 6 karakter' : 'En az 6 karakter') : undefined}
                hintTone={passwordValid ? 'good' : 'neutral'}
                right={
                  <Pressable
                    onPress={() => setShowPassword(!showPassword)}
                    hitSlop={12}
                    style={styles.showButton}
                    accessibilityRole="button"
                    accessibilityLabel={showPassword ? 'Şifreyi gizle' : 'Şifreyi göster'}>
                    <ThemedText type="smallBold" themeColor="accentInk">
                      {showPassword ? 'Gizle' : 'Göster'}
                    </ThemedText>
                  </Pressable>
                }
              />

              {/* Hata kutusu */}
              {error && <Banner tone="warning">{error}</Banner>}
            </View>
          </ScrollView>

          {/* Gönder butonu klavyenin üstünde sabit kalır; alanlar yukarıda kayar */}
          <View
            style={[
              styles.footer,
              { paddingHorizontal: gutter, borderTopColor: theme.border, backgroundColor: theme.background },
            ]}>
            <Button
              label={mode === 'login' ? 'Giriş yap' : 'Hesap oluştur'}
              onPress={handleSubmit}
              disabled={!canSubmit}
              loading={busy}
            />
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
  form: { gap: Spacing.four },
  segment: { flexDirection: 'row', borderRadius: Radius.md, borderWidth: Border.thick, padding: Spacing.one },
  segmentItem: {
    flex: 1,
    minHeight: 44,
    alignItems: 'center',
    justifyContent: 'center',
    borderWidth: Border.thick,
    borderRadius: Radius.md - Spacing.one,
  },
  showButton: { minHeight: 44, minWidth: 44, flexShrink: 0, marginRight: Spacing.two, paddingHorizontal: Spacing.two, alignItems: 'center', justifyContent: 'center' },
  footer: { paddingTop: Spacing.three, paddingBottom: Spacing.three, borderTopWidth: 2 },
});
