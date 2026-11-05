import { useState } from 'react';
import { StyleSheet, View } from 'react-native';

import { FilterChipRow } from '@/components/filter-chips';
import { ListGroup } from '@/components/list-row';
import { Banner } from '@/components/banner';
import { Button } from '@/components/button';
import { NewsCard } from '@/components/news-card';
import { ScreenHeader } from '@/components/screen-header';
import { Skeleton } from '@/components/skeleton';
import { TabScreen } from '@/components/tab-screen';
import { ThemedText } from '@/components/themed-text';
import { getRoadmap } from '@/constants/dev-roadmaps';
import { MinTouch, Radius, Spacing } from '@/constants/theme';
import { useLatestRoadmap } from '@/hooks/use-latest-roadmap';
import { useNews } from '@/hooks/use-news';
import { ERROR_TEXT } from '@/lib/supabase-errors';

// Gelişmeler: kullanıcının haritalarına bağlı haber akışı (başlık + kısa özet + kaynağa link).
export default function NewsScreen() {
  const { roadmaps, status: mapsStatus } = useLatestRoadmap();
  // null = "Tümü"; yoksa seçili haritanın id'si
  const [selected, setSelected] = useState<string | null>(null);

  // Kullanıcının haritaları: çip ve etiketler için emoji + başlık
  const maps = roadmaps.flatMap((r) => {
    const m = getRoadmap(r.topic_path);
    return m ? [{ id: m.id, emoji: m.emoji, hue: m.hue, title: m.title }] : [];
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
      <ScreenHeader title="Gelişmeler" />

      {mapsStatus === 'error' && <Banner tone="warning">{ERROR_TEXT.mapsLoadFailed}</Banner>}
      {mapsStatus === 'ready' && maps.length === 0 && (
        <Banner tone="info">Bir yol haritası seçince haberler sana göre süzülür.</Banner>
      )}

      {mapsLoading ? (
        <Skeleton height={MinTouch} radius={Radius.sm} />
      ) : (
        maps.length > 0 && (
          <FilterChipRow
            variant="tabs"
            label="Harita süzgeci"
            options={[
              { id: ALL, label: 'Tümü', accessibilityLabel: 'Tüm haberler' },
              ...maps.map((m) => ({ id: m.id, label: m.title, dot: m.hue })),
            ]}
            value={active ?? ALL}
            onChange={(id) => setSelected(id === ALL ? null : id)}
          />
        )
      )}

      {newsLoading && items.length === 0 && (
        <ListGroup>
          {[0, 1, 2].map((i) => (
            // Gerçek satıra benzer iskelet: meta, başlık ve özet satırları
            <View key={i} style={styles.skeletonRow}>
              <Skeleton width="40%" height={12} />
              <Skeleton height={18} />
              <Skeleton width="70%" height={14} />
            </View>
          ))}
        </ListGroup>
      )}

      {!newsLoading && status === 'error' && items.length === 0 && (
        <View style={styles.list}>
          <Banner tone="warning">{ERROR_TEXT.newsLoadFailed}</Banner>
          <Button variant="secondary" icon="🔄" label="Tekrar dene" onPress={retry} />
        </View>
      )}

      {!newsLoading && status === 'ready' && items.length === 0 && (
        <View style={styles.empty}>
          <ThemedText type="cardTitle" accessibilityRole="header">
            Henüz haber yok
          </ThemedText>
          <ThemedText themeColor="textSecondary" style={styles.center}>
            Biraz sonra tekrar bak.
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
          <ListGroup>
            {items.map((item) => (
              <NewsCard
                key={item.id}
                item={item}
                // Belirli bir harita seçiliyken etiket zaten belli: tekrarlamayız
                tags={active ? [] : maps.filter((m) => item.topic_paths.includes(m.id))}
              />
            ))}
          </ListGroup>
          {/* Bilgilendirme yükümlülüğü: çeviri notu listenin en altında tek küçük satır olarak kalır */}
          <ThemedText type="small" themeColor="textSecondary" style={styles.center}>
            Çeviri yapay zekâyla yapılır.
          </ThemedText>
        </View>
      )}
    </TabScreen>
  );
}

// "Tümü" çipinin kimliği (harita kimlikleriyle çakışmaz)
const ALL = '__all__';

const styles = StyleSheet.create({
  list: { gap: Spacing.three },
  skeletonRow: { gap: Spacing.two, paddingVertical: Spacing.three },
  empty: { alignItems: 'center', gap: Spacing.two, paddingVertical: Spacing.five },
  center: { textAlign: 'center' },
});
