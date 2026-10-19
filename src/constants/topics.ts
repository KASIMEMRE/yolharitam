// Konu ağacı (kategori › alt kategori › konu).
// Her konunun altında "children" olabilir; alt konusu olmayan konuya "yaprak" denir.
// Kullanıcı en sonda bir yaprak seçer. Örnek yol: tech/ai/llm
//
// Yeni bir kategori eklemek için sadece bu listeye yeni bir dal eklemen yeterli;
// ekran kodu hiç değişmez. Kural: aynı seviyedeki kardeş konuların id'leri farklı olmalı.

export type Topic = {
  id: string;
  title: string;
  description?: string;
  children?: Topic[]; // Yoksa bu bir yaprak, yani son seviye
};

export const TOPICS: Topic[] = [
  {
    id: 'tech',
    title: 'Teknoloji',
    description: 'Yazılım, veri, yapay zeka',
    children: [
      {
        id: 'ai',
        title: 'Yapay Zeka',
        description: 'Modeller, uygulamalar, otomasyon',
        children: [
          { id: 'llm', title: 'LLM & Prompt', description: 'Büyük dil modelleriyle çalışmak' },
          { id: 'rag', title: 'RAG', description: 'Belgelerle konuşan asistanlar' },
          { id: 'agents', title: 'AI Agent', description: 'İş yapan, araç kullanan AI' },
          { id: 'ml', title: 'Makine Öğrenmesi', description: 'Model eğitimi ve temeller' },
          { id: 'cv', title: 'Bilgisayarlı Görü', description: 'Görüntü tanıma ve işleme' },
        ],
      },
      {
        id: 'mobile',
        title: 'Mobil Geliştirme',
        description: 'iOS ve Android uygulamaları',
        children: [
          { id: 'react-native', title: 'React Native & Expo', description: 'Tek kodla iki platform' },
          { id: 'flutter', title: 'Flutter', description: "Google'ın mobil çatısı" },
          { id: 'ios', title: 'iOS (Swift)', description: 'Apple platformları' },
          { id: 'android', title: 'Android (Kotlin)', description: 'Google platformu' },
        ],
      },
      {
        id: 'web',
        title: 'Web Geliştirme',
        description: 'Siteler ve web uygulamaları',
        children: [
          { id: 'frontend', title: 'Frontend', description: 'React, Next.js, arayüz' },
          { id: 'backend', title: 'Backend', description: 'API, sunucu, Node.js' },
          { id: 'fullstack', title: 'Full Stack', description: 'Uçtan uca web' },
        ],
      },
      {
        id: 'data',
        title: 'Veri & Veritabanı',
        description: 'SQL, analiz, veri modelleme',
        children: [
          { id: 'sql', title: 'SQL & Veritabanları', description: 'PostgreSQL, modelleme' },
          { id: 'analytics', title: 'Veri Analizi', description: 'Python, Pandas, görselleştirme' },
          { id: 'data-eng', title: 'Veri Mühendisliği', description: 'Veri akışları ve altyapı' },
        ],
      },
      {
        id: 'security',
        title: 'Siber Güvenlik',
        description: 'Sistemleri korumak',
        children: [
          { id: 'network-sec', title: 'Ağ Güvenliği', description: 'Ağlar, firewall, izleme' },
          { id: 'web-sec', title: 'Web Uygulama Güvenliği', description: 'OWASP, güvenli kodlama' },
          { id: 'blue-team', title: 'Savunma (Blue Team)', description: 'Tespit, olay müdahalesi' },
        ],
      },
      {
        id: 'cloud',
        title: 'Bulut & DevOps',
        description: 'Altyapı ve dağıtım',
        children: [
          { id: 'aws', title: 'Bulut Platformları', description: 'AWS, GCP, Azure' },
          { id: 'containers', title: 'Docker & Kubernetes', description: 'Konteyner dünyası' },
          { id: 'cicd', title: 'CI/CD', description: 'Otomatik test ve yayın' },
        ],
      },
      {
        id: 'gamedev',
        title: 'Oyun Geliştirme',
        description: 'Oyun motorları ve tasarım',
        children: [
          { id: 'unity', title: 'Unity', description: 'C# ile oyun geliştirme' },
          { id: 'unreal', title: 'Unreal Engine', description: 'Yüksek grafikli oyunlar' },
          { id: 'game-design', title: 'Oyun Tasarımı', description: 'Mekanik, seviye, hikâye' },
        ],
      },
    ],
  },
  {
    id: 'business',
    title: 'İş & Girişimcilik',
    description: 'Şirket kurmak, büyütmek, yönetmek',
    children: [
      {
        id: 'entrepreneurship',
        title: 'Girişimcilik',
        description: 'Fikirden şirkete',
        children: [
          { id: 'startup', title: 'Startup Kurmak', description: 'Fikir doğrulama, MVP' },
          { id: 'business-model', title: 'İş Modeli', description: 'Gelir modeli, fiyatlama' },
          { id: 'fundraising', title: 'Yatırım Alma', description: 'Pitch, yatırımcı ilişkileri' },
        ],
      },
      {
        id: 'marketing',
        title: 'Pazarlama',
        description: 'Müşteriye ulaşmak',
        children: [
          { id: 'digital-marketing', title: 'Dijital Pazarlama', description: 'Reklam, kampanya, ölçüm' },
          { id: 'social-media', title: 'Sosyal Medya', description: 'İçerik ve topluluk' },
          { id: 'seo', title: 'SEO & İçerik', description: 'Arama motorlarında görünmek' },
        ],
      },
      {
        id: 'management',
        title: 'Yönetim',
        description: 'Ekip ve ürün yönetimi',
        children: [
          { id: 'leadership', title: 'Liderlik', description: 'Ekip kurmak ve yönetmek' },
          { id: 'product-management', title: 'Ürün Yönetimi', description: 'Kullanıcı, yol haritası, öncelik' },
          { id: 'project-management', title: 'Proje Yönetimi', description: 'Agile, Scrum, planlama' },
        ],
      },
    ],
  },
  {
    id: 'finance',
    title: 'Finans & Ekonomi',
    description: 'Para, piyasalar, ekonomi',
    children: [
      {
        id: 'personal-finance',
        title: 'Kişisel Finans',
        description: 'Kendi paranı yönetmek',
        children: [
          { id: 'budgeting', title: 'Bütçe Yönetimi', description: 'Gelir-gider, birikim' },
          { id: 'investing-basics', title: 'Yatırıma Giriş', description: 'Temel kavramlar ve riskler' },
        ],
      },
      {
        id: 'economics',
        title: 'Ekonomi',
        description: 'Piyasaların işleyişi',
        children: [
          { id: 'macro', title: 'Makroekonomi', description: 'Enflasyon, faiz, büyüme' },
          { id: 'behavioral', title: 'Davranışsal Ekonomi', description: 'İnsanlar nasıl karar verir' },
        ],
      },
      {
        id: 'fintech',
        title: 'Fintech',
        description: 'Finans + teknoloji',
        children: [
          { id: 'blockchain', title: 'Blockchain Teknolojisi', description: 'Dağıtık defter, akıllı kontrat' },
          { id: 'payments', title: 'Ödeme Sistemleri', description: 'Dijital ödeme altyapıları' },
        ],
      },
    ],
  },
  {
    id: 'science',
    title: 'Bilim',
    description: 'Evreni ve yaşamı anlamak',
    children: [
      {
        id: 'math',
        title: 'Matematik',
        description: 'Düşünmenin dili',
        children: [
          { id: 'statistics', title: 'İstatistik', description: 'Veriden sonuç çıkarmak' },
          { id: 'linear-algebra', title: 'Lineer Cebir', description: "AI'ın matematiği" },
          { id: 'calculus', title: 'Kalkülüs', description: 'Türev, integral, değişim' },
        ],
      },
      {
        id: 'physics',
        title: 'Fizik',
        description: 'Madde, enerji, evren',
        children: [
          { id: 'quantum', title: 'Kuantum Fiziği', description: 'Atom altı dünya' },
          { id: 'astrophysics', title: 'Astrofizik', description: 'Yıldızlar, galaksiler, uzay' },
        ],
      },
      {
        id: 'biology',
        title: 'Biyoloji',
        description: 'Yaşamın bilimi',
        children: [
          { id: 'genetics', title: 'Genetik', description: 'DNA ve kalıtım' },
          { id: 'neuroscience', title: 'Nörobilim', description: 'Beyin nasıl çalışır' },
        ],
      },
    ],
  },
  {
    id: 'design',
    title: 'Tasarım & Sanat',
    description: 'Görsel ve yaratıcı beceriler',
    children: [
      {
        id: 'uiux',
        title: 'UI/UX Tasarım',
        description: 'Ürün ve arayüz tasarımı',
        children: [
          { id: 'ui', title: 'Arayüz Tasarımı (UI)', description: 'Figma, görsel tasarım' },
          { id: 'ux', title: 'Kullanıcı Deneyimi (UX)', description: 'Araştırma, akış, test' },
        ],
      },
      {
        id: 'graphic',
        title: 'Grafik Tasarım',
        description: 'Görsel iletişim',
        children: [
          { id: 'branding', title: 'Marka & Logo', description: 'Kimlik tasarımı' },
          { id: 'illustration', title: 'İllüstrasyon', description: 'Dijital çizim' },
        ],
      },
      {
        id: 'media',
        title: 'Video & Fotoğraf',
        description: 'Görsel içerik üretimi',
        children: [
          { id: 'video-editing', title: 'Video Kurgu', description: 'Montaj ve anlatım' },
          { id: 'photography', title: 'Fotoğrafçılık', description: 'Kompozisyon, ışık' },
          { id: 'motion', title: 'Motion Tasarım', description: 'Hareketli grafik' },
        ],
      },
    ],
  },
  {
    id: 'languages',
    title: 'Dil Öğrenme',
    description: 'Yeni bir dil konuşmak',
    children: [
      {
        id: 'english',
        title: 'İngilizce',
        description: 'Dünyanın ortak dili',
        children: [
          { id: 'english-general', title: 'Genel İngilizce', description: 'Günlük konuşma ve dilbilgisi' },
          { id: 'english-tech', title: 'Teknik İngilizce', description: 'Yazılım ve iş dünyası için' },
          { id: 'english-exam', title: 'IELTS & TOEFL', description: 'Sınav hazırlığı' },
        ],
      },
      {
        id: 'german',
        title: 'Almanca',
        description: "Avrupa'nın en çok konuşulan dili",
        children: [
          { id: 'german-daily', title: 'Günlük Almanca', description: 'Temel iletişim' },
          { id: 'german-work', title: 'İş Almancası', description: 'Çalışma hayatı için' },
        ],
      },
      {
        id: 'spanish',
        title: 'İspanyolca',
        description: '500 milyondan fazla konuşanı var',
        children: [
          { id: 'spanish-daily', title: 'Günlük İspanyolca', description: 'Temel iletişim' },
          { id: 'spanish-travel', title: 'Seyahat İspanyolcası', description: 'Yolculuk için pratik dil' },
        ],
      },
    ],
  },
  {
    id: 'sports',
    title: 'Spor',
    description: 'Oyunu anlamak ve antrenman',
    children: [
      {
        id: 'football',
        title: 'Futbol',
        description: 'Dünyanın en popüler sporu',
        children: [
          { id: 'football-tactics', title: 'Taktik & Analiz', description: 'Dizilişler, oyun okuma' },
          { id: 'football-coaching', title: 'Antrenörlük', description: 'Antrenman planlama, takım yönetimi' },
          { id: 'football-data', title: 'Futbol Veri Analitiği', description: 'İstatistik ve maç verisi' },
        ],
      },
      {
        id: 'basketball',
        title: 'Basketbol',
        description: 'Hız ve strateji',
        children: [
          { id: 'basketball-tactics', title: 'Taktik & Analiz', description: 'Hücum ve savunma sistemleri' },
          { id: 'basketball-data', title: 'Basketbol Veri Analitiği', description: 'İleri istatistikler' },
        ],
      },
      {
        id: 'fitness',
        title: 'Fitness & Antrenman',
        description: 'Güçlü ve sağlıklı bir vücut',
        children: [
          { id: 'strength', title: 'Kuvvet Antrenmanı', description: 'Temel hareketler, program' },
          { id: 'running', title: 'Koşu', description: 'Başlangıçtan maratona' },
          { id: 'mobility', title: 'Mobilite & Esneklik', description: 'Hareket kabiliyeti' },
        ],
      },
    ],
  },
  {
    id: 'personal',
    title: 'Kişisel Gelişim',
    description: 'Kendini ve kariyerini geliştirmek',
    children: [
      {
        id: 'productivity',
        title: 'Verimlilik',
        description: 'Daha az çaba, daha çok iş',
        children: [
          { id: 'time-management', title: 'Zaman Yönetimi', description: 'Planlama ve önceliklendirme' },
          { id: 'focus', title: 'Odaklanma', description: 'Derin çalışma alışkanlıkları' },
        ],
      },
      {
        id: 'communication',
        title: 'İletişim',
        description: 'Kendini doğru ifade etmek',
        children: [
          { id: 'public-speaking', title: 'Topluluk Önünde Konuşma', description: 'Sunum ve hitabet' },
          { id: 'writing', title: 'Etkili Yazma', description: 'Net ve ikna edici yazı' },
        ],
      },
      {
        id: 'career',
        title: 'Kariyer',
        description: 'İş hayatında ilerlemek',
        children: [
          { id: 'cv-interview', title: 'CV & Mülakat', description: 'İşe başvuru hazırlığı' },
          { id: 'freelance', title: 'Freelance Çalışma', description: 'Kendi işinin patronu olmak' },
        ],
      },
    ],
  },
];

// Bir id yolunu (['tech', 'ai', 'llm']) konu nesnelerine çevirir.
// Ağaçta adım adım aşağı iner; yol hatalıysa bulabildiği kadarını döner.
export function getTopicChain(path: string[]): Topic[] {
  const chain: Topic[] = [];
  let level: Topic[] | undefined = TOPICS;
  for (const id of path) {
    const found: Topic | undefined = level?.find((t) => t.id === id);
    if (!found) break;
    chain.push(found);
    level = found.children;
  }
  return chain;
}
