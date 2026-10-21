// Haritayı kişiye göre işaretletir: önce yapay zekâ (personalize-roadmap Edge Function),
// olmazsa kural tabanlı işaretleme. HER durumda geçerli bir Personalization döner;
// kullanıcı "yapay zekâ çalışmadı" yüzünden asla takılmaz.
//
// İleride (yayından sonra) yapay zekâ katmanı ücretli aboneliğe bağlanacak; kontrol buraya eklenecek.
import type { DevRoadmap } from '@/constants/dev-roadmaps';
import {
  mergePersonalization,
  parsePersonalization,
  rulePersonalization,
  type Personalization,
} from '@/constants/dev-roadmaps/personalize';
import type { GoalId, LearningStyleId, LevelId, WeeklyHoursId } from '@/constants/plan';
import { supabase } from '@/lib/supabase';

const AI_TIMEOUT_MS = 13000; // sunucu kendi içinde 12 sn bekler; üstüne küçük pay

export type PlanInput = {
  level: LevelId;
  weeklyHours: WeeklyHoursId;
  goal: GoalId;
  learningStyle: LearningStyleId;
};

export async function personalizeRoadmap(map: DevRoadmap, input: PlanInput): Promise<Personalization> {
  const fallback = rulePersonalization(map, input.level, input.goal);
  try {
    const { data, error } = await supabase.functions.invoke('personalize-roadmap', {
      body: {
        roadmapTitle: map.title,
        ...input,
        // Yalnız modelin ihtiyacı olan alanlar gönderilir (açıklama ve kaynaklar gönderilmez: daha hızlı, daha ucuz)
        sections: map.sections.map((s) => ({
          id: s.id,
          title: s.title,
          topics: s.topics.map((t) => ({ id: t.id, title: t.title, level: t.level, marker: t.marker })),
        })),
      },
      timeout: AI_TIMEOUT_MS,
    });
    if (error || !data) return fallback;
    // Sunucu zaten doğruladı; istemcide de aynı doğrulamadan geçer (savunma katmanı)
    const parsed = parsePersonalization({ ...data, source: 'ai' }, map);
    if (!parsed || parsed.focus.length < 3) return fallback;
    // Seviye kuralını kod garanti eder; yapay zekâ sırayı ve bölüm notlarını verir
    return mergePersonalization(parsed, map, input.level, input.goal);
  } catch {
    return fallback;
  }
}
