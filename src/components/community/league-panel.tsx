import { useState } from 'react';
import { Pressable, ScrollView, StyleSheet, Text, View } from 'react-native';

import { Banner } from '@/components/banner';
import { Button } from '@/components/button';
import { Skeleton } from '@/components/skeleton';
import { ThemedText } from '@/components/themed-text';
import { getRoadmap } from '@/constants/dev-roadmaps';
import { Border, MinTouch, Radius, Spacing } from '@/constants/theme';
import { useLatestRoadmap } from '@/hooks/use-latest-roadmap';
import { useLeague, type LeagueRow } from '@/hooks/use-league';
import { useTheme } from '@/hooks/use-theme';
import { ERROR_TEXT } from '@/lib/supabase-errors';
import { weekEndText } from '@/lib/week';

const MEDALS = ['🥇', '🥈', '🥉'];

// Yatay çip (Gelişmeler'deki kalıpla aynı). Topluluk ekranındaki segment de bunu kullanır.
export function FilterChip({
  label,
  a11yLabel,
  selected,
  onPress,
  role = 'tab',
}: {
  role?: 'tab' | 'radio';
  label: string;
  a11yLabel: string; // emojisiz, ekran okuyucu için
  selected: boolean;
  onPress: () => void;
}) {
  const theme = useTheme();
  return (
    <Pressable
      onPress={onPress}
      accessibilityRole={role}
      accessibilityLabel={a11yLabel}
      accessibilityState={{ selected }}
      style={({ pressed }) => [
        styles.chip,
        {
          backgroundColor: selected ? theme.accentSoft : theme.card,
          borderColor: selected ? theme.accent : theme.border,
          opacity: pressed ? 0.85 : 1,
        },
      ]}>
      <ThemedText type="chip" themeColor={selected ? 'accentInk' : 'text'} maxFontSizeMultiplier={1.3}>
        {label}
      </ThemedText>
    </Pressable>
  );
}

// Haftalık lig: aynı haritayı takip edenler arasında bu haftaki XP sıralaması.
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
        <ScrollView
          horizontal
          showsHorizontalScrollIndicator={false}
          accessibilityRole="radiogroup"
          style={styles.chipScroll}
          contentContainerStyle={styles.chips}>
          {maps.map((m) => (
            <FilterChip
              key={m.id}
              label={`${m.emoji} ${m.title}`}
              a11yLabel={m.title}
              selected={active === m.id}
              role="radio"
              onPress={() => setSelected(m.id)}
            />
          ))}
        </ScrollView>
      )}

      <View style={styles.info}>
        <ThemedText type="smallBold">⏳ {weekEndText()}</ThemedText>
        <ThemedText type="small" themeColor="textSecondary">
          Puan, bu hafta kazandığın toplam XP&apos;dir.
        </ThemedText>
      </View>

      {leagueLoading && rows.length === 0 && (
        <View style={styles.list}>
          {[0, 1, 2, 3].map((i) => (
            <Skeleton key={i} height={64} radius={Radius.lg} />
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
          <Text accessibilityElementsHidden importantForAccessibility="no" allowFontScaling={false} style={styles.emptyEmoji}>
            🏆
          </Text>
          <ThemedText themeColor="textSecondary" style={styles.center}>
            Bu haritada bu hafta henüz kimse puan kazanmadı. İlk sen ol!
          </ThemedText>
        </View>
      )}

      {rows.length > 0 && (
        <View style={styles.rows}>
          {rows.map((row) => (
            <LeagueRowView key={row.user_id} row={row} />
          ))}
        </View>
      )}
    </View>
  );
}

function LeagueRowView({ row }: { row: LeagueRow }) {
  const theme = useTheme();
  const medal = row.rank >= 1 && row.rank <= 3 ? MEDALS[row.rank - 1] : null;
  const title = row.username ? `@${row.username}` : (row.display_name ?? 'Gezgin');
  // Ad ayrıca varsa ikinci satırda göster (kullanıcı adı zaten başlıkta)
  const subtitle = row.username && row.display_name ? row.display_name : null;

  return (
    <View
      accessible
      accessibilityLabel={`${row.rank}. sıra, ${title}${row.is_me ? ', sen' : ''}, ${row.xp} XP`}
      style={[
        styles.row,
        {
          backgroundColor: row.is_me ? theme.accentSoft : theme.card,
          borderColor: row.is_me ? theme.accent : theme.border,
        },
      ]}>
      <View style={styles.rank}>
        {medal ? (
          <Text allowFontScaling={false} style={styles.medal}>
            {medal}
          </Text>
        ) : (
          <ThemedText type="smallBold" themeColor="textSecondary">
            {row.rank}
          </ThemedText>
        )}
      </View>
      <View style={styles.names}>
        <ThemedText type="smallBold" numberOfLines={2}>
          {title}
          {row.is_me ? ' (sen)' : ''}
        </ThemedText>
        {subtitle && (
          <ThemedText type="small" themeColor="textSecondary" numberOfLines={1}>
            {subtitle}
          </ThemedText>
        )}
      </View>
      <ThemedText type="smallBold" themeColor={row.is_me ? 'accentInk' : 'text'}>
        {row.xp} XP
      </ThemedText>
    </View>
  );
}

const styles = StyleSheet.create({
  list: { gap: Spacing.three },
  info: { gap: Spacing.half },
  chipScroll: { flexGrow: 0 },
  chips: { gap: Spacing.two, paddingRight: Spacing.three },
  chip: {
    minHeight: MinTouch,
    justifyContent: 'center',
    paddingHorizontal: Spacing.three,
    borderRadius: Radius.pill,
    borderWidth: Border.thick,
  },
  rows: { gap: Spacing.two },
  row: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: Spacing.three,
    minHeight: 64,
    padding: Spacing.three,
    borderRadius: Radius.lg,
    borderWidth: Border.thick,
  },
  rank: { minWidth: 32, alignItems: 'center' },
  medal: { fontSize: 24, lineHeight: 30 },
  names: { flex: 1, minWidth: 0 },
  empty: { alignItems: 'center', gap: Spacing.two, paddingVertical: Spacing.five },
  emptyEmoji: { fontSize: 40, lineHeight: 48 },
  center: { textAlign: 'center' },
});
