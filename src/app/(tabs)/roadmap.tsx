import { Link, router } from 'expo-router';
import { useCallback, useEffect, useMemo, useState, type ReactNode } from 'react';
import { Modal, Pressable, ScrollView, StyleSheet, View } from 'react-native';
import Animated, { FadeIn, useReducedMotion } from 'react-native-reanimated';
import { useSafeAreaInsets } from 'react-native-safe-area-context';

import { Glyph, IconLabel } from '@/components/icon';
import { Banner } from '@/components/banner';
import { Button } from '@/components/button';
import { FriendsTodayCard } from '@/components/community/friends-today-card';
import { UsernameForm } from '@/components/community/username-gate';
import { ListRow } from '@/components/list-row';
import { ProgressBar, remainingLabel } from '@/components/progress-summary';
import { RoadmapCatalog } from '@/components/roadmap-catalog';
import { RoadmapTree, TreeLegend } from '@/components/roadmap-tree';
import { ScreenHeader } from '@/components/screen-header';
import { SectionHeader } from '@/components/section-header';
import { Skeleton } from '@/components/skeleton';
import { StatusDot, type StatusDotKind } from '@/components/status-dot';
import { Surface } from '@/components/surface';
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
import { LEVELS } from '@/constants/onboarding';
import { findOption, isAnswerId, weeklyLabel } from '@/constants/roadmap-questions';
import { Border, Fonts, MaxContentWidth, MinTouch, Radius, Spacing } from '@/constants/theme';
import { HUES, LEVEL_STYLE, MARKER_STYLE, STATUS_STYLE } from '@/constants/visuals';
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
      <ScreenHeader title="Keşfet" />
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
        <EmptyState title="Henüz bir yol haritası seçmedin." />
      </TabScreen>
    );
  }

  const map = getRoadmap(roadmap.topic_path);
  if (!map) {
    // Eski sürümde seçilmiş genel bir konu (spor, finans…): artık yazılımcı haritaları var
    return (
      <TabScreen>
        {header}
        <EmptyState title="Seçtiğin harita artık yok. Yazılımcı haritalarından birini seç." />
      </TabScreen>
    );
  }

  return (
    <TabScreen>
      {/* Başlık bloğu: selam + "…" menüsü, hemen altında altı çizili harita sekmeleri ("+ Ekle" de burada) */}
      <RoadmapHeader key={nameVersion} menu={{ roadmap, map }}>
        {roadmaps.length > 0 && <MapTabs roadmaps={roadmaps} activeId={roadmap.id} onSelect={activate} />}
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
        right={
          menu ? (
            <Pressable
              onPress={() => setMenuOpen(true)}
              accessibilityRole="button"
              accessibilityLabel="Harita seçenekleri"
              style={({ pressed }) => [styles.moreButton, pressed && { backgroundColor: theme.backgroundElement }]}>
              <Glyph emoji="⋯" size={24} color={theme.textSecondary} />
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
            <View style={[styles.sheetDot, { backgroundColor: theme[hue.line] }]} />
            <View style={styles.flex1}>
              <ThemedText type="eyebrow" themeColor={hue.ink}>
                {KIND_LABEL[map.kind]}
              </ThemedText>
              <ThemedText type="cardTitle">{map.title}</ThemedText>
            </View>
          </View>
          <View style={styles.sheetMeta}>
            <IdentityLine roadmap={roadmap} />
          </View>
          <View style={[styles.divider, { backgroundColor: theme.border }]} />
          <ListRow
            icon="🎯"
            title="Planımı güncelle"
            chevron
            onPress={() =>
              go(() => router.push({ pathname: '/roadmap-questions', params: { roadmapId: roadmap.id } }))
            }
          />
          <View style={[styles.divider, { backgroundColor: theme.border }]} />
          <ListRow
            icon="⚙"
            title="Harita ayarları"
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
          map={map}
          next={next}
          task={task}
          taskDone={taskDone}
          onOpenNext={() => next && openTopic(roadmap, next.id)}
          onOpenTask={() => task && openTopic(roadmap, task.topicId)}
        />
      )}

      {/* Kutusuz üç istatistik: konu, seri, XP; dokununca ayrıntılar (haftalık hedef, seviye…) */}
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

// Kısa harita adı (sekme için): "Frontend Geliştirici" → "Frontend", "Test (QA) Mühendisi" → "Test (QA)".
// Başlığın kendisi değişmez; yalnız sekmede yer açmak için rol son eki atılır.
function shortTitle(title: string): string {
  return title.replace(/\s+(Geliştirici|Mühendisi|Uzmanı)$/, '');
}

// Haritalar arası geçiş: altı çizili sekmeler. Her sekmede harita rengi küçük noktayla, sonda "+ Ekle".
// Yatay kaydırılır (çok harita takip edilirse); çizgi sekmelerin altında tam genişlikte uzanır.
function MapTabs({
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
      contentContainerStyle={[styles.tabsRow, { borderBottomColor: theme.border }]}
      accessibilityRole="tablist"
      accessibilityLabel="Takip ettiğin haritalar">
      {roadmaps.map((r) => {
        const m = getRoadmap(r.topic_path);
        if (!m) return null;
        const active = r.id === activeId;
        return (
          <Pressable
            key={r.id}
            onPress={() => !active && onSelect(r.id)}
            accessibilityRole="tab"
            accessibilityState={{ selected: active }}
            accessibilityLabel={`${m.title}${active ? ', şu an açık' : ', geçmek için dokun'}`}
            style={[styles.tab, { borderBottomColor: active ? theme.accent : 'transparent' }]}>
            <View style={[styles.tabDot, { backgroundColor: theme[HUES[m.hue].line] }]} />
            <ThemedText
              type={active ? 'defaultSemiBold' : 'default'}
              themeColor={active ? 'text' : 'textSecondary'}
              style={styles.tabText}>
              {shortTitle(m.title)}
            </ThemedText>
          </Pressable>
        );
      })}
      {/* Link asChild yerine router.push: Link'in içine (Slot) stil DİZİSİ verilirse expo-router web'de hata fırlatır */}
      <Pressable
        onPress={() => router.push('/onboarding')}
        accessibilityRole="button"
        accessibilityLabel="Yeni harita ekle"
        style={[styles.tab, { borderBottomColor: 'transparent' }]}>
        <ThemedText themeColor="textSecondary" style={styles.tabText}>
          + Ekle
        </ThemedText>
      </Pressable>
    </ScrollView>
  );
}

// Üç kutusuz istatistik: büyük Bricolage rakam + küçük etiket (konu, seri, XP). Dokununca ayrıntılar açılır
// (haftalık hedef, seviye ilerlemesi, seri koruyucu, arkadaşların bugün, kalan süre, harita kimliği); ekran uzamaz.
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
      <View style={styles.stats}>
        {[0, 1, 2].map((i) => (
          <View key={i} style={styles.stat}>
            <Skeleton width="60%" height={26} />
            <Skeleton width="40%" height={14} />
          </View>
        ))}
      </View>
    );
  }

  return (
    <View>
      <Pressable
        onPress={() => setOpen((o) => !o)}
        accessibilityRole="button"
        accessibilityState={{ expanded: open }}
        accessibilityLabel={`${sum.done} / ${sum.total} konu tamamlandı. Seri: ${streak} gün. Seviye ${level.title}, ${xp.total} XP. Bu hafta ${week.hours} / ${week.target} saat. ${open ? 'Ayrıntıları gizlemek' : 'Ayrıntılar'} için dokun.`}
        style={({ pressed }) => [styles.stats, pressed && styles.nowPressed]}>
        <View style={styles.stat}>
          <ThemedText style={styles.statValue}>
            {sum.done}
            <ThemedText type="defaultSemiBold" themeColor="textSecondary" style={styles.statTotal}>
              {`/${sum.total}`}
            </ThemedText>
          </ThemedText>
          <ThemedText type="small" themeColor="textSecondary">
            konu
          </ThemedText>
        </View>
        <View style={styles.stat}>
          <ThemedText style={styles.statValue} themeColor={streak > 0 ? 'markerInk' : 'text'}>
            {`${streak} gün`}
          </ThemedText>
          <ThemedText type="small" themeColor="textSecondary">
            seri
          </ThemedText>
        </View>
        <View style={styles.stat}>
          <ThemedText style={styles.statValue}>{xp.total}</ThemedText>
          <ThemedText type="small" themeColor="textSecondary">
            XP
          </ThemedText>
        </View>
        <View style={open ? styles.chevronOpen : styles.chevronClosed}>
          <Glyph emoji="›" size={20} color={theme.textSecondary} />
        </View>
      </Pressable>

      {open && (
        <Animated.View entering={FadeIn.duration(150)} style={[styles.summaryDetail, { borderTopColor: theme.border }]}>
          {/* Sayı ve çubuk yukarıdaki istatistikte var; burada yalnız kalan süre */}
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
                <ProgressBar ratio={week.ratio} color={weekDone ? theme.accent : theme.marker} />
              </View>
              <View style={styles.weekBlock}>
                <ThemedText type="small" themeColor="textSecondary">
                  {level.next ? `${level.next.title} seviyesi için ${level.next.remaining} XP kaldı` : 'En yüksek seviyedesin.'}
                </ThemedText>
                <ProgressBar ratio={level.progress} color={theme.marker} />
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
    </View>
  );
}

// "Şimdi" kartı: ekrandaki tek birincil öğe (backgroundElement zemin, 14 köşe).
//  - Mercan noktalı "Şimdi · Bölüm" etiketi, konu adı, özet ve tam genişlik mürekkep "Konuya devam et" butonu.
//  - Altta ince çizgiyle ayrılmış "Günün görevi: … · +30 XP ›" satırı (görev tamamsa tek satır onay).
//  - Sıradaki konu yoksa (hepsi bitti) görev kartın ana içeriği olur.
function NowCard({
  map,
  next,
  task,
  taskDone,
  onOpenNext,
  onOpenTask,
}: {
  map: DevRoadmap;
  next: Topic | undefined;
  task: DailyTask | null;
  taskDone: boolean;
  onOpenNext: () => void;
  onOpenTask: () => void;
}) {
  const theme = useTheme();
  const reduceMotion = useReducedMotion();

  const taskText = task ? taskTitle(task) : '';
  // Etiketteki bölüm adı: sıradaki konunun bölümü
  const sectionTitle = next ? map.sections.find((s) => s.topics.some((t) => t.id === next.id))?.title : undefined;

  // Görev satırı: yapılacaksa dokunulur; tamamsa yalnız onay (yarın yeni görev bilgisi ekran okuyucuda)
  const taskRow =
    next && task ? (
      taskDone ? (
        <View
          style={[styles.taskRow, { borderTopColor: theme.borderEdge }]}
          accessible
          accessibilityLabel="Günün görevi tamam, artı 30 XP. Yarın yeni görev seni bekliyor.">
          <Glyph emoji="✅" size={18} color={theme.accentInk} />
          <ThemedText type="small" style={styles.flex1}>
            Günün görevi tamam
          </ThemedText>
          <ThemedText type="smallBold" themeColor="markerInk" style={styles.xpTag}>
            +30 XP
          </ThemedText>
        </View>
      ) : (
        <Pressable
          onPress={onOpenTask}
          accessibilityRole="button"
          accessibilityLabel={`Günün görevi: ${taskText}. Artı 30 XP. Açmak için dokun.`}
          style={({ pressed }) => [styles.taskRow, { borderTopColor: theme.borderEdge }, pressed && styles.nowPressed]}>
          <ThemedText type="small" style={styles.flex1} numberOfLines={2}>
            {`Günün görevi: ${taskText}`}
          </ThemedText>
          <ThemedText type="smallBold" themeColor="markerInk" style={styles.xpTag}>
            +30 XP
          </ThemedText>
          <Glyph emoji="›" size={18} color={theme.textSecondary} />
        </Pressable>
      )
    ) : null;

  return (
    // Görev sonradan (async) geldiği için yumuşakça belirir; hareketi azalt açıksa animasyon yok
    <Animated.View entering={reduceMotion ? undefined : FadeIn.duration(150)}>
      <Surface tone="primary" style={styles.nowCard}>
        <View style={styles.nowTexts}>
          <View style={styles.nowEyebrow}>
            <View style={[styles.eyebrowDot, { backgroundColor: theme.marker }]} />
            <ThemedText type="eyebrow" themeColor="markerInk" style={[styles.flex1, styles.eyebrowText]} numberOfLines={1}>
              {next ? `Şimdi · ${sectionTitle ?? 'sıradaki konu'}` : 'Şimdi · günün görevi'}
            </ThemedText>
          </View>
          <ThemedText type="cardTitle" accessibilityRole="header">
            {next ? next.title : taskText}
          </ThemedText>
          {next && (
            <ThemedText themeColor="textSecondary" style={styles.nowSummary} numberOfLines={2}>
              {next.summary}
            </ThemedText>
          )}
        </View>
        {next ? (
          <Button
            label="Konuya devam et"
            onPress={onOpenNext}
            accessibilityLabel={`Sıradaki konu: ${next.title}. Konuya devam et`}
          />
        ) : (
          <Button label="Göreve başla" onPress={onOpenTask} accessibilityLabel={`Günün görevi: ${taskText}. Artı 30 XP`} />
        )}
        {taskRow}
      </Surface>
    </Animated.View>
  );
}

// "Harita" bölümü: roadmap.sh'teki ağacın dikey hali. Başlık satırında tek bağlantı-geçiş:
// "Ağaç görünümü" ↔ "Liste görünümü". Liste görünümünde her bölüm açılıp kapanır; sıradaki konunun
// bölümü ve ilk bölüm açık başlar.
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
      <SectionHeader
        title="Harita"
        action={{
          label: view === 'tree' ? 'Liste görünümü' : 'Ağaç görünümü',
          underline: true,
          onPress: () => setView(view === 'tree' ? 'list' : 'tree'),
        }}
      />
      {view === 'tree' && <TreeLegend />}
      {view === 'tree' && (
        <RoadmapTree
          map={map}
          statuses={statuses}
          personalization={personalization}
          planIds={planIds}
          nextId={nextId}
          onOpenTopic={(id) => openTopic(roadmap, id)}
        />
      )}
      {view === 'list' && (
        <View>
          {map.sections.map((section) => (
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
      )}
    </View>
  );
}

// Liste görünümünde bir bölüm: üstte ince çizgi, başlık satırı ("Bitti" ya da "2/5"); açıksa 4px ilerleme
// çubuğu, (varsa) kişisel not ve noktalı konu satırları. Kutu yok: her şey düz, çizgiyle ayrılır.
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
    <View style={[styles.block, { borderTopColor: theme.border }]}>
      <Pressable
        onPress={onToggle}
        accessibilityRole="button"
        accessibilityState={{ expanded: open }}
        accessibilityLabel={`${section.title}. ${inPlan.length} konunun ${done} tanesi bitti. ${open ? 'Kapatmak' : 'Açmak'} için dokun.`}
        style={styles.blockHead}>
        <ThemedText type="defaultSemiBold" style={styles.flex1}>
          {section.title}
        </ThemedText>
        <ThemedText type="small" themeColor="textSecondary" style={styles.blockCount}>
          {inPlan.length === 0 ? 'planında yok' : complete ? 'Bitti' : `${done}/${inPlan.length}`}
        </ThemedText>
      </Pressable>

      {open && (
        <Animated.View entering={FadeIn.duration(150)} style={styles.blockBody}>
          {inPlan.length > 0 && <ProgressBar ratio={done / inPlan.length} />}
          {/* Kişisel bölüm notu: kutusuz, simgesiz, nötr küçük yazı (mercan yalnız durum/XP içindir) */}
          {note && (
            <ThemedText type="small" themeColor="textSecondary">
              {note}
            </ThemedText>
          )}
          <View>
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
          </View>
        </Animated.View>
      )}
    </View>
  );
}

