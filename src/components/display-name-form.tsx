import { useState } from 'react';
import { AccessibilityInfo, Platform, StyleSheet, View } from 'react-native';

import { Banner } from '@/components/banner';
import { Button } from '@/components/button';
import { TextField } from '@/components/text-field';
import { Spacing } from '@/constants/theme';
import { useDisplayName } from '@/hooks/use-display-name';
import { ERROR_TEXT } from '@/lib/supabase-errors';

export const MIN_NAME_LENGTH = 2;
export const MAX_NAME_LENGTH = 40; // yalnız uygulamada sınırlanır (veritabanında kısıt yok)

// Kullanıcı adı formu (profiles.display_name). Ayarlar'da ve Yol Haritam'daki "Adını belirle" kartında
// AYNI bileşen kullanılır; kurallar (boş olamaz, 2-40 karakter) tek yerde kalır.
export function DisplayNameForm({ onSaved, submitLabel = 'Kaydet' }: { onSaved?: () => void; submitLabel?: string }) {
  const { name, status, save } = useDisplayName();
  // draft = kullanıcının yazdığı metin; null = henüz yazmadı. Alan değeri render'da türetilir:
  // sunucudan gelen ad kullanıcının yazdığını asla ezmez.
  const [draft, setDraft] = useState<string | null>(null);
  const [saving, setSaving] = useState(false);
  const [invalid, setInvalid] = useState(false);
  const [feedback, setFeedback] = useState<{ tone: 'success' | 'warning'; message: string } | null>(null);

  const value = draft ?? name ?? '';
  const trimmed = value.trim();
  const changed = trimmed !== (name ?? '');
  const disabled = status !== 'ready' || saving || !changed;

  function announce(message: string) {
    // Yalnız iOS: Android'de Banner'ın live region'ı zaten okutuyor (çift duyuru olmasın)
    if (Platform.OS === 'ios') AccessibilityInfo.announceForAccessibility(message);
  }

  async function onSave() {
    if (disabled) return;
    if (trimmed.length < MIN_NAME_LENGTH) {
      setInvalid(true);
      return;
    }
    setSaving(true);
    setFeedback(null);
    const result = await save(trimmed);
    setSaving(false);
    if (result.ok) {
      setDraft(null);
      setFeedback({ tone: 'success', message: 'Kullanıcı adın kaydedildi.' });
      announce('Kullanıcı adın kaydedildi.');
      onSaved?.();
    } else {
      setFeedback({ tone: 'warning', message: result.message });
      announce(result.message);
    }
  }

  return (
    <View style={styles.wrap}>
      {status === 'error' && <Banner tone="warning">{ERROR_TEXT.profileLoadFailed}</Banner>}
      <TextField
        label="Kullanıcı adı"
        value={value}
        onChangeText={(t) => {
          setDraft(t);
          setInvalid(false);
          setFeedback(null);
        }}
        placeholder={status === 'loading' ? undefined : 'Örn. Ayşe'}
        maxLength={MAX_NAME_LENGTH}
        editable={status === 'ready' && !saving}
        autoCapitalize="words"
        autoComplete="name"
        textContentType="name"
        returnKeyType="done"
        onSubmitEditing={onSave}
        invalid={invalid}
        hint={invalid ? `En az ${MIN_NAME_LENGTH} karakter olmalı.` : 'Uygulamada sana bu adla hitap ederiz.'}
      />
      <Button label={submitLabel} loading={saving} disabled={disabled} onPress={onSave} />
      {/* Sonuç butonun ALTINDA: çıkıp kaybolunca buton yer değiştirmesin */}
      {feedback && <Banner tone={feedback.tone}>{feedback.message}</Banner>}
    </View>
  );
}

const styles = StyleSheet.create({
  wrap: { gap: Spacing.three },
});
