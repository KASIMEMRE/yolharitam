import { useEffect, useRef, useState } from 'react';
import { Pressable, StyleSheet, Text, View } from 'react-native';
import Animated, {
  FadeIn,
  FadeInDown,
  useAnimatedStyle,
  useReducedMotion,
  useSharedValue,
  withSequence,
  withTiming,
  ZoomIn,
} from 'react-native-reanimated';

import { Banner } from '@/components/banner';
import { StatusChip } from '@/components/level-badge';
import { Skeleton } from '@/components/skeleton';
import { ThemedText } from '@/components/themed-text';
import type { Phase, ResourceType } from '@/constants/roadmap-templates';
import { Border, MinTouch, Radius, Spacing } from '@/constants/theme';
import { PHASE_STYLE, RESOURCE_STYLE, RESOURCE_SUMMARY } from '@/constants/visuals';
import type { MarkError } from '@/hooks/use-roadmap-steps';
import { useShadow, useTheme } from '@/hooks/use-theme';

// Yol haritası adımlarının DİKEY listesi: solda rota rayı (numaralı duraklar + noktalar), sağda kartlar.
// Her kart DOKUNULABİLİR bir onay kutusudur (Y-05): dokununca adım tamamlandı ↔ tamamlanmadı olur.
// Tamamlanan durak ✓ ve accent rengi alır; "Sıradaki adım" vurgusu ilk tamamlanmamış adımdadır.
// Durum yalnız renkle değil ✓ simgesi ve "Tamamlandı" çipiyle de belli edilir (renk körlüğü için).
// Veritabanından gelen satırların `phase`/`resource_type` alanları string; bilinmeyen değerde (örn. ileride
// bozuk yapay zekâ çıktısı) başlık/çip çizilmez ama uygulama çökmez.
export type StepItem = {
  id: string;
  position: number;
  title: string;
  description: string;
  estimated_hours: number;
  phase: string;
  resource_type: string;
};

const RAIL = 48; // sol sütun genişliği
const STOP = 40; // durak (numara dairesi) boyutu
const DOT_PITCH = 14; // rotadaki bir nokta + aralığı (5 + 9)

function phaseOf(value: string) {
  return PHASE_STYLE[value as Phase];
}
function resourceOf(value: string) {
  return RESOURCE_STYLE[value as ResourceType];
}

export function RoadmapStepList({
  steps,
  completedIds,
  onToggle,
  markError,
}: {
  steps: StepItem[];
  completedIds: Set<string>;
  onToggle: (stepId: string) => void;
  markError: MarkError | null;
}) {
  const reduceMotion = useReducedMotion();
  const sorted = [...steps].sort((a, b) => a.position - b.position);
  // Tüm adımlar aynı kaynak türündeyse her karta aynı çipi basmak gürültü olur: tür listenin başında
  // BİR KEZ söylenir. Karışıksa (ya da tür bilinmiyorsa) çipler kartlarda kalır.
  const firstType = sorted[0]?.resource_type;
  const uniformType =
    firstType !== undefined &&
    resourceOf(firstType) !== undefined &&
    sorted.every((s) => s.resource_type === firstType)
      ? (firstType as ResourceType)
      : null;

  // Sıradaki adım = ilk tamamlanmamış adım (hepsi bitmişse yok)
  const noneDone = !sorted.some((s) => completedIds.has(s.id));
  const nextId = sorted.find((s) => !completedIds.has(s.id))?.id;
  // Evre tamamlandı = o evrenin TÜM adımları işaretli. Evre başına bir kez hesaplanır.
  const phaseDone = new Map<string, boolean>();
  for (const s of sorted) phaseDone.set(s.phase, (phaseDone.get(s.phase) ?? true) && completedIds.has(s.id));

  return (
    <View role="list">
      {uniformType && (
        <ThemedText type="small" themeColor="textSecondary" style={styles.uniform}>
          {RESOURCE_SUMMARY[uniformType]}
        </ThemedText>
      )}
      {sorted.map((step, index) => {
        // Evre başlığı yalnız evre DEĞİŞİNCE çizilir (ardışık aynı evre tek başlık altında).
        const showHeader = step.phase !== sorted[index - 1]?.phase && phaseOf(step.phase) !== undefined;
        return (
          <View key={step.id}>
            {showHeader && <PhaseHeader phase={step.phase} first={index === 0} done={phaseDone.get(step.phase) === true} />}
            <Animated.View
              entering={
                reduceMotion
                  ? FadeIn.duration(150)
                  : FadeInDown.duration(280).springify().damping(16).delay(Math.min(index, 4) * 60)
              }>
              <StepRow
                step={step}
                last={index === sorted.length - 1}
                showResource={uniformType === null}
                completed={completedIds.has(step.id)}
                isNext={step.id === nextId}
                // Hiçbir adım işaretli değilken ilk adımda "Sıradaki" yerine "Buradan başla" yazar
                isStart={step.id === nextId && step.position === 1 && noneDone}
                errorText={markError?.stepId === step.id ? markError.text : null}
                onToggle={onToggle}
              />
            </Animated.View>
          </View>
        );
      })}
    </View>
  );
}

