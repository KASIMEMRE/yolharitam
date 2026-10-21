import { Link, router } from 'expo-router';
import { useState } from 'react';
import { Pressable, StyleSheet, Text, View } from 'react-native';
import Animated, { FadeIn, FadeInDown, ZoomIn, useReducedMotion } from 'react-native-reanimated';

import { Banner } from '@/components/banner';
import { Button } from '@/components/button';
import { IconTile } from '@/components/icon-tile';
import { LevelBadge, StatusChip } from '@/components/level-badge';
import { ProgressSummary } from '@/components/progress-summary';
import { ScreenHeader } from '@/components/screen-header';
import { Skeleton } from '@/components/skeleton';
import { TabScreen } from '@/components/tab-screen';
import { ThemedText } from '@/components/themed-text';
import { getRoadmap, KIND_LABEL, type DevRoadmap, type Section, type Topic } from '@/constants/dev-roadmaps';
import {
  computeProgress,
  nextTopic,
  parsePersonalization,
  planTopics,
  rulePersonalization,
  type Personalization,
  type TopicStatus,
} from '@/constants/dev-roadmaps/personalize';
import { toLevelId, type GoalId, type WeeklyHoursId } from '@/constants/plan';
import { findOption, isAnswerId, weeklyLabel } from '@/constants/roadmap-questions';
import { Border, Edge, MinTouch, Radius, Spacing } from '@/constants/theme';
import { HUES, MARKER_STYLE, STATUS_STYLE } from '@/constants/visuals';
import { useDisplayName } from '@/hooks/use-display-name';
import { useLatestRoadmap, type Roadmap } from '@/hooks/use-latest-roadmap';
import { useShadow, useTheme } from '@/hooks/use-theme';
import { useTopicProgress } from '@/hooks/use-topic-progress';
import { ERROR_TEXT } from '@/lib/supabase-errors';

// Konu detayını açar. Harita kimliği de gönderilir: detay ekranı içeriği veritabanına gitmeden bulur.
function openTopic(roadmap: Roadmap, topicId: string) {
  router.push({ pathname: '/topic/[id]', params: { id: topicId, map: roadmap.topic_path, roadmapId: roadmap.id } });
}

export default function RoadmapScreen() {
  // Veri okuma (useFocusEffect ile her odakta tazeleme) ortak hook'larda
  const { roadmap, loading } = useLatestRoadmap();
  // Hook erken return'lerden ÖNCE çağrılır (hook kuralı)
  const { name } = useDisplayName();
  const trimmedName = name?.trim();
  const greeting = trimmedName ? `Merhaba, ${trimmedName}` : undefined;
  const progress = useTopicProgress(roadmap?.id);

  const header = <ScreenHeader title="Yol Haritam" eyebrow={greeting} emoji="🗺️" hue="accent" />;

  if (loading) {
    return (
      <TabScreen>
        {header}
        <JourneySkeleton />
      </TabScreen>
    );
  }

  if (!roadmap) {
    return (
      <TabScreen>
        {header}
        <EmptyState
          title="Henüz bir yol haritası seçmedin."
          text="Frontend’den yapay zekâya, sana uyan yolu seç; konuları adım adım işaretle."
        />
      </TabScreen>
    );
  }

  const map = getRoadmap(roadmap.topic_path);
  if (!map) {
    // Eski sürümde seçilmiş genel bir konu (spor, finans…): artık yalnız yazılımcı haritaları var
    return (
      <TabScreen>
        {header}
        <EmptyState
          title="Yol Haritam yenilendi!"
          text="Artık yazılımcı yol haritaları var: Frontend, Backend, Yapay Zekâ ve daha fazlası. Devam etmek için bir harita seç."
        />
      </TabScreen>
    );
  }

  return (
    <TabScreen>
      {header}
      <MapView roadmap={roadmap} map={map} progress={progress} />
    </TabScreen>
  );
}

