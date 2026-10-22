import { useFocusEffect } from 'expo-router';
import { useCallback, useRef, useState } from 'react';

import { useAuth } from '@/lib/auth-context';
import { supabase } from '@/lib/supabase';
import { classifyError, ERROR_TEXT } from '@/lib/supabase-errors';

// Veritabanındaki kural ile aynı: yalnız küçük harf, rakam ve alt çizgi, 3-20 karakter.
export const USERNAME_PATTERN = /^[a-z0-9_]{3,20}$/;

// Yazılanı kurala yaklaştırır: baştaki "@" atılır, harfler küçülür, boşluklar kırpılır.
// "I" -> "i" için toLowerCase yeterli (Türkçe "İ" kuralın dışında kalır ve uyarı alır).
export function normalizeUsername(raw: string): string {
  return raw.trim().replace(/^@/, '').toLowerCase();
}

export type UsernameStatus = 'loading' | 'ready' | 'error';
type State = { status: UsernameStatus; username: string | null };
type SaveResult = { ok: true } | { ok: false; message: string };

// Kullanıcının topluluk adını (profiles.username) okur ve kaydeder. use-display-name.ts ile aynı kalıp:
// ekran odaklanınca yeniden okur, yarış önleme için istek sayacı tutar.
export function useUsername() {
  const { session } = useAuth();
  const uid = session?.user.id;
  const [state, setState] = useState<State>({ status: 'loading', username: null });
  const [reloadKey, setReloadKey] = useState(0);
  // Kayıt sırasında başlamış eski bir okuma, yeni adı ezmesin diye sayaç artırılır
  const reqId = useRef(0);

  useFocusEffect(
    useCallback(() => {
      if (!uid) return;
      const my = ++reqId.current;
      const id = uid;
      async function load() {
        try {
          const { data, error } = await supabase.from('profiles').select('username').eq('id', id).maybeSingle();
          if (my !== reqId.current) return;
          if (error) setState((s) => ({ ...s, status: 'error' }));
          else setState({ status: 'ready', username: data?.username ?? null });
        } catch {
          if (my === reqId.current) setState((s) => ({ ...s, status: 'error' }));
        }
      }
      load();
      return () => {
        reqId.current++;
      };
      // reloadKey "Tekrar dene" için bilerek bağımlılıkta
      // eslint-disable-next-line react-hooks/exhaustive-deps
    }, [uid, reloadKey])
  );

  function retry() {
    setState((s) => ({ ...s, status: 'loading' }));
    setReloadKey((k) => k + 1);
  }

  // Ad başkasında mı? true = müsait. Hata olursa null (belirsiz): kayıt yine denenebilir, sunucu karar verir.
  async function checkAvailable(name: string): Promise<boolean | null> {
    try {
      const { data, error } = await supabase.rpc('username_available', { p: name });
      if (error || typeof data !== 'boolean') return null;
      return data;
    } catch {
      return null;
    }
  }

  async function save(raw: string): Promise<SaveResult> {
    if (!uid) return { ok: false, message: ERROR_TEXT.session };
    const name = normalizeUsername(raw);
    if (!USERNAME_PATTERN.test(name)) return { ok: false, message: ERROR_TEXT.usernameSaveFailed };
    reqId.current++; // bekleyen okumaları geçersiz kıl
    try {
      const { data, error } = await supabase
        .from('profiles')
        .update({ username: name })
        .eq('id', uid)
        .select('username')
        .maybeSingle();
      if (error) {
        // 23505: benzersizlik ihlali (başkası aynı anda aldı). Yarış durumunda da doğru mesaj çıkar.
        if (error.code === '23505') return { ok: false, message: ERROR_TEXT.usernameTaken };
        return { ok: false, message: classifyError(error) === 'network' ? ERROR_TEXT.network : ERROR_TEXT.usernameSaveFailed };
      }
      if (!data) return { ok: false, message: ERROR_TEXT.usernameSaveFailed };
      setState({ status: 'ready', username: data.username ?? name });
      return { ok: true };
    } catch {
      return { ok: false, message: ERROR_TEXT.network };
    }
  }

  return {
    username: uid ? state.username : null,
    status: uid ? state.status : ('error' as const),
    save,
    checkAvailable,
    retry,
  };
}
