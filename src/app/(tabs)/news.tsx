import { useState } from 'react';
import { Pressable, ScrollView, StyleSheet, View } from 'react-native';

import { IconTile } from '@/components/icon-tile';
import { Glyph } from '@/components/icon';
import { Banner } from '@/components/banner';
import { Button } from '@/components/button';
import { NewsCard } from '@/components/news-card';
import { ScreenHeader } from '@/components/screen-header';
import { Skeleton } from '@/components/skeleton';
import { TabScreen } from '@/components/tab-screen';
import { ThemedText } from '@/components/themed-text';
import { getRoadmap } from '@/constants/dev-roadmaps';
import { Border, Edge, MinTouch, Radius, Spacing } from '@/constants/theme';
import { useLatestRoadmap } from '@/hooks/use-latest-roadmap';
import { useNews } from '@/hooks/use-news';
import { useTheme } from '@/hooks/use-theme';
import { ERROR_TEXT } from '@/lib/supabase-errors';

// Gelişmeler: kullanıcının haritalarına bağlı haber akışı (başlık + kısa özet + kaynağa link).
export default function NewsScreen() {
  const theme = useTheme();
  const { roadmaps, status: mapsStatus } = useLatestRoadmap();
  // null = "Tümü"; yoksa seçili haritanın id'si
  const [selected, setSelected] = useState<string | null>(null);

  // Kullanıcının haritaları: çip ve etiketler için emoji + başlık
  const maps = roadmaps.flatMap((r) => {
    const m = getRoadmap(r.topic_path);
    return m ? [{ id: m.id, emoji: m.emoji, title: m.title }] : [];
  });
  const mapIds = maps.map((m) => m.id);
  // Seçili harita artık listede yoksa (silindi) "Tümü"ne düş
  const active = selected && mapIds.includes(selected) ? selected : null;
  const filter = active ? [active] : mapIds; // boşsa tüm haberler gelir

  // Haritalar yüklenirken filtre belli değil: haber sorgusu bekler (yoksa önce filtresiz liste, sonra süzülmüş liste zıplardı)
  const mapsLoading = mapsStatus === 'loading';
  const { items, status, refreshing, refresh, retry } = useNews(filter, !mapsLoading);
  const newsLoading = mapsLoading || status === 'loading';

  return (
    <TabScreen onRefresh={refresh} refreshing={refreshing}>
      <ScreenHeader title="Gelişmeler" emoji="📰" hue="sky" />

      {mapsStatus === 'error' && <Banner tone="warning">{ERROR_TEXT.mapsLoadFailed}</Banner>}
      {mapsStatus === 'ready' && maps.length === 0 && (
        <Banner tone="info">Bir yol haritası seçince haberler sana göre süzülür.</Banner>
      )}

      {mapsLoading ? (
        <Skeleton height={MinTouch} radius={Radius.pill} />
      ) : (
        maps.length > 0 && (
          <ScrollView
            horizontal
            showsHorizontalScrollIndicator={false}
            accessibilityRole="tablist"
            style={styles.chipScroll}
            contentContainerStyle={styles.chips}>
            <FilterChip label="Tümü" a11yLabel="Tüm haberler" selected={active === null} onPress={() => setSelected(null)} />
            {maps.map((m) => (
              <FilterChip
                key={m.id}
                label={m.title}
                icon={m.emoji}
                a11yLabel={m.title}
                selected={active === m.id}
                onPress={() => setSelected(m.id)}
              />
            ))}
          </ScrollView>
        )
      )}

      {newsLoading && items.length === 0 && (
        <View style={styles.list}>
          {[0, 1, 2].map((i) => (
            // Gerçek karta benzer iskelet: aynı kenarlık, alt kenar ve özet satırları
            <View
              key={i}
              style={[styles.skeletonCard, { backgroundColor: theme.card, borderColor: theme.border, borderBottomColor: theme.borderEdge }]}>
              <Skeleton width="40%" height={12} />
              <Skeleton height={18} />
              <Skeleton height={14} />
              <Skeleton width="70%" height={14} />
            </View>
          ))}
        </View>
      )}

      {!newsLoading && status === 'error' && items.length === 0 && (
        <View style={styles.list}>
          <Banner tone="warning">{ERROR_TEXT.newsLoadFailed}</Banner>
          <Button variant="secondary" icon="🔄" label="Tekrar dene" onPress={retry} />
        </View>
      )}

      {!newsLoading && status === 'ready' && items.length === 0 && (
        <View style={styles.empty}>
          <IconTile emoji="📰" tone="sky" size={64} />
          <ThemedText type="cardTitle" accessibilityRole="header">
            Henüz haber yok
          </ThemedText>
          <ThemedText themeColor="textSecondary" style={styles.center}>
            Bu konuda henüz haber yok. Biraz sonra tekrar bak.
          </ThemedText>
          {active && <Button variant="secondary" label="Tümünü göster" onPress={() => setSelected(null)} />}
        </View>
      )}

      {items.length > 0 && (
        <View style={styles.list}>
          {/* Yenileme başarısız olduysa eski liste kalır, ama kullanıcıya haber veririz */}
          {status === 'error' && (
            <>
              <Banner tone="warning">{ERROR_TEXT.newsLoadFailed}</Banner>
              <Button variant="secondary" icon="🔄" label="Tekrar dene" onPress={retry} />
            </>
          )}
          {items.map((item) => (
            <NewsCard
              key={item.id}
              item={item}
              // Belirli bir harita seçiliyken etiket zaten belli: tekrarlamayız
              tags={active ? [] : maps.filter((m) => item.topic_paths.includes(m.id))}
            />
          ))}
          <View style={styles.notes}>
            <ThemedText type="small" themeColor="textSecondary" style={styles.center}>
              Başlık ve kısa özet kaynaklardan alınır; haberin tamamı kaynağın sitesindedir.
            </ThemedText>
            <ThemedText type="small" themeColor="textSecondary" style={styles.center}>
              Başlık ve özetler yapay zekâyla Türkçeye çevrilir; ayrıntı ve orijinal metin kaynağın sitesindedir.
            </ThemedText>
          </View>
        </View>
      )}
    </TabScreen>
  );
}

