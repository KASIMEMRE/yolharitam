import { useState } from 'react';
import { StyleSheet, View } from 'react-native';

import { OptionCard } from '@/components/option-card';
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

      {/* Arama sonuçları: tek liste; eşleşme bir konudaysa hangi konu olduğu yazılır */}
      {searching && (
        <View style={styles.list}>
          {hits.length === 0 && (
            <ThemedText themeColor="textSecondary">Sonuç bulunamadı. Daha kısa ya da farklı bir kelime dene.</ThemedText>
          )}
          {hits.map(({ map: m, topicTitle }, index) => (
            <OptionCard
              key={m.id}
              title={m.title}
              description={topicTitle ? `${KIND_LABEL[m.kind]} · Konu: ${topicTitle}` : `${m.tagline} · ${countTopics(m).total} konu`}
              icon={m.emoji}
              hue={m.hue}
              variant="list"
              trailing="chevron"
              hint="Bu yol haritasını seçmek için dokun"
              index={index}
              onPress={() => onSelect(m.id)}
            />
          ))}
        </View>
      )}

      {/* Harita listesi: önce roller, sonra beceriler (roadmap.sh'teki ayrım) */}
      {!searching &&
        (['role', 'skill'] as const).map((kind) => (
          <View key={kind} style={styles.list}>
            <View style={styles.groupHead}>
              <ThemedText type="cardTitle" accessibilityRole="header">
                {KIND_LABEL[kind].replace('yol haritası', 'yol haritaları')}
              </ThemedText>
              <ThemedText type="small" themeColor="textSecondary">
                {kind === 'role'
                  ? 'Bir meslek için baştan sona izlenecek yol.'
                  : 'Tek bir dil ya da araçta ustalaşmak için.'}
              </ThemedText>
            </View>
            {DEV_ROADMAPS.filter((m) => m.kind === kind).map((m, index) => (
              <OptionCard
                key={m.id}
                title={m.title}
                description={`${m.tagline} · ${countTopics(m).total} konu`}
                icon={m.emoji}
                hue={m.hue}
                variant="list"
                trailing="chevron"
                hint="Bu yol haritasını seçmek için dokun"
                index={index}
                onPress={() => onSelect(m.id)}
              />
            ))}
          </View>
        ))}
    </View>
  );
}

const styles = StyleSheet.create({
  root: { gap: Spacing.three },
  groupHead: { gap: Spacing.one, marginTop: Spacing.two },
  list: { gap: Spacing.three },
});
