import { Link, router } from 'expo-router';
import { useCallback, useEffect, useMemo, useState, type ReactNode } from 'react';
import { Modal, Pressable, ScrollView, StyleSheet, useWindowDimensions, View } from 'react-native';
import Animated, { FadeIn, useReducedMotion } from 'react-native-reanimated';
import { useSafeAreaInsets } from 'react-native-safe-area-context';

import { Glyph, IconLabel } from '@/components/icon';
import { Segmented } from '@/components/segmented';
import { Banner } from '@/components/banner';
import { Button } from '@/components/button';
import { FriendsTodayCard } from '@/components/community/friends-today-card';
import { UsernameForm } from '@/components/community/username-gate';
import { IconTile } from '@/components/icon-tile';
import { ListGroup, ListRow } from '@/components/list-row';
import { ProgressSummary, remainingLabel } from '@/components/progress-summary';
import { RoadmapCatalog } from '@/components/roadmap-catalog';
import { RoadmapTree, TreeLegend } from '@/components/roadmap-tree';
import { ScreenHeader } from '@/components/screen-header';
import { SectionHeader } from '@/components/section-header';
import { Skeleton } from '@/components/skeleton';
import { Surface } from '@/components/surface';
import { TabScreen } from '@/components/tab-screen';
import { ThemedText } from '@/components/themed-text';
import { DEV_ROADMAPS, getRoadmap, KIND_LABEL, type DevRoadmap, type Section, type Topic } from '@/constants/dev-roadmaps';
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
import { LEVELS } from '@/constants/onboarding';
import { findOption, isAnswerId, weeklyLabel } from '@/constants/roadmap-questions';
import { Border, MaxContentWidth, MinTouch, Radius, Spacing } from '@/constants/theme';
import { HUES, LEVEL_STYLE, MARKER_STYLE, STATUS_STYLE, type Hue } from '@/constants/visuals';
import { useActivity, type Activity } from '@/hooks/use-activity';
import { useFirstMapRedirect } from '@/hooks/use-first-map-redirect';
import { useLatestRoadmap, type Roadmap } from '@/hooks/use-latest-roadmap';
import { useTheme } from '@/hooks/use-theme';
import { useTopicProgress } from '@/hooks/use-topic-progress';
import { useUsername } from '@/hooks/use-username';
import { getTodayTask, taskTitle, type DailyTask } from '@/lib/daily-task';
import { useXp } from '@/lib/xp';
import { setPreferences, usePreferences, type MapViewPref } from '@/lib/preferences';
import { useAuth } from '@/lib/auth-context';
import { ERROR_TEXT } from '@/lib/supabase-errors';

// Konu detayını açar. Harita kimliği de gönderilir: detay ekranı içeriği veritabanına gitmeden bulur.
function openTopic(roadmap: Roadmap, topicId: string) {
  router.push({ pathname: '/topic/[id]', params: { id: topicId, map: roadmap.topic_path, roadmapId: roadmap.id } });
}

// Haftalık süre + hedef cümlesi ("Haftada 3-5 saat · Hedef: İş ve kariyer"); eski kayıtta yoksa null
function planText(roadmap: Roadmap): string | null {
  if (!isAnswerId('weeklyHours', roadmap.weekly_hours) || !isAnswerId('goal', roadmap.goal)) return null;
  return [weeklyLabel(roadmap.weekly_hours), `Hedef: ${findOption('goal', roadmap.goal)?.title}`].join(' · ');
}

// Harita kimliği tek satırda: "Orta seviye · Haftada 3-5 saat · Hedef: İş". Eski JourneyCard'ın seviye + plan bilgisi.
// Ayrı kart olmaktan çıktı; özet satırının ayrıntısında ve "…" menüsünde bu satır görünür.
function IdentityLine({ roadmap }: { roadmap: Roadmap }) {
  const level = LEVELS.find((l) => l.id === roadmap.level);
  const plan = planText(roadmap);
  const parts = [level ? `${level.title} seviye` : null, plan].filter((x): x is string => Boolean(x));
  if (parts.length === 0) return null;
  const emoji = (roadmap.level && LEVEL_STYLE[roadmap.level]?.emoji) || '🧭';
  return <IconLabel emoji={emoji}>{parts.join(' · ')}</IconLabel>;
}

