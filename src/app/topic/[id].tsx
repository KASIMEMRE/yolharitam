import { router, Stack, useLocalSearchParams } from 'expo-router';
import { openBrowserAsync } from 'expo-web-browser';
import { useRef, useState } from 'react';
import { Platform, Pressable, ScrollView, StyleSheet, useWindowDimensions, View } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';

import { Glyph, IconLabel } from '@/components/icon';
import { Banner } from '@/components/banner';
import { Button } from '@/components/button';
import { HeaderBackButton } from '@/components/header-back-button';
import { StatusChip } from '@/components/level-badge';
import { type Milestone, MilestoneCelebration } from '@/components/milestone-celebration';
import { Skeleton } from '@/components/skeleton';
import { type AssistBlockId, TopicAssist } from '@/components/topic-assist';
import { ThemedText } from '@/components/themed-text';
import { ThemedView } from '@/components/themed-view';
import { allTopics, findTopic, getRoadmap } from '@/constants/dev-roadmaps';
import { computeProgress, personalizationFor, planTopics, type TopicStatus } from '@/constants/dev-roadmaps/personalize';
import { toLevelId, type GoalId } from '@/constants/plan';
import { isAnswerId } from '@/constants/roadmap-questions';
import { XP } from '@/constants/xp';
import { Border, MaxContentWidth, MinTouch, Radius, Spacing } from '@/constants/theme';
import { HUES, MARKER_STYLE, RESOURCE_KIND_STYLE, STATUS_STYLE } from '@/constants/visuals';
import { useLatestRoadmap } from '@/hooks/use-latest-roadmap';
import { useTheme } from '@/hooks/use-theme';
import { useTopicProgress } from '@/hooks/use-topic-progress';
import { ERROR_TEXT } from '@/lib/supabase-errors';
import { awardXp } from '@/lib/xp';

const LEVEL_LABEL = { 1: 'Başlangıç konusu', 2: 'Orta seviye konu', 3: 'İleri seviye konu' } as const;

// Durum seçenekleri: seçili olana tekrar dokunmak durumu sıfırlar ("başlanmadı").
// Açıklama, 3'lü seçicinin altında yalnız seçili olan için tek satır olarak görünür.
const STATUS_OPTIONS: { id: TopicStatus; description: string }[] = [
  { id: 'in_progress', description: 'Şu an bu konuyu çalışıyorum.' },
  { id: 'done', description: 'Bu konuyu öğrendim.' },
  { id: 'skipped', description: 'Zaten biliyorum ya da gerek yok; planımdan çıkar.' },
];

