import { Link, router } from 'expo-router';
import { useCallback, useEffect, useMemo, useState } from 'react';
import { Pressable, ScrollView, StyleSheet, Text, View } from 'react-native';
import Animated, { FadeIn, FadeInDown, ZoomIn, useReducedMotion } from 'react-native-reanimated';

import { Glyph , IconLabel } from '@/components/icon';
import { MapPin } from '@/components/map-pin';
import { Banner } from '@/components/banner';
import { Button } from '@/components/button';
import { FriendsTodayCard } from '@/components/community/friends-today-card';
import { UsernameForm } from '@/components/community/username-gate';
import { IconTile } from '@/components/icon-tile';
import { LevelBadge } from '@/components/level-badge';
import { ProgressSummary } from '@/components/progress-summary';
import { RoadmapTree, TreeLegend } from '@/components/roadmap-tree';
import { ScreenHeader } from '@/components/screen-header';
import { Skeleton } from '@/components/skeleton';
import { TabScreen } from '@/components/tab-screen';
import { ThemedText } from '@/components/themed-text';
import { getRoadmap, KIND_LABEL, type DevRoadmap, type Section, type Topic } from '@/constants/dev-roadmaps';
import {
  computeProgress,
  nextTopic,
  personalizationFor,
  planTopics,
  type Personalization,
  type TopicStatus,
} from '@/constants/dev-roadmaps/personalize';
import { computeStreak, startOfWeek, weeklyProgress } from '@/constants/activity';
import { levelFor } from '@/constants/xp';
import { toLevelId, type GoalId, type WeeklyHoursId } from '@/constants/plan';
import { findOption, isAnswerId, weeklyLabel } from '@/constants/roadmap-questions';
import { Border, Edge, MinTouch, Radius, Spacing } from '@/constants/theme';
import { HUES, MARKER_STYLE, STATUS_STYLE } from '@/constants/visuals';
import { useActivity, type Activity } from '@/hooks/use-activity';
import { useFirstMapRedirect } from '@/hooks/use-first-map-redirect';
import { useLatestRoadmap, type Roadmap } from '@/hooks/use-latest-roadmap';
import { useShadow, useTheme } from '@/hooks/use-theme';
import { useTopicProgress } from '@/hooks/use-topic-progress';
import { useUsername } from '@/hooks/use-username';
import { getTodayTask, taskTitle, type DailyTask } from '@/lib/daily-task';
import { useXp } from '@/lib/xp';
import { setPreferences, usePreferences, type MapViewPref } from '@/lib/preferences';
import { ERROR_TEXT } from '@/lib/supabase-errors';

// Konu detayını açar. Harita kimliği de gönderilir: detay ekranı içeriği veritabanına gitmeden bulur.
function openTopic(roadmap: Roadmap, topicId: string) {
  router.push({ pathname: '/topic/[id]', params: { id: topicId, map: roadmap.topic_path, roadmapId: roadmap.id } });
}

