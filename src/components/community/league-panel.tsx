import { useState } from 'react';
import { StyleSheet, View } from 'react-native';

import { Banner } from '@/components/banner';
import { Button } from '@/components/button';
import { FilterChipRow } from '@/components/filter-chips';
import { Glyph, IconLabel } from '@/components/icon';
import { IconTile } from '@/components/icon-tile';
import { ListGroup, ListRow } from '@/components/list-row';
import { Skeleton } from '@/components/skeleton';
import { ThemedText } from '@/components/themed-text';
import { getRoadmap } from '@/constants/dev-roadmaps';
import { MinTouch, Radius, Spacing } from '@/constants/theme';
import { useLatestRoadmap } from '@/hooks/use-latest-roadmap';
import { useLeague, type LeagueRow } from '@/hooks/use-league';
import { useTheme } from '@/hooks/use-theme';
import { ERROR_TEXT } from '@/lib/supabase-errors';
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
    return m ? [{ id: m.id, emoji: m.emoji, title: m.title }] : [];
  });
  // Seçili harita silindiyse ya da hiç seçilmediyse ilk haritaya düş (lig "Tümü" olamaz)
  const active = maps.find((m) => m.id === selected)?.id ?? maps[0]?.id ?? null;

  const { rows, status, retry } = useLeague(active);
  const mapsLoading = mapsStatus === 'loading';
  const leagueLoading = mapsLoading || (active !== null && status === 'loading');

  if (mapsStatus === 'error' && maps.length === 0) {
    return (
      <View style={styles.list}>
        <Banner tone="warning">{ERROR_TEXT.mapsLoadFailed}</Banner>
        <Button variant="secondary" icon="🔄" label="Tekrar dene" onPress={retryMaps} />
      </View>
    );
  }

  if (mapsStatus === 'ready' && maps.length === 0) {
    return <Banner tone="info">Lige katılmak için önce bir yol haritası seç. Sıralama aynı haritayı takip edenler arasındadır.</Banner>;
  }

  return (
    <View style={styles.list}>
      {mapsLoading ? (
        <Skeleton height={MinTouch} radius={Radius.pill} />
      ) : (
        active && (
          <FilterChipRow
            role="radio"
            label="Harita"
            options={maps.map((m) => ({ id: m.id, label: m.title, icon: m.emoji }))}
            value={active}
            onChange={setSelected}
          />
        )
      )}

      {/* Hafta bitimi + puanın ne olduğu. Dar ekranda (320 px) kırpılmasın diye gerekirse alt satıra iner. */}
      <IconLabel emoji="⏳" type="small" themeColor="textSecondary">
        {`${weekEndText()} · Puan: bu haftaki XP`}
      </IconLabel>

      {leagueLoading && rows.length === 0 && (
        <View style={styles.list}>
          {[0, 1, 2, 3].map((i) => (
            <Skeleton key={i} height={56} radius={Radius.lg} />
          ))}
        </View>
      )}

      {!leagueLoading && status === 'error' && (
        <>
          <Banner tone="warning">{ERROR_TEXT.leagueLoadFailed}</Banner>
          <Button variant="secondary" icon="🔄" label="Tekrar dene" onPress={retry} />
        </>
      )}

      {!leagueLoading && status === 'ready' && rows.length === 0 && (
        <View style={styles.empty}>
          <IconTile emoji="🏆" tone="marker" size={64} />
          <ThemedText themeColor="textSecondary" style={styles.center}>
            Bu haritada bu hafta henüz kimse puan kazanmadı. İlk sen ol!
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
      style={row.is_me ? { backgroundColor: theme.accentSoft } : undefined}>
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
          <ThemedText type="smallBold" themeColor={row.is_me ? 'accentInk' : 'text'}>
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
