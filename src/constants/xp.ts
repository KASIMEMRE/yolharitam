// XP kuralları ve seviyeler (SAF modül).
//
// Puanlar küçük ve tutarlı tutuldu: asıl ödül konu bitirmek; quiz ve soru destekleyici.
// Bir olay bir kez puan verir (veritabanında kind + ref benzersiz).

export type XpKind = 'topic_started' | 'topic_done' | 'quiz_done' | 'ask' | 'daily' | 'section_done' | 'roadmap_done';

export const XP: Record<Exclude<XpKind, 'quiz_done'>, number> = {
  topic_started: 5,
  topic_done: 20,
  ask: 2,
  daily: 30, // günün görevi bonusu
  section_done: 50,
  roadmap_done: 200,
};
// Quiz: doğru cevap başına puan (4 soruda en fazla 20)
export const XP_PER_CORRECT = 5;

export const XP_LABEL: Record<XpKind, string> = {
  topic_started: 'Konuya başladın',
  topic_done: 'Konu bitti',
  quiz_done: 'Quiz tamam',
  ask: 'Soru sordun',
  daily: 'Günün görevi tamam',
  section_done: 'Bölüm tamam',
  roadmap_done: 'Harita tamam',
};

// Seviyeler: eşik = o seviyeye girmek için gereken toplam XP
export const LEVELS = [
  { min: 0, title: 'Çaylak', emoji: '🌱' },
  { min: 100, title: 'Meraklı', emoji: '🔍' },
  { min: 300, title: 'Kalfa', emoji: '🛠️' },
  { min: 700, title: 'Usta', emoji: '⚙️' },
  { min: 1500, title: 'Uzman', emoji: '🚀' },
  { min: 3000, title: 'Efsane', emoji: '🏆' },
] as const;

export function levelFor(xp: number) {
  let index = 0;
  for (let i = 0; i < LEVELS.length; i++) if (xp >= LEVELS[i].min) index = i;
  const current = LEVELS[index];
  const next = LEVELS[index + 1];
  const progress = next ? (xp - current.min) / (next.min - current.min) : 1;
  return {
    index,
    title: current.title,
    emoji: current.emoji,
    next: next ? { title: next.title, min: next.min, remaining: next.min - xp } : null,
    progress: Math.max(0, Math.min(1, progress)),
  };
}
