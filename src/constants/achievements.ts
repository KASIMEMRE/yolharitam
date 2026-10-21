import { findTopic, getRoadmap } from '@/constants/dev-roadmaps';
import { planTopics, type TopicStatus } from '@/constants/dev-roadmaps/personalize';
import type { Hue } from '@/constants/visuals';

// Başarım (rozet) tanımları ve hesabı. SAF modül: Supabase/React içermez, sadece veri alıp veri döndürür.
// Böylece `node` ile tek başına denenebilir (roadmap-templates.ts ile aynı öğretici desen).
//
// Rozetler veritabanında SAKLANMAZ; her açılışta konu ilerlemesinden (topic_progress) TÜRETİLİR.
// Neden? Rozet koşulları zaten tutulan gerçek olaylardan çıkıyor; ayrı bir tablo aynı bilgiyi ikinci kez
// saklar ve ikisi tutarsız kalabilirdi. Bilinen sonuç: bir adımın işaretini geri alırsan rozet kaybolabilir.
// Bu doğru davranış: rozet "şu an sağladığın durumu" gösterir.

// ---- Girdi tipleri (veritabanı satırlarının ihtiyacımız olan kısmı) ----

export type AchievementRoadmap = {
  id: string;
  topic_path: string; // harita kimliği ('frontend' …); eski sürümden kalan konular sayılmaz
  created_at: string; // ISO zaman damgası
};

export type AchievementProgress = { roadmap_id: string; topic_id: string; status: string; updated_at: string };

export type AchievementInput = {
  roadmaps: AchievementRoadmap[];
  progress: AchievementProgress[];
};

// ---- Tanımlar (sayısal sınırlar tek yerde: değiştirmek için burası yeter) ----

export const WARMUP_STEPS = 3; // "Isınma Turu" için toplam konu
export const QUICK_START_HOURS = 24; // "Hızlı Başlangıç" süre penceresi
export const CURIOUS_TOPICS = 2; // "Meraklı Gezgin" için farklı harita sayısı
export const TARGET_HOURS = 10; // "On Saatlik Yol" için toplam tahmini süre
export const MANY_SECTIONS = 3; // "Üç Bölüm" için bitirilen bölüm sayısı

export type AchievementId =
  | 'first-step'
  | 'three-steps'
  | 'quick-start'
  | 'foundation-done'
  | 'practice-done'
  | 'halfway'
  | 'roadmap-done'
  | 'curious'
  | 'ten-hours';

export type AchievementDef = {
  id: AchievementId;
  emoji: string;
  title: string;
  description: string; // kazanılınca gösterilen kısa cümle
  howTo: string; // kazanılmadıysa gösterilen "nasıl kazanılır"
  hue: Hue; // kazanılınca kartın rengi (kategori renkleriyle aynı aile)
};

