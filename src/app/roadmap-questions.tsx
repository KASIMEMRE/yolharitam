import { Redirect, router, Stack, useLocalSearchParams } from 'expo-router';
import { type ComponentRef, useEffect, useRef, useState } from 'react';
import {
  AccessibilityInfo,
  BackHandler,
  findNodeHandle,
  Platform,
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
import { HeaderBackButton } from '@/components/header-back-button';
import { IconTile } from '@/components/icon-tile';
import { LevelBadge } from '@/components/level-badge';
import { OptionCard } from '@/components/option-card';
import { Skeleton } from '@/components/skeleton';
import { ThemedText } from '@/components/themed-text';
import { ThemedView } from '@/components/themed-view';
import { TrailDraw } from '@/components/trail-draw';
import { LEVELS } from '@/constants/onboarding';
import {
  type Answers,
  DEFAULT_ANSWERS,
  describeDefaults,
  findOption,
  QUESTIONS,
  tempoWord,
} from '@/constants/roadmap-questions';
import { getRoadmap } from '@/constants/dev-roadmaps';
import { computeProgress } from '@/constants/dev-roadmaps/personalize';
import { toLevelId } from '@/constants/plan';
import { Border, MaxContentWidth, MinTouch, Radius, Spacing } from '@/constants/theme';
import { describeTopic } from '@/constants/visuals';
import { useShadow, useTheme } from '@/hooks/use-theme';
import { useAuth } from '@/lib/auth-context';
import { personalizeRoadmap } from '@/lib/personalize-roadmap';
import { supabase } from '@/lib/supabase';
import { classifyError, ERROR_TEXT } from '@/lib/supabase-errors';
import { isWizardDone, markWizardDone } from '@/lib/wizard-done';

// "Hazırlanıyor" ekranı en az bu kadar görünür: şablon anında üretir ama kullanıcı "bir şey oldu"
// hissini alsın. Ağ daha yavaşsa ağ süresi geçerlidir (süre = en büyüğü). Hata yolunda BEKLENMEZ.
const MIN_PREPARING_MS = 1200;
// Kayıt çağrısı için üst sınır: sunucu yanıt vermezse sonsuza kadar "hazırlanıyor"da kalmayalım.
// Süre dolunca istek iptal edilir, kullanıcı ağ hatası + "Tekrar dene" görür.
const SAVE_TIMEOUT_MS = 20000;
// Bu süreden uzun sürerse dürüst bir ek mesaj gösteririz (yüzde/sahte çubuk yok).
const SLOW_AFTER_MS = 4000;

// Veritabanı hatasını kullanıcı cümlesine çevirir
function errorText(error: { code?: string; message?: string }): string {
  const kind = classifyError(error);
  if (kind === 'schema') return ERROR_TEXT.saveSchema;
  if (kind === 'network') return ERROR_TEXT.network;
  return ERROR_TEXT.other;
}

// Route parametresi bazen dizi gelebilir; her zaman ilk metni al.
function first(param: string | string[] | undefined): string | undefined {
  return Array.isArray(param) ? param[0] : param;
}

// Bir yol haritası için 3 soruyu soran sihirbaz. İki yoldan açılır:
//  - YENİ akış (onboarding): `topicPath` (harita kimliği) + `level` parametreleriyle. Kayıt son sorudan
//    sonra yapılır; soruları yarıda bırakan kullanıcıda yarım kayıt oluşmaz.
//  - MEVCUT harita: `roadmapId` ile (Yol Haritam'daki "Planımı güncelle"). Yeni satır eklenmez;
//    cevaplar ve kişisel işaretler mevcut satıra yazılır, konu ilerlemesi korunur.
export default function RoadmapQuestionsScreen() {
  const params = useLocalSearchParams<{ topicPath?: string; level?: string; roadmapId?: string }>();
  const roadmapId = first(params.roadmapId);
  const { session } = useAuth();

  // --- Konu ve seviye nereden geliyor? -----------------------------------------------------
  // roadmapId varsa satırı okuruz (tek doğruluk kaynağı veritabanı satırı), yoksa parametrelerden alırız.
  const [existing, setExisting] = useState<{ topicPath: string; level: string } | null>(null);
  const [existingState, setExistingState] = useState<'loading' | 'ready' | 'missing' | 'error'>('loading');
  const [existingError, setExistingError] = useState<string>(ERROR_TEXT.other);
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
      if (error) {
        // Ağ sorunu ile diğer hataları ayır: kullanıcıya doğru cümleyi söyleyelim
        setExistingError(classifyError(error) === 'network' ? ERROR_TEXT.network : ERROR_TEXT.other);
        setExistingState('error');
      }
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
  const [celebrationSubtitle, setCelebrationSubtitle] = useState<string | undefined>(undefined);

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

  // Bu sihirbaz bu yol haritası için daha önce bitirildiyse (web geri tuşuyla dönüldü) yeniden kayıt yapma.
  // Yalnız ilk çizimde hesaplanır: kayıt bitince state'imiz kendi kendimizi yönlendirmesin.
  const wizardKey = roadmapId ?? `${first(params.topicPath) ?? ''}|${first(params.level) ?? ''}`;
  const [alreadyDone] = useState(() => isWizardDone(wizardKey));

  const busy = preparing || celebrating;
  // Mevcut yol haritası satırı okunana kadar (ya da okunamadıysa) kayıt başlatılamaz: konu ve seviye bilinmiyor
  const notReady = Boolean(roadmapId) && existingState !== 'ready';
  const question = QUESTIONS[step];
  const selectedId = answers[question.key];
  const answeredCount = Object.keys(answers).length;

  // Android donanım geri tuşu: sorular arasında bir önceki soruya döner, kayıt sürerken hiçbir şey yapmaz.
  // (Native üst "‹" ve kaydırma hareketi için aşağıda Stack.Screen ayarları var.)
  useEffect(() => {
    const subscription = BackHandler.addEventListener('hardwareBackPress', () => {
      if (busy) return true;
      if (step > 0) {
        // Doğrudan state setter'ları: başka bir fonksiyona bağımlı olmadığı için bağımlılık listesi doğru kalır
        setDirection('back');
        setError(null);
        setStep((s) => Math.max(0, s - 1));
        return true;
      }
      return false; // 1. soruda normal davran: seviye sayfasına dön
    });
    return () => subscription.remove();
  }, [step, busy]);

  // Soru değişince ekran okuyucu yeni başlığa odaklanır ve soruyu duyurur (ilk açılışta değil).
  const headingRef = useRef<ComponentRef<typeof View>>(null);
  const firstRender = useRef(true);
  useEffect(() => {
    if (firstRender.current) {
      firstRender.current = false;
      return;
    }
    // findNodeHandle react-native-web'de yok (çöker); odak taşıma yalnız mobilde yapılır.
    // Web'de aşağıdaki duyuru yeterli.
    if (Platform.OS !== 'web') {
      const node = headingRef.current ? findNodeHandle(headingRef.current) : null;
      if (node) AccessibilityInfo.setAccessibilityFocus(node);
    }
    AccessibilityInfo.announceForAccessibility(`Soru ${step + 1} / ${QUESTIONS.length}: ${QUESTIONS[step].title}`);
  }, [step]);

  // Seçim yapılınca ana buton kısa bir "pop" yapsın (hareketi azalt açıksa yapmaz)
  const reduceMotion = useReducedMotion();
  const pop = useSharedValue(1);
  useEffect(() => {
    if (selectedId !== undefined && !reduceMotion) {
      pop.set(withSequence(withTiming(1.03, { duration: 100 }), withTiming(1, { duration: 120 })));
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
  // Web'de yığın tek ekranlı olabilir; dismissAll o zaman "POP_TO_TOP işlenmedi" hatası verir,
  // bu yüzden önce canDismiss ile bakıyoruz. Sonra replace: tarayıcı geçmişinde biten sihirbaz
  // (kutlama) kalmasın, geri tuşu ona dönmesin.
  function goToRoadmap() {
    if (router.canDismiss()) router.dismissAll();
    router.replace('/roadmap');
  }

  // Kayıt: haritayı kişiye göre işaretle → yol haritası satırını yaz.
  // Aynı haritayı daha önce seçtiysen YENİ satır açılmaz, eskisi güncellenir: konu ilerlemen korunur.
  // Sonuç: başarı (kutlama özetiyle) | { message } (hata).
  async function persist(final: Answers): Promise<{ summary: string } | { message: string }> {
    const map = getRoadmap(topicPath);
    if (!map || !level || !session) return { message: ERROR_TEXT.other };
    // Zamanlayıcı yapay zekâ adımından SONRA kurulur; o adımın kendi süre sınırı var (personalize-roadmap.ts).
    const controller = new AbortController();
    let timeout: ReturnType<typeof setTimeout> | undefined;
    try {
      const personalization = await personalizeRoadmap(map, {
        level: toLevelId(level),
        weeklyHours: final.weeklyHours,
        goal: final.goal,
        learningStyle: final.learningStyle,
      });
      timeout = setTimeout(() => controller.abort(), SAVE_TIMEOUT_MS);

      const fields = {
        level,
        weekly_hours: final.weeklyHours,
        goal: final.goal,
        learning_style: final.learningStyle,
        personalization,
        updated_at: new Date().toISOString(), // "en son kullanılan harita" sırası bununla
      };

      // Hangi satır güncellenecek? roadmapId ile açıldıysa o; değilse bu haritanın eski satırı (varsa)
      let targetId = roadmapId ?? null;
      if (!targetId) {
        const found = await supabase
          .from('roadmaps')
          .select('id')
          .eq('topic_path', map.id)
          .order('updated_at', { ascending: false })
          .limit(1)
          .abortSignal(controller.signal)
          .maybeSingle();
        if (found.error) return { message: errorText(found.error) };
        targetId = found.data?.id ?? null;
      }

      // .select('id'): güncelleme RLS ya da silinmiş satır yüzünden 0 satıra denk gelirse hata dönmez;
      // dönen satırı sayarak "kaydedildi" kutlamasının sahte olmasını önleriz.
      const { data: saved, error: saveError } = targetId
        ? await supabase.from('roadmaps').update(fields).eq('id', targetId).select('id').abortSignal(controller.signal)
        : await supabase
            .from('roadmaps')
            .insert({ ...fields, user_id: session.user.id, topic_path: map.id })
            .select('id')
            .abortSignal(controller.signal);
      if (saveError) return { message: errorText(saveError) };
      if (!saved || saved.length === 0) return { message: ERROR_TEXT.other };

      // Kutlama özeti planın kendisinden türetilir (kendi başına bir sayı uydurmayız)
      const sum = computeProgress(map, new Map(), personalization, final.weeklyHours);
      return {
        summary:
          `${sum.total} konu · yaklaşık ${sum.totalHours} saat · yaklaşık ${sum.weeks} hafta` +
          (personalization.source === 'ai' ? '\n✨ Yapay zekâ haritanı sana göre işaretledi' : ''),
      };
    } catch {
      return { message: ERROR_TEXT.other };
    } finally {
      clearTimeout(timeout); // zamanlayıcı takılı kalmasın
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

    if ('message' in outcome) {
      // Hata hemen gösterilir (yapay bekleme yok); sihirbaz kaldığı yerden devam eder.
      if (delayTimer.current) clearTimeout(delayTimer.current);
      setPreparing(false);
      setError(outcome.message);
      busyRef.current = false;
      return;
    }
    await minDelay;
    if (!mountedRef.current) return;
    markWizardDone(wizardKey);
    setCelebrationSubtitle(outcome.summary);
    setCelebrating(true); // kilit açılmaz: kutlama sonrası ekran kapanır
  }

  // Eksik cevapları önerilenlerle doldurur; zaten yanıtlananlar KORUNUR.
  // Değerler QUESTIONS içindeki geçerli seçenek kimlikleri olduğu için Answers'a çevirmek güvenlidir.
  function fillWithDefaults(): Answers {
    return { ...DEFAULT_ANSWERS, ...answers } as Answers;
  }

  function handlePrimary() {
    if (notReady) return;
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
  // Tek açıklama: önerilen değerler (varsayılan tablosundan türetilir) + gerekirse "korunur" cümlesi
  const note =
    `Önerilen: ${describeDefaults()}.` +
    (answeredCount > 0 ? ' Yanıtladıkların korunur; kalanlar önerilenle dolar.' : '');
  const isLast = step === QUESTIONS.length - 1;
  const primaryLabel = error !== null ? 'Tekrar dene' : isLast ? 'Haritamı hazırla' : 'Devam et';
  const primaryDisabled = notReady || (error === null && selectedId === undefined);

  // Üst çubuk ayarları: soru ilerlediyse geri = önceki soru; kayıt sürerken geri tamamen kapalı.
  const screenOptions = (
    <Stack.Screen
      options={{
        // Kutlama sırasında başlık boş: arkada soluk başlık görünmesin
        title: celebrating ? '' : 'Sana özel plan',
        headerBackVisible: !busy && step === 0,
        gestureEnabled: !busy && step === 0,
        // Soru ilerlediyse geri = önceki soru. İlk soruda native'in kendi geri okunu bırakırız;
        // web'deki varsayılan ok küçük (30x30) olduğu için orada 44x44'lük kendi düğmemizi koyarız.
        headerLeft: busy
          ? undefined
          : step > 0
            ? () => <HeaderBackButton onPress={goBackOneQuestion} label="Önceki soru" />
            : Platform.OS === 'web'
              ? () => (
                  <HeaderBackButton
                    onPress={() => (router.canGoBack() ? router.back() : router.replace('/roadmap'))}
                    label="Geri dön"
                  />
                )
              : undefined,
      }}
    />
  );

  if (alreadyDone) return <Redirect href="/roadmap" />;

  // Giriş bilgisi eksikse ya da satır okunamadıysa: kısa bir açıklama ve çıkış yolu
  if (!hasInput || existingState === 'missing' || existingState === 'error') {
    const message =
      existingState === 'error'
        ? existingError
        : 'Bu yol haritası bulunamadı. Yol Haritam ekranına dönüp tekrar dene.';
    return (
      <ThemedView style={styles.container}>
        {screenOptions}
        <View style={[styles.problem, { padding: gutter }]}>
          <Banner tone="warning">{message}</Banner>
          <Button label="Yol haritama dön" onPress={goToRoadmap} />
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
      subtitle={celebrationSubtitle}
      levelId={level ?? ''}
      onDone={goToRoadmap}
    />
  );

  // "Haritan hazırlanıyor…" anı (kayıt süresince). Satırlar cevapların GERÇEK etkisini anlatır.
  if (preparing || celebrating) {
    const lines = [
      'Yapay zekâ haritanı seviyene göre işaretliyor',
      `${tempoWord(answers.weeklyHours) ?? 'Seçtiğin'} tempona göre süre hesaplanıyor`,
      `Öncelikler ${findOption('goal', answers.goal)?.title ?? 'seçtiğin'} hedefine göre belirleniyor`,
    ];
    return (
      <ThemedView style={styles.container}>
        {screenOptions}
        {/* Kutlama başlayınca arkadaki blok kaldırılır; iki katman üst üste okunmasın */}
        {!celebrating && (
          // ScrollView: küçük ekranda ya da büyük yazıda içerik sığmazsa kayabilsin
          <ScrollView
            contentContainerStyle={[styles.preparing, { padding: gutter }]}>
            <Animated.View
              entering={FadeIn.duration(150)}
              accessible
              accessibilityLiveRegion="polite"
              accessibilityLabel={`Haritan hazırlanıyor. ${lines.join('. ')}.`}
              style={styles.preparingInner}>
              <View style={[shadow('lifted'), { borderRadius: Radius.xl }]}>
                <IconTile emoji={info.category.emoji} tone={info.category.hue} size={height < 700 ? 64 : 96} />
              </View>
              <View style={styles.center}>
                <ThemedText type="cardTitle" style={styles.centerText}>
                  {info.title}
                </ThemedText>
                {/* LevelBadge kendi hizasını başlangıca sabitler; ortalamak için sarmalayıcı gerekir */}
                <View style={styles.centerSelf}>
                  <LevelBadge levelId={level} size="sm" />
                </View>
              </View>
              <TrailDraw width={Math.min(width - 2 * gutter, 288)} slow={slow} />
              <ThemedText type="heading" style={styles.centerText}>
                Haritan hazırlanıyor…
              </ThemedText>
              <View style={styles.lines}>
                {lines.map((line, i) => (
                  <Animated.View
                    key={line}
                    // Satırlar 0 / 400 / 800 ms'de belirir; hareketi azalt açıksa hepsi birden
                    entering={reduceMotion ? FadeIn.duration(150) : FadeIn.duration(250).delay(i * 400)}>
                    <ThemedText themeColor="textSecondary" style={styles.centerText}>
                      {line}
                    </ThemedText>
                  </Animated.View>
                ))}
              </View>
              {slow && (
                <ThemedText type="small" themeColor="textSecondary" style={styles.centerText}>
                  Biraz uzun sürüyor, birazdan hazır.
                </ThemedText>
              )}
            </Animated.View>
          </ScrollView>
        )}
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
            {/* Sayaç + 3 parçalı çubuk. Bu SİHİRBAZIN ilerlemesidir (kaçıncı sorudasın); yol haritası
                ilerlemesi DEĞİL. Çubuk süstür, ekran okuyucu yalnız "Soru n / 3" yazısını okur. */}
            <View style={styles.indicatorRow}>
              <ThemedText
                type="eyebrow"
                themeColor="textSecondary"
                accessibilityLabel={`Soru ${step + 1} / ${QUESTIONS.length}`}>
                {`Soru ${step + 1} / ${QUESTIONS.length}`}
              </ThemedText>
              <View
                accessibilityElementsHidden
                importantForAccessibility="no-hide-descendants"
                style={styles.segments}>
                {QUESTIONS.map((q, i) => (
                  <View
                    key={q.key}
                    style={[styles.seg, { backgroundColor: i <= step ? theme.accent : theme.backgroundSelected }]}
                  />
                ))}
              </View>
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
            {/* Dar ekranda alt çubuk dolmasın diye hata kutusu burada, sorunun üstünde durur */}
            {error !== null && !roomyFooter && <Banner tone="warning">{error}</Banner>}

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
          {error !== null && roomyFooter && <Banner tone="warning">{error}</Banner>}
          <Animated.View style={popStyle}>
            <Button
              label={primaryLabel}
              onPress={handlePrimary}
              disabled={primaryDisabled}
              accessibilityHint={primaryDisabled && !notReady ? 'Önce bir seçenek işaretle' : undefined}
            />
          </Animated.View>
          {/* Soruları atla: ana butondan UZAK durur (yanlışlıkla basılmasın). Sorular arası geri,
              üst çubuktaki ‹ ve Android geri tuşuyla yapılır; ayrı "Geri" düğmesi yok. */}
          <View style={styles.skipBlock}>
            <Button
              variant="text"
              label="Soruları atla"
              disabled={notReady}
              accessibilityHint={`Önerilen değerlerle oluşturur: ${describeDefaults()}`}
              onPress={() => save(fillWithDefaults())}
            />
            {roomyFooter && (
              <ThemedText type="small" themeColor="textSecondary" style={styles.centerText}>
                {note}
              </ThemedText>
            )}
          </View>
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
  indicatorRow: { flexDirection: 'row', alignItems: 'center', gap: Spacing.three },
  segments: { flex: 1, flexDirection: 'row', gap: Spacing.two },
  seg: { flex: 1, height: 6, borderRadius: 3 },
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
  footer: { gap: Spacing.three, paddingVertical: Spacing.three, borderTopWidth: 2 },
  skipBlock: { alignItems: 'center', minHeight: MinTouch },
  problem: { flex: 1, justifyContent: 'center', gap: Spacing.three },
  preparing: { flexGrow: 1, alignItems: 'center', justifyContent: 'center' },
  preparingInner: { alignItems: 'center', gap: Spacing.four, maxWidth: 360, width: '100%' },
  lines: { gap: Spacing.one, alignItems: 'center' },
  center: { alignItems: 'center', gap: Spacing.two },
  centerText: { textAlign: 'center' },
  centerSelf: { alignSelf: 'center' },
});
