import { type ComponentRef, useEffect, useRef, useState } from 'react';
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
import { normalizeUsername, USERNAME_PATTERN } from '@/hooks/use-username';
import { MIN_PASSWORD } from '@/lib/auth-rules';
import { supabase } from '@/lib/supabase';
import { ERROR_TEXT } from '@/lib/supabase-errors';
import { isAuthRetryableFetchError, type AuthError } from '@supabase/supabase-js';

type Mode = 'login' | 'signup';

// Yeni şifre kuralı tek yerde (auth-rules): Ayarlar'daki şifre değiştirme de aynı sayıyı kullanır
const MIN_NEW_PASSWORD = MIN_PASSWORD;

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
  if (m.includes('password should be') || m.includes('weak password'))
    return `Bu şifre çok zayıf. En az ${MIN_NEW_PASSWORD} karakterli, tahmini zor bir şifre seç.`;
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
  const scrollRef = useRef<ComponentRef<typeof ScrollView>>(null);
  useEffect(() => {
    if (error) scrollRef.current?.scrollToEnd({ animated: true });
  }, [error]);
  const [notice, setNotice] = useState<string | null>(null);
  // Kullanıcı adı müsait mi? Son sonucu hangi ad için aldığımızı da tutarız (yazı değişince eski sonuç geçersiz)
  const [nameCheck, setNameCheck] = useState<{ name: string; available: boolean | null } | null>(null);

  // Türetilmiş değerler
  const emailValid = /^\S+@\S+\.\S+$/.test(email.trim());
  // Yeni şifre en az 8 karakter (Supabase ayarıyla aynı). Girişte 6 yeter: kural değişmeden önce
  // 6-7 karakterlik şifreyle kaydolmuş kullanıcılar giriş yapabilmeli.
  const passwordValid = password.length >= (mode === 'signup' ? MIN_NEW_PASSWORD : 6);
  const handle = normalizeUsername(username);
  const handleFormatOk = USERNAME_PATTERN.test(handle);
  const checked = nameCheck?.name === handle ? nameCheck.available : undefined; // undefined = henüz sorulmadı
  const handleTaken = handleFormatOk && checked === false;
  // Kayıtta kullanıcı adı da zorunlu; girişte sorulmaz. Kontrol başarısızsa (null) kayda izin veririz:
  // son karar veritabanının (alınmışsa ad boş kalır, uygulama ilk girişte yeniden sorar).
  const usernameValid = handleFormatOk && !handleTaken;
  const canSubmit = emailValid && passwordValid && (mode === 'login' || usernameValid) && !busy;

  // Canlı "bu ad alınmış mı" kontrolü: yazmayı bıraktıktan 400 ms sonra sorulur (her tuşta sunucuya gitmeyelim)
  useEffect(() => {
    if (mode !== 'signup' || !handleFormatOk) return;
    let cancelled = false;
    const t = setTimeout(async () => {
      let available: boolean | null = null;
      try {
        const { data, error } = await supabase.rpc('username_available', { p: handle });
        if (!error && typeof data === 'boolean') available = data;
      } catch {
        // ağ hatası: belirsiz bırak
      }
      if (!cancelled) setNameCheck({ name: handle, available });
    }, 400);
    return () => {
      cancelled = true;
      clearTimeout(t);
    };
  }, [mode, handle, handleFormatOk]);

  let usernameHint = 'Küçük harf (a-z), rakam ve _ · 3-20 karakter · Türkçe karakter yok';
  let usernameHintTone: 'neutral' | 'good' = 'neutral';
  if (username.length > 0 && !handleFormatOk) {
    usernameHint = 'Yalnız küçük harf (a-z), rakam ve _ kullan; 3 ile 20 karakter arası olmalı.';
  } else if (handleTaken) {
    usernameHint = ERROR_TEXT.usernameTaken;
  } else if (handleFormatOk && checked === undefined) {
    usernameHint = 'Denetleniyor…';
  } else if (handleFormatOk && checked === true) {
    usernameHint = '✓ Bu ad müsait · sonradan Ayarlar’dan değiştirebilirsin';
    usernameHintTone = 'good';
  }

  function switchMode(next: Mode) {
    setMode(next);
    setError(null);
    setNotice(null);
  }

  async function handleSubmit() {
    setBusy(true);
    setError(null);
    setNotice(null);

    // try/finally: beklenmedik bir istisnada bile buton takılı kalmasın
    try {
      const credentials = { email: email.trim(), password };

      if (mode === 'login') {
        const { error } = await supabase.auth.signInWithPassword(credentials);
        if (error) setError(toTurkish(error));
        // Başarılıysa Stack.Protected bizi otomatik içeri alır.
      } else {
        // Kullanıcı adı hesabın bilgilerine (user_metadata) yazılır; veritabanındaki handle_new_user
        // tetikleyicisi hesap oluşurken onu profile kopyalar (e-posta onayı beklenmeden).
        const { data, error } = await supabase.auth.signUp({
          ...credentials,
          options: { data: { username: handle } },
        });
        if (error) {
          setError(toTurkish(error));
        } else if (!data.session) {
          setNotice(`Onay bağlantısı ${credentials.email} adresine gönderildi. Bağlantıya tıkladıktan sonra giriş yap.`);
          setMode('login');
        }
      }
    } catch {
      setError(ERROR_TEXT.other);
    } finally {
      setBusy(false);
    }
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
                  placeholder="örn. ayse_dev"
                  value={username}
                  onChangeText={setUsername}
                  maxLength={21} // "@" ile yazanın son karakteri kesilmesin
                  autoCapitalize="none"
                  autoCorrect={false}
                  autoComplete="username-new"
                  textContentType="username"
                  returnKeyType="next"
                  invalid={(username.length > 0 && !handleFormatOk) || handleTaken}
                  hint={usernameHint}
                  hintTone={usernameHintTone}
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
                hint={mode === 'signup' ? `${passwordValid ? '✓ ' : ''}En az ${MIN_NEW_PASSWORD} karakter` : undefined}
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
