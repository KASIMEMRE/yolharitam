import { useState } from 'react';
import { StyleSheet, View } from 'react-native';

import { Banner } from '@/components/banner';
import { FilterChipRow } from '@/components/filter-chips';
import { Glyph } from '@/components/icon';
import { ListGroup, ListRow } from '@/components/list-row';
import { LoadError } from '@/components/load-error';
import { Skeleton } from '@/components/skeleton';
import { ThemedText } from '@/components/themed-text';
import { getRoadmap } from '@/constants/dev-roadmaps';
import { MinTouch, Radius, Spacing } from '@/constants/theme';
import { useLatestRoadmap } from '@/hooks/use-latest-roadmap';
import { useLeague, type LeagueRow } from '@/hooks/use-league';
import { useTheme } from '@/hooks/use-theme';
import { weekEndText } from '@/lib/week';

// İlk üç sıra madalya simgesiyle; renkler temadan: altın (sarı), gümüş (gri), bronz (mercan)
const MEDALS = ['markerEdge', 'textSecondary', 'coralEdge'] as const;

// Haftalık lig: aynı haritayı takip edenler arasında bu haftaki XP sıralaması.
// Düzen: harita çipleri (tek satır) → tek satır bilgi → ListGroup içinde sıralama satırları.
export function LeaguePanel() {
  const { roadmaps, status: mapsStatus, retry: retryMaps } = useLatestRoadmap();
  const [selected, setSelected] = useState<string | null>(null);

  const maps = roadmaps.flatMap((r) => {
    const m = getRoadmap(r.topic_path);
    return m ? [{ id: m.id, emoji: m.emoji, hue: m.hue, title: m.title }] : [];
  });
  // Seçili harita silindiyse ya da hiç seçilmediyse ilk haritaya düş (lig "Tümü" olamaz)
  const active = maps.find((m) => m.id === selected)?.id ?? maps[0]?.id ?? null;

  const { rows, status, retry } = useLeague(active);
  const mapsLoading = mapsStatus === 'loading';
  const leagueLoading = mapsLoading || (active !== null && status === 'loading');

  if (mapsStatus === 'error' && maps.length === 0) {
    return <LoadError onRetry={retryMaps} />;
  }

  if (mapsStatus === 'ready' && maps.length === 0) {
    return <Banner tone="info">Lige katılmak için önce bir yol haritası seç.</Banner>;
  }

  return (
    <View style={styles.list}>
      {mapsLoading ? (
        <Skeleton height={MinTouch} radius={Radius.sm} />
      ) : (
        active && (
          <FilterChipRow
            role="radio"
            variant="tabs"
            label="Harita"
            options={maps.map((m) => ({ id: m.id, label: m.title, dot: m.hue }))}
            value={active}
            onChange={setSelected}
          />
        )
      )}

      {/* Hafta bitimi (veri taşıyan tek satır). Dar ekranda kırpılmasın diye gerekirse alt satıra iner. */}
      <ThemedText type="small" themeColor="textSecondary">
        {weekEndText()}
      </ThemedText>

      {leagueLoading && rows.length === 0 && (
        <View style={styles.list}>
          {[0, 1, 2, 3].map((i) => (
            <Skeleton key={i} height={56} radius={Radius.md} />
          ))}
        </View>
      )}

      {!leagueLoading && status === 'error' && (
        <LoadError variant={rows.length > 0 ? 'inline' : 'screen'} onRetry={retry} />
      )}

      {!leagueLoading && status === 'ready' && rows.length === 0 && (
        <View style={styles.empty}>
          <ThemedText themeColor="textSecondary" style={styles.center}>
            Bu haritada bu hafta henüz puan kazanan yok.
          </ThemedText>
        </View>
      )}

      {rows.length > 0 && (
        <ListGroup>
          {rows.map((row) => (
            <LeagueRowView key={row.user_id} row={row} />
          ))}
        </ListGroup>
      )}
    </View>
  );
}

function LeagueRowView({ row }: { row: LeagueRow }) {
  const theme = useTheme();
  const medal = row.rank >= 1 && row.rank <= 3 ? theme[MEDALS[row.rank - 1]] : null;
  // Uygulamada tek ad var: @kullanıcı adı
  const title = row.username ? `@${row.username}` : 'Gezgin';

  return (
    // "Sen" satırı yumuşak vurgu zeminiyle ayrılır (kart değil, yalnız zemin). accessible: sıra bilgisi madalya
    // simgesinde kaybolmasın diye tek cümlede okunur.
    <View
      accessible
      accessibilityLabel={`${row.rank}. sıra, ${title}${row.is_me ? ', sen' : ''}, ${row.xp} XP`}
      style={row.is_me ? { backgroundColor: theme.backgroundElement, borderRadius: Radius.sm } : undefined}>
      <ListRow
        left={
          <View style={styles.rank}>
            {medal ? (
              <Glyph emoji="🥇" size={22} color={medal} strokeWidth={2.25} />
            ) : (
              <ThemedText type="smallBold" themeColor="textSecondary">
                {row.rank}
              </ThemedText>
            )}
          </View>
        }
        title={row.is_me ? `${title} (sen)` : title}
        right={
          <ThemedText type="smallBold" themeColor="markerInk">
            {row.xp} XP
          </ThemedText>
        }
      />
    </View>
  );
}

const styles = StyleSheet.create({
  list: { gap: Spacing.three },
  rank: { width: 28, alignItems: 'center' },
  empty: { alignItems: 'center', gap: Spacing.two, paddingVertical: Spacing.five },
  center: { textAlign: 'center' },
});