// Oturum yoksa kişisel veri sorguları (haritalar, XP, ilerleme) hiç atılmaz: misafir ekranı ayrı bileşen.
// Ayrı bileşen olmasının nedeni hook kuralı: hook'lar koşula bağlı çağrılamaz.
export default function RoadmapScreen() {
  const { session } = useAuth();
  return session ? <MemberRoadmapScreen /> : <GuestRoadmapScreen />;
}

// MİSAFİR: "Keşfet". Yol Haritam sekmesinin yerinde harita kataloğu durur; bir haritaya dokununca
// herkese açık önizleme (/map/<id>) açılır. Kişisel veri sorgusu yok.
function GuestRoadmapScreen() {
  return (
    <TabScreen>
      <View style={{ gap: Spacing.one }}>
        <ScreenHeader title="Keşfet" emoji="🧭" hue="accent" />
        <ThemedText themeColor="textSecondary">
          {`${DEV_ROADMAPS.length} yol haritasına hesap açmadan göz at.`}
        </ThemedText>
      </View>
      <RoadmapCatalog onSelect={(id) => router.push({ pathname: '/map/[id]', params: { id } })} />
    </TabScreen>
  );
}

function MemberRoadmapScreen() {
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

  // Harita yokken ("…" menüsü ve harita değiştirici anlamsız) yalın başlık
  const header = <RoadmapHeader key={nameVersion} />;

  if (loading) {
    return (
      <TabScreen>
        {header}
        <RoadmapSkeleton />
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
    // Eski sürümde seçilmiş genel bir konu (spor, finans…): artık yazılımcı haritaları var
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
      {/* Başlık bloğu: selam + "…" menüsü, hemen altında harita değiştirici ("Harita ekle" de burada) */}
      <RoadmapHeader key={nameVersion} menu={{ roadmap, map }}>
        {roadmaps.length > 0 && <MapSwitcher roadmaps={roadmaps} activeId={roadmap.id} onSelect={activate} />}
      </RoadmapHeader>
      {/* Kullanıcı adı yoksa (kayıtta ad seçilmeyen eski hesaplar) tek satırlık şerit olarak bir kez sorulur */}
      <NamePrompt onSaved={onNameSaved} />
      {/* key: harita değişince içteki açık/kapalı bölüm durumu sıfırdan başlasın */}
      <MapView key={roadmap.id} roadmap={roadmap} map={map} progress={progress} activity={activity} />
    </TabScreen>
  );
}

// Başlık + selamlama (+ varsa "…" menüsü ve altında children: harita değiştirici).
// Ayrı bileşen: ad değişince key ile yeniden kurulup adı tazeler.
function RoadmapHeader({
  menu,
  children,
}: {
  menu?: { roadmap: Roadmap; map: DevRoadmap };
  children?: ReactNode;
}) {
  const theme = useTheme();
  const { username } = useUsername();
  const [menuOpen, setMenuOpen] = useState(false);
  const greeting = username ? `Merhaba, @${username}` : undefined;

  return (
    <View style={styles.headBlock}>
      <ScreenHeader
        title="Yol Haritam"
        eyebrow={greeting}
        emoji="🗺️"
        hue="accent"
        right={
          menu ? (
            <Pressable
              onPress={() => setMenuOpen(true)}
              accessibilityRole="button"
              accessibilityLabel="Harita seçenekleri"
              style={({ pressed }) => [styles.moreButton, pressed && { backgroundColor: theme.backgroundElement }]}>
              <Glyph emoji="⋯" size={24} color={theme.text} />
            </Pressable>
          ) : undefined
        }
      />
      {children}
      {menu && <MapMenu visible={menuOpen} onClose={() => setMenuOpen(false)} roadmap={menu.roadmap} map={menu.map} />}
    </View>
  );
}

// "…" menüsü: alttan açılan sayfa. Üstte harita kimliği (eski Yolculuk kartının içeriği), altında iki eylem.
// Modal Expo Go'da hazır gelir (yeni paket gerekmez); Android geri tuşu onRequestClose ile kapatır.
function MapMenu({
  visible,
  onClose,
  roadmap,
  map,
}: {
  visible: boolean;
  onClose: () => void;
  roadmap: Roadmap;
  map: DevRoadmap;
}) {
  const theme = useTheme();
  const insets = useSafeAreaInsets();
  const hue = HUES[map.hue];

  // Önce sayfayı kapat, sonra git: geri dönünce menü açık kalmasın
  function go(action: () => void) {
    onClose();
    action();
  }

  return (
    <Modal visible={visible} transparent animationType="fade" onRequestClose={onClose}>
      <View style={styles.sheetRoot}>
        {/* Boş alana dokununca kapanır */}
        <Pressable
          onPress={onClose}
          accessibilityRole="button"
          accessibilityLabel="Menüyü kapat"
          style={[StyleSheet.absoluteFill, styles.scrim]}
        />
        <View style={[styles.sheet, { backgroundColor: theme.card, paddingBottom: insets.bottom + Spacing.three }]}>
          <View style={styles.sheetIdentity}>
            <IconTile emoji={map.emoji} tone={map.hue} size={48} />
            <View style={styles.flex1}>
              <ThemedText type="eyebrow" themeColor={hue.ink}>
                {KIND_LABEL[map.kind]}
              </ThemedText>
              <ThemedText type="cardTitle">{map.title}</ThemedText>
              <ThemedText type="small" themeColor="textSecondary">
                {map.tagline}
              </ThemedText>
            </View>
          </View>
          <View style={styles.sheetMeta}>
            <IdentityLine roadmap={roadmap} />
          </View>
          <View style={[styles.divider, { backgroundColor: theme.border }]} />
          <ListRow
            icon="🎯"
            title="Planımı güncelle"
            subtitle="Soruları yeniden cevapla; öncelikli konular yenilensin"
            chevron
            onPress={() =>
              go(() => router.push({ pathname: '/roadmap-questions', params: { roadmapId: roadmap.id } }))
            }
          />
          <View style={[styles.divider, { backgroundColor: theme.border }]} />
          <ListRow
            icon="⚙"
            title="Harita ayarları"
            subtitle="Haritalarım, görünüm ve hesap"
            chevron
            onPress={() => go(() => router.push('/settings'))}
          />
        </View>
      </View>
    </Modal>
  );
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

  const ready = progress.status === 'ready';
  const statuses = progress.statuses;
  const sum = computeProgress(map, statuses, personalization, weekly);
  const next = ready ? nextTopic(map, statuses, personalization) : undefined;

  // Günün görevi burada (MapView'da) yüklenir: "Şimdi" kartında görevle sıradaki konuyu
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

  return (
    <>
      {/* "Şimdi": ekranın TEK birincil kartı. Sıradaki konu + günün görevi tek kartta */}
      {ready && (next || task) && (
        <NowCard
          hue={map.hue}
          next={next}
          task={task}
          taskDone={taskDone}
          personalization={personalization}
          onOpenNext={() => next && openTopic(roadmap, next.id)}
          onOpenTask={() => task && openTopic(roadmap, task.topicId)}
        />
      )}

      {/* Düz özet satırı: ilerleme + seri + XP + haftalık hedef; dokununca ayrıntılar */}
      <SummaryRow
        roadmap={roadmap}
        sum={ready ? sum : null}
        activity={ready ? activity : null}
        weekly={weekly}
      />

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
        <Sections
          roadmap={roadmap}
          map={map}
          statuses={statuses}
          personalization={personalization}
          nextId={next?.id}
        />
      )}
    </>
  );
}

