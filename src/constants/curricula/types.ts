// Konuya özel müfredat tipleri.
//
// Her konu (yaprak, örn. 'tech/mobile/react-native') için seviyeye göre AYRI adımlar yazılır.
// Adım sayıları genel şablonla aynıdır, böylece üretici ve ekranlar değişmeden çalışır:
//   Başlangıç: 3 temel + 2 pratik  ·  Orta: 1 temel + 3 pratik  ·  İleri: 1 temel + 3 pratik
// Hedef adımları (iş, proje, sınav, merak) genel kalır; `projectIdeas` onları konuya uyarlar.

export type CurriculumStep = {
  title: string;
  description: string;
  baseHours: number; // haftalık süre çarpanından ÖNCEKİ saat
  resource?: string; // somut kaynak önerisi (ad olarak; link verilmez, linkler zamanla kırılır)
};

type Three = [CurriculumStep, CurriculumStep, CurriculumStep];

export type TopicCurriculum = {
  beginner: { foundation: Three; practice: [CurriculumStep, CurriculumStep] };
  intermediate: { foundation: [CurriculumStep]; practice: Three };
  advanced: { foundation: [CurriculumStep]; practice: Three };
  projectIdeas: string[]; // hedef adımlarında "Fikir: …" olarak önerilir (2-3 adet)
};

// Kısa yazım için yardımcı
export function s(title: string, description: string, baseHours: number, resource?: string): CurriculumStep {
  return { title, description, baseHours, resource };
}
