import { Link } from 'expo-router';
import { StyleSheet, View } from 'react-native';
import Animated, { FadeIn, FadeInDown, ZoomIn, useReducedMotion } from 'react-native-reanimated';

import { Banner } from '@/components/banner';
import { Button } from '@/components/button';
import { IconTile } from '@/components/icon-tile';
import { LevelBadge, StatusChip } from '@/components/level-badge';
import { RoadmapStepList, StepListSkeleton } from '@/components/roadmap-step-list';
import { ScreenHeader } from '@/components/screen-header';
import { Skeleton } from '@/components/skeleton';
import { TabScreen } from '@/components/tab-screen';
import { ThemedText } from '@/components/themed-text';
import { findOption, isAnswerId, QUESTIONS, weeklyLabel } from '@/constants/roadmap-questions';
import { summarizeSteps, type WeeklyHoursId } from '@/constants/roadmap-templates';
import { Border, Edge, Radius, Spacing } from '@/constants/theme';
import { describeTopic } from '@/constants/visuals';
import { useLatestRoadmap } from '@/hooks/use-latest-roadmap';
import { useRoadmapSteps } from '@/hooks/use-roadmap-steps';
import { useShadow, useTheme } from '@/hooks/use-theme';
import { ERROR_TEXT } from '@/lib/supabase-errors';

export default function RoadmapScreen() {
  // Veri okuma (useFocusEffect ile her odakta tazeleme) ortak hook'larda:
  // src/hooks/use-latest-roadmap.ts (yol haritası) ve src/hooks/use-roadmap-steps.ts (adımlar)
  const { roadmap, loading } = useLatestRoadmap();
  const { steps, status, retrying, retry } = useRoadmapSteps(roadmap?.id);

  if (loading) {
    return (
      <TabScreen>
        <ScreenHeader title="Yol Haritam" emoji="🗺️" hue="accent" />
        <JourneySkeleton />
        <StepListSkeleton />
      </TabScreen>
    );
  }

  if (!roadmap) {
    return (
      <TabScreen>
        <ScreenHeader title="Yol Haritam" emoji="🗺️" hue="accent" />
        <EmptyState />
      </TabScreen>
    );
  }

  // Cevap sütunları migration uygulanmadan `undefined` gelebilir, eski kayıtlarda NULL'dır:
  // yalnız GEÇERLİ bir seçenek kimliği varsa kullanırız.
  const weekly = isAnswerId('weeklyHours', roadmap.weekly_hours) ? (roadmap.weekly_hours as WeeklyHoursId) : null;
  const plan =
    weekly && isAnswerId('goal', roadmap.goal) && isAnswerId('learningStyle', roadmap.learning_style)
      ? [
          weeklyLabel(roadmap.weekly_hours),
          `Hedef: ${findOption('goal', roadmap.goal)?.title}`,
          `Yöntem: ${findOption('learningStyle', roadmap.learning_style)?.title}`,
        ].join(' · ')
      : null;

  // Özet sayılar HER ZAMAN adımlardan türetilir (kaydedilmez): adımlar değişse de doğru kalır.
  const summary =
    status === 'ready' && steps.length > 0
      ? summarizeSteps(
          steps.map((s) => ({ estimatedHours: s.estimated_hours })),
          weekly ?? '3-5'
        )
      : null;

  // "Boş" ile "hata" ayrı dallar: hatada "Adımlarımı oluştur" ASLA gösterilmez (yanlış yönlendirir)
  const noSteps = status === 'ready' && steps.length === 0;

  return (
    <TabScreen>
      <ScreenHeader title="Yol Haritam" emoji="🗺️" hue="accent" />

      {/* Adım yokken asıl eylem "Adımlarını oluştur"dur: kartın ÜSTÜNDE durur, ilk ekranda görünür */}
      {noSteps && <StepsCtaCard roadmapId={roadmap.id} />}

      <JourneyCard
        topicPath={roadmap.topic_path}
        level={roadmap.level}
        plan={plan}
        summary={summary}
        // hafta özeti yalnız haftalık süre biliniyorsa gösterilir (tahmini hafta ona bağlı)
        showWeeks={weekly !== null}
        summaryLoading={status === 'loading'}
      />

      {status === 'loading' && <StepListSkeleton />}

      {(status === 'schema' || status === 'network' || status === 'error') && (
        <View style={styles.errorBox}>
          <Banner tone="warning">
            {status === 'schema' ? ERROR_TEXT.loadSchema : status === 'network' ? ERROR_TEXT.network : ERROR_TEXT.other}
          </Banner>
          <Button variant="secondary" icon="🔄" label="Tekrar dene" loading={retrying} onPress={retry} />
        </View>
      )}

      {status === 'ready' && steps.length > 0 && (
        <>
          <View style={styles.stepsSection}>
            <ThemedText type="cardTitle" accessibilityRole="header">
              Adımların
            </ThemedText>
            <RoadmapStepList steps={steps} />
          </View>
          {/* İşaretleme henüz yok: dürüstçe "yakında" denir, sahte ilerleme çubuğu yok */}
          <ThemedText type="small" themeColor="textSecondary" style={styles.soon}>
            🔒 Adımları işaretlemek yakında
          </ThemedText>
        </>
      )}

      {/* İkincil eylem en sonda: konu değiştirmek nadir bir iş, uzun listenin önüne geçmesin */}
      <Link href="/onboarding" asChild>
        <Button variant="text" icon="🧭" label="Konunu değiştir" />
      </Link>
    </TabScreen>
  );
}

