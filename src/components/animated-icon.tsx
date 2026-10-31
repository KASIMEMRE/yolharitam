import { Image } from 'expo-image';
import * as SplashScreen from 'expo-splash-screen';
import { useState } from 'react';
import { StyleSheet, View } from 'react-native';
import Animated, { Easing, Keyframe } from 'react-native-reanimated';
import { scheduleOnRN } from 'react-native-worklets';

const DURATION = 500;

// Açılış geçişi: telefonun yerel açılış ekranı (app.json › expo-splash-screen) ile AYNI görünümdeki
// yeşil kaplama, uygulama çizildikten sonra yumuşakça kaybolur. Böylece açılışta ani bir sıçrama olmaz.
// Renk ve görsel app.json ile aynı tutulmalı.
const SPLASH_GREEN = '#1E7B6A';

export function AnimatedSplashOverlay() {
  const [animate, setAnimate] = useState(false);
  const [visible, setVisible] = useState(true);

  if (!visible) return null;

  const fadeOut = new Keyframe({
    0: { opacity: 1, transform: [{ scale: 1 }] },
    100: { opacity: 0, transform: [{ scale: 1.08 }], easing: Easing.out(Easing.quad) },
  });

  const logo = <Image style={styles.image} source={require('@/assets/images/splash-icon.png')} />;

  return animate ? (
    <Animated.View
      entering={fadeOut.duration(DURATION).withCallback((finished) => {
        'worklet';
        if (finished) scheduleOnRN(setVisible, false);
      })}
      pointerEvents="none"
      style={styles.overlay}>
      {logo}
    </Animated.View>
  ) : (
    <View
      onLayout={() => {
        SplashScreen.hideAsync().finally(() => setAnimate(true));
      }}
      style={styles.overlay}>
      {logo}
    </View>
  );
}

const styles = StyleSheet.create({
  image: { width: 140, height: 140 },
  overlay: {
    ...StyleSheet.absoluteFill,
    backgroundColor: SPLASH_GREEN,
    alignItems: 'center',
    justifyContent: 'center',
    zIndex: 1000,
  },
});