// Rota noktaları: satırın kalan yüksekliğini doldurur. Sayı, ölçülen yüksekliğe göre hesaplanır;
// ilk çizimde 0 nokta var, alan ise sabit flex:1 olduğu için yerleşim zıplamaz.
function RailDots() {
  const theme = useTheme();
  const [count, setCount] = useState(0);
  return (
    <View
      onLayout={(e) => setCount(Math.min(60, Math.max(0, Math.floor(e.nativeEvent.layout.height / DOT_PITCH))))}
      style={styles.dots}>
      {Array.from({ length: count }, (_, i) => (
        <View key={i} style={[styles.dot, { backgroundColor: theme.borderStrong }]} />
      ))}
    </View>
  );
}

function PhaseHeader({ phase, first, done }: { phase: string; first: boolean; done: boolean }) {
  const reduceMotion = useReducedMotion();
  // Çip yalnız bu ekranda false→true GEÇİŞİNDE yaylanır; liste yüklenirken zaten tamamlanmış evrede
  // (ilk çizimde done=true) animasyon oynamaz.
  const [startedDone] = useState(done);
  const theme = useTheme();
  const style = phaseOf(phase);
  if (!style) return null;
  return (
    <View style={styles.row}>
      <View style={styles.rail} accessibilityElementsHidden importantForAccessibility="no-hide-descendants">
        <RailDots />
      </View>
      <View
        accessible
        accessibilityRole="header"
        accessibilityLabel={style.label}
        style={[styles.phaseHeader, { paddingTop: first ? 0 : Spacing.two }]}>
        <Text allowFontScaling={false} style={styles.phaseEmoji}>
          {style.emoji}
        </Text>
        <ThemedText type="eyebrow">{style.label}</ThemedText>
        {done && (
          // Evre bitince çip yaylanarak belirir (hafif kutlama); reduce motion'da sade solma
          <Animated.View
            entering={startedDone ? undefined : reduceMotion ? FadeIn.duration(150) : ZoomIn.springify().damping(9)}>
            <StatusChip tone="accent" emoji="✓" label="Evre tamamlandı" />
          </Animated.View>
        )}
        <View style={[styles.phaseLine, { backgroundColor: theme.border }]} />
      </View>
    </View>
  );
}