function MapView({
  roadmap,
  map,
  progress,
}: {
  roadmap: Roadmap;
  map: DevRoadmap;
  progress: ReturnType<typeof useTopicProgress>;
}) {
  const weekly: WeeklyHoursId = isAnswerId('weeklyHours', roadmap.weekly_hours)
    ? (roadmap.weekly_hours as WeeklyHoursId)
    : '3-5';
  const goal: GoalId = isAnswerId('goal', roadmap.goal) ? (roadmap.goal as GoalId) : 'job';
  // Kayıtlı kişisel işaretler; yoksa (eski kayıt) seviyeye göre kurallar
  const personalization =
    parsePersonalization(roadmap.personalization, map) ?? rulePersonalization(map, toLevelId(roadmap.level), goal);

  const plan =
    isAnswerId('weeklyHours', roadmap.weekly_hours) && isAnswerId('goal', roadmap.goal)
      ? [weeklyLabel(roadmap.weekly_hours), `Hedef: ${findOption('goal', roadmap.goal)?.title}`].join(' · ')
      : null;

  const ready = progress.status === 'ready';
  const statuses = progress.statuses;
  const sum = computeProgress(map, statuses, personalization, weekly);
  const next = ready ? nextTopic(map, statuses, personalization) : undefined;

  return (
    <>
      <JourneyCard roadmap={roadmap} map={map} plan={plan} sum={ready ? sum : null} />

      {(progress.status === 'schema' || progress.status === 'network' || progress.status === 'error') && (
        <View style={styles.errorBox}>
          <Banner tone="warning">
            {progress.status === 'schema'
              ? ERROR_TEXT.loadSchema
              : progress.status === 'network'
                ? ERROR_TEXT.network
                : ERROR_TEXT.other}
          </Banner>
          <Button variant="secondary" icon="🔄" label="Tekrar dene" onPress={progress.retry} />
        </View>
      )}

      {ready && (
        <>
          {next && <NextCard topic={next} personalization={personalization} onPress={() => openTopic(roadmap, next.id)} />}
          <ProgressSummary done={sum.done} total={sum.total} remainingHours={sum.remainingHours} />
          <Sections
            roadmap={roadmap}
            map={map}
            statuses={statuses}
            personalization={personalization}
            nextId={next?.id}
          />
        </>
      )}

      {/* İkincil eylemler en sonda: nadir yapılan işler uzun listenin önüne geçmesin */}
      <View style={styles.actions}>
        <Link href={{ pathname: '/roadmap-questions', params: { roadmapId: roadmap.id } }} asChild>
          <Button variant="text" icon="🎯" label="Planımı güncelle" />
        </Link>
        <Link href="/onboarding" asChild>
          <Button variant="text" icon="🧭" label="Haritanı değiştir" />
        </Link>
      </View>
    </>
  );
}

// Yolculuk kartı: harita, tür, seviye, plan ve toplam özet
function JourneyCard({
  roadmap,
  map,
  plan,
  sum,
}: {
  roadmap: Roadmap;
  map: DevRoadmap;
  plan: string | null;
  sum: { total: number; totalHours: number; weeks: number } | null;
}) {
  const theme = useTheme();
  const shadow = useShadow();
  const reduceMotion = useReducedMotion();
  const hue = HUES[map.hue];

  return (
    <View
      style={[
        styles.card,
        { backgroundColor: theme.card, borderColor: theme[hue.line], borderBottomColor: theme[hue.edge] },
        shadow('card'),
      ]}>
      <View style={[styles.band, { backgroundColor: theme[hue.soft] }]}>
        <View>
          <Animated.View entering={reduceMotion ? FadeIn.duration(150) : ZoomIn.springify().damping(10)}>
            <IconTile emoji={map.emoji} tone={map.hue} size={64} />
          </Animated.View>
          <Animated.Text
            allowFontScaling={false}
            entering={reduceMotion ? FadeIn.duration(150) : FadeInDown.delay(250).springify().damping(8).stiffness(200)}
            style={styles.pin}>
            📍
          </Animated.Text>
        </View>
        <View style={styles.bandTexts}>
          <ThemedText type="eyebrow" themeColor={hue.ink}>
            {KIND_LABEL[map.kind]}
          </ThemedText>
          <ThemedText type="heading">{map.title}</ThemedText>
          <ThemedText type="small" themeColor={hue.ink}>
            {map.tagline}
          </ThemedText>
        </View>
      </View>

      <View style={styles.body}>
        <View style={styles.meta}>
          <LevelBadge levelId={roadmap.level} size="md" />
          {plan !== null && (
            <ThemedText type="small" style={styles.planText}>
              {plan}
            </ThemedText>
          )}
        </View>
        {sum ? (
          <View
            accessible
            accessibilityLabel={`Planında ${sum.total} konu, yaklaşık ${sum.totalHours} saat, yaklaşık ${sum.weeks} hafta`}
            style={styles.chips}>
            <StatusChip tone="neutral" emoji="🧭" label={`${sum.total} konu`} />
            <StatusChip tone="neutral" emoji="⏱" label={`yaklaşık ${sum.totalHours} saat`} />
            <StatusChip tone="neutral" emoji="📅" label={`yaklaşık ${sum.weeks} hafta`} />
          </View>
        ) : (
          <View style={styles.chips}>
            <Skeleton width={80} height={28} radius={Radius.pill} />
            <Skeleton width={130} height={28} radius={Radius.pill} />
          </View>
        )}
      </View>
    </View>
  );
}

