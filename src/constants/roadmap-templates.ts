// Yol haritası adımlarını SORULARA GÖRE üreten şablon (Y-04).
//
// Bu dosya bilerek SAF tutuldu: supabase, react-native, expo ya da `@/` içe aktarması YOK.
// Neden? (1) Aynı girdi her zaman aynı çıktıyı verir, ekransız `node` ile kolayca denenebilir.
// (2) Y-06'da yapay zekâ üreticisi geldiğinde ekran kodu değişmez: `generateRoadmapSteps` aynı imzayla
// kalır, içi "önce yapay zekâ, olmazsa bu şablon" olur.
//
// Kurallar if/else yığını olarak DEĞİL, aşağıdaki VERİ TABLOLARINDA durur. Bir kuralı değiştirmek
// için fonksiyon okumak yerine tabloya bakmak yeterli (örn. çarpanlar HOURS_RULES'ta).
//
// DİL KURALI: Konu başlığına ASLA ek getirilmez. Türkçede ek ünlü uyumuna bağlıdır ("LLM & Prompt'a",
// "SQL & Veritabanları'nı" gibi ekleri doğru kuramayız). Bu yüzden başlıklar yalnız
// `{konu}: …`, `{konu} için …` ya da `{konu} ile …` kalıplarını kullanır.

export type WeeklyHoursId = '1-2' | '3-5' | '6-10' | '10+';
export type GoalId = 'job' | 'project' | 'exam' | 'curiosity';
export type LearningStyleId = 'video' | 'reading' | 'practice' | 'mixed';
export type Phase = 'foundation' | 'practice' | 'goal';
export type ResourceType = 'video' | 'reading' | 'practice';
export type LevelId = 'beginner' | 'intermediate' | 'advanced';

// Üreticinin girdisi. `topicTitle` DIŞARIDAN gelir (konu ağacını bu dosya bilmez).
export type RoadmapInput = {
  topicPath: string;
  topicTitle: string;
  level: LevelId;
  weeklyHours: WeeklyHoursId;
  goal: GoalId;
  learningStyle: LearningStyleId;
};

// Üreticinin çıktısı: sıralı adımlar. position 1..N.
export type GeneratedStep = {
  position: number;
  title: string;
  description: string;
  estimatedHours: number;
  phase: Phase;
  resourceType: ResourceType;
};

// Veritabanında `level` serbest metin; bilinmeyen değer gelirse üreticiyi bozmayalım.
// Nötr olan "orta" seçilir (başlangıç seçsek kullanıcıya gereksiz temel adımlar yazardık).
export function toLevelId(value: string): LevelId {
  return value === 'beginner' || value === 'advanced' ? value : 'intermediate';
}

// --- KURAL 5: haftalık süre ---------------------------------------------------------------
// weekly = hesapta kullanılan haftalık saat, multiplier = adım büyüklüğü çarpanı.
// Az vakti olan daha yalın (küçük) adımlar alır, çok vakti olan daha derin adımlar alır.
export const HOURS_RULES: Record<WeeklyHoursId, { weekly: number; multiplier: number }> = {
  '1-2': { weekly: 2, multiplier: 0.75 },
  '3-5': { weekly: 4, multiplier: 1 },
  '6-10': { weekly: 8, multiplier: 1.25 },
  '10+': { weekly: 12, multiplier: 1.5 },
};

// --- KURAL 4: kaynak türüne göre tek cümlelik öneri (marka ya da link YOK, yalnız tür) ------
const RESOURCE_HINT: Record<ResourceType, string> = {
  video: 'Önerilen kaynak: kısa bir video ders serisi; izlerken sen de dene.',
  reading: 'Önerilen kaynak: resmi dokümantasyon ya da güncel bir rehber.',
  practice: 'Önerilen yöntem: yaparak öğren ve sonunda küçük bir çıktı ortaya koy.',
};

// "Karışık" tarzda Temeller ve Pratik adımları bu sırayla döner.
const MIXED_CYCLE: ResourceType[] = ['video', 'reading', 'practice'];

// --- KURAL 2 ve 3: adım kataloğu -----------------------------------------------------------
// title bir FONKSİYON: konu başlığını alır. baseHours = çarpan uygulanmadan önceki saat.
// resourceOverride: bu adımın kaynak türü tarzdan bağımsız sabit (örn. sınavda "çıkmış sorular").
// Override'ı sıra numarasına değil KAYDA koyduk: İleri seviyede ilk adım atlanınca sıralar kayar,
// numaraya bağlı olsaydı yanlış adım "okuma" olurdu.
type StepTemplate = {
  title: (topic: string) => string;
  description: string;
  baseHours: number;
  resourceOverride?: ResourceType;
};

