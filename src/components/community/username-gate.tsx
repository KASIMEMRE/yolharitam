import { useEffect, useState, type ReactNode } from 'react';
import { StyleSheet, View } from 'react-native';

import { Banner } from '@/components/banner';
import { Button } from '@/components/button';
import { Skeleton } from '@/components/skeleton';
import { TextField } from '@/components/text-field';
import { ThemedText } from '@/components/themed-text';
import { Border, Radius, Spacing } from '@/constants/theme';
import { normalizeUsername, USERNAME_PATTERN, useUsername } from '@/hooks/use-username';
import { useTheme } from '@/hooks/use-theme';
import { ERROR_TEXT } from '@/lib/supabase-errors';

const CHECK_DELAY_MS = 400;

// Kullanıcı adı formu: Yol Haritam'daki seçim kartında, Topluluk kapısında ve Ayarlar'da kullanılır (kurallar tek yerde).
// Adı henüz olmayan (eski) hesapta alan, mevcut bilgilerden üretilmiş bir öneriyle dolu gelir; tek dokunuşla kaydedilir.
export function UsernameForm({ onSaved, submitLabel = 'Kaydet' }: { onSaved?: () => void; submitLabel?: string }) {
  const { username, suggestion, status, save, checkAvailable, retry } = useUsername();
  // draft = kullanıcının yazdığı; null = henüz yazmadı (alan kayıtlı adı gösterir)
  const [draft, setDraft] = useState<string | null>(null);
  const [saving, setSaving] = useState(false);
  const [feedback, setFeedback] = useState<{ tone: 'success' | 'warning'; message: string } | null>(null);
  // Son uygunluk sonucu hangi ad için geldi? Yazı değiştikçe eski sonuç geçersiz sayılır.
  const [check, setCheck] = useState<{ name: string; result: boolean | null } | null>(null);

  const typed = draft ?? username ?? suggestion;
  const name = normalizeUsername(typed);
  const formatOk = USERNAME_PATTERN.test(name);
  const unchanged = name === (username ?? '');
  const needsCheck = formatOk && !unchanged;

  // Canlı kontrol: yazmayı bıraktıktan 400 ms sonra sorulur (her tuşta sunucuya gitmeyelim).
  // Temizlik fonksiyonu hem zamanlayıcıyı hem gelecek cevabı iptal eder.
  useEffect(() => {
    if (!needsCheck) return;
    let cancelled = false;
    const t = setTimeout(async () => {
      const result = await checkAvailable(name);
      if (!cancelled) setCheck({ name, result });
    }, CHECK_DELAY_MS);
    return () => {
      cancelled = true;
      clearTimeout(t);
    };
    // checkAvailable her render yeni fonksiyon; yalnız ad değişince sormak istiyoruz
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [name, needsCheck]);

  const checked = check && check.name === name ? check.result : undefined; // undefined = henüz sorulmadı
  const taken = needsCheck && checked === false;
  const checking = needsCheck && checked === undefined;

  let hint = 'Küçük harf, rakam ve alt çizgi (_). 3-20 karakter. Türkçe karakter (ç, ğ, ı, ö, ş, ü) kullanılamaz.';
  let hintTone: 'neutral' | 'good' = 'neutral';
  let invalid = false;
  if (typed.length > 0 && !formatOk) {
    invalid = true;
    hint = 'Yalnız küçük harf (a-z), rakam ve _ kullan; 3 ile 20 karakter arası olmalı.';
  } else if (taken) {
    invalid = true;
    hint = ERROR_TEXT.usernameTaken;
  } else if (checking) {
    hint = 'Denetleniyor…';
  } else if (needsCheck && checked === true) {
    hintTone = 'good';
    hint = 'Bu ad müsait.';
  } else if (needsCheck && checked === null) {
    hint = ERROR_TEXT.usernameCheckFailed;
  }

  const disabled = status !== 'ready' || saving || !needsCheck || taken;

  async function onSave() {
    if (disabled) return;
    setSaving(true);
    setFeedback(null);
    const result = await save(name);
    setSaving(false);
    if (result.ok) {
      setDraft(null);
      setFeedback({ tone: 'success', message: 'Kullanıcı adın kaydedildi.' });
      onSaved?.();
    } else {
      setFeedback({ tone: 'warning', message: result.message });
    }
  }

  return (
    <View style={styles.wrap}>
      {status === 'error' && (
        <>
          <Banner tone="warning">{ERROR_TEXT.usernameLoadFailed}</Banner>
          <Button variant="secondary" icon="🔄" label="Tekrar dene" onPress={retry} />
        </>
      )}
      <TextField
        label="Kullanıcı adı"
        value={typed}
        onChangeText={(t) => {
          setDraft(t);
          setFeedback(null);
        }}
        placeholder={status === 'loading' ? undefined : 'örn. ayse_dev'}
        maxLength={21} // "@" ile yazanın son karakteri kesilmesin
        editable={status === 'ready' && !saving}
        autoCapitalize="none"
        autoCorrect={false}
        autoComplete="username"
        returnKeyType="done"
        onSubmitEditing={onSave}
        invalid={invalid}
        hint={hint}
        hintTone={hintTone}
      />
      <Button label={submitLabel} loading={saving} disabled={disabled} onPress={onSave} />
      {feedback && <Banner tone={feedback.tone}>{feedback.message}</Banner>}
    </View>
  );
}

// Topluluk sekmesinin kapısı: kullanıcı adı varsa içeriği gösterir, yoksa önce ad seçtirir.
// Yeni hesaplar adı kayıtta seçtiği için bu kapıyı hiç görmez; yalnız adı olmayan eski hesaplar için yedek.
// Neden zorunlu? Lig ve arkadaş ekleme @kullanıcıadı ile çalışır; adsız kullanıcı listelerde görünmez.
export function UsernameGate({ children }: { children: ReactNode }) {
  const theme = useTheme();
  const { username, status, retry } = useUsername();

  if (status === 'loading') {
    return (
      <View style={styles.wrap}>
        <Skeleton height={44} />
        <Skeleton height={120} />
      </View>
    );
  }

  if (status === 'error' && !username) {
    return (
      <View style={styles.wrap}>
        <Banner tone="warning">{ERROR_TEXT.usernameLoadFailed}</Banner>
        <Button variant="secondary" icon="🔄" label="Tekrar dene" onPress={retry} />
      </View>
    );
  }

  if (!username) {
    return (
      <View style={[styles.card, { backgroundColor: theme.card, borderColor: theme.border }]}>
        <ThemedText type="cardTitle" accessibilityRole="header">
          🏷️ Bir kullanıcı adı seç
        </ThemedText>
        <ThemedText themeColor="textSecondary">
          Diğer kullanıcılar seni bu adla görür, arkadaşların seni bu adla bulur. Sonradan Ayarlar&apos;dan değiştirebilirsin.
        </ThemedText>
        {/* Kapı ile form ayrı useUsername örnekleri; kayıttan sonra kapı kendi okumasını tazeler ve açılır */}
        <UsernameForm onSaved={retry} />
      </View>
    );
  }

  return <>{children}</>;
}

const styles = StyleSheet.create({
  wrap: { gap: Spacing.three },
  card: { gap: Spacing.three, padding: Spacing.three, borderRadius: Radius.lg, borderWidth: Border.thick },
});
