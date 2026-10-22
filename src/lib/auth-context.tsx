import type { Session } from '@supabase/supabase-js';
import { createContext, useContext, useEffect, useState, type ReactNode } from 'react';

import { supabase } from './supabase';

// CONTEXT: Bir değeri tüm uygulamaya "yayınlamanın" yolu.
// Oturum bilgisini her ekrana props ile tek tek geçirmek yerine,
// en üste bir kere koyuyoruz; isteyen ekran useAuth() ile okuyor.
type AuthState = {
  session: Session | null; // Giriş yapılmışsa oturum bilgisi, yoksa null
  loading: boolean; // Telefonda kayıtlı oturum henüz okunuyor mu?
};

const AuthContext = createContext<AuthState>({ session: null, loading: true });

export function AuthProvider({ children }: { children: ReactNode }) {
  const [session, setSession] = useState<Session | null>(null);
  const [loading, setLoading] = useState(true);

  // useEffect: Ekran ilk açıldığında bir kere çalışan kod (yan etki).
  useEffect(() => {
    // 1) Uygulama açılınca telefonda kayıtlı bir oturum var mı bak
    // Okuma hata verirse (bozuk depolama vb.) yükleme ekranında sonsuza dek kalmayalım: oturumsuz say
    supabase.auth
      .getSession()
      .then(({ data }) => setSession(data.session))
      .catch(() => setSession(null))
      .finally(() => setLoading(false));

    // 2) Sonrasında giriş/çıkış olduğunda haberdar ol
    const { data } = supabase.auth.onAuthStateChange((_event, newSession) => {
      setSession(newSession);
    });

    // 3) Temizlik: bileşen kaldırılınca dinlemeyi bırak
    return () => data.subscription.unsubscribe();
  }, []);

  return <AuthContext.Provider value={{ session, loading }}>{children}</AuthContext.Provider>;
}

// Kısayol hook: Herhangi bir ekranda  const { session } = useAuth();
export function useAuth() {
  return useContext(AuthContext);
}
