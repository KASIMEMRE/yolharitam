import { Pressable, StyleSheet, Text, View } from 'react-native';

import { ThemedText } from '@/components/themed-text';
import type { DevRoadmap, Topic } from '@/constants/dev-roadmaps';
import type { Personalization, TopicStatus } from '@/constants/dev-roadmaps/personalize';
import { Border, MinTouch, Radius, Spacing } from '@/constants/theme';
import { HUES, MARKER_STYLE, STATUS_STYLE } from '@/constants/visuals';
import { useTheme } from '@/hooks/use-theme';

// GÖRSEL HARİTA: roadmap.sh'teki ağacın telefona uyarlanmış hali.
// Ortada dikey bir omurga (yol), üstünde bölüm kutuları; konular omurganın iki yanına sırayla
// dizilir ve kısa bir çizgiyle omurgaya bağlanır. Çizim için SVG gerekmez: hepsi düz View.
//
// Görsel dil:
//   önerilen konu = kalın koyu kenarlık · isteğe bağlı = ince açık kenarlık · alternatif = kesik çizgi
//   bitti = yeşil zemin · çalışıyorum = sarı zemin · atladım = soluk + üstü çizili · ✨ = senin için öncelikli

const SPINE = 4; // omurga kalınlığı
const RAIL = 28; // omurganın kapladığı orta sütun genişliği

type Props = {
  map: DevRoadmap;
  statuses: ReadonlyMap<string, TopicStatus>;
  personalization: Personalization;
  nextId: string | undefined;
  onOpenTopic: (id: string) => void;
};

export function RoadmapTree({ map, statuses, personalization, nextId, onOpenTopic }: Props) {
  const theme = useTheme();
  const hue = HUES[map.hue];
  let side = 0; // konuları sırayla sola/sağa dağıtmak için sayaç (bölümler arasında da sürer)

  return (
    <View accessibilityRole="list">
      {map.sections.map((section, sIndex) => {
        const done = section.topics.filter((t) => statuses.get(t.id) === 'done').length;
        return (
          <View key={section.id}>
            {/* Bölüm kutusu: omurganın tam ortasında */}
            <View style={styles.sectionRow}>
              <View style={[styles.spineFill, { backgroundColor: sIndex === 0 ? 'transparent' : theme.borderStrong }]} />
              <View
                accessible
                accessibilityRole="header"
                accessibilityLabel={`Bölüm ${sIndex + 1}: ${section.title}. ${section.topics.length} konunun ${done} tanesi bitti.`}
                style={[
                  styles.sectionBox,
                  { backgroundColor: theme.markerSoft, borderColor: theme.markerEdge, borderBottomColor: theme.markerEdge },
                ]}>
                <Text allowFontScaling={false} style={styles.sectionEmoji}>
                  {section.emoji}
                </Text>
                <ThemedText type="smallBold" themeColor="markerInk" style={styles.sectionTitle}>
                  {section.title}
                </ThemedText>
                <ThemedText type="small" themeColor="markerInk">
                  {done}/{section.topics.length}
                </ThemedText>
              </View>
            </View>

            {/* AI notu (varsa) bölümün hemen altında, omurganın üstüne binmeden */}
            {personalization.notes[section.id] && (
              <View style={styles.noteRow}>
                <View style={[styles.spineLine, { backgroundColor: theme.borderStrong }]} />
                <View style={[styles.note, { backgroundColor: theme.card, borderColor: theme[hue.line] }]}>
                  <ThemedText type="small" themeColor={hue.ink}>
                    ✨ {personalization.notes[section.id]}
                  </ThemedText>
                </View>
              </View>
            )}

            {section.topics.map((topic) => {
              const left = side++ % 2 === 0;
              return (
                <TopicNode
                  key={topic.id}
                  topic={topic}
                  left={left}
                  status={statuses.get(topic.id)}
                  focus={personalization.focus.includes(topic.id)}
                  skipHint={personalization.skip.includes(topic.id)}
                  isNext={topic.id === nextId}
                  onPress={() => onOpenTopic(topic.id)}
                />
              );
            })}
          </View>
        );
      })}

      {/* Yolun sonu: bayrak */}
      <View style={styles.sectionRow}>
        <View style={[styles.spineFill, { backgroundColor: theme.borderStrong }]} />
        <View style={[styles.finish, { backgroundColor: theme.accentSoft, borderColor: theme.accent }]}>
          <Text allowFontScaling={false} style={styles.sectionEmoji}>
            🏁
          </Text>
        </View>
      </View>
    </View>
  );
}

