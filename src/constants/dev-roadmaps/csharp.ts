import { book, course, doc, opt, prac, t, vid, type DevRoadmap } from './types';

export const CSHARP: DevRoadmap = {
  id: 'csharp',
  kind: 'skill',
  title: 'C# ve .NET',
  tagline: 'Web API, masaüstü ve bulut için modern Microsoft yığını.',
  emoji: '🔷',
  hue: 'violet',
  sections: [
    {
      id: 'basics',
      title: 'Dil temelleri',
      emoji: '🌱',
      topics: [
        t('first-program', 'İlk program ve araçlar', 'dotnet new ile konsol uygulaması aç, Visual Studio ya da VS Code ile çalıştır.', 1, 2, [doc('Microsoft Learn: C# Tour'), course('Microsoft Learn: C# ile başlangıç')]),
        t('types-vars', 'Değişkenler ve tipler', 'int, string, bool, var ve nullable tipler; değer tipi ile referans tipi farkı.', 1, 3, [doc('Microsoft Learn: C# Fundamentals'), course('freeCodeCamp: C# kursu')]),
        t('control-flow', 'Akış kontrolü', 'if, switch ifadeleri ve döngüler; pattern matching ile okunaklı karar yazımı.', 1, 3, [doc('Microsoft Learn: C# Fundamentals'), prac('Exercism: C# yolu')]),
        t('methods', 'Metotlar', 'Parametreler, dönüş değerleri, isteğe bağlı ve adlandırılmış argümanlar; kodu parçalara ayırmak.', 1, 3, [doc('Microsoft Learn: Methods'), book('C# Yellow Book')]),
        t('collections', 'Koleksiyonlar', 'Array, List<T>, Dictionary<TKey,TValue>; veriyi uygun yapıda tutmak.', 1, 4, [doc('Microsoft Learn: Collections'), prac('Exercism: C# yolu')]),
        t('exceptions', 'İstisna yönetimi', 'try/catch/finally ve using ile hatalara karşı dayanıklı kod; kaynakların düzgün kapatılması.', 2, 2, [doc('Microsoft Learn: Exceptions')]),
      ],
    },
    {
      id: 'oop',
      title: 'Nesne yönelimli programlama',
      emoji: '🧩',
      topics: [
        t('classes', 'Sınıf, property ve constructor', 'Nesneleri alanlar ve property’lerle modellemek; C# property sözdizimi çok pratiktir.', 1, 4, [doc('Microsoft Learn: Classes'), book('C# Yellow Book')]),
        t('inheritance', 'Kalıtım ve çok biçimlilik', 'virtual, override ve base; aynı arayüzle farklı davranışları yönetmek.', 2, 3, [doc('Microsoft Learn: Inheritance')]),
        t('interfaces', 'Arayüzler', 'Sözleşme tanımlamak ve bağımlılığı soyutlamak; test edilebilir tasarımın temelidir.', 2, 3, [doc('Microsoft Learn: Interfaces'), book('Dependency Injection in .NET')]),
        t('records-structs', 'Record, struct ve enum', 'Değişmez veri için record, hafif değer tipleri için struct; modern C# kodunun sık kullanılan parçaları.', 2, 3, [doc('Microsoft Learn: Records'), doc('Microsoft Learn: Structure types')]),
        t('generics', 'Generics', 'Tipten bağımsız, güvenli ve yeniden kullanılabilir sınıf ve metotlar yazmak.', 2, 3, [doc('Microsoft Learn: Generics')]),
      ],
    },
    {
      id: 'linq',
      title: 'LINQ ve fonksiyonel öğeler',
      emoji: '🔍',
      topics: [
        t('lambdas-delegates', 'Lambda ve delegate’ler', 'Fonksiyonu değer gibi taşımak; Func, Action ve olay (event) yapısının temeli.', 2, 3, [doc('Microsoft Learn: Lambda expressions'), doc('Microsoft Learn: Delegates')]),
        t('linq-basics', 'LINQ temelleri', 'Where, Select, OrderBy ve GroupBy ile koleksiyonları sorgulamak; döngüden çok daha kısa yazılır.', 2, 4, [doc('Microsoft Learn: LINQ'), prac('Exercism: C# yolu')]),
        t('linq-deferred', 'Ertelenmiş çalışma', 'LINQ sorgusu ne zaman çalışır? ToList ve IEnumerable farkı, performans tuzakları.', 3, 2, [doc('Microsoft Learn: LINQ: Deferred execution')]),
        opt('nullable-refs', 'Nullable referans tipleri', 'Derleyicinin null hatalarını önceden uyarması; NullReferenceException’ı azaltır.', 2, 2, [doc('Microsoft Learn: Nullable reference types')]),
      ],
    },
    {
      id: 'async',
      title: 'Asenkron programlama',
      emoji: '⏳',
      topics: [
        t('async-await', 'async ve await', 'Task döndüren metotlarla beklerken iş parçacığını bloklamamak; web sunucularında şarttır.', 2, 4, [doc('Microsoft Learn: Asynchronous programming'), vid('Nick Chapsas: async/await')]),
        t('tasks', 'Task ve paralel iş', 'Task.WhenAll, iptal belirteci (CancellationToken) ve zaman aşımı yönetimi.', 3, 3, [doc('Microsoft Learn: Task-based asynchronous pattern')]),
        opt('threads-sync', 'Thread ve senkronizasyon', 'lock ve eşzamanlı koleksiyonlar; yarış durumundan kaçınma yolları.', 3, 3, [doc('Microsoft Learn: Managed threading')]),
      ],
    },
    {
      id: 'dotnet-tooling',
      title: '.NET SDK ve CLI',
      emoji: '🛠️',
      topics: [
        t('dotnet-cli', 'dotnet CLI', 'new, build, run, test ve publish komutlarıyla projeyi terminalden yönetmek.', 1, 2, [doc('Microsoft Learn: .NET CLI')]),
        t('solution-structure', 'Çözüm ve proje yapısı', '.sln, .csproj dosyaları ve katmanlı proje düzeni; büyüyen kodu düzenli tutar.', 2, 2, [doc('Microsoft Learn: Project SDK')]),
        t('nuget', 'NuGet paketleri', 'Hazır kütüphaneleri projeye eklemek ve sürüm yönetmek; JavaScript’teki npm’in karşılığıdır.', 1, 2, [doc('Microsoft Learn: NuGet')]),
        opt('runtime-basics', 'CLR ve çöp toplayıcı', '.NET çalışma zamanı, JIT derleme ve bellek yönetimi; performans için temel bilgi.', 3, 3, [doc('Microsoft Learn: .NET Runtime')]),
      ],
    },
    {
      id: 'aspnet',
      title: 'ASP.NET Core Web API',
      emoji: '🌐',
      topics: [
        t('minimal-api', 'Minimal API ve controller’lar', 'HTTP uç noktalarını (GET, POST…) tanımlayıp JSON döndüren ilk servisini yazmak.', 2, 5, [doc('Microsoft Learn: ASP.NET Core Web API'), course('Microsoft Learn: Web API öğrenme yolu')]),
        t('di', 'Bağımlılık enjeksiyonu', 'Servisleri yerleşik DI kapsayıcısına kaydedip kullanmak; gevşek bağlı ve test edilebilir kod.', 2, 3, [doc('Microsoft Learn: Dependency injection')]),
        t('middleware-config', 'Middleware ve yapılandırma', 'İstek hattı, appsettings ve ortam değişkenleri; loglama ve hata yakalama burada yapılır.', 2, 3, [doc('Microsoft Learn: ASP.NET Core Middleware'), doc('Microsoft Learn: Configuration')]),
        t('auth', 'Kimlik doğrulama ve yetkilendirme', 'JWT ve rol tabanlı erişimle uç noktaları korumak.', 3, 5, [doc('Microsoft Learn: ASP.NET Core Security')]),
        opt('validation-swagger', 'Doğrulama ve OpenAPI', 'Gelen veriyi doğrulamak ve API’yi otomatik belgelemek; istemci geliştiricilere kolaylık sağlar.', 2, 2, [doc('Microsoft Learn: OpenAPI')]),
      ],
    },
    {
      id: 'efcore',
      title: 'Entity Framework Core',
      emoji: '🗄️',
      topics: [
        t('ef-basics', 'DbContext ve modeller', 'Sınıflarını veritabanı tablolarına eşlemek; EF Core’un temel çalışma biçimi.', 2, 4, [doc('Microsoft Learn: EF Core'), course('Microsoft Learn: EF Core öğrenme yolu')]),
        t('migrations', 'Migration’lar', 'Şema değişikliklerini kodla sürümlemek ve veritabanına uygulamak.', 2, 3, [doc('Microsoft Learn: EF Core Migrations')]),
        t('ef-queries', 'Sorgular ve ilişkiler', 'LINQ ile sorgu, Include ile ilişkili veri ve N+1 sorgu sorununu önlemek.', 3, 4, [doc('Microsoft Learn: Querying data'), doc('Microsoft Learn: Relationships')]),
        opt('dapper', 'Dapper ile ham SQL', 'Hafif bir mikro ORM; performans kritik sorgularda EF Core’a seçenektir.', 3, 3, [doc('Dapper Docs')]),
      ],
    },
    {
      id: 'testing',
      title: 'Test',
      emoji: '🧪',
      topics: [
        t('xunit', 'xUnit ile birim testi', 'Fact ve Theory ile testleri yazmak; kodunu değiştirirken güvence verir.', 2, 4, [doc('xUnit.net Docs'), doc('Microsoft Learn: Unit testing C#')]),
        t('mocking', 'Taklit nesneler (Moq)', 'Bağımlılıkları sahte nesnelerle değiştirip sınıfı yalıtılmış test etmek.', 3, 3, [doc('Moq Docs')]),
        opt('integration-tests', 'Entegrasyon testi', 'WebApplicationFactory ile API’yi baştan sona test etmek.', 3, 3, [doc('Microsoft Learn: Integration tests in ASP.NET Core')]),
      ],
    },
    {
      id: 'project',
      title: 'Proje / kariyer',
      emoji: '🏁',
      topics: [
        t('portfolio-project', 'Portfolyo projesi', 'EF Core ve kimlik doğrulamalı, testli bir Web API yaz; Docker ya da buluta yayınla.', 3, 25, [course('Microsoft Learn: ASP.NET Core öğrenme yolu'), prac('Exercism: C# yolu')]),
        t('interview-prep', 'Mülakat hazırlığı', 'OOP, LINQ, async ve DI sorularını çalış; algoritma problemleriyle pratik yap.', 3, 10, [prac('LeetCode'), prac('Exercism: C# yolu')]),
      ],
    },
  ],
};