function StepRow({
  step,
  last,
  showResource,
  completed,
  isNext,
  isStart,
  errorText,
  onToggle,
}: {
  step: StepItem;
  last: boolean;
  showResource: boolean;
  completed: boolean;
  isNext: boolean;
  isStart: boolean;
  errorText: string | null;
  onToggle: (stepId: string) => void;
}) {
  const theme = useTheme();
  const shadow = useShadow();
  const reduceMotion = useReducedMotion();
  const resource = resourceOf(step.resource_type);
  const hoursText = `${step.estimated_hours} saat`;

  // Mikro animasyon: durak yalnız KULLANICI işaretleyince "pop" yapar. İlk çizimde (liste yüklenirken
  // zaten tamamlanmış adımlar) oynamasın diye önceki değer ref'te tutulur.
  // withTiming kullanılır (yay değil): web'de yay animasyonu 1.25'te takılı kalabiliyordu; süreli
  // animasyon her platformda kesin biter. Başka bir değişimde (geri alma, hata) değer 1'e çekilir.
  const scale = useSharedValue(1);
  const prevCompleted = useRef(completed);
  useEffect(() => {
    if (prevCompleted.current !== completed && completed && !reduceMotion) {
      scale.value = withSequence(withTiming(1.2, { duration: 120 }), withTiming(1, { duration: 160 }));
    } else {
      scale.value = withTiming(1, { duration: 100 });
    }
    prevCompleted.current = completed;
  }, [completed, reduceMotion, scale]);
  const popStyle = useAnimatedStyle(() => ({ transform: [{ scale: scale.value }] }));

  // Ekran okuyucu: etiket KISA (başlık + süre + sıradaki mi), uzun açıklama ipucuna (hint) gider.
  // Tamamlandı/tamamlanmadı bilgisini accessibilityState (checked) söyler.
  const label =
    `Adım ${step.position}: ${step.title}, ${hoursText}` +
    (isStart ? ', Buradan başla' : isNext ? ', Sıradaki adım' : '');
  const hint = `${completed ? 'Geri almak için çift dokun.' : 'İşaretlemek için çift dokun.'} ${step.description}`;

  // Kart kenarı: tamamlandı = accent, sıradaki = sarı (marker), son adım = accent, diğerleri nötr
  const borderColor = completed ? theme.accent : isNext ? theme.markerEdge : last ? theme.accent : theme.border;

  return (
    <View style={styles.row}>
      <View style={styles.rail} accessibilityElementsHidden importantForAccessibility="no-hide-descendants">
        {/* Durak: tamamlandı ✓ (accent) · sıradaki adım sarı · son adım 🏁 · diğerleri nötr numara */}
        <Animated.View
          style={[
            styles.stop,
            completed
              ? { backgroundColor: theme.accent, borderColor: theme.accentEdge }
              : isNext
                ? { backgroundColor: theme.marker, borderColor: theme.markerEdge }
                : { backgroundColor: theme.card, borderColor: last ? theme.accent : theme.borderStrong },
            popStyle,
          ]}>
          <ThemedText
            type="chip"
            allowFontScaling={false}
            themeColor={completed ? 'onAccent' : isNext ? 'onMarker' : 'text'}
            style={styles.stopText}>
            {completed ? '✓' : last && !isNext ? '🏁' : step.position}
          </ThemedText>
        </Animated.View>
        {!last && <RailDots />}
      </View>

      <View style={styles.cardColumn} role="listitem">
        {/* Tüm kart basılabilir (telefonda rahat hedef); yanlış dokunma riskini tek dokunuşla geri alma karşılar */}
        <Pressable
          accessibilityRole="checkbox"
          accessibilityState={{ checked: completed }}
          // react-native-web'de durumun DOM'a aria-checked olarak yansıması için ayrıca verilir
          aria-checked={completed}
          accessibilityLabel={label}
          accessibilityHint={hint}
          onPress={() => onToggle(step.id)}
          style={({ pressed }) => [
            styles.card,
            {
              backgroundColor: completed ? theme.accentSoft : theme.card,
              borderColor,
              transform: [{ translateY: pressed ? 2 : 0 }],
            },
            shadow('card'),
          ]}>
          <View style={styles.cardInner} importantForAccessibility="no-hide-descendants">
            {isStart && <StatusChip tone="marker" emoji="📍" label="Buradan başla" />}
            {isNext && !isStart && <StatusChip tone="marker" emoji="📍" label="Sıradaki adım" />}
            {completed && <StatusChip tone="accent" emoji="✓" label="Tamamlandı" />}
            <ThemedText type="cardTitle">{step.title}</ThemedText>
            <ThemedText type="small" themeColor="textSecondary">
              {step.description}
            </ThemedText>
            <View style={styles.chips}>
              <StatusChip tone="neutral" emoji="⏱" label={hoursText} />
              {resource && showResource && <StatusChip tone="neutral" emoji={resource.emoji} label={resource.label} />}
            </View>
          </View>
        </Pressable>
        {/* Hata mesajı kartın hemen altında: uzun listede ekran dışında kalmaz, hangi adımın
            kaydedilemediği de belli olur. Banner zaten alert + live region (ekran okuyucu duyurur). */}
        {errorText !== null && (
          <View style={styles.cardError}>
            <Banner tone="warning">{errorText}</Banner>
          </View>
        )}
      </View>
    </View>
  );
}

