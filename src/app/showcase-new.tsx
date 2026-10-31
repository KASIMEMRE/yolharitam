import { router, useLocalSearchParams } from 'expo-router';
import { useState } from 'react';
import { Pressable, ScrollView, StyleSheet, View } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';

import { IconLabel } from '@/components/icon';
import { Banner } from '@/components/banner';
import { Button } from '@/components/button';
import { Skeleton } from '@/components/skeleton';
import { TextField } from '@/components/text-field';
import { ThemedText } from '@/components/themed-text';
import { ThemedView } from '@/components/themed-view';
import { getRoadmap } from '@/constants/dev-roadmaps';
import { Border, MaxContentWidth, MinTouch, Radius, Spacing } from '@/constants/theme';
import { useLatestRoadmap } from '@/hooks/use-latest-roadmap';
import { createProject, GITHUB_URL_RE } from '@/hooks/use-showcase';
import { useTheme } from '@/hooks/use-theme';
import { ERROR_TEXT } from '@/lib/supabase-errors';

const TITLE_MAX = 80;
const DESC_MAX = 280;

// Proje paylaşma formu. Parametre: ?map=<harita id> (verilirse o harita seçili açılır).
export default function ShowcaseNewScreen() {
  const theme = useTheme();
  const params = useLocalSearchParams<{ map?: string }>();
  const mapParam = Array.isArray(params.map) ? params.map[0] : params.map;
  const { roadmaps, status: mapsStatus, retry } = useLatestRoadmap();

  const maps = roadmaps.flatMap((r) => {
    const m = getRoadmap(r.topic_path);
    return m ? [{ id: m.id, emoji: m.emoji, title: m.title }] : [];
  });
  const [picked, setPicked] = useState<string | null>(mapParam ?? null);
  // Seçim yoksa ya da artık listede değilse ilk haritaya düş (türetilmiş değer: efekt gerekmez)
  const mapId = picked && maps.some((m) => m.id === picked) ? picked : (maps[0]?.id ?? null);

  const [title, setTitle] = useState('');
  const [description, setDescription] = useState('');
  const [repo, setRepo] = useState('');
  const [demo, setDemo] = useState('');
  // Doğrulama mesajları yalnız "Paylaş"a basıldıktan sonra görünür (yazarken kızmasın)
  const [submitted, setSubmitted] = useState(false);
  const [busy, setBusy] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const t = title.trim();
  const repoUrl = repo.trim();
  const demoUrl = demo.trim();
  const errors = {
    title: t.length < 3 || t.length > TITLE_MAX ? `Başlık 3-${TITLE_MAX} karakter olmalı.` : undefined,
    repo: !GITHUB_URL_RE.test(repoUrl) ? 'Şu biçimde bir GitHub linki yaz: https://github.com/kullanici/proje' : undefined,
    demo: demoUrl && !/^https:\/\/\S+$/.test(demoUrl) ? 'Demo linki https:// ile başlamalı.' : undefined,
  };
  const valid = !errors.title && !errors.repo && !errors.demo && mapId !== null;

  async function submit() {
    setSubmitted(true);
    setError(null);
    if (!valid || !mapId) return;
    setBusy(true);
    const result = await createProject({
      map_id: mapId,
      title: t,
      description: description.trim(),
      repo_url: repoUrl,
      demo_url: demoUrl || null,
    });
    setBusy(false);
    if (result === null) {
      // Kaydedince listeye dön; vitrin odaklanınca kendini tazeler
      if (router.canGoBack()) router.back();
      else router.replace('/roadmap');
      return;
    }
    setError(
      result === 'limit'
        ? ERROR_TEXT.showcaseLimit
        : result === 'invalid'
          ? 'Bilgilerden biri geçersiz görünüyor. Alanları kontrol edip tekrar dene.'
          : result === 'network'
            ? ERROR_TEXT.network
            : ERROR_TEXT.showcaseSaveFailed
    );
  }

  return (
    <ThemedView style={styles.flex}>
      <SafeAreaView style={styles.flex} edges={['bottom']}>
        <ScrollView
          style={styles.flex}
          keyboardShouldPersistTaps="handled"
          automaticallyAdjustKeyboardInsets
          contentContainerStyle={styles.content}>
          <View style={styles.inner}>
            <ThemedText themeColor="textSecondary">
              Bitirdiğin bir projeyi diğer kullanıcılara göster. Proje herkese açık bir GitHub deposunda olmalı.
            </ThemedText>

            {mapsStatus === 'loading' && <Skeleton height={MinTouch} radius={Radius.pill} />}
            {mapsStatus === 'error' && (
              <>
                <Banner tone="warning">{ERROR_TEXT.mapsLoadFailed}</Banner>
                <Button variant="secondary" icon="🔄" label="Tekrar dene" onPress={retry} />
              </>
            )}
            {mapsStatus === 'ready' && maps.length === 0 && (
              <Banner tone="info">Proje paylaşmak için önce bir yol haritası seçmelisin.</Banner>
            )}

            {/* ?map= kullanıcının haritalarında yoksa sessizce başka haritaya düşmeyiz, söyleriz */}
            {mapsStatus === 'ready' && !!mapParam && maps.length > 0 && !maps.some((m) => m.id === mapParam) && (
              <Banner tone="info">Bu haritayı takip etmiyorsun; aşağıdan takip ettiğin bir harita seç.</Banner>
            )}

            {maps.length > 0 && (
              <View style={styles.group}>
                <ThemedText type="smallBold">Hangi harita için?</ThemedText>
                <View accessibilityRole="radiogroup" accessibilityLabel="Harita" style={styles.chips}>
                  {maps.map((m) => {
                    const selected = m.id === mapId;
                    return (
                      <Pressable
                        key={m.id}
                        onPress={() => setPicked(m.id)}
                        accessibilityRole="radio"
                        accessibilityLabel={m.title}
                        accessibilityState={{ selected }}
                        style={[
                          styles.chip,
                          {
                            backgroundColor: selected ? theme.accentSoft : theme.card,
                            borderColor: selected ? theme.accent : theme.border,
                          },
                        ]}>
                        <IconLabel emoji={m.emoji} type="chip" themeColor={selected ? 'accentInk' : 'text'}>
                          {m.title}
                        </IconLabel>
                      </Pressable>
                    );
                  })}
                </View>
              </View>
            )}

            <TextField
              label="Proje adı"
              value={title}
              onChangeText={setTitle}
              maxLength={TITLE_MAX}
              returnKeyType="next"
              invalid={submitted && !!errors.title}
              hint={submitted && errors.title ? errors.title : `${title.length} / ${TITLE_MAX}`}
            />
            <TextField
              label="Kısa açıklama (isteğe bağlı)"
              value={description}
              onChangeText={setDescription}
              maxLength={DESC_MAX}
              multiline
              hint={`${description.length} / ${DESC_MAX}`}
              style={styles.multiline}
            />
            <TextField
              label="GitHub linki"
              placeholder="https://github.com/kullanici/proje"
              value={repo}
              onChangeText={setRepo}
              autoCapitalize="none"
              autoCorrect={false}
              keyboardType="url"
              invalid={submitted && !!errors.repo}
              hint={submitted ? errors.repo : undefined}
            />
            <TextField
              label="Demo linki (isteğe bağlı)"
              placeholder="https://"
              value={demo}
              onChangeText={setDemo}
              autoCapitalize="none"
              autoCorrect={false}
              keyboardType="url"
              invalid={submitted && !!errors.demo}
              hint={submitted ? errors.demo : undefined}
            />

            {error && <Banner tone="warning">{error}</Banner>}
            <Button icon="🧩" label="Paylaş" loading={busy} disabled={mapId === null} onPress={submit} />
          </View>
        </ScrollView>
      </SafeAreaView>
    </ThemedView>
  );
}

const styles = StyleSheet.create({
  flex: { flex: 1 },
  content: { padding: Spacing.four, alignItems: 'center' },
  inner: { width: '100%', maxWidth: MaxContentWidth, gap: Spacing.three },
  group: { gap: Spacing.two },
  chips: { flexDirection: 'row', flexWrap: 'wrap', gap: Spacing.two },
  chip: {
    minHeight: MinTouch,
    justifyContent: 'center',
    paddingHorizontal: Spacing.three,
    borderRadius: Radius.pill,
    borderWidth: Border.thick,
  },
  multiline: { minHeight: 96, textAlignVertical: 'top' },
});
