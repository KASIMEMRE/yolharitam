import { useState } from 'react';
import { Pressable, StyleSheet, useWindowDimensions, View } from 'react-native';

import { FriendsPanel } from '@/components/community/friends-panel';
import { LeaguePanel } from '@/components/community/league-panel';
import { ShowcasePanel } from '@/components/community/showcase-panel';
import { UsernameGate } from '@/components/community/username-gate';
import { ScreenHeader } from '@/components/screen-header';
import { TabScreen } from '@/components/tab-screen';
import { ThemedText } from '@/components/themed-text';
import { MinTouch, Radius, Spacing } from '@/constants/theme';
import { useTheme } from '@/hooks/use-theme';

type Segment = 'league' | 'friends' | 'showcase';

const SEGMENTS: { id: Segment; emoji: string; label: string }[] = [
  { id: 'league', emoji: '🏆', label: 'Lig' },
  { id: 'friends', emoji: '🤝', label: 'Arkadaşlar' },
  { id: 'showcase', emoji: '🧩', label: 'Vitrin' },
];

// Topluluk: haftalık lig, çalışma arkadaşları ve proje vitrini. Hepsi kullanıcı adı ister.
export default function CommunityScreen() {
  // Sekmeler ekranları bellekte tuttuğu için seçim, sekmeler arası gidip gelince de korunur
  const [segment, setSegment] = useState<Segment>('league');

  return (
    <TabScreen>
      <ScreenHeader title="Topluluk" emoji="👥" hue="violet" />

      <UsernameGate>
        <SegmentBar value={segment} onChange={setSegment} />
        {segment === 'league' && <LeaguePanel />}
        {segment === 'friends' && <FriendsPanel />}
        {segment === 'showcase' && <ShowcasePanel />}
      </UsernameGate>
    </TabScreen>
  );
}

// Üç parçalı kapsül: kaydırmaz, parçalar eşit genişlikte. Harita çiplerinden (yatay kayan) ayrışsın diye
// izli kapsül + dolu yeşil seçili parça kullanılır. Dar ekranda (<360) emoji atılır ki etiket sığsın.
function SegmentBar({ value, onChange }: { value: Segment; onChange: (s: Segment) => void }) {
  const theme = useTheme();
  const { width } = useWindowDimensions();
  const compact = width < 360;

  return (
    <View accessibilityRole="tablist" style={[styles.track, { backgroundColor: theme.backgroundElement }]}>
      {SEGMENTS.map((s) => {
        const selected = value === s.id;
        return (
          <Pressable
            key={s.id}
            onPress={() => onChange(s.id)}
            accessibilityRole="tab"
            accessibilityLabel={s.label}
            accessibilityState={{ selected }}
            style={({ pressed }) => [
              styles.segment,
              { backgroundColor: selected ? theme.accent : 'transparent', opacity: pressed ? 0.85 : 1 },
            ]}>
            <ThemedText
              type="chip"
              themeColor={selected ? 'onAccent' : 'text'}
              numberOfLines={1}
              adjustsFontSizeToFit
              minimumFontScale={0.85}
              maxFontSizeMultiplier={1.3}>
              {compact ? s.label : `${s.emoji} ${s.label}`}
            </ThemedText>
          </Pressable>
        );
      })}
    </View>
  );
}

const styles = StyleSheet.create({
  track: { flexDirection: 'row', gap: Spacing.two, padding: Spacing.one, borderRadius: Radius.pill },
  segment: {
    flex: 1,
    minWidth: 0,
    minHeight: MinTouch,
    alignItems: 'center',
    justifyContent: 'center',
    paddingHorizontal: Spacing.one,
    borderRadius: Radius.pill,
  },
});
