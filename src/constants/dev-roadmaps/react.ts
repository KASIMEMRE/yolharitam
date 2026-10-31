import { alt, course, doc, opt, prac, t, type DevRoadmap } from './types';

export const REACT: DevRoadmap = {
  id: 'react',
  kind: 'skill',
  title: 'React',
  tagline: 'Bileşenlerden hook’lara, modern React ile arayüz geliştir.',
  emoji: '⚛️',
  hue: 'sky',
  sections: [
    {
      id: 'prereq',
      title: 'Ön koşullar',
      emoji: '🧱',
      topics: [
        t('js-ready', 'React için JavaScript', 'Ok fonksiyonları, destructuring, yayma, dizi metotları (map/filter), modüller.', 1, 5, [doc('javascript.info')]),
        t('html-css', 'HTML ve CSS temeli', 'Anlamsal etiketler, Flexbox ve duyarlı yerleşim.', 1, 4, [doc('MDN Web Docs')]),
        t('setup', 'Proje kurulumu', 'Vite ile React projesi oluştur, klasör yapısını tanı.', 1, 1, [doc('Vite Docs'), doc('react.dev: Start a New React Project')]),
      ],
    },
    {
      id: 'core',
      title: 'Temel kavramlar',
      emoji: '⚛️',
      topics: [
        t('jsx', 'JSX', 'HTML’e benzeyen sözdizimi; ifadeler, koşullu çizim ve listeler (key).', 1, 3, [doc('react.dev: Writing Markup with JSX')]),
        t('components', 'Bileşenler ve props', 'Arayüzü küçük, yeniden kullanılabilir parçalara böl; veri aktar.', 1, 3, [doc('react.dev: Your First Component')]),
        t('state', 'State (useState)', 'Değişen veri ve yeniden çizim; state’i doğru yerde tutmak.', 1, 4, [doc('react.dev: State: A Component’s Memory')]),
        t('events', 'Olaylar ve formlar', 'Tıklama, girdi; kontrollü form bileşenleri.', 1, 3, [doc('react.dev: Responding to Events')]),
        t('thinking', 'React’te düşünmek', 'Arayüzü bileşen ağacına ayır, state’i yukarı taşı (lifting state up).', 2, 3, [doc('react.dev: Thinking in React')]),
      ],
    },
    {
      id: 'hooks',
      title: 'Hook’lar',
      emoji: '🪝',
      topics: [
        t('effect', 'useEffect ve yan etkiler', 'Dış sistemlerle senkronizasyon; ne zaman effect GEREKMEZ?', 2, 4, [doc('react.dev: You Might Not Need an Effect')]),
        t('ref', 'useRef', 'DOM’a erişim ve çizimi tetiklemeyen değerler.', 2, 2, [doc('react.dev: Referencing Values with Refs')]),
        t('context', 'useContext', 'Prop zincirine girmeden veriyi derine aktar.', 2, 2, [doc('react.dev: Passing Data Deeply with Context')]),
        t('reducer', 'useReducer', 'Karmaşık state geçişlerini tek yerde topla.', 2, 2, [doc('React Docs: useReducer'), doc('React Docs: Extracting State Logic into a Reducer')]),
        t('custom-hooks', 'Kendi hook’ların', 'Tekrarlanan mantığı paylaşılabilir hook’a çıkar.', 2, 3, [doc('react.dev: Reusing Logic with Custom Hooks')]),
        opt('memo', 'useMemo, useCallback ve React Compiler', 'Gereksiz hesap ve çizimleri önleme; derleyicinin bunu nasıl otomatikleştirdiği.', 3, 3, [doc('React Compiler Docs')]),
      ],
    },
    {
      id: 'ecosystem',
      title: 'Ekosistem',
      emoji: '🧰',
      topics: [
        t('routing', 'Yönlendirme', 'React Router ile sayfalar, parametreler, iç içe rotalar.', 2, 4, [doc('React Router Docs')]),
        t('data', 'Sunucu verisi: TanStack Query', 'Önbellek, yeniden doğrulama, yükleniyor/hata durumları.', 2, 4, [doc('TanStack Query Docs')]),
        t('global-state', 'Global state: Zustand', 'Basit ve hızlı küresel durum yönetimi.', 2, 2, [doc('Zustand Docs')]),
        alt('redux', 'Redux Toolkit', 'Büyük ve kurumsal projelerde yaygın alternatif.', 3, 5, [doc('Redux Toolkit Docs')]),
        t('forms', 'Form kütüphaneleri', 'React Hook Form + Zod ile doğrulama.', 2, 3, [doc('React Hook Form Docs'), doc('Zod Docs')]),
        t('styling', 'Stil: Tailwind CSS', 'Yardımcı sınıflarla hızlı stil.', 2, 3, [doc('Tailwind CSS Docs')]),
        alt('css-modules', 'Stil: CSS Modules', 'Bileşene özel klasik CSS.', 2, 2, [doc('Vite Docs: CSS Modules'), doc('MDN: CSS')]),
      ],
    },
    {
      id: 'typescript',
      title: 'TypeScript ile React',
      emoji: '🔷',
      topics: [
        t('ts-props', 'Props ve state tipleri', 'Bileşenleri tiplerle güvene al.', 2, 3, [doc('React TypeScript Cheatsheet')]),
        opt('ts-generics', 'Generic bileşenler', 'Farklı veri tipleriyle çalışan tablo, liste gibi bileşenler.', 3, 3, [doc('TypeScript Handbook: Generics'), doc('React TypeScript Cheatsheets')]),
      ],
    },
    {
      id: 'advanced',
      title: 'İleri React',
      emoji: '🏔️',
      topics: [
        t('server-components', 'Sunucu bileşenleri (RSC)', 'Sunucuda çalışan bileşenler, "use client" sınırı.', 3, 5, [doc('react.dev: Server Components')]),
        t('suspense', 'Suspense ve hata sınırları', 'Yükleme ve hata durumlarını bildirimsel yönet.', 3, 3, [doc('react.dev: Suspense')]),
        t('performance', 'Performans', 'React DevTools Profiler, liste sanallaştırma, kod bölme.', 3, 4, [doc('React DevTools')]),
        t('nextjs', 'Next.js', 'React’i tam yığın çatıyla kullan.', 3, 10, [doc('Next.js Learn (resmi kurs)')]),
      ],
    },
    {
      id: 'testing',
      title: 'Test',
      emoji: '🧪',
      topics: [
        t('rtl', 'React Testing Library', 'Bileşeni kullanıcı gibi test et.', 3, 4, [doc('Testing Library Docs'), doc('Vitest Docs')]),
        opt('e2e', 'Uçtan uca: Playwright', 'Gerçek tarayıcıda kritik akışlar.', 3, 3, [doc('Playwright Docs')]),
      ],
    },
    {
      id: 'projects',
      title: 'Projeler',
      emoji: '🚀',
      topics: [
        t('project-todo', 'Proje: Görev listesi', 'State, formlar, localStorage; ilk tam React uygulaman.', 1, 6, [doc('React Docs: Tutorial: Tic-Tac-Toe'), doc('React Docs: Thinking in React')]),
        t('project-api', 'Proje: API uygulaması', 'Film ya da hava durumu: arama, detay, yönlendirme, TanStack Query.', 2, 12, [prac('Frontend Mentor')]),
        opt('project-full', 'Proje: Tam ürün', 'Kimlik doğrulama ve veritabanıyla (Supabase) gerçek bir uygulama.', 3, 25, [course('Scrimba: Learn React')]),
      ],
    },
  ],
};
