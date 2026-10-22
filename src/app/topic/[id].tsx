import { router, Stack, useLocalSearchParams } from 'expo-router';
import { useState } from 'react';
import { Platform, ScrollView, StyleSheet, Text, useWindowDimensions, View } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';

import { Banner } from '@/components/banner';
import { Button } from '@/components/button';
import { HeaderBackButton } from '@/components/header-back-button';
import { StatusChip } from '@/components/level-badge';
import { type Milestone, MilestoneCelebration } from '@/components/milestone-celebration';
import { OptionCard } from '@/components/option-card';
import { Skeleton } from '@/components/skeleton';
import { TopicAssist } from '@/components/topic-assist';
import { ThemedText } from '@/components/themed-text';
import { ThemedView } from '@/components/themed-view';
import { allTopics, findTopic, getRoadmap } from '@/constants/dev-roadmaps';
import { computeProgress, personalizationFor, planTopics, type TopicStatus } from '@/constants/dev-roadmaps/personalize';
import { toLevelId, type GoalId } from '@/constants/plan';
import { isAnswerId } from '@/constants/roadmap-questions';
import { XP } from '@/constants/xp';
import { Border, MaxContentWidth, Radius, Spacing } from '@/constants/theme';
import { HUES, MARKER_STYLE, RESOURCE_KIND_STYLE, STATUS_STYLE } from '@/constants/visuals';
import { useLatestRoadmap } from '@/hooks/use-latest-roadmap';
import { useTheme } from '@/hooks/use-theme';
import { useTopicProgress } from '@/hooks/use-topic-progress';
import { ERROR_TEXT } from '@/lib/supabase-errors';
import { awardXp } from '@/lib/xp';

const LEVEL_LABEL = { 1: 'Başlangıç konusu', 2: 'Orta seviye konu', 3: 'İleri seviye konu' } as const;

// Durum seçenekleri: seçili olana tekrar dokunmak durumu sıfırlar ("başlanmadı")
const STATUS_OPTIONS: { id: TopicStatus; description: string }[] = [
  { id: 'in_progress', description: 'Şu an bu konuyu çalışıyorum' },
  { id: 'done', description: 'Bu konuyu öğrendim' },
  { id: 'skipped', description: 'Zaten biliyorum ya da gerek yok; planımdan çıkar' },
];

function first(param: string | string[] | undefined): string | undefined {
  return Array.isArray(param) ? param[0] : param;
}