type Summary = { count: number; totalHours: number; weeks: number };

// Yolculuk kartı: konu, konu yolu, seviye, (varsa) plan ve adım özeti. İlerleme yüzdesi/halkası YOK:
// böyle bir veri henüz yok.
function JourneyCard({
  topicPath,
  level,
  plan,
  summary,
  showWeeks,
  summaryLoading,
}: {
  topicPath: string;
  level: string;
  plan: string | null;
  summary: Summary | null;
  showWeeks: boolean;
  summaryLoading: boolean;
}) {
  const theme = useTheme();
  const shadow = useShadow();
  const reduceMotion = useReducedMotion();

  // Bilinmeyen/bozuk yol gelirse çökmek yerine varsayılan görünüm ve genel başlık kullanılır
  const { title, parents, category, hue } = describeTopic(topicPath);

  return (
    <View
      style={[
        styles.card,
        { backgroundColor: theme.card, borderColor: theme[hue.line], borderBottomColor: theme[hue.edge] },
        shadow('card'),
      ]}>
      <View style={[styles.band, { backgroundColor: theme[hue.soft] }]}>
        {/* "Bayrak dikme": ikon yaylanarak belirir, 📍 yukarıdan düşer */}
        <View>
          <Animated.View entering={reduceMotion ? FadeIn.duration(150) : ZoomIn.springify().damping(10)}>
            <IconTile emoji={category.emoji} tone={category.hue} size={64} />
          </Animated.View>
          <Animated.Text
            allowFontScaling={false}
            entering={
              reduceMotion
                ? FadeIn.duration(150)
                : FadeInDown.delay(250).springify().damping(8).stiffness(200)
            }
            style={styles.pin}>
            📍
          </Animated.Text>
        </View>
        <View style={styles.bandTexts}>
          <ThemedText type="eyebrow" themeColor={hue.ink}>
            Konun
          </ThemedText>
          <ThemedText type="heading">{title}</ThemedText>
          {/* Konu yolu bantta başlığın altında: kartı kısaltır, ayrı satır gerekmez */}
          {parents !== '' && (
            <ThemedText type="small" themeColor={hue.ink}>
              {parents}
            </ThemedText>
          )}
        </View>
      </View>

      <View style={styles.body}>
        {/* Seviye rozeti ve plan yan yana (dar ekranda alt alta sarar). Plan = kullanıcının KENDİ
            cevapları; eski kayıtta cevap yoksa hiç çizilmez. Bilinmeyen seviyede rozet çizilmez. */}
        <View style={styles.meta}>
          <LevelBadge levelId={level} size="md" />
          {plan !== null && (
            <ThemedText type="small" style={styles.planText}>
              {plan}
            </ThemedText>
          )}
        </View>
        {summaryLoading && (
          // Yüklenirken çiplerin yerini tutar: içerik gelince kart zıplamasın
          <View style={styles.chips}>
            <Skeleton width={80} height={28} radius={Radius.pill} />
            <Skeleton width={130} height={28} radius={Radius.pill} />
            <Skeleton width={130} height={28} radius={Radius.pill} />
          </View>
        )}
        {summary && (
          <Animated.View entering={FadeIn.delay(reduceMotion ? 0 : 450)}>
            {/* Üç çip tek öğe olarak okunur; tek tek okunmaları gürültü olurdu */}
            <View
              accessible
              accessibilityLabel={
                `${summary.count} adım, yaklaşık ${summary.totalHours} saat` +
                (showWeeks ? `, yaklaşık ${summary.weeks} hafta` : '')
              }
              style={styles.chips}>
              <StatusChip tone="neutral" emoji="🧭" label={`${summary.count} adım`} />
              <StatusChip tone="neutral" emoji="⏱" label={`yaklaşık ${summary.totalHours} saat`} />
              {showWeeks && <StatusChip tone="neutral" emoji="📅" label={`yaklaşık ${summary.weeks} hafta`} />}
            </View>
          </Animated.View>
        )}
      </View>
    </View>
  );
}