export default function RoadmapScreen() {
  // Veri okuma (useFocusEffect ile her odakta tazeleme) ortak hook'larda
  const { roadmap, roadmaps, leftovers, status, loading, failed, retry, activate } = useLatestRoadmap();
  // Yeni kullanıcı (hiç haritası yok): harita seçimi bir kez kendiliğinden açılır (UX-02)
  useFirstMapRedirect(status, roadmaps.length + leftovers.length);
  const activity = useActivity();
  // Hook erken return'lerden ÖNCE çağrılır (hook kuralı)
  const progress = useTopicProgress(roadmap?.id);
  // Ad kaydedilince artar: başlık (kendi useUsername örneği) yeniden kurulup güncel adı okur
  const [nameVersion, setNameVersion] = useState(0);
  // useCallback: kimliği sabit kalsın (gereksiz yeniden çizimi önler)
  const onNameSaved = useCallback(() => setNameVersion((v) => v + 1), []);

  const header = <RoadmapHeader key={nameVersion} />;

  if (loading) {
    return (
      <TabScreen>
        {header}
        <JourneySkeleton />
      </TabScreen>
    );
  }

  // Okuyamadık ≠ haritan yok: hatada "Henüz seçmedin" demeyiz, tekrar denemeyi öneririz
  if (failed) {
    return (
      <TabScreen>
        {header}
        <View style={styles.errorBox}>
          <Banner tone="warning">{ERROR_TEXT.mapsLoadFailed}</Banner>
          <Button variant="secondary" icon="🔄" label="Tekrar dene" onPress={retry} />
        </View>
      </TabScreen>
    );
  }

  if (!roadmap) {
    return (
      <TabScreen>
        {header}
        <NamePrompt onSaved={onNameSaved} />
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
      {/* Birden çok harita takip ediliyorsa üstte hızlı geçiş */}
      {/* Kullanıcı adı yoksa (kayıtta ad seçilmeyen eski hesaplar) kısa bir kartla bir kez sor */}
      <NamePrompt onSaved={onNameSaved} />
      {/* Haritalar arası geçiş + "Harita ekle": harita eklemenin tek yeri burası */}
      {roadmaps.length > 0 && <MapSwitcher roadmaps={roadmaps} activeId={roadmap.id} onSelect={activate} />}
      {/* key: harita değişince içteki açık/kapalı bölüm durumu sıfırdan başlasın */}
      <MapView key={roadmap.id} roadmap={roadmap} map={map} progress={progress} activity={activity} />
    </TabScreen>
  );
}

// Başlık + selamlama. Ayrı bileşen: ad değişince key ile yeniden kurulup adı tazeler.
function RoadmapHeader() {
  const { username } = useUsername();
  const greeting = username ? `Merhaba, @${username}` : undefined;
  return <ScreenHeader title="Yol Haritam" eyebrow={greeting} emoji="🗺️" hue="accent" />;
}

function MapView({
  roadmap,
  map,
  progress,
  activity,
}: {
  roadmap: Roadmap;
  map: DevRoadmap;
  progress: ReturnType<typeof useTopicProgress>;
  activity: Activity | null;
}) {
  const weekly: WeeklyHoursId = isAnswerId('weeklyHours', roadmap.weekly_hours)
    ? (roadmap.weekly_hours as WeeklyHoursId)
    : '3-5';
  const goal: GoalId = isAnswerId('goal', roadmap.goal) ? (roadmap.goal as GoalId) : 'job';
  // Kayıtlı kişisel işaretler; yoksa (eski kayıt) seviyeye göre kurallar
  // useMemo: her render'da yeni nesne üretilirse günün görevi efekti her seferinde yeniden çalışır
  const personalization = useMemo(
    () => personalizationFor(map, roadmap.personalization, toLevelId(roadmap.level), goal),
    [map, roadmap.personalization, roadmap.level, goal]
  );

  const plan =
    isAnswerId('weeklyHours', roadmap.weekly_hours) && isAnswerId('goal', roadmap.goal)
      ? [weeklyLabel(roadmap.weekly_hours), `Hedef: ${findOption('goal', roadmap.goal)?.title}`].join(' · ')
      : null;

  const ready = progress.status === 'ready';
  const statuses = progress.statuses;
  const sum = computeProgress(map, statuses, personalization, weekly);
  const next = ready ? nextTopic(map, statuses, personalization) : undefined;

  // Günün görevi burada (MapView'da) yüklenir: "Şimdi yap" bölgesinde görevle sıradaki konuyu
  // birlikte yönetebilmek için durum üst bileşende durmalı (lifting state up).
  // Görev o gün ilk açılışta belirlenir ve gün boyu sabit kalır (bkz. daily-task.ts).
  const xp = useXp();
  const [task, setTask] = useState<DailyTask | null>(null);
  useEffect(() => {
    if (!ready) return;
    let cancelled = false;
    getTodayTask(roadmap.id, map, statuses, personalization).then((t) => {
      if (!cancelled) setTask(t);
    });
    return () => {
      cancelled = true;
    };
  }, [ready, roadmap.id, map, statuses, personalization]);
  const taskDone = !!task && xp.dailyDoneDays.has(task.day);

  // Sıra kuralı: yapılacak bir "başla" görevi varsa en üstte o; görev bitmişse ya da quiz/bitir türündeyse
  // asıl devam noktası "Sıradaki konu" olur. Görev aynı konuya götürüyorsa ikinci kart gereksiz.
  const dailyFirst = !!task && !taskDone && task.kind === 'start';
  const sameTopic = dailyFirst && !!next && task.topicId === next.id;
  const showNext = !!next && !sameTopic;
  const showDaily = ready && !!task;
  const dailyCard = showDaily && (
    // Üstteki kart 3D kenarını korur, alttaki düz olur; tamamlanmış görev her zaman sade
    <DailyTaskCard
      task={task}
      done={taskDone}
      flat={taskDone || (!dailyFirst && showNext)}
      onPress={() => openTopic(roadmap, task.topicId)}
    />
  );
  const nextCard = ready && showNext && (
    <NextCard
      topic={next}
      personalization={personalization}
      flat={dailyFirst && showDaily}
      onPress={() => openTopic(roadmap, next.id)}
    />
  );

  return (
    <>
      {/* "Şimdi yap" bölgesi: kaydırmadan ilk ekranda, ne yapacağını söyleyen kartlar */}
      {dailyFirst ? (
        <>
          {dailyCard}
          {nextCard}
        </>
      ) : (
        <>
          {nextCard}
          {dailyCard}
        </>
      )}

      <JourneyCard roadmap={roadmap} map={map} plan={plan} sum={ready ? sum : null} />
      {/* Seri + XP + haftalık hedef tek şeritte; arkadaş etkinliği şeridin genişleyen kısmında */}
      {ready && activity && <MomentumStrip activity={activity} roadmapId={roadmap.id} weekly={weekly} />}

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
          <Sections
            roadmap={roadmap}
            map={map}
            statuses={statuses}
            personalization={personalization}
            nextId={next?.id}
          />
        </>
      )}

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
  sum: { done: number; total: number; remainingHours: number; weeks: number } | null;
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
          <Animated.View
            entering={reduceMotion ? FadeIn.duration(150) : FadeInDown.delay(250).springify().damping(8).stiffness(200)}
            style={styles.pin}>
            <MapPin size={26} />
          </Animated.View>
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
        {/* Konu sayısı/süre yalnız burada (ProgressSummary'de): aynı bilgi iki yerde tekrarlanmaz */}
        {sum ? (
          <ProgressSummary done={sum.done} total={sum.total} remainingHours={sum.remainingHours} weeks={sum.weeks} />
        ) : (
          <View style={styles.chips}>
            <Skeleton width="60%" height={16} />
            <Skeleton width="100%" height={12} radius={Radius.pill} />
          </View>
        )}
        {/* Planı yeniden kişiselleştirme (soruları tekrar cevaplama): eskiden sayfanın en altındaydı */}
        <Link href={{ pathname: '/roadmap-questions', params: { roadmapId: roadmap.id } }} asChild>
          <Button variant="secondary" icon="🎯" label="Planımı güncelle" />
        </Link>
      </View>
    </View>
  );
}

