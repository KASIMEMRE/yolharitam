import { router } from 'expo-router';
import { useEffect, useState } from 'react';
import { Pressable, ScrollView, StyleSheet, useWindowDimensions, View } from 'react-native';
import Animated, {
  useAnimatedStyle,
  useReducedMotion,
  useSharedValue,
  withSequence,
  withTiming,
} from 'react-native-reanimated';
import { SafeAreaView } from 'react-native-safe-area-context';

import { Banner } from '@/components/banner';
import { Button } from '@/components/button';
import { Celebration } from '@/components/celebration';
import { OptionCard } from '@/components/option-card';
import { StepIndicator } from '@/components/step-indicator';
import { ThemedText } from '@/components/themed-text';
import { ThemedView } from '@/components/themed-view';
import { LEVELS } from '@/constants/onboarding';
import { Border, MaxContentWidth, Radius, Spacing } from '@/constants/theme';
import { HUES, LEVEL_STYLE, getCategoryStyle } from '@/constants/visuals';
import { useTheme } from '@/hooks/use-theme';
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
  // Kayıt başarılı olunca kısa kutlama göstermek için (hata olursa hiç true olmaz)
  const [celebrating, setCelebrating] = useState(false);

  // 2) TÜRETİLMİŞ DEĞERLER: Hepsi path'ten hesaplanıyor.
  const chain = getTopicChain(path); // id'ler -> konu nesneleri
  const current = chain.at(-1); // En son seçilen konu (yoksa undefined)
  const options = current ? current.children : TOPICS; // Şu an gösterilecek seçenekler
  const isLeaf = current !== undefined && !current.children; // En alta inildi mi?
  const canContinue = isLeaf && level !== null && !saving && !celebrating;

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
    // Kayıt başarılı: önce kısa kutlama göster; bittiğinde finishCelebration ekranı kapatır.
    setCelebrating(true);
  }

  // Kutlama bitince eski davranış: Onboarding sekmelerin üstünde açıldı, geri dönmek yeterli.
  // (Yol haritası sekmesi ekrana gelince useFocusEffect ile kendini tazeler.)
  function finishCelebration() {
    if (router.canGoBack()) router.back();
    else router.replace('/roadmap');
  }

  // Görünümle ilgili değerler
  const theme = useTheme();
  const reduceMotion = useReducedMotion();
  const { width, fontScale } = useWindowDimensions();
  const gutter = width < 360 ? Spacing.three : Spacing.four;
  // Kategori görünümü (emoji + renk) her derinlikte yoldaki İLK parçadan gelir
  const category = getCategoryStyle(path[0]);

  // Seviye seçilince buton kısa bir "pop" yapsın (hareketi azalt açıksa yapmaz)
  const pop = useSharedValue(1);
  useEffect(() => {
    if (level !== null && !reduceMotion) {
      pop.value = withSequence(withTiming(1.03, { duration: 100 }), withTiming(1, { duration: 120 }));
    }
  }, [level, reduceMotion, pop]);
  const popStyle = useAnimatedStyle(() => ({ transform: [{ scale: pop.value }] }));

  return (
    <ThemedView style={styles.container}>
      <SafeAreaView style={styles.safeArea} edges={['bottom']}>
        <ScrollView
          style={styles.flex}
          contentContainerStyle={[styles.content, { padding: gutter }]}
          pointerEvents={saving ? 'none' : 'auto'}>
          <View style={styles.inner}>
            {/* Başlık + sağda iki adımlı gösterge (1 Konu, 2 Seviye) */}
            <View style={styles.titleRow}>
              <ThemedText type="heading" accessibilityRole="header" style={styles.titleText}>
                Ne öğrenmek istiyorsun?
              </ThemedText>
              <StepIndicator current={isLeaf ? 1 : 0} />
            </View>

            {/* BREADCRUMB: Tümü › Teknoloji › Yapay Zeka (her adıma basılabilir). Kökteyken gizli. */}
            {path.length > 0 && (
              <View style={styles.breadcrumb}>
                <Pressable
                  onPress={() => goTo(0)}
                  hitSlop={{ top: 6, bottom: 6, left: 4, right: 4 }}
                  accessibilityRole="button"
                  accessibilityLabel="Geri dön: Tümü"
                  style={[styles.crumb, { backgroundColor: theme.card, borderColor: theme.border }]}>
                  <ThemedText type="small" themeColor="textSecondary">
                    Tümü
                  </ThemedText>
                </Pressable>
                {chain.map((topic, index) => {
                  const last = index === chain.length - 1;
                  return (
                    <View key={topic.id} style={styles.crumbGroup}>
                      <ThemedText type="small" themeColor="textSecondary">
                        ›
                      </ThemedText>
                      <Pressable
                        onPress={() => goTo(index + 1)}
                        hitSlop={{ top: 6, bottom: 6, left: 4, right: 4 }}
                        accessibilityRole="button"
                        accessibilityLabel={last ? `Şu an: ${topic.title}` : `Geri dön: ${topic.title}`}
                        style={[
                          styles.crumb,
                          last
                            ? { backgroundColor: theme[HUES[category.hue].soft], borderColor: theme[HUES[category.hue].line] }
                            : { backgroundColor: theme.card, borderColor: theme.border },
                        ]}>
                        <ThemedText
                          type={last ? 'smallBold' : 'small'}
                          themeColor={last ? HUES[category.hue].ink : 'textSecondary'}>
                          {topic.title}
                        </ThemedText>
                      </Pressable>
                    </View>
                  );
                })}
              </View>
            )}

            {/* Henüz yaprağa inilmediyse: mevcut seviyenin seçeneklerini göster.
                key değişince kartlar yeniden belirir (giriş animasyonu tekrar oynar). */}
            {!isLeaf && (
              <View
                key={current?.id ?? 'root'}
                style={path.length === 0 && fontScale <= 1.3 ? styles.grid : styles.list}>
                {options?.map((item, index) => {
                  // Kökte kartın kendi kategorisi, daha derinde yoldaki ilk kategori
                  const style = getCategoryStyle(path.length === 0 ? item.id : path[0]);
                  const tile = path.length === 0 && fontScale <= 1.3;
                  return (
                    <OptionCard
                      key={item.id}
                      title={item.title}
                      description={item.description}
                      icon={style.emoji}
                      hue={style.hue}
                      variant={tile ? 'tile' : 'list'}
                      trailing={tile ? 'none' : 'chevron'}
                      index={index}
                      onPress={() => selectTopic(item.id)}
                    />
                  );
                })}
              </View>
            )}

            {/* Yaprağa inildiyse: seçilen konunun özeti ve seviye seçimi */}
            {isLeaf && (
              <>
                <OptionCard
                  variant="compact"
                  title={current.title}
                  icon={category.emoji}
                  hue={category.hue}
                  actionLabel="Değiştir"
                  onPress={() => goTo(path.length - 1)}
                />
                <ThemedText type="cardTitle" accessibilityRole="header" style={styles.sectionTitle}>
                  Seviyeni seç
                </ThemedText>
                <View accessibilityRole="radiogroup" style={styles.list}>
                  {LEVELS.map((item, index) => (
                    <OptionCard
                      key={item.id}
                      role="radio"
                      title={item.title}
                      description={item.description}
                      icon={LEVEL_STYLE[item.id]?.emoji}
                      ladder={(index + 1) as 1 | 2 | 3}
                      trailing="check"
                      selected={level === item.id}
                      index={index}
                      onPress={() => setLevel(item.id)}
                    />
                  ))}
                </View>
              </>
            )}
          </View>
        </ScrollView>

        {/* Alt çubuk: hata + ana buton hep görünür kalır */}
        <View
          style={[
            styles.footer,
            { paddingHorizontal: gutter, borderTopColor: theme.border, backgroundColor: theme.background },
          ]}>
          {error && <Banner tone="warning">{error}</Banner>}
          <Animated.View style={popStyle}>
            <Button
              label="Yol haritamı oluştur"
              onPress={handleContinue}
              disabled={!canContinue && !saving}
              loading={saving}
            />
          </Animated.View>
        </View>
      </SafeAreaView>

      {/* Kutlama yalnız kayıt BAŞARILI olunca açılır; hata yolunda hiç görünmez */}
      <Celebration
        visible={celebrating}
        emoji={category.emoji}
        hue={category.hue}
        title="Harika! Yolculuğun başlıyor."
        levelId={level ?? ''}
        onDone={finishCelebration}
      />
    </ThemedView>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1 },
  flex: { flex: 1 },
  safeArea: { flex: 1 },
  content: { alignItems: 'center' },
  inner: { width: '100%', maxWidth: MaxContentWidth, gap: Spacing.three },
  titleRow: { flexDirection: 'row', alignItems: 'center', gap: Spacing.three },
  titleText: { flex: 1, minWidth: 0 },
  breadcrumb: { flexDirection: 'row', flexWrap: 'wrap', alignItems: 'center', gap: Spacing.two },
  crumbGroup: { flexDirection: 'row', alignItems: 'center', gap: Spacing.two },
  crumb: {
    paddingVertical: Spacing.one,
    paddingHorizontal: Spacing.three,
    borderRadius: Radius.pill,
    borderWidth: Border.thick,
  },
  grid: { flexDirection: 'row', flexWrap: 'wrap', gap: Spacing.three },
  list: { gap: Spacing.three },
  sectionTitle: { marginTop: Spacing.three },
  footer: { gap: Spacing.three, paddingVertical: Spacing.three, borderTopWidth: 2 },
});
