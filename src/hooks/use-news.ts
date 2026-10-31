import { useFocusEffect } from 'expo-router';
import { useCallback, useRef, useState } from 'react';

import { supabase } from '@/lib/supabase';

// Ekranda gösterilen tek haber. Yalnız başlık + kısa özet + link tutulur (telif kuralı).
export type NewsItem = {
  id: number;
  title: string;
  summary: string | null;
  url: string;
  published_at: string;
  // Türkçe çeviri mi gösteriliyor? (Çeviri henüz yoksa orijinal metin gösterilir, bu false olur)
  translated: boolean;
  topic_paths: string[];
  source_name: string;
};

export type NewsStatus = 'loading' | 'ready' | 'error';

// Sorgudan dönen ham satır (kaynak adı ilişkili tablodan gelir)
type Row = Omit<NewsItem, 'source_name' | 'translated'> & {
  title_tr: string | null;
  summary_tr: string | null;
  news_sources: { name: string } | { name: string }[] | null;
};

// Kaynakları tazeleme (Edge Function) aynı oturumda en çok 10 dakikada bir tetiklenir.
// Modül düzeyi değişken: ekranlar arası gidip gelmede sıfırlanmaz. Yalnız BAŞARILI çağrıdan sonra yazılır.
const REFRESH_EVERY_MS = 10 * 60 * 1000;
let lastInvokeAt = 0;

// Liste hangi filtreyle (key) okundu? Filtre değişince eski listeyi yeni çipin altında göstermemek için.
type State = { items: NewsItem[]; status: NewsStatus; key: string };

// Haber listesini okur. Önce veritabanındaki liste hızla gösterilir, sonra Edge Function ile
// kaynaklar tazelenir ve liste yeniden okunur.
// topicPaths boşsa tüm haberler gelir; doluysa yalnız bu haritalarla kesişenler.
// enabled=false iken hiçbir şey yapılmaz (örn. haritalar henüz yükleniyor, filtre belli değil).
export function useNews(topicPaths: string[], enabled: boolean = true) {
  const [state, setState] = useState<State>({ items: [], status: 'loading', key: '' });
  const [refreshing, setRefreshing] = useState(false);
  // Dizi her render'da yeni nesne olur; efekt gereksiz çalışmasın diye metne çeviriyoruz.
  const topicKey = topicPaths.join(',');
  // İstek sayacı: yeni istek başlayınca ya da ekran/filtre değişince artar. Eski isteğin cevabı
  // `my !== reqId.current` olduğundan yok sayılır. Yalnız efekt/olay içinde yazılır, render'da değil.
  const reqId = useRef(0);

  const load = useCallback(
    async (my: number, force: boolean) => {
      const isCancelled = () => my !== reqId.current;
      const paths = topicKey ? topicKey.split(',') : [];

      async function read(): Promise<boolean> {
        let query = supabase
          .from('news_items')
          .select('id, title, summary, title_tr, summary_tr, url, published_at, topic_paths, news_sources(name)')
          .order('published_at', { ascending: false })
          .limit(60);
        if (paths.length > 0) query = query.overlaps('topic_paths', paths);
        const { data, error } = await query;
        if (isCancelled()) return false;
        if (error) {
          // Hata yutulmaz: aynı filtrenin eski listesi korunur, farklı filtrenin listesi atılır
          setState((s) => ({ items: s.key === topicKey ? s.items : [], status: 'error', key: topicKey }));
          return false;
        }
        const rows = (data ?? []) as unknown as Row[];
        const items = rows.map((r) => {
          const src = Array.isArray(r.news_sources) ? r.news_sources[0] : r.news_sources;
          // Türkçesi varsa onu göster; yoksa orijinal (sunucu yarım saatte bir çeviriyi tamamlar)
          const { title_tr, summary_tr, news_sources: _src, ...rest } = r;
          return {
            ...rest,
            title: title_tr ?? r.title,
            summary: title_tr ? summary_tr : r.summary,
            translated: !!title_tr,
            source_name: src?.name ?? '',
          };
        });
        setState({ items, status: 'ready', key: topicKey });
        return true;
      }

      try {
        // 1) Hızlı ilk görüntü
        const ok = await read();
        if (isCancelled() || !ok) return;
        // 2) Kaynakları tazele; hata/zaman aşımı olsa da listeyi yeniden okuruz (kısmen yazılmış olabilir).
        // İlk çekim ~30 sn sürebildiği için zaman aşımı geniş.
        if (force || Date.now() - lastInvokeAt > REFRESH_EVERY_MS) {
          const { error } = await supabase.functions.invoke('fetch-news', { body: {}, timeout: 30000 });
          if (isCancelled()) return;
          if (error && __DEV__) console.warn('Haber kaynakları tazelenemedi:', error.message);
          else lastInvokeAt = Date.now();
          await read();
        }
      } catch {
        // fetch istisna fırlatırsa (internet yok) da yükleme bitmeli
        if (!isCancelled()) {
          setState((s) => ({ items: s.key === topicKey ? s.items : [], status: 'error', key: topicKey }));
        }
      }
    },
    [topicKey]
  );

  useFocusEffect(
    useCallback(() => {
      if (!enabled) return;
      const my = ++reqId.current;
      load(my, false);
      return () => {
        // Ekrandan çıkış ya da filtre değişimi: bekleyen cevaplar geçersiz olur
        reqId.current++;
      };
    }, [load, enabled])
  );

  // Aşağı çekince: kaynakları zorla tazele (10 dk sınırı yok sayılır)
  async function refresh() {
    if (!enabled) return;
    const my = ++reqId.current;
    setRefreshing(true);
    try {
      await load(my, true);
    } finally {
      setRefreshing(false);
    }
  }

  // "Tekrar dene": iskeleti göster ve baştan oku
  function retry() {
    if (!enabled) return;
    const my = ++reqId.current;
    setState({ items: [], status: 'loading', key: '' });
    load(my, false);
  }

  // Liste başka bir filtreyle okunduysa (ya da henüz hiç okunmadıysa) iskelet göster
  const current = enabled && state.key === topicKey;
  return {
    items: current ? state.items : [],
    status: current ? state.status : ('loading' as NewsStatus),
    refreshing,
    refresh,
    retry,
  };
}
