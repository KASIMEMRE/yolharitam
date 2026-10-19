import { router, Stack, useLocalSearchParams } from 'expo-router';
import { useEffect, useRef, useState } from 'react';
import {
  AccessibilityInfo,
  BackHandler,
  findNodeHandle,
  Pressable,
  ScrollView,
  StyleSheet,
  Text,
  useWindowDimensions,
  View,
} from 'react-native';
import Animated, {
  FadeIn,
  FadeInLeft,
  FadeInRight,
  useAnimatedStyle,
  useReducedMotion,
  useSharedValue,
  withSequence,
  withTiming,
} from 'react-native-reanimated';
import { SafeAreaView } from 'react-native-safe-area-context';

import { Banner } from '@/components/banner';
import { Button } from '@/components/button';
import { Celebration } from '@/components/celebration';
import { IconTile } from '@/components/icon-tile';
import { LevelBadge, StatusChip } from '@/components/level-badge';
import { OptionCard } from '@/components/option-card';
import { Skeleton } from '@/components/skeleton';
import { StepIndicator } from '@/components/step-indicator';
import { ThemedText } from '@/components/themed-text';
import { ThemedView } from '@/components/themed-view';
import { TrailDraw } from '@/components/trail-draw';
import { LEVELS } from '@/constants/onboarding';
import {
  type Answers,
  DEFAULT_ANSWERS,
  findOption,
  QUESTIONS,
} from '@/constants/roadmap-questions';
import { generateRoadmapSteps, toLevelId } from '@/constants/roadmap-templates';
import { Border, MaxContentWidth, Radius, Spacing } from '@/constants/theme';
import { describeTopic } from '@/constants/visuals';
import { useShadow, useTheme } from '@/hooks/use-theme';
import { useAuth } from '@/lib/auth-context';
import { supabase } from '@/lib/supabase';
import { classifyError, ERROR_TEXT } from '@/lib/supabase-errors';

// "Hazırlanıyor" ekranı en az bu kadar görünür: şablon anında üretir ama kullanıcı "bir şey oldu"
// hissini alsın. Ağ daha yavaşsa ağ süresi geçerlidir (süre = en büyüğü). Hata yolunda BEKLENMEZ.
const MIN_PREPARING_MS = 1200;
// Bu süreden uzun sürerse dürüst bir ek mesaj gösteririz (yüzde/sahte çubuk yok).
const SLOW_AFTER_MS = 4000;

// Route parametresi bazen dizi gelebilir; her zaman ilk metni al.
function first(param: string | string[] | undefined): string | undefined {
  return Array.isArray(param) ? param[0] : param;
}

