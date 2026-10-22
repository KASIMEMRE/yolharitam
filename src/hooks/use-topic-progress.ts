import { useFocusEffect } from 'expo-router';
import { useCallback, useMemo, useRef, useState } from 'react';

import type { TopicStatus } from '@/constants/dev-roadmaps/personalize';
import { useAuth } from '@/lib/auth-context';
import { supabase } from '@/lib/supabase';
import { classifyError, ERROR_TEXT } from '@/lib/supabase-errors';

// loading = ilk yükleme · ready = okundu (hiç ilerleme olmayabilir) · schema/network/error = HATA.
// "Hiç ilerleme yok" ile "okuyamadık" karışmaz; karışırsa hatada her konu "başlanmadı" görünürdü.
export type ProgressStatus = 'loading' | 'ready' | 'schema' | 'network' | 'error';

type State = { roadmapId: string; status: ProgressStatus; statuses: Record<string, TopicStatus> };

const VALID: TopicStatus[] = ['done', 'in_progress', 'skipped'];

function statusOf(error: { code?: string; message?: string }): 'schema' | 'network' | 'error' {
  const kind = classifyError(error);
  return kind === 'schema' ? 'schema' : kind === 'network' ? 'network' : 'error';
}

// Bir yol haritasındaki konuların durumlarını okur ve değiştirir.
// Ekran her odaklandığında tazelenir (konu detayından dönünce yeni durum görünür).
export function useTopicProgress(roadmapId: string | undefined) {
  const [state, setState] = useState<State | null>(null);
  const [reloadKey, setReloadKey] = useState(0);
  const [saveError, setSaveError] = useState<string | null>(null);
  const { session } = useAuth();
  const userId = session?.user.id;
  // Aynı konuya art arda dokunma kilidi (istek bitmeden yenisi gönderilmez)
  const busy = useRef(new Set<string>());
  // Yazma sayacı: okuma sürerken bir yazma başlayıp bittiyse okuma eski veriyi taşıyor olabilir
  const writes = useRef(0);
  // Atılan (eski sayılan) okuma olduysa yazma bitince yeniden okunur; yoksa işaret sonrası tazeleme kaybolurdu
  const pendingRefresh = useRef(false);
  // Hangi harita için state kuruldu / ref'ler hangi haritaya ait (harita değişince sıfırlanır)
  const loadedFor = useRef<string | null>(null);
  const refsFor = useRef<string | null>(null);

  useFocusEffect(
    useCallback(() => {
      if (!roadmapId) return;
      let cancelled = false;
      // Harita değişti: önceki haritanın uçuştaki işaretleri bu haritanın okumasını engellemesin
      if (refsFor.current !== roadmapId) {
        refsFor.current = roadmapId;
        busy.current.clear();
        writes.current = 0;
        pendingRefresh.current = false;
      }
      const writesAtStart = writes.current;
      (async () => {
        try {
          const { data, error } = await supabase
            .from('topic_progress')
            .select('topic_id, status')
            .eq('roadmap_id', roadmapId);
          if (cancelled) return;
          if (error) {
            loadedFor.current = roadmapId;
            setState({ roadmapId, status: statusOf(error), statuses: {} });
            return;
          }
          // İstek uçuştayken (ya da okuma sürerken biten) bir işaretleme varsa bu cevap eskidir:
          // yok sayılır, yoksa iyimser durumu ezip işareti bir an geri alırdı.
          // İSTİSNA: bu harita için henüz hiç state yoksa (ilk yükleme) cevap asla atılmaz, yoksa iskelet sonsuza dek kalır.
          if (loadedFor.current === roadmapId && (busy.current.size > 0 || writes.current !== writesAtStart)) {
            pendingRefresh.current = true;
            return;
          }
          const statuses: Record<string, TopicStatus> = {};
          for (const row of data ?? []) {
            if (VALID.includes(row.status as TopicStatus)) statuses[row.topic_id] = row.status as TopicStatus;
          }
          loadedFor.current = roadmapId;
          setState({ roadmapId, status: 'ready', statuses });
        } catch {
          if (!cancelled) {
            loadedFor.current = roadmapId;
            setState({ roadmapId, status: 'network', statuses: {} });
          }
        }
      })();
      return () => {
        cancelled = true;
      };
      // reloadKey içeride okunmuyor; "Tekrar dene" ile efekti yeniden çalıştırmak için BİLEREK bağımlılıkta.
      // eslint-disable-next-line react-hooks/exhaustive-deps
    }, [roadmapId, reloadKey])
  );

  function apply(id: string, topicId: string, value: TopicStatus | null) {
    setState((prev) => {
      if (!prev || prev.roadmapId !== id) return prev;
      const statuses = { ...prev.statuses };
      if (value) statuses[topicId] = value;
      else delete statuses[topicId];
      return { ...prev, statuses };
    });
  }

  // Konunun durumunu değiştirir. null = durumu sıfırla ("başlanmadı").
  // İYİMSER GÜNCELLEME: ekran hemen değişir, istek arkadan gider; başarısız olursa eski hale döner.
  // Ekleme ve güncelleme TEK çağrı: upsert (satır varsa günceller, yoksa ekler).
  async function setStatus(topicId: string, value: TopicStatus | null): Promise<boolean> {
    if (!roadmapId || !state || state.roadmapId !== roadmapId || state.status !== 'ready') return false;
    if (!userId) {
      setSaveError(ERROR_TEXT.session);
      return false;
    }
    if (busy.current.has(topicId)) return false;
    const before = state.statuses[topicId] ?? null;
    if (before === value) return true;

    busy.current.add(topicId);
    writes.current += 1;
    setSaveError(null);
    apply(roadmapId, topicId, value);
    let ok = true;
    try {
      const { error } = value
        ? await supabase.from('topic_progress').upsert({
            roadmap_id: roadmapId,
            topic_id: topicId,
            user_id: userId,
            status: value,
            updated_at: new Date().toISOString(),
          })
        : await supabase.from('topic_progress').delete().eq('roadmap_id', roadmapId).eq('topic_id', topicId);
      if (error) {
        ok = false;
        setSaveError(statusOf(error) === 'network' ? ERROR_TEXT.markFailed : ERROR_TEXT.other);
      }
    } catch {
      ok = false;
      setSaveError(ERROR_TEXT.markFailed);
    }
    busy.current.delete(topicId);
    writes.current += 1;
    // Yazma sürerken atılan bir okuma varsa, her şey bitince yeniden oku
    if (busy.current.size === 0 && pendingRefresh.current) {
      pendingRefresh.current = false;
      setReloadKey((k) => k + 1);
    }
    if (!ok) apply(roadmapId, topicId, before); // geri al
    return ok;
  }

  const current = state && state.roadmapId === roadmapId ? state : null;
  const statusMap = useMemo(
    () => new Map(Object.entries(current?.statuses ?? {})) as ReadonlyMap<string, TopicStatus>,
    [current]
  );

  return {
    status: current?.status ?? ('loading' as ProgressStatus),
    statuses: statusMap,
    setStatus,
    saveError,
    clearSaveError: () => setSaveError(null),
    retry: () => setReloadKey((k) => k + 1),
  };
}