// Kullanıcı adı seçme şeridi. Yeni hesaplar adı kayıtta seçer (veritabanı profile yazar), şerit hiç görünmez.
// Adı olmayan eski hesaplarda bir kez görünür. Kapalıyken tek satır; dokununca form açılır (ayrıntı aşamalı).
function NamePrompt({ onSaved }: { onSaved: () => void }) {
  const theme = useTheme();
  const { username, status } = useUsername();
  const [hidden, setHidden] = useState(false);
  const [open, setOpen] = useState(false);

  if (hidden || status !== 'ready' || username) return null;
  return (
    <Surface tone="soft" hue="accent" padded={false}>
      <Pressable
        onPress={() => setOpen((o) => !o)}
        accessibilityRole="button"
        accessibilityState={{ expanded: open }}
        accessibilityLabel="Kullanıcı adını seç. Arkadaşların seni bu adla bulur."
        style={styles.stripRow}>
        <View style={styles.flex1}>
          <IconLabel emoji="🏷" type="smallBold" themeColor="accentInk" iconSize={16}>
            Kullanıcı adını seç
          </IconLabel>
        </View>
        <View style={open ? styles.chevronOpen : undefined}>
          <Glyph emoji="›" size={20} color={theme.accentInk} />
        </View>
      </Pressable>
      {open && (
        <View style={styles.stripBody}>
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
      )}
    </Surface>
  );
}

