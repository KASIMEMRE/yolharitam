import { useState } from 'react';
import { StyleSheet, Text, View } from 'react-native';
import Animated, { FadeIn, FadeInDown, useReducedMotion } from 'react-native-reanimated';

import { StatusChip } from '@/components/level-badge';
import { Skeleton } from '@/components/skeleton';
import { ThemedText } from '@/components/themed-text';
import type { Phase, ResourceType } from '@/constants/roadmap-templates';
import { Border, Radius, Spacing } from '@/constants/theme';
import { PHASE_STYLE, RESOURCE_STYLE, RESOURCE_SUMMARY } from '@/constants/visuals';
import { useShadow, useTheme } from '@/hooks/use-theme';

// Yol haritası adımlarının DİKEY listesi: solda rota rayı (numaralı duraklar + noktalar), sağda düz kartlar.
// Salt GÖRÜNTÜLEME: adımlar dokunulabilir görünmez (şevron/basma efekti yok), tamamlandı ✓ ve ilerleme
// yok; işaretleme Y-05'in işi. "Buradan başla" yalnız başlangıç noktasını gösterir, "şu an buradasın" demez.
// Veritabanından gelen satırların `phase`/`resource_type` alanları string; bilinmeyen değerde (örn. ileride
// bozuk yapay zekâ çıktısı) başlık/çip çizilmez ama uygulama çökmez.
export type StepItem = {
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

export function RoadmapStepList({ steps }: { steps: StepItem[] }) {
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
          <View key={step.position}>
            {showHeader && <PhaseHeader phase={step.phase} first={index === 0} />}
            <Animated.View
              entering={
                reduceMotion
                  ? FadeIn.duration(150)
                  : FadeInDown.duration(280).springify().damping(16).delay(Math.min(index, 4) * 60)
              }>
              <StepRow
                step={step}
                total={sorted.length}
                last={index === sorted.length - 1}
                showResource={uniformType === null}
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

function PhaseHeader({ phase, first }: { phase: string; first: boolean }) {
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
        <View style={[styles.phaseLine, { backgroundColor: theme.border }]} />
      </View>
    </View>
  );
}

function StepRow({
  step,
  total,
  last,
  showResource,
}: {
  step: StepItem;
  total: number;
  last: boolean;
  showResource: boolean;
}) {
  const theme = useTheme();
  const shadow = useShadow();
  const isFirst = step.position === 1;
  const resource = resourceOf(step.resource_type);
  const hoursText = `${step.estimated_hours} saat`;

  // Ekran okuyucu: kart tek öğe olarak okunur. TrailMap'teki "şu an" ifadesi bilerek kullanılmaz.
  const label =
    `Adım ${step.position} / ${total}: ${step.title}. ${hoursText}.` +
    (resource ? ` ${resource.label}.` : '') +
    (isFirst ? ' Buradan başla.' : '') +
    ` ${step.description}`;

  return (
    <View style={styles.row}>
      <View style={styles.rail} accessibilityElementsHidden importantForAccessibility="no-hide-descendants">
        {/* Durak: 1. adım sarı (başlangıç işareti), son adım 🏁 (varış), diğerleri nötr numara */}
        <View
          style={[
            styles.stop,
            isFirst
              ? { backgroundColor: theme.marker, borderColor: theme.markerEdge }
              : { backgroundColor: theme.card, borderColor: last ? theme.accent : theme.borderStrong },
          ]}>
          <ThemedText
            type="chip"
            allowFontScaling={false}
            themeColor={isFirst ? 'onMarker' : 'text'}
            style={styles.stopText}>
            {last && !isFirst ? '🏁' : step.position}
          </ThemedText>
        </View>
        {!last && <RailDots />}
      </View>

      <View style={styles.cardColumn}>
        <View
          role="listitem"
          accessible
          accessibilityLabel={label}
          style={[
            styles.card,
            { backgroundColor: theme.card, borderColor: isFirst ? theme.markerEdge : last ? theme.accent : theme.border },
            shadow('card'),
          ]}>
          <View style={styles.cardInner} importantForAccessibility="no-hide-descendants">
            {isFirst && <StatusChip tone="marker" emoji="📍" label="Buradan başla" />}
            <ThemedText type="cardTitle">{step.title}</ThemedText>
            <ThemedText type="small" themeColor="textSecondary">
              {step.description}
            </ThemedText>
            <View style={styles.chips}>
              <StatusChip tone="neutral" emoji="⏱" label={hoursText} />
              {resource && showResource && <StatusChip tone="neutral" emoji={resource.emoji} label={resource.label} />}
            </View>
          </View>
        </View>
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
  },
  cardInner: { gap: Spacing.two },
  skeletonCard: { minHeight: 148, gap: Spacing.two },
  chips: { flexDirection: 'row', flexWrap: 'wrap', gap: Spacing.two, marginTop: Spacing.one },
});