// Kullanıcı adı seçme kartı. Yeni hesaplar adı kayıtta seçer (veritabanı profile yazar), kart hiç görünmez.
// Adı olmayan eski hesaplarda bir kez görünür; alan bir öneriyle dolu gelir (bkz. useUsername.suggestion).
function NamePrompt({ onSaved }: { onSaved: () => void }) {
  const theme = useTheme();
  const { username, status } = useUsername();
  const [hidden, setHidden] = useState(false);

  if (hidden || status !== 'ready' || username) return null;
  return (
    <View style={[styles.momentum, { backgroundColor: theme.accentSoft, borderColor: theme.accent }]}>
      <IconLabel emoji="🏷" type="cardTitle" iconSize={18}>
        Kullanıcı adını seç
      </IconLabel>
      <ThemedText type="small" themeColor="textSecondary">
        Uygulamada seni bu ad temsil eder; arkadaşların seni bununla bulur.
      </ThemedText>
      <UsernameForm
        submitLabel="Kaydet"
        onSaved={() => {
          setHidden(true);
          onSaved();
        }}
      />
    </View>
  );
}

// Haritalar arası geçiş: takip ettiğin her harita için bir çip
function MapSwitcher({
  roadmaps,
  activeId,
  onSelect,
}: {
  roadmaps: Roadmap[];
  activeId: string;
  onSelect: (id: string) => void;
}) {
  const theme = useTheme();
  return (
    <ScrollView
      horizontal
      showsHorizontalScrollIndicator={false}
      contentContainerStyle={styles.switcher}
      accessibilityLabel="Takip ettiğin haritalar">
      {roadmaps.map((r) => {
        const m = getRoadmap(r.topic_path);
        if (!m) return null;
        const active = r.id === activeId;
        const hue = HUES[m.hue];
        return (
          <Pressable
            key={r.id}
            onPress={() => !active && onSelect(r.id)}
            accessibilityRole="button"
            accessibilityState={{ selected: active }}
            accessibilityLabel={`${m.title}${active ? ', şu an açık' : ', geçmek için dokun'}`}
            style={[
              styles.mapChip,
              {
                backgroundColor: active ? theme[hue.soft] : theme.card,
                borderColor: active ? theme[hue.line] : theme.border,
              },
            ]}>
            <Glyph emoji={m.emoji} size={16} color={active ? theme[hue.ink] : theme.textSecondary} />
            <ThemedText type="smallBold" themeColor={active ? hue.ink : 'textSecondary'}>
              {m.title}
            </ThemedText>
          </Pressable>
        );
      })}
      {/* Link asChild yerine router.push: Link'in içine (Slot) stil DİZİSİ verilirse expo-router web'de hata fırlatır */}
      <Pressable
        onPress={() => router.push('/onboarding')}
        accessibilityRole="button"
        accessibilityLabel="Yeni harita ekle"
        style={[styles.mapChip, { backgroundColor: theme.card, borderColor: theme.border, borderStyle: 'dashed' }]}>
        <Glyph emoji="➕" size={16} color={theme.textSecondary} />
        <ThemedText type="smallBold" themeColor="textSecondary">
          Harita ekle
        </ThemedText>
      </Pressable>
    </ScrollView>
  );
}

