import { isAuthRetryableFetchError } from '@supabase/supabase-js';
import { useState } from 'react';
import { StyleSheet, View } from 'react-native';

import { Banner } from '@/components/banner';
import { Button } from '@/components/button';
import { TextField } from '@/components/text-field';
import { ThemedText } from '@/components/themed-text';
import { Spacing } from '@/constants/theme';
import { MIN_PASSWORD } from '@/lib/auth-rules';
import { supabase } from '@/lib/supabase';
import { ERROR_TEXT } from '@/lib/supabase-errors';

// Şifre değiştirme (eski settings.tsx'ten taşındı, mantık aynı: önce MEVCUT şifre doğrulanır).
export function PasswordSection({ email }: { email: string | null }) {
  const [open, setOpen] = useState(false);
  const [current, setCurrent] = useState('');
  const [password, setPassword] = useState('');
  const [repeat, setRepeat] = useState('');
  const [state, setState] = useState<{ tone: 'success' | 'warning'; text: string } | null>(null);
  const [currentWrong, setCurrentWrong] = useState(false);
  const [busy, setBusy] = useState(false);

  const tooShort = password.length > 0 && password.length < MIN_PASSWORD;
  const mismatch = repeat.length > 0 && repeat !== password;
  const sameAsOld = password.length > 0 && password === current;
  const canSave =
    !!email && current.length > 0 && password.length >= MIN_PASSWORD && password === repeat && !sameAsOld && !busy;

  function reset() {
    setCurrent('');
    setPassword('');
    setRepeat('');
    setCurrentWrong(false);
  }

  async function save() {
    if (!canSave || !email) return;
    setBusy(true);
    setState(null);
    setCurrentWrong(false);
    // try/finally: beklenmedik bir istisnada bile düğme "yükleniyor"da takılı kalmasın
    try {
      // 1) Önce MEVCUT şifreyi doğrula: telefonu açık bırakılmış biri şifreni değiştiremesin.
      //    Doğrulama için mevcut şifreyle yeniden giriş yapılır (oturum aynı kullanıcıyla tazelenir).
      const check = await supabase.auth.signInWithPassword({ email, password: current });
      if (check.error) {
        // Ağ hatasını "şifren yanlış" diye göstermeyelim (hesap silme akışıyla aynı ayrım)
        if (isAuthRetryableFetchError(check.error)) {
          setState({ tone: 'warning', text: ERROR_TEXT.network });
        } else {
          setCurrentWrong(true);
          setState({ tone: 'warning', text: 'Mevcut şifren yanlış.' });
        }
        return;
      }
      // 2) Doğrulandıysa yeni şifreyi kaydet
      const { error } = await supabase.auth.updateUser({ password });
      if (error) {
        setState({
          tone: 'warning',
          text: isAuthRetryableFetchError(error)
            ? ERROR_TEXT.network
            : 'Şifre değiştirilemedi. Daha güçlü bir şifre deneyip tekrar dene.',
        });
        return;
      }
      reset();
      setOpen(false); // başarı kutusu kapalı formun üstünde gösterilir
      setState({ tone: 'success', text: 'Şifren değiştirildi.' });
    } catch {
      setState({ tone: 'warning', text: ERROR_TEXT.network });
    } finally {
      setBusy(false);
    }
  }

  return (
    <View style={styles.box}>
      <ThemedText type="smallBold">Şifre</ThemedText>
      {!open ? (
        <>
          {state?.tone === 'success' && <Banner tone="success">{state.text}</Banner>}
          <Button
            variant="secondary"
            icon="🔑"
            label="Şifremi değiştir"
            onPress={() => {
              setState(null);
              setOpen(true);
            }}
          />
        </>
      ) : (
        <>
          <TextField
            label="Mevcut şifre"
            value={current}
            onChangeText={(t) => {
              setCurrent(t);
              setCurrentWrong(false);
            }}
            secureTextEntry
            autoComplete="current-password"
            textContentType="password"
            invalid={currentWrong}
            hint={currentWrong ? 'Mevcut şifren yanlış.' : undefined}
          />
          <TextField
            label="Yeni şifre"
            value={password}
            onChangeText={setPassword}
            secureTextEntry
            autoComplete="new-password"
            textContentType="newPassword"
            invalid={tooShort || sameAsOld}
            hint={
              sameAsOld
                ? 'Yeni şifre eskisiyle aynı olamaz.'
                : tooShort
                  ? `En az ${MIN_PASSWORD} karakter olmalı.`
                  : `En az ${MIN_PASSWORD} karakter.`
            }
          />
          <TextField
            label="Yeni şifre (tekrar)"
            value={repeat}
            onChangeText={setRepeat}
            secureTextEntry
            autoComplete="new-password"
            textContentType="newPassword"
            invalid={mismatch}
            hint={mismatch ? 'Şifreler aynı değil.' : undefined}
            onSubmitEditing={save}
          />
          {state?.tone === 'warning' && <Banner tone="warning">{state.text}</Banner>}
          <View style={styles.rowActions}>
            <Button label="Şifreyi değiştir" loading={busy} disabled={!canSave} onPress={save} />
            <Button
              variant="text"
              label="Vazgeç"
              disabled={busy}
              onPress={() => {
                reset();
                setState(null);
                setOpen(false);
              }}
            />
          </View>
        </>
      )}
    </View>
  );
}

const styles = StyleSheet.create({
  box: { gap: Spacing.three },
  rowActions: { flexDirection: 'row', flexWrap: 'wrap', alignItems: 'center', gap: Spacing.two },
});
