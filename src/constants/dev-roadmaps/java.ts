import { book, course, doc, opt, prac, t, vid, type DevRoadmap } from './types';

export const JAVA: DevRoadmap = {
  id: 'java',
  kind: 'skill',
  title: 'Java',
  tagline: 'Nesne yönelimli, güçlü tipli ve kurumsal dünyanın dili.',
  emoji: '🧱',
  hue: 'coral',
  sections: [
    {
      id: 'syntax',
      title: 'Sözdizimi ve kurulum',
      emoji: '🌱',
      topics: [
        t('setup-jdk', 'JDK kurulumu ve ilk program', 'JDK, JRE ve derleme sürecini öğren; javac ile derleyip java ile çalıştır.', 1, 2, [doc('Oracle: Java Tutorials'), doc('dev.java: Learn')]),
        t('types-vars', 'Değişkenler ve veri tipleri', 'Ilkel tipler (int, double, boolean), String ve tip dönüşümü; Java’da her şeyin tipi bellidir.', 1, 3, [course('MOOC.fi: Java Programming'), doc('dev.java: Language Basics')]),
        t('control-flow', 'Karar ve döngüler', 'if, switch, for, while ve for-each ile programın akışını yönetirsin.', 1, 3, [prac('Exercism: Java yolu'), doc('Oracle: Java Tutorials')]),
        t('methods-arrays', 'Metotlar ve diziler', 'Kodu metotlara bölmek ve sabit uzunluklu dizilerle çalışmak; her programın yapı taşı.', 1, 4, [course('MOOC.fi: Java Programming'), doc('dev.java: Learn')]),
        t('strings-input', 'String ve girdi alma', 'String değişmezliği, StringBuilder ve Scanner ile kullanıcıdan veri okuma.', 1, 2, [doc('Oracle: Java Tutorials: Strings')]),
      ],
    },
    {
      id: 'oop',
      title: 'Nesne yönelimli programlama',
      emoji: '🧩',
      topics: [
        t('classes-objects', 'Sınıf ve nesneler', 'Alan, constructor ve metotlarla gerçek dünyadaki şeyleri modellemek; Java’nın merkezi fikri.', 1, 4, [book('Head First Java'), doc('Oracle: Java Tutorials: Classes and Objects')]),
        t('encapsulation', 'Kapsülleme', 'private alanlar ve getter/setter ile iç durumu korumak; kodu değişikliğe dayanıklı yapar.', 1, 2, [book('Effective Java'), doc('dev.java: Learn')]),
        t('inheritance-poly', 'Kalıtım ve çok biçimlilik', 'extends, override ve super; aynı arayüzle farklı davranışları kullanmanı sağlar.', 2, 4, [book('Head First Java'), doc('Oracle: Java Tutorials: Inheritance')]),
        t('interfaces-abstract', 'Arayüz ve soyut sınıflar', 'Sözleşme tanımlama, default metotlar ve soyut sınıfla arayüz arasındaki seçim.', 2, 3, [doc('Oracle: Java Tutorials: Interfaces'), book('Effective Java')]),
        t('records-enums', 'Record ve enum', 'Sabit değerler için enum, veri taşıyan sınıflar için record; kısa ve güvenli kod yazdırır.', 2, 2, [doc('dev.java: Records'), doc('Oracle: Java Tutorials: Enum Types')]),
      ],
    },
    {
      id: 'collections-errors',
      title: 'Koleksiyonlar, istisnalar ve generics',
      emoji: '🗂️',
      topics: [
        t('collections', 'Koleksiyonlar', 'List, Set ve Map arayüzleri ile ArrayList, HashSet, HashMap; veriyi doğru yapıda tutmak.', 2, 5, [doc('Oracle: Java Tutorials: Collections'), book('Effective Java')]),
        t('exceptions', 'İstisna yönetimi', 'try/catch/finally, checked ve unchecked istisnalar, try-with-resources ile hataya hazırlıklı kod.', 2, 3, [doc('Oracle: Java Tutorials: Exceptions'), book('Effective Java')]),
        t('generics', 'Generics', 'Tip parametreleriyle yeniden kullanılabilir ve tip güvenli kod; List<String> bunun örneği.', 2, 3, [doc('Oracle: Java Tutorials: Generics')]),
        t('io-files', 'Dosya işlemleri', 'Path, Files ve okuma/yazma ile dosyalarla çalışmak; metin ve veri saklamanın temeli.', 2, 3, [doc('Oracle: Java Tutorials: Essential Classes')]),
        opt('date-time', 'Tarih ve saat API’si', 'java.time paketi: LocalDate, Instant ve Duration ile eski Date sorunlarından kaçınmak.', 2, 2, [doc('Oracle: Java Tutorials: Date Time')]),
      ],
    },
    {
      id: 'functional',
      title: 'Lambda ve Stream',
      emoji: '🔁',
      topics: [
        t('lambdas', 'Lambda ifadeleri', 'Fonksiyonel arayüzlere kısa kod geçirmek; Comparator ve olay işleyicilerinde sık kullanılır.', 2, 3, [doc('Oracle: Java Tutorials: Lambda Expressions'), doc('dev.java: Learn')]),
        t('streams', 'Stream API', 'filter, map ve collect ile koleksiyonları bildirimsel işlemek; okunaklı veri dönüşümü sağlar.', 2, 4, [doc('Oracle: Java Tutorials: Streams'), book('Modern Java in Action')]),
        t('optional', 'Optional', 'null yerine “değer olmayabilir” demenin güvenli yolu; NullPointerException riskini azaltır.', 2, 2, [doc('Oracle: Java API: Optional')]),
      ],
    },
    {
      id: 'concurrency',
      title: 'Çoklu iş parçacığı',
      emoji: '♾️',
      topics: [
        t('threads', 'Thread ve Runnable', 'Aynı anda birden çok iş yürütmek; yarış durumu ve senkronizasyon kavramlarının girişi.', 3, 4, [doc('Oracle: Java Tutorials: Concurrency'), book('Java Concurrency in Practice')]),
        t('executors', 'ExecutorService ve CompletableFuture', 'Thread havuzları ve asenkron işler; elle thread yönetmekten çok daha güvenlidir.', 3, 4, [doc('Oracle: Java Tutorials: Concurrency'), book('Java Concurrency in Practice')]),
        opt('virtual-threads', 'Sanal thread’ler', 'Java 21 ile gelen hafif thread’ler; çok sayıda eşzamanlı isteği kolayca yönetir.', 3, 3, [doc('dev.java: Virtual Threads')]),
      ],
    },
    {
      id: 'jvm-tooling',
      title: 'JVM ve araçlar',
      emoji: '🛠️',
      topics: [
        t('jvm-basics', 'JVM nasıl çalışır?', 'Bytecode, sınıf yükleme, bellek bölgeleri ve çöp toplayıcı; performans sorunlarını anlamak için.', 3, 4, [doc('dev.java: JVM'), book('Effective Java')]),
        t('maven-gradle', 'Maven ve Gradle', 'Bağımlılık ve derleme yönetimi; pom.xml ya da build.gradle ile projeyi standart yapıya oturtur.', 1, 4, [doc('Maven Docs: Getting Started'), doc('Gradle Docs: Getting Started')]),
        t('junit', 'JUnit ile test', 'Birim testi yazmak, assertion kullanmak ve Mockito ile bağımlılıkları taklit etmek.', 2, 4, [doc('JUnit 5 User Guide'), doc('Mockito Docs')]),
        t('logging-debug', 'Loglama ve hata ayıklama', 'SLF4J ile log yazmak ve IDE debugger’ıyla adım adım ilerleyerek hatayı bulmak.', 2, 2, [doc('SLF4J Docs'), doc('IntelliJ IDEA: Debugging')]),
      ],
    },
    {
      id: 'spring-boot',
      title: 'Spring Boot’a giriş',
      emoji: '🌐',
      topics: [
        t('spring-core', 'Spring ve bağımlılık enjeksiyonu', 'Nesneleri sen değil çerçeve oluşturur; IoC ve DI kavramı Spring’in kalbidir.', 2, 4, [doc('Spring Docs: Core Container'), course('Spring Academy: Spring Core')]),
        t('rest-api', 'REST API yazmak', '@RestController, istek eşleme ve JSON dönüşümüyle ilk web servisini çıkar.', 2, 6, [doc('Spring Guides: Building a RESTful Web Service'), vid('Amigoscode: Spring Boot')]),
        t('spring-data', 'Spring Data JPA', 'Veritabanı tablolarına nesne gibi erişim; repository arayüzleriyle sorgu yazmayı kolaylaştırır.', 3, 6, [doc('Spring Guides: Accessing Data with JPA'), doc('Spring Data JPA Docs')]),
        opt('spring-security', 'Spring Security’ye bakış', 'Kimlik doğrulama ve yetkilendirmenin temel fikri; servisini korumaya başlamak için.', 3, 5, [doc('Spring Security Docs')]),
      ],
    },
    {
      id: 'project',
      title: 'Proje / kariyer',
      emoji: '🏁',
      topics: [
        t('portfolio-project', 'Portfolyo projesi', 'Veritabanı kullanan, testli bir REST API (ör. kitaplık ya da görev takibi) yaz ve yayına al.', 3, 25, [course('Spring Academy: Building a REST API'), prac('Exercism: Java yolu')]),
        t('interview-prep', 'Mülakat hazırlığı', 'Koleksiyonlar, OOP ve eşzamanlılık sorularını çalış; algoritma problemleriyle pratik yap.', 3, 10, [prac('LeetCode'), prac('Exercism: Java yolu')]),
      ],
    },
  ],
};