// Haritalar arası geçiş: tek satır. Açık harita yumuşak renkli zeminde, diğerleri düz yazı; kenarlık yok.
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
            style={[styles.mapChip, { backgroundColor: active ? theme[hue.soft] : 'transparent' }]}>
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
        style={styles.mapChip}>
        <Glyph emoji="➕" size={16} color={theme.accentInk} />
        <ThemedText type="smallBold" themeColor="accentInk">
          Harita ekle
        </ThemedText>
      </Pressable>
    </ScrollView>
  );
}

// Düz özet satırı: "N / M konu" + çubuk, altında seri · seviye/XP · haftalık hedef. Dokununca ayrıntılar
// (seviye ilerlemesi, seri koruyucu, arkadaşların bugün, kalan süre, harita kimliği) açılır; ekran uzamaz.
function SummaryRow({
  roadmap,
  sum,
  activity,
  weekly,
}: {
  roadmap: Roadmap;
  sum: { done: number; total: number; remainingHours: number; weeks: number } | null;
  activity: Activity | null;
  weekly: WeeklyHoursId;
}) {
  const theme = useTheme();
  const xp = useXp();
  const [open, setOpen] = useState(false);
  // 320 px'te üç istatistik tek satıra sığmaz: "gün seri" kısalır ("2 gün"), boşluk daralır.
  const { width } = useWindowDimensions();
  const narrow = width < 360;

  // Aktif gün: konu işaretlenen günler + XP kazanılan günler (quiz, soru, görev)
  const days = new Set([...(activity?.activeDays ?? []), ...xp.days]);
  const { streak, activeToday, freezeUsedThisWeek } = computeStreak(days);
  const week = weeklyProgress(activity?.doneThisWeekFor(roadmap.id, startOfWeek()) ?? [], weekly);
  const level = levelFor(xp.total);
  const hint = activeToday
    ? 'Bugün çalıştın, serin devam ediyor.'
    : streak > 0
      ? 'Bugün bir şey yap, serin devam etsin.'
      : 'Günün görevini yap, serin başlasın.';
  const weekDone = week.ratio >= 1;

  // Yüklenirken aynı yükseklikte iskelet: içerik gelince sayfa zıplamaz
  if (!sum) {
    return (
      <Surface tone="plain">
        <Skeleton width="40%" height={16} />
        <Skeleton width="100%" height={8} radius={Radius.pill} />
        <Skeleton width="80%" height={14} />
      </Surface>
    );
  }

  return (
    <Surface tone="plain" padded={false} style={styles.summary}>
      <Pressable
        onPress={() => setOpen((o) => !o)}
        accessibilityRole="button"
        accessibilityState={{ expanded: open }}
        accessibilityLabel={`${sum.done} / ${sum.total} konu tamamlandı. Seri: ${streak} gün. Seviye ${level.title}, ${xp.total} XP. Bu hafta ${week.hours} / ${week.target} saat. ${open ? 'Ayrıntıları gizlemek' : 'Ayrıntılar'} için dokun.`}
        style={({ pressed }) => [styles.summaryMain, pressed && { backgroundColor: theme.backgroundElement }]}>
        <View style={styles.summaryTop}>
          <View style={styles.flex1}>
            <ProgressSummary done={sum.done} total={sum.total} remainingHours={sum.remainingHours} compact />
          </View>
          <View style={open ? styles.chevronOpen : styles.chevronClosed}>
            <Glyph emoji="›" size={20} color={theme.textSecondary} />
          </View>
        </View>
        {activity && (
          <View style={[styles.stats, narrow && styles.statsNarrow]}>
            <IconLabel
              emoji={streak > 0 ? '🔥' : '🌱'}
              type="smallBold"
              themeColor={streak > 0 ? 'coralInk' : 'textSecondary'}
              iconSize={16}>
              {narrow ? `${streak} gün` : `${streak} gün seri`}
            </IconLabel>
            {/* Seviye adı özet satırında yer kaplayıp üçüncü istatistiği alt satıra itiyordu: yalnız XP kalır,
                seviye adı Profil'de ve ayrıntıda ("… seviyesi için N XP kaldı") görünür */}
            <IconLabel emoji={level.emoji} type="small" iconSize={16}>
              {`${xp.total} XP`}
            </IconLabel>
            {/* Hedef tamamsa kutlama simgesi */}
            <IconLabel
              emoji={weekDone ? '🎉' : '📅'}
              type="small"
              themeColor={weekDone ? 'accentInk' : 'text'}
              iconSize={16}>
              {`${week.hours} / ${week.target} sa`}
            </IconLabel>
          </View>
        )}
      </Pressable>

      {open && (
        <Animated.View entering={FadeIn.duration(150)} style={[styles.summaryDetail, { borderTopColor: theme.border }]}>
          <ThemedText type="small" themeColor="textSecondary">
            {remainingLabel(sum.done, sum.total, sum.remainingHours, sum.weeks)}
          </ThemedText>
          <IdentityLine roadmap={roadmap} />
          {activity && (
            <>
              <View style={styles.weekBlock}>
                <View style={styles.weekRow}>
                  <ThemedText type="small" themeColor="textSecondary">
                    Bu haftanın hedefi
                  </ThemedText>
                  <ThemedText type="smallBold">
                    {week.hours} / {week.target} saat
                  </ThemedText>
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
            </>
          )}
        </Animated.View>
      )}
    </Surface>
  );
}

