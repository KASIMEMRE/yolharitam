import { alt, book, course, doc, opt, prac, t, type DevRoadmap } from './types';

// Full stack haritası ön yüz ve arka yüzün ÖZÜDÜR: her iki tarafı derinlemesine değil,
// tek başına uçtan uca ürün çıkaracak kadar öğretir. Derinleşmek isteyen Frontend/Backend haritasına geçer.
export const FULLSTACK: DevRoadmap = {
  id: 'fullstack',
  kind: 'role',
  title: 'Full Stack Geliştirici',
  tagline: 'Arayüzden veritabanına bir ürünü tek başına uçtan uca çıkar.',
  emoji: '🧱',
  hue: 'accent',
  sections: [
    {
      id: 'web-basics',
      title: 'Web temelleri',
      emoji: '🌐',
      topics: [
        t('how-web', 'Web nasıl çalışır?', 'İstemci, sunucu, HTTP, DNS: bir sayfanın ekrana gelme yolculuğu.', 1, 3, [doc('MDN Web Docs: How the web works')]),
        t('html', 'HTML', 'Anlamsal etiketler, formlar ve erişilebilir yapı.', 1, 5, [doc('MDN Web Docs: HTML'), course('freeCodeCamp: Responsive Web Design')]),
        t('css', 'CSS ve duyarlı tasarım', 'Kutu modeli, Flexbox, Grid ve mobil öncelikli yerleşim.', 1, 8, [course('The Odin Project: Foundations'), prac('Flexbox Froggy')]),
        t('git', 'Git ve GitHub', 'Projelerini sürümle, GitHub’a koy, Pull Request aç.', 1, 4, [doc('Pro Git (kitap, ücretsiz)')]),
      ],
    },
    {
      id: 'javascript',
      title: 'JavaScript ve TypeScript',
      emoji: '⚡',
      topics: [
        t('js', 'JavaScript temelleri', 'Değişkenler, fonksiyonlar, diziler, nesneler, DOM.', 1, 10, [doc('javascript.info')]),
        t('async', 'Asenkron JavaScript ve Fetch', 'Promise, async/await ve API’den veri çekme.', 2, 5, [doc('javascript.info: Promises, async/await')]),
        t('ts', 'TypeScript', 'Ön yüzde ve arka yüzde aynı tiplerle güvenli kod.', 2, 6, [doc('TypeScript Handbook')]),
      ],
    },
    {
      id: 'frontend',
      title: 'Ön yüz (frontend)',
      emoji: '🎨',
      topics: [
        t('react', 'React', 'Bileşenler, state, hook’lar ve form yönetimi.', 2, 15, [doc('react.dev (resmi doküman)')]),
        alt('vue', 'Vue', 'React yerine seçilebilecek, öğrenmesi kolay bir alternatif.', 2, 12, [doc('vuejs.org (resmi doküman)')]),
        t('tailwind', 'Tailwind CSS', 'Hızlı ve tutarlı arayüz için yardımcı sınıflar.', 2, 3, [doc('Tailwind CSS Docs')]),
        opt('state', 'Durum ve sunucu verisi', 'Zustand ve TanStack Query ile veri yönetimi.', 3, 4, [doc('TanStack Query Docs')]),
      ],
    },
    {
      id: 'backend',
      title: 'Arka yüz (backend)',
      emoji: '⚙️',
      topics: [
        t('node', 'Node.js', 'Sunucu tarafında JavaScript: modüller, dosya sistemi, npm.', 1, 6, [doc('Node.js Learn')]),
        t('express', 'REST API (Express ya da Hono)', 'Rotalar, ara katmanlar (middleware), doğrulama ve hata yönetimi.', 2, 8, [doc('Express Docs'), doc('Hono Docs')]),
        t('auth', 'Kimlik doğrulama', 'Oturum/JWT, parola özetleme ve hazır çözümler (Auth.js, Supabase Auth).', 2, 5, [doc('OWASP Authentication Cheat Sheet'), doc('Supabase Auth Docs')]),
        opt('graphql', 'GraphQL', 'Tek uçtan esnek sorgular; bazı ekiplerde REST yerine kullanılır.', 3, 5, [doc('graphql.org/learn')]),
      ],
    },
    {
      id: 'database',
      title: 'Veritabanı',
      emoji: '🗄️',
      topics: [
        t('sql', 'SQL ve PostgreSQL', 'Tablo tasarımı, ilişkiler, JOIN, indeks.', 1, 8, [prac('SQLBolt'), doc('PostgreSQL Tutorial')]),
        t('orm', 'ORM: Prisma ya da Drizzle', 'Şemayı kodla yönet, tip güvenli sorgular yaz.', 2, 4, [doc('Prisma Docs'), doc('Drizzle ORM Docs')]),
        alt('mongodb', 'MongoDB', 'Belge tabanlı alternatif; şeması sık değişen projelerde.', 2, 5, [course('MongoDB University')]),
        opt('baas', 'Hazır arka uç: Supabase / Firebase', 'Veritabanı, kimlik doğrulama ve depolamayı hazır hizmet olarak kullan.', 2, 4, [doc('Supabase Docs'), doc('Firebase Docs')]),
      ],
    },
    {
      id: 'fullstack-framework',
      title: 'Tam yığın framework',
      emoji: '🧩',
      topics: [
        t('nextjs', 'Next.js', 'Sunucu bileşenleri, API rotaları ve veri çekme tek projede.', 3, 12, [doc('Next.js Learn (resmi kurs)')]),
        alt('remix', 'React Router (framework modu)', 'Web standartlarına yakın, form ve veri yükleme odaklı alternatif.', 3, 10, [doc('React Router Docs')]),
        alt('nuxt', 'Nuxt', 'Vue seçtiysen Next.js’in karşılığı.', 3, 10, [doc('Nuxt Docs')]),
      ],
    },
    {
      id: 'ship',
      title: 'Test, yayın ve işletme',
      emoji: '🚢',
      topics: [
        t('testing', 'Test', 'Birim testleri (Vitest) ve kritik akışlar için uçtan uca testler (Playwright).', 3, 5, [doc('Vitest Docs'), doc('Playwright Docs')]),
        t('deploy', 'Yayına alma', 'Vercel/Render ile yayın, ortam değişkenleri ve alan adı bağlama.', 2, 3, [doc('Vercel Docs')]),
        t('ci', 'CI/CD', 'GitHub Actions ile her push’ta test ve yayın.', 2, 3, [doc('GitHub Actions Docs')]),
        opt('docker', 'Docker', 'Uygulamayı konteynerle her ortamda aynı çalıştır.', 3, 5, [doc('Docker Docs: Get started')]),
        opt('security', 'Güvenlik temelleri', 'OWASP Top 10, CORS, gizli anahtarların yönetimi.', 3, 3, [doc('OWASP Top 10')]),
      ],
    },
    {
      id: 'career',
      title: 'Projeler ve kariyer',
      emoji: '🚀',
      topics: [
        t('project-crud', 'Proje: Tam CRUD uygulaması', 'Kimlik doğrulamalı, veritabanlı bir görev ya da not uygulaması.', 2, 20, []),
        t('project-saas', 'Proje: Küçük bir SaaS', 'Kullanıcı hesapları, ödeme (test modu), yönetim paneli ve canlı yayın.', 3, 30, [prac('Frontend Mentor (arayüz için)')]),
        opt('interview', 'Mülakat hazırlığı', 'Projeni uçtan uca anlatmak, sistem tasarımı ve canlı kodlama.', 3, 10, [book('System Design Primer (GitHub)')]),
      ],
    },
  ],
};
