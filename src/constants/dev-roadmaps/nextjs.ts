import { alt, course, doc, opt, prac, t, vid, type DevRoadmap } from './types';

export const NEXTJS: DevRoadmap = {
  id: 'nextjs',
  kind: 'skill',
  title: 'Next.js',
  tagline: 'React ile hızlı, SEO dostu tam yığın web uygulamaları kur.',
  emoji: '⚛️',
  hue: 'sky',
  sections: [
    {
      id: 'prereq',
      title: 'Ön koşullar',
      emoji: '🌱',
      topics: [
        t('js-ts', 'Modern JavaScript ve TypeScript', 'async/await, modüller, destructuring ve tipler; Next.js projeleri genelde TypeScript’tir.', 1, 10, [doc('MDN: JavaScript Guide'), doc('TypeScript Handbook')]),
        t('react-basics', 'React temelleri', 'Bileşenler, props, state ve olaylar; Next.js’in üzerine kurulduğu temeldir.', 1, 12, [doc('React Docs: Learn React'), course('freeCodeCamp: React')]),
        t('react-hooks', 'React hook’ları', 'useEffect, useRef, useMemo ve özel hook’lar; sunucu/istemci farkını anlamadan önce şart.', 2, 6, [doc('React Docs: Hooks'), vid('React Hooks (Web Dev Simplified, YouTube)')]),
        t('node-npm', 'Node.js ve npm', 'Paket kurma, scriptler ve .env dosyaları ile Next.js geliştirme ortamı.', 1, 2, [doc('Node.js Docs: Learn'), doc('npm Docs')]),
      ],
    },
    {
      id: 'app-router',
      title: 'App Router',
      emoji: '🧭',
      topics: [
        t('create-app', 'Proje oluşturma', 'create-next-app ile başla; klasör yapısı, geliştirme sunucusu ve derleme komutları.', 1, 1, [doc('Next.js Docs: Installation'), course('Next.js Learn (Resmi Kurs)')]),
        t('routing', 'Dosya tabanlı yönlendirme', 'app klasöründeki klasörler URL olur; page.tsx ve iç içe rotalar.', 1, 3, [doc('Next.js Docs: Routing'), course('Next.js Learn (Resmi Kurs)')]),
        t('layouts', 'Sayfalar ve düzenler', 'layout.tsx ile ortak üst bar/alt bilgi; sayfa değişince düzen korunur.', 1, 2, [doc('Next.js Docs: Layouts and Pages')]),
        t('navigation', 'Link ve gezinme', 'Link bileşeni, useRouter ve ön yükleme; sayfalar arası hızlı geçiş.', 1, 2, [doc('Next.js Docs: Linking and Navigating')]),
        t('special-files', 'loading, error ve not-found', 'Yüklenme ekranı, hata sınırı ve 404 sayfalarını dosya adıyla tanımlama.', 2, 2, [doc('Next.js Docs: Error Handling'), doc('Next.js Docs: Loading UI')]),
        alt('pages-router', 'Pages Router (eski yöntem)', 'Eski projelerde karşına çıkar; yeni projede App Router önerilir ama farkı bilmek faydalı.', 2, 3, [doc('Next.js Docs: Pages Router')]),
      ],
    },
    {
      id: 'components',
      title: 'Sunucu ve istemci bileşenleri',
      emoji: '🧩',
      topics: [
        t('server-components', 'Server Components', 'Varsayılan bileşenler sunucuda çalışır; tarayıcıya daha az JavaScript gider.', 2, 4, [doc('Next.js Docs: Server Components'), doc('React Docs: Server Components')]),
        t('client-components', 'Client Components', '"use client" ile etkileşim, state ve tarayıcı API’leri; sınırı ne zaman çizmeli?', 2, 3, [doc('Next.js Docs: Client Components')]),
        t('composition', 'Bileşen kompozisyonu', 'Sunucu ve istemci bileşenlerini iç içe kullanma kalıpları; çocuk olarak geçirme.', 3, 2, [doc('Next.js Docs: Composition Patterns')]),
      ],
    },
    {
      id: 'styling',
      title: 'Stil ve arayüz',
      emoji: '🎨',
      topics: [
        t('tailwind', 'Tailwind CSS', 'Utility sınıflarla hızlı arayüz; create-next-app ile hazır gelir.', 1, 4, [doc('Tailwind CSS Docs'), doc('Next.js Docs: Tailwind CSS')]),
        t('css-modules', 'CSS Modules ve global stil', 'Bileşen kapsamlı CSS ile çakışmasız stil; global dosya ne zaman gerekir?', 1, 2, [doc('Next.js Docs: CSS')]),
        t('fonts-images', 'Görsel ve font optimizasyonu', 'next/image ve next/font ile otomatik boyutlandırma ve yerleşim kaymasını önleme.', 2, 2, [doc('Next.js Docs: Image Optimization'), doc('Next.js Docs: Font Optimization')]),
        opt('ui-libs', 'Bileşen kütüphaneleri', 'shadcn/ui gibi hazır bileşenlerle erişilebilir arayüzü hızlandırma.', 2, 3, [doc('shadcn/ui Docs')]),
      ],
    },
    {
      id: 'data',
      title: 'Veri ve önbellek',
      emoji: '🔁',
      topics: [
        t('data-fetching', 'Veri çekme', 'Sunucu bileşeninde async/await ile fetch; veriyi sayfa render edilmeden almak.', 2, 4, [doc('Next.js Docs: Data Fetching'), course('Next.js Learn (Resmi Kurs)')]),
        t('caching', 'Önbellek ve yeniden doğrulama', 'Verinin ne zaman önbelleğe alınıp ne zaman tazeleneceği; revalidate ve etiketler.', 3, 5, [doc('Next.js Docs: Caching'), doc('Next.js Docs: Revalidating')]),
        t('rendering', 'Statik ve dinamik render', 'Sayfanın derlemede mi isteğe göre mi üretileceği; streaming ve Suspense.', 3, 4, [doc('Next.js Docs: Rendering'), doc('React Docs: Suspense')]),
        t('server-actions', 'Server Actions', 'Form gönderimini doğrudan sunucu fonksiyonuna bağlama; ayrı API yazmadan veri değiştirme.', 3, 4, [doc('Next.js Docs: Server Actions and Mutations'), course('Next.js Learn (Resmi Kurs)')]),
        t('route-handlers', 'Route Handlers (API uçları)', 'route.ts ile GET/POST uçları; webhook ve dış istemciler için gerekir.', 2, 3, [doc('Next.js Docs: Route Handlers')]),
      ],
    },
    {
      id: 'dynamic-routes',
      title: 'Dinamik rotalar ve ara katman',
      emoji: '🔗',
      topics: [
        t('dynamic-routes', 'Dinamik rotalar', '[id] klasörleri, params ve searchParams; blog yazısı ya da ürün sayfası yapmak.', 2, 3, [doc('Next.js Docs: Dynamic Routes')]),
        t('route-groups', 'Rota grupları ve paralel rotalar', '(grup) klasörleriyle URL’yi etkilemeden düzeni ayırma; ileri yönlendirme kalıpları.', 3, 3, [doc('Next.js Docs: Route Groups'), doc('Next.js Docs: Parallel Routes')]),
        t('middleware', 'Middleware', 'İstek sayfaya ulaşmadan önce yönlendirme ya da yetki kontrolü yapma.', 3, 2, [doc('Next.js Docs: Middleware')]),
      ],
    },
    {
      id: 'backend',
      title: 'Kimlik doğrulama ve veritabanı',
      emoji: '🗄️',
      topics: [
        t('auth', 'Kimlik doğrulama', 'Giriş, oturum ve korumalı sayfalar; Auth.js, Clerk veya Supabase Auth seçenekleri.', 3, 8, [doc('Next.js Docs: Authentication'), doc('Auth.js Docs')]),
        t('database', 'Veritabanı bağlantısı', 'PostgreSQL ile Prisma ya da Drizzle ORM kullanarak sunucu bileşeninden veri okuma/yazma.', 3, 8, [doc('Prisma Docs: Next.js'), doc('Drizzle ORM Docs')]),
        t('validation', 'Doğrulama ve güvenlik', 'Zod ile form doğrulama; sunucu tarafında yetki kontrolü ve gizli anahtarların korunması.', 3, 3, [doc('Zod Docs'), doc('Next.js Docs: Data Security')]),
        alt('supabase', 'Supabase ile hazır arka uç', 'Kendi sunucunu yönetmeden veritabanı ve giriş sistemi; hızlı prototip için ideal.', 3, 6, [doc('Supabase Docs: Next.js Quickstart')]),
      ],
    },
    {
      id: 'ship',
      title: 'SEO, performans ve yayın',
      emoji: '🚢',
      topics: [
        t('metadata', 'SEO ve metadata', 'title, description, Open Graph ve sitemap; arama motorları ve paylaşım önizlemeleri.', 2, 3, [doc('Next.js Docs: Metadata'), doc('Google Search Central: SEO Starter Guide')]),
        t('performance', 'Performans', 'Core Web Vitals, dinamik import, bundle analizi ve Lighthouse ile ölçüm.', 3, 4, [doc('web.dev: Core Web Vitals'), doc('Next.js Docs: Optimizing')]),
        t('testing', 'Test', 'Jest veya Vitest ile birim, Playwright ile uçtan uca test yazma.', 3, 5, [doc('Next.js Docs: Testing'), doc('Playwright Docs')]),
        t('deploy', 'Dağıtım', 'Vercel ile tek tıkla yayın; ortam değişkenleri, önizleme ve Docker/VPS alternatifleri.', 2, 3, [doc('Vercel Docs'), doc('Next.js Docs: Deploying')]),
      ],
    },
    {
      id: 'project',
      title: 'Proje / kariyer',
      emoji: '🏆',
      topics: [
        t('fullstack-project', 'Tam yığın portfolyo projesi', 'Giriş, veritabanı ve Server Actions içeren bir uygulama (ör. not/görev paneli) yayınla.', 3, 25, [course('Next.js Learn: Dashboard App')]),
        opt('blog-mdx', 'MDX ile blog', 'Markdown içerikten statik blog üret; SEO ve statik render alıştırması.', 2, 8, [doc('Next.js Docs: MDX')]),
        opt('interview', 'Görüşme hazırlığı', 'React/Next.js sorularını (render modları, önbellek, Server Components) çalış.', 3, 6, [doc('React Docs: Thinking in React'), prac('Frontend Mentor')]),
      ],
    },
  ],
};
