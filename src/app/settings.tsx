import Constants from 'expo-constants';
import { router, Stack, useFocusEffect } from 'expo-router';
import { useCallback, useState } from 'react';
import { Platform, Pressable, ScrollView, StyleSheet, Text, useWindowDimensions, View } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';

import { Banner } from '@/components/banner';
import { Button } from '@/components/button';
import { HeaderBackButton } from '@/components/header-back-button';
import { TextField } from '@/components/text-field';
import { ThemedText } from '@/components/themed-text';
import { ThemedView } from '@/components/themed-view';
import { countTopics, getRoadmap, KIND_LABEL } from '@/constants/dev-roadmaps';
import { Border, MaxContentWidth, MinTouch, Radius, Spacing } from '@/constants/theme';
import { HUES } from '@/constants/visuals';
import { useLatestRoadmap, type Roadmap } from '@/hooks/use-latest-roadmap';
import { useTheme } from '@/hooks/use-theme';
import { useAuth } from '@/lib/auth-context';
import { setPreferences, usePreferences, type MapViewPref, type ThemePref } from '@/lib/preferences';
import { supabase } from '@/lib/supabase';
import { ERROR_TEXT } from '@/lib/supabase-errors';

const MIN_PASSWORD = 8;
const DELETE_WORD = 'SİL'; // kullanıcı bu kelimeyi yazmadan hesap silme düğmesi açılmaz

export default function SettingsScreen() {
  const { width } = useWindowDimensions();
  const gutter = width < 360 ? Spacing.three : Spacing.four;

  function goBack() {
    if (router.canGoBack()) router.back();
    else router.replace('/profile');
  }

  return (
    <ThemedView style={styles.container}>
      <Stack.Screen
        options={{
          title: 'Ayarlar',
          headerLeft: Platform.OS === 'web' ? () => <HeaderBackButton onPress={goBack} label="Geri dön" /> : undefined,
        }}
      />
      <SafeAreaView style={styles.flex} edges={['bottom']}>
        <ScrollView style={styles.flex} contentContainerStyle={[styles.content, { padding: gutter }]}>
          <View style={styles.inner}>
            <MapsSection />
            <AppearanceSection />
            <AccountSection />
            <AboutSection />
          </View>
        </ScrollView>
      </SafeAreaView>
    </ThemedView>
  );
}

// ---------------------------------------------------------------------------------------------
// Ortak parçalar

function SectionTitle({ emoji, title, subtitle }: { emoji: string; title: string; subtitle?: string }) {
  return (
    <View style={styles.sectionTitle}>
      <ThemedText type="heading" accessibilityRole="header">
        {emoji} {title}
      </ThemedText>
      {subtitle && (
        <ThemedText type="small" themeColor="textSecondary">
          {subtitle}
        </ThemedText>
      )}
    </View>
  );
}

function Card({ children }: { children: React.ReactNode }) {
  const theme = useTheme();
  return <View style={[styles.card, { backgroundColor: theme.card, borderColor: theme.border }]}>{children}</View>;
}

// Seçenek grubu (segmented): tema ve görünüm için
function Choice<T extends string>({
  label,
  value,
  options,
  onChange,
}: {
  label: string;
  value: T;
  options: { id: T; label: string }[];
  onChange: (v: T) => void;
}) {
  const theme = useTheme();
  return (
    <View style={styles.choiceBlock}>
      <ThemedText type="smallBold">{label}</ThemedText>
      <View
        accessibilityRole="radiogroup"
        accessibilityLabel={label}
        style={[styles.choice, { backgroundColor: theme.backgroundSelected, borderColor: theme.border }]}>
        {options.map((o) => {
          const selected = o.id === value;
          return (
            <Pressable
              key={o.id}
              onPress={() => onChange(o.id)}
              accessibilityRole="radio"
              accessibilityState={{ selected }}
              style={[styles.choiceItem, selected && { backgroundColor: theme.card, borderColor: theme.accent }]}>
              <ThemedText type="smallBold" themeColor={selected ? 'accentInk' : 'textSecondary'}>
                {o.label}
              </ThemedText>
            </Pressable>
          );
        })}
      </View>
    </View>
  );
}

// ---------------------------------------------------------------------------------------------
// 1) Haritalarım: geç, kaldır, ekle

