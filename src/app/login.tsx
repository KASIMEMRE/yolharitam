import { router, useLocalSearchParams } from 'expo-router';
import { type ComponentRef, useEffect, useRef, useState } from 'react';
import {
  KeyboardAvoidingView,
  Platform,
  Pressable,
  ScrollView,
  StyleSheet,
  TextInput,
  useWindowDimensions,
  View,
} from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';

import { Banner } from '@/components/banner';
import { Button } from '@/components/button';
import { Segmented } from '@/components/segmented';
import { TextField } from '@/components/text-field';
import { ThemedText } from '@/components/themed-text';
import { ThemedView } from '@/components/themed-view';
import { Fonts, Spacing } from '@/constants/theme';
import { useTheme } from '@/hooks/use-theme';
import { normalizeUsername, USERNAME_PATTERN } from '@/hooks/use-username';
import { clearPendingIntent } from '@/lib/auth-gate';
import { PRIVACY_URL, TERMS_URL } from '@/lib/config';
import { openExternalUrl } from '@/lib/open-url';
import { MIN_PASSWORD } from '@/lib/auth-rules';
import { supabase } from '@/lib/supabase';
import { ERROR_TEXT } from '@/lib/supabase-errors';
import { isAuthRetryableFetchError, type AuthError } from '@supabase/supabase-js';

type Mode = 'login' | 'signup';

// Yeni şifre kuralı tek yerde (auth-rules): Ayarlar'daki şifre değiştirme de aynı sayıyı kullanır
const MIN_NEW_PASSWORD = MIN_PASSWORD;

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
  if (__DEV__) console.warn('Tanınmayan giriş hatası:', error.message);
  return 'Bir sorun oluştu. Biraz sonra tekrar dene.';
}