export const ACHIEVEMENTS: AchievementDef[] = [
  { id: 'first-step', emoji: '👣', title: 'İlk Adım', description: 'İlk konunu bitirdin.', howTo: 'Bir konuyu “Bitti” olarak işaretle.', hue: 'accent' },
  { id: 'three-steps', emoji: '🔥', title: 'Isınma Turu', description: 'Üç konuyu geride bıraktın.', howTo: 'Toplam 3 konu bitir.', hue: 'coral' },
  { id: 'quick-start', emoji: '⚡', title: 'Hızlı Başlangıç', description: 'Başlamakta gecikmedin.', howTo: 'Haritanı seçtikten sonraki 24 saat içinde ilk konunu bitir.', hue: 'marker' },
  { id: 'foundation-done', emoji: '🧱', title: 'İlk Bölüm', description: 'Bir bölümü baştan sona bitirdin.', howTo: 'Bir bölümün plandaki bütün konularını bitir.', hue: 'sky' },
  { id: 'practice-done', emoji: '🏗️', title: 'Üç Bölüm', description: 'Haritanın üç bölümünü tamamladın.', howTo: 'Üç bölümü tamamla.', hue: 'violet' },
  { id: 'halfway', emoji: '⛰️', title: 'Yarı Yolda', description: 'Yolun yarısı geride kaldı.', howTo: 'Bir haritada planındaki konuların yarısını bitir.', hue: 'leaf' },
  { id: 'roadmap-done', emoji: '🏁', title: 'Harita Tamam', description: 'Bir yol haritasını sonuna kadar yürüdün.', howTo: 'Bir haritada planındaki bütün konuları bitir.', hue: 'accent' },
  { id: 'curious', emoji: '🧭', title: 'Meraklı Gezgin', description: 'Merakın tek haritaya sığmadı.', howTo: 'İki farklı haritada en az birer konu bitir.', hue: 'berry' },
  // "tahmini" diyoruz: gerçek çalışma süresini ölçmüyoruz, konuların tahmini sürelerini topluyoruz
  { id: 'ten-hours', emoji: '⏳', title: 'On Saatlik Yol', description: 'Tahmini 10 saatlik içerik tamamladın.', howTo: 'Bitirdiğin konuların tahmini süresi 10 saati bulsun.', hue: 'sky' },
];

// ---- Çıktı tipleri ----

// current/target GERÇEK sayılardır; label ekranda gösterilen hazır metin ("2 / 3 adım").
export type AchievementHint = { current: number; target: number; label: string };

export type AchievementResult = AchievementDef & {
  earned: boolean;
  hint: AchievementHint | null; // ilerleme anlamlı değilse (örn. "Hızlı Başlangıç") null
};

// ---- Hesap ----

const HOUR_MS = 60 * 60 * 1000;

function hint(current: number, target: number, unit: string): AchievementHint {
  const shown = Math.min(current, target); // taşan değer ("4 / 3") göstermeyelim
  return { current: shown, target, label: `${shown} / ${target} ${unit}` };
}

// Her yol haritası için bir "puan": en çok ilerlemiş olanın ipucunu göstermek için kullanılır.
type Candidate = { current: number; target: number };

// Adaylar arasından en tamamlanmışı seçer (oran en yüksek; eşitse ilk gelen).
function bestOf(candidates: Candidate[]): Candidate | null {
  let best: Candidate | null = null;
  for (const c of candidates) {
    if (c.target <= 0) continue; // boş evre/yol haritası "tamam" sayılmaz, aday da olmaz
    if (!best || c.current / c.target > best.current / best.target) best = c;
  }
  return best;
}

