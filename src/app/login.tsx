import { useState } from 'react';
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
import { Border, Radius, Spacing } from '@/constants/theme';
import { useTheme } from '@/hooks/use-theme';
import { supabase } from '@/lib/supabase';

type Mode = 'login' | 'signup';

const STEPS = [
  { emoji: '🔑', label: 'Hesabını oluştur' },
  { emoji: '🧭', label: 'Konunu ve seviyeni seç' },
  { emoji: '🗺️', label: 'Kişisel yol haritanı al' },
];

// Supabase'in İngilizce hata mesajlarını kullanıcının anlayacağı Türkçeye çevir
function toTurkish(message: string): string {
  const m = message.toLowerCase();
  if (m.includes('invalid login credentials')) return 'E-posta veya şifre hatalı.';
  if (m.includes('already registered')) return 'Bu e-postayla zaten bir hesap var. Giriş yapmayı dene.';
  if (m.includes('email not confirmed'))
    return 'E-postanı henüz onaylamadın. Gelen kutundaki bağlantıya tıkla, sonra giriş yap.';
  if (m.includes('rate limit') || m.includes('too many'))
    return 'Çok fazla deneme yapıldı. Birkaç dakika sonra tekrar dene.';
  if (m.includes('network')) return 'İnternet bağlantısı yok gibi görünüyor. Bağlantını kontrol et.';
  return message; // Tanımadığımız bir hata: orijinalini göster
}

export default function LoginScreen() {
  const theme = useTheme();
  const { width, height } = useWindowDimensions();
  const gutter = width < 360 ? Spacing.three : Spacing.four;
  // Kısa ekranda (örn. 320x568) sahne daha az boşluk bıraksın ki şifre alanı ilk ekranda görünsün
  const stagePad = height < 700 ? Spacing.three : undefined;
  const [mode, setMode] = useState<Mode>('login');
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [showPassword, setShowPassword] = useState(false);
  const [busy, setBusy] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [notice, setNotice] = useState<string | null>(null);

  // Türetilmiş değerler
  const emailValid = /^\S+@\S+\.\S+$/.test(email.trim());
  const passwordValid = password.length >= 6;
  const canSubmit = emailValid && passwordValid && !busy;

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
      if (error) setError(toTurkish(error.message));
      // Başarılıysa Stack.Protected bizi otomatik içeri alır.
    } else {
      const { data, error } = await supabase.auth.signUp(credentials);
      if (error) {
        setError(toTurkish(error.message));
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
          <ScrollView style={styles.flex} keyboardShouldPersistTaps="handled">
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
                <ThemedText type="heading" accessibilityRole="header">
                  {mode === 'login' ? 'Rotana devam et' : 'Rotanı oluşturalım'}
                </ThemedText>
              </Animated.View>
              <TrailMap
                stops={STEPS}
                current={mode === 'login' ? 1 : 0}
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
  showButton: { minHeight: 44, minWidth: 44, paddingHorizontal: Spacing.two, alignItems: 'center', justifyContent: 'center' },
  footer: { paddingTop: Spacing.three, paddingBottom: Spacing.three, borderTopWidth: 2 },
});