const FOUNDATION: Record<LevelId, StepTemplate[]> = {
  beginner: [
    {
      title: (t) => `${t}: büyük resim`,
      description: 'Konunun ne işe yaradığını, temel kavramlarını ve kullanıldığı yerleri öğren.',
      baseHours: 3,
    },
    {
      title: (t) => `${t} için gerekli araçları hazırla`,
      description: 'Ortamı kur ve ilk denemeni çalıştır; takıldığın yerleri not al.',
      baseHours: 3,
    },
    {
      title: (t) => `${t}: temel yapı taşları`,
      description: 'En sık kullanılan temel kavramları tek tek öğren, her biri için küçük bir örnek yap.',
      baseHours: 3,
    },
  ],
  intermediate: [
    {
      title: (t) => `${t}: temelleri gözden geçir`,
      description:
        'Bildiklerini hızlıca sına ve eksik kalan kavramları listele; sonraki adımlar bu listeye dayanır.',
      baseHours: 3,
    },
  ],
  advanced: [
    {
      title: (t) => `${t}: uzmanlık haritanı çıkar`,
      description: 'Neyi iyi, neyi yarım bildiğini yaz ve derinleşeceğin alanları seç.',
      baseHours: 3,
    },
  ],
};

const PRACTICE_EXERCISES: StepTemplate = {
  title: (t) => `${t}: küçük alıştırmalar`,
  description: 'Öğrendiklerini kısa, tek amaçlı alıştırmalarla pekiştir.',
  baseHours: 4,
};
const PRACTICE_REAL_EXAMPLES: StepTemplate = {
  title: (t) => `${t}: gerçek örnekleri incele`,
  description: 'Gerçek bir örneği incele ve sıfırdan kendin yeniden kurmayı dene.',
  baseHours: 4,
};
const PRACTICE_ADVANCED_TECHNIQUES: StepTemplate = {
  title: (t) => `${t}: ileri teknikler ve sık hatalar`,
  description: 'Sık yapılan hataları ve daha ileri yöntemleri öğren; önceki işlerini bunlarla iyileştir.',
  baseHours: 4,
};
const PRACTICE_QUALITY: StepTemplate = {
  title: (t) => `${t}: kalite ve dayanıklılık`,
  description: 'İşini ölç ve test et, zayıf yerlerini düzelt.',
  baseHours: 4,
};
const PRACTICE_HARD_PROBLEM: StepTemplate = {
  title: (t) => `${t}: zor bir problem çöz`,
  description: 'Seni zorlayan gerçek bir problemi seç ve baştan sona çöz.',
  baseHours: 4,
};

// Pratik sırası: Başlangıç = alıştırmalar, gerçek örnekler. Orta = bunlar + ileri teknikler.
// İleri = ileri teknikler, kalite, zor problem.
const PRACTICE: Record<LevelId, StepTemplate[]> = {
  beginner: [PRACTICE_EXERCISES, PRACTICE_REAL_EXAMPLES],
  intermediate: [PRACTICE_EXERCISES, PRACTICE_REAL_EXAMPLES, PRACTICE_ADVANCED_TECHNIQUES],
  advanced: [PRACTICE_ADVANCED_TECHNIQUES, PRACTICE_QUALITY, PRACTICE_HARD_PROBLEM],
};

// Hedef evresi: her hedefin 3 adımı vardır (plan 2 saat, yapım 6 saat, yayın/kapanış 3 saat).
// İleri seviyede ilk (plan) adım atlanır.
const GOAL_STEPS: Record<GoalId, StepTemplate[]> = {
  job: [
    {
      title: (t) => `${t} için portfolyo projeni planla`,
      description: 'Portfolyona girecek küçük ama gösterilebilir bir proje seç ve kapsamını yaz.',
      baseHours: 2,
    },
    {
      title: () => 'Portfolyo projeni geliştir',
      description: 'Planladığın projeyi adım adım yap; her oturumda çalışan bir parça bırak.',
      baseHours: 6,
    },
    {
      title: () => 'Projeni yayınla ve mülakata hazırlan',
      description:
        'Projeni herkese açık bir yere koy. Sık sorulan mülakat sorularını projenle ilişkilendirerek yanıtla.',
      baseHours: 3,
    },
  ],
  project: [
    {
      title: () => 'Kendi projeni planla',
      description: 'Ne yapmak istediğini tek cümleyle yaz, sonra ilk sürümde olması gerekenleri sırala.',
      baseHours: 2,
    },
    {
      title: () => 'Projeni geliştir',
      description: 'İlk sürümü küçük parçalar halinde yap; her parçayı bitirince dene.',
      baseHours: 6,
    },
    {
      title: () => 'Projeni yayınla ve geri bildirim topla',
      description: 'Projeni birkaç kişiye göster. Aldığın geri bildirimden bir sonraki adımını seç.',
      baseHours: 3,
    },
  ],
  exam: [
    {
      title: () => 'Sınav kapsamını ve takvimini çıkar',
      description: 'Sınavın konularını listele ve kalan günlere göre bir çalışma takvimi hazırla.',
      baseHours: 2,
    },
    {
      title: () => 'Çıkmış sorular ve konu tekrarı',
      description: 'Çıkmış soruları çöz; yanlış yaptığın konuları tekrar edip kısa notlar çıkar.',
      baseHours: 6,
      resourceOverride: 'reading',
    },
    {
      title: () => 'Deneme sınavı çöz ve eksikleri kapat',
      description: 'Süre tutarak bir deneme çöz, yanlışlarını incele ve eksik kalan yerleri kapat.',
      baseHours: 3,
    },
  ],
  curiosity: [
    {
      title: () => 'Merak ettiğin bir soruyu seç',
      description: 'Bu konuda cevabını bilmediğin ilginç bir soru bul ve neden merak ettiğini yaz.',
      baseHours: 2,
    },
    {
      title: () => 'Küçük bir keşif projesi yap',
      description: 'Sorunun cevabını araştırırken küçük bir deney ya da örnek yap.',
      baseHours: 6,
    },
    {
      title: () => 'Öğrendiklerini birine anlat ya da yaz',
      description: 'Keşfettiklerini bir arkadaşına anlat ya da kısa bir yazıya dök; anlatamadığın yer eksiğindir.',
      baseHours: 3,
    },
  ],
};

