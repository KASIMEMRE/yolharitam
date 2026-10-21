// Kişiselleştirme ve ilerleme hesabı (SAF modül).
//
// Harita herkes için aynıdır; kişiselleştirme onu DEĞİŞTİRMEZ, üstüne işaret koyar:
//   focus = "önce bunlarla başla" (sıralı) · skip = "biliyorsan atlayabilirsin" · notes = bölüm başına tek cümle
// Bu işaretler yapay zekâdan gelir (source: 'ai'); yapay zekâ çalışmazsa aşağıdaki kurallar kullanılır
// (source: 'rules'). Kullanıcı her konuyu yine de kendisi işaretleyebilir.

import { estimateWeeks, type GoalId, type LevelId, type WeeklyHoursId } from '@/constants/plan';

import { allTopics } from './index';
import type { DevRoadmap, Topic } from './types';

export type Personalization = {
  focus: string[];
  skip: string[];
  notes: Record<string, string>;
  source: 'ai' | 'rules';
};

export type TopicStatus = 'done' | 'in_progress' | 'skipped';

const FOCUS_COUNT = 6;

// Seviyeye göre kural tabanlı işaretleme
export function rulePersonalization(map: DevRoadmap, level: LevelId, goal: GoalId): Personalization {
  const core = allTopics(map).filter((t) => t.marker === 'core');
  const byLevel = (lv: number) => core.filter((t) => t.level === lv);

  let focus: Topic[];
  let skip: Topic[] = [];
  if (level === 'beginner') {
    focus = byLevel(1);
  } else if (level === 'intermediate') {
    // Orta seviye: ilk iki bölümün temel konularını büyük ihtimalle biliyor
    const early = new Set(map.sections.slice(0, 2).flatMap((s) => s.topics.map((t) => t.id)));
    skip = byLevel(1).filter((t) => early.has(t.id));
    focus = byLevel(2);
  } else {
    skip = byLevel(1);
    focus = [...byLevel(3), ...byLevel(2)];
  }
  // İş hedefinde kariyer bölümünün ilk konusu odakta kalsın (portfolyo erken başlasın)
  if (goal === 'job') {
    const career = map.sections.find((s) => s.id === 'career' || s.id === 'projects');
    const first = career?.topics.find((t) => t.marker === 'core');
    if (first && !focus.includes(first)) focus = [...focus.slice(0, FOCUS_COUNT - 1), first];
  }
  return {
    focus: focus.slice(0, FOCUS_COUNT).map((t) => t.id),
    skip: skip.map((t) => t.id),
    notes: {},
    source: 'rules',
  };
}

// Yapay zekâ çıktısını seviye kurallarıyla birleştirir.
// Neden? Model sıralamada ve kişisel notlarda iyi, ama seviye kuralına her zaman uymuyor (örn. orta seviyeye
// yine temel konuları öneriyor). Seviye kuralını KOD garanti eder; yapay zekâ sırayı ve notları verir.
export function mergePersonalization(
  ai: Personalization,
  map: DevRoadmap,
  level: LevelId,
  goal: GoalId
): Personalization {
  const rules = rulePersonalization(map, level, goal);
  const byId = new Map(allTopics(map).map((t) => [t.id, t]));
  let basicsLeft = level === 'intermediate' ? 1 : 0; // orta seviyeye en fazla 1 temel konu önerilir
  const fits = (id: string) => {
    const t = byId.get(id);
    if (!t) return false;
    if (level === 'beginner') return t.level === 1;
    if (t.level >= 2) return true;
    if (basicsLeft > 0) {
      basicsLeft -= 1;
      return true;
    }
    return false;
  };
  const focus = ai.focus.filter(fits);
  for (const id of rules.focus) {
    if (focus.length >= FOCUS_COUNT) break;
    if (!focus.includes(id)) focus.push(id);
  }
  // Yapay zekânın "atla" önerisi yalnız önerilen ve seviyenin altındaki konular için kabul edilir
  // (orta: yalnız temel konular · ileri: temel ve orta). İleri konular asla "atlanabilir" denmez.
  const maxSkipLevel = level === 'advanced' ? 2 : 1;
  const aiSkip = ai.skip.filter((id) => {
    const t = byId.get(id);
    return !!t && t.marker === 'core' && t.level <= maxSkipLevel;
  });
  const skip =
    level === 'beginner' ? [] : [...new Set([...rules.skip, ...aiSkip])].filter((id) => !focus.includes(id));
  return { focus: focus.slice(0, FOCUS_COUNT + 2), skip, notes: ai.notes, source: 'ai' };
}

