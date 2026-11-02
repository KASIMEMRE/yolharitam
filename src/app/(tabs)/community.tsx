import { router, useLocalSearchParams } from 'expo-router';
import { useState } from 'react';

import { FriendsPanel } from '@/components/community/friends-panel';
import { LeaguePanel } from '@/components/community/league-panel';
import { ShowcasePanel } from '@/components/community/showcase-panel';
import { GuestPrompt } from '@/components/guest-prompt';
import { UsernameGate } from '@/components/community/username-gate';
import { ScreenHeader } from '@/components/screen-header';
import { Segmented } from '@/components/segmented';
import { TabScreen } from '@/components/tab-screen';
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
        // Misafirde lig/arkadaş/vitrin sorguları (RPC) hiç çağrılmaz; yalnız kayıt daveti
        <GuestPrompt
          emoji="👥"
          hue="violet"
          title="Toplulukta yerini al"
          text="Haftalık ligde yarış, çalışma arkadaşı ekle, bitirdiğin projeleri vitrinde paylaş. Katılmak için ücretsiz hesap gerekir."
          actionLabel="Katılmak için kayıt ol"
          onAction={() =>
            requireAuth({ type: 'community', tab: segment }, 'Topluluğa katılmak için ücretsiz hesap oluştur')
          }
          secondaryLabel="Zaten hesabım var"
          onSecondary={() => router.push({ pathname: '/login', params: { mode: 'login' } })}
        />
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
