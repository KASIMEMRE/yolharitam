import { useState } from 'react';
import { StyleSheet, View } from 'react-native';

import { Banner } from '@/components/banner';
import { Button } from '@/components/button';
import { ThemedText } from '@/components/themed-text';
import { Radius, Spacing } from '@/constants/theme';
import { useTheme } from '@/hooks/use-theme';
import { blockUser } from '@/lib/blocking';

// "Engelle" düğmesi + kartın içinde iki adımlı onay (uygulamanın onay kalıbı: tarayıcı uyarısı yok).
// Mağaza kuralı: kullanıcı içeriği olan uygulamada rahatsız eden kişi engellenebilmeli.
export function BlockUserButton({ userId, name, onBlocked }: { userId: string; name: string; onBlocked: () => void }) {
  const theme = useTheme();
  const [confirming, setConfirming] = useState(false);
  const [busy, setBusy] = useState(false);
  const [failed, setFailed] = useState<null | 'limit' | 'error'>(null);

  async function confirm() {
    setBusy(true);
    setFailed(null);
    const result = await blockUser(userId);
    setBusy(false);
    if (result === 'ok') onBlocked();
    else setFailed(result);
  }

  if (!confirming) {
    return (
      <Button
        variant="text"
        icon="🚫"
        label="Engelle"
        accessibilityLabel={`${name} kullanıcısını engelle`}
        onPress={() => setConfirming(true)}
      />
    );
  }
  return (
    <View style={[styles.confirm, { backgroundColor: theme.warningBackground }]}>
      <ThemedText type="smallBold" themeColor="warningInk">
        {`${name} engellenecek: aranızdaki arkadaşlık silinir, birbirinizin projelerini ve lig satırını görmezsiniz. Engeli Ayarlar'dan kaldırabilirsin.`}
      </ThemedText>
      {failed && (
        <Banner tone="warning">
          {failed === 'limit'
            ? "Engel sınırına ulaştın. Ayarlar'dan eski engellerden bazılarını kaldırıp tekrar dene."
            : 'Engellenemedi. İnternet bağlantını kontrol edip tekrar dene.'}
        </Banner>
      )}
      <View style={styles.actions}>
        <Button variant="quiet" label="Evet, engelle" loading={busy} onPress={confirm} />
        <Button variant="text" label="Vazgeç" disabled={busy} onPress={() => setConfirming(false)} />
      </View>
    </View>
  );
}

const styles = StyleSheet.create({
  confirm: { gap: Spacing.two, padding: Spacing.three, borderRadius: Radius.md },
  actions: { gap: Spacing.two },
});
