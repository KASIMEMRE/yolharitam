import { Link } from 'expo-router';
import { StyleSheet, View } from 'react-native';
import Animated, { FadeIn, FadeInDown, ZoomIn, useReducedMotion } from 'react-native-reanimated';

import { Button } from '@/components/button';
import { IconTile } from '@/components/icon-tile';
import { LevelBadge, StatusChip } from '@/components/level-badge';
import { LockedCard } from '@/components/locked-card';
import { ScreenHeader } from '@/components/screen-header';
import { Skeleton } from '@/components/skeleton';
import { TabScreen } from '@/components/tab-screen';
import { ThemedText } from '@/components/themed-text';
import { Border, Edge, Radius, Spacing } from '@/constants/theme';
import { describeTopic } from '@/constants/visuals';
import { useLatestRoadmap } from '@/hooks/use-latest-roadmap';
import { useShadow, useTheme } from '@/hooks/use-theme';

export default function RoadmapScreen() {
  // Veri okuma (useFocusEffect ile her odakta tazeleme) ortak hook'ta: src/hooks/use-latest-roadmap.ts
  const { roadmap, loading } = useLatestRoadmap();

  return (
    <TabScreen>
      <ScreenHeader title="Yol Haritam" emoji="🗺️" hue="accent" />

      {loading ? (
        <JourneySkeleton />
      ) : roadmap ? (
        <>
          <JourneyCard topicPath={roadmap.topic_path} level={roadmap.level} />
          <Link href="/onboarding" asChild>
            <Button variant="secondary" icon="🧭" label="Konumu değiştir" />
          </Link>
          <FadingDots />
          <LockedCard
            emoji="🥾"
            title="Adımların yakında burada"
            description="Kişisel yol haritanın adımları hazırlanınca burada görünecek."
          />
        </>
      ) : (
        <EmptyState />
      )}
    </TabScreen>
  );
}

// Yolculuk kartı: konu, konu yolu, seviye. İlerleme yüzdesi/halkası YOK: böyle bir veri henüz yok.
function JourneyCard({ topicPath, level }: { topicPath: string; level: string }) {
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
        </View>
      </View>

      <View style={styles.body}>
        {parents !== '' && (
          <ThemedText type="small" themeColor="textSecondary">
            {parents}
          </ThemedText>
        )}
        <View style={[styles.divider, { backgroundColor: theme.border }]} />
        <View style={styles.meta}>
          <ThemedText type="eyebrow" themeColor="textSecondary">
            Seviyen
          </ThemedText>
          {/* Bilinmeyen seviyede rozet hiç çizilmez */}
          <LevelBadge levelId={level} size="md" />
        </View>
        <Animated.View entering={FadeIn.delay(reduceMotion ? 0 : 450)}>
          <StatusChip tone="marker" emoji="📍" label="Yolculuk başlıyor" />
        </Animated.View>
      </View>
    </View>
  );
}

// Süs: karttan kilitli kutuya inen üç nokta. Hepsi aynı renk ve dikey dizili: sayfalama/ilerleme
// noktası gibi okunmasın. Hizalama: kilitli kartın ikonunun ortasına denk gelir
// (kart kenarlığı + iç boşluk + ikon yarısı - nokta yarısı).
function FadingDots() {
  const theme = useTheme();
  return (
    <View
      accessibilityElementsHidden
      importantForAccessibility="no-hide-descendants"
      style={styles.dots}>
      {[0, 1, 2].map((i) => (
        <View key={i} style={[styles.dot, { backgroundColor: theme.borderStrong }]} />
      ))}
    </View>
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
  divider: { height: Border.thin },
  meta: { flexDirection: 'row', flexWrap: 'wrap', alignItems: 'center', gap: Spacing.three },
  dots: { flexDirection: 'column', gap: 6, marginLeft: Border.thick + Spacing.three + 32 - 4 },
  dot: { width: 8, height: 8, borderRadius: 4 },
  empty: { alignItems: 'center', gap: Spacing.three, paddingVertical: Spacing.five },
  centerText: { textAlign: 'center' },
});
