import { useState } from 'react';
import {
  ActivityIndicator,
  KeyboardAvoidingView,
  Platform,
  Pressable,
  ScrollView,
  StyleSheet,
  View,
} from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';

import { RouteSteps } from '@/components/route-steps';
import { TextField } from '@/components/text-field';
import { ThemedText } from '@/components/themed-text';
import { ThemedView } from '@/components/themed-view';
import { Spacing } from '@/constants/theme';
import { useTheme } from '@/hooks/use-theme';
import { supabase } from '@/lib/supabase';

type Mode = 'login' | 'signup';

const STEPS = ['Hesabını oluştur', 'Konunu ve seviyeni seç', 'Kişisel yol haritanı al'];

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
          behavior={Platform.OS === 'ios' ? 'padding' : undefined}>
          <ScrollView contentContainerStyle={styles.content} keyboardShouldPersistTaps="handled">
            {/* Ekranın akılda kalan parçası: rota */}
            <View style={styles.header}>
              <ThemedText type="subtitle">
                {mode === 'login' ? 'Rotana devam et' : 'Rotanı oluşturalım'}
              </ThemedText>
              <RouteSteps steps={STEPS} current={mode === 'login' ? 1 : 0} />
            </View>

            {/* Giriş / Kayıt seçici */}
            <View
              style={[styles.segment, { backgroundColor: theme.backgroundElement }]}
              accessibilityRole="tablist">
              {(['login', 'signup'] as const).map((m) => {
                const active = mode === m;
                return (
                  <Pressable
                    key={m}
                    onPress={() => switchMode(m)}
                    accessibilityRole="tab"
                    accessibilityState={{ selected: active }}
                    style={[styles.segmentItem, active && { backgroundColor: theme.background }]}>
                    <ThemedText type="smallBold" themeColor={active ? 'text' : 'textSecondary'}>
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
                  accessibilityRole="button"
                  accessibilityLabel={showPassword ? 'Şifreyi gizle' : 'Şifreyi göster'}>
                  <ThemedText type="small" style={{ color: theme.accent }}>
                    {showPassword ? 'Gizle' : 'Göster'}
                  </ThemedText>
                </Pressable>
              }
            />

            {/* Hata ve bilgi kutuları */}
            {error && (
              <View
                style={[styles.banner, { backgroundColor: theme.warningBackground }]}
                accessibilityLiveRegion="polite">
                <ThemedText type="small">{error}</ThemedText>
              </View>
            )}
            {notice && (
              <View style={[styles.banner, { backgroundColor: theme.backgroundElement }]}>
                <ThemedText type="small">{notice}</ThemedText>
              </View>
            )}

            <Pressable
              onPress={handleSubmit}
              disabled={!canSubmit}
              accessibilityRole="button"
              style={({ pressed }) => [
                styles.button,
                { backgroundColor: theme.accent },
                pressed && styles.pressed,
                !canSubmit && styles.disabled,
              ]}>
              {busy ? (
                <ActivityIndicator color={theme.onAccent} />
              ) : (
                <ThemedText type="smallBold" style={{ color: theme.onAccent }}>
                  {mode === 'login' ? 'Giriş yap' : 'Hesap oluştur'}
                </ThemedText>
              )}
            </Pressable>
          </ScrollView>
        </KeyboardAvoidingView>
      </SafeAreaView>
    </ThemedView>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1 },
  flex: { flex: 1 },
  content: { padding: Spacing.four, gap: Spacing.four },
  header: { gap: Spacing.four, paddingTop: Spacing.two },
  segment: { flexDirection: 'row', borderRadius: Spacing.three, padding: Spacing.one },
  segmentItem: {
    flex: 1,
    alignItems: 'center',
    paddingVertical: Spacing.two,
    borderRadius: Spacing.two,
  },
  banner: { padding: Spacing.three, borderRadius: Spacing.three },
  button: {
    paddingVertical: Spacing.three,
    borderRadius: Spacing.five,
    alignItems: 'center',
    minHeight: 52,
    justifyContent: 'center',
  },
  pressed: { opacity: 0.8 },
  disabled: { opacity: 0.4 },
});
