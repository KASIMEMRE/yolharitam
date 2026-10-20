import { Link } from 'expo-router';
import { useState } from 'react';
import { AccessibilityInfo, Platform, StyleSheet, View } from 'react-native';

import { AchievementsSection } from '@/components/achievements-section';
import { Avatar } from '@/components/avatar';
import { Banner } from '@/components/banner';
import { Button } from '@/components/button';
import { IconTile } from '@/components/icon-tile';
import { LevelBadge } from '@/components/level-badge';
import { ScreenHeader } from '@/components/screen-header';
import { Skeleton } from '@/components/skeleton';
import { TabScreen } from '@/components/tab-screen';
import { TextField } from '@/components/text-field';
import { ThemedText } from '@/components/themed-text';
import { Border, Edge, Radius, Spacing } from '@/constants/theme';
import { describeTopic } from '@/constants/visuals';
import { useDisplayName } from '@/hooks/use-display-name';
import { useLatestRoadmap } from '@/hooks/use-latest-roadmap';
import { useTheme } from '@/hooks/use-theme';
import { useAuth } from '@/lib/auth-context';
import { supabase } from '@/lib/supabase';
import { ERROR_TEXT } from '@/lib/supabase-errors';

const MAX_NAME_LENGTH = 40; // yalnız uygulamada sınırlanır (veritabanında kısıt yok)

