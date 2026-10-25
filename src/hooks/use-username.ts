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

// Serbest bir addan (ör. "Emre Şekersoy", e-postanın baş kısmı) kurala uyan bir öneri üretir:
// Türkçe harfler İngilizce karşılığına çevrilir, kalan uygunsuz karakterler "_" olur. "Emre Şekersoy" -> "emre_sekersoy"
export function suggestUsername(raw: string): string {
  let s = raw
    .toLowerCase()
    .replace(/ı/g, 'i') // noktasız ı'nın ayrıştırılabilir bir biçimi yok, elle çevrilir
    .normalize('NFD') // ç -> c + çengel, ş -> s + çengel, ö -> o + iki nokta ...
    .replace(/[\u0300-\u036f]/g, '') // ... sonra işaretler atılır
    .replace(/[^a-z0-9_]+/g, '_')
    .replace(/_+/g, '_')
    .replace(/^_|_$/g, '')
    .slice(0, 20);
  if (s.length > 0 && s.length < 3) s = `${s}_dev`.slice(0, 20); // çok kısa ad: "al" -> "al_dev"
  return s;
}

export type UsernameStatus = 'loading' | 'ready' | 'error';
type State = { status: UsernameStatus; username: string | null; oldName: string | null };
type SaveResult = { ok: true } | { ok: false; message: string };

// Kullanıcının adını (profiles.username) okur ve kaydeder. Uygulamada TEK ad budur: selamlama, profil,
// lig, arkadaşlar ve vitrin hep @kullanıcı adını gösterir. Ekran odaklanınca yeniden okur; yarış önleme için istek sayacı tutar.
export function useUsername() {
  const { session } = useAuth();
  const uid = session?.user.id;
  const [state, setState] = useState<State>({ status: 'loading', username: null, oldName: null });
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
          const { data, error } = await supabase.from('profiles').select('username, display_name').eq('id', id).maybeSingle();
          if (my !== reqId.current) return;
          if (error) setState((s) => ({ ...s, status: 'error' }));
          else setState({ status: 'ready', username: data?.username ?? null, oldName: data?.display_name ?? null });
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
      setState((s) => ({ ...s, status: 'ready', username: data.username ?? name }));
      return { ok: true };
    } catch {
      return { ok: false, message: ERROR_TEXT.network };
    }
  }

  // Adı olmayan (eski) hesaba öneri: kayıtta yazılan ad, eski "görünen ad" ya da e-postanın baş kısmı
  const meta = (session?.user.user_metadata ?? {}) as { username?: unknown; display_name?: unknown };
  const source = [meta.username, state.oldName, meta.display_name, session?.user.email?.split('@')[0]].find(
    (x): x is string => typeof x === 'string' && x.trim().length > 0
  );
  const suggestion = source ? suggestUsername(source) : '';

  return {
    username: uid ? state.username : null,
    suggestion,
    status: uid ? state.status : ('error' as const),
    save,
    checkAvailable,
    retry,
  };
}