// Bir yol haritası için 3 soruyu soran sihirbaz. İki yoldan açılır:
//  - YENİ akış (onboarding): `topicPath` + `level` parametreleriyle. Henüz veritabanında kayıt yok;
//    kayıt, son sorudan sonra TEK çağrıyla (RPC) yapılır. Soruları yarıda bırakan kullanıcıda
//    adımsız "yetim" yol haritası oluşmaz.
//  - MEVCUT kullanıcı: `roadmapId` ile (yol haritası var, adımı yok). Yeni satır eklenmez;
//    cevaplar ve adımlar mevcut satıra yazılır.
export default function RoadmapQuestionsScreen() {
  const params = useLocalSearchParams<{ topicPath?: string; level?: string; roadmapId?: string }>();
  const roadmapId = first(params.roadmapId);
  const { session } = useAuth();

  // --- Konu ve seviye nereden geliyor? -----------------------------------------------------
  // roadmapId varsa satırı okuruz (tek doğruluk kaynağı veritabanı satırı), yoksa parametrelerden alırız.
  const [existing, setExisting] = useState<{ topicPath: string; level: string } | null>(null);
  const [existingState, setExistingState] = useState<'loading' | 'ready' | 'missing' | 'error'>('loading');
  useEffect(() => {
    if (!roadmapId) return;
    let cancelled = false; // ekran kapandıysa ya da id değiştiyse eski cevap state'i ezmesin
    (async () => {
      const { data, error } = await supabase
        .from('roadmaps')
        .select('topic_path, level')
        .eq('id', roadmapId)
        .maybeSingle();
      if (cancelled) return;
      if (error) setExistingState('error');
      else if (!data) setExistingState('missing');
      else {
        setExisting({ topicPath: data.topic_path, level: data.level });
        setExistingState('ready');
      }
    })();
    return () => {
      cancelled = true;
    };
  }, [roadmapId]);

  const topicPath = roadmapId ? existing?.topicPath : first(params.topicPath);
  const level = roadmapId ? existing?.level : first(params.level);
  const hasInput = roadmapId ? true : Boolean(topicPath && level);

  // --- Sihirbaz durumu -----------------------------------------------------------------------
  const [step, setStep] = useState(0); // 0..2: şu anki soru
  const [direction, setDirection] = useState<'forward' | 'back'>('forward'); // geçiş animasyonu yönü
  // Başta hiçbir seçenek işaretli değil (bilinçsiz cevap olmasın)
  const [answers, setAnswers] = useState<Partial<Record<keyof Answers, string>>>({});
  const [error, setError] = useState<string | null>(null);
  const [preparing, setPreparing] = useState(false);
  const [slow, setSlow] = useState(false);
  const [celebrating, setCelebrating] = useState(false);

  // Çift dokunma kilidi: state güncellemesi bir sonraki çizimde olur, ref ANINDA değişir.
  const busyRef = useRef(false);
  const mountedRef = useRef(true);
  const delayTimer = useRef<ReturnType<typeof setTimeout> | null>(null);
  const slowTimer = useRef<ReturnType<typeof setTimeout> | null>(null);
  useEffect(() => {
    mountedRef.current = true;
    // Ekran kapanırsa zamanlayıcılar takılı kalmasın
    return () => {
      mountedRef.current = false;
      if (delayTimer.current) clearTimeout(delayTimer.current);
      if (slowTimer.current) clearTimeout(slowTimer.current);
    };
  }, []);

  const busy = preparing || celebrating;
  const question = QUESTIONS[step];
  const selectedId = answers[question.key];
  const answeredCount = Object.keys(answers).length;

  // Android donanım geri tuşu: sorular arasında bir önceki soruya döner, kayıt sürerken hiçbir şey yapmaz.
  // (Native üst "‹" ve kaydırma hareketi için aşağıda Stack.Screen ayarları var.)
  useEffect(() => {
    const subscription = BackHandler.addEventListener('hardwareBackPress', () => {
      if (busy) return true;
      if (step > 0) {
        goBackOneQuestion();
        return true;
      }
      return false; // 1. soruda normal davran: seviye sayfasına dön
    });
    return () => subscription.remove();
    // goBackOneQuestion yalnız step'e bağlı küçük bir sarmalayıcı
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [step, busy]);

  // Soru değişince ekran okuyucu yeni başlığa odaklanır ve soruyu duyurur (ilk açılışta değil).
  const headingRef = useRef<View>(null);
  const firstRender = useRef(true);
  useEffect(() => {
    if (firstRender.current) {
      firstRender.current = false;
      return;
    }
    const node = headingRef.current ? findNodeHandle(headingRef.current) : null;
    if (node) AccessibilityInfo.setAccessibilityFocus(node);
    AccessibilityInfo.announceForAccessibility(`Soru ${step + 1} / 3: ${QUESTIONS[step].title}`);
  }, [step]);

  // Seçim yapılınca ana buton kısa bir "pop" yapsın (hareketi azalt açıksa yapmaz)
  const reduceMotion = useReducedMotion();
  const pop = useSharedValue(1);
  useEffect(() => {
    if (selectedId !== undefined && !reduceMotion) {
      pop.value = withSequence(withTiming(1.03, { duration: 100 }), withTiming(1, { duration: 120 }));
    }
  }, [selectedId, reduceMotion, pop]);
  const popStyle = useAnimatedStyle(() => ({ transform: [{ scale: pop.value }] }));

  function goBackOneQuestion() {
    setDirection('back');
    setError(null);
    setStep((s) => Math.max(0, s - 1));
  }

  function choose(optionId: string) {
    setAnswers((prev) => ({ ...prev, [question.key]: optionId }));
    setError(null);
  }

  function goForward() {
    setDirection('forward');
    setStep((s) => Math.min(QUESTIONS.length - 1, s + 1));
  }

  // Yol Haritam sekmesine dön. Yığındaki tüm ekranları (onboarding, bu ekran) kapatıp sekmelere iner,
  // sonra Yol Haritam sekmesini açar. Yalnız `back()` kullansaydık yeni akışta kullanıcı seviye
  // sayfasında kalırdı. Profil'den açıldıysa da doğru sekmeye gider.
  function goToRoadmap() {
    router.dismissAll();
    router.navigate('/roadmap');
  }

  // Kayıt: üret -> TEK RPC çağrısı. Sonuç: 'ok' | 'exists' (adımlar zaten vardı) | { message } (hata).
  async function persist(final: Answers): Promise<'ok' | 'exists' | { message: string }> {
    if (!topicPath || !level) return { message: ERROR_TEXT.other };
    try {
      const steps = await generateRoadmapSteps({
        topicPath,
        topicTitle: describeTopic(topicPath).title, // bozuk yolda "Seçtiğin konu"
        level: toLevelId(level),
        weeklyHours: final.weeklyHours,
        goal: final.goal,
        learningStyle: final.learningStyle,
      });
      // position GÖNDERİLMEZ: sunucu dizideki sıradan türetir (1..N, çakışma imkânsız)
      const payload = steps.map((s) => ({
        phase: s.phase,
        title: s.title,
        description: s.description,
        estimated_hours: s.estimatedHours,
        resource_type: s.resourceType,
      }));

      // RPC = veritabanında tek işlemle çalışan fonksiyon: ya roadmap + cevaplar + adımların HEPSİ
      // yazılır ya hiçbiri. Yarım kayıt ("yol haritası var, adımı yok") bu yüzden oluşamaz.
      const { error: rpcError } = roadmapId
        ? await supabase.rpc('add_steps_to_roadmap', {
            p_roadmap_id: roadmapId,
            p_weekly_hours: final.weeklyHours,
            p_goal: final.goal,
            p_learning_style: final.learningStyle,
            p_steps: payload,
          })
        : await supabase.rpc('create_roadmap_with_steps', {
            p_topic_path: topicPath,
            p_level: level,
            p_weekly_hours: final.weeklyHours,
            p_goal: final.goal,
            p_learning_style: final.learningStyle,
            p_steps: payload,
          });

      if (!rpcError) return 'ok';
      const kind = classifyError(rpcError);
      // Çift dokunma / başka cihaz: adımlar zaten yazılmış. Hata değil, "zaten hazır".
      if (kind === 'duplicate' && roadmapId) return 'exists';
      if (kind === 'schema') return { message: ERROR_TEXT.saveSchema };
      if (kind === 'network') return { message: ERROR_TEXT.network };
      return { message: ERROR_TEXT.other };
    } catch {
      return { message: ERROR_TEXT.other };
    }
  }

  async function save(final: Answers) {
    if (busyRef.current) return;
    if (!session) {
      setError(ERROR_TEXT.session);
      return;
    }
    busyRef.current = true;
    setError(null);
    setAnswers(final);
    setSlow(false);
    setPreparing(true);
    slowTimer.current = setTimeout(() => setSlow(true), SLOW_AFTER_MS);
    // Alt sınır sayacı AĞ ile aynı anda başlar: toplam bekleme = en büyüğü (ikisinin toplamı değil)
    const minDelay = new Promise<void>((resolve) => {
      delayTimer.current = setTimeout(resolve, MIN_PREPARING_MS);
    });

    const outcome = await persist(final);
    if (!mountedRef.current) return;
    if (slowTimer.current) clearTimeout(slowTimer.current);

    if (typeof outcome === 'object') {
      // Hata hemen gösterilir (yapay bekleme yok); sihirbaz kaldığı yerden devam eder.
      if (delayTimer.current) clearTimeout(delayTimer.current);
      setPreparing(false);
      setError(outcome.message);
      busyRef.current = false;
      return;
    }
    await minDelay;
    if (!mountedRef.current) return;
    if (outcome === 'exists') {
      goToRoadmap();
      return;
    }
    setCelebrating(true); // kilit açılmaz: kutlama sonrası ekran kapanır
  }

  // Eksik cevapları önerilenlerle doldurur; zaten yanıtlananlar KORUNUR.
  // Değerler QUESTIONS içindeki geçerli seçenek kimlikleri olduğu için Answers'a çevirmek güvenlidir.
  function fillWithDefaults(): Answers {
    return { ...DEFAULT_ANSWERS, ...answers } as Answers;
  }

  function handlePrimary() {
    // Hata varsa ana buton "Tekrar dene"dir: aynı kaydı yeniden dener
    if (error !== null) {
      save(fillWithDefaults());
      return;
    }
    if (selectedId === undefined) return;
    if (step < QUESTIONS.length - 1) goForward();
    else save(fillWithDefaults());
  }

  // --- Görünüm -----------------------------------------------------------------------------
  const theme = useTheme();
  const shadow = useShadow();
  const { width, height, fontScale } = useWindowDimensions();
  const gutter = width < 360 ? Spacing.three : Spacing.four;
  const info = describeTopic(topicPath);
  const levelTitle = LEVELS.find((l) => l.id === level)?.title;
  // Geniş ekranda varsayılan notu alt çubukta göster; küçük ekran / büyük yazıda içeriğin sonuna al
  const roomyFooter = height >= 700 && fontScale <= 1.15;
  const note =
    answeredCount > 0
      ? 'Yanıtladıkların korunur; kalanlar önerilenle dolar.'
      : 'Önerilenler: 3-5 saat, merak ve gelişim, karışık tarz.';
  const isLast = step === QUESTIONS.length - 1;
  const primaryLabel = error !== null ? 'Tekrar dene' : isLast ? 'Adımlarımı oluştur' : 'Devam et';
  const primaryDisabled = error === null && selectedId === undefined;

  // Üst çubuk ayarları: soru ilerlediyse geri = önceki soru; kayıt sürerken geri tamamen kapalı.
  const screenOptions = (
    <Stack.Screen
      options={{
        title: 'Sana özel adımlar',
        headerBackVisible: !busy && step === 0,
        gestureEnabled: !busy && step === 0,
        headerLeft:
          !busy && step > 0
            ? () => (
                <Pressable
                  onPress={goBackOneQuestion}
                  accessibilityRole="button"
                  accessibilityLabel="Önceki soru"
                  hitSlop={8}
                  style={styles.headerBack}>
                  <Text style={[styles.headerBackText, { color: theme.accentInk }]}>‹</Text>
                </Pressable>
              )
            : undefined,
      }}
    />
  );

  // Giriş bilgisi eksikse ya da satır okunamadıysa: kısa bir açıklama ve çıkış yolu
  if (!hasInput || existingState === 'missing' || existingState === 'error') {
    const message =
      existingState === 'error'
        ? ERROR_TEXT.network
        : 'Bu yol haritası bulunamadı. Yol Haritam ekranına dönüp tekrar dene.';
    return (
      <ThemedView style={styles.container}>
        {screenOptions}
        <View style={[styles.problem, { padding: gutter }]}>
          <Banner tone="warning">{message}</Banner>
          <Button label="Yol haritama dön" onPress={() => router.replace('/roadmap')} />
        </View>
      </ThemedView>
    );
  }

  const celebration = (
    <Celebration
      visible={celebrating}
      emoji={info.category.emoji}
      hue={info.category.hue}
      title="Yol haritan hazır!"
      levelId={level ?? ''}
      onDone={goToRoadmap}
    />
  );

  // "Adımların hazırlanıyor…" anı (kayıt süresince)
  if (preparing || celebrating) {
    return (
      <ThemedView style={styles.container}>
        {screenOptions}
        <View style={[styles.preparing, { padding: gutter }]}>
          <Animated.View
            entering={FadeIn.duration(150)}
            accessible
            accessibilityLiveRegion="polite"
            accessibilityLabel="Adımların hazırlanıyor. Cevaplarına göre sana özel adımlar diziliyor."
            style={styles.preparingInner}>
            <View style={[shadow('lifted'), { borderRadius: Radius.xl }]}>
              <IconTile emoji={info.category.emoji} tone={info.category.hue} size={96} />
            </View>
            <View style={styles.center}>
              <ThemedText type="cardTitle" style={styles.centerText}>
                {info.title}
              </ThemedText>
              <LevelBadge levelId={level} size="sm" />
            </View>
            <TrailDraw width={Math.min(width - 2 * gutter, 288)} slow={slow} />
            <ThemedText type="heading" style={styles.centerText}>
              Adımların hazırlanıyor…
            </ThemedText>
            <ThemedText themeColor="textSecondary" style={[styles.centerText, styles.preparingSub]}>
              Cevaplarına göre sana özel adımlar diziliyor.
            </ThemedText>
            {/* Cevap çipleri: yalnız kullanıcının GERÇEK cevapları */}
            <View style={styles.chips}>
              {QUESTIONS.map((q, i) => {
                const option = findOption(q.key, answers[q.key]);
                if (!option) return null;
                const label = q.key === 'weeklyHours' ? `Haftada ${option.title}` : option.title;
                return (
                  <Animated.View
                    key={q.key}
                    entering={FadeIn.duration(reduceMotion ? 150 : 250).delay(reduceMotion ? 0 : i * 120)}>
                    <StatusChip tone="neutral" emoji={option.emoji} label={label} />
                  </Animated.View>
                );
              })}
            </View>
            {slow && (
              <ThemedText type="small" themeColor="textSecondary" style={styles.centerText}>
                Biraz uzun sürüyor, birazdan hazır.
              </ThemedText>
            )}
          </Animated.View>
        </View>
        {celebration}
      </ThemedView>
    );
  }

  return (
    <ThemedView style={styles.container}>
      {screenOptions}
      <SafeAreaView style={styles.flex} edges={['bottom']}>
        <ScrollView
          style={styles.flex}
          contentContainerStyle={[styles.content, { padding: gutter, paddingBottom: Spacing.four }]}>
          <View style={styles.inner}>
            {/* Gösterge satırı: yeni akışta 3 duraklı gösterge + "Soru n / 3"; mevcut kullanıcı akışında yalnız yazı */}
            <View style={[styles.indicatorRow, { justifyContent: roadmapId ? 'flex-start' : 'space-between' }]}>
              {!roadmapId && <StepIndicator current={2} />}
              <ThemedText
                type="eyebrow"
                themeColor="textSecondary"
                accessibilityLabel={`Soru ${step + 1} / 3`}>
                {`Soru ${step + 1} / 3`}
              </ThemedText>
            </View>

            {/* Bağlam çipleri (dokunulmaz): hangi konu ve seviye için cevap veriyorsun */}
            {roadmapId && existingState === 'loading' ? (
              <View style={styles.contextRow}>
                <Skeleton width={140} height={32} radius={Radius.pill} />
                <Skeleton width={90} height={32} radius={Radius.pill} />
              </View>
            ) : (
              <View
                accessible
                accessibilityLabel={`Konu: ${info.title}.${levelTitle ? ` Seviye: ${levelTitle}.` : ''}`}
                style={styles.contextRow}>
                <View
                  style={[
                    styles.topicChip,
                    { backgroundColor: theme[info.hue.soft], borderColor: theme[info.hue.line] },
                  ]}>
                  <Text allowFontScaling={false} style={styles.topicChipEmoji}>
                    {info.category.emoji}
                  </Text>
                  <ThemedText type="smallBold" themeColor={info.hue.ink} style={styles.topicChipText}>
                    {info.title}
                  </ThemedText>
                </View>
                <LevelBadge levelId={level} size="sm" />
              </View>
            )}

            {/* key={step}: soru değişince blok yeniden belirir (ileri sağdan, geri soldan) */}
            <Animated.View
              key={step}
              entering={
                reduceMotion
                  ? FadeIn.duration(150)
                  : direction === 'forward'
                    ? FadeInRight.duration(220)
                    : FadeInLeft.duration(220)
              }
              style={styles.questionBlock}>
              <View style={styles.titles}>
                <View ref={headingRef} accessible accessibilityRole="header">
                  <ThemedText type="heading">{question.title}</ThemedText>
                </View>
                <ThemedText type="small" themeColor="textSecondary">
                  {question.subtitle}
                </ThemedText>
              </View>
              <View accessibilityRole="radiogroup" accessibilityLabel={question.title} style={styles.options}>
                {question.options.map((option, index) => (
                  <OptionCard
                    key={option.id}
                    role="radio"
                    title={option.title}
                    description={option.description}
                    icon={option.emoji}
                    trailing="check"
                    selected={selectedId === option.id}
                    index={index}
                    onPress={() => choose(option.id)}
                  />
                ))}
              </View>
            </Animated.View>

            {!roomyFooter && (
              <ThemedText type="small" themeColor="textSecondary" style={styles.centerText}>
                {note}
              </ThemedText>
            )}
          </View>
        </ScrollView>

        <View
          style={[
            styles.footer,
            { paddingHorizontal: gutter, borderTopColor: theme.border, backgroundColor: theme.background },
          ]}>
          {error !== null && <Banner tone="warning">{error}</Banner>}
          <Animated.View style={popStyle}>
            <Button
              label={primaryLabel}
              onPress={handlePrimary}
              disabled={primaryDisabled}
              accessibilityHint={primaryDisabled ? 'Önce bir seçenek işaretle' : undefined}
            />
          </Animated.View>
          <View style={styles.secondaryRow}>
            <Button
              variant="text"
              icon="‹"
              label="Geri"
              onPress={() => (step === 0 ? router.back() : goBackOneQuestion())}
            />
            <Button
              variant="text"
              label="Önerilenlerle oluştur"
              accessibilityHint="3-5 saat, merak ve gelişim, karışık tarz ile oluşturur"
              onPress={() => save(fillWithDefaults())}
            />
          </View>
          {roomyFooter && (
            <ThemedText type="small" themeColor="textSecondary" style={styles.centerText}>
              {note}
            </ThemedText>
          )}
        </View>
      </SafeAreaView>
    </ThemedView>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1 },
  flex: { flex: 1 },
  content: { alignItems: 'center' },
  inner: { width: '100%', maxWidth: MaxContentWidth, gap: Spacing.three },
  indicatorRow: { flexDirection: 'row', alignItems: 'center', flexWrap: 'wrap', gap: Spacing.two },
  contextRow: { flexDirection: 'row', flexWrap: 'wrap', alignItems: 'center', gap: Spacing.two },
  topicChip: {
    flexDirection: 'row',
    alignItems: 'center',
    flexShrink: 1,
    gap: Spacing.one,
    paddingVertical: Spacing.one,
    paddingHorizontal: Spacing.three,
    borderRadius: Radius.pill,
    borderWidth: Border.thick,
  },
  topicChipEmoji: { fontSize: 14, lineHeight: 18 },
  topicChipText: { flexShrink: 1 },
  questionBlock: { gap: Spacing.three },
  titles: { gap: Spacing.one },
  options: { gap: Spacing.three },
  footer: { gap: Spacing.two, paddingVertical: Spacing.three, borderTopWidth: 2 },
  secondaryRow: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    alignItems: 'center',
    justifyContent: 'space-between',
  },
  headerBack: { minWidth: 44, minHeight: 44, alignItems: 'center', justifyContent: 'center' },
  headerBackText: { fontSize: 32, lineHeight: 36, fontWeight: '900' },
  problem: { flex: 1, justifyContent: 'center', gap: Spacing.three },
  preparing: { flex: 1, alignItems: 'center', justifyContent: 'center' },
  preparingInner: { alignItems: 'center', gap: Spacing.four, maxWidth: 360, width: '100%' },
  preparingSub: { maxWidth: 300 },
  center: { alignItems: 'center', gap: Spacing.two },
  centerText: { textAlign: 'center' },
  chips: { flexDirection: 'row', flexWrap: 'wrap', justifyContent: 'center', gap: Spacing.two },
});
