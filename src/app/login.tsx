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
import { MAX_NAME_LENGTH, MIN_NAME_LENGTH } from '@/components/display-name-form';
import { TextField } from '@/components/text-field';
import { ThemedText } from '@/components/themed-text';
import { ThemedView } from '@/components/themed-view';
import { Border, Radius, Spacing } from '@/constants/theme';
import { useTheme } from '@/hooks/use-theme';
import { supabase } from '@/lib/supabase';
import { isAuthRetryableFetchError, type AuthError } from '@supabase/supabase-js';

type Mode = 'login' | 'signup';

const STEPS = [
  { emoji: '🔑', label: 'Hesabını oluştur' },
  { emoji: '🧭', label: 'Yol haritanı ve seviyeni seç' },
  { emoji: '🗺️', label: 'Kişisel yol haritanı al' },
];
// Giriş modunda ilk durak "hesap oluştur" değil "giriş yap" (etiketler benzersiz kalmalı: React key)
const LOGIN_STEPS = [{ ...STEPS[0], label: 'Giriş yap' }, ...STEPS.slice(1)];

// Supabase'in İngilizce hata mesajlarını kullanıcının anlayacağı Türkçeye çevir
// Ağ hatası tarayıcıya göre farklı yazılır: Chrome "Failed to fetch", Safari "Load failed",
// Firefox "NetworkError…". Bu yüzden hepsini tek yerde tanıyoruz.
const NETWORK_TEXT = 'İnternet bağlantısı yok gibi görünüyor. Bağlantını kontrol et.';

function toTurkish(error: AuthError): string {
  // supabase-js'in "isteği sunucuya ulaştıramadım" işareti: metne bakmadan en güvenilir yol
  if (isAuthRetryableFetchError(error)) return NETWORK_TEXT;
  const m = error.message.toLowerCase();
  if (m.includes('invalid login credentials')) return 'E-posta veya şifre hatalı.';
  if (m.includes('already registered')) return 'Bu e-postayla zaten bir hesap var. Giriş yapmayı dene.';
  if (m.includes('email not confirmed'))
    return 'E-postanı henüz onaylamadın. Gelen kutundaki bağlantıya tıkla, sonra giriş yap.';
  if (m.includes('rate limit') || m.includes('too many'))
    return 'Çok fazla deneme yapıldı. Birkaç dakika sonra tekrar dene.';
  if (
    m.includes('network') ||
    m.includes('failed to fetch') ||
    m.includes('load failed') ||
    m.includes('networkerror')
  )
    return NETWORK_TEXT;
  // Tanımadığımız hatayı ham İngilizce göstermeyiz; ayrıntı yalnız geliştirici konsoluna gider.
  console.warn('Tanınmayan giriş hatası:', error.message);
  return 'Bir sorun oluştu. Biraz sonra tekrar dene.';
}

export default function LoginScreen() {
  const theme = useTheme();
  const { width, height } = useWindowDimensions();
  const gutter = width < 360 ? Spacing.three : Spacing.four;
  // Kısa ekranda (örn. 320x568) sahne daha az boşluk bıraksın ki şifre alanı ilk ekranda görünsün
  const short = height < 700;
  const stagePad = short ? Spacing.two : undefined;
  const [mode, setMode] = useState<Mode>('login');
  const [username, setUsername] = useState('');
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
  const [notice, setNotice] = useState<string | null>(null);

  // Türetilmiş değerler
  const emailValid = /^\S+@\S+\.\S+$/.test(email.trim());
  const passwordValid = password.length >= 6;
  const usernameValid = username.trim().length >= MIN_NAME_LENGTH;
  // Kayıtta kullanıcı adı da zorunlu; girişte sorulmaz
  const canSubmit = emailValid && passwordValid && (mode === 'login' || usernameValid) && !busy;

  function switchMode(next: Mode) {
    setMode(next);
    setError(null);
    setNotice(null);
  }

  async function handleSubmit() {
    setBusy(true);
    setError(null);
    setNotice(null);

    const credentials = { email: email.trim(), password };

    if (mode === 'login') {
      const { error } = await supabase.auth.signInWithPassword(credentials);
      if (error) setError(toTurkish(error));
      // Başarılıysa Stack.Protected bizi otomatik içeri alır.
    } else {
      // Kullanıcı adı hesabın bilgilerine (user_metadata) yazılır. E-posta onayı gerektiği için kayıt anında
      // oturum yoktur; ilk girişte Yol Haritam ekranı bu adı profile kaydeder (bkz. NamePrompt).
      const { data, error } = await supabase.auth.signUp({
        ...credentials,
        options: { data: { display_name: username.trim().slice(0, MAX_NAME_LENGTH) } },
      });
      if (error) {
        setError(toTurkish(error));
      } else if (!data.session) {
        setNotice(`Onay bağlantısı ${credentials.email} adresine gönderildi. Bağlantıya tıkladıktan sonra giriş yap.`);
        setMode('login');
      }
    }

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
                stops={mode === 'login' ? LOGIN_STEPS : STEPS}
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

              {mode === 'signup' && (
                <TextField
                  label="Kullanıcı adı"
                  placeholder="Sana nasıl hitap edelim?"
                  value={username}
                  onChangeText={setUsername}
                  maxLength={MAX_NAME_LENGTH}
                  autoCapitalize="words"
                  autoComplete="name"
                  textContentType="name"
                  returnKeyType="next"
                  hint={usernameValid ? '✓ Sonradan Ayarlar’dan değiştirebilirsin' : `En az ${MIN_NAME_LENGTH} karakter · sonradan değiştirebilirsin`}
                  hintTone={usernameValid ? 'good' : 'neutral'}
                />
              )}

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

              {/* Hata ve bilgi kutuları */}
              {error && <Banner tone="warning">{error}</Banner>}
              {notice && <Banner tone="info">{notice}</Banner>}
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
  showButton: { minHeight: 44, minWidth: 44, marginRight: Spacing.two, paddingHorizontal: Spacing.two, alignItems: 'center', justifyContent: 'center' },
  footer: { paddingTop: Spacing.three, paddingBottom: Spacing.three, borderTopWidth: 2 },
});
