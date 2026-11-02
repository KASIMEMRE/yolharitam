import { useState } from 'react';

import { FriendsPanel } from '@/components/community/friends-panel';
import { LeaguePanel } from '@/components/community/league-panel';
import { ShowcasePanel } from '@/components/community/showcase-panel';
import { UsernameGate } from '@/components/community/username-gate';
import { ScreenHeader } from '@/components/screen-header';
import { Segmented } from '@/components/segmented';
import { TabScreen } from '@/components/tab-screen';

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

  return (
    <TabScreen>
      <ScreenHeader title="Topluluk" emoji="👥" hue="violet" />

      <UsernameGate>
        <Segmented label="Topluluk bölümü" options={SEGMENT_OPTIONS} value={segment} onChange={setSegment} />
        {segment === 'league' && <LeaguePanel />}
        {segment === 'friends' && <FriendsPanel />}
        {segment === 'showcase' && <ShowcasePanel />}
      </UsernameGate>
    </TabScreen>
  );
}