// "Sıradaki konu": tek dokunuşla kaldığın yerden devam
function NextCard({
  topic,
  personalization,
  onPress,
}: {
  topic: Topic;
  personalization: Personalization;
  onPress: () => void;
}) {
  const theme = useTheme();
  const focusIndex = personalization.focus.indexOf(topic.id);
  return (
    <Pressable
      onPress={onPress}
      accessibilityRole="button"
      accessibilityLabel={`Sıradaki konu: ${topic.title}. Açmak için dokun.`}
      style={({ pressed }) => [
        styles.next,
        { backgroundColor: theme.accentSoft, borderColor: theme.accent, borderBottomColor: theme.accentEdge },
        pressed && { transform: [{ translateY: 2 }] },
      ]}>
      <IconTile emoji="🥾" tone="accent" size={48} />
      <View style={styles.bandTexts}>
        <ThemedText type="eyebrow" themeColor="accentInk">
          {focusIndex >= 0 && personalization.source === 'ai' ? '✨ Sıradaki konu · senin için seçildi' : 'Sıradaki konu'}
        </ThemedText>
        <ThemedText type="cardTitle">{topic.title}</ThemedText>
        <ThemedText type="small" themeColor="textSecondary" numberOfLines={2}>
          {topic.summary}
        </ThemedText>
      </View>
      <ThemedText type="cardTitle" themeColor="accentInk">
        ›
      </ThemedText>
    </Pressable>
  );
}

// Bölümler: roadmap.sh'teki ağacın dikey hali. Her bölüm açılıp kapanır; sıradaki konunun bölümü
// ve ilk bölüm açık başlar, uzun liste tek ekranda boğmasın.
function Sections({
  roadmap,
  map,
  statuses,
  personalization,
  nextId,
}: {
  roadmap: Roadmap;
  map: DevRoadmap;
  statuses: ReadonlyMap<string, TopicStatus>;
  personalization: Personalization;
  nextId: string | undefined;
}) {
  const [open, setOpen] = useState<Set<string>>(() => {
    const first = map.sections[0]?.id;
    const withNext = map.sections.find((s) => s.topics.some((t) => t.id === nextId))?.id;
    return new Set([first, withNext].filter((x): x is string => Boolean(x)));
  });
  const planIds = new Set(planTopics(map, statuses, personalization).map((t) => t.id));

  function toggle(id: string) {
    setOpen((prev) => {
      const nextSet = new Set(prev);
      if (nextSet.has(id)) nextSet.delete(id);
      else nextSet.add(id);
      return nextSet;
    });
  }

  return (
    <View style={styles.sections}>
      <View style={styles.sectionsHead}>
        <ThemedText type="cardTitle" accessibilityRole="header">
          Harita
        </ThemedText>
        <ThemedText type="small" themeColor="textSecondary">
          Bir konuya dokun: ne olduğunu, kaynaklarını gör ve durumunu işaretle.
        </ThemedText>
      </View>
      {map.sections.map((section, index) => (
        <SectionCard
          key={section.id}
          index={index}
          last={index === map.sections.length - 1}
          section={section}
          open={open.has(section.id)}
          onToggle={() => toggle(section.id)}
          statuses={statuses}
          personalization={personalization}
          planIds={planIds}
          nextId={nextId}
          onOpenTopic={(id) => openTopic(roadmap, id)}
        />
      ))}
    </View>
  );
}

