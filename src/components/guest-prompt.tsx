import { StyleSheet, View } from 'react-native';

import { Button } from '@/components/button';
import { IconTile } from '@/components/icon-tile';
import { ThemedText } from '@/components/themed-text';
import { Spacing } from '@/constants/theme';
import type { Hue } from '@/constants/visuals';

// Misafir (oturumsuz) sekmelerinde kullanılan basit "boş durum + tek eylem" bloğu:
// simge, başlık, açıklama, bir birincil düğme ve isteğe bağlı sessiz ikinci düğme.
// Geçici bir çözüm: asıl misafir ekranları SM-03'te yapılacak.
type GuestPromptProps = {
  emoji: string;
  hue?: Hue;
  title: string;
  text: string;
  actionLabel: string;
  onAction: () => void;
  secondaryLabel?: string;
  onSecondary?: () => void;
};

export function GuestPrompt({ emoji, hue = 'accent', title, text, actionLabel, onAction, secondaryLabel, onSecondary }: GuestPromptProps) {
  return (
    <View style={styles.box}>
      <IconTile emoji={emoji} tone={hue} size={96} />
      <ThemedText type="heading" style={styles.center}>
        {title}
      </ThemedText>
      <ThemedText themeColor="textSecondary" style={styles.center}>
        {text}
      </ThemedText>
      <View style={styles.actions}>
        <Button label={actionLabel} onPress={onAction} />
        {secondaryLabel && onSecondary && <Button variant="text" label={secondaryLabel} onPress={onSecondary} />}
      </View>
    </View>
  );
}

const styles = StyleSheet.create({
  box: { alignItems: 'center', gap: Spacing.three, paddingVertical: Spacing.four },
  center: { textAlign: 'center' },
  actions: { alignSelf: 'stretch', gap: Spacing.one },
});
