import { useEffect } from 'react';
import { type DimensionValue, View } from 'react-native';
import Animated, {
  useAnimatedStyle,
  useReducedMotion,
  useSharedValue,
  withRepeat,
  withTiming,
} from 'react-native-reanimated';

import { Radius } from '@/constants/theme';
import { useTheme } from '@/hooks/use-theme';

// Yüklenirken yerleşimi zıplatmayan gri blok (iskelet). Nabız gibi hafifçe yanıp söner.
// Hareketi azalt açıksa nabız durur, sabit kalır.
type SkeletonProps = { width?: DimensionValue; height: number; radius?: number };

export function Skeleton({ width = '100%', height, radius = Radius.sm }: SkeletonProps) {
  const theme = useTheme();
  const reduceMotion = useReducedMotion();
  const opacity = useSharedValue(1);

  useEffect(() => {
    if (reduceMotion) return;
    opacity.value = 0.55;
    opacity.value = withRepeat(withTiming(1, { duration: 800 }), -1, true);
  }, [reduceMotion, opacity]);

  const style = useAnimatedStyle(() => ({ opacity: opacity.value }));

  return (
    <Animated.View style={style}>
      <View style={{ width, height, borderRadius: radius, backgroundColor: theme.backgroundSelected }} />
    </Animated.View>
  );
}