function SectionCard({
  index,
  last,
  section,
  open,
  onToggle,
  statuses,
  personalization,
  planIds,
  nextId,
  onOpenTopic,
}: {
  index: number;
  last: boolean;
  section: Section;
  open: boolean;
  onToggle: () => void;
  statuses: ReadonlyMap<string, TopicStatus>;
  personalization: Personalization;
  planIds: Set<string>;
  nextId: string | undefined;
  onOpenTopic: (id: string) => void;
}) {
  const theme = useTheme();
  const inPlan = section.topics.filter((t) => planIds.has(t.id));
  const done = inPlan.filter((t) => statuses.get(t.id) === 'done').length;
  const complete = inPlan.length > 0 && done === inPlan.length;
  const note = personalization.notes[section.id];

  return (
    <View style={styles.sectionRow}>
      {/* Sol taraftaki patika: düğüm + bölümleri birbirine bağlayan çizgi */}
      <View style={styles.rail} accessibilityElementsHidden importantForAccessibility="no-hide-descendants">
        <View
          style={[
            styles.node,
            {
              backgroundColor: complete ? theme.accent : theme.card,
              borderColor: complete ? theme.accentEdge : theme.borderStrong,
            },
          ]}>
          <Text allowFontScaling={false} style={[styles.nodeText, { color: complete ? theme.onAccent : theme.text }]}>
            {complete ? '✓' : String(index + 1)}
          </Text>
        </View>
        {!last && <View style={[styles.line, { backgroundColor: theme.borderStrong }]} />}
      </View>

      <View style={[styles.section, { backgroundColor: theme.card, borderColor: theme.border }]}>
        <Pressable
          onPress={onToggle}
          accessibilityRole="button"
          accessibilityState={{ expanded: open }}
          accessibilityLabel={`${section.title}. ${inPlan.length} konunun ${done} tanesi bitti. ${open ? 'Kapatmak' : 'Açmak'} için dokun.`}
          style={styles.sectionHead}>
          <Text allowFontScaling={false} style={styles.sectionEmoji}>
            {section.emoji}
          </Text>
          <View style={styles.bandTexts}>
            <ThemedText type="cardTitle">{section.title}</ThemedText>
            <ThemedText type="small" themeColor="textSecondary">
              {inPlan.length > 0 ? `${done} / ${inPlan.length} konu` : `${section.topics.length} konu · planında yok`}
            </ThemedText>
          </View>
          <ThemedText type="cardTitle" themeColor="textSecondary">
            {open ? '▴' : '▾'}
          </ThemedText>
        </Pressable>

        {open && (
          <Animated.View entering={FadeIn.duration(150)} style={styles.topics}>
            {note && (
              <View style={[styles.note, { backgroundColor: theme.markerSoft }]}>
                <ThemedText type="small" themeColor="markerInk">
                  ✨ {note}
                </ThemedText>
              </View>
            )}
            {section.topics.map((topic) => (
              <TopicRow
                key={topic.id}
                topic={topic}
                status={statuses.get(topic.id)}
                focus={personalization.focus.includes(topic.id)}
                skipHint={personalization.skip.includes(topic.id)}
                isNext={topic.id === nextId}
                onPress={() => onOpenTopic(topic.id)}
              />
            ))}
          </Animated.View>
        )}
      </View>
    </View>
  );
}

function TopicRow({
  topic,
  status,
  focus,
  skipHint,
  isNext,
  onPress,
}: {
  topic: Topic;
  status: TopicStatus | undefined;
  focus: boolean;
  skipHint: boolean;
  isNext: boolean;
  onPress: () => void;
}) {
  const theme = useTheme();
  const muted = status === 'skipped' || (!status && (topic.marker !== 'core' || skipHint));

  // Etiketler: harita işareti (önerilen konularda gösterilmez, varsayılan odur) + kişisel işaretler
  const tags: string[] = [];
  if (topic.marker !== 'core') tags.push(MARKER_STYLE[topic.marker].label);
  if (focus && !status) tags.push('✨ Önce bununla başla');
  if (skipHint && !status) tags.push('Biliyorsan atlayabilirsin');
  if (status) tags.push(STATUS_STYLE[status].label);

  return (
    <Pressable
      onPress={onPress}
      accessibilityRole="button"
      accessibilityLabel={`${topic.title}. ${tags.join(', ')}. Ayrıntılar için dokun.`}
      style={({ pressed }) => [
        styles.topic,
        {
          borderColor: isNext ? theme.accent : theme.border,
          backgroundColor: pressed ? theme.backgroundSelected : 'transparent',
        },
      ]}>
      <View
        style={[
          styles.check,
          {
            borderColor: status === 'done' ? theme.accent : status === 'in_progress' ? theme.markerEdge : theme.borderStrong,
            backgroundColor: status === 'done' ? theme.accent : status === 'in_progress' ? theme.markerSoft : 'transparent',
          },
        ]}>
        {status && (
          <Text
            allowFontScaling={false}
            style={[
              styles.checkText,
              { color: status === 'done' ? theme.onAccent : status === 'in_progress' ? theme.markerInk : theme.textSecondary },
            ]}>
            {status === 'done' ? '✓' : status === 'in_progress' ? '…' : '–'}
          </Text>
        )}
      </View>
      <View style={styles.bandTexts}>
        <ThemedText
          type="smallBold"
          themeColor={muted ? 'textSecondary' : 'text'}
          style={status === 'skipped' ? styles.strike : undefined}>
          {topic.title}
        </ThemedText>
        {tags.length > 0 && (
          <ThemedText type="small" themeColor={focus && !status ? 'accentInk' : 'textSecondary'}>
            {tags.join(' · ')}
          </ThemedText>
        )}
      </View>
      <ThemedText type="small" themeColor="textSecondary">
        {topic.hours} sa
      </ThemedText>
    </Pressable>
  );
}