// Yol haritası var ama adımı yok (soru akışından önce oluşmuş kayıt ya da yarım kalmış kurulum):
// kullanıcıyı aynı soru ekranına, mevcut kaydın id'siyle gönderir. Kilitli kart DEĞİL, aktif eylem.
function StepsCtaCard({ roadmapId }: { roadmapId: string }) {
  const theme = useTheme();
  return (
    <Animated.View
      entering={FadeInDown.duration(280)}
      style={[styles.cta, { backgroundColor: theme.accentSoft, borderColor: theme.accent }]}>
      <View style={styles.ctaTop}>
        <IconTile emoji="🥾" tone="accent" size={64} />
        <View style={styles.bandTexts}>
          <ThemedText type="cardTitle">Adımlarını oluşturalım</ThemedText>
          <ThemedText type="small" themeColor="textSecondary">
            {QUESTIONS.length} kısa soruyu yanıtla, sana özel adımlar hazırlansın.
          </ThemedText>
        </View>
      </View>
      <Link href={{ pathname: '/roadmap-questions', params: { roadmapId } }} asChild>
        <Button label="Adımlarımı oluştur" />
      </Link>
    </Animated.View>
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

function EmptyState() {
  return (
    <View style={styles.empty}>
      <IconTile emoji="🗺️" tone="accent" size={96} />
      <ThemedText type="heading" style={styles.centerText}>
        Henüz bir konu seçmedin.
      </ThemedText>
      <ThemedText themeColor="textSecondary" style={styles.centerText}>
        Başlamak için ilk konunu seç.
      </ThemedText>
      <Link href="/onboarding" asChild>
        <Button label="Konunu seç" />
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
  bandTexts: { flex: 1, minWidth: 0, gap: Spacing.one },
  // 📍 ikonun sağ üst köşesinde, hafif taşarak durur
  pin: { position: 'absolute', top: -10, right: -8, fontSize: 28, lineHeight: 34 },
  body: { padding: Spacing.three, gap: Spacing.three },
  meta: { flexDirection: 'row', flexWrap: 'wrap', alignItems: 'center', gap: Spacing.two },
  planText: { flex: 1, minWidth: 120 },
  soon: { marginTop: Spacing.three },
  chips: { flexDirection: 'row', flexWrap: 'wrap', gap: Spacing.two },
  cta: { borderWidth: Border.thick, borderRadius: Radius.lg, padding: Spacing.three, gap: Spacing.three },
  ctaTop: { flexDirection: 'row', alignItems: 'center', gap: Spacing.three },
  stepsSection: { gap: Spacing.three },
  errorBox: { gap: Spacing.three },
  empty: { alignItems: 'center', gap: Spacing.three, paddingVertical: Spacing.five },
  centerText: { textAlign: 'center' },
});
