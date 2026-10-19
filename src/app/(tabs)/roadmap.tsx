import { useLocalSearchParams } from 'expo-router';
import { StyleSheet } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';

import { ThemedText } from '@/components/themed-text';
import { ThemedView } from '@/components/themed-view';
import { LEVELS } from '@/constants/onboarding';
import { getTopicChain } from '@/constants/topics';
import { Spacing } from '@/constants/theme';

export default function RoadmapScreen() {
  // Onboarding'den gelen parametreleri oku: { topic: 'tech/ai/llm', level: 'beginner' } gibi
  const { topic, level } = useLocalSearchParams<{ topic?: string; level?: string }>();

  // 'tech/ai/llm' -> ['tech','ai','llm'] -> 'Teknoloji › Yapay Zeka › LLM & Prompt'
  const chain = topic ? getTopicChain(topic.split('/')) : [];
  const fieldTitle = chain.length ? chain.map((t) => t.title).join(' › ') : undefined;
  const levelTitle = LEVELS.find((l) => l.id === level)?.title;

  return (
    <ThemedView style={styles.container}>
      <SafeAreaView style={styles.safeArea}>
        <ThemedText type="subtitle">Yol Haritam</ThemedText>
        {fieldTitle && levelTitle ? (
          <ThemedText themeColor="textSecondary">
            {fieldTitle}{'\n'}{levelTitle} seviyesi için yol haritan burada olacak.
          </ThemedText>
        ) : (
          <ThemedText themeColor="textSecondary">Kişisel yol haritan burada olacak.</ThemedText>
        )}
      </SafeAreaView>
    </ThemedView>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1 },
  safeArea: { flex: 1, padding: Spacing.four, gap: Spacing.two },
});
