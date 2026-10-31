import { alt, book, course, doc, opt, prac, t, vid, type DevRoadmap } from './types';

export const JAVASCRIPT: DevRoadmap = {
  id: 'javascript',
  kind: 'skill',
  title: 'JavaScript',
  tagline: 'Webin dilini temelden öğren; DOM, asenkron kod ve modern ES.',
  emoji: '⚡',
  hue: 'marker',
  sections: [
    {
      id: 'basics',
      title: 'Dil temelleri',
      emoji: '🧱',
      topics: [
        t('variables-types', 'Değişkenler ve veri tipleri', 'let, const, string, number, boolean, null ve undefined; tip dönüşümü tuzakları.', 1, 3, [doc('MDN: JavaScript Guide'), course('freeCodeCamp: JavaScript')]),
        t('operators-flow', 'Operatörler ve akış kontrolü', 'Karşılaştırma (== ve ===), if/else, switch ve döngülerle programın akışını yönetirsin.', 1, 3, [doc('MDN: Kontrol akışı'), prac('Exercism: JavaScript yolu')]),
        t('functions', 'Fonksiyonlar', 'Tanımlama, ok fonksiyonu, varsayılan parametre; kodu küçük ve tekrar kullanılır parçalara böler.', 1, 4, [doc('MDN: Functions'), book('Eloquent JavaScript')]),
        t('arrays-objects', 'Dizi ve nesneler', 'Veriyi gruplamanın temel yolu; map, filter, reduce gibi dizi metotları günlük işin parçasıdır.', 1, 5, [doc('MDN: Array'), doc('MDN: Working with objects')]),
        t('strings-dates', 'Metin, tarih ve düzenli ifadeler', 'String metotları, Date nesnesi ve regex ile veriyi işlemek ve doğrulamak.', 1, 3, [doc('MDN: Regular expressions'), doc('MDN: Date')]),
      ],
    },
    {
      id: 'language-depth',
      title: 'Dili derinden anlamak',
      emoji: '🧠',
      topics: [
        t('scope-closure', 'Kapsam ve closure', 'Bir fonksiyonun dış değişkenleri hatırlaması; hoisting ve kapsam hatalarını anlamanın anahtarı.', 2, 4, [book('You Don’t Know JS Yet: Scope & Closures'), doc('MDN: Closures')]),
        t('this-prototype', 'this ve prototip zinciri', 'this’in neye bağlandığı ve nesnelerin kalıtımı nasıl yaptığı; garip hataların çoğu buradan çıkar.', 2, 4, [doc('MDN: this'), doc('MDN: Inheritance and the prototype chain')]),
        t('classes', 'Sınıflar', 'class, constructor, extends ve private alanlar; prototip sisteminin okunaklı yazımı.', 2, 3, [doc('MDN: Classes'), course('javascript.info: Sınıflar')]),
        t('destructuring-spread', 'Destructuring, spread ve rest', 'Nesne ve dizilerden değer çıkarma ve kopyalama; modern JS kodunun her yerinde karşına çıkar.', 1, 2, [doc('MDN: Destructuring assignment'), doc('MDN: Spread syntax')]),
        t('errors', 'Hata yönetimi', 'try/catch, Error nesneleri ve kendi hata tiplerin; uygulamanın çökmeden toparlanmasını sağlar.', 2, 2, [doc('MDN: Control flow and error handling')]),
      ],
    },
    {
      id: 'dom',
      title: 'DOM ve tarayıcı',
      emoji: '🌐',
      topics: [
        t('dom-select-edit', 'DOM’u seçmek ve değiştirmek', 'querySelector ile eleman bulup içeriğini, sınıfını ve stilini değiştirerek sayfayı canlandırırsın.', 1, 4, [doc('MDN: Introduction to the DOM'), course('The Odin Project: DOM Manipulation')]),
        t('events', 'Olaylar', 'click, input, submit; addEventListener, olay yayılımı ve event delegation ile kullanıcıya tepki verirsin.', 1, 3, [doc('MDN: Introduction to events'), vid('Web Dev Simplified: JavaScript Events')]),
        t('forms', 'Formlar ve doğrulama', 'Form verisini okuma, doğrulama ve kullanıcıya hata gösterme; her web uygulamasında gerekir.', 2, 3, [doc('MDN: Client-side form validation')]),
        opt('dom-perf', 'DOM performansı', 'Gereksiz yeniden çizimi azaltma, DocumentFragment ve requestAnimationFrame kullanımı.', 3, 2, [doc('MDN: requestAnimationFrame')]),
      ],
    },
    {
      id: 'async',
      title: 'Asenkron JavaScript',
      emoji: '⏳',
      topics: [
        t('event-loop', 'Event loop', 'Tek iş parçacıklı JS’in çağrı yığını, görev kuyrukları ve mikro görevlerle işleri nasıl sıraya koyduğu.', 2, 3, [vid('Philip Roberts: What the heck is the event loop anyway?'), doc('MDN: Event loop')]),
        t('callbacks', 'Callback’ler', 'Bir işin bitince çağrılacak fonksiyonu vermek; callback cehennemi neden sorun yaratır?', 2, 2, [doc('MDN: Asynchronous JavaScript')]),
        t('promises', 'Promise', 'Gelecekte bitecek bir işin temsili; then, catch, finally, Promise.all ve Promise.race.', 2, 4, [doc('MDN: Promise'), course('javascript.info: Promises')]),
        t('async-await', 'async/await', 'Promise tabanlı kodu düz, sırayla okunan kod gibi yazmanı sağlar; hata için try/catch kullanılır.', 2, 3, [doc('MDN: async function'), vid('Fireship: Async/Await in 100 seconds')]),
        t('fetch-http', 'fetch ve HTTP istekleri', 'API’den veri çekme, JSON okuma, durum kodlarını kontrol etme ve hata yakalama.', 2, 3, [doc('MDN: Using the Fetch API'), prac('JSONPlaceholder ile alıştırma')]),
      ],
    },
    {
      id: 'modules-modern',
      title: 'Modüller ve modern ES',
      emoji: '📦',
      topics: [
        t('esm', 'ES modülleri', 'import ve export ile kodu dosyalara bölmek; büyüyen projeyi yönetilebilir tutar.', 2, 2, [doc('MDN: JavaScript modules'), course('javascript.info: Modüller')]),
        t('modern-es', 'Modern ES özellikleri', 'Optional chaining, nullish coalescing, şablon metinler ve Map/Set gibi yeni dil özellikleri.', 2, 3, [doc('MDN: JavaScript reference'), doc('javascript.info: Modern JavaScript')]),
        t('npm', 'npm ve paket yönetimi', 'package.json, bağımlılık kurma, script çalıştırma ve sürüm numaralarının anlamı.', 1, 2, [doc('npm Docs'), doc('Node.js: Learn')]),
        opt('iterators-generators', 'Iterator ve generator', 'for...of’un arkasındaki protokol ve duraklatılabilen fonksiyonlar; ileri düzey akış kontrolü.', 3, 3, [doc('MDN: Iterators and generators')]),
      ],
    },
    {
      id: 'browser-apis',
      title: 'Tarayıcı API’leri',
      emoji: '🔌',
      topics: [
        t('web-storage', 'localStorage ve sessionStorage', 'Küçük verileri tarayıcıda saklamak; tema tercihi ve basit oturum bilgisi için uygundur.', 1, 2, [doc('MDN: Web Storage API')]),
        t('url-history', 'URL ve History API', 'URL’yi ayrıştırma, adres çubuğunu sayfa yenilemeden değiştirme; tek sayfalı uygulamaların temeli.', 2, 2, [doc('MDN: URL API'), doc('MDN: History API')]),
        opt('observers', 'Intersection Observer', 'Bir elemanın ekrana girdiğini izlemek; tembel yükleme ve sonsuz kaydırma için kullanılır.', 3, 2, [doc('MDN: Intersection Observer API')]),
        opt('web-workers', 'Web Worker', 'Ağır hesapları arka plan iş parçacığına taşıyarak arayüzün donmasını önlemek.', 3, 2, [doc('MDN: Web Workers API')]),
      ],
    },
    {
      id: 'testing-tools',
      title: 'Test ve araçlar',
      emoji: '🧪',
      topics: [
        t('debugging', 'Hata ayıklama', 'Tarayıcı DevTools, breakpoint, console ve ağ sekmesiyle hatayı tahmin etmeden bulursun.', 2, 3, [doc('Chrome DevTools Docs'), doc('MDN: Debugging JavaScript')]),
        t('unit-testing', 'Birim testi', 'Fonksiyonlarını Vitest ya da Jest ile otomatik doğrulamak; değişiklik yaparken güven verir.', 2, 4, [doc('Vitest Docs'), doc('Jest Docs')]),
        alt('jest-alt', 'Jest', 'Vitest’e alternatif olarak yaygın kullanılan test çerçevesi; eski projelerde sık görülür.', 2, 4, [doc('Jest Docs: Getting Started')]),
        t('lint-format', 'ESLint ve Prettier', 'Hataları kod yazarken yakalayan ve biçimi otomatik düzenleyen araçlar; ekip işinde şarttır.', 2, 2, [doc('ESLint Docs'), doc('Prettier Docs')]),
        t('bundlers', 'Vite ve derleme araçları', 'Modülleri paketleyip tarayıcıya hazır hale getirme; geliştirme sunucusu ve üretim çıktısı.', 3, 3, [doc('Vite Docs')]),
        opt('typescript-intro', 'TypeScript’e giriş', 'JS’e tip kontrolü ekleyerek hataları çalıştırmadan yakalar; sektörde çok tercih edilir.', 3, 6, [doc('TypeScript Handbook')]),
      ],
    },
    {
      id: 'project',
      title: 'Proje / kariyer',
      emoji: '🏁',
      topics: [
        t('portfolio-project', 'Portfolyo projesi', 'Hava durumu ya da yapılacaklar uygulaması gibi gerçek bir API kullanan bir proje yayına al.', 3, 20, [course('The Odin Project: JavaScript'), prac('Frontend Mentor')]),
        t('interview-prep', 'Mülakat hazırlığı', 'Closure, event loop, Promise sorularını çalış ve algoritma pratiği yap.', 3, 10, [prac('LeetCode'), prac('Exercism: JavaScript yolu')]),
        opt('open-source', 'Açık kaynağa katkı', 'Küçük bir hata düzeltmesi ya da dokümantasyon PR’ıyla gerçek kod okuma deneyimi kazan.', 3, 6, [prac('First Contributions (GitHub)')]),
      ],
    },
  ],
};
