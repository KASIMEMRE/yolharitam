import { router, useLocalSearchParams } from 'expo-router';
import { useState } from 'react';
import { StyleSheet, View } from 'react-native';

import { Button } from '@/components/button';
import { FriendsPanel } from '@/components/community/friends-panel';
import { LeaguePanel } from '@/components/community/league-panel';
import { ShowcasePanel } from '@/components/community/showcase-panel';
import { UsernameGate } from '@/components/community/username-gate';
import { ListGroup, ListRow } from '@/components/list-row';
import { ScreenHeader } from '@/components/screen-header';
import { Segmented } from '@/components/segmented';
import { TabScreen } from '@/components/tab-screen';
import { ThemedText } from '@/components/themed-text';
import { Spacing } from '@/constants/theme';
import { useAuthGate } from '@/lib/auth-gate';

type Segment = 'league' | 'friends' | 'showcase';

const SEGMENT_OPTIONS = [
  { id: 'league' as const, icon: '🏆', label: 'Lig' },
  { id: 'friends' as const, icon: '🤝', label: 'Arkadaşlar' },
  { id: 'showcase' as const, icon: '🧩', label: 'Vitrin' },
];

// Topluluk: haftalık lig, çalışma arkadaşları ve proje vitrini. Hepsi kullanıcı adı ister.
export default function CommunityScreen() {
  // Sekmeler ekranları bellekte tuttuğu için seçim, sekmeler arası gidip gelince de korunur
  const [segment, setSegment] = useState<Segment>('league');
  const { requireAuth, isGuest } = useAuthGate();
  // Kayıttan sonra bekleyen niyet "/community?tab=…" ile gelir: istenen parçayı aç
  const { tab } = useLocalSearchParams<{ tab?: string }>();
  // Sekmeler bellekte kaldığı için parametre sonradan değişebilir; efekt yerine "çizim sırasında ayarla" deseni
  const [handledTab, setHandledTab] = useState<string | undefined>(undefined);
  if (tab !== handledTab) {
    setHandledTab(tab);
    if (tab === 'league' || tab === 'friends' || tab === 'showcase') setSegment(tab);
  }

  return (
    <TabScreen>
      <ScreenHeader title="Topluluk" emoji="👥" hue="violet" />

      {isGuest ? (
        // Misafirde lig/arkadaş/vitrin sorguları (RPC) hiç çağrılmaz; yalnız sade tanıtım + kayıt daveti
        <View style={styles.intro}>
          <ThemedText themeColor="textSecondary">Birlikte çalışmak motivasyonu artırır. Katılmak için ücretsiz hesap gerekir.</ThemedText>
          <ListGroup>
            <ListRow icon="🏆" title="Haftalık lig" subtitle="Bu hafta kazandığın XP ile diğer öğrenenlerle yarış." />
            <ListRow icon="🤝" title="Çalışma arkadaşları" subtitle="Arkadaş ekle, birbirinizin serisini ve bugünkü çalışmasını gör." />
            <ListRow icon="🧩" title="Proje vitrini" subtitle="Bitirdiğin projeleri paylaş, başkalarının projelerine göz at." />
          </ListGroup>
          <View style={styles.actions}>
            <Button
              label="Katılmak için kayıt ol"
              onPress={() => requireAuth({ type: 'community', tab: segment }, 'Topluluğa katılmak için ücretsiz hesap oluştur')}
            />
            <Button variant="text" label="Zaten hesabım var" onPress={() => router.push({ pathname: '/login', params: { mode: 'login' } })} />
          </View>
        </View>
      ) : (
        <UsernameGate>
          <Segmented label="Topluluk bölümü" options={SEGMENT_OPTIONS} value={segment} onChange={setSegment} />
          {segment === 'league' && <LeaguePanel />}
          {segment === 'friends' && <FriendsPanel />}
          {segment === 'showcase' && <ShowcasePanel />}
        </UsernameGate>
      )}
    </TabScreen>
  );
}

const styles = StyleSheet.create({
  intro: { gap: Spacing.three },
  actions: { gap: Spacing.one },
});
