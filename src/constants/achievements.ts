import type { Hue } from '@/constants/visuals';

// Başarım (rozet) tanımları ve hesabı. SAF modül: Supabase/React içermez, sadece veri alıp veri döndürür.
// Böylece `node` ile tek başına denenebilir (roadmap-templates.ts ile aynı öğretici desen).
//
// Rozetler veritabanında SAKLANMAZ; her açılışta mevcut adım/ilerleme verisinden TÜRETİLİR.
// Neden? Rozet koşulları zaten tutulan gerçek olaylardan çıkıyor; ayrı bir tablo aynı bilgiyi ikinci kez
// saklar ve ikisi tutarsız kalabilirdi. Bilinen sonuç: bir adımın işaretini geri alırsan rozet kaybolabilir.
// Bu doğru davranış: rozet "şu an sağladığın durumu" gösterir.

// ---- Girdi tipleri (veritabanı satırlarının ihtiyacımız olan kısmı) ----

export type AchievementRoadmap = {
  id: string;
  topic_path: string;
  created_at: string; // ISO zaman damgası
  steps: { id: string; phase: string; estimated_hours: number }[];
};

export type AchievementProgress = { step_id: string; completed_at: string };

export type AchievementInput = {
  roadmaps: AchievementRoadmap[];
  progress: AchievementProgress[];
};

// ---- Tanımlar (sayısal sınırlar tek yerde: değiştirmek için burası yeter) ----

