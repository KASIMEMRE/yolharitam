import { book, doc, opt, prac, t, type DevRoadmap } from './types';

export const TYPESCRIPT: DevRoadmap = {
  id: 'typescript',
  kind: 'skill',
  title: 'TypeScript',
  tagline: 'JavaScript’e tip güvenliği ekle, hataları çalıştırmadan yakala.',
  emoji: '🔷',
  hue: 'violet',
  sections: [
    {
      id: 'intro',
      title: 'Giriş',
      emoji: '🧱',
      topics: [
        t('why', 'TypeScript neden var?', 'Statik tipler, derleme zamanı hataları, editör desteği.', 1, 1, [doc('TypeScript Handbook: The Basics')]),
        t('setup', 'Kurulum ve tsconfig', 'tsc, strict modu ve temel derleyici ayarları.', 1, 2, [doc('TSConfig Reference')]),
        t('js-to-ts', 'JS’ten TS’e geçiş', 'Mevcut bir projeye adım adım tip eklemek.', 2, 2, [doc('TypeScript Docs: Migrating from JavaScript')]),
      ],
    },
    {
      id: 'basics',
      title: 'Temel tipler',
      emoji: '🔤',
      topics: [
        t('primitives', 'İlkel tipler ve diziler', 'string, number, boolean, dizi ve demet (tuple).', 1, 2, [doc('TypeScript Handbook: Everyday Types')]),
        t('objects', 'Nesne tipleri: type ve interface', 'Nesnelerin şeklini tanımla; ikisinin farkı.', 1, 2, []),
        t('unions', 'Birleşim ve kesişim tipleri', 'A | B ve A & B; değer kümeleriyle düşünmek.', 1, 2, []),
        t('functions', 'Fonksiyon tipleri', 'Parametre ve dönüş tipleri, isteğe bağlı parametreler.', 1, 2, []),
        t('any-unknown', 'any, unknown, never', 'any’den kaçın; unknown ile güvenli çalış.', 2, 1, []),
        t('enums-literals', 'Sabit değer tipleri', 'Literal tipler, as const; enum yerine ne kullanılır?', 2, 1, []),
      ],
    },
    {
      id: 'narrowing',
      title: 'Tip daraltma',
      emoji: '🔍',
      topics: [
        t('guards', 'Tip korumaları', 'typeof, instanceof, in ve kendi koruma fonksiyonların.', 2, 2, [doc('TypeScript Handbook: Narrowing')]),
        t('discriminated', 'Ayrıştırılmış birleşimler', 'Durum makineleri ve API cevapları için güçlü desen.', 2, 2, []),
      ],
    },
    {
      id: 'generics',
      title: 'Generic’ler',
      emoji: '🧬',
      topics: [
        t('generic-basics', 'Generic temelleri', 'Tipe göre çalışan fonksiyon ve bileşenler.', 2, 3, [doc('TypeScript Handbook: Generics')]),
        t('constraints', 'Kısıtlar ve varsayılanlar', 'extends ile generic’i sınırlamak.', 3, 2, []),
        t('utility', 'Yardımcı tipler', 'Partial, Pick, Omit, Record, ReturnType.', 2, 2, [doc('TypeScript Docs: Utility Types')]),
      ],
    },
    {
      id: 'advanced',
      title: 'İleri tipler',
      emoji: '🏔️',
      topics: [
        t('keyof-typeof', 'keyof, typeof ve indeksli erişim', 'Var olan değerlerden tip türetmek.', 3, 2, []),
        t('mapped', 'Eşlenmiş (mapped) tipler', 'Bir tipin tüm alanlarını dönüştürmek.', 3, 2, []),
        t('conditional', 'Koşullu tipler ve infer', 'Tip düzeyinde if/else.', 3, 3, [prac('Type Challenges')]),
        opt('template-literal', 'Şablon metin tipleri', 'Metin desenlerini tiplerle ifade etmek.', 3, 2, []),
      ],
    },
    {
      id: 'practice',
      title: 'Gerçek projede TypeScript',
      emoji: '🛠️',
      topics: [
        t('runtime-validation', 'Çalışma zamanı doğrulama: Zod', 'Dışarıdan gelen veriyi doğrula ve tipini çıkar.', 2, 2, [doc('Zod Docs')]),
        t('ts-react', 'React ile TypeScript', 'Props, hook’lar ve olay tipleri.', 2, 3, [doc('React TypeScript Cheatsheet')]),
        t('ts-node', 'Node.js ile TypeScript', 'tsx/ts-node ile çalıştırma, tip tanımları (@types).', 2, 2, []),
        opt('declaration', 'Tip tanım dosyaları (.d.ts)', 'Tipsiz bir kütüphaneye tip yazmak.', 3, 2, []),
      ],
    },
    {
      id: 'mastery',
      title: 'Ustalık',
      emoji: '🚀',
      topics: [
        t('effective', 'İyi TypeScript alışkanlıkları', 'Tip çıkarımına güven, gereksiz tip yazma, any’yi sınırla.', 3, 4, [book('Effective TypeScript')]),
        opt('challenges', 'Tip bulmacaları', 'Type Challenges ile tip sistemi ustalığı.', 3, 8, [prac('Type Challenges')]),
        t('project', 'Proje: Tam tipli uygulama', 'Strict modda, Zod doğrulamalı bir API ya da arayüz projesi.', 2, 12, []),
      ],
    },
  ],
};