// Yapay zekâ kısayolları: dokununca ilgili bloğa kaydırır
const ASSIST_SHORTCUTS: { id: AssistBlockId; label: string; icon: string }[] = [
  { id: 'explain', label: 'Alt konular', icon: '🧩' },
  { id: 'quiz', label: 'Quiz çöz', icon: '📝' },
  { id: 'ask', label: 'Soru sor', icon: '💬' },
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
  // Kaynak bağlantısı açılamadıysa true; opening çift dokunuşta tarayıcının iki kez açılmasını önler
  const [linkError, setLinkError] = useState(false);
  const [opening, setOpening] = useState(false);

  // Kısayolla kaydırma: blokların y konumu onLayout ile toplanır (TopicAssist içinde), ScrollView ref ile kaydırılır
  const scrollRef = useRef<{ scrollTo: (options: { y: number; animated?: boolean }) => void } | null>(null);
  const assistOffset = useRef({ inner: 0, assist: 0 });
  const blockY = useRef<Partial<Record<AssistBlockId, number>>>({});
  function scrollToBlock(id: AssistBlockId) {
    const y = blockY.current[id];
    if (y === undefined) return;
    // Blok konumu = içerik kabının dolgusu + yapay zekâ alanının konumu + bloğun alan içindeki konumu
    const total = assistOffset.current.inner + assistOffset.current.assist + y;
    scrollRef.current?.scrollTo({ y: Math.max(0, total - Spacing.two), animated: true });
  }

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

  // Kaynaklar için ezber link tutmuyoruz (linkler zamanla kırılır); adı + konu başlığıyla web araması açarız.
  // encodeURIComponent: boşluk ve Türkçe karakterler adreste güvenle taşınsın diye kodlanır.
  async function openResource(title: string) {
    if (opening) return;
    setLinkError(false);
    setOpening(true);
    try {
      await openBrowserAsync(`https://www.google.com/search?q=${encodeURIComponent(`${title} ${topic.title}`)}`);
    } catch {
      // Tarayıcı açılamazsa uygulama çökmesin; kullanıcıya düz bir mesaj göster
      setLinkError(true);
    } finally {
      setOpening(false);
    }
  }

  function openNext() {
    if (!next) return;
    setLinkError(false);
    router.setParams({ id: next.id });
  }

  return (
    <ThemedView style={styles.container}>
      {screenOptions}
      <SafeAreaView style={styles.flex} edges={['bottom']}>
        <ScrollView ref={(r) => { scrollRef.current = r; }} style={styles.flex} contentContainerStyle={[styles.content, { padding: gutter }]}>
          <View style={styles.inner} onLayout={(e) => (assistOffset.current.inner = e.nativeEvent.layout.y)}>
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
                  <IconLabel emoji="✨" type="smallBold" themeColor="markerInk">
                    {`Senin için öncelikli konulardan biri (${focusIndex + 1}. sırada)`}
                  </IconLabel>
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

            {/* Kaynaklar: dokununca adı + konu başlığı tarayıcıda aranır */}
            {topic.resources.length > 0 && (
              <View style={styles.block}>
                <ThemedText type="cardTitle" accessibilityRole="header">
                  Önerilen kaynaklar
                </ThemedText>
                <ThemedText type="small" themeColor="textSecondary">
                  Dokununca kaynak tarayıcıda aranır.
                </ThemedText>
                {topic.resources.map((r) => (
                  <Pressable
                    key={r.title}
                    onPress={() => openResource(r.title)}
                    accessibilityRole="link"
                    accessibilityLabel={`${RESOURCE_KIND_STYLE[r.kind].label}: ${r.title}`}
                    accessibilityHint="Tarayıcıda arama açar"
                    style={({ pressed }) => [
                      styles.resource,
                      { borderColor: theme.border, backgroundColor: pressed ? theme.backgroundSelected : theme.card },
                    ]}>
                    <Glyph emoji={RESOURCE_KIND_STYLE[r.kind].emoji} size={20} color={theme.accentInk} />
                    <View style={styles.flexText}>
                      <ThemedText type="smallBold">{r.title}</ThemedText>
                      <ThemedText type="small" themeColor="textSecondary">
                        {RESOURCE_KIND_STYLE[r.kind].label}
                      </ThemedText>
                    </View>
                    {/* "Dışarı aç" simgesi: bu satır uygulamadan çıkar */}
                    <Glyph emoji="↗" size={18} color={theme.textSecondary} />
                  </Pressable>
                ))}
                {/* liveRegion: hata sonradan çıkınca ekran okuyucu da duyurur */}
                <View accessibilityLiveRegion="polite">
                  {linkError && <Banner tone="warning">Bağlantı açılamadı. Birazdan tekrar dene.</Banner>}
                </View>
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
                <Skeleton width="100%" height={52} radius={Radius.lg} />
              ) : (
                <View style={styles.block}>
                  {/* Kompakt 3'lü seçici: tek satır, her parça en az 44pt yüksekliğinde */}
                  <View
                    accessibilityRole="radiogroup"
                    accessibilityLabel="Konu durumu"
                    style={[styles.segment, { backgroundColor: theme.backgroundSelected, borderColor: theme.border }]}>
                    {STATUS_OPTIONS.map((o) => {
                      const selected = current === o.id;
                      return (
                        <Pressable
                          key={o.id}
                          onPress={() => choose(o.id)}
                          accessibilityRole="radio"
                          accessibilityState={{ selected }}
                          accessibilityLabel={`${STATUS_STYLE[o.id].label}. ${o.description}`}
                          accessibilityHint={selected ? 'Seçimi kaldırmak için tekrar dokun' : undefined}
                          style={[
                            styles.segmentItem,
                            selected && { backgroundColor: theme.accentSoft, borderColor: theme.accent },
                          ]}>
                          <IconLabel emoji={STATUS_STYLE[o.id].emoji} type="smallBold" themeColor={selected ? 'accentInk' : 'textSecondary'}>
                            {STATUS_STYLE[o.id].label}
                          </IconLabel>
                        </Pressable>
                      );
                    })}
                  </View>
                  {/* Seçili durumun kısa açıklaması; seçim yoksa nasıl işaretleneceği */}
                  <ThemedText type="small" themeColor="textSecondary">
                    {STATUS_OPTIONS.find((o) => o.id === current)?.description ?? 'Bu konuda neredesin? Birini seç.'}
                  </ThemedText>
                </View>
              )}
            </View>

            {/* Yapay zekâ kısayolları: araçlar sayfanın altında kaldığı için durumun yanında hızlı erişim */}
            <View style={styles.shortcuts} accessibilityRole="toolbar" accessibilityLabel="Yapay zekâ araçları">
              {ASSIST_SHORTCUTS.map((a) => (
                <Pressable
                  key={a.id}
                  onPress={() => scrollToBlock(a.id)}
                  accessibilityRole="button"
                  accessibilityLabel={a.label}
                  accessibilityHint="Sayfada ilgili bölüme kaydırır"
                  style={({ pressed }) => [
                    styles.shortcut,
                    { borderColor: theme.border, backgroundColor: pressed ? theme.backgroundSelected : theme.card },
                  ]}>
                  <IconLabel emoji={a.icon} type="smallBold" themeColor="accentInk" iconSize={16}>
                    {a.label}
                  </IconLabel>
                </Pressable>
              ))}
            </View>

            {/* Sonraki konu durumun hemen altında: işaretledikten sonra ilerlemek için sayfayı kaydırmak gerekmesin.
                Konu bitince birincil (dolu) olur; aksi halde ikincil. Durum yüklenmese de görünür. */}
            {next && (
              <Button
                variant={current === 'done' ? 'primary' : 'secondary'}
                icon="➡️"
                label={`Sonraki konu: ${next.title}`}
                accessibilityHint={current === 'done' ? 'Konu bitti, sonraki konuya geç' : undefined}
                onPress={openNext}
              />
            )}

            {/* Yapay zekâ araçları. key: "Sonraki konu"ya geçince önceki konunun cevapları kalmasın */}
            <View onLayout={(e) => (assistOffset.current.assist = e.nativeEvent.layout.y)}>
              <TopicAssist
                key={topic.id}
                map={map}
                section={section}
                topic={topic}
                level={roadmap?.id === roadmapId ? toLevelId(roadmap.level) : undefined}
                onBlockLayout={(id, y) => (blockY.current[id] = y)}
              />
            </View>

            {/* Proje konularında: bitirdiğin projeyi Topluluk vitrinine ekleme bağlantısı */}
            {(topic.id.startsWith('project') || topic.id.startsWith('portfolio')) && (
              <Button
                variant="text"
                icon="🧩"
                label="Projeni vitrine ekle"
                onPress={() => router.push({ pathname: '/showcase-new', params: { map: map.id } })}
              />
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
  segment: { flexDirection: 'row', gap: 2, padding: 2, borderRadius: Radius.pill, borderWidth: Border.thin },
  segmentItem: {
    flex: 1,
    minHeight: MinTouch,
    alignItems: 'center',
    justifyContent: 'center',
    paddingHorizontal: Spacing.one,
    borderRadius: Radius.pill,
    borderWidth: Border.thick,
    borderColor: 'transparent',
  },
  shortcuts: { flexDirection: 'row', flexWrap: 'wrap', gap: Spacing.two },
  shortcut: {
    minHeight: MinTouch,
    justifyContent: 'center',
    paddingHorizontal: Spacing.three,
    borderRadius: Radius.pill,
    borderWidth: Border.thick,
  },
  personal: { gap: Spacing.one, padding: Spacing.three, borderRadius: Radius.md, borderWidth: Border.thick },
  block: { gap: Spacing.two },
  resource: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: Spacing.three,
    padding: Spacing.three,
    borderRadius: Radius.md,
    borderWidth: Border.thick,
    minHeight: MinTouch,
  },
  flexText: { flex: 1, minWidth: 0, gap: Spacing.half },
  problem: { flex: 1, justifyContent: 'center', gap: Spacing.three },
});
