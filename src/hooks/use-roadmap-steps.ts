import { useFocusEffect } from 'expo-router';
import { useCallback, useState } from 'react';

import type { Tables } from '@/lib/database.types';
import { supabase } from '@/lib/supabase';
import { classifyError } from '@/lib/supabase-errors';

export type RoadmapStep = Tables<'roadmap_steps'>;

// loading = ilk yükleme sürüyor · ready = okundu (steps boş olabilir!) · schema/network/error = HATA.
// ÖNEMLİ: "adım yok" (ready + boş liste) ile "okuyamadık" (schema/network/error) ASLA karıştırılmaz.
// Karışırsa hatada kullanıcıya "Adımlarını oluşturalım" gösterip yanlış yönlendirirdik.
export type StepsStatus = 'loading' | 'ready' | 'schema' | 'network' | 'error';

type Result = { roadmapId: string; steps: RoadmapStep[]; status: StepsStatus };

// Bir yol haritasının adımlarını sırasıyla okur. useLatestRoadmap ile aynı desen:
// useFocusEffect sayesinde ekran her görününce tazelenir (soru akışından dönünce yeni adımlar gelir).
export function useRoadmapSteps(roadmapId: string | undefined) {
  const [result, setResult] = useState<Result | null>(null);
  const [reloadKey, setReloadKey] = useState(0);
  const [retrying, setRetrying] = useState(false);

  useFocusEffect(
    useCallback(() => {
      if (!roadmapId) return;
      let cancelled = false; // hızlı odak değişiminde eski cevap yeni state'i ezmesin
      // Eski sonuç "adım yok" ise bayat olabilir (soru akışından yeni döndük ve adımlar yeni yazıldı):
      // kısa süre iskelet göster, yoksa "Adımlarını oluşturalım" kartı bir an yanıp sönerdi.
      setResult((prev) =>
        prev && prev.roadmapId === roadmapId && prev.status === 'ready' && prev.steps.length === 0 ? null : prev
      );
      async function load(id: string) {
        const { data, error } = await supabase
          .from('roadmap_steps')
          .select('*')
          .eq('roadmap_id', id)
          .order('position');
        if (cancelled) return;
        if (error) {
          const kind = classifyError(error);
          setResult({
            roadmapId: id,
            steps: [],
            status: kind === 'schema' ? 'schema' : kind === 'network' ? 'network' : 'error',
          });
        } else {
          setResult({ roadmapId: id, steps: data ?? [], status: 'ready' });
        }
        setRetrying(false);
      }
      load(roadmapId);
      return () => {
        cancelled = true;
      };
      // reloadKey fonksiyonun içinde okunmuyor; ama "Tekrar dene" basılınca değişip efekti
      // yeniden çalıştırması için BİLEREK bağımlılıkta. Lint bunu "gereksiz" sanıyor.
      // eslint-disable-next-line react-hooks/exhaustive-deps
    }, [roadmapId, reloadKey])
  );

  function retry() {
    setRetrying(true);
    setReloadKey((k) => k + 1);
  }

  // Başka bir yol haritasına ait eski sonuç gösterilmesin; odak tazelemesinde ise eski sonuç
  // yeni gelene kadar kalır (her dönüşte iskelet zıplaması olmasın).
  const current = result && result.roadmapId === roadmapId ? result : null;
  return {
    steps: current?.steps ?? [],
    status: current?.status ?? ('loading' as StepsStatus),
    retrying,
    retry,
  };
}
