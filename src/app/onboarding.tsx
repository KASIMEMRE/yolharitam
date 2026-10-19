import { router } from 'expo-router';
import { useState } from 'react';
import { ActivityIndicator, Pressable, ScrollView, StyleSheet, View } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';

import { OptionCard } from '@/components/option-card';
import { ThemedText } from '@/components/themed-text';
import { ThemedView } from '@/components/themed-view';
import { LEVELS } from '@/constants/onboarding';
import { Spacing } from '@/constants/theme';
import { useAuth } from '@/lib/auth-context';
import { supabase } from '@/lib/supabase';
import { getTopicChain, TOPICS } from '@/constants/topics';

export default function OnboardingScreen() {
  // 1) STATE: Seçilen konu yolu (id listesi) ve seviye.
  //    path örnekleri: []  ->  ['tech']  ->  ['tech', 'ai']  ->  ['tech', 'ai', 'llm']
  const [path, setPath] = useState<string[]>([]);
  const [level, setLevel] = useState<string | null>(null);
  const [saving, setSaving] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const { session } = useAuth();

  // 2) TÜRETİLMİŞ DEĞERLER: Hepsi path'ten hesaplanıyor.
  const chain = getTopicChain(path); // id'ler -> konu nesneleri
  const current = chain.at(-1); // En son seçilen konu (yoksa undefined)
  const options = current ? current.children : TOPICS; // Şu an gösterilecek seçenekler
  const isLeaf = current !== undefined && !current.children; // En alta inildi mi?
  const canContinue = isLeaf && level !== null && !saving;

  // 3) Bir konuya basınca yola ekle (bir seviye aşağı in)
  function selectTopic(id: string) {
    setPath([...path, id]);
  }

  // 4) Üstteki yol (breadcrumb) üzerindeki bir adıma basınca oraya geri dön
  function goTo(depth: number) {
    setPath(path.slice(0, depth));
    setLevel(null);
  }

  // Seçimi veritabanına kaydet, sonra yol haritası ekranına geç
  async function handleContinue() {
    if (!isLeaf || !level || !session) return;
    setSaving(true);
    setError(null);

    const { error } = await supabase.from('roadmaps').insert({
      user_id: session.user.id, // RLS: sadece kendi id'nle satır ekleyebilirsin
      topic_path: path.join('/'), // 'tech/ai/llm'
      level,
    });

    setSaving(false);
    if (error) {
      setError('Kaydedilemedi: ' + error.message);
      return;
    }
    // Onboarding sekmelerin üstünde açıldı: geri dönmek yeterli.
    // (Yol haritası sekmesi ekrana gelince useFocusEffect ile kendini tazeler.)
    if (router.canGoBack()) router.back();
    else router.replace('/roadmap');
  }

  return (
    <ThemedView style={styles.container}>
      <SafeAreaView style={styles.safeArea} edges={['bottom']}>
        <ScrollView contentContainerStyle={styles.content}>
          <ThemedText type="subtitle">Ne öğrenmek istiyorsun?</ThemedText>

          {/* BREADCRUMB: Tümü › Teknoloji › Yapay Zeka  (her adıma basılabilir) */}
          <View style={styles.breadcrumb}>
            <Pressable onPress={() => goTo(0)}>
              <ThemedText type="small" themeColor={path.length ? 'textSecondary' : 'text'}>
                Tümü
              </ThemedText>
            </Pressable>
            {chain.map((topic, index) => (
              <View key={topic.id} style={styles.crumb}>
                <ThemedText type="small" themeColor="textSecondary">›</ThemedText>
                <Pressable onPress={() => goTo(index + 1)}>
                  <ThemedText
                    type="small"
                    themeColor={index === chain.length - 1 ? 'text' : 'textSecondary'}>
                    {topic.title}
                  </ThemedText>
                </Pressable>
              </View>
            ))}
          </View>

          {/* Henüz yaprağa inilmediyse: mevcut seviyenin seçeneklerini göster */}
          {!isLeaf &&
            options?.map((item) => (
              <OptionCard
                key={item.id}
                title={item.title}
                description={item.description}
                selected={false}
                onPress={() => selectTopic(item.id)}
              />
            ))}

          {/* Yaprağa inildiyse: seçilen konuyu ve seviye seçimini göster */}
          {isLeaf && (
            <>
              <OptionCard
                title={current.title}
                description="Değiştirmek için yukarıdaki yoldan geri dönebilirsin"
                selected
                onPress={() => goTo(path.length - 1)}
              />
              <ThemedText type="smallBold" style={styles.sectionTitle}>
                Seviyen
              </ThemedText>
              {LEVELS.map((item) => (
                <OptionCard
                  key={item.id}
                  title={item.title}
                  description={item.description}
                  selected={level === item.id}
                  onPress={() => setLevel(item.id)}
                />
              ))}
            </>
          )}
        </ScrollView>

        {error && <ThemedText type="small">{error}</ThemedText>}

        <Pressable
          onPress={handleContinue}
          disabled={!canContinue}
          style={({ pressed }) => [pressed && styles.pressed, !canContinue && styles.disabled]}>
          <ThemedView type="backgroundSelected" style={styles.button}>
            {saving ? (
              <ActivityIndicator />
            ) : (
              <ThemedText type="smallBold">Yol haritamı oluştur →</ThemedText>
            )}
          </ThemedView>
        </Pressable>
      </SafeAreaView>
    </ThemedView>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1 },
  safeArea: { flex: 1, paddingHorizontal: Spacing.four, paddingBottom: Spacing.three },
  content: { gap: Spacing.two, paddingVertical: Spacing.four },
  breadcrumb: { flexDirection: 'row', flexWrap: 'wrap', alignItems: 'center', gap: Spacing.one },
  crumb: { flexDirection: 'row', alignItems: 'center', gap: Spacing.one },
  sectionTitle: { marginTop: Spacing.three },
  button: {
    paddingVertical: Spacing.three,
    borderRadius: Spacing.five,
    alignItems: 'center',
  },
  pressed: { opacity: 0.7 },
  disabled: { opacity: 0.4 },
});
