import { useEffect } from 'react';
import { StyleSheet, useWindowDimensions, View } from 'react-native';
import Animated, {
  FadeInDown,
  useAnimatedStyle,
  useReducedMotion,
  useSharedValue,
  withDelay,
  withRepeat,
  withTiming,
} from 'react-native-reanimated';

import { IconTile } from '@/components/icon-tile';
import { StatusChip } from '@/components/level-badge';
import { ScreenHeader } from '@/components/screen-header';
import { TabScreen } from '@/components/tab-screen';
import { ThemedText } from '@/components/themed-text';
import { Border, Radius, Spacing } from '@/constants/theme';
import { getTopicChain } from '@/constants/topics';
import { HUES, getCategoryStyle } from '@/constants/visuals';
import { useLatestRoadmap } from '@/hooks/use-latest-roadmap';
import { useTheme } from '@/hooks/use-theme';

const INFO = 'Seçtiğin konularla ilgili güncel haberler burada olacak.';

// Henüz haber akışı yok: sahte haber göstermeyiz, dürüstçe "Yakında" deriz.
// Dokunulabilir hiçbir öğe yok (işlevsiz buton olmasın).
export default function NewsScreen() {
  const theme = useTheme();
  const { width } = useWindowDimensions();
  const { roadmap } = useLatestRoadmap();

  // Konu çipi yalnız GERÇEK seçimi gösterir; yol haritası yoksa çip de yok
  const topic = roadmap ? getTopicChain(roadmap.topic_path.split('/')).at(-1) : undefined;
  const category = getCategoryStyle(roadmap?.topic_path);
  const hue = HUES[category.hue];

  return (
    <TabScreen>
      <ScreenHeader title="Gelişmeler" emoji="📰" hue="sky" />

      <Animated.View
        entering={FadeInDown.duration(300)}
        accessible
        accessibilityRole="text"
        accessibilityLabel={`Gelişmeler yakında. ${INFO}${topic ? ` Takip edilecek konu: ${topic.title}` : ''}`}
        style={[
          styles.card,
          {
            backgroundColor: theme.card,
            borderColor: theme.border,
            padding: width < 360 ? Spacing.four : Spacing.five,
          },
        ]}>
        <Listening />
        <StatusChip tone="marker" emoji="⏳" label="Yakında" />
        <ThemedText themeColor="textSecondary" style={styles.info}>
          {INFO}
        </ThemedText>

        {topic && (
          <View style={[styles.topicChip, { backgroundColor: theme[hue.soft], borderColor: theme[hue.line] }]}>
            <IconTile emoji={category.emoji} tone={category.hue} size={40} />
            <ThemedText type="small" themeColor={hue.ink} style={styles.topicText}>
              Takip edilecek konu: <ThemedText type="smallBold">{topic.title}</ThemedText>
            </ThemedText>
          </View>
        )}
      </Animated.View>
    </TabScreen>
  );
}

// "Dinliyor" sahnesi: ikonun arkasında genişleyip sönen iki halka (radar gibi).
// Hareketi azalt açıksa halkalar durur, tek sabit halka kalır.
function Listening() {
  const reduceMotion = useReducedMotion();
  return (
    <View
      accessibilityElementsHidden
      importantForAccessibility="no-hide-descendants"
      style={styles.stage}>
      {reduceMotion ? (
        <StaticRing />
      ) : (
        <>
          <Ring delay={0} />
          <Ring delay={900} />
        </>
      )}
      <IconTile emoji="📰" tone="sky" size={96} />
    </View>
  );
}

function Ring({ delay }: { delay: number }) {
  const theme = useTheme();
  const progress = useSharedValue(0);

  // Ekrandan çıkınca (unmount) animasyon da durur; ayrıca zamanlayıcı tutmuyoruz
  useEffect(() => {
    progress.value = withDelay(delay, withRepeat(withTiming(1, { duration: 1800 }), -1));
  }, [delay, progress]);

  const style = useAnimatedStyle(() => ({
    opacity: 0.5 * (1 - progress.value),
    transform: [{ scale: 1 + 0.8 * progress.value }],
  }));

  return <Animated.View pointerEvents="none" style={[styles.ring, { borderColor: theme.sky }, style]} />;
}

function StaticRing() {
  const theme = useTheme();
  return (
    <View
      pointerEvents="none"
      style={[styles.ring, { borderColor: theme.sky, opacity: 0.35, transform: [{ scale: 1.25 }] }]}
    />
  );
}

const styles = StyleSheet.create({
  card: {
    alignItems: 'center',
    gap: Spacing.three,
    borderRadius: Radius.xl,
    borderWidth: Border.thick,
  },
  stage: { width: 96, height: 96, alignItems: 'center', justifyContent: 'center', marginVertical: Spacing.three },
  ring: { position: 'absolute', width: 96, height: 96, borderRadius: 48, borderWidth: 2 },
  info: { textAlign: 'center', maxWidth: 300 },
  topicChip: {
    flexDirection: 'row',
    alignItems: 'center',
    flexShrink: 1,
    gap: Spacing.two,
    padding: Spacing.two,
    paddingRight: Spacing.three,
    borderRadius: Radius.pill,
    borderWidth: Border.thick,
  },
  topicText: { flexShrink: 1 },
});
