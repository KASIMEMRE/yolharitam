import { useEffect, useState } from 'react';
import { StyleSheet, Text, View } from 'react-native';
import Animated, { FadeInUp, FadeOutUp } from 'react-native-reanimated';
import { useSafeAreaInsets } from 'react-native-safe-area-context';

import { ThemedText } from '@/components/themed-text';
import { Border, Radius, Spacing } from '@/constants/theme';
import { XP_LABEL } from '@/constants/xp';
import { useTheme } from '@/hooks/use-theme';
import { useLastAward } from '@/lib/xp';

const SHOW_MS = 2200;

// Puan kazanılınca ekranın üstünde kısa süre görünen "+20 XP" bildirimi. Kök düzende bir kez durur.
// Dokunmaları engellemez (pointerEvents none) ve ekran okuyucuya duyurulur.
export function XpToast() {
  const theme = useTheme();
  const insets = useSafeAreaInsets();
  const award = useLastAward();
  // Süresi dolan bildirimin kimliği; yeni puan gelince (yeni kimlik) yeniden görünür
  const [hiddenId, setHiddenId] = useState<number | null>(null);

  useEffect(() => {
    if (!award) return;
    const timer = setTimeout(() => setHiddenId(award.id), SHOW_MS);
    return () => clearTimeout(timer);
  }, [award]);

  const visible = award && award.id !== hiddenId ? award : null;

  if (!visible) return null;
  return (
    <View pointerEvents="none" style={[styles.wrap, { top: insets.top + Spacing.two }]}>
      <Animated.View
        key={visible.id}
        entering={FadeInUp.duration(220)}
        exiting={FadeOutUp.duration(200)}
        accessible
        accessibilityLiveRegion="polite"
        accessibilityLabel={`${visible.amount} XP kazandın. ${visible.label ?? XP_LABEL[visible.kind]}`}
        style={[styles.toast, { backgroundColor: theme.markerSoft, borderColor: theme.markerEdge }]}>
        <Text allowFontScaling={false} style={styles.star}>
          ⭐
        </Text>
        <ThemedText type="smallBold" themeColor="markerInk">
          +{visible.amount} XP · {visible.label ?? XP_LABEL[visible.kind]}
        </ThemedText>
      </Animated.View>
    </View>
  );
}

const styles = StyleSheet.create({
  wrap: { position: 'absolute', left: 0, right: 0, alignItems: 'center', zIndex: 1000 },
  toast: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: Spacing.two,
    paddingVertical: Spacing.two,
    paddingHorizontal: Spacing.three,
    borderRadius: Radius.pill,
    borderWidth: Border.thick,
  },
  star: { fontSize: 16, lineHeight: 20 },
});
