// 2. katman (yapay zekâ ile kişiselleştirme).
//
// Akış: 1. katman (konuya özel şablon) adımları üretir → bu dosya onları `generate-roadmap`
// Edge Function'ına gönderir → yapay zekâ planı kişiye ve konuya göre uyarlar, gerekirse genişletir.
// HER hata durumunda (ağ yok, kota doldu, zaman aşımı, bozuk çıktı) sessizce 1. katman adımları
// döner. Kullanıcı hiçbir zaman "yapay zekâ çalışmadı" yüzünden plansız kalmaz.
//
// İleride (yayından sonra) bu katman ücretli aboneliğe bağlanacak; o zaman `enabled` kontrolü
// buraya eklenecek (ör. kullanıcının abonelik durumu).
import {
  validateSteps,
  type GeneratedStep,
  type RoadmapInput,
} from '@/constants/roadmap-templates';
import { supabase } from '@/lib/supabase';

const AI_TIMEOUT_MS = 13000; // sunucu kendi içinde 12 sn bekler; üstüne küçük pay

type AiStep = Omit<GeneratedStep, 'position'>;

export type PersonalizeResult = { steps: GeneratedStep[]; personalized: boolean };

export async function personalizeSteps(
  input: RoadmapInput,
  baseSteps: GeneratedStep[],
  topicChain?: string
): Promise<PersonalizeResult> {
  const fallback = { steps: baseSteps, personalized: false };
  try {
    const { data, error } = await supabase.functions.invoke<{ steps?: AiStep[] }>(
      'generate-roadmap',
      {
        body: {
          ...input,
          topicChain,
          baseSteps: baseSteps.map((s) => ({
            title: s.title,
            description: s.description,
            estimatedHours: s.estimatedHours,
            phase: s.phase,
            resourceType: s.resourceType,
          })),
        },
        timeout: AI_TIMEOUT_MS,
      }
    );
    if (error || !Array.isArray(data?.steps)) return fallback;

    // Yapay zekâ adım sayısını konuya göre değiştirebilir (6-14). Sunucu zaten doğruladı;
    // burada da aynı sözleşmeden geçer (validateSteps), geçmezse temel plan kullanılır.
    const steps: GeneratedStep[] = data.steps.map((ai, i) => ({
      position: i + 1,
      title: typeof ai?.title === 'string' ? ai.title.trim() : '',
      description: typeof ai?.description === 'string' ? ai.description.trim() : '',
      estimatedHours: Number.isInteger(ai?.estimatedHours) ? ai.estimatedHours : 3,
      phase: ai?.phase,
      resourceType: ai?.resourceType,
    }));
    return validateSteps(steps) ? { steps, personalized: true } : fallback;
  } catch {
    return fallback;
  }
}