function MapsSection() {
  const { roadmap: active, roadmaps, leftovers, loading, activate, remove } = useLatestRoadmap();
  // Haritalardaki biten konu sayıları (her odakta tazelenir)
  const [doneCounts, setDoneCounts] = useState<Record<string, number>>({});
  useFocusEffect(
    useCallback(() => {
      let cancelled = false;
      supabase
        .from('topic_progress')
        .select('roadmap_id, status')
        .eq('status', 'done')
        .then(({ data }) => {
          if (cancelled || !data) return;
          const counts: Record<string, number> = {};
          for (const r of data) counts[r.roadmap_id] = (counts[r.roadmap_id] ?? 0) + 1;
          setDoneCounts(counts);
        });
      return () => {
        cancelled = true;
      };
    }, [])
  );

  return (
    <View style={styles.section}>
      <SectionTitle emoji="🗺️" title="Haritalarım" subtitle="Takip ettiğin yol haritaları. Birini kaldırınca o haritadaki ilerlemen de silinir." />
      {loading ? (
        <ThemedText type="small" themeColor="textSecondary">
          Yükleniyor…
        </ThemedText>
      ) : roadmaps.length === 0 ? (
        <Card>
          <ThemedText>Henüz bir haritan yok.</ThemedText>
        </Card>
      ) : (
        roadmaps.map((r) => (
          <MapRow
            key={r.id}
            roadmap={r}
            active={r.id === active?.id}
            done={doneCounts[r.id] ?? 0}
            onOpen={async () => {
              await activate(r.id);
              router.replace('/roadmap');
            }}
            onRemove={() => remove(r.id)}
          />
        ))
      )}
      <Button variant="secondary" icon="＋" label="Yeni harita ekle" onPress={() => router.push('/onboarding')} />

      {leftovers.length > 0 && (
        <LeftoversRow count={leftovers.length} onClean={async () => {
          let ok = true;
          for (const r of leftovers) ok = (await remove(r.id)) && ok;
          return ok;
        }} />
      )}
    </View>
  );
}

function MapRow({
  roadmap,
  active,
  done,
  onOpen,
  onRemove,
}: {
  roadmap: Roadmap;
  active: boolean;
  done: number;
  onOpen: () => void;
  onRemove: () => Promise<boolean>;
}) {
  const theme = useTheme();
  const map = getRoadmap(roadmap.topic_path)!;
  const hue = HUES[map.hue];
  // Kaldırma iki adımlı: önce "Kaldır", sonra kartın içinde açık bir onay (tarayıcı uyarı penceresi yok)
  const [confirming, setConfirming] = useState(false);
  const [busy, setBusy] = useState(false);
  const [error, setError] = useState<string | null>(null);

  async function confirmRemove() {
    setBusy(true);
    setError(null);
    const ok = await onRemove();
    setBusy(false);
    if (!ok) setError(ERROR_TEXT.other);
  }

  return (
    <View style={[styles.mapRow, { backgroundColor: theme.card, borderColor: active ? theme[hue.line] : theme.border }]}>
      <View style={styles.mapHead}>
        <View style={[styles.mapIcon, { backgroundColor: theme[hue.soft] }]}>
          <Text allowFontScaling={false} style={styles.mapEmoji}>
            {map.emoji}
          </Text>
        </View>
        <View style={styles.flexText}>
          <ThemedText type="cardTitle">{map.title}</ThemedText>
          <ThemedText type="small" themeColor="textSecondary">
            {KIND_LABEL[map.kind]} · {done} / {countTopics(map).total} konu bitti{active ? ' · şu an açık' : ''}
          </ThemedText>
        </View>
      </View>

      {!confirming ? (
        <View style={styles.rowActions}>
          {!active && <Button variant="secondary" label="Aç" onPress={onOpen} />}
          <Button variant="text" icon="🗑️" label="Kaldır" onPress={() => setConfirming(true)} />
        </View>
      ) : (
        <View style={[styles.confirm, { backgroundColor: theme.warningBackground }]}>
          <ThemedText type="smallBold" themeColor="warningInk">
            {done > 0
              ? `${map.title} haritası ve bitirdiğin ${done} konunun kaydı silinecek. Bu geri alınamaz.`
              : `${map.title} haritası listenden kaldırılacak.`}
          </ThemedText>
          {error && <Banner tone="warning">{error}</Banner>}
          <View style={styles.rowActions}>
            <Button label="Evet, kaldır" loading={busy} onPress={confirmRemove} />
            <Button variant="text" label="Vazgeç" disabled={busy} onPress={() => setConfirming(false)} />
          </View>
        </View>
      )}
    </View>
  );
}

function LeftoversRow({ count, onClean }: { count: number; onClean: () => Promise<boolean> }) {
  const [state, setState] = useState<'idle' | 'busy' | 'error'>('idle');
  return (
    <Card>
      <ThemedText type="smallBold">Eski kayıtlar</ThemedText>
      <ThemedText type="small" themeColor="textSecondary">
        {`Uygulamanın eski sürümünden kalan ${count} konu kaydı var (artık kullanılmıyor).`}
      </ThemedText>
      {state === 'error' && <Banner tone="warning">{ERROR_TEXT.other}</Banner>}
      <Button
        variant="secondary"
        icon="🧹"
        label="Eski kayıtları temizle"
        loading={state === 'busy'}
        onPress={async () => {
          setState('busy');
          setState((await onClean()) ? 'idle' : 'error');
        }}
      />
    </Card>
  );
}

