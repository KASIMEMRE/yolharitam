import { Pressable, StyleSheet } from 'react-native';

import { ThemedText } from '@/components/themed-text';
import { ThemedView } from '@/components/themed-view';
import { Spacing } from '@/constants/theme';
import { useTheme } from '@/hooks/use-theme';

// Bu bileşen dışarıdan 4 şey alır (bunlara "props" denir):
type OptionCardProps = {
  title: string; // Kartın başlığı, örn. "Mobil Geliştirme"
  description?: string; // Altındaki açıklama (soru işareti = zorunlu değil)
  selected: boolean; // Kart seçili mi? true / false
  onPress: () => void; // Karta basılınca çalışacak fonksiyon
};

export function OptionCard({ title, description, selected, onPress }: OptionCardProps) {
  const theme = useTheme();

  return (
    <Pressable onPress={onPress} style={({ pressed }) => pressed && styles.pressed}>
      <ThemedView
        // Seçiliyse arka plan biraz koyulaşır ve kenarlık belirginleşir
        type={selected ? 'backgroundSelected' : 'backgroundElement'}
        style={[styles.card, { borderColor: selected ? theme.text : 'transparent' }]}>
        <ThemedText type="smallBold">{title}</ThemedText>
        {description && (
          <ThemedText type="small" themeColor="textSecondary">
            {description}
          </ThemedText>
        )}
      </ThemedView>
    </Pressable>
  );
}

const styles = StyleSheet.create({
  card: {
    padding: Spacing.three,
    borderRadius: Spacing.three,
    borderWidth: 2,
    gap: Spacing.one,
  },
  pressed: {
    opacity: 0.7,
  },
});
