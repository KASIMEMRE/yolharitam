import { alt, book, course, doc, opt, prac, t, type DevRoadmap } from './types';

export const BACKEND: DevRoadmap = {
  id: 'backend',
  kind: 'role',
  title: 'Backend Geliştirici',
  tagline: 'Sunucuyu, API’leri ve verinin güvenle saklanmasını üstlen.',
  emoji: '⚙️',
  hue: 'violet',
  sections: [
    {
      id: 'internet',
      title: 'İnternet ve temel kavramlar',
      emoji: '🌐',
      topics: [
        t('how-web', 'İstemci-sunucu modeli', 'Bir isteğin tarayıcıdan sunucuya gidip cevapla dönmesi.', 1, 2, [doc('MDN Web Docs: How the web works')]),
        t('http', 'HTTP derinlemesine', 'Yöntemler, durum kodları, başlıklar, çerezler ve önbellek başlıkları.', 1, 3, [doc('MDN Web Docs: HTTP')]),
        t('dns', 'DNS ve alan adları', 'Ad çözümleme, kayıt türleri (A, CNAME, MX) ve yayılma süresi.', 1, 2, [doc('Cloudflare Learning Center: DNS')]),
        opt('os-basics', 'İşletim sistemi temelleri', 'Süreçler, iş parçacıkları, bellek ve dosya sistemi.', 2, 4, [book('Operating Systems: Three Easy Pieces (ücretsiz)')]),
      ],
    },
    {
      id: 'language',
      title: 'Bir dil seç',
      emoji: '💬',
      topics: [
        t('node', 'JavaScript / Node.js', 'Ön yüzle aynı dili kullanır; hızlı başlangıç ve geniş paket ekosistemi.', 1, 15, [doc('Node.js Learn'), course('The Odin Project: NodeJS')]),
        alt('python', 'Python', 'Okunaklı sözdizimi; Django ve FastAPI ile güçlü web çatıları.', 1, 15, [doc('Python Resmi Eğitimi (docs.python.org)')]),
        alt('go', 'Go', 'Basit, hızlı ve eşzamanlılıkta güçlü; bulut altyapısında çok yaygın.', 2, 15, [doc('A Tour of Go'), book('Go by Example')]),
        alt('java', 'Java', 'Kurumsal dünyada ve bankacılıkta yaygın; Spring Boot ile web geliştirme.', 2, 18, [doc('dev.java Learn'), doc('Spring Guides')]),
        alt('csharp', 'C# / .NET', 'Microsoft ekosistemi; ASP.NET Core ile performanslı API’ler.', 2, 18, [doc('Microsoft Learn: ASP.NET Core')]),
      ],
    },
    {
      id: 'vcs',
      title: 'Sürüm kontrolü',
      emoji: '🌿',
      topics: [
        t('git', 'Git temelleri', 'commit, branch, merge, rebase ve çakışma çözme.', 1, 4, [doc('Pro Git (kitap, ücretsiz)')]),
        t('github', 'GitHub ile ekip çalışması', 'Pull Request, kod incelemesi ve issue takibi.', 1, 2, [course('GitHub Skills')]),
      ],
    },
    {
      id: 'databases',
      title: 'Veritabanları',
      emoji: '🗄️',
      topics: [
        t('sql-basics', 'İlişkisel veritabanı ve SQL', 'Tablolar, ilişkiler, SELECT/JOIN/GROUP BY ve normalizasyon.', 1, 8, [prac('SQLBolt'), doc('PostgreSQL Tutorial')]),
        t('postgres', 'PostgreSQL', 'En çok önerilen açık kaynak veritabanı: indeksler, kısıtlar, işlemler (transaction).', 2, 6, [doc('PostgreSQL Docs')]),
        alt('mysql', 'MySQL', 'Yaygın bir alternatif; özellikle PHP projelerinde.', 2, 5, [doc('MySQL Docs')]),
        t('orm', 'ORM ve migration', 'Prisma, SQLAlchemy gibi araçlarla şemayı kodla yönetmek.', 2, 4, [doc('Prisma Docs')]),
        opt('nosql', 'NoSQL: MongoDB', 'Belge tabanlı veri; ne zaman ilişkisel yerine tercih edilir?', 2, 4, [course('MongoDB University')]),
        t('db-advanced', 'Veritabanı ileri konular', 'İndeks stratejisi, ACID, izolasyon seviyeleri, N+1 sorunu.', 3, 5, [book('Use The Index, Luke (ücretsiz)')]),
      ],
    },
    {
      id: 'apis',
      title: 'API geliştirme',
      emoji: '🔌',
      topics: [
        t('rest', 'REST API tasarımı', 'Kaynak adlandırma, doğru HTTP yöntemleri, sayfalama ve hata biçimleri.', 1, 5, [doc('Microsoft: REST API design best practices')]),
        t('framework', 'Web çatısı (framework)', 'Express, FastAPI, Gin ya da Spring ile ilk API’ni yaz.', 1, 8, [doc('Express Docs'), doc('FastAPI Docs')]),
        t('validation', 'Girdi doğrulama ve hata yönetimi', 'Gelen veriyi doğrula, anlamlı hata kodları dön.', 2, 3, [doc('Zod Docs'), doc('Pydantic Docs')]),
        opt('graphql', 'GraphQL', 'İstemcinin ihtiyacı kadar veri istediği sorgu dili.', 3, 5, [doc('graphql.org/learn')]),
        opt('grpc', 'gRPC', 'Servisler arası hızlı, şemalı iletişim.', 3, 4, [doc('grpc.io Docs')]),
        t('api-docs', 'API dokümantasyonu', 'OpenAPI (Swagger) ile API’ni belgeleyip test edilebilir kıl.', 2, 2, [doc('OpenAPI Specification')]),
      ],
    },
    {
      id: 'auth',
      title: 'Kimlik doğrulama ve güvenlik',
      emoji: '🔐',
      topics: [
        t('authn', 'Oturum, JWT ve OAuth', 'Kullanıcıyı tanıma yöntemleri ve hangisinin ne zaman kullanılacağı.', 2, 5, [doc('jwt.io Introduction'), doc('OAuth 2.0 Simplified (Aaron Parecki)')]),
        t('hashing', 'Parola saklama', 'Parolalar asla düz saklanmaz: bcrypt/argon2 ile özetleme (hash).', 2, 2, [doc('OWASP Password Storage Cheat Sheet')]),
        t('owasp', 'OWASP Top 10', 'SQL enjeksiyonu, kırık erişim denetimi gibi en yaygın açıklar.', 2, 4, [doc('OWASP Top 10')]),
        opt('authz', 'Yetkilendirme (RBAC)', 'Rol tabanlı erişim; kim neyi yapabilir?', 3, 3, [doc('OWASP Authorization Cheat Sheet')]),
      ],
    },
    {
      id: 'testing',
      title: 'Test',
      emoji: '🧪',
      topics: [
        t('unit', 'Birim testleri', 'İş mantığını küçük, hızlı testlerle güvenceye al.', 2, 4, [doc('Jest Docs'), doc('pytest Docs')]),
        t('integration', 'Entegrasyon testleri', 'API uçlarını gerçek veritabanıyla birlikte test et.', 3, 4, [doc('Supertest (npm)'), doc('Testcontainers Docs')]),
      ],
    },
    {
      id: 'scaling',
      title: 'Performans ve ölçeklenme',
      emoji: '📈',
      topics: [
        t('caching', 'Önbellekleme (Redis)', 'Sık okunan veriyi hafızada tut; önbellek geçersizleştirme stratejileri.', 3, 4, [doc('Redis University')]),
        t('queues', 'Mesaj kuyrukları', 'Uzun işleri arka plana at: RabbitMQ, BullMQ ya da Kafka.', 3, 4, [doc('RabbitMQ Tutorials')]),
        opt('websockets', 'Gerçek zamanlı iletişim', 'WebSocket ve Server-Sent Events ile anlık veri.', 3, 3, [doc('MDN Web Docs: WebSockets API')]),
        t('system-design', 'Sistem tasarımı temelleri', 'Yük dengeleme, yatay ölçekleme, CAP teoremi, mikroservis mi monolit mi?', 3, 10, [book('System Design Primer (GitHub)'), book('Designing Data-Intensive Applications')]),
      ],
    },
    {
      id: 'devops',
      title: 'Yayına alma ve işletme',
      emoji: '🚢',
      topics: [
        t('linux', 'Linux komut satırı', 'Dosyalar, izinler, süreçler, SSH ile sunucuya bağlanma.', 1, 5, [book('The Linux Command Line (ücretsiz)')]),
        t('docker', 'Docker', 'Uygulamanı konteynere koy; her yerde aynı çalışsın.', 2, 5, [doc('Docker Docs: Get started')]),
        t('ci-cd', 'CI/CD', 'Her push’ta test ve otomatik yayın: GitHub Actions.', 2, 3, [doc('GitHub Actions Docs')]),
        opt('cloud', 'Bulut platformu', 'AWS, GCP ya da Azure’da temel servisler; ya da Render/Railway gibi kolay platformlar.', 3, 6, [course('AWS Skill Builder')]),
        t('observability', 'Loglama ve izleme', 'Yapılandırılmış log, metrikler ve hata izleme (Sentry).', 3, 3, [doc('OpenTelemetry Docs')]),
      ],
    },
    {
      id: 'career',
      title: 'Projeler ve kariyer',
      emoji: '🚀',
      topics: [
        t('project-api', 'Proje: Tam bir REST API', 'Kimlik doğrulamalı, veritabanlı, testli ve belgelenmiş bir API (ör. not uygulaması).', 2, 20, [prac('roadmap.sh projeler sayfası (fikir için)')]),
        t('project-deploy', 'Proje: Canlı servis', 'API’ni Docker ile paketle, CI ile test et, buluta yayınla.', 3, 10, [prac('Docker Docs: Get started'), doc('GitHub Docs: GitHub Actions'), doc('Render Docs: Deploy a Web Service')]),
        opt('interview', 'Mülakat hazırlığı', 'Veri yapıları, SQL soruları ve sistem tasarımı mülakatları.', 3, 10, [prac('LeetCode'), book('System Design Interview (Alex Xu)')]),
      ],
    },
  ],
};
