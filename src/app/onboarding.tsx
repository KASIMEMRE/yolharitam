import { router, Stack, useLocalSearchParams } from 'expo-router';
import { useEffect, useState } from 'react';
import { Platform, ScrollView, StyleSheet, useWindowDimensions, View } from 'react-native';
import Animated, {
  useAnimatedStyle,
  useReducedMotion,
  useSharedValue,
  withSequence,
  withTiming,
} from 'react-native-reanimated';
import { SafeAreaView } from 'react-native-safe-area-context';

import { Button } from '@/components/button';
import { HeaderBackButton } from '@/components/header-back-button';
import { OptionCard } from '@/components/option-card';
import { StepIndicator } from '@/components/step-indicator';
import { ThemedText } from '@/components/themed-text';
import { TextField } from '@/components/text-field';
import { ThemedView } from '@/components/themed-view';
import { LEVELS } from '@/constants/onboarding';
import { MaxContentWidth, Spacing } from '@/constants/theme';
import { countTopics, DEV_ROADMAPS, getRoadmap, KIND_LABEL } from '@/constants/dev-roadmaps';
import { LEVEL_STYLE } from '@/constants/visuals';
import { useTheme } from '@/hooks/use-theme';
import { searchRoadmaps } from '@/lib/search-roadmaps';
import { resetWizardDone } from '@/lib/wizard-done';

