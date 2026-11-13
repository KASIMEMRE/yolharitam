import { Pressable, StyleSheet, View } from 'react-native';

import { Glyph } from '@/components/icon';
import { ThemedText } from '@/components/themed-text';
import type { DevRoadmap, Topic } from '@/constants/dev-roadmaps';
import type { Personalization, TopicStatus } from '@/constants/dev-roadmaps/personalize';
import { Border, MinTouch, Radius, Spacing } from '@/constants/theme';
import { MARKER_STYLE, STATUS_STYLE } from '@/constants/visuals';
import { useTheme } from '@/hooks/use-theme';
import { sectionProgress } from '@/lib/plan-progress';

// GÖRSEL HARİTA: roadmap.sh'teki ağacın telefona uyarlanmış hali.
// Ortada dikey bir omurga (yol), üstünde bölüm kutuları; konular omurganın iki yanına sırayla
// dizilir ve kısa bir çizgiyle omurgaya bağlanır. Çizim için SVG gerekmez: hepsi düz View.
//
// Görsel dil (mürekkep ve mercan, düz düğümler, 1px kenar):
//   önerilen konu = koyu kenarlık · isteğe bağlı = açık kenarlık · alternatif = kesik çizgi
//   bitti = nötr zemin + mürekkep kenar + onay işareti · çalışıyorum = mercan zemin + mercan kenar
//   atladım = soluk + üstü çizili · küçük mercan nokta = senin için öncelikli

const SPINE = 2; // omurga kalınlığı
const RAIL = 28; // omurganın kapladığı orta sütun genişliği

type Props = {
  map: DevRoadmap;
  statuses: ReadonlyMap<string, TopicStatus>;
  personalization: Personalization;
  planIds: ReadonlySet<string>; // plana giren konular: bölüm sayaçları liste görünümüyle aynı çıksın
  nextId: string | undefined;
  onOpenTopic: (id: string) => void;
};

