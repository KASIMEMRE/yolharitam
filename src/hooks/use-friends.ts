import { useFocusEffect } from 'expo-router';
import { useCallback, useRef, useState } from 'react';

import { supabase } from '@/lib/supabase';

// Arkadaşlık satırı (friends_overview() RPC'sinin bir satırı).
// direction: 'incoming' = bana gelen istek · 'outgoing' = benim attığım istek · 'friend' = kabul edilmiş.
export type FriendRow = {
  friendship_id: number;
  user_id: string;
  username: string | null;
  display_name: string | null;
  status: 'pending' | 'accepted';
  direction: 'incoming' | 'outgoing' | 'friend';
  active_days: string[]; // son 60 gün, 'YYYY-MM-DD' (yalnız arkadaşlar için dolu)
  today_done: number;
  today_xp: number;
  week_xp: number;
};

export type FriendsStatus = 'loading' | 'ready' | 'error';
// friend_request() cevapları (sözleşmeye göre)
export type RequestResult = 'sent' | 'accepted' | 'not_found' | 'self' | 'exists' | 'limit' | 'username_required' | 'error';

// Arkadaş listesini okur. İstek ve arkadaşlar tek RPC'den gelir; ekran onları direction'a göre ayırır.
// enabled=false iken hiçbir şey yapılmaz (örn. Yol Haritam kartı için kapatılabilir).
export function useFriends(enabled: boolean = true) {
  const [rows, setRows] = useState<FriendRow[]>([]);
  const [status, setStatus] = useState<FriendsStatus>('loading');
  // Yarış önleme (use-news.ts ile aynı fikir): yalnız en son başlayan isteğin cevabı işlenir.
  const reqId = useRef(0);

  const load = useCallback(async (my: number) => {
    try {
      const { data, error } = await supabase.rpc('friends_overview');
      if (my !== reqId.current) return;
      if (error) {
        // Eldeki (eski) liste silinmez; yalnız durum 'error' olur
        setStatus('error');
        return;
      }
      // direction/status sunucuda düz metin; dar tipe çeviriyoruz
      setRows((data ?? []).map((r) => ({ ...(r as FriendRow), active_days: r.active_days ?? [] })));
      setStatus('ready');
    } catch {
      // fetch istisna fırlatırsa (internet yok) da yükleme bitmeli
      if (my === reqId.current) setStatus('error');
    }
  }, []);

  useFocusEffect(
    useCallback(() => {
      if (!enabled) return;
      const my = ++reqId.current;
      load(my);
      return () => {
        reqId.current++; // ekrandan çıkınca bekleyen cevap geçersiz
      };
    }, [load, enabled])
  );

  // "Tekrar dene": iskeleti göster ve baştan oku
  function retry() {
    const my = ++reqId.current;
    setStatus('loading');
    load(my);
  }

  // Bir işlemden sonra listeyi iskelet göstermeden tazeler
  function reload() {
    return load(++reqId.current);
  }

  // @kullanıcıadı'na istek gönderir. Sunucu kuralları (kendine, zaten var, limit) RPC cevabında gelir.
  async function sendRequest(username: string): Promise<RequestResult> {
    try {
      const { data, error } = await supabase.rpc('friend_request', { p_username: username });
      // P0001: kendi kullanıcı adın yok (sunucu kuralı)
      if (error) return error.code === 'P0001' ? 'username_required' : 'error';
      await reload();
      return (typeof data === 'string' ? data : 'error') as RequestResult;
    } catch {
      return 'error';
    }
  }

  // 'gone' = istek artık yok (P0002: karşı taraf geri çekmiş olabilir); liste yine tazelenir
  async function respond(id: number, accept: boolean): Promise<'ok' | 'gone' | 'error'> {
    try {
      const { error } = await supabase.rpc('friend_respond', { p_id: id, p_accept: accept });
      if (error) {
        if (error.code !== 'P0002') return 'error';
        await reload();
        return 'gone';
      }
      await reload();
      return 'ok';
    } catch {
      return 'error';
    }
  }

  // Arkadaşlıktan çıkar / isteği geri çek. İki taraf da silebilir (RLS izin verir).
  async function remove(id: number): Promise<boolean> {
    try {
      const { error } = await supabase.from('friendships').delete().eq('id', id);
      if (error) return false;
      await reload();
      return true;
    } catch {
      return false;
    }
  }

  const friends = rows.filter((r) => r.direction === 'friend');
  return {
    status,
    friends,
    incoming: rows.filter((r) => r.direction === 'incoming'),
    outgoing: rows.filter((r) => r.direction === 'outgoing'),
    retry,
    sendRequest,
    respond,
    remove,
    refresh: reload, // engelleme gibi dış işlemlerden sonra listeyi sessizce yenile
  };
}