export default function OnboardingScreen() {
  // 1) Seçilen harita ROUTE PARAMETRESİNDE ("?map=frontend"), seviye ise state'te.
  //    Neden parametre? Web'de tarayıcı geri tuşu harita listesine dönsün. Bilinmeyen değer gelirse yok sayılır.
  const params = useLocalSearchParams<{ map?: string }>();
  const rawMap = Array.isArray(params.map) ? params.map[0] : params.map;
  const selected = getRoadmap(rawMap);
  const [level, setLevel] = useState<string | null>(null);
  const [query, setQuery] = useState('');
  const hits = searchRoadmaps(DEV_ROADMAPS, query);
  const searching = query.trim().length > 0;

  // Yeni bir akış başlıyor: önceki sihirbaz kayıtlarını unut (bkz. wizard-done.ts)
  useEffect(() => {
    resetWizardDone();
  }, []);

  // Seçimi değiştirmenin tek kapısı.
  //  - Web: yeni geçmiş girdisi (push) açılır, tarayıcı geri tuşu listeye döner.
  //  - Native: yığına ekran EKLEMEDEN yalnız parametre güncellenir (setParams); üstteki geri
  //    düğmesi eskisi gibi onboarding'den çıkar.
  function changeMap(id: string | undefined, mode: 'push' | 'set') {
    if (Platform.OS === 'web' && mode === 'push') {
      router.push({ pathname: '/onboarding', params: id ? { map: id } : {} });
    } else {
      router.setParams({ map: id });
    }
  }

  const isPicked = selected !== undefined;
  const canContinue = isPicked && level !== null;

  // "Devam et": veritabanına HİÇBİR ŞEY yazılmaz, 3 soruya geçilir. Kayıt son sorudan sonra tek seferde
  // yapılır. push kullanıyoruz (replace değil): sorulardan geri gelince seçim korunur.
  function handleContinue() {
    if (!selected || !level) return;
    router.push({ pathname: '/roadmap-questions', params: { topicPath: selected.id, level } });
  }

  // Görünümle ilgili değerler
  const theme = useTheme();
  const reduceMotion = useReducedMotion();
  const { width, fontScale } = useWindowDimensions();
  const gutter = width < 360 ? Spacing.three : Spacing.four;
  const inlineIndicator = width >= 360 && fontScale <= 1.3;

  // Seviye seçilince buton kısa bir "pop" yapsın (hareketi azalt açıksa yapmaz)
  const pop = useSharedValue(1);
  useEffect(() => {
    if (level !== null && !reduceMotion) {
      pop.set(withSequence(withTiming(1.03, { duration: 100 }), withTiming(1, { duration: 120 })));
    }
  }, [level, reduceMotion, pop]);
  const popStyle = useAnimatedStyle(() => ({ transform: [{ scale: pop.value }] }));

  return (
    <ThemedView style={styles.container}>
      {/* Üst başlık adıma göre değişir: harita seçerken "Yol haritanı seç", seviye adımında "Seviyeni seç" */}
      {/* Web'de varsayılan geri oku 30x30 kadar küçük; 44x44'lük kendi düğmemizi koyarız (native aynı kalır) */}
      <Stack.Screen
        options={{
          title: isPicked ? 'Seviyeni seç' : 'Yol haritanı seç',
          headerLeft:
            Platform.OS === 'web'
              ? () => (
                  <HeaderBackButton
                    onPress={() => (router.canGoBack() ? router.back() : router.replace('/roadmap'))}
                    label="Geri dön"
                  />
                )
              : undefined,
        }}
      />
      <SafeAreaView style={styles.safeArea} edges={['bottom']}>
        <ScrollView
          style={styles.flex}
          contentContainerStyle={[styles.content, { padding: gutter, paddingBottom: isPicked ? gutter : Spacing.four }]}>
          <View style={styles.inner}>
            {/* Başlık + üç adımlı gösterge (1 Harita, 2 Seviye, 3 Sorular). Dar ekranda ya da büyük yazıda
                gösterge başlığın ÜSTÜNE geçer; yoksa başlık çok dar kalıp 4 satıra çıkardı. */}
            <View style={inlineIndicator ? styles.titleRow : styles.titleColumn}>
              {!inlineIndicator && <StepIndicator current={isPicked ? 1 : 0} />}
              <ThemedText type="heading" accessibilityRole="header" style={styles.titleText}>
                {isPicked ? 'Hangi seviyedesin?' : 'Hangi yolda ilerlemek istiyorsun?'}
              </ThemedText>
              {inlineIndicator && <StepIndicator current={isPicked ? 1 : 0} />}
            </View>

            {/* Arama: harita adında, açıklamasında ve konu başlıklarında (32 harita olunca liste uzun) */}
            {!selected && (
              <TextField
                label="Ara"
                placeholder="Örn. Kubernetes, React, veri, oyun"
                value={query}
                onChangeText={setQuery}
                autoCapitalize="none"
                autoCorrect={false}
                returnKeyType="search"
                hint={searching ? `${hits.length} harita bulundu` : 'Harita ya da konu adı yazabilirsin'}
              />
            )}

            {/* Arama sonuçları: tek liste; eşleşme bir konudaysa hangi konu olduğu yazılır */}
            {!selected && searching && (
              <View style={styles.list}>
                {hits.length === 0 && (
                  <ThemedText themeColor="textSecondary">
                    Sonuç bulunamadı. Daha kısa ya da farklı bir kelime dene.
                  </ThemedText>
                )}
                {hits.map(({ map: m, topicTitle }, index) => (
                  <OptionCard
                    key={m.id}
                    title={m.title}
                    description={topicTitle ? `${KIND_LABEL[m.kind]} · Konu: ${topicTitle}` : `${m.tagline} · ${countTopics(m).total} konu`}
                    icon={m.emoji}
                    hue={m.hue}
                    variant="list"
                    trailing="chevron"
                    hint="Bu yol haritasını seçmek için dokun"
                    index={index}
                    onPress={() => changeMap(m.id, 'push')}
                  />
                ))}
              </View>
            )}

            {/* Harita listesi: önce roller, sonra beceriler (roadmap.sh'teki ayrım) */}
            {!selected &&
              !searching &&
              (['role', 'skill'] as const).map((kind) => (
                <View key={kind} style={styles.list}>
                  <View style={styles.groupHead}>
                    <ThemedText type="cardTitle" accessibilityRole="header">
                      {KIND_LABEL[kind].replace('yol haritası', 'yol haritaları')}
                    </ThemedText>
                    <ThemedText type="small" themeColor="textSecondary">
                      {kind === 'role'
                        ? 'Bir meslek için baştan sona izlenecek yol.'
                        : 'Tek bir dil ya da araçta ustalaşmak için.'}
                    </ThemedText>
                  </View>
                  {DEV_ROADMAPS.filter((m) => m.kind === kind).map((m, index) => (
                    <OptionCard
                      key={m.id}
                      title={m.title}
                      description={`${m.tagline} · ${countTopics(m).total} konu`}
                      icon={m.emoji}
                      hue={m.hue}
                      variant="list"
                      trailing="chevron"
                      hint="Bu yol haritasını seçmek için dokun"
                      index={index}
                      onPress={() => changeMap(m.id, 'push')}
                    />
                  ))}
                </View>
              ))}

            {/* Harita seçildiyse: seçilen haritanın özeti ve seviye seçimi */}
            {selected && (
              <>
                <OptionCard
                  variant="compact"
                  title={selected.title}
                  icon={selected.emoji}
                  hue={selected.hue}
                  actionLabel="Değiştir"
                  onPress={() => {
                    setLevel(null);
                    changeMap(undefined, 'set');
                  }}
                />
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

        {/* Alt çubuk yalnız seviye adımında görünür; harita listesinde
            devre dışı bir buton yer kaplamasın */}
        {isPicked && (
        <View
          style={[
            styles.footer,
            { paddingHorizontal: gutter, borderTopColor: theme.border, backgroundColor: theme.background },
          ]}>
          <Animated.View style={popStyle}>
            <Button label="Devam et" onPress={handleContinue} disabled={!canContinue} />
          </Animated.View>
        </View>
        )}
      </SafeAreaView>
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
  titleColumn: { gap: Spacing.three, alignItems: 'flex-start' },
  titleText: { flex: 1, minWidth: 0 },
  groupHead: { gap: Spacing.one, marginTop: Spacing.two },
  list: { gap: Spacing.three },
  footer: { gap: Spacing.three, paddingVertical: Spacing.three, borderTopWidth: 2 },
});
