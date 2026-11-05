import type { ReactNode } from 'react';
import { StyleSheet, useWindowDimensions, View } from 'react-native';

import { ThemedText } from '@/components/themed-text';
import { Spacing } from '@/constants/theme';

// Sekme ekranlarının ortak başlığı: isteğe bağlı küçük üst satır (ör. "Merhaba, @ad") + Bricolage 32/700 başlık
// + isteğe bağlı sağ eylem. Başlığın yanında simge kutusu yok.
type ScreenHeaderProps = {
  title: string;
  eyebrow?: string;
  // İsteğe bağlı sağ eylem alanı (ör. "…" menüsü, Profil'de Ayarlar düğmesi).
  right?: ReactNode;
};

export function ScreenHeader({ title, eyebrow, right }: ScreenHeaderProps) {
  // Dar ekranda (320 px) 32 punto başlık + sağdaki "…" düğmesi yan yana sığmayabilir: başlık 28 puntoya iner.
  const { width } = useWindowDimensions();
  const narrow = width < 360;
  return (
    <View style={styles.wrapper}>
      <View style={styles.row}>
        <View style={styles.texts}>
          {eyebrow && (
            <ThemedText type="eyebrow" themeColor="textSecondary" numberOfLines={1}>
              {eyebrow}
            </ThemedText>
          )}
          <ThemedText
            type="heading"
            accessibilityRole="header"
            style={narrow && styles.headingNarrow}>
            {title}
          </ThemedText>
        </View>
        {/* flexShrink 0: uzun başlık sıkışsa da eylem düğmesi küçülmesin */}
        {right && <View style={styles.right}>{right}</View>}
      </View>
    </View>
  );
}

const styles = StyleSheet.create({
  wrapper: { gap: Spacing.two },
  // minHeight 60: eyebrow ('Merhaba, ad') gelip gidince başlık zıplamasın; eyebrow'suz başlıklar
  // (Profil, Topluluk) da diğer sekmelerle aynı yükseklikte kalsın
  row: { flexDirection: 'row', alignItems: 'center', gap: Spacing.three, paddingVertical: Spacing.one, minHeight: 60 },
  texts: { flex: 1, minWidth: 0 },
  headingNarrow: { fontSize: 28, lineHeight: 34 },
  right: { flexShrink: 0 },
});