export function computeAchievements(input: AchievementInput): AchievementResult[] {
  // Yol haritası başına özet. İçerik uygulamada durduğu için konu saatleri ve bölümler buradan okunur.
  const perRoadmap = input.roadmaps.flatMap((r) => {
    const map = getRoadmap(r.topic_path);
    if (!map) return []; // eski sürümden kalan genel konu: rozet hesabına girmez
    const rows = input.progress.filter((p) => p.roadmap_id === r.id);
    const statuses = new Map<string, TopicStatus>();
    const doneAt = new Map<string, number>();
    for (const row of rows) {
      if (!findTopic(map, row.topic_id)) continue; // içerikten kalkmış konu sayılmaz
      statuses.set(row.topic_id, row.status as TopicStatus);
      const t = Date.parse(row.updated_at);
      if (row.status === 'done' && !Number.isNaN(t)) doneAt.set(row.topic_id, t);
    }
    // Kişisel işaret olmadan plan: önerilenler + kullanıcının başladıkları − atladıkları
    const plan = planTopics(map, statuses, null);
    const done = plan.filter((t) => statuses.get(t.id) === 'done');
    const sections = map.sections.map((s) => {
      const inPlan = s.topics.filter((t) => plan.includes(t));
      return { current: inPlan.filter((t) => statuses.get(t.id) === 'done').length, target: inPlan.length };
    });
    const times = [...doneAt.values()];
    return [
      {
        roadmap: r,
        total: plan.length,
        done: done.length,
        hours: done.reduce((sum, t) => sum + t.hours, 0),
        sections,
        firstDoneAt: times.length > 0 ? Math.min(...times) : null,
      },
    ];
  });

  const isFull = (c: Candidate) => c.target > 0 && c.current >= c.target;
  const totalDone = perRoadmap.reduce((sum, p) => sum + p.done, 0);

  // Hızlı Başlangıç: ilk bitirme ile haritayı seçme arasındaki fark
  const quickStart = perRoadmap.some((p) => {
    if (p.firstDoneAt === null) return false;
    const created = Date.parse(p.roadmap.created_at);
    return !Number.isNaN(created) && p.firstDoneAt - created <= QUICK_START_HOURS * HOUR_MS;
  });

  // Meraklı Gezgin: en az bir konusu bitmiş farklı harita sayısı
  const maps = new Set(perRoadmap.filter((p) => p.done > 0).map((p) => p.roadmap.topic_path));
  const totalHours = perRoadmap.reduce((sum, p) => sum + p.hours, 0);

  // Bölüm rozetleri: biten bölüm sayısı (tüm haritalarda), ipucu için en çok ilerlemiş bölüm
  const allSections = perRoadmap.flatMap((p) => p.sections);
  const fullSections = allSections.filter(isFull).length;

  const halfNeed = (total: number) => Math.ceil(total / 2);
  const halfCandidates = perRoadmap.map((p) => ({ current: p.done, target: halfNeed(p.total) }));
  const fullCandidates = perRoadmap.map((p) => ({ current: p.done, target: p.total }));

  const state: Record<AchievementId, { earned: boolean; hint: AchievementHint | null }> = {
    'first-step': { earned: totalDone >= 1, hint: null },
    'three-steps': { earned: totalDone >= WARMUP_STEPS, hint: hint(totalDone, WARMUP_STEPS, 'konu') },
    'quick-start': { earned: quickStart, hint: null },
    'foundation-done': { earned: fullSections >= 1, hint: hintOf(bestOf(allSections)) },
    'practice-done': { earned: fullSections >= MANY_SECTIONS, hint: hint(fullSections, MANY_SECTIONS, 'bölüm') },
    halfway: {
      earned: halfCandidates.some((c) => c.target > 0 && c.current >= c.target),
      hint: hintOf(bestOf(halfCandidates)),
    },
    'roadmap-done': { earned: fullCandidates.some(isFull), hint: hintOf(bestOf(fullCandidates)) },
    curious: { earned: maps.size >= CURIOUS_TOPICS, hint: hint(maps.size, CURIOUS_TOPICS, 'harita') },
    'ten-hours': { earned: totalHours >= TARGET_HOURS, hint: hint(totalHours, TARGET_HOURS, 'saat') },
  };

  return ACHIEVEMENTS.map((def) => ({ ...def, ...state[def.id] }));
}

function hintOf(c: Candidate | null): AchievementHint | null {
  return c ? hint(c.current, c.target, 'konu') : null;
}

// "9 rozetten 2'sini kazandın": Türkçede sayıdan sonra gelen iyelik+belirtme eki sayıya göre değişir.
// Hepsi/hiçbiri için ek gerektirmeyen ayrı cümleler kullanılır.
const ACCUSATIVE: Record<number, string> = {
  1: "1'ini",
  2: "2'sini",
  3: "3'ünü",
  4: "4'ünü",
  5: "5'ini",
  6: "6'sını",
  7: "7'sini",
  8: "8'ini",
};

export function summaryText(earned: number, total: number): string {
  if (earned <= 0) return 'Henüz rozet kazanmadın';
  if (earned >= total) return `${total} rozetin hepsini kazandın`;
  return `${total} rozetten ${ACCUSATIVE[earned] ?? `${earned}'ini`} kazandın`;
}
