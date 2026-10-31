import { alt, book, course, doc, opt, prac, t, vid, type DevRoadmap } from './types';

export const IOS: DevRoadmap = {
  id: 'ios',
  kind: 'role',
  title: 'iOS Geliştirici',
  tagline: 'Swift ve SwiftUI ile iPhone uygulaması yap, App Store’a yayınla.',
  emoji: '📱',
  hue: 'sky',
  sections: [
    {
      id: 'swift-basics',
      title: 'Swift temelleri',
      emoji: '🧱',
      topics: [
        t('swift-syntax', 'Değişkenler, tipler ve akış', 'let/var, temel tipler, koşullar, döngüler ve fonksiyonlar; Swift’in yazım düzeni.', 1, 6, [book('The Swift Programming Language (Apple, ücretsiz)'), course('Apple: Develop in Swift Tutorials')]),
        t('optionals', 'Optional değerler', 'Değer olmayabilir durumunu güvenle yönetmek; if let, guard let ve nil birleştirme.', 1, 3, [doc('The Swift Programming Language: Optional Chaining')]),
        t('collections-closures', 'Koleksiyonlar ve closure’lar', 'Array, Dictionary, Set ile map/filter/reduce; closure, Swift’te her yerde kullanılır.', 1, 5, [course('Hacking with Swift: 100 Days of SwiftUI')]),
        t('structs-classes', 'Struct, class ve enum', 'Değer ve referans tipi farkı; hangisini ne zaman seçeceğini bilmek hataları azaltır.', 1, 5, [doc('The Swift Programming Language: Structures and Classes')]),
        t('protocols-generics', 'Protocol ve generic’ler', 'Ortak davranışı protocol ile tanımla, generic ile tekrar eden kodu azalt.', 2, 5, [doc('The Swift Programming Language: Protocols')]),
        t('error-handling', 'Hata yönetimi', 'throws, try, do-catch ile hataları düzgün karşılamak; uygulamanın çökmesini önler.', 2, 2, [doc('The Swift Programming Language: Error Handling')]),
      ],
    },
    {
      id: 'tools',
      title: 'Xcode ve araçlar',
      emoji: '🛠️',
      topics: [
        t('xcode-basics', 'Xcode’a giriş', 'Proje yapısı, hedefler (target), Simulator ve cihazda çalıştırma.', 1, 3, [doc('Apple: Xcode Documentation')]),
        t('debugging', 'Hata ayıklama', 'Breakpoint, değişken inceleme ve konsol çıktısı ile hatayı bulmak.', 1, 2, [doc('Apple: Debugging with Xcode')]),
        opt('instruments', 'Instruments ile ölçüm', 'Bellek sızıntısı ve yavaş kod bölümlerini profilleyici ile yakala.', 3, 3, [vid('WWDC: Instruments oturumları')]),
      ],
    },
    {
      id: 'swiftui',
      title: 'SwiftUI',
      emoji: '🎨',
      topics: [
        t('views-layout', 'Görünümler ve yerleşim', 'Text, Image, VStack, HStack, ZStack ve değiştiriciler (modifier) ile ekran kurmak.', 1, 6, [doc('Apple: SwiftUI Tutorials'), course('Stanford CS193p')]),
        t('state', 'Durum yönetimi', '@State, @Binding, @Observable: veri değişince ekran kendiliğinden yenilenir.', 1, 6, [doc('Apple Docs: Managing model data in your app')]),
        t('lists-forms', 'Liste ve formlar', 'List, ForEach, TextField, Toggle ve Form ile veri girişi ve listeleme ekranları.', 1, 5, [course('Hacking with Swift: 100 Days of SwiftUI')]),
        t('navigation', 'Gezinme', 'NavigationStack, TabView ve sheet ile ekranlar arası geçiş.', 2, 4, [doc('Apple Docs: Navigation')]),
        opt('animations', 'Animasyonlar', 'withAnimation ve geçişlerle arayüzü canlandırmak.', 2, 3, [doc('Apple Docs: Animations')]),
      ],
    },
    {
      id: 'uikit',
      title: 'UIKit’e giriş',
      emoji: '🧩',
      topics: [
        opt('uikit-intro', 'UIKit temelleri', 'UIViewController ve Auto Layout; eski projelerde hâlâ çok karşına çıkar.', 2, 8, [doc('Apple: UIKit Documentation'), course('Hacking with Swift: 100 Days of UIKit')]),
        opt('uikit-swiftui', 'UIKit ile SwiftUI’ı birlikte kullanmak', 'UIViewRepresentable ve UIHostingController ile iki dünyayı birleştir.', 3, 3, [doc('Apple Docs: UIKit integration')]),
      ],
    },
    {
      id: 'data-network',
      title: 'Veri ve ağ',
      emoji: '🌐',
      topics: [
        t('urlsession', 'URLSession ile ağ istekleri', 'GET/POST isteği atıp sunucudan veri almak; mobil uygulamaların temeli.', 2, 4, [doc('Apple Docs: URLSession')]),
        t('codable', 'Codable ve JSON', 'JSON verisini Swift tiplerine çevirmek ve geri yazmak.', 2, 3, [doc('Apple Docs: Encoding and Decoding Custom Types')]),
        t('async-await', 'async/await ve eşzamanlılık', 'Ağ çağrısı beklerken arayüzü dondurmadan çalışmak; Task ve actor temelleri.', 2, 5, [doc('The Swift Programming Language: Concurrency')]),
      ],
    },
    {
      id: 'persistence',
      title: 'Kalıcı veri',
      emoji: '🗄️',
      topics: [
        t('userdefaults', 'UserDefaults ve Keychain', 'Küçük ayarlar için UserDefaults, parola ve token gibi gizli veri için Keychain.', 2, 2, [doc('Apple Docs: UserDefaults'), doc('Apple Docs: Keychain Services')]),
        t('swiftdata', 'SwiftData', 'Modelleri doğrudan Swift koduyla tanımlayıp cihazda saklamak; SwiftUI ile uyumlu.', 2, 6, [doc('Apple Docs: SwiftData')]),
        alt('core-data', 'Core Data', 'SwiftData’dan önceki köklü veri katmanı; eski projelerde yaygındır.', 3, 8, [doc('Apple Docs: Core Data')]),
      ],
    },
    {
      id: 'architecture-quality',
      title: 'Mimari ve kalite',
      emoji: '🏗️',
      topics: [
        t('mvvm', 'MVVM mimarisi', 'Arayüz ile iş mantığını ayır; kod hem okunur hem test edilebilir olur.', 2, 4, [doc('Apple Docs: Managing model data in your app')]),
        t('testing', 'Birim ve arayüz testleri', 'Swift Testing, XCTest ve UI testleri ile kodun bozulmadığından emin ol.', 2, 5, [doc('Apple Docs: Swift Testing'), doc('Apple Docs: XCTest')]),
        t('accessibility', 'Erişilebilirlik', 'VoiceOver, Dynamic Type ve yeterli kontrast; uygulamayı herkes kullanabilsin.', 2, 3, [doc('Apple: Human Interface Guidelines — Accessibility')]),
        opt('di', 'Bağımlılık enjeksiyonu', 'Bağımlılıkları dışarıdan vererek kodu esnek ve test edilebilir kılmak.', 3, 3, [doc('The Swift Programming Language: Protocols')]),
      ],
    },
    {
      id: 'release',
      title: 'Yayınlama',
      emoji: '🚢',
      topics: [
        t('signing', 'Sertifika ve imzalama', 'Apple Developer hesabı, sertifika ve provisioning profili ne işe yarar?', 2, 3, [doc('Apple: Developer Program Documentation')]),
        t('testflight', 'TestFlight ile test dağıtımı', 'Uygulamayı yayınlamadan önce gerçek kullanıcılara denetle.', 2, 2, [doc('App Store Connect Help: TestFlight')]),
        t('app-store', 'App Store’a gönderme', 'Mağaza sayfası, gizlilik bilgileri ve inceleme kurallarına uyum.', 3, 4, [doc('App Store Review Guidelines')]),
      ],
    },
    {
      id: 'project',
      title: 'Proje ve kariyer',
      emoji: '🏆',
      topics: [
        t('portfolio-app', 'Portfolyo uygulaması', 'Ağdan veri çeken, yerel kayıt tutan ve App Store’a hazır tam bir uygulama yap.', 3, 30, [prac('Apple: Develop in Swift Tutorials')]),
        opt('interview', 'Mülakat hazırlığı', 'Swift temelleri, bellek yönetimi (ARC) ve SwiftUI sorularına çalış.', 3, 6, [prac('LeetCode')]),
      ],
    },
  ],
};
