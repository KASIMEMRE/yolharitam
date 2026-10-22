import { StyleSheet, useWindowDimensions, View } from 'react-native';
import Animated, { FadeInDown } from 'react-native-reanimated';

import { Banner } from '@/components/banner';
import { Button } from '@/components/button';
import { IconTile } from '@/components/icon-tile';
import { StatusChip } from '@/components/level-badge';
import { ScreenHeader } from '@/components/screen-header';
import { TabScreen } from '@/components/tab-screen';
import { ThemedText } from '@/components/themed-text';
import { Border, Radius, Spacing } from '@/constants/theme';
import { describeTopic } from '@/constants/visuals';
import { useLatestRoadmap } from '@/hooks/use-latest-roadmap';
import { useTheme } from '@/hooks/use-theme';
import { ERROR_TEXT } from '@/lib/supabase-errors';

const INFO = 'Seçtiğin konularla ilgili güncel haberler burada olacak.';

// Henüz haber akışı yok: sahte haber göstermeyiz, dürüstçe "Yakında" deriz.
// Dokunulabilir hiçbir öğe yok (işlevsiz buton olmasın).
export default function NewsScreen() {
  const theme = useTheme();
  const { width } = useWindowDimensions();
  const { roadmap, failed, retry } = useLatestRoadmap();

  // Konu çipi yalnız GERÇEK seçimi gösterir; yol haritası yoksa çip de yok
  const { title: topicTitle, category, hue, hasTopic } = describeTopic(roadmap?.topic_path);
  const topic = roadmap && hasTopic ? { title: topicTitle } : undefined;

  return (
    <TabScreen>
      <ScreenHeader title="Gelişmeler" emoji="📰" hue="sky" />

      <Animated.View
        entering={FadeInDown.duration(300)}
        accessible
        accessibilityRole="text"
        accessibilityLabel={`Gelişmeler yakında. ${INFO}${topic ? ` Yayınlanınca haberler bu konudan gelecek: ${topic.title}` : ''}`}
        style={[
          styles.card,
          {
            backgroundColor: theme.card,
            borderColor: theme.border,
            padding: width < 360 ? Spacing.four : Spacing.five,
          },
        ]}>
        <Listening />
        {/* Kilitli kartlarla aynı dil: nötr + kilit (sarı yalnız "buradasın" işaretinde) */}
        <StatusChip tone="neutral" emoji="🔒" label="Yakında" align="center" />
        <ThemedText themeColor="textSecondary" style={styles.info}>
          {INFO}
        </ThemedText>

        {topic && (
          <View style={[styles.topicChip, { backgroundColor: theme[hue.soft], borderColor: theme[hue.line] }]}>
            <IconTile emoji={category.emoji} tone={category.hue} size={40} />
            <View style={styles.topicTexts}>
              <ThemedText type="small" themeColor={hue.ink}>
                Yayınlanınca haberler bu konudan gelecek
              </ThemedText>
              <ThemedText type="smallBold">{topic.title}</ThemedText>
            </View>
          </View>
        )}
      </Animated.View>

      {/* Konu çipi yüklenemediyse "seçmedin" demek yerine nedenini söyle */}
      {failed && (
        <View style={styles.errorBox}>
          <Banner tone="warning">{ERROR_TEXT.mapsLoadFailed}</Banner>
          <Button variant="secondary" icon="🔄" label="Tekrar dene" onPress={retry} />
        </View>
      )}
    </TabScreen>
  );
}

// "Dinliyor" sahnesi: ikonun arkasında tek, durağan bir halka. Sürekli genişleyen halkalar
// "canlı bir şey çalışıyor" izlenimi verirdi; henüz haber akışı olmadığı için hareket yok.
function Listening() {
  return (
    <View
      accessibilityElementsHidden
      importantForAccessibility="no-hide-descendants"
      style={styles.stage}>
      <StaticRing />
      <IconTile emoji="📰" tone="sky" size={96} />
    </View>
  );
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
  errorBox: { gap: Spacing.three },
  info: { textAlign: 'center', maxWidth: 300 },
  topicChip: {
    flexDirection: 'row',
    alignItems: 'center',
    flexShrink: 1,
    gap: Spacing.two,
    padding: Spacing.two,
    paddingRight: Spacing.three,
    borderRadius: Radius.lg,
    borderWidth: Border.thick,
  },
  topicTexts: { flexShrink: 1, gap: Spacing.half },
});
