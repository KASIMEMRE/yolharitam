import { router, useFocusEffect } from 'expo-router';
import { useCallback, useState } from 'react';
import { StyleSheet, View } from 'react-native';

import { Banner } from '@/components/banner';
import { Button } from '@/components/button';
import { ListGroup, ListRow } from '@/components/list-row';
import { Surface } from '@/components/surface';
import { ThemedText } from '@/components/themed-text';
import { getRoadmap, KIND_LABEL } from '@/constants/dev-roadmaps';
import type { TopicStatus } from '@/constants/dev-roadmaps/personalize';
import { Radius, Spacing } from '@/constants/theme';
import { useLatestRoadmap, type Roadmap } from '@/hooks/use-latest-roadmap';
import { useTheme } from '@/hooks/use-theme';
import { planProgress, type Count } from '@/lib/plan-progress';
import { supabase } from '@/lib/supabase';
import { ERROR_TEXT } from '@/lib/supabase-errors';

const EMPTY_STATUSES: ReadonlyMap<string, TopicStatus> = new Map(); // ilerlemesi olmayan harita

// Haritalarım: geç, kaldır, ekle. (Eski settings.tsx'ten taşındı; mantık aynı, yalnız düzen ListGroup.)
export function MapsSection() {
  const { roadmap: active, roadmaps, leftovers, loading, failed, retry, activate, remove } = useLatestRoadmap();
  // Haritalardaki konu durumları (her odakta tazelenir), harita kimliğine göre.
  // null = okunamadı (0 diye gösterip kullanıcıyı yanıltmayalım)
  // Neden TÜM durumlar (yalnız 'done' değil)? Plan sayacı "atladım" (plandan çıkar) ve "çalışıyorum"
  // (plana girer) durumlarına da bağlı; tek istekte hepsini okumak ek ağ isteği gerektirmez.
  // Seviye/kişiselleştirme ise zaten useLatestRoadmap'in okuduğu roadmaps satırlarında (select *) var.
  const [statusesByMap, setStatusesByMap] = useState<Record<string, Map<string, TopicStatus>> | null>({});
  useFocusEffect(
    useCallback(() => {
      let cancelled = false;
      supabase
        .from('topic_progress')
        .select('roadmap_id, topic_id, status')
        .then(({ data, error }) => {
          if (cancelled) return;
          if (error || !data) {
            setStatusesByMap(null);
            return;
          }
          const byMap: Record<string, Map<string, TopicStatus>> = {};
          for (const r of data) {
            if (r.status !== 'done' && r.status !== 'in_progress' && r.status !== 'skipped') continue;
            (byMap[r.roadmap_id] ??= new Map()).set(r.topic_id, r.status);
          }
          setStatusesByMap(byMap);
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
              statuses={statusesByMap ? (statusesByMap[r.id] ?? EMPTY_STATUSES) : null}
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
  statuses,
  onOpen,
  onRemove,
}: {
  roadmap: Roadmap;
  active: boolean;
  statuses: ReadonlyMap<string, TopicStatus> | null;
  onOpen: () => void;
  onRemove: () => Promise<boolean>;
}) {
  const theme = useTheme();
  const map = getRoadmap(roadmap.topic_path)!;
  // Yol Haritam ekranıyla aynı plan sayacı (tüm harita değil)
  const count: Count | null = statuses ? planProgress(map, roadmap, statuses) : null;
  const done = count?.done ?? null;
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
    (count ? ` · ${count.done} / ${count.total} konu bitti` : '') +
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