// ---------------------------------------------------------------------------------------------
// 2) Görünüm ve plan

function AppearanceSection() {
  const prefs = usePreferences();
  const { roadmap } = useLatestRoadmap();
  return (
    <View style={styles.section}>
      <SectionTitle emoji="🎨" title="Görünüm ve plan" />
      <Card>
        <Choice<ThemePref>
          label="Tema"
          value={prefs.theme}
          options={[
            { id: 'system', label: 'Sistem' },
            { id: 'light', label: '☀️ Açık' },
            { id: 'dark', label: '🌙 Koyu' },
          ]}
          onChange={(theme) => setPreferences({ theme })}
        />
        <Choice<MapViewPref>
          label="Haritanın varsayılan görünümü"
          value={prefs.mapView}
          options={[
            { id: 'tree', label: '🗺️ Harita' },
            { id: 'list', label: '☰ Liste' },
          ]}
          onChange={(mapView) => setPreferences({ mapView })}
        />
        <ThemedText type="small" themeColor="textSecondary">
          Bu tercihler yalnız bu cihazda saklanır.
        </ThemedText>
      </Card>
      {roadmap && getRoadmap(roadmap.topic_path) && (
        <Card>
          <ThemedText type="smallBold">Planın</ThemedText>
          <ThemedText type="small" themeColor="textSecondary">
            Haftalık süreni, hedefini ve öğrenme yöntemini değiştir; yapay zekâ haritanı yeniden işaretlesin. İlerlemen korunur.
          </ThemedText>
          <Button
            variant="secondary"
            icon="🎯"
            label="Planımı güncelle"
            onPress={() => router.push({ pathname: '/roadmap-questions', params: { roadmapId: roadmap.id } })}
          />
        </Card>
      )}
    </View>
  );
}

// ---------------------------------------------------------------------------------------------
// 3) Hesap: şifre, çıkış, hesabı silme

function AccountSection() {
  const { session } = useAuth();
  return (
    <View style={styles.section}>
      <SectionTitle emoji="👤" title="Hesap" subtitle={session?.user.email ?? undefined} />
      <PasswordCard />
      <Card>
        <Button variant="secondary" icon="🚪" label="Çıkış yap" onPress={() => supabase.auth.signOut()} />
      </Card>
      <DeleteAccountCard />
    </View>
  );
}

function PasswordCard() {
  const [open, setOpen] = useState(false);
  const [password, setPassword] = useState('');
  const [repeat, setRepeat] = useState('');
  const [state, setState] = useState<{ tone: 'success' | 'warning'; text: string } | null>(null);
  const [busy, setBusy] = useState(false);

  const tooShort = password.length > 0 && password.length < MIN_PASSWORD;
  const mismatch = repeat.length > 0 && repeat !== password;
  const canSave = password.length >= MIN_PASSWORD && password === repeat && !busy;

  async function save() {
    if (!canSave) return;
    setBusy(true);
    setState(null);
    const { error } = await supabase.auth.updateUser({ password });
    setBusy(false);
    if (error) {
      // Supabase aynı şifreyi ya da zayıf şifreyi reddedebilir; mesajı sade tut
      setState({ tone: 'warning', text: 'Şifre değiştirilemedi. Farklı ve daha güçlü bir şifre deneyip tekrar dene.' });
      return;
    }
    setPassword('');
    setRepeat('');
    setState({ tone: 'success', text: 'Şifren değiştirildi.' });
  }

  return (
    <Card>
      <ThemedText type="smallBold">Şifre</ThemedText>
      {!open ? (
        <Button variant="secondary" icon="🔑" label="Şifremi değiştir" onPress={() => setOpen(true)} />
      ) : (
        <>
          <TextField
            label="Yeni şifre"
            value={password}
            onChangeText={setPassword}
            secureTextEntry
            autoComplete="new-password"
            textContentType="newPassword"
            invalid={tooShort}
            hint={tooShort ? `En az ${MIN_PASSWORD} karakter olmalı.` : `En az ${MIN_PASSWORD} karakter.`}
          />
          <TextField
            label="Yeni şifre (tekrar)"
            value={repeat}
            onChangeText={setRepeat}
            secureTextEntry
            autoComplete="new-password"
            textContentType="newPassword"
            invalid={mismatch}
            hint={mismatch ? 'Şifreler aynı değil.' : undefined}
            onSubmitEditing={save}
          />
          {state && <Banner tone={state.tone}>{state.text}</Banner>}
          <View style={styles.rowActions}>
            <Button label="Kaydet" loading={busy} disabled={!canSave} onPress={save} />
            <Button variant="text" label="Vazgeç" onPress={() => setOpen(false)} />
          </View>
        </>
      )}
    </Card>
  );
}

