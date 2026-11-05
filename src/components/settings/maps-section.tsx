import { router, useFocusEffect } from 'expo-router';
import { useCallback, useState } from 'react';
import { StyleSheet, View } from 'react-native';

import { Banner } from '@/components/banner';
import { Button } from '@/components/button';
import { ListGroup, ListRow } from '@/components/list-row';
import { Surface } from '@/components/surface';
import { ThemedText } from '@/components/themed-text';
import { countTopics, getRoadmap, KIND_LABEL } from '@/constants/dev-roadmaps';
import { Radius, Spacing } from '@/constants/theme';
import { useLatestRoadmap, type Roadmap } from '@/hooks/use-latest-roadmap';
import { useTheme } from '@/hooks/use-theme';
import { supabase } from '@/lib/supabase';
import { ERROR_TEXT } from '@/lib/supabase-errors';

// Haritalarım: geç, kaldır, ekle. (Eski settings.tsx'ten taşındı; mantık aynı, yalnız düzen ListGroup.)
export function MapsSection() {
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
      {loading ? (
        <ThemedText type="small" themeColor="textSecondary">
          Yükleniyor…
        </ThemedText>
      ) : failed ? (
        <View style={styles.section}>
          <Banner tone="warning">{ERROR_TEXT.mapsLoadFailed}</Banner>
          <Button variant="secondary" icon="🔄" label="Tekrar dene" onPress={retry} />
        </View>
      ) : roadmaps.length === 0 ? (
        <ThemedText>Henüz bir haritan yok.</ThemedText>
      ) : (
        // Haritalar tek bir liste grubunda: her harita bir satır, ayırıcı ince çizgi
        <ListGroup>
          {roadmaps.map((r) => (
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
          ))}
        </ListGroup>
      )}

      {/* Her durumda görünür (yükleniyor/hata dahil). Hiç harita yoksa asıl eylem bu olduğu için birincil. */}
      <Button
        variant={!loading && !failed && roadmaps.length === 0 ? 'primary' : 'secondary'}
        icon="➕"
        label="Harita ekle"
        onPress={() => router.push('/onboarding')}
      />

      {leftovers.length > 0 && (
        <LeftoversRow
          count={leftovers.length}
          onClean={async () => {
            let ok = true;
            for (const r of leftovers) ok = (await remove(r.id)) && ok;
            return ok;
          }}
        />
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
  // Kaldırma iki adımlı: önce "Kaldır", sonra satırın altında açık bir onay (tarayıcı uyarı penceresi yok)
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

  const subtitle =
    `${KIND_LABEL[map.kind]}` +
    (done !== null ? ` · ${done} / ${countTopics(map).total} konu bitti` : '') +
    (active ? ' · şu an açık' : '');

  return (
    <View style={styles.mapRow}>
      {/* Harita kimliği (renk ailesi) simge kutusunda; satırın kendisi düz */}
      <ListRow dot={map.hue} title={map.title} subtitle={subtitle} />

      {!confirming ? (
        <View style={styles.rowActions}>
          {/* Satır eylemleri iki sessiz metin düğmesi: "Aç" 3D olunca satırda ve altındaki "Harita ekle" ile üçüncü 3D öğe olurdu */}
          {!active && <Button variant="text" icon="›" label="Aç" onPress={onOpen} />}
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
    <Surface tone="plain">
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
    </Surface>
  );
}

const styles = StyleSheet.create({
  section: { gap: Spacing.three },
  // Satırın altındaki eylemler simgeyle hizalı girintiyle değil, satır kenar boşluğuyla başlar
  mapRow: { paddingBottom: Spacing.three, gap: Spacing.one },
  rowActions: { flexDirection: 'row', flexWrap: 'wrap', alignItems: 'center', gap: Spacing.two, paddingHorizontal: Spacing.three },
  confirm: { gap: Spacing.two, padding: Spacing.three, borderRadius: Radius.md, marginHorizontal: Spacing.three },
});
