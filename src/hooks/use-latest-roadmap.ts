import { useFocusEffect } from 'expo-router';
import { useCallback, useState } from 'react';

import type { Tables } from '@/lib/database.types';
import { supabase } from '@/lib/supabase';

// Tables<'roadmaps'> = roadmaps tablosundaki bir satırın tipi (otomatik üretilen dosyadan)
export type Roadmap = Tables<'roadmaps'>;

// Kullanıcının en son seçtiği yol haritasını okur. Aynı sorgu Yol Haritam, Gelişmeler ve Profil
// ekranlarında lazım olduğu için tek yerde toplandı (kopyalamak yerine ortak hook).
export function useLatestRoadmap() {
  const [roadmap, setRoadmap] = useState<Roadmap | null>(null);
  const [loading, setLoading] = useState(true);

  // useFocusEffect: Bu ekran her görünür olduğunda çalışır.
  // Böylece onboarding'de konu değişince geri dönüldüğünde veri tazelenir.
  useFocusEffect(
    useCallback(() => {
      async function load() {
        // SQL karşılığı: SELECT * FROM roadmaps ORDER BY created_at DESC LIMIT 1
        // (RLS sayesinde sadece giriş yapan kullanıcının satırları gelir)
        const { data } = await supabase
          .from('roadmaps')
          .select('*')
          .order('created_at', { ascending: false })
          .limit(1)
          .maybeSingle(); // 0 ya da 1 satır bekliyoruz
        setRoadmap(data);
        setLoading(false);
      }
      load();
    }, [])
  );

  return { roadmap, loading };
}
