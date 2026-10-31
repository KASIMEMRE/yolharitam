import { router } from 'expo-router';
import { useEffect } from 'react';

// Uygulama açık kaldığı sürece bir kez: hiç haritası olmayan kullanıcıyı harita seçimine götür.
// Modül düzeyinde bayrak: ekran yeniden açılsa da tekrar yönlendirmez (döngü olmaz; kullanıcı
// seçimden geri dönerse boş ekranı ve "Yol haritanı seç" düğmesini görür).
let redirected = false;

// ready = liste OKUNDU ve gerçekten boş. Ağ hatasında (status 'error') yönlendirme yapılmaz:
// "haritan yok" ile "okuyamadık" karışırsa kullanıcı haritasının silindiğini sanar.
export function useFirstMapRedirect(status: 'loading' | 'ready' | 'error', mapCount: number) {
  useEffect(() => {
    if (redirected || status !== 'ready' || mapCount > 0) return;
    redirected = true;
    router.push('/onboarding');
  }, [status, mapCount]);
}
