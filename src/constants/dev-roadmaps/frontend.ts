import { alt, book, course, doc, opt, prac, t, type DevRoadmap } from './types';

export const FRONTEND: DevRoadmap = {
  id: 'frontend',
  kind: 'role',
  title: 'Frontend Geliştirici',
  tagline: 'Kullanıcının gördüğü ve dokunduğu web arayüzlerini kur.',
  emoji: '🎨',
  hue: 'sky',
  sections: [
    {
      id: 'internet',
      title: 'Web nasıl çalışır?',
      emoji: '🌐',
      topics: [
        t('how-web', 'İnternet ve web', 'Tarayıcıya adres yazınca neler olduğunu öğren: istemci, sunucu, istek ve cevap.', 1, 2, [doc('MDN Web Docs: How the web works')]),
        t('http', 'HTTP ve HTTPS', 'İstek yöntemleri, durum kodları, başlıklar ve HTTPS’in neden şart olduğu.', 1, 2, [doc('MDN Web Docs: HTTP')]),
        t('dns-hosting', 'Alan adı, DNS ve barındırma', 'Bir sitenin adresten sunucuya nasıl ulaştığını ve nerede yayınlandığını kavra.', 1, 2, [doc('Cloudflare Learning Center: DNS')]),
        t('browsers', 'Tarayıcılar nasıl çalışır?', 'HTML’in ayrıştırılması, DOM ağacı, stil hesaplama ve sayfanın çizilmesi.', 2, 2, [doc('web.dev: How browsers work')]),
      ],
    },
    {
      id: 'html',
      title: 'HTML',
      emoji: '🧱',
      topics: [
        t('html-basics', 'HTML temelleri', 'Etiketler, öznitelikler, başlıklar, listeler, bağlantılar ve görseller.', 1, 5, [doc('MDN Web Docs: HTML'), course('freeCodeCamp: Responsive Web Design')]),
        t('semantic', 'Anlamsal (semantic) HTML', 'header, main, article, nav gibi etiketlerle sayfayı anlamlı bölümlere ayır.', 1, 2, [doc('MDN Web Docs: Semantics')]),
        t('forms', 'Formlar ve doğrulama', 'Girdi türleri, etiketler ve tarayıcının yerleşik doğrulaması.', 1, 3, [doc('MDN Web Docs: Web forms')]),
        t('a11y', 'Erişilebilirlik (a11y)', 'Ekran okuyucular, klavyeyle gezinme, alt metin ve ARIA’nın doğru kullanımı.', 2, 4, [doc('web.dev: Learn Accessibility'), doc('WCAG 2.2 özeti (W3C)')]),
        opt('seo-basics', 'SEO temelleri', 'Başlık, meta açıklama ve anlamsal yapının arama sonuçlarına etkisi.', 2, 2, [doc('Google Search Central: SEO Starter Guide')]),
      ],
    },
    {
      id: 'css',
      title: 'CSS',
      emoji: '🖌️',
      topics: [
        t('css-basics', 'CSS temelleri', 'Seçiciler, kutu modeli, renkler, birimler ve kalıtım (cascade).', 1, 5, [doc('MDN Web Docs: CSS first steps'), course('The Odin Project: Foundations')]),
        t('flexbox', 'Flexbox', 'Öğeleri tek eksende hizala ve dağıt; en sık kullanılan yerleşim aracı.', 1, 3, [prac('Flexbox Froggy'), doc('CSS-Tricks: A Complete Guide to Flexbox')]),
        t('grid', 'CSS Grid', 'İki boyutlu sayfa yerleşimleri kur.', 2, 3, [prac('Grid Garden'), doc('MDN Web Docs: CSS grid layout')]),
        t('responsive', 'Duyarlı (responsive) tasarım', 'Mobil öncelikli düşün; medya sorguları ve esnek birimlerle her ekrana uyum sağla.', 1, 4, [doc('web.dev: Learn Responsive Design')]),
        opt('animations', 'Geçişler ve animasyonlar', 'transition, transform ve keyframes ile canlı ama ölçülü arayüzler.', 2, 2, [doc('MDN Web Docs: CSS animations')]),
      ],
    },
    {
      id: 'javascript',
      title: 'JavaScript',
      emoji: '⚡',
      topics: [
        t('js-basics', 'JavaScript temelleri', 'Değişkenler, veri tipleri, koşullar, döngüler ve fonksiyonlar.', 1, 8, [doc('javascript.info'), course('freeCodeCamp: JavaScript Algorithms and Data Structures')]),
        t('dom', 'DOM ve olaylar', 'Sayfadaki öğeleri seç, değiştir ve kullanıcı etkileşimlerine tepki ver.', 1, 5, [doc('javascript.info: Document'), prac('JavaScript30')]),
        t('async', 'Asenkron JavaScript', 'Promise, async/await ve olay döngüsü (event loop) mantığı.', 2, 5, [doc('javascript.info: Promises, async/await')]),
        t('fetch', 'Fetch ve API’ler', 'Bir REST API’den veri çek, JSON işle, hata ve yükleniyor durumlarını göster.', 2, 4, [doc('MDN Web Docs: Using the Fetch API')]),
        t('modern-js', 'Modern JavaScript (ES6+)', 'Modüller, yayma operatörü, destructuring, sınıflar ve dizi metotları.', 2, 4, [doc('javascript.info'), book('Eloquent JavaScript')]),
      ],
    },
    {
      id: 'tooling',
      title: 'Araçlar',
      emoji: '🧰',
      topics: [
        t('git', 'Git ve GitHub', 'Sürüm kontrolü: commit, dal (branch), birleştirme ve Pull Request.', 1, 4, [doc('Pro Git (kitap, ücretsiz)'), course('GitHub Skills')]),
        t('npm', 'Paket yöneticisi (npm)', 'Bağımlılık eklemek, package.json ve betik (script) çalıştırmak.', 1, 2, [doc('npm Docs')]),
        t('vite', 'Derleme aracı: Vite', 'Modern projelerde geliştirme sunucusu ve üretim derlemesi.', 2, 2, [doc('Vite Docs')]),
        alt('webpack', 'Derleme aracı: Webpack', 'Eski ve büyük projelerde hâlâ yaygın; Vite yerine karşına çıkabilir.', 3, 3, [doc('webpack Docs')]),
        opt('lint-format', 'ESLint ve Prettier', 'Kod kalitesini ve biçimini otomatik denetle.', 2, 1, [doc('ESLint Docs'), doc('Prettier Docs')]),
      ],
    },
    {
      id: 'framework',
      title: 'Bir framework seç',
      emoji: '🧩',
      topics: [
        t('react', 'React', 'Bileşenler, props, state ve hook’larla arayüz kur. İş ilanlarında en yaygın seçenek.', 2, 15, [doc('react.dev (resmi doküman)'), course('Scrimba: Learn React')]),
        alt('vue', 'Vue', 'Öğrenmesi kolay, şablon tabanlı bir alternatif.', 2, 12, [doc('vuejs.org (resmi doküman)')]),
        alt('angular', 'Angular', 'Kurumsal projelerde yaygın, her şeyi içinde getiren framework.', 3, 15, [doc('angular.dev (resmi doküman)')]),
        alt('svelte', 'Svelte', 'Derleme anında çalışan, sade sözdizimli bir alternatif.', 2, 10, [doc('svelte.dev/tutorial')]),
      ],
    },
    {
      id: 'react-ecosystem',
      title: 'Framework ekosistemi',
      emoji: '🛠️',
      topics: [
        t('routing', 'Yönlendirme (routing)', 'Tek sayfalık uygulamada sayfalar arası geçiş: React Router ya da framework yönlendiricisi.', 2, 3, [doc('React Router Docs')]),
        t('state', 'Durum yönetimi', 'Bileşenler arası veri paylaşımı: Context, Zustand ya da Redux Toolkit.', 2, 5, [doc('Zustand Docs'), doc('Redux Toolkit Docs')]),
        t('data-fetching', 'Sunucu verisi yönetimi', 'Önbellek, yeniden deneme ve senkronizasyon için TanStack Query.', 3, 4, [doc('TanStack Query Docs')]),
        t('nextjs', 'Meta-framework: Next.js', 'Sunucuda render (SSR), dosya tabanlı yönlendirme ve tam yığın özellikler.', 3, 10, [doc('Next.js Learn (resmi kurs)')]),
        opt('css-framework', 'Tailwind CSS', 'Hazır sınıflarla hızlı ve tutarlı arayüz.', 2, 3, [doc('Tailwind CSS Docs')]),
      ],
    },
    {
      id: 'typescript',
      title: 'TypeScript',
      emoji: '🔷',
      topics: [
        t('ts-basics', 'TypeScript temelleri', 'Tipler, arayüzler (interface), birleşim tipleri ve tip çıkarımı.', 2, 6, [doc('TypeScript Handbook')]),
        t('ts-react', 'React ile TypeScript', 'Props ve hook’ları tiplemek, bileşenleri güvenle yeniden kullanmak.', 3, 3, [doc('React TypeScript Cheatsheet')]),
        opt('ts-advanced', 'İleri tipler', 'Generic’ler, yardımcı tipler (Partial, Pick) ve tip daraltma.', 3, 4, [prac('Type Challenges')]),
      ],
    },
    {
      id: 'quality',
      title: 'Test ve kalite',
      emoji: '🧪',
      topics: [
        t('unit-test', 'Birim testleri', 'Fonksiyon ve bileşenleri Vitest/Jest ile test et.', 3, 4, [doc('Vitest Docs'), doc('Testing Library Docs')]),
        opt('e2e', 'Uçtan uca (E2E) testler', 'Gerçek tarayıcıda kullanıcı akışlarını Playwright ile test et.', 3, 4, [doc('Playwright Docs')]),
        t('performance', 'Web performansı', 'Core Web Vitals, görsel optimizasyonu, kod bölme ve Lighthouse ile ölçüm.', 3, 4, [doc('web.dev: Learn Performance')]),
        opt('security-fe', 'Ön yüz güvenliği', 'XSS, CORS, içerik güvenlik politikası (CSP) ve güvenli çerez kullanımı.', 3, 3, [doc('OWASP Cheat Sheet Series')]),
      ],
    },
    {
      id: 'career',
      title: 'Projeler ve kariyer',
      emoji: '🚀',
      topics: [
        t('deploy', 'Yayına alma', 'Projeni Vercel, Netlify ya da GitHub Pages üzerinde canlıya al.', 2, 2, [doc('Vercel Docs'), doc('Netlify Docs')]),
        t('portfolio', 'Portfolyo projeleri', '3 farklı proje: duyarlı bir açılış sayfası, API kullanan bir uygulama, React ile tam bir ürün.', 2, 30, [prac('Frontend Mentor'), prac('The Odin Project: projeler')]),
        opt('interview', 'Mülakat hazırlığı', 'JavaScript soruları, canlı kodlama ve projeni anlatma pratiği.', 3, 8, [book('JavaScript Interview Questions (GitHub, sudheerj)')]),
      ],
    },
  ],
};