function DeleteAccountCard() {
  const theme = useTheme();
  const [open, setOpen] = useState(false);
  const [word, setWord] = useState('');
  const [busy, setBusy] = useState(false);
  const [error, setError] = useState<string | null>(null);
  // Türkçe büyük harf: "sil" yazan da kabul edilsin
  const confirmed = word.trim().toLocaleUpperCase('tr-TR') === DELETE_WORD;

  async function deleteAccount() {
    if (!confirmed || busy) return;
    setBusy(true);
    setError(null);
    try {
      const { error: fnError } = await supabase.functions.invoke('delete-account', { body: { confirm: 'SIL' } });
      if (fnError) throw fnError;
      // Hesap silindi: yerel oturumu da kapat; Stack.Protected karşılama ekranına götürür
      await supabase.auth.signOut();
    } catch {
      setBusy(false);
      setError('Hesap silinemedi. İnternet bağlantını kontrol edip tekrar dene.');
    }
  }

  return (
    <View style={[styles.card, styles.danger, { borderColor: theme.coral, backgroundColor: theme.card }]}>
      <ThemedText type="smallBold" themeColor="coralInk">
        Hesabı sil
      </ThemedText>
      <ThemedText type="small" themeColor="textSecondary">
        Hesabın, tüm haritaların, ilerlemen ve rozetlerin kalıcı olarak silinir. Bu geri alınamaz.
      </ThemedText>
      {!open ? (
        <Button variant="text" icon="⚠️" label="Hesabımı silmek istiyorum" onPress={() => setOpen(true)} />
      ) : (
        <>
          <TextField
            label={`Onaylamak için ${DELETE_WORD} yaz`}
            value={word}
            onChangeText={setWord}
            autoCapitalize="characters"
            autoCorrect={false}
          />
          {error && <Banner tone="warning">{error}</Banner>}
          <View style={styles.rowActions}>
            <Button label="Hesabımı kalıcı olarak sil" disabled={!confirmed} loading={busy} onPress={deleteAccount} />
            <Button variant="text" label="Vazgeç" disabled={busy} onPress={() => { setOpen(false); setWord(''); }} />
          </View>
        </>
      )}
    </View>
  );
}

// ---------------------------------------------------------------------------------------------
// 4) Hakkında

function AboutSection() {
  const version = Constants.expoConfig?.version ?? '1.0.0';
  return (
    <View style={styles.section}>
      <SectionTitle emoji="ℹ️" title="Hakkında" />
      <Card>
        <ThemedText type="smallBold">Yol Haritam · sürüm {version}</ThemedText>
        <ThemedText type="small" themeColor="textSecondary">
          Harita kurgusu roadmap.sh projesinden ilham alır; içerikler Yol Haritam için Türkçe olarak yazılmıştır.
        </ThemedText>
        <ThemedText type="small" themeColor="textSecondary">
          Yapay zekâ önerileri ve açıklamaları hata içerebilir; önemli bilgileri önerilen kaynaklardan doğrula.
        </ThemedText>
      </Card>
    </View>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1 },
  flex: { flex: 1 },
  content: { alignItems: 'center' },
  inner: { width: '100%', maxWidth: MaxContentWidth, gap: Spacing.five },
  section: { gap: Spacing.three },
  sectionTitle: { gap: Spacing.one },
  card: { gap: Spacing.three, padding: Spacing.three, borderRadius: Radius.lg, borderWidth: Border.thick },
  danger: { borderStyle: 'dashed' },
  choiceBlock: { gap: Spacing.two },
  choice: { flexDirection: 'row', borderRadius: Radius.pill, borderWidth: Border.thin, padding: 2 },
  choiceItem: {
    flex: 1,
    minHeight: MinTouch,
    alignItems: 'center',
    justifyContent: 'center',
    borderRadius: Radius.pill,
    borderWidth: Border.thick,
    borderColor: 'transparent',
  },
  mapRow: { gap: Spacing.three, padding: Spacing.three, borderRadius: Radius.lg, borderWidth: Border.thick },
  mapHead: { flexDirection: 'row', alignItems: 'center', gap: Spacing.three },
  mapIcon: { width: 48, height: 48, borderRadius: Radius.md, alignItems: 'center', justifyContent: 'center' },
  mapEmoji: { fontSize: 24, lineHeight: 30 },
  flexText: { flex: 1, minWidth: 0, gap: Spacing.half },
  rowActions: { flexDirection: 'row', flexWrap: 'wrap', alignItems: 'center', gap: Spacing.two },
  confirm: { gap: Spacing.two, padding: Spacing.three, borderRadius: Radius.md },
});
