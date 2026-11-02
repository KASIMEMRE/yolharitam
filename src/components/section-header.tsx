import { Pressable, StyleSheet, View } from 'react-native';

import { ThemedText } from '@/components/themed-text';
import { MinTouch, Spacing } from '@/constants/theme';

// Bölüm başlığı: solda başlık (+ alt satır), sağda isteğe bağlı metin bağlantısı ("Tümü", "Düzenle").
type SectionHeaderProps = {
  title: string;
  subtitle?: string;
  action?: { label: string; onPress: () => void };
};

export function SectionHeader({ title, subtitle, action }: SectionHeaderProps) {
  return (
    <View style={styles.row}>
      <View style={styles.texts}>
        <ThemedText type="cardTitle" accessibilityRole="header">
          {title}
        </ThemedText>
        {subtitle ? (
          <ThemedText type="small" themeColor="textSecondary">
            {subtitle}
          </ThemedText>
        ) : null}
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
  texts: { flex: 1, minWidth: 0, gap: Spacing.half },
  // Metin bağlantısı küçük olsa da dokunma alanı 44pt
  action: { minHeight: MinTouch, justifyContent: 'center', paddingLeft: Spacing.two },
});
