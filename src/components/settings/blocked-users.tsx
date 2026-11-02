import { useFocusEffect } from 'expo-router';
import { useCallback, useState } from 'react';
import { StyleSheet, View } from 'react-native';

import { Banner } from '@/components/banner';
import { Button } from '@/components/button';
import { ListGroup, ListRow } from '@/components/list-row';
import { ThemedText } from '@/components/themed-text';
import { Spacing } from '@/constants/theme';
import { type BlockedUser, listBlocked, unblockUser } from '@/lib/blocking';

// Engellenen kullanıcılar: listeyi gör, istersen engeli kaldır.
// (Eski settings.tsx'ten taşındı; mantık aynı, yalnız kart yerine ListGroup satırları.)
export function BlockedUsersList() {
  const [list, setList] = useState<BlockedUser[] | null | 'loading'>('loading');
  const [busyId, setBusyId] = useState<string | null>(null);
  const [failed, setFailed] = useState(false);

  useFocusEffect(
    useCallback(() => {
      let cancelled = false;
      listBlocked().then((r) => {
        if (!cancelled) setList(r);
      });
      return () => {
        cancelled = true;
      };
    }, [])
  );

  async function unblock(id: string) {
    setBusyId(id);
    setFailed(false);
    const ok = await unblockUser(id);
    setBusyId(null);
    // Fonksiyonel güncelleme: art arda iki kaldırmada eski liste diğerini geri getirmesin
    if (ok) setList((l) => (Array.isArray(l) ? l.filter((b) => b.user_id !== id) : l));
    else setFailed(true);
  }

  return (
    <View style={styles.box}>
      {failed && <Banner tone="warning">Engel kaldırılamadı. İnternet bağlantını kontrol edip tekrar dene.</Banner>}
      {list === 'loading' ? (
        <ThemedText type="small" themeColor="textSecondary">
          Yükleniyor…
        </ThemedText>
      ) : list === null ? (
        <ThemedText type="small" themeColor="textSecondary">
          Liste yüklenemedi. Sayfaya yeniden girince tekrar denenir.
        </ThemedText>
      ) : list.length === 0 ? (
        <ThemedText type="small" themeColor="textSecondary">
          Kimseyi engellemedin. Toplulukta rahatsız eden birini kartındaki “Engelle” ile engelleyebilirsin.
        </ThemedText>
      ) : (
        <ListGroup>
          {list.map((b) => (
            <ListRow
              key={b.user_id}
              icon="🚫"
              title={b.username ? `@${b.username}` : 'Gezgin'}
              right={
                <Button
                  variant="text"
                  label="Engeli kaldır"
                  accessibilityLabel={`${b.username ?? 'Kullanıcının'} engelini kaldır`}
                  loading={busyId === b.user_id}
                  onPress={() => unblock(b.user_id)}
                />
              }
            />
          ))}
        </ListGroup>
      )}
    </View>
  );
}

const styles = StyleSheet.create({
  box: { gap: Spacing.three },
});
