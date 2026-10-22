import { useFocusEffect } from 'expo-router';
import { useCallback, useState } from 'react';

import { getRoadmap } from '@/constants/dev-roadmaps';
import type { Tables } from '@/lib/database.types';
import { supabase } from '@/lib/supabase';

// Tables<'roadmaps'> = roadmaps tablosundaki bir satırın tipi (otomatik üretilen dosyadan)
export type Roadmap = Tables<'roadmaps'>;

// Kullanıcının yol haritalarını okur. "Aktif" harita = en son KULLANILAN (updated_at), en son
// oluşturulan değil: eski bir haritaya geri dönünce o harita öne gelir.
// Aynı sorgu Yol Haritam, Gelişmeler ve Profil ekranlarında lazım olduğu için tek yerde toplandı.
export function useLatestRoadmap() {
  const [rows, setRows] = useState<Roadmap[]>([]);
  // loading = ilk okuma · ready = okundu (liste boş olabilir) · error = okunamadı.
  // "Hiç haritan yok" ile "okuyamadık" karışmasın: karışırsa çevrimdışı kullanıcı haritasının silindiğini sanar.
  const [status, setStatus] = useState<'loading' | 'ready' | 'error'>('loading');
  const [reloadKey, setReloadKey] = useState(0);

  // useFocusEffect: Bu ekran her görünür olduğunda çalışır (onboarding'den dönünce veri tazelenir).
  useFocusEffect(
    useCallback(() => {
      let cancelled = false;
      async function load() {
        try {
          // SQL karşılığı: SELECT * FROM roadmaps ORDER BY updated_at DESC (RLS: yalnız kendi satırların)
          const { data, error } = await supabase.from('roadmaps').select('*').order('updated_at', { ascending: false });
          if (cancelled) return;
          if (error) {
            // Hata: eldeki (eski) liste silinmez; yalnız durum 'error' olur
            setStatus('error');
            return;
          }
          setRows(data ?? []);
          setStatus('ready');
        } catch {
          // fetch istisna fırlatırsa (internet yok) da yükleme bitmeli
          if (!cancelled) setStatus('error');
        }
      }
      load();
      return () => {
        cancelled = true;
      };
      // reloadKey içeride okunmuyor; activate sonrası yeniden okumak için BİLEREK bağımlılıkta.
      // eslint-disable-next-line react-hooks/exhaustive-deps
    }, [reloadKey])
  );

  // "Tekrar dene": hatalıysa iskelet gösterip yeniden okur
  function retry() {
    setStatus((s) => (s === 'error' ? 'loading' : s));
    setReloadKey((k) => k + 1);
  }

  // Haritalar arasında geçiş: seçilen haritanın updated_at'ini şimdi yap → en üste çıkar.
  // İyimser: önce listede öne alınır, sonra veritabanına yazılır.
  async function activate(id: string): Promise<boolean> {
    const target = rows.find((r) => r.id === id);
    if (!target) return false;
    const now = new Date().toISOString();
    setRows((prev) => [{ ...target, updated_at: now }, ...prev.filter((r) => r.id !== id)]);
    let failed = false;
    try {
      const { error } = await supabase.from('roadmaps').update({ updated_at: now }).eq('id', id);
      failed = !!error;
    } catch {
      failed = true;
    }
    if (failed) {
      setReloadKey((k) => k + 1); // başarısızsa sunucudaki sırayı geri getir
      return false;
    }
    return true;
  }

  // Haritayı kaldırır. Konu ilerlemesi de veritabanında zincirleme silinir (on delete cascade).
  // İyimser değil: silme geri alınamaz, önce sunucunun onayını bekleriz.
  async function remove(id: string): Promise<boolean> {
    try {
      const { error } = await supabase.from('roadmaps').delete().eq('id', id);
      if (error) return false;
    } catch {
      return false;
    }
    setRows((prev) => prev.filter((r) => r.id !== id));
    return true;
  }

  // Aynı harita birden çok kez seçilmişse (eski sürüm) her harita için yalnız en güncel satır listelenir
  const seen = new Set<string>();
  const devRoadmaps = rows.filter((r) => {
    if (!getRoadmap(r.topic_path) || seen.has(r.topic_path)) return false;
    seen.add(r.topic_path);
    return true;
  });

  // Eski sürümden kalan genel konular (spor, finans…) ve aynı haritanın eski kopyaları: Ayarlar'dan temizlenebilsin
  const leftovers = rows.filter((r) => !devRoadmaps.includes(r));

  // roadmap = geçerli (bilinen) ilk harita. rows[0] eski sürümden kalan bir satır olabilir; o zaman
  // harita değiştirici (MapSwitcher) kayboluyordu.
  return {
    roadmap: devRoadmaps[0] ?? null,
    roadmaps: devRoadmaps,
    leftovers,
    status,
    loading: status === 'loading',
    // Hata yalnız elde gösterecek veri yokken ekranı etkilesin; veri varsa eski liste kullanılır
    failed: status === 'error' && rows.length === 0,
    retry,
    activate,
    remove,
  };
}