// Motivasyon şeridi: seri, seviye/XP ve haftalık hedef tek bakışta. Dokununca ayrıntılar
// (ipucu, seri koruyucu, XP'ye kalan, arkadaşların) açılır; böylece ekran uzamaz.
function MomentumStrip({ activity, roadmapId, weekly }: { activity: Activity; roadmapId: string; weekly: WeeklyHoursId }) {
  const theme = useTheme();
  const xp = useXp();
  const [open, setOpen] = useState(false);
  // Aktif gün: konu işaretlenen günler + XP kazanılan günler (quiz, soru, görev)
  const days = new Set([...activity.activeDays, ...xp.days]);
  const { streak, activeToday, freezeUsedThisWeek } = computeStreak(days);
  const week = weeklyProgress(activity.doneThisWeekFor(roadmapId, startOfWeek()), weekly);
  const level = levelFor(xp.total);
  const hint = activeToday
    ? 'Bugün çalıştın, serin devam ediyor.'
    : streak > 0
      ? 'Bugün bir şey yap, serin devam etsin.'
      : 'Günün görevini yap, serin başlasın.';
  const weekDone = week.ratio >= 1;

  return (
    <View style={[styles.strip, { backgroundColor: theme.card, borderColor: theme.border }]}>
      <Pressable
        onPress={() => setOpen((o) => !o)}
        accessibilityRole="button"
        accessibilityState={{ expanded: open }}
        accessibilityLabel={`Seviye ${level.title}, ${xp.total} XP. Seri: ${streak} gün. Bu hafta ${week.hours} / ${week.target} saat. ${open ? 'Ayrıntıları gizlemek' : 'Ayrıntılar'} için dokun.`}
        style={({ pressed }) => [styles.stripMain, pressed && { backgroundColor: theme.backgroundSelected }]}>
        <View style={styles.stripRow}>
          {/* Seri */}
          <View style={[styles.streakBadge, { backgroundColor: streak > 0 ? theme.coralSoft : theme.backgroundSelected }]}>
            <Glyph
              emoji={streak > 0 ? '🔥' : '🌱'}
              size={20}
              color={streak > 0 ? theme.coralInk : theme.accentInk}
              fill={streak > 0 ? theme.coralSoft : undefined}
            />
            <ThemedText type="smallBold" themeColor={streak > 0 ? 'coralInk' : 'textSecondary'}>
              {streak} gün
            </ThemedText>
          </View>
          {/* Seviye + XP */}
          <View style={styles.stripLevel}>
            <IconLabel emoji={level.emoji} type="smallBold" iconSize={16}>
              {level.title}
            </IconLabel>
            <ThemedText type="small" themeColor="textSecondary">
              {xp.total} XP
            </ThemedText>
          </View>
          <ThemedText type="smallBold" themeColor="textSecondary">
            {open ? '▴' : '▾'}
          </ThemedText>
        </View>
        {/* Haftalık hedef */}
        <View style={styles.weekBlock}>
          <View style={styles.weekRow}>
            <ThemedText type="small" themeColor="textSecondary">
              Bu haftanın hedefi
            </ThemedText>
            {/* Hedef tamamsa kutlama simgesi; simge yazının içinde değil, IconLabel ile ayrı çizilir */}
            {weekDone ? (
              <IconLabel emoji="🎉" type="smallBold" themeColor="accentInk" iconSize={16}>
                {`${week.hours} / ${week.target} saat`}
              </IconLabel>
            ) : (
              <ThemedText type="smallBold">
                {week.hours} / {week.target} saat
              </ThemedText>
            )}
          </View>
          <View style={[styles.weekTrack, { backgroundColor: theme.backgroundSelected }]}>
            <View
              style={[
                styles.weekFill,
                { width: `${Math.round(week.ratio * 100)}%`, backgroundColor: weekDone ? theme.accent : theme.marker },
              ]}
            />
          </View>
        </View>
      </Pressable>

      {open && (
        <Animated.View entering={FadeIn.duration(150)} style={[styles.stripDetail, { borderTopColor: theme.border }]}>
          <View style={styles.weekBlock}>
            <ThemedText type="small" themeColor="textSecondary">
              {level.next ? `${level.next.title} seviyesi için ${level.next.remaining} XP kaldı` : 'En yüksek seviyedesin.'}
            </ThemedText>
            <View style={[styles.weekTrack, { backgroundColor: theme.backgroundSelected }]}>
              <View style={[styles.weekFill, { width: `${Math.round(level.progress * 100)}%`, backgroundColor: theme.marker }]} />
            </View>
          </View>
          <ThemedText type="small">{hint}</ThemedText>
          <IconLabel emoji="🧊" themeColor="skyInk">
            {freezeUsedThisWeek
              ? 'Bu haftaki seri koruyucun kullanıldı.'
              : 'Seri koruyucu hazır: bu hafta bir gün kaçırsan da serin bozulmaz.'}
          </IconLabel>
          {/* Bugün çalışan arkadaş yoksa bu bileşen hiçbir şey çizmez */}
          <FriendsTodayCard compact />
        </Animated.View>
      )}
    </View>
  );
}