// Konu satırı: durum noktası + ad. Nokta: bitti = dolu mürekkep, çalışıyorum / sıradaki = dolu mercan,
// başlanmadı = halka, isteğe bağlı / alternatif = kesikli halka. Küçük alt satır yalnız ekstra bilgi varsa.
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
  const kind: StatusDotKind =
    status === 'done'
      ? 'done'
      : status === 'in_progress' || (!status && isNext)
        ? 'doing'
        : topic.marker !== 'core'
          ? 'optional'
          : 'todo';

  // Alt satır: isteğe bağlı/alternatif adı, kişisel işaretler, atlandıysa "Atladım" (nokta bunu anlatmaz)
  const tags: string[] = [];
  if (topic.marker !== 'core') tags.push(MARKER_STYLE[topic.marker].label);
  if (focus && !status) tags.push('Önce bununla başla');
  if (skipHint && !status) tags.push('Biliyorsan atlayabilirsin');
  if (status === 'skipped') tags.push(STATUS_STYLE.skipped.label);
  const personal = (focus || skipHint) && !status;

  const stateLabel = status ? STATUS_STYLE[status].label : isNext ? 'Sıradaki konu' : 'Başlanmadı';
  const strong = kind === 'doing';
  const muted = status === 'done' || status === 'skipped';

  return (
    <Pressable
      onPress={onPress}
      accessibilityRole="button"
      accessibilityLabel={`${topic.title}. ${[stateLabel, ...tags.filter((t) => t !== stateLabel)].join(', ')}. ${topic.hours} saat. Ayrıntılar için dokun.`}
      style={({ pressed }) => [styles.topicRow, pressed && styles.nowPressed]}>
      <StatusDot kind={kind} />
      <View style={styles.flex1}>
        <ThemedText
          type={strong ? 'defaultSemiBold' : 'default'}
          themeColor={muted ? 'textSecondary' : 'text'}
          style={[styles.topicTitle, status === 'skipped' && styles.strike]}>
          {topic.title}
        </ThemedText>
        {tags.length > 0 && (
          <ThemedText type="small" themeColor={personal ? 'markerInk' : 'textSecondary'}>
            {tags.join(' · ')}
          </ThemedText>
        )}
      </View>
    </Pressable>
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
    </View>
  );
}

