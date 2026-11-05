import { Pressable, StyleSheet, View } from 'react-native';

import { ThemedText } from '@/components/themed-text';
import { MinTouch, Spacing } from '@/constants/theme';

// Bölüm başlığı: solda Bricolage 19/600 başlık, sağda isteğe bağlı metin bağlantısı ("Tümü", "Düzenle").
// Alt yazı (subtitle) YOK: açıklama satırı yalnız kullanıcının kararını değiştiriyorsa yazılır (AGENTS.md).
type SectionHeaderProps = {
  title: string;
  action?: { label: string; onPress: () => void };
};

export function SectionHeader({ title, action }: SectionHeaderProps) {
  return (
    <View style={styles.row}>
      <View style={styles.texts}>
        <ThemedText type="subtitle" accessibilityRole="header">
          {title}
        </ThemedText>
      </View>
      {action && (
        <Pressable onPress={action.onPress} accessibilityRole="button" accessibilityLabel={action.label} style={styles.action}>
          <ThemedText type="smallBold" themeColor="accentInk">
            {action.label}
          </ThemedText>
        </Pressable>
      )}
    </View>
  );
}

const styles = StyleSheet.create({
  row: { flexDirection: 'row', alignItems: 'center', gap: Spacing.two },
  texts: { flex: 1, minWidth: 0 },
  // Metin bağlantısı küçük olsa da dokunma alanı 44pt
  action: { minHeight: MinTouch, justifyContent: 'center', paddingLeft: Spacing.two },
});