export default function ProfileScreen() {
  const theme = useTheme();
  const { session } = useAuth();
  const { roadmap, loading } = useLatestRoadmap();
  const email = session?.user.email;

  // --- Görünen ad ---
  const { name, status: nameStatus, save } = useDisplayName();
  // draft = kullanıcının yazdığı metin; null = henüz yazmadı. Alan değeri render'da türetilir
  // (efektle senkronlamak yerine): sunucudan gelen ad kullanıcının yazdığını asla ezmez.
  const [draft, setDraft] = useState<string | null>(null);
  const [saving, setSaving] = useState(false);
  const [emptyError, setEmptyError] = useState(false);
  const [feedback, setFeedback] = useState<{ tone: 'success' | 'warning'; message: string } | null>(null);

  const nameLoading = nameStatus === 'loading';
  const value = draft ?? name ?? '';
  const trimmed = value.trim();
  // Boşluklar kırpılmış hâl kayıtlıyla aynıysa değişiklik yok sayılır
  const changed = trimmed !== (name ?? '');
  const saveDisabled = nameStatus !== 'ready' || saving || !changed;

  function announce(message: string) {
    // Yalnız iOS: Android'de Banner'ın live region'ı zaten okutuyor (çift duyuru olmasın)
    if (Platform.OS === 'ios') AccessibilityInfo.announceForAccessibility(message);
  }

  async function onSaveName() {
    // onSubmitEditing (klavyedeki "Bitti") butonun disabled durumunu atlar: burada da denetle
    if (saveDisabled) return;
    // Ad silinemez: boşsa istek göndermeden alanı hatalı işaretle
    if (trimmed === '') {
      setEmptyError(true);
      return;
    }
    setSaving(true);
    setFeedback(null);
    const result = await save(trimmed);
    setSaving(false);
    if (result.ok) {
      setDraft(null); // alan artık kayıtlı (kırpılmış) adı gösterir
      setFeedback({ tone: 'success', message: 'Adın kaydedildi.' });
      announce('Adın kaydedildi.');
    } else {
      // Yazılan metin (draft) kalır; kullanıcı tekrar deneyebilir
      setFeedback({ tone: 'warning', message: result.message });
      announce(result.message);
    }
  }

  function onChangeName(text: string) {
    setDraft(text);
    setEmptyError(false);
    setFeedback(null);
  }

  // Bozuk/bilinmeyen yol gelirse varsayılan görünüm kullanılır (çökme yok)
  const { title: topicTitle, parents, category, hue } = describeTopic(roadmap?.topic_path);

  return (
    <TabScreen>
      <ScreenHeader title="Profil" />

      {/* Kimlik: e-postanın baş harfi + varsa seçili konunun kategori rozeti */}
      <View style={styles.identity}>
        <Avatar
          email={email}
          size={96}
          badgeEmoji={roadmap ? category.emoji : undefined}
          badgeHue={roadmap ? category.hue : undefined}
        />
        <ThemedText
          themeColor="textSecondary"
          numberOfLines={1}
          ellipsizeMode="middle"
          accessibilityLabel={email ?? undefined}
          style={styles.email}>
          {email}
        </ThemedText>
      </View>

      {/* Görünen ad: Yol Haritam başlığındaki "Merhaba, <ad>" buradan gelir */}
      <View style={[styles.topicCard, styles.nameCard, { backgroundColor: theme.card, borderColor: theme.border, borderBottomColor: theme.borderEdge }]}>
        {nameStatus === 'error' && <Banner tone="warning">{ERROR_TEXT.profileLoadFailed}</Banner>}
        <TextField
          label="Görünen ad"
          value={value}
          onChangeText={onChangeName}
          placeholder={nameLoading ? undefined : 'Örn. Ayşe'}
          maxLength={MAX_NAME_LENGTH}
          editable={nameStatus === 'ready' && !saving}
          autoCapitalize="words"
          autoComplete="name"
          textContentType="name"
          returnKeyType="done"
          onSubmitEditing={onSaveName}
          invalid={emptyError}
          hint={emptyError ? 'Görünen adın boş olamaz.' : `En fazla ${MAX_NAME_LENGTH} karakter.`}
        />
        <Button variant="primary" label="Kaydet" loading={saving} disabled={saveDisabled} onPress={onSaveName} />
        {/* Sonuç butonun ALTINDA: çıkıp kaybolunca buton yer değiştirmesin */}
        {feedback && <Banner tone={feedback.tone}>{feedback.message}</Banner>}
      </View>

      <ThemedText type="eyebrow" themeColor="textSecondary">
        Şu anki konun
      </ThemedText>

      {loading ? (
        <View
          accessible
          accessibilityLabel="Yükleniyor"
          accessibilityState={{ busy: true }}
          style={[styles.topicCard, { backgroundColor: theme.card, borderColor: theme.border, borderBottomColor: theme.borderEdge }]}>
          <Skeleton width={48} height={48} radius={14} />
          <View style={styles.topicTexts}>
            <Skeleton width="60%" height={20} />
            <Skeleton width="40%" height={14} />
          </View>
        </View>
      ) : roadmap ? (
        <View
          style={[styles.topicCard, { backgroundColor: theme.card, borderColor: theme[hue.line], borderBottomColor: theme[hue.edge] }]}>
          <IconTile emoji={category.emoji} tone={category.hue} size={48} />
          <View style={styles.topicTexts}>
            <ThemedText type="cardTitle">{topicTitle}</ThemedText>
            {parents !== '' && (
              <ThemedText type="small" themeColor="textSecondary">
                {parents}
              </ThemedText>
            )}
            <LevelBadge levelId={roadmap.level} size="sm" />
          </View>
        </View>
      ) : (
        <View
          style={[styles.topicCard, { backgroundColor: theme.card, borderColor: theme.border, borderBottomColor: theme.borderEdge }]}>
          <IconTile emoji="🧭" tone="accent" size={48} />
          <View style={styles.topicTexts}>
            <ThemedText type="cardTitle">Henüz bir konu seçmedin</ThemedText>
          </View>
        </View>
      )}

      <Link href="/onboarding" asChild>
        <Button variant="secondary" icon="🧭" label="Konunu değiştir" />
      </Link>

      {/* Rozetler kendi hook'uyla yüklenir: ağ hatası olsa da yukarıdaki kimlik/konu kartı çalışmaya devam eder */}
      <AchievementsSection />

      {/* Çıkış yapınca oturum null olur; Stack.Protected bizi karşılama ekranına atar */}
      <View style={styles.signOut}>
        <Button variant="quiet" label="Çıkış yap" onPress={() => supabase.auth.signOut()} />
      </View>
    </TabScreen>
  );
}

const styles = StyleSheet.create({
  identity: { alignItems: 'center', gap: Spacing.three },
  email: { alignSelf: 'stretch', textAlign: 'center' },
  topicCard: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: Spacing.three,
    padding: Spacing.three,
    borderRadius: Radius.lg,
    borderWidth: Border.thick,
    borderBottomWidth: Border.thick + Edge,
  },
  // Ad kartı topicCard stilini kullanır ama içerik alt alta dizilir
  nameCard: { flexDirection: 'column', alignItems: 'stretch' },
  topicTexts: { flex: 1, minWidth: 0, gap: Spacing.one },
  signOut: { marginTop: Spacing.three },
});