// Veritabanından (jsonb) gelen değeri doğrular. Haritada olmayan kimlikler atılır; içerik
// sonradan değişse bile eski işaretler uygulamayı bozmaz.
export function parsePersonalization(value: unknown, map: DevRoadmap): Personalization | null {
  if (!value || typeof value !== 'object') return null;
  const v = value as Record<string, unknown>;
  const ids = new Set(allTopics(map).map((t) => t.id));
  const sectionIds = new Set(map.sections.map((s) => s.id));
  const list = (x: unknown) =>
    Array.isArray(x) ? [...new Set(x.filter((id): id is string => typeof id === 'string' && ids.has(id)))] : [];
  const notes: Record<string, string> = {};
  if (v.notes && typeof v.notes === 'object') {
    for (const [k, n] of Object.entries(v.notes as Record<string, unknown>)) {
      if (sectionIds.has(k) && typeof n === 'string' && n.trim()) notes[k] = n.trim().slice(0, 200);
    }
  }
  const focus = list(v.focus);
  const skip = list(v.skip).filter((id) => !focus.includes(id));
  return { focus, skip, notes, source: v.source === 'ai' ? 'ai' : 'rules' };
}

// "Planındaki konular": önerilen (core) konular, yapay zekânın atlanabilir dediği hariç;
// ayrıca kullanıcının kendisi başladığı/bitirdiği her konu (isteğe bağlı ya da alternatif olsa da).
// Kullanıcının "atla" dediği konu plandan çıkar.
export function planTopics(
  map: DevRoadmap,
  statuses: ReadonlyMap<string, TopicStatus>,
  p: Personalization | null
): Topic[] {
  const skip = new Set(p?.skip ?? []);
  return allTopics(map).filter((t) => {
    const s = statuses.get(t.id);
    if (s === 'skipped') return false;
    if (s === 'done' || s === 'in_progress') return true;
    return t.marker === 'core' && !skip.has(t.id);
  });
}

export function computeProgress(
  map: DevRoadmap,
  statuses: ReadonlyMap<string, TopicStatus>,
  p: Personalization | null,
  weekly: WeeklyHoursId
) {
  const plan = planTopics(map, statuses, p);
  const done = plan.filter((t) => statuses.get(t.id) === 'done');
  const totalHours = plan.reduce((sum, t) => sum + t.hours, 0);
  const remainingHours = plan.filter((t) => statuses.get(t.id) !== 'done').reduce((sum, t) => sum + t.hours, 0);
  return {
    total: plan.length,
    done: done.length,
    totalHours,
    remainingHours,
    weeks: estimateWeeks(totalHours, weekly),
  };
}

// Sıradaki konu: odak listesinde bitmemiş ilk konu; yoksa planda bitmemiş ilk konu
export function nextTopic(
  map: DevRoadmap,
  statuses: ReadonlyMap<string, TopicStatus>,
  p: Personalization | null
): Topic | undefined {
  const plan = planTopics(map, statuses, p);
  const open = (t: Topic) => statuses.get(t.id) !== 'done' && statuses.get(t.id) !== 'skipped';
  const inProgress = plan.find((t) => statuses.get(t.id) === 'in_progress');
  if (inProgress) return inProgress;
  for (const id of p?.focus ?? []) {
    const t = plan.find((x) => x.id === id);
    if (t && open(t)) return t;
  }
  return plan.find(open);
}
