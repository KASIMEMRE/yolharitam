import { book, course, doc, opt, prac, t, vid, type DevRoadmap } from './types';

export const GO: DevRoadmap = {
  id: 'go',
  kind: 'skill',
  title: 'Go',
  tagline: 'Sade, hızlı ve eşzamanlılığı kolay bir arka uç dili.',
  emoji: '🚀',
  hue: 'sky',
  sections: [
    {
      id: 'syntax',
      title: 'Sözdizimi ve kurulum',
      emoji: '🌱',
      topics: [
        t('install-first', 'Kurulum ve ilk program', 'Go’yu kur, main paketi ve go run ile ilk programını çalıştır.', 1, 2, [doc('Go: Tutorial: Getting started'), doc('A Tour of Go')]),
        t('vars-consts', 'Değişkenler ve sabitler', 'var, kısa tanım (:=), const ve sıfır değerleri; Go’da her değişkenin güvenli bir başlangıcı vardır.', 1, 2, [doc('A Tour of Go'), doc('Go by Example')]),
        t('control-flow', 'Akış kontrolü', 'Tek döngü türü olan for, if, switch ve defer; Go’nun sade akış yapısı.', 1, 3, [doc('A Tour of Go'), prac('Exercism: Go yolu')]),
        t('functions', 'Fonksiyonlar', 'Çoklu dönüş değeri, adlandırılmış dönüşler ve değişken sayıda parametre.', 1, 3, [doc('Go by Example: Functions'), book('The Go Programming Language')]),
        t('go-tooling', 'go komutu ve gofmt', 'go build, go fmt, go vet; biçimlendirme tartışması Go’da araçla çözülür.', 1, 2, [doc('Go Docs: Command go'), doc('Effective Go')]),
      ],
    },
    {
      id: 'types',
      title: 'Tipler ve veri yapıları',
      emoji: '🧱',
      topics: [
        t('basic-types', 'Temel tipler ve dönüşüm', 'int, float64, string, rune ve byte; Go örtük dönüşüm yapmaz, bu yüzden açıkça çevirirsin.', 1, 3, [doc('A Tour of Go'), book('The Go Programming Language')]),
        t('arrays-slices', 'Dizi ve slice', 'Slice Go’nun en çok kullanılan koleksiyonudur; uzunluk, kapasite ve append’in nasıl çalıştığını öğren.', 1, 4, [doc('Go Blog: Slices'), doc('Go by Example: Slices')]),
        t('maps', 'Map', 'Anahtar-değer yapısı; varlık kontrolü (comma ok) ve eşzamanlı kullanım uyarıları.', 1, 2, [doc('Go by Example: Maps'), doc('Go Blog: Go maps in action')]),
        t('pointers', 'Pointer', 'Değerin adresini taşıma; ne zaman kopya, ne zaman pointer geçirileceğini anlamak.', 2, 3, [doc('A Tour of Go: Pointers'), book('Learning Go')]),
      ],
    },
    {
      id: 'struct-interface',
      title: 'Struct ve interface',
      emoji: '🧩',
      topics: [
        t('structs', 'Struct', 'Sınıf yerine kullanılan alan grupları; alan etiketleri (tags) JSON için önemlidir.', 1, 3, [doc('A Tour of Go: Structs'), doc('Go by Example: Structs')]),
        t('methods', 'Metotlar ve alıcılar', 'Değer ve pointer alıcı farkı; hangisini seçmenin davranışı nasıl değiştirdiği.', 2, 3, [doc('A Tour of Go: Methods'), book('Learning Go')]),
        t('interfaces', 'Interface', 'Örtük uygulanan arayüzler; küçük arayüz yazmak Go’nun tasarım ilkesidir.', 2, 4, [doc('A Tour of Go: Interfaces'), doc('Effective Go: Interfaces')]),
        t('embedding', 'Gömme (embedding)', 'Kalıtım yerine birleştirme: bir struct’ı diğerinin içine koyup davranışı devralmak.', 2, 2, [doc('Effective Go: Embedding')]),
        t('generics', 'Generics', 'Tip parametreleriyle tekrar eden kodu azaltmak; Go 1.18 ile geldi, ölçülü kullanılır.', 3, 3, [doc('Go Docs: Tutorial: Generics'), doc('Go Blog: An Introduction to Generics')]),
      ],
    },
    {
      id: 'errors',
      title: 'Hata yönetimi',
      emoji: '🛡️',
      topics: [
        t('error-values', 'error değerleri', 'Go’da hata istisna değil, döndürülen bir değerdir; if err != nil kalıbı her yerdedir.', 1, 3, [doc('Go Blog: Error handling and Go'), doc('Effective Go: Errors')]),
        t('wrapping', 'Hata sarmalama', 'fmt.Errorf ile %w, errors.Is ve errors.As kullanarak hatanın bağlamını kaybetmeden taşımak.', 2, 2, [doc('Go Blog: Working with Errors in Go 1.13')]),
        t('panic-recover', 'panic ve recover', 'Gerçekten kurtarılamaz durumlar için; normal hata akışında kullanılmaz.', 2, 2, [doc('Go Blog: Defer, Panic, and Recover')]),
      ],
    },
    {
      id: 'concurrency',
      title: 'Goroutine ve channel',
      emoji: '♾️',
      topics: [
        t('goroutines', 'Goroutine', 'go anahtar sözcüğüyle hafif eşzamanlı iş başlatmak; WaitGroup ile bitişi beklemek.', 2, 4, [doc('A Tour of Go: Concurrency'), vid('Rob Pike: Concurrency Is Not Parallelism')]),
        t('channels', 'Channel', 'Goroutine’ler arasında veri taşıyan borular; tamponlu ve tamponsuz channel farkı.', 2, 4, [doc('Go by Example: Channels'), book('Concurrency in Go')]),
        t('select-context', 'select ve context', 'Birden çok channel’ı dinlemek, zaman aşımı ve iptal; sunucu kodunda sık gerekir.', 3, 4, [doc('Go Blog: Go Concurrency Patterns: Context'), doc('Go by Example: Select')]),
        t('sync-race', 'Mutex ve yarış durumu', 'sync.Mutex, atomic ve go test -race ile paylaşılan veriyi güvenle kullanmak.', 3, 3, [doc('Go Docs: Data Race Detector'), doc('Go Docs: Package sync')]),
        opt('concurrency-patterns', 'Eşzamanlılık kalıpları', 'Worker pool, pipeline ve fan-out/fan-in; gerçek projelerde tekrar eden çözümler.', 3, 4, [doc('Go Blog: Go Concurrency Patterns: Pipelines')]),
      ],
    },
    {
      id: 'packages',
      title: 'Paketler ve modüller',
      emoji: '📦',
      topics: [
        t('packages', 'Paket yapısı', 'Büyük harfle başlayan adlar dışarıya açılır; internal klasörü ve paket adlandırma.', 1, 2, [doc('Go Docs: How to Write Go Code'), doc('Effective Go: Package names')]),
        t('modules', 'Go modülleri', 'go mod init, go get ve go.mod ile bağımlılık yönetimi ve sürümleme.', 1, 2, [doc('Go Docs: Go Modules Reference'), doc('Go Blog: Using Go Modules')]),
        opt('project-layout', 'Proje düzeni', 'cmd ve internal klasörleriyle büyüyen projeyi düzenli tutmak; tek bir doğru yapı yoktur.', 2, 2, [doc('Go Docs: Organizing a Go module')]),
        opt('workspaces', 'Çalışma alanları', 'go.work ile birden çok modülü aynı anda geliştirmek.', 3, 1, [doc('Go Docs: Tutorial: Multi-module workspaces')]),
      ],
    },
    {
      id: 'stdlib',
      title: 'Standart kütüphane',
      emoji: '🌐',
      topics: [
        t('net-http', 'net/http ile sunucu', 'Harici çerçeve olmadan HTTP sunucusu yazmak; ServeMux ve handler kavramı.', 2, 5, [doc('Go Docs: Writing Web Applications'), doc('Go Docs: Package net/http')]),
        t('json', 'encoding/json', 'Struct’ları JSON’a ve geri çevirmek; API yazarken en çok kullanacağın paket.', 2, 3, [doc('Go Blog: JSON and Go'), doc('Go by Example: JSON')]),
        t('io-files', 'io ve dosyalar', 'Reader ve Writer arayüzleri, os ve bufio ile dosya ve akış işlemleri.', 2, 3, [doc('Go by Example: Reading Files'), doc('Go Docs: Package io')]),
        opt('database-sql', 'database/sql', 'Veritabanına bağlanmak, sorgu çalıştırmak ve bağlantı havuzunu anlamak.', 3, 4, [doc('Go Docs: Accessing a relational database')]),
        opt('slog', 'log/slog ile loglama', 'Yapılandırılmış log yazmak; üretimde sorun izlemek için faydalı.', 2, 1, [doc('Go Blog: Structured Logging with slog')]),
      ],
    },
    {
      id: 'testing-perf',
      title: 'Test ve performans',
      emoji: '🧪',
      topics: [
        t('testing', 'testing paketi', 'go test, tablo tabanlı testler ve alt testler; Go’da test dil araçlarının içindedir.', 2, 4, [doc('Go Docs: Add a test'), doc('Go Blog: Using Subtests and Sub-benchmarks')]),
        t('httptest', 'HTTP testleri', 'httptest ile handler’ları gerçek sunucu açmadan denemek.', 3, 2, [doc('Go Docs: Package httptest')]),
        t('benchmarks', 'Benchmark', 'testing.B ile kodun hızını ölçmek; tahmin etmeden optimize etmeni sağlar.', 3, 2, [doc('Go Blog: Using Subtests and Sub-benchmarks')]),
        t('profiling', 'pprof ile profilleme', 'CPU ve bellek kullanımını ölçüp darboğazı bulmak; kaçış analizi ve çöp toplayıcıya giriş.', 3, 4, [doc('Go Blog: Profiling Go Programs'), doc('Go Docs: Diagnostics')]),
      ],
    },
    {
      id: 'project',
      title: 'Proje / kariyer',
      emoji: '🏁',
      topics: [
        t('portfolio-project', 'Portfolyo projesi', 'Veritabanı ve testi olan bir REST API ya da CLI aracı yaz, Docker ile paketleyip yayına al.', 3, 25, [course('Boot.dev: Go'), prac('Exercism: Go yolu')]),
        t('interview-prep', 'Mülakat hazırlığı', 'Slice, interface, goroutine ve channel sorularını çalış; algoritma problemleriyle pratik yap.', 3, 10, [prac('LeetCode'), prac('Gophercises')]),
      ],
    },
  ],
};