// Yüklenirken 3 satırlık iskelet: gerçek kartlara yakın yükseklik, içerik gelince sıçrama az olsun.
export function StepListSkeleton() {
  const theme = useTheme();
  return (
    <View accessible accessibilityLabel="Yükleniyor" accessibilityState={{ busy: true }}>
      {[0, 1, 2].map((i) => (
        <View key={i} style={styles.row}>
          <View style={styles.rail}>
            <Skeleton width={STOP} height={STOP} radius={STOP / 2} />
          </View>
          <View style={styles.cardColumn}>
            <View
              style={[
                styles.card,
                styles.skeletonCard,
                { backgroundColor: theme.card, borderColor: theme.border },
              ]}>
              <Skeleton width="60%" height={20} />
              <Skeleton width="100%" height={14} />
              <Skeleton width="80%" height={14} />
              <Skeleton width={80} height={28} radius={Radius.pill} />
            </View>
          </View>
        </View>
      ))}
    </View>
  );
}

const styles = StyleSheet.create({
  row: { flexDirection: 'row', gap: Spacing.two },
  rail: { width: RAIL, alignItems: 'center' },
  stop: {
    width: STOP,
    height: STOP,
    borderRadius: Radius.pill,
    borderWidth: Border.chunky,
    alignItems: 'center',
    justifyContent: 'center',
  },
  stopText: { fontSize: 16, lineHeight: 20, fontWeight: 900 },
  // flex:1 + overflow hidden: noktalar satırın kalan boşluğunu doldurur ama satırı UZATMAZ
  // Nokta 5 + aralık 9 = 14: DOT_PITCH ile aynı kalır, rota daha ince ve hafif görünür
  dots: { flex: 1, minHeight: 0, overflow: 'hidden', alignItems: 'center', gap: 9, paddingTop: 6 },
  dot: { width: 5, height: 5, borderRadius: 2.5 },
  uniform: { marginBottom: Spacing.three },
  phaseHeader: {
    flex: 1,
    minWidth: 0,
    flexDirection: 'row',
    alignItems: 'center',
    gap: Spacing.two,
    minHeight: 32,
    paddingBottom: Spacing.two,
  },
  phaseEmoji: { fontSize: 18, lineHeight: 22 },
  phaseLine: { flex: 1, height: Border.thin },
  cardColumn: { flex: 1, minWidth: 0, paddingBottom: Spacing.three },
  card: {
    borderWidth: Border.thick,
    borderRadius: Radius.md,
    padding: Spacing.three,
    minHeight: MinTouch,
  },
  cardError: { marginTop: Spacing.two },
  cardInner: { gap: Spacing.two },
  skeletonCard: { minHeight: 148, gap: Spacing.two },
  chips: { flexDirection: 'row', flexWrap: 'wrap', gap: Spacing.two, marginTop: Spacing.one },
});
