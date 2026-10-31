import { alt, book, course, doc, opt, prac, t, type DevRoadmap } from './types';

export const RUST: DevRoadmap = {
  id: 'rust',
  kind: 'skill',
  title: 'Rust',
  tagline: 'Hızlı ve güvenli programlar yaz; sahiplik mantığını kavra.',
  emoji: '⚙️',
  hue: 'coral',
  sections: [
    {
      id: 'start',
      title: 'Başlangıç',
      emoji: '🌱',
      topics: [
        t('install-cargo', 'Kurulum ve Cargo', 'rustup ile kurulum; cargo new, build, run ile proje oluşturma ve çalıştırma.', 1, 1, [book('The Rust Book: Getting Started'), doc('The Cargo Book')]),
        t('syntax-basics', 'Değişkenler ve temel tipler', 'let, mut, sabitler, sayı/bool/char tipleri, tuple ve dizi; Rust varsayılan olarak değişmezdir.', 1, 3, [book('The Rust Book: Common Programming Concepts'), prac('Rustlings')]),
        t('functions-control', 'Fonksiyonlar ve akış denetimi', 'fn, dönüş değeri, if, loop, while, for; Rust’ta çoğu şey bir ifadedir.', 1, 3, [book('The Rust Book: Common Programming Concepts'), prac('Rustlings')]),
        t('strings', 'String ve &str', 'Sahipli String ile ödünç alınan &str farkı; UTF-8 metinlerle çalışmanın inceliği.', 1, 2, [book('The Rust Book: Storing UTF-8 Encoded Text'), prac('Exercism: Rust yolu')]),
      ],
    },
    {
      id: 'ownership',
      title: 'Sahiplik ve ödünç alma',
      emoji: '🔐',
      topics: [
        t('ownership', 'Sahiplik kuralları', 'Her değerin tek sahibi vardır; sahip kapsamdan çıkınca bellek otomatik temizlenir.', 1, 4, [book('The Rust Book: Understanding Ownership'), prac('Rustlings')]),
        t('borrowing', 'Referanslar ve ödünç alma', '&T ve &mut T kuralları: aynı anda ya çok okuyucu ya tek yazıcı; veri yarışlarını önler.', 1, 4, [book('The Rust Book: References and Borrowing'), course('Let’s Get Rusty (YouTube)')]),
        t('slices', 'Dilimler (slice)', 'Bir koleksiyonun bir kısmına kopyalamadan bakmak; &[T] ve &str.', 1, 1, [book('The Rust Book: The Slice Type')]),
        opt('move-copy-clone', 'Move, Copy ve Clone', 'Hangi tipler kopyalanır, hangileri taşınır; clone ne zaman gerçekten gerekir?', 2, 2, [doc('Rust By Example: Ownership and Moves')]),
      ],
    },
    {
      id: 'data-types',
      title: 'Veri modelleme',
      emoji: '🧱',
      topics: [
        t('structs', 'Struct ve impl', 'Alanlı veri tipleri tanımlama; impl bloklarıyla metot ve ilişkili fonksiyon ekleme.', 1, 3, [book('The Rust Book: Using Structs'), prac('Rustlings')]),
        t('enums-match', 'Enum ve pattern matching', 'Veri taşıyan enum’lar ve match ile tüm durumları zorunlu olarak ele alma.', 2, 4, [book('The Rust Book: Enums and Pattern Matching'), prac('Rustlings')]),
        t('modules', 'Modüller ve crate’ler', 'mod, use, pub ile kodu düzenleme; paket, crate ve modül ilişkisi.', 2, 3, [book('The Rust Book: Managing Growing Projects')]),
        t('collections', 'Koleksiyonlar', 'Vec, HashMap, HashSet ve BTreeMap; hangisini ne zaman seçmeli?', 2, 4, [book('The Rust Book: Common Collections'), doc('Rust Standard Library Docs')]),
      ],
    },
    {
      id: 'errors',
      title: 'Hata yönetimi',
      emoji: '🛡️',
      topics: [
        t('option-result', 'Option ve Result', 'Null yerine Option, hata yerine Result; hata olasılığı tipin içinde görünür.', 2, 3, [book('The Rust Book: Error Handling'), prac('Rustlings')]),
        t('question-mark', '? operatörü', 'Hataları çağırana kısaca ilet; map, and_then gibi birleştiricilerle zincirleme.', 2, 2, [book('The Rust Book: Propagating Errors')]),
        t('panic', 'panic! ve unwrap', 'Ne zaman çökmek kabul edilir, ne zaman unwrap/expect yerine hatayı yönetmeli?', 2, 1, [book('The Rust Book: To panic! or Not to panic!')]),
        opt('custom-errors', 'Özel hata tipleri', 'Kendi hata enum’unu yaz; thiserror ve anyhow kütüphanelerinin kullanım alanları.', 3, 3, [doc('Docs.rs: thiserror'), doc('Docs.rs: anyhow')]),
      ],
    },
    {
      id: 'abstractions',
      title: 'Soyutlamalar',
      emoji: '🧩',
      topics: [
        t('generics', 'Generics', 'Tek kodla birçok tipte çalışan fonksiyon ve struct’lar; performans kaybı olmadan.', 2, 3, [book('The Rust Book: Generic Types')]),
        t('traits', 'Trait’ler', 'Ortak davranışı tanımlama; trait bound, impl Trait ve dyn Trait farkı.', 2, 4, [book('The Rust Book: Traits'), prac('Rustlings')]),
        t('lifetimes', 'Ömürler (lifetimes)', 'Referansların ne kadar yaşayacağını derleyiciye anlatma; asılı referansları engeller.', 3, 4, [book('The Rust Book: Validating References with Lifetimes'), doc('Rust By Example: Lifetimes')]),
        t('closures-iterators', 'Closure ve iteratör', 'Anonim fonksiyonlar ve map/filter/collect zincirleri; soyut ama hızlı kod.', 2, 4, [book('The Rust Book: Functional Language Features'), prac('Exercism: Rust yolu')]),
        opt('smart-pointers', 'Akıllı işaretçiler', 'Box, Rc, RefCell: yığın bellek, paylaşılan sahiplik ve iç değişebilirlik.', 3, 4, [book('The Rust Book: Smart Pointers')]),
      ],
    },
    {
      id: 'concurrency',
      title: 'Eşzamanlılık ve async',
      emoji: '🔁',
      topics: [
        t('threads', 'İş parçacıkları', 'std::thread ile paralel çalışma; Rust’ın veri yarışlarını derleme anında yakalaması.', 3, 3, [book('The Rust Book: Fearless Concurrency')]),
        t('sync-primitives', 'Kanal, Mutex ve Arc', 'Thread’ler arası mesajlaşma ve paylaşılan durumu güvenle kilitleme.', 3, 4, [book('The Rust Book: Shared-State Concurrency'), doc('Rust Standard Library Docs: std::sync')]),
        t('async-basics', 'async/await temelleri', 'Future kavramı; bloklamadan bekleyen kod yazmak ve neden bir çalışma ortamı gerekir.', 3, 4, [book('Asynchronous Programming in Rust (Async Book)')]),
        t('tokio', 'Tokio', 'En yaygın async çalışma ortamı: spawn, sleep, select ve ağ işleri.', 3, 5, [doc('Tokio Tutorial'), doc('Docs.rs: tokio')]),
        alt('rayon', 'Rayon ile veri paralelliği', 'Hesaplama ağırlıklı işlerde iteratörü paralel hâle getirmenin en kolay yolu.', 3, 2, [doc('Docs.rs: rayon')]),
      ],
    },
    {
      id: 'quality',
      title: 'Test ve kalite',
      emoji: '✅',
      topics: [
        t('testing', 'Test yazma', 'Birim ve entegrasyon testleri, cargo test, #[should_panic] ve doküman testleri.', 2, 3, [book('The Rust Book: Writing Automated Tests')]),
        t('fmt-clippy', 'rustfmt ve Clippy', 'Otomatik biçimlendirme ve yaygın hataları gösteren linter; kod kalitesinin ilk adımı.', 1, 1, [doc('The Clippy Book'), doc('The Cargo Book: cargo fmt')]),
        opt('docs-publish', 'Dokümantasyon ve yayımlama', 'cargo doc ile belge üret; crates.io’ya paket yayımlama süreci.', 3, 2, [doc('The Cargo Book: Publishing on crates.io'), doc('The rustdoc Book')]),
      ],
    },
    {
      id: 'project',
      title: 'Proje / kariyer',
      emoji: '🏆',
      topics: [
        t('cli-project', 'Komut satırı aracı yap', 'clap ve serde ile küçük bir araç (ör. grep benzeri) yazıp GitHub’a koy.', 2, 12, [book('The Rust Book: An I/O Project'), doc('Command Line Applications in Rust')]),
        t('web-service', 'Web servisi yap', 'axum ya da actix-web ile JSON API; Tokio ve veritabanı erişimini bir araya getir.', 3, 20, [doc('Docs.rs: axum'), doc('Tokio Tutorial')]),
        opt('open-source', 'Açık kaynağa katkı', 'Küçük bir crate’te hata düzelt; gerçek kod okumak sahiplik sezgini güçlendirir.', 3, 8, [prac('Good First Issues (Rust Lang)')]),
      ],
    },
  ],
};
