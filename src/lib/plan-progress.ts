// Plan ilerlemesi: uygulamadaki TÜM "x / y konu" sayaçlarının tek kaynağı (SAF modül).
//
// Tanım: "plan" = önerilen (core) konular, kişiselleştirmenin "atlanabilir" dedikleri hariç; ayrıca kullanıcının
// kendisi başlattığı/bitirdiği her konu. Kullanıcının "atladım" dediği konu plandan çıkar (bkz. planTopics).
// Neden tek yer? Yol Haritam "6/31" (plan) gösterirken Ayarlar "8 / 43" (tüm harita) gösteriyordu:
// aynı kullanıcı iki farklı sayı görüyordu. Artık her ekran buradan sayar.

import type { DevRoadmap, Section, Topic } from '@/constants/dev-roadmaps';
import {
  computeProgress,
  personalizationFor,
  planTopics,
  type Personalization,
  type TopicStatus,
} from '@/constants/dev-roadmaps/personalize';
import { toLevelId, type GoalId } from '@/constants/plan';
import { isAnswerId } from '@/constants/roadmap-questions';

export type Count = { done: number; total: number };

// roadmaps satırından plan için gereken alanlar. Satırın tamamı (Tables<'roadmaps'>) da uyar;
// böylece Ayarlar › Haritalarım ek istek atmadan, zaten okunmuş satırlarla başka haritanın planını da hesaplar.
export type PlanRoadmapRow = {
  level: string;
  goal?: string | null;
  personalization?: unknown;
};

// Satırdaki kişisel işaretler; kayıt yoksa (eski kayıt) seviyeye göre kurallar.
// Yol Haritam, Konu ve Ayarlar AYNI çözümü kullanır: "bölüm bitti" ve sayaçlar ekrana göre değişmesin.
export function personalizationOf(map: DevRoadmap, row: PlanRoadmapRow): Personalization {
  const goal: GoalId = isAnswerId('goal', row.goal) ? (row.goal as GoalId) : 'job';
  return personalizationFor(map, row.personalization, toLevelId(row.level), goal);
}

// Haritanın planındaki konular (atlananlar çıkmış, başlanan/bitenler eklenmiş).
export function roadmapPlanTopics(
  map: DevRoadmap,
  row: PlanRoadmapRow,
  statuses: ReadonlyMap<string, TopicStatus>
): Topic[] {
  return planTopics(map, statuses, personalizationOf(map, row));
}

// Tek haritanın sayacı: { done, total }. Sayma kuralı computeProgress ile BİREBİR aynıdır (ikinci bir kopya yok):
// total = plandaki konu sayısı, done = plandakilerden bitenler. Atlananlar ne paya ne paydaya girer.
export function planProgress(
  map: DevRoadmap,
  row: PlanRoadmapRow | null, // null: takip edilmeyen harita (kişisel işaret yok)
  statuses: ReadonlyMap<string, TopicStatus>
): Count {
  // Haftalık saat yalnız süre tahminini etkiler; sayıları değiştirmez, o yüzden sabit bir değer yeter.
  const { done, total } = computeProgress(map, statuses, row ? personalizationOf(map, row) : null, '3-5');
  return { done, total };
}

// Bir bölümün sayacı (liste ve ağaç görünümü). `plan`: haritanın plan konularının kimlikleri.
export function sectionProgress(
  section: Section,
  plan: ReadonlySet<string>,
  statuses: ReadonlyMap<string, TopicStatus>
): Count {
  const inPlan = section.topics.filter((t) => plan.has(t.id));
  return { done: inPlan.filter((t) => statuses.get(t.id) === 'done').length, total: inPlan.length };
}
