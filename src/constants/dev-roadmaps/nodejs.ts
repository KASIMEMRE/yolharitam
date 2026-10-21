import { alt, book, course, doc, opt, prac, t, type DevRoadmap } from './types';

export const NODEJS: DevRoadmap = {
  id: 'nodejs',
  kind: 'skill',
  title: 'Node.js',
  tagline: 'JavaScript’i sunucuda çalıştır: API’ler, araçlar ve gerçek zamanlı uygulamalar.',
  emoji: '🟩',
  hue: 'leaf',
  sections: [
    {
      id: 'intro',
      title: 'Giriş',
      emoji: '🧱',
      topics: [
        t('what', 'Node.js nedir?', 'V8 motoru, tarayıcı dışındaki JavaScript, kullanım alanları.', 1, 1, [doc('Node.js Learn')]),
        t('install', 'Kurulum ve sürüm yönetimi', 'LTS sürüm, nvm/fnm ile sürüm değiştirme.', 1, 1, []),
        t('repl-scripts', 'Betik çalıştırma', 'node ile dosya çalıştırma, process.argv, ortam değişkenleri.', 1, 2, []),
      ],
    },
    {
      id: 'modules',
      title: 'Modüller ve paketler',
      emoji: '📦',
      topics: [
        t('esm-cjs', 'ES Modules ve CommonJS', 'import/export ile require farkı; package.json "type".', 1, 2, [doc('Node.js Docs: Modules')]),
        t('npm', 'npm ve package.json', 'Bağımlılık, sürüm aralıkları, script’ler, lock dosyası.', 1, 2, [doc('npm Docs')]),
        alt('pnpm', 'pnpm', 'Disk dostu ve hızlı alternatif paket yöneticisi.', 2, 1, [doc('pnpm Docs')]),
      ],
    },
    {
      id: 'async',
      title: 'Asenkron programlama',
      emoji: '⏱',
      topics: [
        t('event-loop', 'Olay döngüsü', 'Tek iş parçacıklı model, makro/mikro görevler.', 2, 3, [doc('Node.js Learn: The Node.js Event Loop')]),
        t('promises', 'Promise ve async/await', 'Paralel ve sıralı işlemler, hata yakalama.', 1, 3, [doc('javascript.info: Promises, async/await')]),
        t('events', 'EventEmitter', 'Olay tabanlı programlama.', 2, 1, []),
        opt('streams', 'Akışlar (streams)', 'Büyük veriyi parça parça işlemek.', 3, 3, [doc('Node.js Docs: Stream')]),
      ],
    },
    {
      id: 'core-modules',
      title: 'Yerleşik modüller',
      emoji: '🧰',
      topics: [
        t('fs-path', 'fs ve path', 'Dosya okuma/yazma, klasörler, yollar.', 1, 2, []),
        t('http-module', 'http modülü', 'Çatı kullanmadan basit bir sunucu yaz.', 2, 2, []),
        opt('crypto', 'crypto', 'Özet (hash), rastgele değer, şifreleme temelleri.', 3, 2, []),
        opt('worker-threads', 'Worker threads ve child process', 'CPU-yoğun işleri ana iş parçacığından ayırmak.', 3, 3, []),
      ],
    },
    {
      id: 'web',
      title: 'Web sunucusu',
      emoji: '🌐',
      topics: [
        t('express', 'Express', 'Rotalar, ara katmanlar, hata yönetimi.', 1, 5, [doc('Express Docs')]),
        alt('fastify', 'Fastify', 'Hızlı, şema tabanlı alternatif.', 2, 4, [doc('Fastify Docs')]),
        alt('nestjs', 'NestJS', 'Kurumsal projeler için yapılandırılmış çatı.', 3, 10, [doc('NestJS Docs')]),
        t('rest', 'REST API ve doğrulama', 'CRUD uçları, Zod ile girdi doğrulama.', 2, 4, []),
        t('auth', 'Kimlik doğrulama', 'Oturum/JWT, parola özetleme (bcrypt).', 2, 4, [doc('OWASP Authentication Cheat Sheet')]),
        opt('realtime', 'Gerçek zamanlı: WebSocket', 'Socket.IO ya da ws ile anlık iletişim.', 3, 3, [doc('Socket.IO Docs')]),
      ],
    },
    {
      id: 'data',
      title: 'Veritabanı',
      emoji: '🗄️',
      topics: [
        t('sql-driver', 'PostgreSQL bağlantısı', 'pg ile sorgu, bağlantı havuzu.', 2, 3, []),
        t('orm', 'ORM: Prisma ya da Drizzle', 'Şema, migration, tip güvenli sorgular.', 2, 4, [doc('Prisma Docs'), doc('Drizzle ORM Docs')]),
        opt('mongoose', 'MongoDB + Mongoose', 'Belge tabanlı veritabanı alternatifi.', 2, 3, [course('MongoDB University')]),
      ],
    },
    {
      id: 'quality',
      title: 'Kalite ve üretim',
      emoji: '🚢',
      topics: [
        t('testing', 'Test', 'node:test ya da Vitest ile birim, Supertest ile API testleri.', 2, 4, [doc('Node.js Docs: Test runner')]),
        t('errors-logging', 'Hata yönetimi ve loglama', 'Yakalanmamış hatalar, pino ile yapılandırılmış log.', 2, 2, [doc('pino Docs')]),
        t('security', 'Güvenlik', 'helmet, hız sınırlama, bağımlılık denetimi (npm audit).', 3, 3, [doc('Node.js Security Best Practices')]),
        t('deploy', 'Yayına alma', 'Ortam değişkenleri, Docker, Render/Railway.', 2, 3, []),
        opt('performance', 'Performans', 'Profil çıkarma, önbellek, cluster.', 3, 3, [book('Node.js Design Patterns')]),
      ],
    },
    {
      id: 'projects',
      title: 'Projeler',
      emoji: '🚀',
      topics: [
        t('project-cli', 'Proje: Komut satırı aracı', 'Dosyaları düzenleyen ya da API’den veri çeken bir CLI.', 1, 5, []),
        t('project-api', 'Proje: Tam REST API', 'Kimlik doğrulamalı, veritabanlı, testli bir API.', 2, 20, [prac('roadmap.sh projeler sayfası (fikir için)')]),
      ],
    },
  ],
};