// Yüklenirken kartla aynı boyutta iskelet: içerik gelince sayfa zıplamaz
function JourneySkeleton() {
  const theme = useTheme();
  return (
    <View
      accessible
      accessibilityLabel="Yükleniyor"
      accessibilityState={{ busy: true }}
      style={[styles.card, { backgroundColor: theme.card, borderColor: theme.border, minHeight: 232 }]}>
      <View style={[styles.band, { backgroundColor: theme.backgroundElement }]}>
        <Skeleton width={64} height={64} radius={18} />
        <View style={styles.bandTexts}>
          <Skeleton width="40%" height={14} />
          <Skeleton width="70%" height={24} />
        </View>
      </View>
      <View style={styles.body}>
        <Skeleton width="50%" height={16} />
        <Skeleton width={120} height={28} radius={Radius.pill} />
      </View>
    </View>
  );
}

function EmptyState({ title, text }: { title: string; text: string }) {
  return (
    <View style={styles.empty}>
      <IconTile emoji="🗺️" tone="accent" size={96} />
      <ThemedText type="heading" style={styles.centerText}>
        {title}
      </ThemedText>
      <ThemedText themeColor="textSecondary" style={styles.centerText}>
        {text}
      </ThemedText>
      <Link href="/onboarding" asChild>
        <Button label="Yol haritanı seç" />
      </Link>
    </View>
  );
}

const styles = StyleSheet.create({
  card: {
    borderWidth: Border.chunky,
    borderBottomWidth: Border.chunky + Edge, // 3D alt kenar
    borderRadius: Radius.lg,
    overflow: 'hidden',
  },
  band: { flexDirection: 'row', alignItems: 'center', gap: Spacing.three, padding: Spacing.three },
  bandTexts: { flex: 1, minWidth: 0, gap: Spacing.half },
  pin: { position: 'absolute', top: -10, right: -8, fontSize: 28, lineHeight: 34 },
  body: { padding: Spacing.three, gap: Spacing.three },
  meta: { flexDirection: 'row', flexWrap: 'wrap', alignItems: 'center', gap: Spacing.two },
  planText: { flex: 1, minWidth: 120 },
  chips: { flexDirection: 'row', flexWrap: 'wrap', gap: Spacing.two },
  errorBox: { gap: Spacing.three },
  next: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: Spacing.three,
    padding: Spacing.three,
    borderWidth: Border.thick,
    borderBottomWidth: Border.thick + Edge,
    borderRadius: Radius.lg,
  },
  sections: { gap: Spacing.two },
  sectionsHead: { gap: Spacing.one, marginBottom: Spacing.one },
  sectionRow: { flexDirection: 'row', gap: Spacing.two },
  rail: { width: 32, alignItems: 'center' },
  node: {
    width: 32,
    height: 32,
    borderRadius: 16,
    borderWidth: Border.thick,
    alignItems: 'center',
    justifyContent: 'center',
    marginTop: Spacing.three,
  },
  nodeText: { fontSize: 14, fontWeight: '900' },
  line: { flex: 1, width: 3, borderRadius: 2, marginTop: Spacing.one },
  section: { flex: 1, minWidth: 0, borderWidth: Border.thick, borderRadius: Radius.md, overflow: 'hidden' },
  sectionHead: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: Spacing.two,
    padding: Spacing.three,
    minHeight: MinTouch,
  },
  sectionEmoji: { fontSize: 22, lineHeight: 28 },
  topics: { gap: Spacing.two, paddingHorizontal: Spacing.two, paddingBottom: Spacing.two },
  note: { borderRadius: Radius.sm, padding: Spacing.two },
  topic: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: Spacing.two,
    minHeight: MinTouch,
    paddingVertical: Spacing.two,
    paddingHorizontal: Spacing.two,
    borderWidth: Border.thick,
    borderRadius: Radius.sm,
  },
  check: {
    width: 24,
    height: 24,
    borderRadius: 12,
    borderWidth: Border.thick,
    alignItems: 'center',
    justifyContent: 'center',
  },
  checkText: { fontSize: 13, fontWeight: '900' },
  strike: { textDecorationLine: 'line-through' },
  actions: { alignItems: 'center' },
  empty: { alignItems: 'center', gap: Spacing.three, paddingVertical: Spacing.five },
  centerText: { textAlign: 'center' },
});
