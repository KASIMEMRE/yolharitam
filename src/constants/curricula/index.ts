// Tüm konuya özel müfredatlar tek yerde. Yeni kategori eklemek için dosyasını import edip birleştir.
import { TECH_CURRICULA } from './tech';
import type { TopicCurriculum } from './types';

export const CURRICULA: Record<string, TopicCurriculum> = {
  ...TECH_CURRICULA,
};

export type { CurriculumStep, TopicCurriculum } from './types';
