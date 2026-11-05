import { useState } from 'react';
import { StyleSheet, TextInput, View } from 'react-native';

import { Glyph } from '@/components/icon';
import { ListGroup, ListRow } from '@/components/list-row';
import { Segmented } from '@/components/segmented';
import { ThemedText } from '@/components/themed-text';
import { countTopics, DEV_ROADMAPS, KIND_LABEL, type RoadmapKind } from '@/constants/dev-roadmaps';
import { Fonts, Radius, Spacing } from '@/constants/theme';
import { useTheme } from '@/hooks/use-theme';
import { searchRoadmaps } from '@/lib/search-roadmaps';

// Harita kataloğu: arama alanı + (aramada) sonuç listesi ya da (aramasız) Roller / Beceriler sekmeleri.
// Onboarding ("Harita ekle") ve misafirin Keşfet sekmesi AYNI kataloğu kullansın diye ayrı bileşen.
// Seçince ne olacağını ekran bilir: onSelect(mapId).
export function RoadmapCatalog({ onSelect }: { onSelect: (mapId: string) => void }) {
  const theme = useTheme();
  const [query, setQuery] = useState('');
  const [kind, setKind] = useState<RoadmapKind>('role');
  const hits = searchRoadmaps(DEV_ROADMAPS, query);
  const searching = query.trim().length > 0;

  const roleCount = DEV_ROADMAPS.filter((m) => m.kind === 'role').length;
  const skillCount = DEV_ROADMAPS.length - roleCount;

  return (
    <View style={styles.root}>
      {/* Arama: harita adında, açıklamasında ve konu başlıklarında. Zemin dolgulu, büyüteç solda;
          etiket ve ipucu satırı yok (yer tutucu yeter). */}
      <View style={[styles.search, { backgroundColor: theme.backgroundElement }]}>
        <Glyph emoji="🔍" size={18} color={theme.textSecondary} />
        <TextInput
          value={query}
          onChangeText={setQuery}
          placeholder="Harita ya da konu ara"
          placeholderTextColor={theme.textSecondary}
          accessibilityLabel="Harita ya da konu ara"
          autoCapitalize="none"
          autoCorrect={false}
          returnKeyType="search"
          style={[styles.input, { color: theme.text }]}
        />
      </View>

      {/* Arama sonuçları: tek liste; eşleşme bir konudaysa hangi konu olduğu yazılır. */}
      {searching && (
        <View accessibilityLiveRegion="polite">
          {hits.length === 0 ? (
            <ThemedText themeColor="textSecondary">Sonuç bulunamadı. Daha kısa ya da farklı bir kelime dene.</ThemedText>
          ) : (
            <ListGroup>
              {hits.map(({ map: m, topicTitle }) => (
                <ListRow
                  key={m.id}
                  dot={m.hue}
                  title={m.title}
                  subtitle={topicTitle ? `${KIND_LABEL[m.kind]} · Konu: ${topicTitle}` : m.tagline}
                  subtitleLines={1}
                  subtitleEllipsize="tail"
                  right={<TopicCount count={countTopics(m).total} />}
                  onPress={() => onSelect(m.id)}
                />
              ))}
            </ListGroup>
          )}
        </View>
      )}

      {/* Aramasız: altı çizili Roller / Beceriler sekmesi */}
      {!searching && (
        <>
          <Segmented
            fill={false}
            fullRule
            label="Harita türü"
            value={kind}
            onChange={setKind}
            options={[
              { id: 'role', label: `Roller · ${roleCount}` },
              { id: 'skill', label: `Beceriler · ${skillCount}` },
            ]}
          />
          <ListGroup>
            {DEV_ROADMAPS.filter((m) => m.kind === kind).map((m) => (
              <ListRow
                key={m.id}
                dot={m.hue}
                title={m.title}
                subtitle={m.tagline}
                subtitleLines={1}
                subtitleEllipsize="tail"
                right={<TopicCount count={countTopics(m).total} />}
                onPress={() => onSelect(m.id)}
              />
            ))}
          </ListGroup>
        </>
      )}
    </View>
  );
}

// Sağdaki "43 konu" sayısı: küçük, ikincil renk
function TopicCount({ count }: { count: number }) {
  return (
    <ThemedText type="small" themeColor="textSecondary" style={styles.count}>
      {`${count} konu`}
    </ThemedText>
  );
}

const styles = StyleSheet.create({
  root: { gap: Spacing.three },
  search: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: Spacing.two,
    minHeight: 48,
    paddingHorizontal: 14,
    borderRadius: Radius.md,
  },
  input: { flex: 1, minWidth: 0, fontFamily: Fonts.sans, fontSize: 16, paddingVertical: Spacing.two },
  count: { flexShrink: 0 },
});