// Konu detayı: ne olduğu, neden önemli, kaynaklar ve durum işaretleme.
// Parametreler: id (konu), map (harita kimliği), roadmapId (kullanıcının yol haritası satırı).
export default function TopicScreen() {
  const params = useLocalSearchParams<{ id?: string; map?: string; roadmapId?: string }>();
  const map = getRoadmap(first(params.map));
  const found = map && params.id ? findTopic(map, first(params.id) ?? '') : undefined;
  const roadmapId = first(params.roadmapId);
  const progress = useTopicProgress(roadmapId);
  // Kişisel işaretler için kullanıcının yol haritası satırı (Yol Haritam ile aynı kaynak)
  const { roadmap } = useLatestRoadmap();
  // Bölüm/harita bitince açılan kutlama (hook erken return'lerden ÖNCE çağrılır)
  const [milestone, setMilestone] = useState<Milestone | null>(null);

  const theme = useTheme();
  const { width } = useWindowDimensions();
  const gutter = width < 360 ? Spacing.three : Spacing.four;

  function goBack() {
    if (router.canGoBack()) router.back();
    else router.replace('/roadmap');
  }

  const screenOptions = (
    <Stack.Screen
      options={{
        title: found?.section.title ?? 'Konu',
        // Web'de varsayılan geri oku küçük; 44x44'lük kendi düğmemizi koyarız (native aynı kalır)
        headerLeft: Platform.OS === 'web' ? () => <HeaderBackButton onPress={goBack} label="Haritaya dön" /> : undefined,
      }}
    />
  );

  if (!map || !found || !roadmapId) {
    return (
      <ThemedView style={styles.container}>
        {screenOptions}
        <View style={[styles.problem, { padding: gutter }]}>
          <Banner tone="warning">Bu konu bulunamadı. Haritana dönüp tekrar dene.</Banner>
          <Button label="Haritama dön" onPress={goBack} />
        </View>
      </ThemedView>
    );
  }

  const { topic, section } = found;
  const hue = HUES[map.hue];
  // Yol Haritam ekranıyla AYNI kural (kayıt yoksa seviye kuralları): "bölüm bitti" kararı iki ekranda tutarlı olsun
  const goal: GoalId = roadmap && isAnswerId('goal', roadmap.goal) ? (roadmap.goal as GoalId) : 'job';
  const personalization =
    roadmap?.id === roadmapId ? personalizationFor(map, roadmap.personalization, toLevelId(roadmap.level), goal) : null;
  const focusIndex = personalization?.focus.indexOf(topic.id) ?? -1;
  const skipHint = personalization?.skip.includes(topic.id) ?? false;
  const note = personalization?.notes[section.id];
  const current = progress.statuses.get(topic.id);
  const ready = progress.status === 'ready';

  // Haritadaki bir sonraki konu (bölüm sınırını aşar): kullanıcı ekrandan çıkmadan ilerleyebilsin
  const topics = allTopics(map);
  const next = topics[topics.findIndex((t) => t.id === topic.id) + 1];

  async function choose(status: TopicStatus) {
    const next = current === status ? null : status;
    const ok = await progress.setStatus(topic.id, next);
    if (!ok || !next || !roadmapId || !map) return;
    // XP: her olay bir kez puan verir (ref benzersiz); işareti kaldırıp yeniden koymak tekrar kazandırmaz
    const ref = `${roadmapId}:${topic.id}`;
    if (next === 'in_progress') {
      await awardXp({ kind: 'topic_started', ref, roadmapId, topicId: topic.id });
      return;
    }
    if (next !== 'done') return;
    let gained = 0;
    if (await awardXp({ kind: 'topic_done', ref, roadmapId, topicId: topic.id })) gained += XP.topic_done;

    // Bölüm ya da harita bitti mi? (planındaki konulara göre; atladıkların sayılmaz)
    const after = new Map(progress.statuses);
    after.set(topic.id, 'done');
    const plan = planTopics(map, after, personalization);
    const sum = computeProgress(map, after, personalization, '3-5');
    const percent = sum.total > 0 ? Math.round((sum.done / sum.total) * 100) : 0;
    const allDone = plan.length > 0 && plan.every((t) => after.get(t.id) === 'done');
    const sectionPlan = section.topics.filter((t) => plan.includes(t));
    const sectionDone = sectionPlan.length > 0 && sectionPlan.every((t) => after.get(t.id) === 'done');

    // Kutlama, bölüm/harita BU İŞARETLE tamamlandığında her durumda açılır. XP ise ayrı: bölüm başına
    // bir kez verilir (işareti kaldırıp yeniden koymak kutlamayı tekrar açar ama puanı tekrar vermez).
    const wasSectionDone = sectionPlan.every((t) => (t.id === topic.id ? current : progress.statuses.get(t.id)) === 'done');
    if (allDone) {
      const bonus = (await awardXp({ kind: 'roadmap_done', ref: roadmapId, roadmapId })) ? XP.roadmap_done : 0;
      setMilestone({ kind: 'roadmap', title: map.title, emoji: map.emoji, percent: 100, xp: gained + bonus });
    } else if (sectionDone && !wasSectionDone) {
      const bonus = (await awardXp({ kind: 'section_done', ref: `${roadmapId}:${section.id}`, roadmapId }))
        ? XP.section_done
        : 0;
      setMilestone({ kind: 'section', title: section.title, emoji: section.emoji, percent, xp: gained + bonus });
    }
  }

  function openNext() {
    if (!next) return;
    router.setParams({ id: next.id });
  }

  return (
    <ThemedView style={styles.container}>
      {screenOptions}
      <SafeAreaView style={styles.flex} edges={['bottom']}>
        <ScrollView style={styles.flex} contentContainerStyle={[styles.content, { padding: gutter }]}>
          <View style={styles.inner}>
            {/* Başlık bloğu: harita rengiyle */}
            <View style={[styles.hero, { backgroundColor: theme[hue.soft], borderColor: theme[hue.line] }]}>
              <ThemedText type="eyebrow" themeColor={hue.ink}>
                {map.title} · {section.title}
              </ThemedText>
              <ThemedText type="heading" accessibilityRole="header">
                {topic.title}
              </ThemedText>
              <View style={styles.chips}>
                <StatusChip
                  tone={topic.marker === 'core' ? 'accent' : 'neutral'}
                  label={MARKER_STYLE[topic.marker].label}
                />
                <StatusChip tone="neutral" emoji="📶" label={LEVEL_LABEL[topic.level]} />
                <StatusChip tone="neutral" emoji="⏱" label={`yaklaşık ${topic.hours} saat`} />
              </View>
            </View>

            <ThemedText>{topic.summary}</ThemedText>
            <ThemedText type="small" themeColor="textSecondary">
              {MARKER_STYLE[topic.marker].description}
            </ThemedText>

            {/* Kişisel işaretler (yapay zekâ ya da kurallar) */}
            {(focusIndex >= 0 || skipHint || note) && (
              <View style={[styles.personal, { backgroundColor: theme.markerSoft, borderColor: theme.markerEdge }]}>
                {focusIndex >= 0 && (
                  <ThemedText type="smallBold" themeColor="markerInk">
                    ✨ Senin için öncelikli konulardan biri ({focusIndex + 1}. sırada)
                  </ThemedText>
                )}
                {skipHint && (
                  <ThemedText type="smallBold" themeColor="markerInk">
                    Seviyene göre bu konuyu biliyor olabilirsin. Biliyorsan “Atla” de.
                  </ThemedText>
                )}
                {note && (
                  <ThemedText type="small" themeColor="markerInk">
                    {note}
                  </ThemedText>
                )}
              </View>
            )}

            {/* Kaynaklar: ad olarak verilir (linkler zamanla kırılır); adını aratman yeterli */}
            {topic.resources.length > 0 && (
              <View style={styles.block}>
                <ThemedText type="cardTitle" accessibilityRole="header">
                  Önerilen kaynaklar
                </ThemedText>
                {topic.resources.map((r) => (
                  <View
                    key={r.title}
                    accessible
                    accessibilityLabel={`${RESOURCE_KIND_STYLE[r.kind].label}: ${r.title}`}
                    style={[styles.resource, { borderColor: theme.border, backgroundColor: theme.card }]}>
                    <Text allowFontScaling={false} style={styles.resourceEmoji}>
                      {RESOURCE_KIND_STYLE[r.kind].emoji}
                    </Text>
                    <View style={styles.flexText}>
                      <ThemedText type="smallBold">{r.title}</ThemedText>
                      <ThemedText type="small" themeColor="textSecondary">
                        {RESOURCE_KIND_STYLE[r.kind].label}
                      </ThemedText>
                    </View>
                  </View>
                ))}
                <ThemedText type="small" themeColor="textSecondary">
                  Kaynağın adını arama motoruna yazman yeterli.
                </ThemedText>
              </View>
            )}

            {/* Durum */}
            <View style={styles.block}>
              <ThemedText type="cardTitle" accessibilityRole="header">
                Durumun
              </ThemedText>
              {progress.saveError && <Banner tone="warning">{progress.saveError}</Banner>}
              {progress.status === 'schema' || progress.status === 'network' || progress.status === 'error' ? (
                // Okunamadı: iskeleti sonsuza dek göstermek yerine hata ve "Tekrar dene"
                <View style={styles.block}>
                  <Banner tone="warning">
                    {progress.status === 'schema'
                      ? ERROR_TEXT.loadSchema
                      : progress.status === 'network'
                        ? ERROR_TEXT.network
                        : ERROR_TEXT.other}
                  </Banner>
                  <Button variant="secondary" icon="🔄" label="Tekrar dene" onPress={progress.retry} />
                </View>
              ) : !ready ? (
                <View style={styles.block}>
                  <Skeleton width="100%" height={72} radius={Radius.lg} />
                  <Skeleton width="100%" height={72} radius={Radius.lg} />
                </View>
              ) : (
                <View accessibilityRole="radiogroup" accessibilityLabel="Konu durumu" style={styles.block}>
                  {STATUS_OPTIONS.map((o, index) => (
                    <OptionCard
                      key={o.id}
                      role="radio"
                      title={STATUS_STYLE[o.id].label}
                      description={o.description}
                      icon={STATUS_STYLE[o.id].emoji}
                      trailing="check"
                      selected={current === o.id}
                      index={index}
                      hint={current === o.id ? 'Seçimi kaldırmak için tekrar dokun' : undefined}
                      onPress={() => choose(o.id)}
                    />
                  ))}
                </View>
              )}
            </View>

            {/* Yapay zekâ araçları. key: "Sonraki konu"ya geçince önceki konunun cevapları kalmasın */}
            <TopicAssist
              key={topic.id}
              map={map}
              section={section}
              topic={topic}
              level={roadmap?.id === roadmapId ? toLevelId(roadmap.level) : undefined}
            />

            {next && (
              <Button variant="secondary" icon="➡️" label={`Sonraki konu: ${next.title}`} onPress={openNext} />
            )}
            <Button variant="text" label="Haritaya dön" onPress={goBack} />
            <MilestoneCelebration milestone={milestone} map={map} onClose={() => setMilestone(null)} />
          </View>
        </ScrollView>
      </SafeAreaView>
    </ThemedView>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1 },
  flex: { flex: 1 },
  content: { alignItems: 'center' },
  inner: { width: '100%', maxWidth: MaxContentWidth, gap: Spacing.three },
  hero: { gap: Spacing.two, padding: Spacing.three, borderRadius: Radius.lg, borderWidth: Border.thick },
  chips: { flexDirection: 'row', flexWrap: 'wrap', gap: Spacing.two },
  personal: { gap: Spacing.one, padding: Spacing.three, borderRadius: Radius.md, borderWidth: Border.thick },
  block: { gap: Spacing.two },
  resource: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: Spacing.three,
    padding: Spacing.three,
    borderRadius: Radius.md,
    borderWidth: Border.thick,
  },
  resourceEmoji: { fontSize: 22, lineHeight: 28 },
  flexText: { flex: 1, minWidth: 0, gap: Spacing.half },
  problem: { flex: 1, justifyContent: 'center', gap: Spacing.three },
});