function TopicNode({
  topic,
  left,
  status,
  focus,
  skipHint,
  isNext,
  onPress,
}: {
  topic: Topic;
  left: boolean;
  status: TopicStatus | undefined;
  focus: boolean;
  skipHint: boolean;
  isNext: boolean;
  onPress: () => void;
}) {
  const theme = useTheme();

  // Zemin ve kenarlık durumdan; kenarlık stili haritadaki işaretten gelir
  const bg =
    status === 'done' ? theme.accentSoft : status === 'in_progress' ? theme.markerSoft : theme.card;
  // İsteğe bağlı konular ince ve açık kenarlıkla geri planda durur; önerilenler kalın ve koyu
  const border = isNext
    ? theme.accent
    : status === 'done'
      ? theme.accent
      : status === 'in_progress'
        ? theme.markerEdge
        : topic.marker === 'optional'
          ? theme.border
          : theme.borderStrong;
  const faded = status === 'skipped' || (!status && skipHint);
  const label = [
    topic.title,
    MARKER_STYLE[topic.marker].label,
    status ? STATUS_STYLE[status].label : 'Başlanmadı',
    focus && !status ? 'Senin için öncelikli' : '',
    skipHint && !status ? 'Biliyorsan atlayabilirsin' : '',
  ]
    .filter(Boolean)
    .join('. ');

  const box = (
    <Pressable
      onPress={onPress}
      accessibilityRole="button"
      accessibilityLabel={`${label}. Ayrıntılar için dokun.`}
      style={({ pressed }) => [
        styles.node,
        {
          backgroundColor: bg,
          borderColor: border,
          borderStyle: topic.marker === 'alt' ? 'dashed' : 'solid',
          borderWidth: isNext ? Border.chunky : topic.marker === 'optional' && !status ? Border.thin : Border.thick,
          opacity: faded ? 0.55 : 1,
        },
        pressed && { transform: [{ scale: 0.97 }] },
      ]}>
      <View style={styles.nodeTop}>
        {status && (
          <Text allowFontScaling={false} style={styles.nodeIcon}>
            {status === 'done' ? '✅' : status === 'in_progress' ? '⏳' : '⏭️'}
          </Text>
        )}
        {!status && focus && (
          <Text allowFontScaling={false} style={styles.nodeIcon}>
            ✨
          </Text>
        )}
        <ThemedText
          type="smallBold"
          numberOfLines={3}
          style={[styles.nodeTitle, status === 'skipped' && styles.strike]}>
          {topic.title}
        </ThemedText>
      </View>
      {topic.marker !== 'core' && (
        <ThemedText type="small" themeColor="textSecondary" numberOfLines={1}>
          {MARKER_STYLE[topic.marker].label}
        </ThemedText>
      )}
    </Pressable>
  );

  return (
    <View style={styles.topicRow}>
      <View style={[styles.half, styles.halfLeft]}>
        {left && box}
        {left && <View style={[styles.connector, { backgroundColor: theme.borderStrong }]} />}
      </View>
      <View style={styles.rail}>
        <View style={[styles.spineLine, { backgroundColor: theme.borderStrong }]} />
        <View
          style={[
            styles.dot,
            {
              backgroundColor: status === 'done' ? theme.accent : theme.card,
              borderColor: status === 'done' ? theme.accentEdge : theme.borderStrong,
            },
          ]}
        />
      </View>
      <View style={[styles.half, styles.halfRight]}>
        {!left && <View style={[styles.connector, { backgroundColor: theme.borderStrong }]} />}
        {!left && box}
      </View>
    </View>
  );
}