// "Şimdi" kartı: ekrandaki tek birincil (3D) öğe, harita renginde.
//  - Sıradaki konu her zaman ana satır.
//  - Günün görevi AYNI konuya götürüyorsa kartta rozet; farklıysa ayırıcıyla ikinci satır (ayrı kart değil).
//  - Görev tamamsa küçük onay satırı.
function NowCard({
  hue,
  next,
  task,
  taskDone,
  personalization,
  onOpenNext,
  onOpenTask,
}: {
  hue: Hue;
  next: Topic | undefined;
  task: DailyTask | null;
  taskDone: boolean;
  personalization: Personalization;
  onOpenNext: () => void;
  onOpenTask: () => void;
}) {
  const theme = useTheme();
  const reduceMotion = useReducedMotion();
  const family = HUES[hue];

  // Rozet yalnız "başla" görevi sıradaki konuyla aynıysa: quiz/bitir görevi başka bir iş olduğu için kendi satırında kalır
  const sameTopic = !!task && !taskDone && task.kind === 'start' && !!next && task.topicId === next.id;
  const showTaskRow = !!task && !sameTopic;
  const taskText = task ? taskTitle(task) : '';
  const focusIndex = next ? personalization.focus.indexOf(next.id) : -1;
  const aiPick = focusIndex >= 0 && personalization.source === 'ai';

  const nextRow = next && (
    <Pressable
      onPress={onOpenNext}
      accessibilityRole="button"
      accessibilityLabel={`Sıradaki konu: ${next.title}.${sameTopic ? ' Günün görevi, +30 XP.' : ''} Açmak için dokun.`}
      style={({ pressed }) => [styles.nowRow, pressed && styles.nowPressed]}>
      <Glyph emoji="🥾" size={28} color={theme[family.ink]} />
      <View style={styles.flex1}>
        {aiPick ? (
          <IconLabel emoji="✨" type="eyebrow" themeColor={family.ink} iconSize={12}>
            Şimdi · senin için seçildi
          </IconLabel>
        ) : (
          <ThemedText type="eyebrow" themeColor={family.ink}>
            Şimdi · sıradaki konu
          </ThemedText>
        )}
        <ThemedText type="cardTitle">{next.title}</ThemedText>
        <ThemedText type="small" themeColor="textSecondary" numberOfLines={2}>
          {next.summary}
        </ThemedText>
        {sameTopic && (
          // Rozet: durum rengi (marker) yalnız burada; kenarlıksız küçük hap
          <View style={[styles.badge, { backgroundColor: theme.markerSoft }]}>
            <IconLabel emoji="🎯" type="eyebrow" themeColor="markerInk" iconSize={12}>
              Günün görevi · +30 XP
            </IconLabel>
          </View>
        )}
      </View>
      <Glyph emoji="›" size={22} color={theme[family.ink]} />
    </Pressable>
  );

  // Görev satırı: yapılacaksa dokunulur; tamamsa yalnız küçük onay
  const taskRow =
    showTaskRow &&
    (taskDone ? (
      <View style={styles.doneRow} accessible accessibilityLabel="Günün görevi tamam, artı 30 XP. Yarın yeni görev seni bekliyor.">
        <Glyph emoji="✅" size={20} color={theme.accentInk} />
        <View style={styles.flex1}>
          <ThemedText type="smallBold" themeColor="accentInk">
            Günün görevi tamam · +30 XP
          </ThemedText>
          <ThemedText type="small" themeColor="textSecondary">
            Yarın yeni görev seni bekliyor.
          </ThemedText>
        </View>
      </View>
    ) : (
      <Pressable
        onPress={onOpenTask}
        accessibilityRole="button"
        accessibilityLabel={`Günün görevi: ${taskText}. Açmak için dokun.`}
        style={({ pressed }) => [styles.nowRow, pressed && styles.nowPressed]}>
        <Glyph emoji="🎯" size={28} color={theme.markerInk} />
        <View style={styles.flex1}>
          <ThemedText type="eyebrow" themeColor="markerInk">
            {next ? 'Günün görevi · +30 XP' : 'Şimdi · günün görevi · +30 XP'}
          </ThemedText>
          <ThemedText type={next ? 'smallBold' : 'cardTitle'}>{taskText}</ThemedText>
        </View>
        <Glyph emoji="›" size={22} color={theme.markerInk} />
      </Pressable>
    ));

  return (
    // Görev sonradan (async) geldiği için yumuşakça belirir; hareketi azalt açıksa animasyon yok
    <Animated.View entering={reduceMotion ? undefined : FadeIn.duration(150)}>
      <Surface tone="primary" hue={hue}>
        {nextRow}
        {nextRow && taskRow && <View style={[styles.divider, { backgroundColor: theme[family.line] }]} />}
        {taskRow}
      </Surface>
    </Animated.View>
  );
}

