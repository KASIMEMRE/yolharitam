import { router, Stack, useLocalSearchParams } from 'expo-router';
import { openBrowserAsync } from 'expo-web-browser';
import { useState } from 'react';
import { Pressable, ScrollView, StyleSheet, useWindowDimensions, View } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';

import { Glyph } from '@/components/icon';
import { Banner } from '@/components/banner';
import { Button } from '@/components/button';
import { ListGroup, ListRow } from '@/components/list-row';
import { LoadError } from '@/components/load-error';
import { type Milestone, MilestoneCelebration } from '@/components/milestone-celebration';
import { SectionHeader } from '@/components/section-header';
import { Segmented, type SegmentedOption } from '@/components/segmented';
import { Skeleton } from '@/components/skeleton';
import { Surface } from '@/components/surface';
import { TopicAssist } from '@/components/topic-assist';
import { ThemedText } from '@/components/themed-text';
import { ThemedView } from '@/components/themed-view';
import { allTopics, findTopic, getRoadmap } from '@/constants/dev-roadmaps';
import { planTopics, type TopicStatus } from '@/constants/dev-roadmaps/personalize';
import { toLevelId } from '@/constants/plan';
import { XP } from '@/constants/xp';
import { Border, MaxContentWidth, MinTouch, Radius, Spacing } from '@/constants/theme';
import { HUES, MARKER_STYLE, RESOURCE_KIND_STYLE, STATUS_STYLE } from '@/constants/visuals';
import { useLatestRoadmap } from '@/hooks/use-latest-roadmap';
import { useTheme } from '@/hooks/use-theme';
import { useTopicProgress } from '@/hooks/use-topic-progress';
import { useAuthGate } from '@/lib/auth-gate';
import { personalizationOf, planProgress } from '@/lib/plan-progress';
import { loadErrorKind } from '@/lib/supabase-errors';
import { awardXp } from '@/lib/xp';

const LEVEL_LABEL = { 1: 'Başlangıç konusu', 2: 'Orta seviye konu', 3: 'İleri seviye konu' } as const;
// Meta satırı için kısa seviye adı
const LEVEL_SHORT = { 1: 'Başlangıç', 2: 'Orta', 3: 'İleri' } as const;

