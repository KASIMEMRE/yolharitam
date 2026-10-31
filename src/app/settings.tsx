import Constants from 'expo-constants';
import { router, Stack, useFocusEffect } from 'expo-router';
import { useCallback, useState } from 'react';
import { Platform, Pressable, ScrollView, StyleSheet, useWindowDimensions, View, Linking } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { isAuthRetryableFetchError } from '@supabase/supabase-js';

import { IconTile } from '@/components/icon-tile';
import { Glyph, IconLabel } from '@/components/icon';
import { Banner } from '@/components/banner';
import { Button } from '@/components/button';
import { UsernameForm } from '@/components/community/username-gate';
import { HeaderBackButton } from '@/components/header-back-button';
import { TextField } from '@/components/text-field';
import { ThemedText } from '@/components/themed-text';
import { ThemedView } from '@/components/themed-view';
import { countTopics, getRoadmap, KIND_LABEL } from '@/constants/dev-roadmaps';
import { Border, MaxContentWidth, MinTouch, Radius, Spacing } from '@/constants/theme';
import { HUES } from '@/constants/visuals';
import { useLatestRoadmap, type Roadmap } from '@/hooks/use-latest-roadmap';
import { useTheme } from '@/hooks/use-theme';
import { type BlockedUser, listBlocked, unblockUser } from '@/lib/blocking';
import { PRIVACY_URL, SUPPORT_EMAIL, TERMS_URL } from '@/lib/config';
import { openExternalUrl } from '@/lib/open-url';
import { useAuth } from '@/lib/auth-context';
import { MIN_PASSWORD } from '@/lib/auth-rules';
import { setPreferences, usePreferences, type MapViewPref, type ThemePref } from '@/lib/preferences';
import { supabase } from '@/lib/supabase';
import { ERROR_TEXT } from '@/lib/supabase-errors';

const DELETE_WORD = 'SİL'; // kullanıcı bu kelimeyi yazmadan hesap silme düğmesi açılmaz

// İngilizce klavyede "SIL" yazan da kabul edilsin: büyük harfe çevirip İ'yi I'ya indirgeriz (iki taraf da)
const normalizeWord = (s: string) => s.trim().toLocaleUpperCase('tr-TR').replace(/İ/g, 'I');