// "Harita" bölümü: roadmap.sh'teki ağacın dikey hali. Başlık satırında Ağaç/Liste anahtarı.
// Liste görünümünde her bölüm açılıp kapanır; sıradaki konunun bölümü ve ilk bölüm açık başlar.
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
  // Görünüm: "Ağaç" (roadmap.sh gibi) ya da "Liste" (açılır bölümler). Seçim cihazda hatırlanır
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
      <View style={styles.mapHead}>
        <View style={styles.flex1}>
          <SectionHeader title="Harita" />
        </View>
        <ViewSwitch value={view} onChange={setView} />
      </View>
      {view === 'tree' && <TreeLegend />}
      {view === 'tree' && (
        <RoadmapTree
          map={map}
          statuses={statuses}
          personalization={personalization}
          nextId={nextId}
          onOpenTopic={(id) => openTopic(roadmap, id)}
        />
      )}
      {view === 'list' &&
        map.sections.map((section) => (
          <SectionBlock
            key={section.id}
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

// Ağaç / Liste görünüm anahtarı: ortak Segmented bileşeni (içeriği kadar geniş)
function ViewSwitch({ value, onChange }: { value: 'tree' | 'list'; onChange: (v: 'tree' | 'list') => void }) {
  return (
    <Segmented
      fill={false}
      label="Görünüm"
      value={value}
      onChange={onChange}
      options={[
        { id: 'tree', label: 'Ağaç', icon: '🗺️', accessibilityLabel: 'Ağaç görünümü' },
        { id: 'list', label: 'Liste', icon: '☰', accessibilityLabel: 'Liste görünümü' },
      ]}
    />
  );
}

// Liste görünümünde bir bölüm: başlık satırı + (açıksa) not satırı + ListGroup konu satırları.
// Eskiden bölüm kartının içinde kenarlıklı konu kutuları vardı (kart içinde kart); şimdi kutu yok,
// konular tek düz grupta ince ayırıcıyla dizilir.
function SectionBlock({
  section,
  open,
  onToggle,
  statuses,
  personalization,
  planIds,
  nextId,
  onOpenTopic,
}: {
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
    <View style={styles.block}>
      <Pressable
        onPress={onToggle}
        accessibilityRole="button"
        accessibilityState={{ expanded: open }}
        accessibilityLabel={`${section.title}. ${inPlan.length} konunun ${done} tanesi bitti. ${open ? 'Kapatmak' : 'Açmak'} için dokun.`}
        style={styles.blockHead}>
        {/* Bölüm tamamsa onay simgesi (bölüm kutlamasının sakin hali) */}
        <Glyph
          emoji={complete ? '✅' : section.emoji}
          size={20}
          color={complete ? theme.accent : theme.textSecondary}
        />
        <View style={styles.flex1}>
          <ThemedText type="cardTitle">{section.title}</ThemedText>
          <ThemedText type="small" themeColor="textSecondary">
            {inPlan.length > 0 ? `${done} / ${inPlan.length} konu` : `${section.topics.length} konu · planında yok`}
          </ThemedText>
        </View>
        <View style={open ? styles.chevronOpen : styles.chevronClosed}>
          <Glyph emoji="›" size={20} color={theme.textSecondary} />
        </View>
      </Pressable>

      {open && (
        <Animated.View entering={FadeIn.duration(150)} style={styles.blockBody}>
          {/* Kişisel bölüm notu: kutusuz tek bilgi satırı */}
          {note && (
            <IconLabel emoji="✨" themeColor="markerInk">
              {note}
            </IconLabel>
          )}
          <ListGroup>
            {section.topics.map((topic) => {
              const status = statuses.get(topic.id);
              const focus = personalization.focus.includes(topic.id);
              const skipHint = personalization.skip.includes(topic.id);

              // Etiketler alt satırda: sıradaki + harita işareti (önerilen konularda gösterilmez, varsayılan odur)
              // + kişisel işaretler + durum
              const tags: string[] = [];
              if (topic.id === nextId) tags.push('Sıradaki konu');
              if (topic.marker !== 'core') tags.push(MARKER_STYLE[topic.marker].label);
              if (focus && !status) tags.push('Önce bununla başla');
              if (skipHint && !status) tags.push('Biliyorsan atlayabilirsin');
              if (status) tags.push(STATUS_STYLE[status].label);

              return (
                <ListRow
                  key={topic.id}
                  icon={status ? STATUS_STYLE[status].emoji : '○'}
                  title={topic.title}
                  subtitle={tags.length > 0 ? tags.join(' · ') : undefined}
                  right={
                    <ThemedText type="small" themeColor="textSecondary">
                      {topic.hours} sa
                    </ThemedText>
                  }
                  accessibilityLabel={`${topic.title}. ${tags.join(', ')}. ${topic.hours} saat. Ayrıntılar için dokun.`}
                  onPress={() => onOpenTopic(topic.id)}
                />
              );
            })}
          </ListGroup>
        </Animated.View>
      )}
    </View>
  );
}

// Yüklenirken aynı düzende iskelet: içerik gelince sayfa zıplamaz
function RoadmapSkeleton() {
  return (
    <View accessible accessibilityLabel="Yükleniyor" accessibilityState={{ busy: true }} style={styles.sections}>
      <Surface tone="soft">
        <Skeleton width="40%" height={14} />
        <Skeleton width="70%" height={24} />
        <Skeleton width="90%" height={14} />
      </Surface>
      <Surface tone="plain">
        <Skeleton width="40%" height={16} />
        <Skeleton width="100%" height={8} radius={Radius.pill} />
      </Surface>
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
  flex1: { flex: 1, minWidth: 0, gap: Spacing.half },
  errorBox: { gap: Spacing.three },
  // Başlık bloğu: başlık ile harita değiştirici arası dar (tek satır gibi okunsun)
  headBlock: { gap: Spacing.one },
  moreButton: { width: MinTouch, height: MinTouch, borderRadius: Radius.pill, alignItems: 'center', justifyContent: 'center' },
  switcher: { gap: Spacing.one, paddingVertical: Spacing.half },
  mapChip: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: Spacing.one,
    minHeight: MinTouch,
    paddingHorizontal: Spacing.three,
    borderRadius: Radius.pill,
  },
  // "…" menüsü (alt sayfa)
  sheetRoot: { flex: 1, justifyContent: 'flex-end' },
  // Perde rengi tema dışı ama koyu/açık fark etmez (milestone-celebration ile aynı kalıp)
  scrim: { backgroundColor: 'rgba(0,0,0,0.4)' },
  sheet: {
    width: '100%',
    maxWidth: MaxContentWidth,
    alignSelf: 'center',
    borderTopLeftRadius: Radius.xl,
    borderTopRightRadius: Radius.xl,
    paddingTop: Spacing.three,
  },
  sheetIdentity: { flexDirection: 'row', alignItems: 'center', gap: Spacing.three, paddingHorizontal: Spacing.three },
  sheetMeta: { paddingHorizontal: Spacing.three, paddingVertical: Spacing.two },
  divider: { height: Border.thin },
  // Bilgi şeridi (kullanıcı adı): tek satır, dokununca açılır
  stripRow: { flexDirection: 'row', alignItems: 'center', gap: Spacing.two, paddingHorizontal: Spacing.three, minHeight: MinTouch },
  stripBody: { gap: Spacing.three, paddingHorizontal: Spacing.three, paddingBottom: Spacing.three },
  chevronOpen: { transform: [{ rotate: '90deg' }] },
  chevronClosed: { transform: [{ rotate: '0deg' }] },
  // Özet satırı
  summary: { gap: 0, overflow: 'hidden' },
  summaryMain: { gap: Spacing.two, padding: Spacing.three, minHeight: MinTouch },
  summaryTop: { flexDirection: 'row', alignItems: 'center', gap: Spacing.two },
  stats: { flexDirection: 'row', flexWrap: 'wrap', columnGap: Spacing.three, rowGap: Spacing.one, alignItems: 'center' },
  statsNarrow: { columnGap: Spacing.two },
  summaryDetail: { gap: Spacing.two, padding: Spacing.three, borderTopWidth: Border.thin },
  weekBlock: { gap: Spacing.one },
  weekRow: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center' },
  weekTrack: { height: 10, borderRadius: Radius.pill, overflow: 'hidden' },
  weekFill: { height: '100%', borderRadius: Radius.pill },
  // "Şimdi" kartı
  nowRow: { flexDirection: 'row', alignItems: 'center', gap: Spacing.three, minHeight: MinTouch },
  nowPressed: { opacity: 0.7 },
  doneRow: { flexDirection: 'row', alignItems: 'center', gap: Spacing.three },
  badge: {
    alignSelf: 'flex-start',
    marginTop: Spacing.one,
    paddingVertical: Spacing.half,
    paddingHorizontal: Spacing.two,
    borderRadius: Radius.pill,
  },
  // Harita bölümü
  sections: { gap: Spacing.three },
  mapHead: { flexDirection: 'row', alignItems: 'center', gap: Spacing.two },
  block: { gap: Spacing.two },
  blockHead: { flexDirection: 'row', alignItems: 'center', gap: Spacing.two, minHeight: MinTouch },
  blockBody: { gap: Spacing.two },
  empty: { alignItems: 'center', gap: Spacing.three, paddingVertical: Spacing.five },
  centerText: { textAlign: 'center' },
});