// Durum seçenekleri: seçili olana tekrar dokunmak durumu sıfırlar ("başlanmadı").
// Açıklama ekranda görünmez; yalnız ekran okuyucuya okunur (kontrolün kendisini anlatan cümle yazmıyoruz).
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
  const { roadmaps, loading: roadmapsLoading, failed: roadmapsFailed, retry: retryRoadmaps } = useLatestRoadmap();
  // Konuya haritadan değil önizlemeden gelindiyse roadmapId yoktur; kullanıcı bu haritayı zaten takip
  // ediyorsa satırını kendimiz buluruz. Bulunamazsa konu SALT OKUNUR açılır (durum/yapay zekâ yok).
  const roadmapId = roadmapParam ?? (map ? roadmaps.find((r) => r.topic_path === map.id)?.id : undefined);
  const roadmap = roadmaps.find((r) => r.id === roadmapId) ?? null;
  // Salt okunur = misafir ya da bu haritayı takip etmeyen kullanıcı: işaretleme ve yapay zekâ yerine tek kayıt satırı
  const readOnly = isGuest || !roadmapId;
  // Takip satırı hâlâ aranıyorsa kayıt satırı yerine iskelet göster (yanlış "seç" çağrısı çıkmasın)
  const lookingUp = !isGuest && !roadmapParam && roadmapsLoading;
  // Harita listesi OKUNAMADIYSA "bu haritayı takip etmiyorsun" demek yanlış olur: hata + tekrar dene
  const lookupFailed = !isGuest && !roadmapParam && roadmapsFailed;
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

  // Üst çubuk gizli: geri bağlantısı ("‹ Bölüm adı") sayfanın içinde, başlığın üstünde durur
  const screenOptions = <Stack.Screen options={{ title: found?.section.title ?? 'Konu', headerShown: false }} />;

  // Harita ya da konu bilinmiyorsa (eski bağlantı, içerik değişmiş olabilir) düz bir hata göster
  if (!map || !found) {
    return (
      <ThemedView style={styles.container}>
        {screenOptions}
        <SafeAreaView style={styles.flex} edges={['top', 'bottom']}>
          <View style={[styles.problem, { padding: gutter }]}>
            <Banner tone="warning">Bu konu bulunamadı. Haritana dönüp tekrar dene.</Banner>
            <Button label="Haritama dön" onPress={goBack} />
          </View>
        </SafeAreaView>
      </ThemedView>
    );
  }

  const { topic, section } = found;
  const hue = HUES[map.hue];
  // Yol Haritam ekranıyla AYNI kural (kayıt yoksa seviye kuralları): "bölüm bitti" kararı iki ekranda tutarlı olsun
  const personalization =
    // roadmap yoksa (misafir ya da takip edilmeyen harita) kişisel işaret de yoktur
    roadmap ? personalizationOf(map, roadmap) : null;
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
    // Yüzde de ortak plan sayacından (Yol Haritam ve Ayarlar ile aynı tanım)
    const sum = planProgress(map, roadmap ?? null, after);
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
    // Seçili görünüm: çalışıyorum = mercan, bitti = mürekkep dolgu, atladım = nötr
    tone: o.id === 'in_progress' ? 'marker' : o.id === 'done' ? 'accent' : 'neutral',
    // Simge yok: "Çalışıyorum" 390pt genişlikte simgeyle sığmıyor, kesiliyordu
    accessibilityLabel: `${STATUS_STYLE[o.id].label}. ${o.description}`,
  }));
  const progressFailed = progress.status === 'schema' || progress.status === 'network' || progress.status === 'error';

  return (
    <ThemedView style={styles.container}>
      {screenOptions}
      <SafeAreaView style={styles.flex} edges={['top', 'bottom']}>
        <ScrollView style={styles.flex} contentContainerStyle={[styles.content, { padding: gutter }]}>
          <View style={styles.inner}>
            {/* Geri bağlantısı: bölüm adı. Üst çubuk gizli olduğu için geri yolu burada */}
            <Pressable
              onPress={goBack}
              accessibilityRole="button"
              accessibilityLabel={`Geri dön: ${section.title}`}
              style={styles.back}>
              <View style={styles.backIcon}>
                <Glyph emoji="›" size={20} color={theme.accentInk} strokeWidth={2.25} />
              </View>
              <ThemedText type="defaultSemiBold" themeColor="accentInk" style={styles.backText} numberOfLines={1}>
                {section.title}
              </ThemedText>
            </Pressable>

            {/* Başlık alanı: çerçevesiz; harita kimliği yalnız küçük renk noktası + harita adı */}
            <View style={styles.head}>
              <View style={styles.mapLine}>
                <View style={[styles.mapDot, { backgroundColor: theme[hue.line] }]} />
                <ThemedText type="eyebrow" themeColor={hue.ink} numberOfLines={1} style={styles.flex1}>
                  {map.title}
                </ThemedText>
              </View>
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

            {/* Kişisel işaret: ayrı kutu ve simge yok, düz mercan yazı (+ varsa bölüm notu küçük metin) */}
            {(focusIndex >= 0 || skipHint || note) && (
              <View style={styles.personal}>
                {focusIndex >= 0 && (
                  <ThemedText type="smallBold" themeColor="markerInk">
                    Senin için öncelikli
                  </ThemedText>
                )}
                {skipHint && (
                  <ThemedText type="smallBold" themeColor="textSecondary">
                    Biliyorsan atlayabilirsin
                  </ThemedText>
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
                  <LoadError kind={loadErrorKind(progress.status)} onRetry={progress.retry} />
                ) : !ready ? (
                  <Skeleton width="100%" height={52} radius={Radius.lg} />
                ) : (
                  <>
                    <Segmented
                      label="Konu durumu"
                      variant="buttons"
                      options={statusOptions}
                      value={current ?? null}
                      allowDeselect
                      onChange={choose}
                    />
                  </>
                )}
              </View>
            )}

            {/* Konu bitince "Sonraki konu" birincil düğme olarak durumun hemen altında öne çıkar
                (işaretledikten sonra ilerlemek için kaydırmak gerekmesin). Aksi halde en altta sakin bir satır. */}
            {next && !readOnly && current === 'done' && (
              <Button
                icon="➡️"
                label={`Sonraki konu: ${next.title}`}
                accessibilityHint="Konu bitti, sonraki konuya geç"
                onPress={openNext}
              />
            )}

            {/* Kaynaklar: kart yığını değil tek liste; dokununca adı + konu başlığı tarayıcıda aranır */}
            {topic.resources.length > 0 && (
              <View style={styles.block}>
                <SectionHeader title="Kaynaklar" />
                <ListGroup>
                  {topic.resources.map((r) => (
                    <ListRow
                      key={r.title}
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
              ) : lookupFailed ? (
                <LoadError onRetry={retryRoadmaps} />
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

            {/* Sonraki konu: en altta çizgili satır (konu "Bitti" ise yukarıda birincil düğme olmuştur) */}
            {next && !(current === 'done' && !readOnly) && (
              <Pressable
                onPress={openNext}
                accessibilityRole="button"
                accessibilityLabel={`Sonraki konu: ${next.title}`}
                style={({ pressed }) => [styles.nextRow, { borderTopColor: theme.border }, pressed && styles.pressed]}>
                <View style={styles.flex1}>
                  <ThemedText type="small" themeColor="textSecondary">
                    Sonraki konu
                  </ThemedText>
                  <ThemedText type="defaultSemiBold" style={styles.nextTitle}>
                    {next.title}
                  </ThemedText>
                </View>
                <Glyph emoji="›" size={18} color={theme.textSecondary} />
              </Pressable>
            )}
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
  inner: { width: '100%', maxWidth: MaxContentWidth, gap: 20 },
  head: { gap: Spacing.one },
  flex1: { flex: 1, minWidth: 0 },
  back: { flexDirection: 'row', alignItems: 'center', gap: Spacing.one, minHeight: MinTouch, alignSelf: 'flex-start' },
  // Geri oku: sağ ok simgesi yarım dönüşle sola bakar (ayrı sol ok simgesi eklemeden)
  backIcon: { transform: [{ rotate: '180deg' }] },
  backText: { flexShrink: 1 },
  mapLine: { flexDirection: 'row', alignItems: 'center', gap: Spacing.two },
  mapDot: { width: 8, height: 8, borderRadius: 4 },
  personal: { gap: Spacing.half },
  nextRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: Spacing.three,
    minHeight: 52,
    paddingVertical: Spacing.two,
    borderTopWidth: Border.thin,
  },
  nextTitle: { fontSize: 15, lineHeight: 22 },
  pressed: { opacity: 0.7 },
  block: { gap: Spacing.two },
  problem: { flex: 1, justifyContent: 'center', gap: Spacing.three },
});
