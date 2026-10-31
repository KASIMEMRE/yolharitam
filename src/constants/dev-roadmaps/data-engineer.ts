import { alt, book, course, doc, opt, prac, t, type DevRoadmap } from './types';

export const DATA_ENGINEER: DevRoadmap = {
  id: 'data-engineer',
  kind: 'role',
  title: 'Veri Mühendisi',
  tagline: 'Veriyi topla, dönüştür ve analize hazır hâle getir.',
  emoji: '🗄️',
  hue: 'leaf',
  sections: [
    {
      id: 'foundations',
      title: 'SQL ve Python temelleri',
      emoji: '🧱',
      topics: [
        t('sql-basics', 'SQL sorguları', 'SELECT, JOIN, GROUP BY ve alt sorgular; veri mühendisinin günlük ana dili.', 1, 12, [prac('SQLBolt'), course('Mode: SQL Tutorial')]),
        t('sql-advanced', 'İleri SQL', 'Pencere fonksiyonları, CTE ve sorgu planları; yavaş sorguyu hızlandırmayı öğretir.', 2, 8, [prac('LeetCode: Database'), doc('PostgreSQL Docs: Window Functions')]),
        t('python', 'Python temelleri', 'Fonksiyon, dosya işleme, paketler ve hata yönetimi; veri hatlarının ana dili.', 1, 15, [course('freeCodeCamp: Python'), doc('Python Docs: Tutorial')]),
        t('pandas', 'pandas ile veri işleme', 'Veriyi oku, filtrele, birleştir ve temizle; küçük veri setleri için pratik araç.', 1, 8, [doc('pandas Docs: 10 minutes to pandas')]),
        t('linux-git', 'Linux ve Git', 'Komut satırı, betikler ve sürüm kontrolü; hatları sunucuda yönetmek için şart.', 1, 8, [course('freeCodeCamp: Linux'), book('Pro Git')]),
      ],
    },
    {
      id: 'modeling',
      title: 'Veri modelleme',
      emoji: '📐',
      topics: [
        t('relational-design', 'İlişkisel tasarım', 'Normalizasyon, anahtarlar ve ilişkiler; temiz tablo yapısı hataları baştan önler.', 1, 5, [book('Database Design for Mere Mortals')]),
        t('dimensional', 'Boyutsal modelleme', 'Olgu ve boyut tabloları, yıldız şeması; analiz sorgularını kolaylaştıran klasik yaklaşım.', 2, 6, [book('The Data Warehouse Toolkit')]),
        t('scd', 'Yavaş değişen boyutlar', 'Müşteri adresi gibi değişen bilgilerin geçmişini doğru saklama teknikleri.', 3, 3, [book('The Data Warehouse Toolkit')]),
        alt('data-vault', 'Data Vault', 'Çok kaynaklı, sık değişen kurumsal ortamlar için esnek bir modelleme yöntemi.', 3, 4, [doc('Data Vault Alliance Docs')]),
        opt('nosql', 'NoSQL ve belge veritabanları', 'MongoDB ve Cassandra gibi ilişkisel olmayan modellerin ne zaman uygun olduğu.', 2, 5, [course('MongoDB University')]),
      ],
    },
    {
      id: 'warehouse',
      title: 'Veri ambarı',
      emoji: '🏛️',
      topics: [
        t('warehouse-concepts', 'Veri ambarı kavramları', 'OLTP ile OLAP farkı ve analiz için ayrı depo kullanmanın nedenleri.', 1, 3, [book('Fundamentals of Data Engineering')]),
        t('snowflake', 'Snowflake', 'Depolama ve hesaplamayı ayıran popüler bulut ambarı; sanal ambar kavramı önemlidir.', 2, 6, [doc('Snowflake Docs: Tutorials')]),
        alt('bigquery', 'BigQuery', 'Google’ın sunucusuz ambarı; sorgu başına ödeme ve bölümleme mantığı öne çıkar.', 2, 6, [doc('Google Cloud: BigQuery Docs')]),
        alt('redshift', 'Redshift', 'AWS’nin sütun tabanlı ambarı; dağıtım ve sıralama anahtarları performansı belirler.', 2, 6, [doc('AWS Docs: Redshift')]),
        opt('performance-cost', 'Performans ve maliyet', 'Bölümleme, kümeleme ve gereksiz taramadan kaçınarak sorgu faturasını düşür.', 3, 3, [doc('Snowflake Docs: Performance')]),
      ],
    },
    {
      id: 'etl',
      title: 'ETL ve ELT',
      emoji: '🔁',
      topics: [
        t('etl-vs-elt', 'ETL ve ELT farkı', 'Dönüşümü yüklemeden önce mi sonra mı yaparsın? Modern bulut ambarlarında ELT yaygın.', 1, 2, [book('Fundamentals of Data Engineering')]),
        t('ingestion', 'Veri alımı', 'API, veritabanı ve dosyalardan veri çekme; artımlı yükleme ve hata durumları.', 2, 6, [doc('Airbyte Docs'), doc('Python Docs: requests')]),
        t('file-formats', 'Dosya biçimleri', 'CSV, JSON, Parquet ve Avro; biçim seçimi boyutu ve sorgu hızını doğrudan etkiler.', 2, 3, [doc('Apache Parquet Docs')]),
        t('idempotency', 'Tekrar çalıştırılabilir hatlar', 'Aynı işi iki kez çalıştırınca veri çiftlenmesin; hat güvenilirliğinin temel ilkesi.', 2, 3, [book('Fundamentals of Data Engineering')]),
      ],
    },
    {
      id: 'dbt',
      title: 'dbt ile dönüşüm',
      emoji: '🧩',
      topics: [
        t('dbt-basics', 'dbt temelleri', 'SQL modelleriyle ambarda dönüşüm yaz; bağımlılıklar otomatik sıralanır.', 2, 6, [doc('dbt Docs: Quickstart'), course('dbt Learn: Fundamentals')]),
        t('dbt-tests', 'dbt testleri ve dokümantasyon', 'unique, not_null gibi testler ve otomatik veri sözlüğü ile güven kazan.', 2, 3, [doc('dbt Docs: Tests')]),
        t('dbt-incremental', 'Artımlı modeller', 'Büyük tabloları baştan kurmak yerine yalnızca yeni veriyi işle.', 3, 3, [doc('dbt Docs: Incremental models')]),
        opt('dbt-macros', 'Jinja ve makrolar', 'Tekrarlanan SQL’i makrolara çevirerek kodu kısalt ve tutarlı kıl.', 3, 3, [doc('dbt Docs: Jinja and macros')]),
      ],
    },
    {
      id: 'orchestration',
      title: 'Orkestrasyon',
      emoji: '🎼',
      topics: [
        t('airflow-basics', 'Apache Airflow', 'Görevleri DAG olarak tanımla, zamanla ve izle; sektörün en yaygın orkestratörü.', 2, 8, [doc('Airflow Docs: Tutorials')]),
        t('scheduling-retries', 'Zamanlama, yeniden deneme ve uyarı', 'Başarısız görevi otomatik tekrar dene, kalıcı hatada ekibi haberdar et.', 2, 3, [doc('Airflow Docs: Tasks')]),
        alt('dagster-prefect', 'Dagster ve Prefect', 'Veri varlıklarına odaklanan veya daha hafif, Python öncelikli yeni nesil alternatifler.', 3, 5, [doc('Dagster Docs'), doc('Prefect Docs')]),
        opt('docker', 'Docker', 'Hat kodunu konteynere koy; geliştirme ve üretim ortamı aynı davranır.', 2, 6, [doc('Docker Docs: Get started')]),
      ],
    },
    {
      id: 'big-data',
      title: 'Büyük veri ve akış',
      emoji: '⚡',
      topics: [
        t('spark-basics', 'Apache Spark', 'Veriyi birçok makinede paralel işle; DataFrame API ile SQL benzeri kullanım.', 3, 12, [doc('Spark Docs: Quick Start'), book('Spark: The Definitive Guide')]),
        t('spark-tuning', 'Spark başarım ayarı', 'Bölümleme, karıştırma (shuffle) ve önbellekleme; yavaş işleri anlamak için.', 3, 5, [doc('Spark Docs: Tuning')]),
        t('kafka', 'Apache Kafka', 'Olayları gerçek zamanlı ileten dağıtık günlük sistemi; topic, partition ve consumer grubu.', 3, 10, [doc('Kafka Docs: Introduction'), course('Confluent Developer Courses')]),
        opt('stream-processing', 'Akış işleme', 'Spark Structured Streaming ya da Flink ile veriyi gelirken işle.', 3, 8, [doc('Spark Docs: Structured Streaming'), doc('Apache Flink Docs')]),
      ],
    },
    {
      id: 'lake-quality',
      title: 'Veri gölü ve kalite',
      emoji: '🏔️',
      topics: [
        t('data-lake', 'Veri gölü', 'S3 gibi nesne depolamada ham veriyi saklama; şema esnekliği ve düzensizlik riski.', 2, 3, [book('Fundamentals of Data Engineering')]),
        t('lakehouse', 'Lakehouse ve tablo biçimleri', 'Delta Lake, Iceberg ve Hudi ile göle ambar benzeri işlem ve zaman yolculuğu getir.', 3, 6, [doc('Delta Lake Docs'), doc('Apache Iceberg Docs')]),
        t('data-quality', 'Veri kalitesi', 'Eksik, yinelenen ve tutarsız veriyi otomatik denetimle yakala; güven her şeydir.', 2, 4, [doc('Great Expectations Docs'), doc('dbt Docs: Tests')]),
        opt('governance', 'Veri yönetişimi ve katalog', 'Verinin sahibi, kökeni (lineage) ve erişim kuralları; DataHub gibi araçlarla belgelenir.', 3, 4, [doc('DataHub Docs')]),
      ],
    },
    {
      id: 'cloud-project',
      title: 'Bulut ve proje',
      emoji: '☁️',
      topics: [
        t('cloud-basics', 'Bulut temelleri', 'Depolama, hesaplama ve IAM; bir bulut sağlayıcısında veri altyapısı kurmanın zemini.', 2, 8, [doc('AWS Docs: Getting Started'), doc('Google Cloud: Documentation')]),
        opt('iac', 'Altyapı kodu', 'Terraform ile bulut kaynaklarını kodla tanımla; ortamlar tekrarlanabilir olur.', 3, 5, [doc('Terraform Docs: Tutorials')]),
        t('capstone', 'Uçtan uca veri hattı projesi', 'API’den veri çek, göle yaz, dbt ile dönüştür, Airflow ile zamanla ve panelde göster.', 3, 25, [course('DataTalks.Club: Data Engineering Zoomcamp')]),
        opt('interview', 'Mülakat hazırlığı', 'SQL soruları, veri modelleme ve hat tasarımı senaryolarını çalış.', 3, 6, [prac('LeetCode: Database'), book('Designing Data-Intensive Applications')]),
      ],
    },
  ],
};