// Günün görevi: tek, küçük bir iş (≈5 dk). Tamamlanınca +30 XP ve seri devam eder.
// Yalnız sunum yapar; görevi MapView yükler. flat: alttaki/tamamlanmış kart düz alt kenarlı (3D yok).
function DailyTaskCard({
  task,
  done,
  flat,
  onPress,
}: {
  task: DailyTask;
  done: boolean;
  flat: boolean;
  onPress: () => void;
}) {
  const theme = useTheme();
  const reduceMotion = useReducedMotion();
  return (
    // Görev sonradan (async) geldiği için yumuşakça belirir; hareketi azalt açıksa animasyon yok
    <Animated.View entering={reduceMotion ? undefined : FadeIn.duration(150)}>
      <Pressable
        onPress={onPress}
        accessibilityRole="button"
        accessibilityLabel={`Günün görevi: ${taskTitle(task)}. ${done ? 'Tamamlandı.' : 'Açmak için dokun.'}`}
        style={({ pressed }) => [
          styles.next,
          flat && styles.nextFlat,
          {
            backgroundColor: done ? theme.accentSoft : theme.markerSoft,
            borderColor: done ? theme.accent : theme.markerEdge,
            borderBottomColor: done ? theme.accentEdge : theme.markerEdge,
          },
          pressed && { transform: [{ translateY: 2 }] },
        ]}>
        <IconTile emoji={done ? '✅' : '🎯'} tone={done ? 'accent' : 'marker'} size={48} />
        <View style={styles.bandTexts}>
          <ThemedText type="eyebrow" themeColor={done ? 'accentInk' : 'markerInk'}>
            {done ? 'Günün görevi tamam · +30 XP' : 'Günün görevi · yaklaşık 5 dk · +30 XP'}
          </ThemedText>
          <ThemedText type="cardTitle">{taskTitle(task)}</ThemedText>
          {done && (
            <ThemedText type="small" themeColor="textSecondary">
              Yarın yeni görev seni bekliyor.
            </ThemedText>
          )}
        </View>
        {!done && (
          <ThemedText type="cardTitle" themeColor="markerInk">
            ›
          </ThemedText>
        )}
      </Pressable>
    </Animated.View>
  );
}

