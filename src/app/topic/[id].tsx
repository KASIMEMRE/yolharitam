import { router, Stack, useLocalSearchParams } from 'expo-router';
import { openBrowserAsync } from 'expo-web-browser';
import { useState } from 'react';
import { Platform, ScrollView, StyleSheet, useWindowDimensions, View } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';

import { Glyph, IconLabel } from '@/components/icon';
import { Banner } from '@/components/banner';
import { Button } from '@/components/button';
import { HeaderBackButton } from '@/components/header-back-button';
import { ListGroup, ListRow } from '@/components/list-row';
import { type Milestone, MilestoneCelebration } from '@/components/milestone-celebration';
import { SectionHeader } from '@/components/section-header';
import { Segmented, type SegmentedOption } from '@/components/segmented';
import { Skeleton } from '@/components/skeleton';
import { Surface } from '@/components/surface';
import { TopicAssist } from '@/components/topic-assist';
import { ThemedText } from '@/components/themed-text';
import { ThemedView } from '@/components/themed-view';
import { allTopics, findTopic, getRoadmap } from '@/constants/dev-roadmaps';
import { computeProgress, personalizationFor, planTopics, type TopicStatus } from '@/constants/dev-roadmaps/personalize';
import { toLevelId, type GoalId } from '@/constants/plan';
import { isAnswerId } from '@/constants/roadmap-questions';
import { XP } from '@/constants/xp';
import { MaxContentWidth, Radius, Spacing } from '@/constants/theme';
import { HUES, MARKER_STYLE, RESOURCE_KIND_STYLE, STATUS_STYLE } from '@/constants/visuals';
import { useLatestRoadmap } from '@/hooks/use-latest-roadmap';
import { useTheme } from '@/hooks/use-theme';
import { useTopicProgress } from '@/hooks/use-topic-progress';
import { useAuthGate } from '@/lib/auth-gate';
import { ERROR_TEXT } from '@/lib/supabase-errors';
import { awardXp } from '@/lib/xp';

const LEVEL_LABEL = { 1: 'Başlangıç konusu', 2: 'Orta seviye konu', 3: 'İleri seviye konu' } as const;
// Meta satırı için kısa seviye adı
const LEVEL_SHORT = { 1: 'Başlangıç', 2: 'Orta', 3: 'İleri' } as const;

