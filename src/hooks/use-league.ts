import { useFocusEffect } from 'expo-router';
import { useCallback, useRef, useState } from 'react';

import { supabase } from '@/lib/supabase';

// league_week RPC'sinin döndürdüğü satır
export type LeagueRow = {
  rank: number;
  user_id: string;
  username: string | null;
  display_name: string | null;
  xp: number;
  is_me: boolean;
};

export type LeagueStatus = 'loading' | 'ready' | 'error';

// Liste hangi haritayla (key) okundu? Harita değişince eski sıralamayı yeni çipin altında göstermemek için.
type State = { rows: LeagueRow[]; status: LeagueStatus; key: string };

// Seçili haritanın bu haftaki sıralamasını okur. mapId null ise (harita yok / yükleniyor) istek atılmaz.
// Kalıp use-news.ts ile aynı: odakta oku, istek sayacıyla eski cevapları yok say.
export function useLeague(mapId: string | null) {
  const [state, setState] = useState<State>({ rows: [], status: 'loading', key: '' });
  const reqId = useRef(0);

  const load = useCallback(async (my: number, map: string) => {
    try {
      const { data, error } = await supabase.rpc('league_week', { p_map: map });
      if (my !== reqId.current) return;
      if (error) {
        // Hata yutulmaz: aynı haritanın eski listesi korunur, başka haritanınki atılır
        setState((s) => ({ rows: s.key === map ? s.rows : [], status: 'error', key: map }));
        return;
      }
      setState({ rows: data ?? [], status: 'ready', key: map });
    } catch {
      if (my === reqId.current) setState((s) => ({ rows: s.key === map ? s.rows : [], status: 'error', key: map }));
    }
  }, []);

  useFocusEffect(
    useCallback(() => {
      if (!mapId) return;
      load(++reqId.current, mapId);
      return () => {
        reqId.current++;
      };
    }, [load, mapId])
  );

  function retry() {
    if (!mapId) return;
    setState({ rows: [], status: 'loading', key: '' });
    load(++reqId.current, mapId);
  }

  const current = !!mapId && state.key === mapId;
  return {
    rows: current ? state.rows : [],
    status: current ? state.status : ('loading' as LeagueStatus),
    retry,
  };
}
