import { StyleSheet, View } from 'react-native';

import { useTheme } from '@/hooks/use-theme';

// Konu durum noktası (10px). Yol Haritam listesi ve ağaç lejantı aynı dili kullansın diye ortak.
//  - done: dolu mürekkep (accent) · doing: dolu mercan (marker, "çalışıyorum" / "şimdi")
//  - todo: 1.5px halka · optional: kesikli halka (isteğe bağlı / alternatif konu)
export type StatusDotKind = 'done' | 'doing' | 'todo' | 'optional';

export function StatusDot({ kind, size = 10 }: { kind: StatusDotKind; size?: number }) {
  const theme = useTheme();
  const base = { width: size, height: size, borderRadius: size / 2 };
  if (kind === 'done') return <View style={[base, { backgroundColor: theme.accent }]} />;
  if (kind === 'doing') return <View style={[base, { backgroundColor: theme.marker }]} />;
  return (
    <View
      style={[
        base,
        styles.ring,
        { borderColor: theme.borderStrong, borderStyle: kind === 'optional' ? 'dashed' : 'solid' },
      ]}
    />
  );
}

const styles = StyleSheet.create({
  ring: { borderWidth: 1.5 },
});
