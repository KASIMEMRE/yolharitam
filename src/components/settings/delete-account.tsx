import { useState } from 'react';
import { Pressable, StyleSheet, View } from 'react-native';
import { isAuthRetryableFetchError } from '@supabase/supabase-js';

import { Banner } from '@/components/banner';
import { Button } from '@/components/button';
import { Surface } from '@/components/surface';
import { TextField } from '@/components/text-field';
import { ThemedText } from '@/components/themed-text';
import { MinTouch, Spacing } from '@/constants/theme';
import { supabase } from '@/lib/supabase';
import { ERROR_TEXT } from '@/lib/supabase-errors';

const DELETE_WORD = 'SİL'; // kullanıcı bu kelimeyi yazmadan hesap silme düğmesi açılmaz

// İngilizce klavyede "SIL" yazan da kabul edilsin: büyük harfe çevirip İ'yi I'ya indirgeriz (iki taraf da)
const normalizeWord = (s: string) => s.trim().toLocaleUpperCase('tr-TR').replace(/İ/g, 'I');

// Hesabı silme: sayfanın EN ALTINDA, sade bir metin bağlantısı. Göze batmaz ama aranınca bulunur
// (mağaza kuralı). Dokununca açıklama ve "SİL" yazarak onay açılır.
export function DeleteAccountLink({ email }: { email: string | null }) {
  const [open, setOpen] = useState(false);
  const [word, setWord] = useState('');
  const [password, setPassword] = useState('');
  const [busy, setBusy] = useState(false);
  const [error, setError] = useState<string | null>(null);
  // Türkçe büyük harf: "sil" yazan da kabul edilsin. Şifre de şart: açık kalmış bir telefonu bulan
  // biri hesabı silemesin.
  const confirmed = normalizeWord(word) === normalizeWord(DELETE_WORD) && password.length > 0 && !!email;

  async function deleteAccount() {
    if (!confirmed || busy || !email) return;
    setBusy(true);
    setError(null);
    // Önce şifreyi doğrula (şifre değiştirme kartındaki kalıp: mevcut şifreyle yeniden giriş)
    try {
      const check = await supabase.auth.signInWithPassword({ email, password });
      if (check.error) {
        setBusy(false);
        // Ağ hatası ile yanlış şifre ayrılsın: bağlantı sorununda "şifre hatalı" demek yanıltır
        setError(isAuthRetryableFetchError(check.error) ? ERROR_TEXT.network : 'Şifre hatalı.');
        return;
      }
    } catch {
      setBusy(false);
      setError(ERROR_TEXT.network);
      return;
    }
    try {
      const { error: fnError } = await supabase.functions.invoke('delete-account', {
        body: { confirm: 'SIL' },
        timeout: 30000, // silme birkaç saniye sürebilir; genel 15 sn sınırına takılmasın
      });
      if (fnError) throw fnError;
    } catch {
      setBusy(false);
      setError('Hesap silinemedi. İnternet bağlantını kontrol edip tekrar dene.');
      return;
    }
    // Hesap silindi: yerel oturumu da kapat; Stack.Protected karşılama ekranına götürür.
    // scope 'local': sunucuya gitmez (kullanıcı artık yok, ağ isteği hata verirdi); yalnız cihazdaki oturumu siler.
    // Ayrı try/catch: çıkış başarısız olsa bile hesap silinmiştir, "silinemedi" dememeliyiz.
    try {
      const { error: outError } = await supabase.auth.signOut({ scope: 'local' });
      if (outError) throw outError;
    } catch {
      setBusy(false);
      setError('Hesabın silindi. Uygulamayı kapatıp yeniden aç.');
    }
  }

  if (!open) {
    return (
      <Pressable
        onPress={() => setOpen(true)}
        accessibilityRole="button"
        hitSlop={8}
        style={styles.deleteLink}>
        <ThemedText type="small" themeColor="textSecondary" style={styles.underline}>
          Hesabımı sil
        </ThemedText>
      </Pressable>
    );
  }

  return (
    <Surface tone="plain">
      <ThemedText type="smallBold">Hesabı sil</ThemedText>
      <ThemedText type="small" themeColor="textSecondary">
        Hesabın, tüm haritaların, ilerlemen ve rozetlerin kalıcı olarak silinir. Bu geri alınamaz.
      </ThemedText>
      <TextField
        label={`Onaylamak için ${DELETE_WORD} yaz`}
        value={word}
        onChangeText={setWord}
        autoCapitalize="characters"
        autoCorrect={false}
      />
      <TextField
        label="Şifren"
        value={password}
        onChangeText={(t) => {
          setPassword(t);
          setError(null);
        }}
        secureTextEntry
        autoComplete="current-password"
        textContentType="password"
      />
      {error && <Banner tone="warning">{error}</Banner>}
      <View style={styles.rowActions}>
        <Button variant="secondary" label="Hesabımı kalıcı olarak sil" disabled={!confirmed} loading={busy} onPress={deleteAccount} />
        <Button
          variant="text"
          label="Vazgeç"
          disabled={busy}
          onPress={() => {
            setOpen(false);
            setWord('');
            setPassword('');
          }}
        />
      </View>
    </Surface>
  );
}

const styles = StyleSheet.create({
  deleteLink: { alignSelf: 'center', minHeight: MinTouch, justifyContent: 'center', paddingHorizontal: Spacing.three, opacity: 0.8 },
  underline: { textDecorationLine: 'underline' },
  rowActions: { flexDirection: 'row', flexWrap: 'wrap', alignItems: 'center', gap: Spacing.two },
});
