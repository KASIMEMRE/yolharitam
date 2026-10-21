import { useFocusEffect } from 'expo-router';
import { useCallback, useState } from 'react';

import { dayKey } from '@/constants/activity';
import { findTopic, getRoadmap } from '@/constants/dev-roadmaps';
import { supabase } from '@/lib/supabase';

export type Activity = {
  activeDays: Set<string>; // işaret konulan günler (tüm haritalarda)
  doneThisWeekFor: (roadmapId: string, weekStart: Date) => { hours: number }[];
};

type Row = { roadmap_id: string; topic_id: string; status: string; updated_at: string };

// Seri ve haftalık hedef için kullanıcının tüm konu işaretlerini okur (RLS yalnız kendi satırlarını verir).
// Hata olursa null kalır ve kart hiç çizilmez: motivasyon kartı yüzünden ekran bozulmaz.
export function useActivity() {
  const [rows, setRows] = useState<Row[] | null>(null);
  const [maps, setMaps] = useState<Record<string, string>>({}); // roadmap_id → harita kimliği

  useFocusEffect(
    useCallback(() => {
      let cancelled = false;
      (async () => {
        try {
          const [progress, roadmaps] = await Promise.all([
            supabase.from('topic_progress').select('roadmap_id, topic_id, status, updated_at'),
            supabase.from('roadmaps').select('id, topic_path'),
          ]);
          if (cancelled || progress.error || roadmaps.error) return;
          setRows(progress.data ?? []);
          setMaps(Object.fromEntries((roadmaps.data ?? []).map((r) => [r.id, r.topic_path])));
        } catch {
          // ağ hatası: kartı göstermeyiz
        }
      })();
      return () => {
        cancelled = true;
      };
    }, [])
  );

  if (!rows) return null;

  const activeDays = new Set(
    rows
      .filter((r) => r.status === 'done' || r.status === 'in_progress')
      .map((r) => dayKey(new Date(r.updated_at)))
  );

  function doneThisWeekFor(roadmapId: string, weekStart: Date) {
    const map = getRoadmap(maps[roadmapId]);
    if (!map || !rows) return [];
    return rows
      .filter((r) => r.roadmap_id === roadmapId && r.status === 'done' && new Date(r.updated_at) >= weekStart)
      .map((r) => findTopic(map, r.topic_id)?.topic)
      .filter((t): t is NonNullable<typeof t> => Boolean(t));
  }

  return { activeDays, doneThisWeekFor } satisfies Activity;
}