// Durum seçenekleri: seçili olana tekrar dokunmak durumu sıfırlar ("başlanmadı").
// Açıklama, 3'lü seçicinin altında yalnız seçili olan için tek satır olarak görünür.
const STATUS_OPTIONS: { id: TopicStatus; description: string }[] = [
  { id: 'in_progress', description: 'Şu an bu konuyu çalışıyorum.' },
  { id: 'done', description: 'Bu konuyu öğrendim.' },
  { id: 'skipped', description: 'Zaten biliyorum ya da gerek yok; planımdan çıkar.' },
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
  const roadmapParam = first(params.roadmapId);
  const { requireAuth, isGuest } = useAuthGate();
  // Kullanıcının yol haritası satırları (Yol Haritam ile aynı kaynak). Misafirde sorgu atılmaz.
  const { roadmaps, loading: roadmapsLoading } = useLatestRoadmap();
  // Konuya haritadan değil önizlemeden gelindiyse roadmapId yoktur; kullanıcı bu haritayı zaten takip
  // ediyorsa satırını kendimiz buluruz. Bulunamazsa konu SALT OKUNUR açılır (durum/yapay zekâ yok).
  const roadmapId = roadmapParam ?? (map ? roadmaps.find((r) => r.topic_path === map.id)?.id : undefined);
  const roadmap = roadmaps.find((r) => r.id === roadmapId) ?? null;
  // Salt okunur = misafir ya da bu haritayı takip etmeyen kullanıcı: işaretleme ve yapay zekâ yerine tek kayıt satırı
  const readOnly = isGuest || !roadmapId;
  // Takip satırı hâlâ aranıyorsa kayıt satırı yerine iskelet göster (yanlış "seç" çağrısı çıkmasın)
  const lookingUp = !isGuest && !roadmapParam && roadmapsLoading;
  // Durum/ilerleme sorgusu yalnız gerçekten takip edilen haritada atılır
  const progress = useTopicProgress(readOnly ? undefined : roadmapId);
  // Bölüm/harita bitince açılan kutlama (hook erken return'lerden ÖNCE çağrılır)
  const [milestone, setMilestone] = useState<Milestone | null>(null);
  // Kaynak bağlantısı açılamadıysa true; opening çift dokunuşta tarayıcının iki kez açılmasını önler
  const [linkError, setLinkError] = useState(false);
  const [opening, setOpening] = useState(false);

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

  // Harita ya da konu bilinmiyorsa (eski bağlantı, içerik değişmiş olabilir) düz bir hata göster
  if (!map || !found) {
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
    // roadmap yoksa (misafir ya da takip edilmeyen harita) kişisel işaret de yoktur
    roadmap ? personalizationFor(map, roadmap.personalization, toLevelId(roadmap.level), goal) : null;
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

  // Durum seçici seçenekleri: açıklama ekran okuyucuya gider (görünen tek satır aşağıda)
  const statusOptions: SegmentedOption<TopicStatus>[] = STATUS_OPTIONS.map((o) => ({
    id: o.id,
    label: STATUS_STYLE[o.id].label,
    // Simge yok: "Çalışıyorum" 390pt genişlikte simgeyle sığmıyor, kesiliyordu
    accessibilityLabel: `${STATUS_STYLE[o.id].label}. ${o.description}`,
  }));
  const progressFailed = progress.status === 'schema' || progress.status === 'network' || progress.status === 'error';

  return (
    <ThemedView style={styles.container}>
      {screenOptions}
      <SafeAreaView style={styles.flex} edges={['bottom']}>
        <ScrollView style={styles.flex} contentContainerStyle={[styles.content, { padding: gutter }]}>
          <View style={styles.inner}>
            {/* Başlık alanı: çerçevesiz; harita kimliği yalnız üst satırın rengiyle (hue) */}
            <View style={styles.head}>
              <ThemedText type="eyebrow" themeColor={hue.ink}>
                {map.title} · {section.title}
              </ThemedText>
              <ThemedText type="heading" accessibilityRole="header">
                {topic.title}
              </ThemedText>
              {/* Tek satır meta: rozet kutuları yerine nokta ayrımlı metin (işaret açıklaması ekran okuyucuda) */}
              <ThemedText
                type="small"
                themeColor="textSecondary"
                accessibilityLabel={`${MARKER_STYLE[topic.marker].label}. ${MARKER_STYLE[topic.marker].description} ${LEVEL_LABEL[topic.level]}, yaklaşık ${topic.hours} saat`}>
                {MARKER_STYLE[topic.marker].label} · {LEVEL_SHORT[topic.level]} · ~{topic.hours} saat
              </ThemedText>
            </View>

            <ThemedText>{topic.summary}</ThemedText>

            {/* Kişisel işaret: ayrı kutu yok, tek satır (+ varsa bölüm notu küçük metin) */}
            {(focusIndex >= 0 || skipHint || note) && (
              <View style={styles.personal}>
                {focusIndex >= 0 && (
                  <IconLabel emoji="✨" type="smallBold" themeColor="markerInk">
                    {`Senin için öncelikli (${focusIndex + 1}. sırada)`}
                  </IconLabel>
                )}
                {skipHint && (
                  <IconLabel emoji={STATUS_STYLE.skipped.emoji} type="smallBold" themeColor="markerInk">
                    Biliyorsan atlayabilirsin
                  </IconLabel>
                )}
                {note && (
                  <ThemedText type="small" themeColor="textSecondary">
                    {note}
                  </ThemedText>
                )}
              </View>
            )}

            {/* Durum: bu ekranın birincil öğesi (yalnız takip edilen haritada). Seçili duruma tekrar
                dokunmak durumu kaldırır; choose() bunu yapar, Segmented yalnız ipucunu verir (allowDeselect). */}
            {!readOnly && (
              <View style={styles.block}>
                {progress.saveError && <Banner tone="warning">{progress.saveError}</Banner>}
                {progressFailed ? (
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
                  <>
                    <Segmented
                      label="Konu durumu"
                      options={statusOptions}
                      value={current ?? null}
                      allowDeselect
                      onChange={choose}
                    />
                    {/* Seçili durumun kısa açıklaması; seçim yoksa nasıl işaretleneceği */}
                    <ThemedText type="small" themeColor="textSecondary">
                      {STATUS_OPTIONS.find((o) => o.id === current)?.description ?? 'Bu konuda neredesin? Birini seç.'}
                    </ThemedText>
                  </>
                )}
              </View>
            )}

            {/* Sonraki konu durumun hemen altında: işaretledikten sonra ilerlemek için kaydırmak gerekmesin.
                Konu bitince birincil (dolu) olur; aksi halde ikincil. */}
            {next && !readOnly && (
              <Button
                variant={current === 'done' ? 'primary' : 'secondary'}
                icon="➡️"
                label={`Sonraki konu: ${next.title}`}
                accessibilityHint={current === 'done' ? 'Konu bitti, sonraki konuya geç' : undefined}
                onPress={openNext}
              />
            )}

            {/* Kaynaklar: kart yığını değil tek liste; dokununca adı + konu başlığı tarayıcıda aranır */}
            {topic.resources.length > 0 && (
              <View style={styles.block}>
                <SectionHeader title="Kaynaklar" subtitle="Dokununca kaynak tarayıcıda aranır." />
                <ListGroup>
                  {topic.resources.map((r) => (
                    <ListRow
                      key={r.title}
                      icon={RESOURCE_KIND_STYLE[r.kind].emoji}
                      title={r.title}
                      subtitle={RESOURCE_KIND_STYLE[r.kind].label}
                      // "Dışarı aç" simgesi: bu satır uygulamadan çıkar
                      right={<Glyph emoji="↗" size={18} color={theme.textSecondary} />}
                      accessibilityLabel={`${RESOURCE_KIND_STYLE[r.kind].label}: ${r.title}. Tarayıcıda arama açar`}
                      onPress={() => openResource(r.title)}
                    />
                  ))}
                </ListGroup>
                {/* liveRegion: hata sonradan çıkınca ekran okuyucu da duyurur */}
                <View accessibilityLiveRegion="polite">
                  {linkError && <Banner tone="warning">Bağlantı açılamadı. Birazdan tekrar dene.</Banner>}
                </View>
              </View>
            )}

            {/* SALT OKUNUR: durum seçici ve yapay zekâ yerine tek yumuşak satır + tek eylem.
                Misafir kayıt kapısına, oturumlu ama haritayı takip etmeyen kişi seviye adımına gider. */}
            {readOnly && (
              lookingUp ? (
                <Skeleton width="100%" height={52} radius={Radius.lg} />
              ) : (
                <Surface tone="soft">
                  <ThemedText type="smallBold">
                    {isGuest
                      ? 'İlerlemeni kaydetmek ve yapay zekâ araçlarını kullanmak için ücretsiz hesap oluştur.'
                      : 'İlerlemeni kaydetmek ve yapay zekâ araçlarını kullanmak için bu haritayı seç.'}
                  </ThemedText>
                  <Button
                    label={isGuest ? 'Ücretsiz hesap oluştur' : 'Bu haritayı seç'}
                    onPress={() => {
                      if (!isGuest) {
                        router.push({ pathname: '/onboarding', params: { map: map.id } });
                        return;
                      }
                      requireAuth(
                        { type: 'open-topic', mapId: map.id, topicId: topic.id },
                        'İlerlemeni kaydetmek ve yapay zekâ araçlarını kullanmak için ücretsiz hesap oluştur'
                      );
                    }}
                  />
                </Surface>
              )
            )}
            {next && readOnly && (
              <Button variant="secondary" icon="➡️" label={`Sonraki konu: ${next.title}`} onPress={openNext} />
            )}

            {/* Yapay zekâ: tek alan, üç sekme. Durum + kaynaklardan hemen sonra gelir (kaydırmadan bulunur).
                key: "Sonraki konu"ya geçince önceki konunun cevapları kalmasın */}
            {!readOnly && (
              <TopicAssist
                key={topic.id}
                map={map}
                section={section}
                topic={topic}
                level={roadmap ? toLevelId(roadmap.level) : undefined}
              />
            )}

            {/* Proje konularında: bitirdiğin projeyi Topluluk vitrinine ekleme bağlantısı (vitrin giriş ister) */}
            {!readOnly && (topic.id.startsWith('project') || topic.id.startsWith('portfolio')) && (
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
  head: { gap: Spacing.one },
  personal: { gap: Spacing.half },
  block: { gap: Spacing.two },
  problem: { flex: 1, justifyContent: 'center', gap: Spacing.three },
});