export default function LoginScreen() {
  const theme = useTheme();
  const { width, height } = useWindowDimensions();
  const gutter = width < 360 ? Spacing.three : Spacing.four;
  // Kısa ekranda (örn. 320x568) başlık küçülsün ki şifre alanı ilk ekranda görünsün
  const short = height < 700;
  // Karşılama ekranı ?mode=signup ile gelirse kayıt sekmesi açık başlar. Yalnız BAŞLANGIÇ değeri:
  // sonradan sekmeyi elle değiştirmek parametreyle çakışmasın diye useEffect ile senkronlamıyoruz.
  const params = useLocalSearchParams<{ mode?: string | string[]; reason?: string | string[] }>();
  const initialMode = Array.isArray(params.mode) ? params.mode[0] : params.mode;
  // Kayıt kapısından gelindiyse neden hesap istediğimizi söyleyen tek satır (örn. "Frontend haritasını kaydetmek için…")
  // Adres çubuğundan gelen metin olduğu için kısaltılır (web'de uzun, yanıltıcı bir mesaj gösterilmesin)
  const reason = (Array.isArray(params.reason) ? params.reason[0] : params.reason)?.trim().slice(0, 120) || null;
  const [mode, setMode] = useState<Mode>(initialMode === 'signup' ? 'signup' : 'login');
  const [username, setUsername] = useState('');
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [showPassword, setShowPassword] = useState(false);
  const [busy, setBusy] = useState(false);
  const [error, setError] = useState<string | null>(null);
  // Hata kutusu formun en altında; küçük ekranlarda görünür alanın dışında kalabiliyor.
  // Hata çıkınca sayfayı en alta kaydırıyoruz ki kullanıcı mesajı mutlaka görsün.
  const [notice, setNotice] = useState<string | null>(null);
  const scrollRef = useRef<ComponentRef<typeof ScrollView>>(null);
  // Klavye akışı: kullanıcı adı → e-posta → şifre → gönder
  const emailRef = useRef<ComponentRef<typeof TextInput>>(null);
  const passwordRef = useRef<ComponentRef<typeof TextInput>>(null);
  // Kayıttan sonra gelen bilgi kutusu (notice) da aynı yerde; o da görünür alana kaydırılsın
  useEffect(() => {
    if (error || notice) scrollRef.current?.scrollToEnd({ animated: true });
  }, [error, notice]);
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

  let usernameHint = '3-20 karakter: küçük harf (a-z), rakam ve _';
  let usernameHintTone: 'neutral' | 'good' = 'neutral';
  if (username.length > 0 && !handleFormatOk) {
    usernameHint = 'Yalnız küçük harf (a-z), rakam ve _ kullan; 3 ile 20 karakter arası olmalı.';
  } else if (handleTaken) {
    usernameHint = ERROR_TEXT.usernameTaken;
  } else if (handleFormatOk && checked === undefined) {
    usernameHint = 'Denetleniyor…';
  } else if (handleFormatOk && checked === true) {
    usernameHint = '✓ Bu ad müsait';
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
            {/* Sade başlık: renkli sahne ve patika yok; yalnız Bricolage başlık */}
            <View style={[styles.head, { paddingHorizontal: gutter }, short && styles.headShort]}>
              <ThemedText
                type="heading"
                accessibilityRole="header"
                style={short && { fontSize: 28, lineHeight: 34 }}>
                {mode === 'login' ? 'Giriş yap' : 'Hesap oluştur'}
              </ThemedText>
            </View>

            <View style={[styles.form, { padding: gutter }]}>
              {reason && (
                <ThemedText type="smallBold" themeColor="accentInk" accessibilityRole="text">
                  {reason}
                </ThemedText>
              )}
              {/* Giriş / Kayıt seçici: uygulamanın tek tip segment kontrolü (Segmented) */}
              <Segmented
                label="Giriş türü"
                value={mode}
                onChange={switchMode}
                options={[
                  { id: 'login', label: 'Giriş yap' },
                  { id: 'signup', label: 'Kayıt ol' },
                ]}
              />

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
                  // Klavyedeki "ileri" ile sıradaki alana geç (klavye kapanıp açılmasın)
                  submitBehavior="submit"
                  onSubmitEditing={() => emailRef.current?.focus()}
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
                ref={emailRef}
                submitBehavior="submit"
                onSubmitEditing={() => passwordRef.current?.focus()}
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
                ref={passwordRef}
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

              {/* Kayıtta yasal onay: mağazalar kullanıcı içeriği olan uygulamalarda koşulların kabulünü ister */}
              {mode === 'signup' && (
                <ThemedText type="small" themeColor="textSecondary" style={styles.legal}>
                  Hesap oluşturarak{' '}
                  <ThemedText type="small" themeColor="accentInk" style={styles.link} onPress={() => openExternalUrl(TERMS_URL)} accessibilityRole="link">
                    Kullanım Koşulları
                  </ThemedText>
                  {"'nı ve "}
                  <ThemedText type="small" themeColor="accentInk" style={styles.link} onPress={() => openExternalUrl(PRIVACY_URL)} accessibilityRole="link">
                    Gizlilik Politikası
                  </ThemedText>
                  {"'nı kabul etmiş olursun."}
                </ThemedText>
              )}
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
            {/* Misafir gezintisine dönüş: yığında geri gidilecek ekran yoksa (doğrudan açılış) sekmelere git */}
            <Button
              variant="text"
              label="Şimdilik gez"
              onPress={() => {
                // Vazgeçti: bekleyen niyet sonraki bir girişte habersiz uygulanmasın
                void clearPendingIntent();
                if (router.canGoBack()) router.back();
                else router.replace('/roadmap');
              }}
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
  head: { paddingTop: Spacing.four },
  headShort: { paddingTop: Spacing.two },
  form: { gap: Spacing.four },
  showButton: { minHeight: 44, minWidth: 44, marginRight: Spacing.two, paddingHorizontal: Spacing.two, alignItems: 'center', justifyContent: 'center' },
  legal: { textAlign: 'center' },
  link: { textDecorationLine: 'underline', fontFamily: Fonts.sansBold },
  footer: { gap: Spacing.one, paddingTop: Spacing.three, paddingBottom: Spacing.three, borderTopWidth: 1 },
});
