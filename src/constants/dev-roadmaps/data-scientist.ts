import { alt, book, course, doc, opt, prac, t, vid, type DevRoadmap } from './types';

export const DATA_SCIENTIST: DevRoadmap = {
  id: 'data-scientist',
  kind: 'role',
  title: 'Veri Bilimci',
  tagline: 'Veriden soru sor, analiz et, modelle ve sonucu anlat.',
  emoji: '📊',
  hue: 'violet',
  sections: [
    {
      id: 'math',
      title: 'Matematik ve istatistik',
      emoji: '📐',
      topics: [
        t('stats-desc', 'Betimsel istatistik', 'Ortalama, medyan, varyans, dağılımlar.', 1, 5, [course('Khan Academy: Statistics and Probability')]),
        t('probability', 'Olasılık', 'Koşullu olasılık, Bayes, rastgele değişkenler.', 1, 5, [course('Khan Academy: Statistics and Probability')]),
        t('inference', 'Çıkarımsal istatistik', 'Güven aralığı, hipotez testi, p-değeri, A/B testleri.', 2, 6, [book('Practical Statistics for Data Scientists')]),
        t('linear-algebra', 'Lineer cebir sezgisi', 'Vektör, matris, nokta çarpımı; makine öğrenmesinin dili.', 2, 5, [vid('3Blue1Brown: Essence of Linear Algebra')]),
        opt('calculus', 'Kalkülüs sezgisi', 'Türev ve gradyan; modeller nasıl öğrenir?', 2, 4, [vid('3Blue1Brown: Essence of Calculus')]),
      ],
    },
    {
      id: 'programming',
      title: 'Programlama',
      emoji: '🐍',
      topics: [
        t('python', 'Python', 'Veri yapıları, fonksiyonlar, sanal ortamlar.', 1, 10, [doc('Python Resmi Eğitimi (docs.python.org)')]),
        alt('r', 'R', 'İstatistik ağırlıklı ekiplerde Python alternatifi.', 1, 10, [book('R for Data Science (ücretsiz)')]),
        t('sql', 'SQL', 'JOIN, gruplama, pencere fonksiyonları.', 1, 8, [prac('SQLBolt'), prac('DataLemur')]),
        t('notebooks', 'Jupyter ve Git', 'Not defterleriyle keşif, Git ile sürümleme.', 1, 2, [doc('Jupyter Docs')]),
      ],
    },
    {
      id: 'data-wrangling',
      title: 'Veri hazırlama',
      emoji: '🧹',
      topics: [
        t('pandas', 'pandas', 'Veri okuma, temizleme, birleştirme, gruplama.', 1, 8, [book('Python for Data Analysis (ücretsiz web sürümü)')]),
        t('numpy', 'NumPy', 'Diziler ve vektörel hesap.', 1, 3, [doc('NumPy: Absolute Beginners')]),
        t('cleaning', 'Eksik ve hatalı veri', 'Eksik değer, aykırı değer, tip dönüşümleri.', 2, 3, [doc('pandas Docs: Working with missing data'), prac('Kaggle Learn: Data Cleaning')]),
        opt('polars', 'Polars', 'Büyük veride hızlı DataFrame alternatifi.', 2, 3, [doc('Polars User Guide')]),
      ],
    },
    {
      id: 'eda-viz',
      title: 'Keşif ve görselleştirme',
      emoji: '📈',
      topics: [
        t('eda', 'Keşifsel veri analizi (EDA)', 'Veriye doğru soruları sormak, örüntü ve anomali bulmak.', 2, 4, [prac('Kaggle Learn')]),
        t('viz', 'Görselleştirme', 'matplotlib, seaborn; doğru grafik türünü seçmek.', 1, 4, [doc('seaborn Tutorial')]),
        t('storytelling', 'Veriyle hikâye anlatmak', 'Bulguyu karar vericiye sade anlatmak.', 2, 3, [book('Storytelling with Data')]),
        opt('dashboards', 'Panolar', 'Streamlit, Power BI ya da Looker Studio.', 2, 4, [doc('Streamlit Docs')]),
      ],
    },
    {
      id: 'ml',
      title: 'Makine öğrenmesi',
      emoji: '🤖',
      topics: [
        t('ml-basics', 'Temel kavramlar', 'Denetimli/denetimsiz öğrenme, eğitim/test ayrımı, aşırı öğrenme.', 2, 4, [course('Google: Machine Learning Crash Course')]),
        t('regression', 'Regresyon', 'Doğrusal regresyon, değerlendirme ölçütleri (MAE, RMSE).', 2, 4, [doc('scikit-learn User Guide')]),
        t('classification', 'Sınıflandırma', 'Lojistik regresyon, karar ağaçları, precision/recall.', 2, 5, [doc('scikit-learn Docs: Supervised learning'), course('Machine Learning Specialization (Andrew Ng)')]),
        t('ensembles', 'Topluluk yöntemleri', 'Random Forest, gradient boosting (XGBoost, LightGBM).', 3, 5, [doc('scikit-learn Docs: Ensemble methods'), doc('XGBoost Docs: Introduction')]),
        t('validation', 'Model değerlendirme', 'Çapraz doğrulama, hiperparametre ayarı, veri sızıntısı.', 3, 4, [doc('scikit-learn Docs: Cross-validation'), doc('scikit-learn Docs: Metrics and scoring')]),
        opt('clustering', 'Kümeleme ve boyut indirgeme', 'K-means, PCA.', 2, 3, [doc('scikit-learn Docs: Clustering'), doc('scikit-learn Docs: Decomposition (PCA)')]),
        opt('deep-learning', 'Derin öğrenme', 'Sinir ağları ve PyTorch’a giriş.', 3, 15, [course('fast.ai: Practical Deep Learning')]),
      ],
    },
    {
      id: 'production',
      title: 'Modeli işe koşmak',
      emoji: '🚢',
      topics: [
        opt('ml-deploy', 'Modeli servis etmek', 'FastAPI ile model API’si, Docker.', 3, 5, [doc('FastAPI Docs')]),
        opt('mlops', 'MLOps temelleri', 'Deney takibi (MLflow), model izleme.', 3, 5, [doc('MLflow Docs')]),
      ],
    },
    {
      id: 'career',
      title: 'Projeler ve kariyer',
      emoji: '🚀',
      topics: [
        t('project-eda', 'Proje: Uçtan uca analiz', 'Açık bir veri setinde soru → temizleme → analiz → görsel → sonuç raporu.', 2, 15, [prac('Kaggle Datasets')]),
        t('project-ml', 'Proje: Tahmin modeli', 'Bir tahmin problemi: özellik mühendisliği, model karşılaştırma, açıklama.', 3, 20, [prac('Kaggle Competitions')]),
        opt('interview', 'Mülakat hazırlığı', 'İstatistik, SQL ve vaka (case) soruları.', 3, 10, [prac('DataLemur'), prac('StrataScratch')]),
      ],
    },
  ],
};
