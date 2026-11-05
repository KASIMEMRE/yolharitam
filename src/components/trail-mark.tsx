import { View } from 'react-native';
import Svg, { Circle, Path } from 'react-native-svg';

import { useTheme } from '@/hooks/use-theme';

// Karşılama ekranının üst yarısı için sade patika çizimi: kesikli mürekkep çizgi, üzerinde duraklar.
// Bitenler dolu mürekkep nokta, sıradaki mercan (uygulamadaki "şimdi" noktasıyla aynı dil), ilerisi boş halka.
// Süstür: ekran okuyucudan gizlenir. Çizim 320x200'lük bir kutuya göre; genişlik ekrana göre ölçeklenir.
const W = 320;
const H = 200;
const PATH = 'M24 172 C 96 176, 70 96, 150 104 S 232 52, 296 34';
// Duraklar yolun üstünde, elle seçilmiş noktalar (x, y)
const DOTS: { x: number; y: number; kind: 'done' | 'now' | 'next' }[] = [
  { x: 24, y: 172, kind: 'done' },
  { x: 112, y: 128, kind: 'done' },
  { x: 190, y: 90, kind: 'now' },
  { x: 296, y: 34, kind: 'next' },
];

export function TrailMark({ width = W }: { width?: number }) {
  const theme = useTheme();
  const height = (width * H) / W;

  return (
    <View accessibilityElementsHidden importantForAccessibility="no-hide-descendants" style={{ width, height }}>
      <Svg width={width} height={height} viewBox={`0 0 ${W} ${H}`}>
        <Path d={PATH} stroke={theme.borderStrong} strokeWidth={2} strokeLinecap="round" strokeDasharray="1 8" fill="none" />
        {DOTS.map((d) =>
          d.kind === 'done' ? (
            <Circle key={d.x} cx={d.x} cy={d.y} r={6} fill={theme.accent} />
          ) : d.kind === 'now' ? (
            <Circle key={d.x} cx={d.x} cy={d.y} r={8} fill={theme.marker} />
          ) : (
            <Circle key={d.x} cx={d.x} cy={d.y} r={6} fill={theme.background} stroke={theme.borderStrong} strokeWidth={2} />
          ),
        )}
      </Svg>
    </View>
  );
}