export default function SettingsScreen() {
  const { session } = useAuth();
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
            <DeleteAccountLink email={session?.user.email ?? null} />
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
      <View style={styles.sectionHead}>
        <IconTile emoji={emoji} tone="neutral" size={40} />
        <ThemedText type="heading" accessibilityRole="header" style={styles.sectionHeadText}>
          {title}
        </ThemedText>
      </View>
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
  options: { id: T; label: string; icon?: string }[];
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
              {o.icon ? (
                <IconLabel emoji={o.icon} type="smallBold" themeColor={selected ? 'accentInk' : 'textSecondary'}>
                  {o.label}
                </IconLabel>
              ) : (
                <ThemedText type="smallBold" themeColor={selected ? 'accentInk' : 'textSecondary'}>
                  {o.label}
                </ThemedText>
              )}
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
  const { roadmap: active, roadmaps, leftovers, loading, failed, retry, activate, remove } = useLatestRoadmap();
  // Haritalardaki biten konu sayıları (her odakta tazelenir)
  // null = okunamadı (0 diye gösterip kullanıcıyı yanıltmayalım)
  const [doneCounts, setDoneCounts] = useState<Record<string, number> | null>({});
  useFocusEffect(
    useCallback(() => {
      let cancelled = false;
      supabase
        .from('topic_progress')
        .select('roadmap_id, status')
        .eq('status', 'done')
        .then(({ data, error }) => {
          if (cancelled) return;
          if (error || !data) {
            setDoneCounts(null);
            return;
          }
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
      <SectionTitle
        emoji="🗺️"
        title="Haritalarım"
        subtitle="Takip ettiğin yol haritaları. Birini kaldırınca o haritadaki ilerlemen de silinir."
      />
      {loading ? (
        <ThemedText type="small" themeColor="textSecondary">
          Yükleniyor…
        </ThemedText>
      ) : failed ? (
        <Card>
          <Banner tone="warning">{ERROR_TEXT.mapsLoadFailed}</Banner>
          <Button variant="secondary" icon="🔄" label="Tekrar dene" onPress={retry} />
        </Card>
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
            done={doneCounts ? (doneCounts[r.id] ?? 0) : null}
            onOpen={async () => {
              await activate(r.id);
              router.replace('/roadmap');
            }}
            onRemove={() => remove(r.id)}
          />
        ))
      )}

      {/* Her durumda görünür (yükleniyor/hata dahil). Hiç harita yoksa asıl eylem bu olduğu için birincil. */}
      <Button
        variant={!loading && !failed && roadmaps.length === 0 ? 'primary' : 'secondary'}
        icon="➕"
        label="Harita ekle"
        onPress={() => router.push('/onboarding')}
      />

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
  done: number | null;
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
          <Glyph emoji={map.emoji} size={20} color={theme[hue.ink]} />
        </View>
        <View style={styles.flexText}>
          <ThemedText type="cardTitle">{map.title}</ThemedText>
          <ThemedText type="small" themeColor="textSecondary">
            {KIND_LABEL[map.kind]}
            {done !== null ? ` · ${done} / ${countTopics(map).total} konu bitti` : ''}
            {active ? ' · şu an açık' : ''}
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
            {done !== null && done > 0
              ? `${map.title} haritası ve bitirdiğin ${done} konunun kaydı silinecek. Bu geri alınamaz.`
              : `${map.title} haritası listenden kaldırılacak; bu haritada işaretlediğin konular varsa onlar da silinir. Bu geri alınamaz.`}
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
  return (
    <View style={styles.section}>
      <SectionTitle emoji="🎨" title="Görünüm" />
      <Card>
        <Choice<ThemePref>
          label="Tema"
          value={prefs.theme}
          options={[
            { id: 'system', label: 'Sistem' },
            { id: 'light', label: 'Açık', icon: '☀️' },
            { id: 'dark', label: 'Koyu', icon: '🌙' },
          ]}
          onChange={(theme) => setPreferences({ theme })}
        />
        <Choice<MapViewPref>
          label="Haritanın varsayılan görünümü"
          value={prefs.mapView}
          options={[
            { id: 'tree', label: 'Harita', icon: '🗺️' },
            { id: 'list', label: 'Liste', icon: '☰' },
          ]}
          onChange={(mapView) => setPreferences({ mapView })}
        />
        <ThemedText type="small" themeColor="textSecondary">
          Bu tercihler yalnız bu cihazda saklanır.
        </ThemedText>
      </Card>
    </View>
  );
}

// ---------------------------------------------------------------------------------------------
// 3) Hesap: şifre ve çıkış (hesabı silme sayfanın en altında)

function AccountSection() {
  const { session } = useAuth();
  return (
    <View style={styles.section}>
      <SectionTitle emoji="👤" title="Hesap" subtitle={session?.user.email ?? undefined} />
      {/* Uygulamadaki tek ad: benzersiz @kullanıcı adı (selamlama, profil, lig, arkadaşlar) */}
      <Card>
        <UsernameForm />
      </Card>
      <PasswordCard email={session?.user.email ?? null} />
      <BlockedUsersCard />
      <Card>
        <Button variant="secondary" icon="🚪" label="Çıkış yap" onPress={() => supabase.auth.signOut()} />
      </Card>
    </View>
  );
}

// Engellenen kullanıcılar: listeyi gör, istersen engeli kaldır
function BlockedUsersCard() {
  const [list, setList] = useState<BlockedUser[] | null | 'loading'>('loading');
  const [busyId, setBusyId] = useState<string | null>(null);

  useFocusEffect(
    useCallback(() => {
      let cancelled = false;
      listBlocked().then((r) => {
        if (!cancelled) setList(r);
      });
      return () => {
        cancelled = true;
      };
    }, [])
  );

  async function unblock(id: string) {
    setBusyId(id);
    const ok = await unblockUser(id);
    setBusyId(null);
    if (ok && Array.isArray(list)) setList(list.filter((b) => b.user_id !== id));
  }

  return (
    <Card>
      <ThemedText type="smallBold">Engellenen kullanıcılar</ThemedText>
      {list === 'loading' ? (
        <ThemedText type="small" themeColor="textSecondary">
          Yükleniyor…
        </ThemedText>
      ) : list === null ? (
        <ThemedText type="small" themeColor="textSecondary">
          Liste yüklenemedi. Sayfaya yeniden girince tekrar denenir.
        </ThemedText>
      ) : list.length === 0 ? (
        <ThemedText type="small" themeColor="textSecondary">
          Kimseyi engellemedin. Toplulukta rahatsız eden birini kartındaki “Engelle” ile engelleyebilirsin.
        </ThemedText>
      ) : (
        list.map((b) => (
          <View key={b.user_id} style={styles.blockedRow}>
            <ThemedText style={styles.flex}>{b.username ? `@${b.username}` : 'Gezgin'}</ThemedText>
            <Button
              variant="text"
              label="Engeli kaldır"
              accessibilityLabel={`${b.username ?? 'Kullanıcının'} engelini kaldır`}
              loading={busyId === b.user_id}
              onPress={() => unblock(b.user_id)}
            />
          </View>
        ))
      )}
    </Card>
  );
}

function PasswordCard({ email }: { email: string | null }) {
  const [open, setOpen] = useState(false);
  const [current, setCurrent] = useState('');
  const [password, setPassword] = useState('');
  const [repeat, setRepeat] = useState('');
  const [state, setState] = useState<{ tone: 'success' | 'warning'; text: string } | null>(null);
  const [currentWrong, setCurrentWrong] = useState(false);
  const [busy, setBusy] = useState(false);

  const tooShort = password.length > 0 && password.length < MIN_PASSWORD;
  const mismatch = repeat.length > 0 && repeat !== password;
  const sameAsOld = password.length > 0 && password === current;
  const canSave =
    !!email && current.length > 0 && password.length >= MIN_PASSWORD && password === repeat && !sameAsOld && !busy;

  function reset() {
    setCurrent('');
    setPassword('');
    setRepeat('');
    setCurrentWrong(false);
  }

  async function save() {
    if (!canSave || !email) return;
    setBusy(true);
    setState(null);
    setCurrentWrong(false);
    // try/finally: beklenmedik bir istisnada bile düğme "yükleniyor"da takılı kalmasın
    try {
      // 1) Önce MEVCUT şifreyi doğrula: telefonu açık bırakılmış biri şifreni değiştiremesin.
      //    Doğrulama için mevcut şifreyle yeniden giriş yapılır (oturum aynı kullanıcıyla tazelenir).
      const check = await supabase.auth.signInWithPassword({ email, password: current });
      if (check.error) {
        // Ağ hatasını "şifren yanlış" diye göstermeyelim (hesap silme akışıyla aynı ayrım)
        if (isAuthRetryableFetchError(check.error)) {
          setState({ tone: 'warning', text: ERROR_TEXT.network });
        } else {
          setCurrentWrong(true);
          setState({ tone: 'warning', text: 'Mevcut şifren yanlış.' });
        }
        return;
      }
      // 2) Doğrulandıysa yeni şifreyi kaydet
      const { error } = await supabase.auth.updateUser({ password });
      if (error) {
        setState({
          tone: 'warning',
          text: isAuthRetryableFetchError(error)
            ? ERROR_TEXT.network
            : 'Şifre değiştirilemedi. Daha güçlü bir şifre deneyip tekrar dene.',
        });
        return;
      }
      reset();
      setOpen(false); // başarı kutusu kapalı formun üstünde gösterilir
      setState({ tone: 'success', text: 'Şifren değiştirildi.' });
    } catch {
      setState({ tone: 'warning', text: ERROR_TEXT.network });
    } finally {
      setBusy(false);
    }
  }

  return (
    <Card>
      <ThemedText type="smallBold">Şifre</ThemedText>
      {!open ? (
        <>
          {state?.tone === 'success' && <Banner tone="success">{state.text}</Banner>}
          <Button
            variant="secondary"
            icon="🔑"
            label="Şifremi değiştir"
            onPress={() => {
              setState(null);
              setOpen(true);
            }}
          />
        </>
      ) : (
        <>
          <TextField
            label="Mevcut şifre"
            value={current}
            onChangeText={(t) => {
              setCurrent(t);
              setCurrentWrong(false);
            }}
            secureTextEntry
            autoComplete="current-password"
            textContentType="password"
            invalid={currentWrong}
            hint={currentWrong ? 'Mevcut şifren yanlış.' : undefined}
          />
          <TextField
            label="Yeni şifre"
            value={password}
            onChangeText={setPassword}
            secureTextEntry
            autoComplete="new-password"
            textContentType="newPassword"
            invalid={tooShort || sameAsOld}
            hint={
              sameAsOld
                ? 'Yeni şifre eskisiyle aynı olamaz.'
                : tooShort
                  ? `En az ${MIN_PASSWORD} karakter olmalı.`
                  : `En az ${MIN_PASSWORD} karakter.`
            }
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
          {state?.tone === 'warning' && <Banner tone="warning">{state.text}</Banner>}
          <View style={styles.rowActions}>
            <Button label="Şifreyi değiştir" loading={busy} disabled={!canSave} onPress={save} />
            <Button
              variant="text"
              label="Vazgeç"
              disabled={busy}
              onPress={() => {
                reset();
                setState(null);
                setOpen(false);
              }}
            />
          </View>
        </>
      )}
    </Card>
  );
}

// Hesabı silme: sayfanın EN ALTINDA, sade bir metin bağlantısı. Göze batmaz ama aranınca bulunur
// (mağaza kuralı). Dokununca açıklama ve "SİL" yazarak onay açılır.
function DeleteAccountLink({ email }: { email: string | null }) {
  const theme = useTheme();
  const [open, setOpen] = useState(false);
  const [word, setWord] = useState('');
  const [password, setPassword] = useState('');
  const [busy, setBusy] = useState(false);
  const [error, setError] = useState<string | null>(null);
  // Türkçe büyük harf: "sil" yazan da kabul edilsin. Şifre de şart: açık kalmış bir telefonu bulan
  // biri hesabı silemesin.
  const confirmed = normalizeWord(word) === normalizeWord(DELETE_WORD) && password.length > 0 && !!email;

  async function deleteAccount() {
    if (!confirmed || busy || !email) return;
    setBusy(true);
    setError(null);
    // Önce şifreyi doğrula (şifre değiştirme kartındaki kalıp: mevcut şifreyle yeniden giriş)
    try {
      const check = await supabase.auth.signInWithPassword({ email, password });
      if (check.error) {
        setBusy(false);
        // Ağ hatası ile yanlış şifre ayrılsın: bağlantı sorununda "şifre hatalı" demek yanıltır
        setError(isAuthRetryableFetchError(check.error) ? ERROR_TEXT.network : 'Şifre hatalı.');
        return;
      }
    } catch {
      setBusy(false);
      setError(ERROR_TEXT.network);
      return;
    }
    try {
      const { error: fnError } = await supabase.functions.invoke('delete-account', { body: { confirm: 'SIL' } });
      if (fnError) throw fnError;
    } catch {
      setBusy(false);
      setError('Hesap silinemedi. İnternet bağlantını kontrol edip tekrar dene.');
      return;
    }
    // Hesap silindi: yerel oturumu da kapat; Stack.Protected karşılama ekranına götürür.
    // scope 'local': sunucuya gitmez (kullanıcı artık yok, ağ isteği hata verirdi); yalnız cihazdaki oturumu siler.
    // Ayrı try/catch: çıkış başarısız olsa bile hesap silinmiştir, "silinemedi" dememeliyiz.
    try {
      const { error: outError } = await supabase.auth.signOut({ scope: 'local' });
      if (outError) throw outError;
    } catch {
      setBusy(false);
      setError('Hesabın silindi. Uygulamayı kapatıp yeniden aç.');
    }
  }

  if (!open) {
    return (
      <Pressable
        onPress={() => setOpen(true)}
        accessibilityRole="button"
        hitSlop={8}
        style={styles.deleteLink}>
        <ThemedText type="small" themeColor="textSecondary" style={styles.underline}>
          Hesabımı sil
        </ThemedText>
      </Pressable>
    );
  }

  return (
    <View style={[styles.card, { borderColor: theme.border, backgroundColor: theme.card }]}>
      <ThemedText type="smallBold">Hesabı sil</ThemedText>
      <ThemedText type="small" themeColor="textSecondary">
        Hesabın, tüm haritaların, ilerlemen ve rozetlerin kalıcı olarak silinir. Bu geri alınamaz.
      </ThemedText>
      <TextField
        label={`Onaylamak için ${DELETE_WORD} yaz`}
        value={word}
        onChangeText={setWord}
        autoCapitalize="characters"
        autoCorrect={false}
      />
      <TextField
        label="Şifren"
        value={password}
        onChangeText={(t) => {
          setPassword(t);
          setError(null);
        }}
        secureTextEntry
        autoComplete="current-password"
        textContentType="password"
      />
      {error && <Banner tone="warning">{error}</Banner>}
      <View style={styles.rowActions}>
        <Button variant="secondary" label="Hesabımı kalıcı olarak sil" disabled={!confirmed} loading={busy} onPress={deleteAccount} />
        <Button
          variant="text"
          label="Vazgeç"
          disabled={busy}
          onPress={() => {
            setOpen(false);
            setWord('');
            setPassword('');
          }}
        />
      </View>
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
      {/* Yasal sayfalar ve destek: mağazalar bu bağlantıların uygulama içinden erişilebilir olmasını ister */}
      <Card>
        <Button variant="secondary" icon="🛡️" label="Gizlilik politikası" onPress={() => openExternalUrl(PRIVACY_URL)} />
        <Button variant="secondary" icon="📄" label="Kullanım koşulları" onPress={() => openExternalUrl(TERMS_URL)} />
        <Button
          variant="secondary"
          icon="✉️"
          label="Destek ve geri bildirim"
          onPress={() => Linking.openURL(`mailto:${SUPPORT_EMAIL}?subject=${encodeURIComponent('Yol Haritam destek')}`).catch(() => {})}
        />
        <ThemedText type="small" themeColor="textSecondary">
          Soru, öneri ya da uygunsuz içerik bildirimi için: {SUPPORT_EMAIL}
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
  sectionHead: { flexDirection: 'row', alignItems: 'center', gap: Spacing.two },
  sectionHeadText: { flexShrink: 1 },
  card: { gap: Spacing.three, padding: Spacing.three, borderRadius: Radius.lg, borderWidth: Border.thick },
  deleteLink: { alignSelf: 'center', minHeight: MinTouch, justifyContent: 'center', paddingHorizontal: Spacing.three },
  underline: { textDecorationLine: 'underline' },
  choiceBlock: { gap: Spacing.two },
  blockedRow: { flexDirection: 'row', alignItems: 'center', gap: Spacing.two },
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
  flexText: { flex: 1, minWidth: 0, gap: Spacing.half },
  rowActions: { flexDirection: 'row', flexWrap: 'wrap', alignItems: 'center', gap: Spacing.two },
  confirm: { gap: Spacing.two, padding: Spacing.three, borderRadius: Radius.md },
});