function FilterChip({
  label,
  icon,
  a11yLabel,
  selected,
  onPress,
}: {
  label: string;
  icon?: string; // simge (emoji adıyla)
  a11yLabel: string; // ekran okuyucu için
  selected: boolean;
  onPress: () => void;
}) {
  const theme = useTheme();
  return (
    <Pressable
      onPress={onPress}
      accessibilityRole="tab"
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
      {icon && <Glyph emoji={icon} size={14} color={selected ? theme.accentInk : theme.textSecondary} strokeWidth={2.25} />}
      <ThemedText type="chip" themeColor={selected ? 'accentInk' : 'text'} maxFontSizeMultiplier={1.3}>
        {label}
      </ThemedText>
    </Pressable>
  );
}

const styles = StyleSheet.create({
  // Yatay kaydırma: çok haritası olan kullanıcıda çipler alt satırlara yığılmaz
  chipScroll: { flexGrow: 0 },
  chips: { gap: Spacing.two, paddingRight: Spacing.three },
  chip: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 6,
    minHeight: MinTouch,
    justifyContent: 'center',
    paddingHorizontal: Spacing.three,
    borderRadius: Radius.pill,
    borderWidth: Border.thick,
  },
  list: { gap: Spacing.three },
  skeletonCard: {
    gap: Spacing.two,
    padding: Spacing.three,
    borderRadius: Radius.lg,
    borderWidth: Border.thick,
    borderBottomWidth: Edge,
  },
  empty: { alignItems: 'center', gap: Spacing.two, paddingVertical: Spacing.five },
  center: { textAlign: 'center' },
  notes: { gap: Spacing.one, paddingTop: Spacing.two },
});
