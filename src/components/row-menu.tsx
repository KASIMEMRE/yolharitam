import { useState } from 'react';
import { Modal, Pressable, StyleSheet, View } from 'react-native';
import { useSafeAreaInsets } from 'react-native-safe-area-context';

import { Banner } from '@/components/banner';
import { Button } from '@/components/button';
import { Glyph } from '@/components/icon';
import { ListRow } from '@/components/list-row';
import { ThemedText } from '@/components/themed-text';
import { Border, MaxContentWidth, MinTouch, Radius, Spacing } from '@/constants/theme';
import { useTheme } from '@/hooks/use-theme';

// Satırın sağındaki "…" düğmesi + alttan açılan basit eylem sayfası.
// Neden? Bildir / Engelle / Sil / Geri çek gibi nadir ya da yıkıcı eylemler satırı kalabalık yapıyordu;
// artık satırda tek "…" var, eylem ve onay adımı sayfada olur (kartın içinde onay kutusu açılmaz).
// Yeni paket yok: RN'nin kendi `Modal`'ı yeterli (Expo Go uyumlu).

// Eylem bitince: başarı (isteğe bağlı teşekkür metniyle) ya da sayfada gösterilecek hata metni
export type ActionOutcome = { ok: true; message?: string } | { ok: false; error: string };

export type SheetAction = {
  id: string;
  label: string;
  icon: string; // emoji adı (icon.tsx)
  destructive?: boolean;
  accessibilityLabel?: string;
  confirmText: string; // onay adımında gösterilen açıklama
  confirmLabel: string; // onay düğmesi ("Evet, sil")
  run: () => Promise<ActionOutcome>;
};

type Step = { kind: 'menu' } | { kind: 'confirm'; id: string } | { kind: 'done'; message: string };

export function RowMenu({ title, actions, accessibilityLabel }: { title: string; actions: SheetAction[]; accessibilityLabel: string }) {
  const theme = useTheme();
  const insets = useSafeAreaInsets();
  const [open, setOpen] = useState(false);
  const [step, setStep] = useState<Step>({ kind: 'menu' });
  const [busy, setBusy] = useState(false);
  const [error, setError] = useState<string | null>(null);

  function close() {
    // Yürüyen bir işlem varken kapatılmaz: yarım kalan işlem sonucu görünmez olurdu
    if (busy) return;
    setOpen(false);
  }
  function show() {
    setStep({ kind: 'menu' });
    setError(null);
    setOpen(true);
  }

  const action = step.kind === 'confirm' ? actions.find((a) => a.id === step.id) : undefined;

  async function confirm() {
    if (!action) return;
    setBusy(true);
    setError(null);
    const result = await action.run();
    setBusy(false);
    if (!result.ok) return setError(result.error);
    // Satır silindiyse bu bileşen zaten kalkmıştır; kalmışsa teşekkür gösterip ya da doğrudan kapatırız
    if (result.message) setStep({ kind: 'done', message: result.message });
    else setOpen(false);
  }

  return (
    <>
      <Pressable
        onPress={show}
        accessibilityRole="button"
        accessibilityLabel={accessibilityLabel}
        hitSlop={4}
        style={({ pressed }) => [styles.trigger, pressed && { backgroundColor: theme.backgroundSelected }]}>
        <Glyph emoji="…" size={22} color={theme.textSecondary} />
      </Pressable>

      <Modal visible={open} transparent animationType="slide" onRequestClose={close}>
        {/* Karartma: tema rengi değil; her iki temada da arka planı soluklaştıran nötr perde */}
        <Pressable accessibilityRole="button" accessibilityLabel="Kapat" onPress={close} style={styles.scrim} />
        <View style={styles.sheetWrap} pointerEvents="box-none">
          <View
            style={[
              styles.sheet,
              { backgroundColor: theme.card, borderColor: theme.border, paddingBottom: Spacing.three + insets.bottom },
            ]}>
            <View style={[styles.grab, { backgroundColor: theme.border }]} />
            <ThemedText type="cardTitle" accessibilityRole="header" numberOfLines={2}>
              {title}
            </ThemedText>

            {step.kind === 'menu' &&
              // Her eylem tek dokunuşla onay adımına geçer; hiçbiri doğrudan çalışmaz
              actions.map((a) => (
                <ListRow
                  key={a.id}
                  icon={a.icon}
                  title={a.label}
                  destructive={a.destructive}
                  accessibilityLabel={a.accessibilityLabel ?? a.label}
                  onPress={() => setStep({ kind: 'confirm', id: a.id })}
                />
              ))}

            {step.kind === 'confirm' && action && (
              <View style={styles.block}>
                <ThemedText type="smallBold">{action.confirmText}</ThemedText>
                {error && <Banner tone="warning">{error}</Banner>}
                <Button variant="quiet" label={action.confirmLabel} loading={busy} onPress={confirm} />
                <Button
                  variant="text"
                  label="Vazgeç"
                  disabled={busy}
                  onPress={() => {
                    setError(null);
                    setStep({ kind: 'menu' });
                  }}
                />
              </View>
            )}

            {step.kind === 'done' && (
              <View style={styles.block}>
                <Banner tone="success">{step.message}</Banner>
                <Button variant="secondary" label="Tamam" onPress={() => setOpen(false)} />
              </View>
            )}
          </View>
        </View>
      </Modal>
    </>
  );
}

const styles = StyleSheet.create({
  // 44x44 dokunma alanı; görünür tek şey simge
  trigger: { width: MinTouch, height: MinTouch, borderRadius: Radius.pill, alignItems: 'center', justifyContent: 'center' },
  scrim: { ...StyleSheet.absoluteFill, backgroundColor: 'rgba(0, 0, 0, 0.4)' },
  sheetWrap: { flex: 1, justifyContent: 'flex-end', alignItems: 'center' },
  sheet: {
    width: '100%',
    maxWidth: MaxContentWidth,
    gap: Spacing.two,
    padding: Spacing.three,
    borderTopLeftRadius: Radius.xl,
    borderTopRightRadius: Radius.xl,
    borderWidth: Border.thin,
    borderBottomWidth: 0,
  },
  grab: { alignSelf: 'center', width: 40, height: 4, borderRadius: Radius.pill, marginBottom: Spacing.one },
  block: { gap: Spacing.two },
});
