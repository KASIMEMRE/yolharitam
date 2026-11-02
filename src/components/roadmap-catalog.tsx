import { useState } from 'react';
import { StyleSheet, View } from 'react-native';

import { ListGroup, ListRow } from '@/components/list-row';
import { SectionHeader } from '@/components/section-header';
import { TextField } from '@/components/text-field';
import { ThemedText } from '@/components/themed-text';
import { countTopics, DEV_ROADMAPS, KIND_LABEL } from '@/constants/dev-roadmaps';
import { Spacing } from '@/constants/theme';
import { searchRoadmaps } from '@/lib/search-roadmaps';

// Harita kataloğu: arama kutusu + (aramada) sonuç listesi ya da (aramasız) rol/beceri grupları.
// Onboarding ("Harita ekle") ve misafirin Keşfet sekmesi AYNI kataloğu kullansın diye ayrı bileşen.
// Seçince ne olacağını ekran bilir: onSelect(mapId).
export function RoadmapCatalog({ onSelect }: { onSelect: (mapId: string) => void }) {
  const [query, setQuery] = useState('');
  const hits = searchRoadmaps(DEV_ROADMAPS, query);
  const searching = query.trim().length > 0;

  return (
    <View style={styles.root}>
      {/* Arama: harita adında, açıklamasında ve konu başlıklarında (32 harita olunca liste uzun) */}
      <TextField
        label="Ara"
        placeholder="Örn. Kubernetes, React, veri, oyun"
        value={query}
        onChangeText={setQuery}
        autoCapitalize="none"
        autoCorrect={false}
        returnKeyType="search"
        hint={searching ? `${hits.length} harita bulundu` : 'Harita ya da konu adı yazabilirsin'}
      />

      {/* Arama sonuçları: tek liste; eşleşme bir konudaysa hangi konu olduğu yazılır.
          Tekrar eden öğeler kart yığını değil tek ListGroup içinde satırlardır (sadelik ilkesi 3). */}
      {searching && (
        <View style={styles.list}>
          {hits.length === 0 && (
            <ThemedText themeColor="textSecondary">Sonuç bulunamadı. Daha kısa ya da farklı bir kelime dene.</ThemedText>
          )}
          {hits.length > 0 && (
            <ListGroup>
              {hits.map(({ map: m, topicTitle }) => (
                <ListRow
                  key={m.id}
                  icon={m.emoji}
                  iconTile={m.hue}
                  title={m.title}
                  subtitle={topicTitle ? `${KIND_LABEL[m.kind]} · Konu: ${topicTitle}` : `${m.tagline} · ${countTopics(m).total} konu`}
                  chevron
                  onPress={() => onSelect(m.id)}
                />
              ))}
            </ListGroup>
          )}
        </View>
      )}

      {/* Harita listesi: önce roller, sonra beceriler (roadmap.sh'teki ayrım). Her grup tek ListGroup. */}
      {!searching &&
        (['role', 'skill'] as const).map((kind) => (
          <View key={kind} style={styles.list}>
            <View style={styles.groupHead}>
              <SectionHeader
                title={KIND_LABEL[kind].replace('yol haritası', 'yol haritaları')}
                subtitle={
                  kind === 'role'
                    ? 'Bir meslek için baştan sona izlenecek yol.'
                    : 'Tek bir dil ya da araçta ustalaşmak için.'
                }
              />
            </View>
            <ListGroup>
              {DEV_ROADMAPS.filter((m) => m.kind === kind).map((m) => (
                <ListRow
                  key={m.id}
                  icon={m.emoji}
                  iconTile={m.hue}
                  title={m.title}
                  subtitle={`${m.tagline} · ${countTopics(m).total} konu`}
                  chevron
                  onPress={() => onSelect(m.id)}
                />
              ))}
            </ListGroup>
          </View>
        ))}
    </View>
  );
}

const styles = StyleSheet.create({
  root: { gap: Spacing.three },
  groupHead: { marginTop: Spacing.two },
  list: { gap: Spacing.three },
});
