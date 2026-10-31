import { alt, book, course, doc, opt, prac, t, type DevRoadmap } from './types';

export const QA_ENGINEER: DevRoadmap = {
  id: 'qa-engineer',
  kind: 'role',
  title: 'Test (QA) Mühendisi',
  tagline: 'Hataları kullanıcıdan önce bul; manuelden otomasyona kaliteyi güvenceye al.',
  emoji: '✅',
  hue: 'berry',
  sections: [
    {
      id: 'fundamentals',
      title: 'Test temelleri',
      emoji: '🧱',
      topics: [
        t('what-is-testing', 'Yazılım testi nedir?', 'Test neden yapılır, QA ile test arasındaki fark ve yazılım geliştirme yaşam döngüsündeki yeri.', 1, 3, [book('ISTQB Foundation Syllabus (ücretsiz)'), doc('Ministry of Testing: Başlangıç yazıları')]),
        t('principles', 'Test prensipleri', 'Tam test imkânsızdır, hatalar kümelenir; testçi gibi düşünmenin temel kuralları.', 1, 2, [book('ISTQB Foundation Syllabus (ücretsiz)')]),
        t('sdlc-agile', 'SDLC ve Agile’da test', 'Şelale ve Scrum süreçlerinde testçinin rolü; sprint içinde nasıl çalışılır?', 1, 3, [doc('Scrum Guide')]),
        t('test-levels', 'Test seviyeleri', 'Birim, entegrasyon, sistem ve kabul testleri; hangisi neyi yakalar?', 1, 3, [book('ISTQB Foundation Syllabus (ücretsiz)')]),
        t('test-types', 'Test türleri', 'Fonksiyonel, regresyon, duman (smoke), keşif, kullanılabilirlik ve güvenlik testi türleri.', 1, 3, [doc('Ministry of Testing')]),
      ],
    },
    {
      id: 'design-techniques',
      title: 'Test tasarım teknikleri',
      emoji: '📐',
      topics: [
        t('requirements', 'Gereksinim analizi', 'Gereksinimi okuyup belirsizlikleri bulmak; hatalar çoğu zaman burada başlar.', 1, 3, [book('ISTQB Foundation Syllabus (ücretsiz)')]),
        t('black-box', 'Kara kutu teknikleri', 'Denklik sınıfları, sınır değer analizi ve karar tabloları ile az testle çok hata yakalamak.', 1, 5, [book('ISTQB Foundation Syllabus (ücretsiz)')]),
        t('test-cases', 'Test senaryosu ve plan yazımı', 'Net adımlı, tekrarlanabilir test senaryoları ve test planı hazırlamak.', 1, 4, [doc('Ministry of Testing: Test case yazımı')]),
        t('exploratory', 'Keşif testi', 'Senaryo olmadan, merakla ve not tutarak uygulamayı kurcalamak.', 2, 3, [book('Explore It! (Elisabeth Hendrickson)')]),
      ],
    },
    {
      id: 'bug-tools',
      title: 'Hata raporlama ve araçlar',
      emoji: '🔍',
      topics: [
        t('bug-report', 'İyi hata raporu yazmak', 'Başlık, adımlar, beklenen ve gerçek sonuç, ekran görüntüsü; geliştirici tek okumada anlamalı.', 1, 2, [doc('Ministry of Testing: Bug raporu')]),
        t('jira', 'Jira ile hata ve iş takibi', 'Issue oluşturma, durum akışı ve panolar; ekiplerde en yaygın araç.', 1, 3, [doc('Atlassian: Jira Docs'), course('Atlassian University')]),
        t('test-management', 'Test yönetim araçları', 'TestRail veya Xray ile senaryoları, koşuları ve sonuçları düzenli tutmak.', 2, 3, [doc('TestRail Docs')]),
        t('browser-devtools', 'Tarayıcı geliştirici araçları', 'Konsol, ağ sekmesi ve elemanları inceleyerek hatanın nedenini daraltmak.', 1, 3, [doc('Chrome DevTools Docs')]),
      ],
    },
    {
      id: 'api-testing',
      title: 'API testi',
      emoji: '🔌',
      topics: [
        t('http-basics', 'HTTP ve REST temelleri', 'İstek, yanıt, durum kodları ve başlıklar; API testi için ön koşul.', 1, 3, [doc('MDN: HTTP')]),
        t('postman', 'Postman ile API testi', 'İstek gönderme, koleksiyon, ortam değişkeni ve otomatik doğrulama (assertion) yazma.', 2, 5, [doc('Postman Docs: Learning Center')]),
        opt('contract-testing', 'Sözleşme testi', 'İstemci ile sunucunun API beklentisini kopmadan doğrulamak (Pact).', 3, 3, [doc('Pact Docs')]),
        opt('sql-for-qa', 'Test için SQL', 'Veritabanına sorgu atıp verinin doğru kaydedildiğini doğrulamak.', 2, 5, [prac('SQLBolt')]),
      ],
    },
    {
      id: 'web-automation',
      title: 'Web otomasyonu',
      emoji: '🤖',
      topics: [
        t('programming-basics', 'Otomasyon için programlama', 'JavaScript/TypeScript ya da Python temelleri; otomasyon kod yazmayı gerektirir.', 1, 20, [course('freeCodeCamp'), book('Eloquent JavaScript')]),
        t('playwright', 'Playwright', 'Modern, hızlı tarayıcı otomasyonu; otomatik bekleme ve kolay hata ayıklama.', 2, 12, [doc('Playwright Docs')]),
        alt('cypress', 'Cypress', 'Playwright’a alternatif; arayüzü sevilen, JavaScript tabanlı test aracı.', 2, 12, [doc('Cypress Docs')]),
        alt('selenium', 'Selenium', 'En köklü web otomasyon aracı; birçok şirkette hâlâ kullanılır.', 2, 12, [doc('Selenium Docs')]),
        t('page-object', 'Page Object deseni', 'Sayfa işlemlerini sınıflara ayırıp testleri okunur ve bakımı kolay tutmak.', 3, 4, [doc('Playwright Docs: Page object models')]),
      ],
    },
    {
      id: 'mobile-performance',
      title: 'Mobil ve performans testi',
      emoji: '📱',
      topics: [
        t('mobile-testing', 'Mobil test temelleri', 'Cihaz çeşitliliği, ekran boyutları, kesintiler (arama, ağ kopması) ve mağaza kuralları.', 2, 4, [doc('Ministry of Testing: Mobil test')]),
        opt('appium', 'Appium ile mobil otomasyon', 'Android ve iOS uygulamalarını tek araçla otomatik test etmek.', 3, 8, [doc('Appium Docs')]),
        t('performance-basics', 'Performans testi temelleri', 'Yük, stres ve dayanıklılık testi; yanıt süresi ve eşzamanlı kullanıcı kavramları.', 2, 3, [doc('Grafana k6 Docs: Test types')]),
        t('k6', 'k6 ile yük testi', 'JavaScript ile senaryo yazıp API’ye yük bindirmek; sonuçları yorumlamak.', 3, 6, [doc('Grafana k6 Docs')]),
        alt('jmeter', 'Apache JMeter', 'k6’ya alternatif; arayüzlü, köklü bir performans test aracı.', 3, 6, [doc('Apache JMeter User Manual')]),
      ],
    },
    {
      id: 'ci-quality',
      title: 'CI ve kalite süreçleri',
      emoji: '🔁',
      topics: [
        t('git-for-qa', 'Git ve kod incelemesi', 'Test kodunu da sürümle; pull request ile ekiple çalış.', 1, 4, [book('Pro Git (ücretsiz)')]),
        t('ci-testing', 'CI içinde otomatik test', 'GitHub Actions ile her değişiklikte testleri çalıştırıp başarısızlığı erken yakalamak.', 3, 5, [doc('GitHub Actions Docs')]),
        t('metrics', 'Kalite metrikleri', 'Test kapsamı, hata yoğunluğu, kaçan hata oranı; kaliteyi sayılarla izlemek.', 3, 3, [doc('Ministry of Testing: Metrikler')]),
        opt('tdd-bdd', 'TDD ve BDD', 'Önce test yazma ve Gherkin ile ortak dilde senaryo (Cucumber).', 3, 5, [doc('Cucumber Docs')]),
      ],
    },
    {
      id: 'project',
      title: 'Sertifika, proje ve kariyer',
      emoji: '🏆',
      topics: [
        opt('istqb', 'ISTQB sertifikası', 'CTFL sınavına hazırlanmak; birçok iş ilanında istenir, bilgiyi de düzene sokar.', 2, 20, [book('ISTQB Foundation Syllabus (ücretsiz)')]),
        t('portfolio-project', 'Portfolyo test projesi', 'Açık bir uygulama için test planı, hata raporları, API ve arayüz otomasyonunu GitHub’da topla.', 3, 25, [prac('Sauce Demo (örnek test sitesi)'), prac('Restful-booker (örnek test API’si)')]),
        opt('interview', 'Mülakat hazırlığı', 'Test teknikleri, otomasyon ve “bu özelliği nasıl test edersin?” sorularına çalış.', 3, 6, [prac('Ministry of Testing: Mülakat soruları')]),
      ],
    },
  ],
};