// Boş durum: tek cümle + tek eylem
function EmptyState({ title }: { title: string }) {
  return (
    <View style={styles.empty}>
      <ThemedText type="cardTitle" style={styles.centerText}>
        {title}
      </ThemedText>
      <Link href="/onboarding" asChild>
        <Button label="Yol haritanı seç" />
      </Link>
    </View>
  );
}

const styles = StyleSheet.create({
  flex1: { flex: 1, minWidth: 0 },
  errorBox: { gap: Spacing.three },
  // Başlık bloğu: başlık ile harita sekmeleri arası dar (tek blok gibi okunsun)
  headBlock: { gap: Spacing.one },
  moreButton: { width: MinTouch, height: MinTouch, borderRadius: Radius.pill, alignItems: 'center', justifyContent: 'center' },
  // Harita sekmeleri: altı çizili, çizgi tam genişlikte
  tabsRow: { flexGrow: 1, gap: Spacing.four - Spacing.one, borderBottomWidth: Border.thin },
  tab: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: Spacing.two,
    minHeight: MinTouch,
    borderBottomWidth: 2,
    marginBottom: -1,
  },
  tabDot: { width: 8, height: 8, borderRadius: 4 },
  tabText: { fontSize: 15, lineHeight: 22 },
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
  sheetDot: { width: 10, height: 10, borderRadius: 5 },
  sheetMeta: { paddingHorizontal: Spacing.three, paddingVertical: Spacing.two },
  divider: { height: Border.thin },
  // Bilgi şeridi (kullanıcı adı): tek satır, dokununca açılır
  stripRow: { flexDirection: 'row', alignItems: 'center', gap: Spacing.two, paddingHorizontal: Spacing.three, minHeight: MinTouch },
  stripBody: { gap: Spacing.three, paddingHorizontal: Spacing.three, paddingBottom: Spacing.three },
  chevronOpen: { transform: [{ rotate: '90deg' }] },
  chevronClosed: { transform: [{ rotate: '0deg' }] },
  // İstatistikler: kutusuz, üç eşit sütun + sağda ok
  stats: { flexDirection: 'row', alignItems: 'center', gap: Spacing.three, minHeight: MinTouch },
  stat: { flex: 1, minWidth: 0, gap: Spacing.half },
  statValue: { fontFamily: Fonts.displayBold, fontSize: 22, lineHeight: 28 },
  statTotal: { fontSize: 15, lineHeight: 28 },
  summaryDetail: { gap: Spacing.three, paddingTop: Spacing.three, marginTop: Spacing.two, borderTopWidth: Border.thin },
  weekBlock: { gap: Spacing.two },
  weekRow: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center' },
  // "Şimdi" kartı
  nowCard: { padding: 18, gap: 14, borderRadius: Radius.lg },
  nowTexts: { gap: Spacing.one },
  nowEyebrow: { flexDirection: 'row', alignItems: 'center', gap: Spacing.two },
  eyebrowDot: { width: 8, height: 8, borderRadius: 4 },
  eyebrowText: { fontFamily: Fonts.sansBold },
  nowSummary: { fontSize: 15, lineHeight: 21 },
  nowPressed: { opacity: 0.7 },
  taskRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 10,
    paddingTop: 12,
    borderTopWidth: Border.thin,
    minHeight: MinTouch,
  },
  xpTag: { flexShrink: 0 },
  // Harita bölümü
  sections: { gap: Spacing.three },
  block: { borderTopWidth: Border.thin },
  blockHead: { flexDirection: 'row', alignItems: 'center', gap: Spacing.three, minHeight: 52 },
  blockCount: { flexShrink: 0 },
  blockBody: { gap: Spacing.two, paddingBottom: Spacing.three },
  topicRow: { flexDirection: 'row', alignItems: 'center', gap: Spacing.three, minHeight: MinTouch, paddingVertical: Spacing.one },
  topicTitle: { fontSize: 15, lineHeight: 22 },
  strike: { textDecorationLine: 'line-through' },
  empty: { alignItems: 'center', gap: Spacing.four, paddingVertical: Spacing.five },
  centerText: { textAlign: 'center' },
});
