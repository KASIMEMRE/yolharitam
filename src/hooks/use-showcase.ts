import { useFocusEffect } from 'expo-router';
import { useCallback, useRef, useState } from 'react';

import { classifyError } from '@/lib/supabase-errors';
import { supabase } from '@/lib/supabase';

// Vitrindeki bir proje (showcase_list() RPC'sinin bir satırı)
export type ShowcaseProject = {
  id: number;
  map_id: string;
  title: string;
  description: string | null;
  repo_url: string;
  demo_url: string | null;
  created_at: string;
  user_id: string;
  username: string | null;
  display_name: string | null;
  is_me: boolean;
};

export type ShowcaseStatus = 'loading' | 'ready' | 'error';

// GitHub depo linki: https://github.com/sahip/depo (sunucudaki check ile aynı kural)
export const GITHUB_URL_RE = /^https:\/\/github\.com\/[A-Za-z0-9_.-]+\/[A-Za-z0-9_.-]+\/?$/;

const PAGE = 20;

type State = { items: ShowcaseProject[]; status: ShowcaseStatus; key: string; hasMore: boolean };

// Vitrin listesi. map=null → tüm haritalar. Sayfalama: son satırın id'si p_before olarak gönderilir.
export function useShowcase(map: string | null, enabled: boolean = true) {
  const [state, setState] = useState<State>({ items: [], status: 'loading', key: '', hasMore: false });
  const [loadingMore, setLoadingMore] = useState(false);
  const key = map ?? '';
  const reqId = useRef(0); // yarış önleme (use-news.ts kalıbı)

  const load = useCallback(
    async (my: number) => {
      try {
        const { data, error } = await supabase.rpc('showcase_list', { p_map: key || undefined, p_limit: PAGE, p_before: undefined });
        if (my !== reqId.current) return;
        if (error) {
          // Aynı filtrenin eski listesi korunur, farklı filtrenin listesi atılır
          setState((s) => ({ items: s.key === key ? s.items : [], status: 'error', key, hasMore: false }));
          return;
        }
        const items: ShowcaseProject[] = data ?? [];
        setState({ items, status: 'ready', key, hasMore: items.length === PAGE });
      } catch {
        if (my === reqId.current) {
          setState((s) => ({ items: s.key === key ? s.items : [], status: 'error', key, hasMore: false }));
        }
      }
    },
    [key]
  );

  useFocusEffect(
    useCallback(() => {
      if (!enabled) return;
      const my = ++reqId.current;
      load(my);
      return () => {
        reqId.current++;
      };
    }, [load, enabled])
  );

  function retry() {
    const my = ++reqId.current;
    setState({ items: [], status: 'loading', key: '', hasMore: false });
    load(my);
  }

  // "Daha fazla göster": listenin sonuna eski projeleri ekler
  async function loadMore() {
    const last = state.items[state.items.length - 1];
    if (!last || loadingMore || !state.hasMore) return;
    const my = ++reqId.current;
    setLoadingMore(true);
    try {
      const { data, error } = await supabase.rpc('showcase_list', { p_map: key || undefined, p_limit: PAGE, p_before: last.id });
      if (my !== reqId.current) return;
      if (error) {
        setState((s) => ({ ...s, status: 'error' }));
        return;
      }
      const more: ShowcaseProject[] = data ?? [];
      setState((s) => ({ ...s, items: [...s.items, ...more], status: 'ready', hasMore: more.length === PAGE }));
    } catch {
      if (my === reqId.current) setState((s) => ({ ...s, status: 'error' }));
    } finally {
      setLoadingMore(false);
    }
  }

  // Kendi projeni sil. İyimser değil: silme önce sunucuda onaylanır.
  async function removeProject(id: number): Promise<boolean> {
    try {
      const { error } = await supabase.from('showcase_projects').delete().eq('id', id);
      if (error) return false;
      setState((s) => ({ ...s, items: s.items.filter((p) => p.id !== id) }));
      return true;
    } catch {
      return false;
    }
  }

  // Başkasının projesini bildir. Aynı kişi aynı projeyi ikinci kez bildirirse (23505) zaten kayıtlıdır: başarı sayılır.
  // Sunucu kötüye kullanımı P0001 ile reddeder: 'report_too_soon' (hesap 24 saatten yeni) ve 'report_limit' (günde 10).
  async function reportProject(id: number): Promise<ReportResult> {
    try {
      const { error } = await supabase.from('showcase_reports').insert({ project_id: id, reason: 'Uygunsuz içerik' });
      if (!error || error.code === '23505') return 'ok';
      if (error.message?.includes('report_too_soon')) return 'too_soon';
      if (error.message?.includes('report_limit')) return 'limit';
      return 'error';
    } catch {
      return 'error';
    }
  }

  // Engellenen kişinin projeleri listeden hemen kalkar (sunucu da bundan sonra hiç göndermez)
  function hideUser(userId: string) {
    setState((s) => ({ ...s, items: s.items.filter((p) => p.user_id !== userId) }));
  }

  const current = enabled && state.key === key;
  return {
    items: current ? state.items : [],
    status: current ? state.status : ('loading' as ShowcaseStatus),
    hasMore: current && state.hasMore,
    loadingMore,
    retry,
    loadMore,
    removeProject,
    reportProject,
    hideUser,
  };
}

export type ReportResult = 'ok' | 'too_soon' | 'limit' | 'error';

export type NewProject = {
  map_id: string;
  title: string;
  description: string;
  repo_url: string;
  demo_url: string | null;
};

// Yeni proje ekler (paylaşma formu kullanır). Dönüş: null = başarılı, değilse hata türü.
// Sunucu "harita başına 5, toplam 20 proje" kuralını tetikleyiciyle uygular (P0001); user_id veritabanında auth.uid() olur.
export async function createProject(
  p: NewProject
): Promise<null | 'limit' | 'invalid' | 'inappropriate' | 'network' | 'other'> {
  try {
    const { error } = await supabase.from('showcase_projects').insert(p);
    if (!error) return null;
    // Sunucunun kelime filtresi (moderation_block migration'ı)
    if (error.message?.includes('inappropriate_content')) return 'inappropriate';
    if (error.code === 'P0001') return 'limit';
    if (error.code === '23514' || error.code === '22001') return 'invalid';
    const kind = classifyError(error);
    return kind === 'network' ? 'network' : 'other';
  } catch {
    return 'network';
  }
}
