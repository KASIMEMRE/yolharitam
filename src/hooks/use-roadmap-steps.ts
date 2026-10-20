import { useFocusEffect } from 'expo-router';
import { useCallback, useMemo, useRef, useState } from 'react';

import { useAuth } from '@/lib/auth-context';
import type { Tables } from '@/lib/database.types';
import { supabase } from '@/lib/supabase';
import { classifyError, ERROR_TEXT } from '@/lib/supabase-errors';

export type RoadmapStep = Tables<'roadmap_steps'>;

// loading = ilk yükleme sürüyor · ready = okundu (steps boş olabilir!) · schema/network/error = HATA.
// ÖNEMLİ: "adım yok" (ready + boş liste) ile "okuyamadık" (schema/network/error) ASLA karıştırılmaz.
// Karışırsa hatada kullanıcıya "Adımlarını oluşturalım" gösterip yanlış yönlendirirdik.
export type StepsStatus = 'loading' | 'ready' | 'schema' | 'network' | 'error';

// completed = tamamlanmış adımların id'leri (Set yerine dizi: state'te sade tutulur, dışarıya Set olarak verilir)
type Result = { roadmapId: string; steps: RoadmapStep[]; status: StepsStatus; completed: string[] };

// Bir yol haritasının adımlarını sırasıyla okur, ayrıca kullanıcının hangilerini tamamladığını (step_progress)
// ve adımı işaretleme/geri alma (toggleStep) işini yönetir. useLatestRoadmap ile aynı desen:
// useFocusEffect sayesinde ekran her görününce tazelenir (soru akışından dönünce yeni adımlar gelir).
export function useRoadmapSteps(roadmapId: string | undefined) {
  const [result, setResult] = useState<Result | null>(null);
  const [reloadKey, setReloadKey] = useState(0);
  const [retrying, setRetrying] = useState(false);
  const [markError, setMarkError] = useState<string | null>(null);
  const { session } = useAuth();
  const userId = session?.user.id;
  // Aynı adıma art arda dokunmayı engelleyen kilit: istek bitmeden o adım için yenisi gönderilmez.
  // State değil ref: kilit değişince ekranın yeniden çizilmesine gerek yok.
  const busy = useRef(new Set<string>());
  // Havada olan işaretler (adım id -> istenen durum). Odak tazelemesi tam bu sırada bitip
  // iyimser durumu eski sunucu verisiyle ezmesin diye yükleme sonucuna tekrar uygulanır.
  const pending = useRef(new Map<string, boolean>());
  const errorTimer = useRef<ReturnType<typeof setTimeout> | null>(null);

  useFocusEffect(
    useCallback(() => {
      if (!roadmapId) return;
      let cancelled = false; // hızlı odak değişiminde eski cevap yeni state'i ezmesin
      // Eski sonuç "adım yok" ise bayat olabilir (soru akışından yeni döndük ve adımlar yeni yazıldı):
      // kısa süre iskelet göster, yoksa "Adımlarını oluşturalım" kartı bir an yanıp sönerdi.
      setResult((prev) =>
        prev && prev.roadmapId === roadmapId && prev.status === 'ready' && prev.steps.length === 0 ? null : prev
      );
      async function load(id: string) {
        const { data, error } = await supabase
          .from('roadmap_steps')
          .select('*')
          .eq('roadmap_id', id)
          .order('position');
        if (cancelled) return;
        if (error) {
          const kind = classifyError(error);
          setResult({
            roadmapId: id,
            steps: [],
            status: kind === 'schema' ? 'schema' : kind === 'network' ? 'network' : 'error',
            completed: [],
          });
        } else {
          const steps = data ?? [];
          // İlerlemeyi yalnız bu yol haritasının adımları için sorgula. RLS zaten sadece kullanıcının
          // kendi satırlarını verir; `.in` ile ayrıca gereksiz veri çekmeyiz.
          let completed: string[] = [];
          if (steps.length > 0) {
            const progress = await supabase
              .from('step_progress')
              .select('step_id')
              .in('step_id', steps.map((s) => s.id));
            if (cancelled) return;
            if (progress.error) {
              // İlerleme okunamadıysa "hiç tamamlanmamış" göstermek yanıltıcı olurdu: hata olarak bildir
              const kind = classifyError(progress.error);
              setResult({
                roadmapId: id,
                steps: [],
                status: kind === 'schema' ? 'schema' : kind === 'network' ? 'network' : 'error',
                completed: [],
              });
              setRetrying(false);
              return;
            }
            completed = (progress.data ?? []).map((r) => r.step_id);
          }
          // Havadaki işaretleri sunucu verisinin üstüne uygula
          const set = new Set(completed);
          pending.current.forEach((want, stepId) => (want ? set.add(stepId) : set.delete(stepId)));
          setResult({ roadmapId: id, steps, status: 'ready', completed: [...set] });
        }
        setRetrying(false);
      }
      load(roadmapId);
      return () => {
        cancelled = true;
      };
      // reloadKey: "Tekrar dene" basılınca efekti yeniden çalıştırmak için
    }, [roadmapId, reloadKey])
  );

  function retry() {
    setRetrying(true);
    setReloadKey((k) => k + 1);
  }

  // Tek adımın durumunu state'e yazar (iyimser güncelleme ve geri alma ikisi de bunu kullanır)
  function setCompleted(roadmapIdOfStep: string, stepId: string, value: boolean) {
    setResult((prev) => {
      if (!prev || prev.roadmapId !== roadmapIdOfStep) return prev;
      const set = new Set(prev.completed);
      if (value) set.add(stepId);
      else set.delete(stepId);
      return { ...prev, completed: [...set] };
    });
  }

  function showMarkError(text: string) {
    setMarkError(text);
    if (errorTimer.current) clearTimeout(errorTimer.current);
    errorTimer.current = setTimeout(() => setMarkError(null), 8000);
  }

  // Adımı işaretler ya da işareti kaldırır. Dönüş: true = kaydedildi, false = başarısız (geri alındı),
  // null = aynı adım için istek sürüyordu, dokunma yok sayıldı.
  //
  // İYİMSER GÜNCELLEME (optimistic update): önce ekranı hemen değiştiririz, isteği arkadan göndeririz.
  // Başarısız olursa eski hale döneriz. Böylece ağ yavaş olsa da uygulama anında tepki veriyor gibi hisseder.
  //
  // İşaret = step_progress'e satır EKLE (insert), geri al = satırı SİL (delete). Tabloda UPDATE
  // politikası yok (Y-04 kararı): bir adım ya tamamlanmıştır (satır var) ya da değildir (satır yok).
  async function toggleStep(stepId: string): Promise<boolean | null> {
    if (!result || result.status !== 'ready') return null;
    if (busy.current.has(stepId)) return null;
    const roadmapIdOfStep = result.roadmapId;
    const want = !result.completed.includes(stepId);

    busy.current.add(stepId);
    pending.current.set(stepId, want);
    setMarkError(null);
    setCompleted(roadmapIdOfStep, stepId, want);

    let failure: string | null = null;
    if (!userId) {
      failure = ERROR_TEXT.session;
    } else {
      try {
        // user_id'yi biz göndeririz ama güvenlik buna dayanmaz: RLS politikası auth.uid() ile eşleşmeyen
        // satırı veritabanında reddeder (başkası adına işaret atılamaz).
        const { error } = want
          ? await supabase.from('step_progress').insert({ user_id: userId, step_id: stepId })
          : await supabase.from('step_progress').delete().eq('user_id', userId).eq('step_id', stepId);
        if (error) {
          const kind = classifyError(error);
          // 23505 = satır zaten var (başka cihazdan işaretlenmiş): istenen sonuca ulaşıldı, başarı say
          if (kind !== 'duplicate') {
            failure = kind === 'schema' ? ERROR_TEXT.loadSchema : kind === 'network' ? ERROR_TEXT.markFailed : ERROR_TEXT.other;
          }
        }
      } catch {
        failure = ERROR_TEXT.markFailed;
      }
    }

    pending.current.delete(stepId);
    busy.current.delete(stepId);
    if (failure) {
      setCompleted(roadmapIdOfStep, stepId, !want); // geri al
      showMarkError(failure);
      return false;
    }
    return true;
  }

  const completedIds = useMemo(
    () => new Set(result && result.roadmapId === roadmapId ? result.completed : []),
    [result, roadmapId]
  );

  // Başka bir yol haritasına ait eski sonuç gösterilmesin; odak tazelemesinde ise eski sonuç
  // yeni gelene kadar kalır (her dönüşte iskelet zıplaması olmasın).
  const current = result && result.roadmapId === roadmapId ? result : null;
  return {
    steps: current?.steps ?? [],
    status: current?.status ?? ('loading' as StepsStatus),
    retrying,
    retry,
    completedIds,
    toggleStep,
    markError,
  };
}
