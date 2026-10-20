import { useFocusEffect } from 'expo-router';
import { useCallback, useRef, useState } from 'react';

import { useAuth } from '@/lib/auth-context';
import { supabase } from '@/lib/supabase';
import { classifyError, ERROR_TEXT } from '@/lib/supabase-errors';

// loading = ilk okuma sürüyor · ready = okundu (ad boş olabilir) · error = okunamadı
export type DisplayNameStatus = 'loading' | 'ready' | 'error';

type State = { status: DisplayNameStatus; name: string | null };
type SaveResult = { ok: true } | { ok: false; message: string };

// Kullanıcının görünen adını (profiles.display_name) okur ve kaydeder.
// Profil ve Yol Haritam aynı hook'u kullanır; her ekran odaklanınca adı yeniden okur,
// böylece Profil'de değişen ad Yol Haritam'a geçince güncel görünür (global state gerekmez).
export function useDisplayName() {
  const { session } = useAuth();
  const uid = session?.user.id;
  const [state, setState] = useState<State>({ status: 'loading', name: null });
  // Okuma ile kayıt yarışmasın: kayıt başladığında/bittiğinde sayaç artar. Okuma, başladığından
  // beri sayaç değiştiyse (ya da kayıt sürüyorsa) cevabı yok sayar; eski ad yeni adı ezmesin.
  // Örnek sıralama: okuma başlar -> kayıt biter -> eski okuma (eski adla) döner -> yok sayılır.
  // Not: uid değişince state sıfırlanmaz; çıkışta Stack.Protected sekmeleri söktüğü için
  // hook yeniden kurulur, pratikte eski kullanıcının adı görünmez.
  const writeVersion = useRef(0);
  const saving = useRef(false);

  useFocusEffect(
    useCallback(() => {
      // Oturum yoksa istek atılmaz; durumu aşağıda türetiyoruz (efekt içinde setState gerekmez)
      if (!uid) return;
      const id = uid; // TypeScript'in async fonksiyon içinde de "dolu" bilmesi için daraltılmış kopya
      let cancelled = false; // hızlı odak değişiminde eski cevap yeni state'i ezmesin
      const versionAtStart = writeVersion.current;
      // Eskimiş cevap: ekran ayrıldı, kayıt sürüyor ya da okuma başladıktan sonra kayıt oldu
      const stale = () => cancelled || saving.current || writeVersion.current !== versionAtStart;
      async function load() {
        try {
          const { data, error } = await supabase
            .from('profiles')
            .select('display_name')
            .eq('id', id)
            .maybeSingle();
          if (stale()) return;
          // Odak tazelemesi başarısız olursa eski ad ekranda kalır, yalnız durum 'error' olur
          if (error) setState((s) => ({ ...s, status: 'error' }));
          else setState({ status: 'ready', name: data?.display_name ?? null });
        } catch {
          // fetch istisna fırlatırsa (internet yok) okuma hatası say
          if (!stale()) setState((s) => ({ ...s, status: 'error' }));
        }
      }
      load();
      return () => {
        cancelled = true;
      };
    }, [uid])
  );

  // `trimmed` kırpılmış ve boş OLMAYAN addır (boş denetimi ekranda yapılır).
  async function save(trimmed: string): Promise<SaveResult> {
    if (!uid) return { ok: false, message: ERROR_TEXT.session };
    saving.current = true;
    writeVersion.current += 1;
    try {
      // .select().maybeSingle(): RLS satırı sessizce engellerse hata gelmez ama satır da dönmez.
      // Satır dönmesini şart koşarak "kaydedildi sandık ama kaydedilmedi" durumunu yakalarız.
      const { data, error } = await supabase
        .from('profiles')
        .update({ display_name: trimmed })
        .eq('id', uid)
        .select('display_name')
        .maybeSingle();
      if (error) {
        return { ok: false, message: classifyError(error) === 'network' ? ERROR_TEXT.network : ERROR_TEXT.profileSaveFailed };
      }
      if (!data) return { ok: false, message: ERROR_TEXT.profileSaveFailed };
      setState({ status: 'ready', name: data.display_name });
      return { ok: true };
    } catch {
      return { ok: false, message: ERROR_TEXT.network };
    } finally {
      saving.current = false;
      writeVersion.current += 1;
    }
  }

  return { name: uid ? state.name : null, status: uid ? state.status : ('error' as const), save };
}
