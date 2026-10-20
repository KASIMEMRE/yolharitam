// Soru ekranının (roadmap-questions.tsx) VERİSİ: soru metinleri, seçenekler ve varsayılanlar.
// Metinler burada durur, ekran kodu sadece bu tabloyu çizer. Yeni soru/seçenek eklemek için
// ekranı değil bu tabloyu değiştirirsin. (Seçenek kimlikleri üretici kurallarıyla birebir aynı:
// roadmap-templates.ts)
import type { GoalId, LearningStyleId, WeeklyHoursId } from '@/constants/roadmap-templates';

export type Answers = {
  weeklyHours: WeeklyHoursId;
  goal: GoalId;
  learningStyle: LearningStyleId;
};
export type AnswerKey = keyof Answers;

export type QuestionOption = { id: string; title: string; description: string; emoji: string };
export type Question = {
  key: AnswerKey;
  title: string;
  subtitle: string;
  options: QuestionOption[];
};

export const QUESTIONS: Question[] = [
  {
    key: 'weeklyHours',
    title: 'Haftada kaç saat ayırabilirsin?',
    subtitle: 'Tahmini süreleri bu tempoya göre hesaplarız.',
    options: [
      { id: '1-2', title: 'En fazla 2 saat', description: 'Hafif tempo', emoji: '🍃' },
      { id: '3-5', title: '3-5 saat', description: 'Dengeli tempo', emoji: '🌿' },
      { id: '6-10', title: '6-10 saat', description: 'Hızlı tempo', emoji: '🌳' },
      { id: '10+', title: '10 saatten fazla', description: 'Yoğun tempo', emoji: '🚀' },
    ],
  },
  {
    key: 'goal',
    title: 'Hedefin ne?',
    subtitle: 'Yolun son adımları hedefine göre şekillenir.',
    options: [
      { id: 'job', title: 'İş ve kariyer', description: 'Portfolyo ve mülakata hazırlan', emoji: '💼' },
      { id: 'project', title: 'Kendi projem', description: 'Bir şey inşa etmek istiyorum', emoji: '🏗️' },
      { id: 'exam', title: 'Sınav ya da sertifika', description: 'Bir sınava hazırlanıyorum', emoji: '🎓' },
      { id: 'curiosity', title: 'Merak ve gelişim', description: 'Keşfetmek hoşuma gidiyor', emoji: '🔭' },
    ],
  },
  {
    key: 'learningStyle',
    title: 'Nasıl öğrenmeyi seversin?',
    subtitle: 'Adımlara önerilen kaynak türü buna göre seçilir.',
    options: [
      { id: 'video', title: 'Video izleyerek', description: 'Ders ve eğitim serileri', emoji: '🎬' },
      { id: 'reading', title: 'Okuyarak', description: 'Dokümantasyon ve rehberler', emoji: '📖' },
      { id: 'practice', title: 'Uygulamalı proje', description: 'Yaparak öğrenirim', emoji: '🛠️' },
      { id: 'mixed', title: 'Karışık', description: 'Hepsinden biraz', emoji: '🧩' },
    ],
  },
];

// "Soruları atla" düğmesinin değerleri. Yanıtlanmamış sorular bunlarla dolar.
export const DEFAULT_ANSWERS: Answers = {
  weeklyHours: '3-5',
  goal: 'curiosity',
  learningStyle: 'mixed',
};

// "Soruları atla" ile doldurulan değerlerin okunur özeti: "3-5 saat, merak ve gelişim, karışık".
// Metni elle yazmak yerine DEFAULT_ANSWERS'tan türetiriz: varsayılan değişirse yazı kendiliğinden doğru kalır.
export function describeDefaults(): string {
  return QUESTIONS.map((q) => findOption(q.key, DEFAULT_ANSWERS[q.key])?.title.toLocaleLowerCase('tr-TR')).join(', ');
}

// "Haftada 3-5 saat" / "Haftada en fazla 2 saat": plan satırı ve yükleme ekranı için.
export function weeklyLabel(id?: string | null): string | undefined {
  const title = findOption('weeklyHours', id)?.title;
  return title ? `Haftada ${title.toLocaleLowerCase('tr-TR')}` : undefined;
}

// "Dengeli tempo" -> "Dengeli": hazırlanıyor ekranında "Dengeli tempona göre…" cümlesi için.
export function tempoWord(id?: string | null): string | undefined {
  return findOption('weeklyHours', id)?.description.replace(/ tempo$/, '');
}

// Bir kimliğin seçenek nesnesini bulur (çip yazıları ve plan satırı için). Bilinmeyen kimlikte undefined.
export function findOption(key: AnswerKey, id?: string | null): QuestionOption | undefined {
  return QUESTIONS.find((q) => q.key === key)?.options.find((o) => o.id === id);
}

// Veritabanından gelen metin gerçekten geçerli bir cevap mı? (Eski kayıtlarda NULL/undefined olabilir.)
export function isAnswerId(key: AnswerKey, id?: string | null): boolean {
  return findOption(key, id) !== undefined;
}
