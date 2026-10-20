import { useEffect, useState } from 'react';
import { StyleSheet, View } from 'react-native';
import Animated, {
  FadeIn,
  FadeInDown,
  ZoomIn,
  useAnimatedStyle,
  useReducedMotion,
  useSharedValue,
  withRepeat,
  withTiming,
} from 'react-native-reanimated';

import { Border, Radius } from '@/constants/theme';
import { useTheme } from '@/hooks/use-theme';

// "Adımların hazırlanıyor" anındaki küçük süs: patika soldan sağa BİR KEZ çizilir.
// SAHTE İLERLEME DEĞİL: durak sayısı adım sayısı anlamına gelmez, döngü ve yüzde yok.
// İlk durak sonunda sarıya (marker) döner ve 📍 düşer: Yol Haritam'daki "Buradan başla"nın habercisi.
type TrailDrawProps = {
  width: number;
  // Yavaş ağda (4 sn+) 📍 yavaşça nabız atar; "çalışıyor" hissi verir, yüzde göstermez.
  slow?: boolean;
};

const STOPS = 5;
const STOP_SIZE = 28;
const STEP_DELAY = 160; // her durağın belirme gecikmesi (ms)
const ARRIVE_AT = 1000; // 📍'in düştüğü an (ms)

export function TrailDraw({ width, slow = false }: TrailDrawProps) {
  const theme = useTheme();
  const reduceMotion = useReducedMotion();
  // 📍'in düşme zamanı geldi mi? (zamanlayıcı ayarlar)
  const [timerDone, setTimerDone] = useState(false);
  // Türetilmiş değer: "Hareketi azalt" açıkken işaret baştan yerinde durur.
  // Bunu effect içinde setState ile yapmak gereksiz ikinci bir çizime yol açardı.
  const arrived = reduceMotion || timerDone;
  const pulse = useSharedValue(1);

  useEffect(() => {
    if (reduceMotion) return;
    // Zamanlayıcı ekran kapanınca temizlenir (kapanmış bileşende setState çağrılmasın)
    const timer = setTimeout(() => setTimerDone(true), ARRIVE_AT);
    return () => clearTimeout(timer);
  }, [reduceMotion]);

  useEffect(() => {
    if (slow && !reduceMotion) {
      pulse.set(withRepeat(withTiming(0.6, { duration: 900 }), -1, true));
    }
  }, [slow, reduceMotion, pulse]);
  const pinStyle = useAnimatedStyle(() => ({ opacity: pulse.value }));

  return (
    // Tamamı süs: ekran okuyucudan gizli
    <View
      accessibilityElementsHidden
      importantForAccessibility="no-hide-descendants"
      style={[styles.row, { width }]}>
      {Array.from({ length: STOPS }, (_, i) => (
        <View key={i} style={i === 0 ? styles.itemFirst : styles.item}>
          {i > 0 && (
            <View style={styles.link}>
              {[0, 1, 2].map((k) => (
                <Animated.View
                  key={k}
                  entering={
                    reduceMotion ? FadeIn.duration(150) : FadeIn.delay((i - 1) * STEP_DELAY + 80 + k * 30)
                  }
                  style={[styles.dot, { backgroundColor: theme.borderStrong }]}
                />
              ))}
            </View>
          )}
          <Animated.View
            entering={reduceMotion ? FadeIn.duration(150) : ZoomIn.springify().damping(12).delay(i * STEP_DELAY)}
            style={[
              styles.stop,
              i === 0 && arrived
                ? { backgroundColor: theme.marker, borderColor: theme.markerEdge }
                : { backgroundColor: theme.accentSoft, borderColor: theme.accent },
            ]}>
            {i === 0 && arrived && (
              // Dış sarmalayıcı yalnız `entering` animasyonunu taşır, iç metin yalnız opacity (nabız) taşır.
              // İkisi aynı öğede olursa Reanimated "opacity layout animation tarafından ezilebilir" uyarısı verir.
              <Animated.View
                entering={
                  reduceMotion ? FadeIn.duration(150) : FadeInDown.springify().damping(8).stiffness(220)
                }
                style={styles.pin}>
                <Animated.Text allowFontScaling={false} style={[styles.pinText, pinStyle]}>
                  📍
                </Animated.Text>
              </Animated.View>
            )}
          </Animated.View>
        </View>
      ))}
    </View>
  );
}

const styles = StyleSheet.create({
  // Üstte 📍 için boşluk bırakılır ki kırpılmasın
  row: { flexDirection: 'row', alignItems: 'center', paddingTop: 28 },
  // İlk öğe yalnız durak (bağlantısı yok); diğerleri bağlantı + durak, eşit paylaşır
  itemFirst: { flexDirection: 'row', alignItems: 'center' },
  item: { flexDirection: 'row', alignItems: 'center', flex: 1 },
  link: { flex: 1, flexDirection: 'row', alignItems: 'center', justifyContent: 'center', gap: 6 },
  dot: { width: 6, height: 6, borderRadius: 3 },
  stop: {
    width: STOP_SIZE,
    height: STOP_SIZE,
    borderRadius: Radius.pill,
    borderWidth: Border.thick,
    alignItems: 'center',
    justifyContent: 'center',
  },
  pin: { position: 'absolute', top: -26 },
  pinText: { fontSize: 22, lineHeight: 28 },
});
