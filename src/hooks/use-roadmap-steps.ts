import { useFocusEffect } from 'expo-router';
import { useCallback, useEffect, useMemo, useRef, useState } from 'react';

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

// İşaretleme hatası: hangi adımda olduğu da tutulur ki mesaj o kartın hemen altında gösterilsin
export type MarkError = { stepId: string; text: string };

// toggleStep sonucu: ok = kayıt başarılı mı · allDone = bu işaretle TÜM adımlar tamamlandı mı
export type ToggleResult = { ok: boolean; allDone: boolean };

// Veritabanı hatasını tek kuralla durum türüne çevirir. Adım okuma, ilerleme okuma ve işaretleme
// aynı kuralı kullanır; kural iki yerde ayrı yazılırsa zamanla birbirinden sapardı.
function statusOf(error: { code?: string; message?: string }): 'schema' | 'network' | 'error' {
  const kind = classifyError(error);
  return kind === 'schema' ? 'schema' : kind === 'network' ? 'network' : 'error';
}

// İşaretleme hatasında kullanıcıya gösterilen metin (hata türüne göre)
const MARK_TEXT = {
  schema: ERROR_TEXT.markSchema,
  network: ERROR_TEXT.markFailed,
  error: ERROR_TEXT.other,
} as const;

// Bir yol haritasının adımlarını sırasıyla okur, ayrıca kullanıcının hangilerini tamamladığını (step_progress)
// ve adımı işaretleme/geri alma (toggleStep) işini yönetir. useLatestRoadmap ile aynı desen:
// useFocusEffect sayesinde ekran her görününce tazelenir (soru akışından dönünce yeni adımlar gelir).
export function useRoadmapSteps(roadmapId: string | undefined) {
  const [result, setResult] = useState<Result | null>(null);
  const [reloadKey, setReloadKey] = useState(0);
  const [retrying, setRetrying] = useState(false);
  const [markError, setMarkError] = useState<MarkError | null>(null);
  const { session } = useAuth();
  const userId = session?.user.id;
  // Aynı adıma art arda dokunmayı engelleyen kilit: istek bitmeden o adım için yenisi gönderilmez.
  // State değil ref: kilit değişince ekranın yeniden çizilmesine gerek yok.
  const busy = useRef(new Set<string>());
  // "Yazma sürümü": her toggle başında ve sonunda artar. Odak tazelemesi okumaya başlarken sayıyı not alır;
  // cevap geldiğinde sayı değişmişse okuma sırasında bir yazma olmuş demektir ve cevap BAYAT olabilir
  // (okuma, yazmadan önceki hali görmüş olabilir). Bu durumda sunucu cevabındaki ilerleme uygulanmaz;
  // ekrandaki iyimser durum zaten doğrudur.
  const writes = useRef(0);
  const errorTimer = useRef<ReturnType<typeof setTimeout> | null>(null);
  // En güncel sonuç: toggleStep'in await sonrasında "tümü bitti mi" sorusuna taze cevap vermesi için
  const latest = useRef<Result | null>(null);
  // Ref'e render sırasında yazmak React kurallarına aykırı (çizim saf olmalı); her çizimden sonra güncelle.
  useEffect(() => {
    latest.current = result;
  }, [result]);

  // Ekrandan çıkılırsa hata zamanlayıcısı takılı kalmasın
  useEffect(
    () => () => {
      if (errorTimer.current) clearTimeout(errorTimer.current);
    },
    []
  );

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
        const writesAtStart = writes.current;
        const { data, error } = await supabase
          .from('roadmap_steps')
          .select('*')
          .eq('roadmap_id', id)
          .order('position');
        if (cancelled) return;
        if (error) {
          setResult({ roadmapId: id, steps: [], status: statusOf(error), completed: [] });
          setRetrying(false);
          return;
        }
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
            setResult({ roadmapId: id, steps: [], status: statusOf(progress.error), completed: [] });
            setRetrying(false);
            return;
          }
          completed = progress.data.map((r) => r.step_id);
        }
        const raced = writes.current !== writesAtStart;
        setResult((prev) => ({
          roadmapId: id,
          steps,
          status: 'ready',
          // Okuma sırasında yazma olduysa mevcut (iyimser) durum korunur, bayat sunucu cevabı atılır
          completed: raced && prev && prev.roadmapId === id ? prev.completed : completed,
        }));
        setRetrying(false);
      }
      load(roadmapId);
      return () => {
        cancelled = true;
      };
      // reloadKey fonksiyonun içinde okunmuyor; ama "Tekrar dene" basılınca değişip efekti
      // yeniden çalıştırması için BİLEREK bağımlılıkta. Lint bunu "gereksiz" sanıyor.
      // eslint-disable-next-line react-hooks/exhaustive-deps
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

  function clearMarkError() {
    if (errorTimer.current) clearTimeout(errorTimer.current);
    errorTimer.current = null;
    setMarkError(null);
  }

  function showMarkError(stepId: string, text: string) {
    clearMarkError();
    setMarkError({ stepId, text });
    errorTimer.current = setTimeout(() => setMarkError(null), 8000);
  }

  // Adımı işaretler ya da işareti kaldırır. Dönüş: null = dokunma yok sayıldı (aynı adım için istek sürüyor
  // ya da liste hazır değil); aksi halde { ok, allDone }.
  //
  // İYİMSER GÜNCELLEME (optimistic update): önce ekranı hemen değiştiririz, isteği arkadan göndeririz.
  // Başarısız olursa eski hale döneriz. Böylece ağ yavaş olsa da uygulama anında tepki veriyor gibi hisseder.
  //
  // İşaret = step_progress'e satır EKLE (insert), geri al = satırı SİL (delete). Tabloda UPDATE
  // politikası yok (Y-04 kararı): bir adım ya tamamlanmıştır (satır var) ya da değildir (satır yok).
  async function toggleStep(stepId: string): Promise<ToggleResult | null> {
    if (!result || result.status !== 'ready') return null;
    if (busy.current.has(stepId)) return null;
    const roadmapIdOfStep = result.roadmapId;
    // Oturum yoksa iyimser güncelleme yapmadan hata göster (yoksa adım bir an işaretlenip geri dönerdi)
    if (!userId) {
      showMarkError(stepId, ERROR_TEXT.session);
      return { ok: false, allDone: false };
    }
    const want = !result.completed.includes(stepId);

    busy.current.add(stepId);
    writes.current += 1;
    clearMarkError();
    setCompleted(roadmapIdOfStep, stepId, want);

    let failure: string | null = null;
    try {
      // user_id'yi biz göndeririz ama güvenlik buna dayanmaz: RLS politikası auth.uid() ile eşleşmeyen
      // satırı veritabanında reddeder (başkası adına işaret atılamaz).
      const { error } = want
        ? await supabase.from('step_progress').insert({ user_id: userId, step_id: stepId })
        : await supabase.from('step_progress').delete().eq('user_id', userId).eq('step_id', stepId);
      // 23505 = satır zaten var (başka cihazdan işaretlenmiş): istenen sonuca ulaşıldı, başarı say
      if (error && classifyError(error) !== 'duplicate') failure = MARK_TEXT[statusOf(error)];
    } catch {
      failure = MARK_TEXT.network;
    }

    writes.current += 1;
    busy.current.delete(stepId);
    if (failure) {
      setCompleted(roadmapIdOfStep, stepId, !want); // geri al
      showMarkError(stepId, failure);
      return { ok: false, allDone: false };
    }
    // "Tümü bitti mi" yalnız MEVCUT adımlara bakar (silinmiş adım id'leri sayılmaz)
    const now = latest.current;
    const done = new Set(now?.completed ?? []);
    const allDone = want && !!now && now.steps.length > 0 && now.steps.every((s) => done.has(s.id));
    return { ok: true, allDone };
  }

  // Yalnız mevcut adımlara ait tamamlanma kayıtları: sayaçlar bu kümeyle doğru kalır
  const completedIds = useMemo(() => {
    if (!result || result.roadmapId !== roadmapId) return new Set<string>();
    const ids = new Set(result.steps.map((s) => s.id));
    return new Set(result.completed.filter((id) => ids.has(id)));
  }, [result, roadmapId]);

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
