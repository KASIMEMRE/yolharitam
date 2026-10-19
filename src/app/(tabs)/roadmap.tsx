import { Link, useFocusEffect } from 'expo-router';
import { useCallback, useState } from 'react';
import { ActivityIndicator, Pressable, StyleSheet } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';

import { ThemedText } from '@/components/themed-text';
import { ThemedView } from '@/components/themed-view';
import { LEVELS } from '@/constants/onboarding';
import { Spacing } from '@/constants/theme';
import { getTopicChain } from '@/constants/topics';
import type { Tables } from '@/lib/database.types';
import { supabase } from '@/lib/supabase';

// Tables<'roadmaps'> = roadmaps tablosundaki bir satırın tipi (otomatik üretilen dosyadan)
type Roadmap = Tables<'roadmaps'>;

export default function RoadmapScreen() {
  const [roadmap, setRoadmap] = useState<Roadmap | null>(null);
  const [loading, setLoading] = useState(true);

  // useFocusEffect: Bu sekme her ekrana geldiğinde çalışır.
  // Böylece onboarding'de konu değişince buraya dönüldüğünde liste tazelenir.
  useFocusEffect(
    useCallback(() => {
      async function load() {
        // SQL karşılığı: SELECT * FROM roadmaps ORDER BY created_at DESC LIMIT 1
        // (RLS sayesinde sadece giriş yapan kullanıcının satırları gelir)
        const { data } = await supabase
          .from('roadmaps')
          .select('*')
          .order('created_at', { ascending: false })
          .limit(1)
          .maybeSingle(); // 0 ya da 1 satır bekliyoruz
        setRoadmap(data);
        setLoading(false);
      }
      load();
    }, [])
  );

  const chain = roadmap ? getTopicChain(roadmap.topic_path.split('/')) : [];
  const topicTitle = chain.map((t) => t.title).join(' › ');
  const levelTitle = LEVELS.find((l) => l.id === roadmap?.level)?.title;

  return (
    <ThemedView style={styles.container}>
      <SafeAreaView style={styles.safeArea}>
        <ThemedText type="subtitle">Yol Haritam</ThemedText>

        {loading ? (
          <ActivityIndicator />
        ) : roadmap ? (
          <ThemedView type="backgroundElement" style={styles.card}>
            <ThemedText type="smallBold">{topicTitle}</ThemedText>
            <ThemedText type="small" themeColor="textSecondary">
              Seviye: {levelTitle}
            </ThemedText>
            <ThemedText type="small" themeColor="textSecondary">
              Kişisel yol haritan yakında burada oluşturulacak.
            </ThemedText>
          </ThemedView>
        ) : (
          <>
            <ThemedText themeColor="textSecondary">Henüz bir konu seçmedin.</ThemedText>
            <Link href="/onboarding" asChild>
              <Pressable style={({ pressed }) => pressed && styles.pressed}>
                <ThemedView type="backgroundSelected" style={styles.button}>
                  <ThemedText type="smallBold">Konunu seç →</ThemedText>
                </ThemedView>
              </Pressable>
            </Link>
          </>
        )}
      </SafeAreaView>
    </ThemedView>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1 },
  safeArea: { flex: 1, padding: Spacing.four, gap: Spacing.three },
  card: { padding: Spacing.three, borderRadius: Spacing.three, gap: Spacing.one },
  button: { paddingVertical: Spacing.three, borderRadius: Spacing.five, alignItems: 'center' },
  pressed: { opacity: 0.7 },
});