// "Sıradaki konu": tek dokunuşla kaldığın yerden devam
function NextCard({
  topic,
  personalization,
  flat,
  onPress,
}: {
  topic: Topic;
  personalization: Personalization;
  flat: boolean; // günün görevi üstteyse bu kart düz alt kenarlı olur
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
        flat && styles.nextFlat,
        { backgroundColor: theme.accentSoft, borderColor: theme.accent, borderBottomColor: theme.accentEdge },
        pressed && { transform: [{ translateY: 2 }] },
      ]}>
      <IconTile emoji="🥾" tone="accent" size={48} />
      <View style={styles.bandTexts}>
        {focusIndex >= 0 && personalization.source === 'ai' ? (
          <IconLabel emoji="✨" type="eyebrow" themeColor="accentInk" iconSize={12}>
            Sıradaki konu · senin için seçildi
          </IconLabel>
        ) : (
          <ThemedText type="eyebrow" themeColor="accentInk">
            Sıradaki konu
          </ThemedText>
        )}
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
  // Görünüm: "Harita" (roadmap.sh gibi ağaç) ya da "Liste" (açılır bölümler). Seçim cihazda hatırlanır
  // (Ayarlar'daki "Haritanın varsayılan görünümü" ile aynı tercih).
  const { mapView: view } = usePreferences();
  const setView = (v: MapViewPref) => setPreferences({ mapView: v });

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
        <View style={styles.headRow}>
          <ThemedText type="cardTitle" accessibilityRole="header" style={styles.flex1}>
            Harita
          </ThemedText>
          <ViewSwitch value={view} onChange={setView} />
        </View>
        <ThemedText type="small" themeColor="textSecondary">
          Bir konuya dokun: ne olduğunu, kaynaklarını gör ve durumunu işaretle.
        </ThemedText>
        {view === 'tree' && <TreeLegend />}
      </View>
      {view === 'tree' && (
        <RoadmapTree
          map={map}
          statuses={statuses}
          personalization={personalization}
          nextId={nextId}
          onOpenTopic={(id) => openTopic(roadmap, id)}
        />
      )}
      {view === 'list' && map.sections.map((section, index) => (
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

// İki seçenekli anahtar (segmented control)
function ViewSwitch({ value, onChange }: { value: 'tree' | 'list'; onChange: (v: 'tree' | 'list') => void }) {
  const theme = useTheme();
  const options = [
    { id: 'tree' as const, label: 'Harita', icon: '🗺️' },
    { id: 'list' as const, label: 'Liste', icon: '☰' },
  ];
  return (
    <View
      accessibilityRole="radiogroup"
      accessibilityLabel="Görünüm"
      style={[styles.switch, { backgroundColor: theme.backgroundSelected, borderColor: theme.border }]}>
      {options.map((o) => {
        const selected = value === o.id;
        return (
          <Pressable
            key={o.id}
            onPress={() => onChange(o.id)}
            accessibilityRole="radio"
            accessibilityState={{ selected }}
            accessibilityLabel={o.id === 'tree' ? 'Harita görünümü' : 'Liste görünümü'}
            style={[styles.switchItem, selected && { backgroundColor: theme.card, borderColor: theme.accent }]}>
            <IconLabel emoji={o.icon} type="smallBold" themeColor={selected ? 'accentInk' : 'textSecondary'}>
              {o.label}
            </IconLabel>
          </Pressable>
        );
      })}
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
          <Glyph emoji={section.emoji} size={20} color={theme.textSecondary} />
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
                <IconLabel emoji="✨" themeColor="markerInk">
                  {note}
                </IconLabel>
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
  if (focus && !status) tags.push('Önce bununla başla');
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
  pin: { position: 'absolute', top: -12, right: -10 },
  body: { padding: Spacing.three, gap: Spacing.three },
  meta: { flexDirection: 'row', flexWrap: 'wrap', alignItems: 'center', gap: Spacing.two },
  planText: { flex: 1, minWidth: 120 },
  chips: { flexDirection: 'row', flexWrap: 'wrap', gap: Spacing.two },
  errorBox: { gap: Spacing.three },
  switcher: { gap: Spacing.two, paddingVertical: Spacing.half },
  mapChip: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: Spacing.one,
    minHeight: MinTouch,
    paddingHorizontal: Spacing.three,
    borderRadius: Radius.pill,
    borderWidth: Border.thick,
  },
  strip: { borderRadius: Radius.lg, borderWidth: Border.thick, overflow: 'hidden' },
  stripMain: { gap: Spacing.two, padding: Spacing.three, minHeight: MinTouch },
  stripRow: { flexDirection: 'row', alignItems: 'center', gap: Spacing.three },
  stripLevel: { flex: 1, minWidth: 0, flexDirection: 'row', alignItems: 'center', flexWrap: 'wrap', gap: Spacing.two },
  stripDetail: { gap: Spacing.two, padding: Spacing.three, borderTopWidth: Border.thin },
  momentum: { gap: Spacing.three, padding: Spacing.three, borderRadius: Radius.lg, borderWidth: Border.thick },
  streakBadge: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: Spacing.one,
    paddingVertical: Spacing.one,
    paddingHorizontal: Spacing.two,
    borderRadius: Radius.pill,
  },
  weekBlock: { gap: Spacing.one },
  weekRow: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center' },
  weekTrack: { height: 10, borderRadius: Radius.pill, overflow: 'hidden' },
  weekFill: { height: '100%', borderRadius: Radius.pill },
  next: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: Spacing.three,
    padding: Spacing.three,
    borderWidth: Border.thick,
    borderBottomWidth: Border.thick + Edge,
    borderRadius: Radius.lg,
  },
  nextFlat: { borderBottomWidth: Border.thick },
  sections: { gap: Spacing.two },
  sectionsHead: { gap: Spacing.two, marginBottom: Spacing.one },
  headRow: { flexDirection: 'row', flexWrap: 'wrap', alignItems: 'center', gap: Spacing.two },
  flex1: { flex: 1 },
  switch: { flexDirection: 'row', borderRadius: Radius.pill, borderWidth: Border.thin, padding: 2 },
  switchItem: {
    minHeight: MinTouch,
    justifyContent: 'center',
    paddingHorizontal: Spacing.three,
    borderRadius: Radius.pill,
    borderWidth: Border.thick,
    borderColor: 'transparent',
  },
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
  empty: { alignItems: 'center', gap: Spacing.three, paddingVertical: Spacing.five },
  centerText: { textAlign: 'center' },
});