// Kısa açıklama kutusu: görsel dilin anahtarı (lejant)
export function TreeLegend() {
  const theme = useTheme();
  const items: { label: string; style: object }[] = [
    { label: 'Önerilen', style: { borderWidth: Border.thick, borderColor: theme.borderStrong } },
    { label: 'İsteğe bağlı', style: { borderWidth: Border.thin, borderColor: theme.border } },
    { label: 'Alternatif', style: { borderWidth: Border.thick, borderColor: theme.borderStrong, borderStyle: 'dashed' } },
    { label: 'Bitti', style: { borderWidth: Border.thick, borderColor: theme.accent, backgroundColor: theme.accentSoft } },
    { label: 'Çalışıyorum', style: { borderWidth: Border.thick, borderColor: theme.markerEdge, backgroundColor: theme.markerSoft } },
  ];
  return (
    <View style={styles.legend} accessibilityLabel="Harita açıklaması: kalın kenarlık önerilen, ince isteğe bağlı, kesik çizgi alternatif; yeşil bitti, sarı çalışıyorum.">
      {items.map((i) => (
        <View key={i.label} style={styles.legendItem}>
          <View style={[styles.legendSwatch, i.style]} />
          <ThemedText type="small" themeColor="textSecondary">
            {i.label}
          </ThemedText>
        </View>
      ))}
      <View style={styles.legendItem}>
        <Text allowFontScaling={false}>✨</Text>
        <ThemedText type="small" themeColor="textSecondary">
          Senin için öncelikli
        </ThemedText>
      </View>
    </View>
  );
}

const styles = StyleSheet.create({
  sectionRow: { alignItems: 'center', paddingVertical: Spacing.two },
  // Bölüm kutusunun arkasından geçen omurga (kutunun üst yarısına kadar)
  spineFill: { position: 'absolute', top: 0, bottom: 0, width: SPINE, left: '50%', marginLeft: -SPINE / 2 },
  sectionBox: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: Spacing.two,
    paddingVertical: Spacing.two,
    paddingHorizontal: Spacing.three,
    borderRadius: Radius.md,
    borderWidth: Border.thick,
    borderBottomWidth: Border.thick + 2,
    maxWidth: '90%',
  },
  sectionEmoji: { fontSize: 20, lineHeight: 26 },
  sectionTitle: { flexShrink: 1 },
  noteRow: { alignItems: 'center', paddingBottom: Spacing.two },
  note: { maxWidth: '90%', padding: Spacing.two, borderRadius: Radius.sm, borderWidth: Border.thin },
  topicRow: { flexDirection: 'row', alignItems: 'stretch' },
  half: { flex: 1, minWidth: 0, flexDirection: 'row', alignItems: 'center', paddingVertical: Spacing.one },
  halfLeft: { justifyContent: 'flex-end' },
  halfRight: { justifyContent: 'flex-start' },
  rail: { width: RAIL, alignItems: 'center', justifyContent: 'center' },
  spineLine: { position: 'absolute', top: 0, bottom: 0, width: SPINE, left: '50%', marginLeft: -SPINE / 2 },
  dot: { width: 14, height: 14, borderRadius: 7, borderWidth: Border.thick },
  connector: { width: Spacing.two, height: 3 },
  node: {
    flex: 1,
    minWidth: 0,
    minHeight: MinTouch + 8,
    justifyContent: 'center',
    gap: Spacing.half,
    paddingVertical: Spacing.two,
    paddingHorizontal: Spacing.two,
    borderRadius: Radius.sm,
  },
  nodeTop: { flexDirection: 'row', alignItems: 'flex-start', gap: Spacing.one },
  nodeIcon: { fontSize: 13, lineHeight: 18 },
  nodeTitle: { flexShrink: 1 },
  strike: { textDecorationLine: 'line-through' },
  finish: {
    width: 48,
    height: 48,
    borderRadius: 24,
    borderWidth: Border.thick,
    alignItems: 'center',
    justifyContent: 'center',
  },
  legend: { flexDirection: 'row', flexWrap: 'wrap', gap: Spacing.three, rowGap: Spacing.two },
  legendItem: { flexDirection: 'row', alignItems: 'center', gap: Spacing.one },
  legendSwatch: { width: 18, height: 12, borderRadius: 3 },
});
