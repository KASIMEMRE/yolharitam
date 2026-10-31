import { alt, book, course, doc, opt, prac, t, type DevRoadmap } from './types';

export const MLOPS: DevRoadmap = {
  id: 'mlops',
  kind: 'role',
  title: 'MLOps Mühendisi',
  tagline: 'Makine öğrenmesi modellerini güvenle üretime taşı ve izle.',
  emoji: '🤖',
  hue: 'violet',
  sections: [
    {
      id: 'prerequisites',
      title: 'Python ve ML ön koşulları',
      emoji: '🐍',
      topics: [
        t('python', 'Python temelleri', 'Fonksiyon, sınıf, paket ve sanal ortam; MLOps araçlarının neredeyse hepsi Python ile çalışır.', 1, 15, [course('freeCodeCamp: Python'), doc('Python Docs: Tutorial')]),
        t('pandas-numpy', 'NumPy ve pandas', 'Tablo verisini yükle, temizle ve dönüştür; veri hatlarının temel taşı.', 1, 8, [doc('pandas Docs: 10 minutes to pandas')]),
        t('ml-basics', 'Makine öğrenmesi temelleri', 'Eğitim, doğrulama, aşırı öğrenme ve temel metrikler; modeli neden izlediğini anlarsın.', 1, 15, [course('Coursera: Machine Learning Specialization'), doc('scikit-learn Docs: User Guide')]),
        t('linux-shell', 'Linux ve komut satırı', 'Sunucuda çalışmak, betik yazmak ve süreçleri izlemek için gerekli temel beceri.', 1, 6, [course('freeCodeCamp: Linux')]),
        opt('deep-learning', 'Derin öğrenmeye giriş', 'PyTorch ile basit bir sinir ağı eğit; üretime taşıyacağın model türlerini tanı.', 2, 12, [doc('PyTorch Tutorials'), course('fast.ai: Practical Deep Learning')]),
      ],
    },
    {
      id: 'versioning',
      title: 'Sürüm kontrolü',
      emoji: '🌿',
      topics: [
        t('git', 'Git ve GitHub', 'Kodu dallarla sürümle, pull request ile ekiple çalış; her ML projesinin başlangıcı.', 1, 5, [book('Pro Git'), prac('Learn Git Branching')]),
        t('dvc', 'DVC ile veri sürümleme', 'Büyük veri ve model dosyalarını Git’e şişirmeden sürümle; deneyler tekrarlanabilir olur.', 2, 4, [doc('DVC Docs: Get Started')]),
        t('project-structure', 'Proje yapısı ve bağımlılıklar', 'Cookiecutter şablonları, pyproject ve kilitli bağımlılıkla herkes aynı ortamı kurar.', 2, 3, [doc('Python Packaging User Guide')]),
      ],
    },
    {
      id: 'experiments',
      title: 'Deney takibi',
      emoji: '🧪',
      topics: [
        t('mlflow-tracking', 'MLflow Tracking', 'Parametre, metrik ve çıktıları kaydet; hangi deneyin en iyi sonucu verdiğini karşılaştır.', 2, 5, [doc('MLflow Docs: Tracking'), course('MLflow Docs: Tutorials')]),
        t('model-registry', 'Model kayıt defteri', 'Modelleri sürümle, aşamalara ayır (staging, production) ve onay akışı kur.', 2, 3, [doc('MLflow Docs: Model Registry')]),
        alt('wandb', 'Weights & Biases', 'MLflow’a alternatif, bulut tabanlı ve görselleştirmesi güçlü deney takip platformu.', 2, 4, [doc('Weights & Biases Docs')]),
        opt('hyperparameter', 'Hiperparametre aramasında otomasyon', 'Optuna gibi araçlarla en iyi ayarları elle denemeden bul.', 3, 3, [doc('Optuna Docs')]),
      ],
    },
    {
      id: 'data-pipelines',
      title: 'Veri hatları',
      emoji: '🔁',
      topics: [
        t('sql', 'SQL ve veri erişimi', 'Eğitim verisini veritabanından doğru çekmek için sorgu yazma becerisi.', 1, 8, [prac('SQLBolt'), course('Mode: SQL Tutorial')]),
        t('etl-basics', 'ETL ve veri hattı mantığı', 'Veriyi topla, temizle, dönüştür ve depola; model kalitesi veri kalitesinden gelir.', 2, 4, [book('Fundamentals of Data Engineering')]),
        t('data-validation', 'Veri doğrulama', 'Great Expectations ya da Pandera ile bozuk veriyi eğitime girmeden yakala.', 2, 3, [doc('Great Expectations Docs'), doc('Pandera Docs')]),
        t('feature-store', 'Özellik deposu (Feature Store)', 'Eğitim ve canlı tahminde aynı özellikleri kullanmanı sağlayan ortak katman.', 3, 4, [doc('Feast Docs')]),
      ],
    },
    {
      id: 'packaging',
      title: 'Model paketleme',
      emoji: '🐳',
      topics: [
        t('docker', 'Docker', 'Modeli ve bağımlılıklarını imaja koy; “bende çalışıyordu” sorununu bitirir.', 1, 8, [doc('Docker Docs: Get started'), course('freeCodeCamp: Docker')]),
        t('model-formats', 'Model biçimleri', 'pickle, joblib, ONNX ve TorchScript farkları; taşınabilirlik ve güvenlik açısından seçim.', 2, 3, [doc('ONNX Docs'), doc('scikit-learn Docs: Model persistence')]),
        t('mlflow-models', 'MLflow Models', 'Modeli çerçeveden bağımsız standart bir biçimde paketle ve tek komutla sun.', 2, 2, [doc('MLflow Docs: Models')]),
        opt('image-optimization', 'İmaj küçültme', 'Çok aşamalı derleme ve hafif tabanlarla imaj boyutunu ve açılış süresini düşür.', 3, 2, [doc('Docker Docs: Multi-stage builds')]),
      ],
    },
    {
      id: 'serving',
      title: 'Model sunma',
      emoji: '🚀',
      topics: [
        t('fastapi', 'FastAPI ile tahmin servisi', 'Modeli HTTP API olarak aç; doğrulama ve otomatik dokümantasyon hazır gelir.', 2, 6, [doc('FastAPI Docs: Tutorial')]),
        alt('bentoml', 'BentoML', 'Modeli sunmak için hazır paketleme ve toplu istek desteği veren özel çatı.', 2, 4, [doc('BentoML Docs')]),
        t('batch-vs-online', 'Toplu ve çevrimiçi tahmin', 'Gecelik toplu skorlama ile anlık tahmin arasındaki gecikme ve maliyet dengesi.', 2, 2, [book('Designing Machine Learning Systems')]),
        opt('model-servers', 'Özel model sunucuları', 'TorchServe, Triton ya da KServe ile yüksek hacimli ve GPU’lu sunum.', 3, 6, [doc('KServe Docs'), doc('NVIDIA Triton Docs')]),
      ],
    },
    {
      id: 'cicd',
      title: 'ML için CI/CD',
      emoji: '⚙️',
      topics: [
        t('github-actions', 'GitHub Actions', 'Her değişiklikte testleri ve kontrolleri otomatik çalıştır.', 2, 4, [doc('GitHub Docs: Actions')]),
        t('ml-testing', 'ML kodu testleri', 'pytest ile veri, özellik ve model davranışı testleri; sessiz hataları erken yakalar.', 2, 4, [doc('pytest Docs'), book('Designing Machine Learning Systems')]),
        t('cd-model', 'Sürekli dağıtım ve eğitim', 'Yeni model kalite eşiğini geçerse otomatik dağıt; geri dönüş planı hazır tut.', 3, 5, [doc('Google Cloud: MLOps continuous delivery')]),
        opt('deployment-strategies', 'Canary ve gölge dağıtım', 'Yeni modeli önce küçük trafikte dene, eskisiyle yan yana karşılaştır.', 3, 3, [doc('Seldon Docs: Experiments')]),
      ],
    },
    {
      id: 'orchestration',
      title: 'Orkestrasyon',
      emoji: '🎼',
      topics: [
        t('airflow', 'Apache Airflow', 'Görevleri DAG olarak tanımla, zamanla ve izle; veri ve eğitim hatlarının klasik aracı.', 2, 8, [doc('Airflow Docs: Tutorials')]),
        alt('kubeflow', 'Kubeflow Pipelines', 'Kubernetes üzerinde konteyner tabanlı ML iş akışları; ölçeklenir ama kurulumu ağırdır.', 3, 8, [doc('Kubeflow Docs: Pipelines')]),
        t('kubernetes', 'Kubernetes temelleri', 'Pod, Deployment ve Service; modelleri ve hatları kümede çalıştırmanın temeli.', 3, 12, [doc('Kubernetes Docs: Tutorials'), course('KodeKloud: Kubernetes for Beginners')]),
        opt('prefect-dagster', 'Prefect ve Dagster', 'Daha modern, Python odaklı orkestrasyon araçları; Airflow’a farklı bir bakış.', 3, 5, [doc('Prefect Docs'), doc('Dagster Docs')]),
      ],
    },
    {
      id: 'monitoring',
      title: 'İzleme ve veri kayması',
      emoji: '📈',
      topics: [
        t('system-monitoring', 'Servis izleme', 'Gecikme, hata oranı ve kaynak kullanımı için Prometheus ve Grafana panelleri.', 2, 4, [doc('Prometheus Docs: Overview'), doc('Grafana Docs')]),
        t('data-drift', 'Veri kayması (data drift)', 'Canlı veri eğitim verisinden uzaklaşınca model sessizce bozulur; bunu ölçmeyi öğren.', 3, 4, [doc('Evidently AI Docs')]),
        t('model-performance', 'Model başarımı ve yeniden eğitim', 'Gerçek etiketler gelince metrikleri izle, düşüşte yeniden eğitimi tetikle.', 3, 4, [book('Designing Machine Learning Systems')]),
        opt('logging', 'Günlükleme ve tahmin kaydı', 'Girdi ve çıktıları sakla ki hata analizi ve yeniden eğitim mümkün olsun.', 2, 2, [doc('Python Docs: Logging HOWTO')]),
      ],
    },
    {
      id: 'cloud-project',
      title: 'Bulut ML ve proje',
      emoji: '☁️',
      topics: [
        t('cloud-ml', 'Bulut ML servisleri', 'SageMaker, Vertex AI ya da Azure ML ile eğitim ve dağıtımı yönetilen hizmete bırak.', 3, 10, [doc('AWS Docs: SageMaker'), doc('Google Cloud: Vertex AI Docs'), doc('Azure Machine Learning Docs')]),
        opt('iac', 'Altyapı kodu', 'Terraform ile bulut kaynaklarını kodla tanımla; ortamlar tekrarlanabilir olur.', 3, 5, [doc('Terraform Docs: Tutorials')]),
        t('end-to-end-project', 'Uçtan uca MLOps projesi', 'Veri sürümleme, deney takibi, API, CI/CD ve izlemeyi tek projede birleştir.', 3, 25, [course('DataTalks.Club: MLOps Zoomcamp'), course('Made With ML')]),
        opt('interview-prep', 'Mülakat hazırlığı', 'ML sistem tasarımı sorularını ve üretime alma deneyimlerini anlatmaya çalış.', 3, 5, [book('Designing Machine Learning Systems'), prac('LeetCode')]),
      ],
    },
  ],
};