// Üretilecek bir adımın ham hâli (evre kaynak diziden atanır, şablon kaydından değil).
type Draft = { template: StepTemplate; phase: Phase };

// --- ÜRETİCİ (saf, senkron çekirdek) -------------------------------------------------------
// Aynı girdi -> aynı çıktı (rastgelelik yok).
export function generateTemplateSteps(input: RoadmapInput): GeneratedStep[] {
  const { topicTitle, level, weeklyHours, goal, learningStyle } = input;
  const { multiplier } = HOURS_RULES[weeklyHours];

  // KURAL 1: seviye adım sayısını belirler. İleri'de hedefin plan adımı atlanır (6 adım).
  const goalSteps = level === 'advanced' ? GOAL_STEPS[goal].slice(1) : GOAL_STEPS[goal];
  const drafts: Draft[] = [
    ...FOUNDATION[level].map((template) => ({ template, phase: 'foundation' as const })),
    ...PRACTICE[level].map((template) => ({ template, phase: 'practice' as const })),
    ...goalSteps.map((template) => ({ template, phase: 'goal' as const })),
  ];

  // "Karışık" döngüsü yalnız Temeller ve Pratik adımlarını sayar; Hedef adımları sayılmaz.
  let cycleIndex = 0;

  return drafts.map(({ template, phase }, index) => {
    let resourceType: ResourceType;
    if (phase === 'goal') {
      // Hedef adımları yapıma dönüktür: hep uygulama (tek istisna kayıttaki override).
      resourceType = template.resourceOverride ?? 'practice';
    } else if (learningStyle === 'mixed') {
      resourceType = MIXED_CYCLE[cycleIndex % MIXED_CYCLE.length];
      cycleIndex += 1;
    } else {
      resourceType = learningStyle;
    }

    return {
      position: index + 1,
      title: template.title(topicTitle),
      description: `${template.description} ${RESOURCE_HINT[resourceType]}`,
      // Math.round pozitif sayıda .5'i yukarı yuvarlar ("yarımlar yukarı" kuralı). En az 1 saat.
      estimatedHours: Math.max(1, Math.round(template.baseHours * multiplier)),
      phase,
      resourceType,
    };
  });
}

// --- ÜRETİCİNİN TEK GİRİŞ NOKTASI ----------------------------------------------------------
// Ekranlar yalnız bunu çağırır. ASENKRON: bugün şablon hemen döner ama Y-06'da buraya bir
// Edge Function çağrısı gelecek (hata verirse generateTemplateSteps'e düşülecek). İmza aynı kalır.
export async function generateRoadmapSteps(input: RoadmapInput): Promise<GeneratedStep[]> {
  const steps = generateTemplateSteps(input);
  // Çıktıyı kaydetmeden önce doğrula: bozuk bir liste veritabanına hiç ulaşmasın.
  if (!validateSteps(steps)) throw new Error('Üretilen adımlar geçersiz');
  return steps;
}

// Çıktı sözleşmesi (şablon için de, ileride yapay zekâ çıktısı için de geçerli):
// 6-8 adım, boş başlık yok, saatler >= 1 tam sayı, konumlar 1..N.
export function validateSteps(steps: GeneratedStep[]): boolean {
  if (steps.length < 6 || steps.length > 8) return false;
  const phases: Phase[] = ['foundation', 'practice', 'goal'];
  const resources: ResourceType[] = ['video', 'reading', 'practice'];
  return steps.every(
    (step, index) =>
      step.position === index + 1 &&
      step.title.trim().length > 0 &&
      step.description.trim().length > 0 &&
      Number.isInteger(step.estimatedHours) &&
      step.estimatedHours >= 1 &&
      phases.includes(step.phase) &&
      resources.includes(step.resourceType)
  );
}

// Toplam saat ve hafta adımlardan TÜRETİLİR, veritabanına yazılmaz. Böylece adımlar sonradan
// (yapay zekâ ile) değişse de özet her zaman o anki adımlarla tutarlı kalır.
export function summarizeSteps(
  steps: { estimatedHours: number }[],
  weeklyHours: WeeklyHoursId
): { count: number; totalHours: number; weeks: number } {
  const totalHours = steps.reduce((sum, step) => sum + step.estimatedHours, 0);
  const weeks = Math.max(1, Math.ceil(totalHours / HOURS_RULES[weeklyHours].weekly));
  return { count: steps.length, totalHours, weeks };
}