export function RoadmapTree({ map, statuses, personalization, planIds, nextId, onOpenTopic }: Props) {
  const theme = useTheme();
  let side = 0; // konuları sırayla sola/sağa dağıtmak için sayaç (bölümler arasında da sürer)

  return (
    <View accessibilityRole="list">
      {map.sections.map((section, sIndex) => {
        // Liste görünümüyle aynı bölüm sayacı (ortak yardımcı)
        const { done, total } = sectionProgress(section, planIds, statuses);
        const complete = total > 0 && done === total;
        return (
          <View key={section.id}>
            {/* Bölüm kutusu: omurganın tam ortasında */}
            <View style={styles.sectionRow}>
              <View style={[styles.spineFill, { backgroundColor: sIndex === 0 ? 'transparent' : theme.borderStrong }]} />
              <View
                accessible
                accessibilityRole="header"
                accessibilityLabel={`Bölüm ${sIndex + 1}: ${section.title}. ${total} konunun ${done} tanesi bitti.`}
                style={[
                  styles.sectionBox,
                  // Nötr zemin; tamamlanan bölüm daha da sade (zemin yok, yalnız çizgi)
                  { backgroundColor: complete ? theme.background : theme.backgroundElement, borderColor: theme.borderEdge },
                ]}>
                <Glyph
                  emoji={complete ? '✅' : section.emoji}
                  size={18}
                  color={complete ? theme.accent : theme.textSecondary}
                  strokeWidth={2}
                />
                <ThemedText type="smallBold" themeColor={complete ? 'textSecondary' : 'text'} style={styles.sectionTitle}>
                  {section.title}
                </ThemedText>
                <ThemedText type="small" themeColor="textSecondary">
                  {done}/{total}
                </ThemedText>
              </View>
            </View>

            {/* AI notu (varsa) bölümün hemen altında, omurganın üstüne binmeden */}
            {personalization.notes[section.id] && (
              <View style={styles.noteRow}>
                <View style={[styles.spineLine, { backgroundColor: theme.borderStrong }]} />
                <View style={[styles.note, { backgroundColor: theme.card, borderColor: theme.border }]}>
                  <ThemedText type="small" themeColor="textSecondary">
                    {personalization.notes[section.id]}
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
        <View style={[styles.finish, { backgroundColor: theme.backgroundElement, borderColor: theme.borderEdge }]}>
          <Glyph emoji="🏁" size={18} color={theme.textSecondary} strokeWidth={2} />
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
  const done = status === 'done';

  // Zemin ve kenarlık durumdan; kenarlık stili haritadaki işaretten gelir (hepsi düz, 1px)
  const bg = done ? theme.backgroundElement : status === 'in_progress' ? theme.markerSoft : theme.card;
  // İsteğe bağlı konular açık kenarlıkla geri planda durur; önerilenler daha koyu. Sıradaki konu mürekkep kenarlı.
  const border = done
    ? theme.accent
    : status === 'in_progress'
      ? theme.marker
      : isNext
        ? theme.accent
        : topic.marker === 'optional'
          ? theme.borderEdge
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
          borderWidth: isNext && !status ? 1.5 : Border.thin,
          opacity: faded ? 0.55 : pressed ? 0.75 : 1,
        },
      ]}>
      <View style={styles.nodeTop}>
        {done && (
          <View style={styles.nodeIcon}>
            <Glyph emoji="✅" size={14} color={theme.accentInk} strokeWidth={2.5} />
          </View>
        )}
        {/* Senin için öncelikli: küçük mercan nokta */}
        {!status && focus && <View style={[styles.focusDot, { backgroundColor: theme.marker }]} />}
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
              backgroundColor: done ? theme.accent : status === 'in_progress' ? theme.marker : theme.card,
              borderColor: done ? theme.accent : status === 'in_progress' ? theme.marker : theme.borderStrong,
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

// Tek satır küçük açıklama: yalnız metinden anlaşılmayan işaretler (önerilen/isteğe bağlı/alternatif
// zaten düğümde yazıyor)
export function TreeLegend() {
  const theme = useTheme();
  const items: { label: string; swatch: object }[] = [
    { label: 'Bitti', swatch: { backgroundColor: theme.backgroundElement, borderColor: theme.accent } },
    { label: 'Çalışıyorum', swatch: { backgroundColor: theme.markerSoft, borderColor: theme.marker } },
  ];
  return (
    <View style={styles.legend} accessibilityLabel="Harita açıklaması: koyu kenar ve onay işareti bitti, mercan çalışıyorum, mercan nokta senin için öncelikli.">
      {items.map((i) => (
        <View key={i.label} style={styles.legendItem}>
          <View style={[styles.legendSwatch, i.swatch]} />
          <ThemedText type="small" themeColor="textSecondary">
            {i.label}
          </ThemedText>
        </View>
      ))}
      <View style={styles.legendItem}>
        <View style={[styles.focusDot, styles.focusDotLegend, { backgroundColor: theme.marker }]} />
        <ThemedText type="small" themeColor="textSecondary">
          Öncelikli
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
    borderWidth: Border.thin,
    maxWidth: '90%',
  },
  sectionTitle: { flexShrink: 1 },
  noteRow: { alignItems: 'center', paddingBottom: Spacing.two },
  note: { maxWidth: '90%', padding: Spacing.two, borderRadius: Radius.sm, borderWidth: Border.thin },
  topicRow: { flexDirection: 'row', alignItems: 'stretch' },
  half: { flex: 1, minWidth: 0, flexDirection: 'row', alignItems: 'center', paddingVertical: Spacing.one },
  halfLeft: { justifyContent: 'flex-end' },
  halfRight: { justifyContent: 'flex-start' },
  rail: { width: RAIL, alignItems: 'center', justifyContent: 'center' },
  spineLine: { position: 'absolute', top: 0, bottom: 0, width: SPINE, left: '50%', marginLeft: -SPINE / 2 },
  dot: { width: 12, height: 12, borderRadius: 6, borderWidth: Border.thick },
  connector: { width: Spacing.two, height: SPINE },
  nodeIcon: { flexShrink: 0, marginTop: 2 },
  focusDot: { width: 6, height: 6, borderRadius: 3, marginTop: 5 },
  focusDotLegend: { marginTop: 0 },
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
  nodeTitle: { flexShrink: 1 },
  strike: { textDecorationLine: 'line-through' },
  finish: {
    width: 40,
    height: 40,
    borderRadius: 20,
    borderWidth: Border.thin,
    alignItems: 'center',
    justifyContent: 'center',
  },
  legend: { flexDirection: 'row', flexWrap: 'wrap', gap: Spacing.three, rowGap: Spacing.two },
  legendItem: { flexDirection: 'row', alignItems: 'center', gap: Spacing.one },
  legendSwatch: { width: 16, height: 12, borderRadius: 3, borderWidth: Border.thin },
});
