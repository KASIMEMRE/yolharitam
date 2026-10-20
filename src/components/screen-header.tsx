import { StyleSheet, View } from 'react-native';

import { IconTile } from '@/components/icon-tile';
import { ThemedText } from '@/components/themed-text';
import { Spacing } from '@/constants/theme';
import type { Hue } from '@/constants/visuals';

// Sekme ekranlarının ortak başlığı: ikon + küçük üst yazı + büyük başlık .
type ScreenHeaderProps = {
  title: string;
  eyebrow?: string;
  emoji?: string;
  hue?: Hue;
};

export function ScreenHeader({ title, eyebrow, emoji, hue = 'accent' }: ScreenHeaderProps) {
  return (
    <View style={styles.wrapper}>
      <View style={styles.row}>
        {emoji && <IconTile emoji={emoji} tone={hue} size={48} />}
        <View style={styles.texts}>
          {eyebrow && (
            <ThemedText type="eyebrow" themeColor="textSecondary" numberOfLines={1}>
              {eyebrow}
            </ThemedText>
          )}
          <ThemedText type="heading" accessibilityRole="header">
            {title}
          </ThemedText>
        </View>
      </View>
    </View>
  );
}

const styles = StyleSheet.create({
  wrapper: { gap: Spacing.two },
  // minHeight 72 (48 ikon + dikey boşluk + eyebrow payı): eyebrow ('Merhaba, ad') gelip gidince başlık zıplamasın;
  // ikonsuz başlık (Profil) da diğer sekmelerle aynı yükseklikte kalsın
  row: { flexDirection: 'row', alignItems: 'center', gap: Spacing.three, paddingVertical: Spacing.two, minHeight: 72 },
  texts: { flex: 1, minWidth: 0 },
});
