import { useFocusEffect } from 'expo-router';
import { useCallback, useMemo, useState } from 'react';

import { computeAchievements, type AchievementInput } from '@/constants/achievements';
import { supabase } from '@/lib/supabase';
import { classifyError } from '@/lib/supabase-errors';

// loading = ilk yükleme sürüyor · ready = okundu · schema/network/error = HATA.
// "Hiç ilerleme yok" (ready + boş liste) ile "okuyamadık" asla karıştırılmaz; yoksa hatada
// kullanıcıya "0 / 9 rozet" gösterip yanıltırdık.
export type AchievementsStatus = 'loading' | 'ready' | 'schema' | 'network' | 'error';

type State = { status: AchievementsStatus; data: AchievementInput };
const EMPTY: AchievementInput = { roadmaps: [], progress: [] };

// Kullanıcının TÜM yol haritalarını (konu değiştirince eskiler de kalır) ve tamamlama kayıtlarını okur,
// rozetleri istemcide hesaplar. İki küçük sorgu yeter; RLS yalnız kullanıcının kendi satırlarını verir.
// Profil her görününce (useFocusEffect) tazelenir: konu işaretleyip dönünce rozet güncel olur.
export function useAchievements() {
  const [state, setState] = useState<State>({ status: 'loading', data: EMPTY });
  const [reloadKey, setReloadKey] = useState(0);
  const [retrying, setRetrying] = useState(false);

  useFocusEffect(
    useCallback(() => {
      let cancelled = false; // hızlı odak değişiminde eski cevap yeni state'i ezmesin
      async function load() {
        try {
          // Yol haritaları + konu durumları (yalnız rozetlerin ihtiyacı olan sütunlar)
          const [roadmaps, progress] = await Promise.all([
            supabase.from('roadmaps').select('id, topic_path, created_at'),
            supabase.from('topic_progress').select('roadmap_id, topic_id, status, updated_at'),
          ]);
          if (cancelled) return;
          const error = roadmaps.error ?? progress.error;
          if (error) {
            const kind = classifyError(error);
            // Hatada veri boşaltılır: eski/yarım veriyle rozet göstermek yanıltıcı olurdu
            setState({ status: kind === 'schema' ? 'schema' : kind === 'network' ? 'network' : 'error', data: EMPTY });
          } else {
            setState({
              status: 'ready',
              data: {
                roadmaps: roadmaps.data ?? [],
                progress: progress.data ?? [],
              },
            });
          }
        } catch {
          // fetch istisna fırlatırsa (internet yok) yine ağ hatası say
          if (!cancelled) setState({ status: 'network', data: EMPTY });
        }
        if (!cancelled) setRetrying(false);
      }
      load();
      return () => {
        cancelled = true;
      };
      // reloadKey fonksiyonun içinde okunmuyor; "Tekrar dene" basılınca değişip efekti yeniden
      // çalıştırması için BİLEREK bağımlılıkta. Lint bunu "gereksiz" sanıyor.
      // eslint-disable-next-line react-hooks/exhaustive-deps
    }, [reloadKey])
  );

  // Hesap saf fonksiyonda; veri değişmedikçe tekrar çalışmasın
  const achievements = useMemo(() => computeAchievements(state.data), [state.data]);

  function retry() {
    setRetrying(true);
    setReloadKey((k) => k + 1);
  }

  return {
    status: state.status,
    achievements,
    earnedCount: achievements.filter((a) => a.earned).length,
    hasRoadmap: state.data.roadmaps.length > 0,
    retrying,
    retry,
  };
}
