import { router } from 'expo-router';
import { useEffect } from 'react';

import { useAuth } from '@/lib/auth-context';
import { intentBeingApplied } from '@/lib/auth-gate';

// Her HESAP için, uygulama açık kaldığı sürece bir kez: hiç haritası olmayan kullanıcıyı harita seçimine götür.
// Modül düzeyinde kayıt: ekran yeniden açılsa da tekrar yönlendirmez (döngü olmaz). Çıkış yapıp başka hesapla
// girilirse yeni hesap için bir kez daha çalışır.
let redirectedFor: string | null = null;

// ready = liste OKUNDU ve gerçekten boş. Ağ hatasında (status 'error') yönlendirme yapılmaz:
// "haritan yok" ile "okuyamadık" karışırsa kullanıcı haritasının silindiğini sanar.
export function useFirstMapRedirect(status: 'loading' | 'ready' | 'error', mapCount: number) {
  const { session } = useAuth();
  const uid = session?.user.id ?? null;
  useEffect(() => {
    // Misafirde yönlendirme yok (Keşfet zaten katalog)
    if (!uid || redirectedFor === uid || status !== 'ready' || mapCount > 0) return;
    redirectedFor = uid;
    // Girişten yeni gelen kişinin bekleyen niyeti varsa (örn. "bu haritayı seç") o kendi yönlendirmesini
    // yapar; ikisi üst üste binmesin diye ilk harita yönlendirmesi atlanır.
    intentBeingApplied().then((intent) => {
      if (!intent) router.push('/onboarding');
    });
  }, [uid, status, mapCount]);
}
