import { alt, book, course, doc, opt, prac, t, type DevRoadmap } from './types';

export const SQL: DevRoadmap = {
  id: 'sql',
  kind: 'skill',
  title: 'SQL ve Veri',
  tagline: 'Veriyi sorgula, analiz et ve doğru tasarlanmış veritabanları kur.',
  emoji: '🗄️',
  hue: 'sky',
  sections: [
    {
      id: 'basics',
      title: 'Temeller',
      emoji: '🧱',
      topics: [
        t('what-db', 'Veritabanı nedir?', 'Tablo, satır, sütun, birincil anahtar; ilişkisel model.', 1, 1, [doc('PostgreSQL Docs: Tutorial'), course('CS50’s Introduction to Databases with SQL')]),
        t('setup', 'Kurulum', 'PostgreSQL ya da SQLite kur, bir istemciyle (DBeaver, pgAdmin) bağlan.', 1, 1, [doc('PostgreSQL Tutorial')]),
        t('select', 'SELECT ve filtreleme', 'WHERE, ORDER BY, LIMIT, DISTINCT, LIKE.', 1, 3, [prac('SQLBolt'), prac('SQLZoo')]),
        t('crud', 'Veri ekleme ve güncelleme', 'INSERT, UPDATE, DELETE ve dikkat edilmesi gerekenler.', 1, 2, [doc('PostgreSQL Docs: Data Manipulation'), prac('SQLBolt')]),
      ],
    },
    {
      id: 'querying',
      title: 'Sorgu becerileri',
      emoji: '🔍',
      topics: [
        t('aggregate', 'Gruplama ve toplama', 'COUNT, SUM, AVG, GROUP BY, HAVING.', 1, 3, [prac('SQLBolt')]),
        t('joins', 'JOIN’ler', 'INNER, LEFT, RIGHT, FULL; birden çok tabloyu birleştir.', 2, 4, [prac('SQL Murder Mystery')]),
        t('subqueries', 'Alt sorgular ve CTE', 'WITH ile okunaklı, katmanlı sorgular.', 2, 3, [doc('PostgreSQL Docs: Subquery Expressions'), doc('PostgreSQL Docs: WITH Queries (CTE)')]),
        t('window', 'Pencere fonksiyonları', 'ROW_NUMBER, RANK, LAG, hareketli ortalama.', 3, 4, [doc('Mode: SQL Tutorial (Window Functions)')]),
        opt('functions', 'Tarih, metin ve koşul fonksiyonları', 'CASE, COALESCE, tarih aritmetiği.', 2, 2, [doc('PostgreSQL Docs: Date/Time Functions'), doc('PostgreSQL Docs: String Functions'), doc('PostgreSQL Docs: Conditional Expressions')]),
      ],
    },
    {
      id: 'design',
      title: 'Veritabanı tasarımı',
      emoji: '📐',
      topics: [
        t('modeling', 'Veri modelleme', 'Varlık-ilişki (ER) diyagramı, bire-çok ve çoka-çok ilişkiler.', 2, 3, [book('Database Design for Mere Mortals'), doc('PostgreSQL Docs: Constraints')]),
        t('normalization', 'Normalizasyon', '1NF, 2NF, 3NF; tekrarı önle, tutarlılığı koru.', 2, 3, [doc('Microsoft Learn: Database normalization basics'), course('CS50’s Introduction to Databases with SQL')]),
        t('constraints', 'Kısıtlar ve veri bütünlüğü', 'NOT NULL, UNIQUE, CHECK, yabancı anahtarlar.', 2, 2, [doc('PostgreSQL Docs: Constraints')]),
        t('transactions', 'İşlemler (transaction)', 'ACID, BEGIN/COMMIT/ROLLBACK, izolasyon seviyeleri.', 3, 3, [doc('PostgreSQL Docs: Transactions'), doc('PostgreSQL Docs: Transaction Isolation')]),
      ],
    },
    {
      id: 'performance',
      title: 'Performans',
      emoji: '⚡',
      topics: [
        t('indexes', 'İndeksler', 'B-tree indeks, ne zaman yardım eder, ne zaman zarar verir?', 3, 3, [book('Use The Index, Luke (ücretsiz)')]),
        t('explain', 'Sorgu planı: EXPLAIN', 'Yavaş sorguyu bul ve nedenini anla.', 3, 3, [doc('PostgreSQL Docs: Using EXPLAIN')]),
        opt('partitioning', 'Bölümleme ve ölçek', 'Büyük tabloları bölme, okuma kopyaları.', 3, 3, [doc('PostgreSQL Docs: Table Partitioning'), book('Designing Data-Intensive Applications')]),
      ],
    },
    {
      id: 'analytics',
      title: 'Veri analizi',
      emoji: '📊',
      topics: [
        t('analysis', 'Analist gibi sorgu yazmak', 'Kohort, huni (funnel), elde tutma (retention) analizleri.', 2, 6, [prac('StrataScratch'), prac('DataLemur')]),
        t('viz', 'Görselleştirme ve pano', 'Metabase, Looker Studio ya da Power BI ile pano kur.', 2, 5, [doc('Metabase Docs'), course('Microsoft Learn: Power BI')]),
        alt('python-data', 'Python ile analiz', 'pandas ile SQL sonuçlarını işle.', 2, 8, [book('Python for Data Analysis (ücretsiz web sürümü)')]),
        opt('excel', 'Excel / Sheets', 'Pivot tablolar ve formüller; iş dünyasında hâlâ her yerde.', 1, 3, [course('Microsoft Support: Excel eğitim videoları'), course('Google Sheets Training and Help')]),
      ],
    },
    {
      id: 'data-eng',
      title: 'Veri mühendisliğine giriş',
      emoji: '🏗️',
      topics: [
        opt('etl', 'ETL/ELT hatları', 'Veriyi kaynaktan al, dönüştür, ambara yükle.', 3, 5, [course('DataTalksClub: Data Engineering Zoomcamp')]),
        opt('dbt', 'dbt', 'SQL ile test edilebilir, sürümlenen veri dönüşümleri.', 3, 5, [course('dbt Learn')]),
        opt('warehouse', 'Veri ambarları', 'BigQuery, Snowflake, DuckDB; sütun tabanlı depolama.', 3, 4, [doc('DuckDB Docs')]),
      ],
    },
    {
      id: 'projects',
      title: 'Projeler',
      emoji: '🚀',
      topics: [
        t('project-analysis', 'Proje: Açık veriyle analiz', 'Kaggle ya da TÜİK verisini yükle, 10 iş sorusunu SQL ile cevapla, panoya dök.', 2, 10, [prac('Kaggle Datasets')]),
        t('project-design', 'Proje: Uygulama veritabanı', 'Bir e-ticaret şeması tasarla: tablolar, ilişkiler, indeksler, örnek sorgular.', 2, 8, [doc('PostgreSQL Docs: Data Definition'), doc('Supabase Docs: Database')]),
        opt('interview', 'Mülakat soruları', 'Analist ve backend mülakatlarındaki SQL soruları.', 3, 6, [prac('DataLemur'), prac('LeetCode: Database')]),
      ],
    },
  ],
};