export const WARMUP_STEPS = 3; // "Isınma Turu" için toplam adım
export const QUICK_START_HOURS = 24; // "Hızlı Başlangıç" süre penceresi
export const CURIOUS_TOPICS = 2; // "Meraklı Gezgin" için farklı konu sayısı
export const TARGET_HOURS = 10; // "On Saatlik Yol" için toplam tahmini süre

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
  { id: 'first-step', emoji: '👣', title: 'İlk Adım', description: 'İlk adımı attın.', howTo: 'İlk adımını tamamla.', hue: 'accent' },
  { id: 'three-steps', emoji: '🔥', title: 'Isınma Turu', description: 'Üç adımı geride bıraktın.', howTo: 'Toplam 3 adım tamamla.', hue: 'coral' },
  { id: 'quick-start', emoji: '⚡', title: 'Hızlı Başlangıç', description: 'Başlamakta gecikmedin.', howTo: 'Yol haritanı oluşturduktan sonraki 24 saat içinde ilk adımını tamamla.', hue: 'marker' },
  { id: 'foundation-done', emoji: '🧱', title: 'Temeller Tamam', description: 'Sağlam bir temel attın.', howTo: 'Bir yol haritasında Temeller evresini bitir.', hue: 'sky' },
  { id: 'practice-done', emoji: '🧪', title: 'Pratiğe Geçtin', description: 'Öğrendiklerini uygulamaya döktün.', howTo: 'Bir yol haritasında Pratik evresini bitir.', hue: 'violet' },
  { id: 'halfway', emoji: '⛰️', title: 'Yarı Yolda', description: 'Yolun yarısı geride kaldı.', howTo: 'Bir yol haritasının yarısını tamamla.', hue: 'leaf' },
  { id: 'roadmap-done', emoji: '🏁', title: 'Yol Haritası Tamam', description: 'Bir yol haritasını sonuna kadar yürüdün.', howTo: 'Bir yol haritasının bütün adımlarını tamamla.', hue: 'accent' },
  { id: 'curious', emoji: '🧭', title: 'Meraklı Gezgin', description: 'Merakın tek konuya sığmadı.', howTo: 'İki farklı konuda en az birer adım tamamla.', hue: 'berry' },
  // "tahmini" diyoruz: gerçek çalışma süresini ölçmüyoruz, adımların tahmini sürelerini topluyoruz
  { id: 'ten-hours', emoji: '⏳', title: 'On Saatlik Yol', description: 'Tahmini 10 saatlik içerik tamamladın.', howTo: 'Tamamladığın adımların tahmini süresi 10 saati bulsun.', hue: 'sky' },
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
  // step_id → tamamlanma zamanı. Sadece bilinen adımlar sayılır (başka yol haritasından kalan/yetim satırlar hariç).
  const completedAt = new Map<string, string>();
  const knownSteps = new Set(input.roadmaps.flatMap((r) => r.steps.map((s) => s.id)));
  for (const p of input.progress) {
    if (knownSteps.has(p.step_id)) completedAt.set(p.step_id, p.completed_at);
  }
  const totalDone = completedAt.size;

  // Yol haritası başına özet
  const perRoadmap = input.roadmaps.map((r) => {
    const done = r.steps.filter((s) => completedAt.has(s.id));
    const phaseCount = (phase: string) => {
      const inPhase = r.steps.filter((s) => s.phase === phase);
      return { current: inPhase.filter((s) => completedAt.has(s.id)).length, target: inPhase.length };
    };
    // En erken tamamlanma: "ilk adım" zamanı
    const times = done.map((s) => Date.parse(completedAt.get(s.id)!)).filter((t) => !Number.isNaN(t));
    return {
      roadmap: r,
      total: r.steps.length,
      done: done.length,
      hours: done.reduce((sum, s) => sum + s.estimated_hours, 0),
      foundation: phaseCount('foundation'),
      practice: phaseCount('practice'),
      firstDoneAt: times.length > 0 ? Math.min(...times) : null,
    };
  });

  const isFull = (c: Candidate) => c.target > 0 && c.current >= c.target;

  // Hızlı Başlangıç: ilk tamamlama ile yol haritası oluşturma arasındaki fark (iki zaman damgası: saat dilimi etkilemez)
  const quickStart = perRoadmap.some((p) => {
    if (p.firstDoneAt === null) return false;
    const created = Date.parse(p.roadmap.created_at);
    return !Number.isNaN(created) && p.firstDoneAt - created <= QUICK_START_HOURS * HOUR_MS;
  });

  // Meraklı Gezgin: en az bir adımı tamamlanmış farklı konu sayısı (yol haritası sayısı DEĞİL:
  // aynı konuda ikinci yol haritası kurmak sayıyı artırmaz)
  const topics = new Set(perRoadmap.filter((p) => p.done > 0).map((p) => p.roadmap.topic_path));

  const totalHours = perRoadmap.reduce((sum, p) => sum + p.hours, 0);

  // Yarı yol eşiği: toplam adımın yarısı, yukarı yuvarlanır (5 adımda 3)
  const halfNeed = (total: number) => Math.ceil(total / 2);
  const halfCandidates = perRoadmap.map((p) => ({ current: p.done, target: halfNeed(p.total) }));
  const fullCandidates = perRoadmap.map((p) => ({ current: p.done, target: p.total }));

  const state: Record<AchievementId, { earned: boolean; hint: AchievementHint | null }> = {
    'first-step': { earned: totalDone >= 1, hint: null },
    'three-steps': { earned: totalDone >= WARMUP_STEPS, hint: hint(totalDone, WARMUP_STEPS, 'adım') },
    'quick-start': { earned: quickStart, hint: null },
    'foundation-done': phaseResult(perRoadmap.map((p) => p.foundation), isFull),
    'practice-done': phaseResult(perRoadmap.map((p) => p.practice), isFull),
    halfway: {
      // target 0 (adımsız yol haritası) asla "yarı" sayılmaz
      earned: halfCandidates.some((c) => c.target > 0 && c.current >= c.target),
      hint: hintOf(bestOf(halfCandidates)),
    },
    'roadmap-done': { earned: fullCandidates.some(isFull), hint: hintOf(bestOf(fullCandidates)) },
    curious: { earned: topics.size >= CURIOUS_TOPICS, hint: hint(topics.size, CURIOUS_TOPICS, 'konu') },
    'ten-hours': { earned: totalHours >= TARGET_HOURS, hint: hint(totalHours, TARGET_HOURS, 'saat') },
  };

  return ACHIEVEMENTS.map((def) => ({ ...def, ...state[def.id] }));
}

// Evre rozetleri (Temeller/Pratik): evresi olan ve hepsi bitmiş bir yol haritası var mı + en yakın ilerleme (boş evre aday olmaz)
function phaseResult(candidates: Candidate[], isFull: (c: Candidate) => boolean) {
  return { earned: candidates.some(isFull), hint: hintOf(bestOf(candidates)) };
}

function hintOf(c: Candidate | null): AchievementHint | null {
  return c ? hint(c.current, c.target, 'adım') : null;
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
