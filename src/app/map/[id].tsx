import { router, Stack, useLocalSearchParams } from 'expo-router';
import { useState } from 'react';
import { Platform, Pressable, ScrollView, StyleSheet, useWindowDimensions, View } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';

import { Button } from '@/components/button';
import { HeaderBackButton } from '@/components/header-back-button';
import { ListGroup, ListRow } from '@/components/list-row';
import { Glyph } from '@/components/icon';
import { StatusDot } from '@/components/status-dot';
import { ThemedText } from '@/components/themed-text';
import { ThemedView } from '@/components/themed-view';
import { allTopics, countTopics, getRoadmap, KIND_LABEL } from '@/constants/dev-roadmaps';
import { Border, MaxContentWidth, Spacing } from '@/constants/theme';
import { HUES, MARKER_STYLE } from '@/constants/visuals';
import { useLatestRoadmap } from '@/hooks/use-latest-roadmap';
import { useTheme } from '@/hooks/use-theme';
import { useAuthGate } from '@/lib/auth-gate';

function first(param: string | string[] | undefined): string | undefined {
  return Array.isArray(param) ? param[0] : param;
}

// Harita önizleme: herkese açık, salt okunur. Kişi haritanın neyi kapsadığını görür, beğenirse seçer.
// Misafirde "Bu haritayı seç" kayıt kapısını açar; oturumluda seviye adımına (onboarding) gider.
export default function MapPreviewScreen() {
  const params = useLocalSearchParams<{ id?: string }>();
  const map = getRoadmap(first(params.id));
  const { requireAuth, isGuest } = useAuthGate();
  // Kullanıcı bu haritayı zaten takip ediyorsa düğme "Haritama git" olur (misafirde sorgu atılmaz)
  const { roadmaps, loading, activate } = useLatestRoadmap();
  // Bölüm açık/kapalı: varsayılan yalnız ilk bölüm açık (ilk bakışta içerik görünsün, gerisi dokununca).
  // State "varsayılandan çevrilenler" kümesidir; böylece başlangıç değeri hesaplamak gerekmez.
  const [flipped, setFlipped] = useState<Set<string>>(new Set());
  const theme = useTheme();
  const { width } = useWindowDimensions();
  const gutter = width < 360 ? Spacing.three : Spacing.four;

  function goBack() {
    if (router.canGoBack()) router.back();
    else router.replace(isGuest ? '/roadmap' : '/onboarding');
  }

  const screenOptions = (
    <Stack.Screen
      options={{
        // Sayfanın kendi başlığı harita adı; üst çubukta aynı adı tekrar yazmayız
        title: 'Harita',
        // Web'de varsayılan geri oku küçük; 44x44'lük kendi düğmemizi koyarız (native aynı kalır)
        headerLeft: Platform.OS === 'web' ? () => <HeaderBackButton onPress={goBack} label="Geri dön" /> : undefined,
      }}
    />
  );

  // Bilinmeyen kimlik (eski bağlantı): düz mesaj + kataloğa dönüş
  if (!map) {
    return (
      <ThemedView style={styles.container}>
        {screenOptions}
        <View style={[styles.problem, { padding: gutter }]}>
          <ThemedText type="heading" accessibilityRole="header">
            Harita bulunamadı
          </ThemedText>
          <ThemedText themeColor="textSecondary">Bu bağlantıdaki harita artık yok ya da adı değişmiş olabilir.</ThemedText>
          <Button label="Keşfet’e dön" onPress={() => router.replace(isGuest ? '/roadmap' : '/onboarding')} />
        </View>
      </ThemedView>
    );
  }

  const counts = countTopics(map);
  // Toplam süre: konu saatlerinin toplamı, tam saate yuvarlanır
  const hours = Math.max(1, Math.round(allTopics(map).reduce((sum, t) => sum + t.hours, 0)));
  const followed = roadmaps.find((r) => r.topic_path === map.id);

  function toggle(id: string) {
    setFlipped((prev) => {
      const next = new Set(prev);
      if (next.has(id)) next.delete(id);
      else next.add(id);
      return next;
    });
  }

  async function handlePick() {
    if (!map) return;
    if (isGuest) {
      requireAuth({ type: 'pick-map', mapId: map.id }, `${map.title} haritasını kaydetmek için ücretsiz hesap oluştur`);
      return;
    }
    if (followed) {
      // Haritayı aktif yap ki Yol Haritam sekmesi bu haritayla açılsın
      await activate(followed.id);
      router.replace('/roadmap');
      return;
    }
    router.push({ pathname: '/onboarding', params: { map: map.id } });
  }

  return (
    <ThemedView style={styles.container}>
      {screenOptions}
      <SafeAreaView style={styles.flex} edges={['bottom']}>
        <ScrollView style={styles.flex} contentContainerStyle={[styles.content, { padding: gutter }]}>
          <View style={styles.inner}>
            {/* Harita kimliği: çerçevesiz; renk yalnız küçük nokta. Başlık, tek paragraf açıklama, tek satır meta */}
            <View style={styles.identity}>
              <View style={styles.kindLine}>
                <View style={[styles.kindDot, { backgroundColor: theme[HUES[map.hue].line] }]} />
                <ThemedText type="eyebrow" themeColor={HUES[map.hue].ink}>
                  {KIND_LABEL[map.kind]}
                </ThemedText>
              </View>
              <ThemedText type="heading" accessibilityRole="header">
                {map.title}
              </ThemedText>
              <ThemedText>{map.tagline}</ThemedText>
              <ThemedText type="small" themeColor="textSecondary">
                {`${map.sections.length} bölüm · ${counts.total} konu · ~${hours} saat`}
              </ThemedText>
            </View>

            {/* Bölümler: ince çizgili satırlar. Açık bölümde konu satırları; konuya dokununca salt okunur konu ekranı. */}
            <View>
              {map.sections.map((section, index) => {
                const open = (index === 0) !== flipped.has(section.id);
                return (
                  <View key={section.id} style={[styles.section, { borderTopColor: theme.border }]}>
                    <Pressable
                      onPress={() => toggle(section.id)}
                      accessibilityRole="button"
                      accessibilityState={{ expanded: open }}
                      accessibilityLabel={`${section.title}, ${section.topics.length} konu. ${open ? 'Gizlemek' : 'Göstermek'} için dokun.`}
                      style={styles.sectionHead}>
                      <ThemedText type="defaultSemiBold" style={styles.sectionTitle}>
                        {section.title}
                      </ThemedText>
                      <ThemedText type="small" themeColor="textSecondary">
                        {`${section.topics.length} konu`}
                      </ThemedText>
                      <View style={open ? styles.chevronOpen : undefined}>
                        <Glyph emoji="›" size={18} color={theme.textSecondary} />
                      </View>
                    </Pressable>
                    {open && (
                      <ListGroup>
                        {section.topics.map((topic) => (
                          <ListRow
                            key={topic.id}
                            left={<StatusDot kind={topic.marker === 'core' ? 'todo' : 'optional'} />}
                            title={topic.title}
                            subtitle={
                              topic.marker === 'core'
                                ? `${topic.hours} saat`
                                : `${MARKER_STYLE[topic.marker].label} · ${topic.hours} saat`
                            }
                            onPress={() =>
                              router.push({ pathname: '/topic/[id]', params: { id: topic.id, map: map.id } })
                            }
                          />
                        ))}
                      </ListGroup>
                    )}
                  </View>
                );
              })}
            </View>
          </View>
        </ScrollView>

        {/* Altta sabit tek birincil düğme */}
        <View style={[styles.footer, { paddingHorizontal: gutter, borderTopColor: theme.border, backgroundColor: theme.background }]}>
          <View style={styles.footerInner}>
            <Button
              label={followed ? 'Haritama git' : 'Bu haritayı seç'}
              onPress={handlePick}
              disabled={!isGuest && loading}
            />
          </View>
        </View>
      </SafeAreaView>
    </ThemedView>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1 },
  flex: { flex: 1 },
  content: { alignItems: 'center' },
  inner: { width: '100%', maxWidth: MaxContentWidth, gap: Spacing.three },
  identity: { gap: Spacing.two },
  kindLine: { flexDirection: 'row', alignItems: 'center', gap: Spacing.two },
  kindDot: { width: 8, height: 8, borderRadius: 4 },
  section: { borderTopWidth: Border.thin },
  sectionHead: { flexDirection: 'row', alignItems: 'center', gap: Spacing.three, minHeight: 52 },
  sectionTitle: { flex: 1, minWidth: 0 },
  chevronOpen: { transform: [{ rotate: '90deg' }] },
  footer: { paddingVertical: Spacing.three, borderTopWidth: Border.thin, alignItems: 'center' },
  footerInner: { width: '100%', maxWidth: MaxContentWidth },
  problem: { flex: 1, justifyContent: 'center', gap: Spacing.three },
});
