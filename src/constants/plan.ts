// Kullanıcının cevapladığı plan soruları için ortak tipler ve sayısal kurallar.
// (Sorular ve metinleri: roadmap-questions.ts · Seviyeler: onboarding.ts)

export type WeeklyHoursId = '1-2' | '3-5' | '6-10' | '10+';
export type GoalId = 'job' | 'project' | 'exam' | 'curiosity';
export type LearningStyleId = 'video' | 'reading' | 'practice' | 'mixed';
export type LevelId = 'beginner' | 'intermediate' | 'advanced';

// Veritabanında `level` serbest metin; bilinmeyen değer gelirse nötr olan "orta" seçilir.
export function toLevelId(value: string | null | undefined): LevelId {
  return value === 'beginner' || value === 'advanced' ? value : 'intermediate';
}

// Süre tahmininde kullanılan haftalık saat (aralığın ortalamasına yakın bir değer)
export const WEEKLY_HOURS: Record<WeeklyHoursId, number> = {
  '1-2': 2,
  '3-5': 4,
  '6-10': 8,
  '10+': 12,
};

export function estimateWeeks(hours: number, weekly: WeeklyHoursId): number {
  return hours <= 0 ? 0 : Math.max(1, Math.ceil(hours / WEEKLY_HOURS[weekly]));
}
