import { alt, book, course, doc, opt, prac, t, type DevRoadmap } from './types';

export const PYTHON: DevRoadmap = {
  id: 'python',
  kind: 'skill',
  title: 'Python',
  tagline: 'Web’den veri bilimine her yerde kullanılan dili sıfırdan ustalığa öğren.',
  emoji: '🐍',
  hue: 'marker',
  sections: [
    {
      id: 'basics',
      title: 'Temeller',
      emoji: '🧱',
      topics: [
        t('setup', 'Kurulum ve ilk program', 'Python’u kur, editörünü (VS Code) hazırla, ilk betiğini çalıştır.', 1, 1, [doc('Python Resmi Eğitimi (docs.python.org)')]),
        t('syntax', 'Sözdizimi ve veri tipleri', 'Değişkenler, sayılar, metinler (string), bool, tip dönüşümü.', 1, 4, [course('BTK Akademi: Python'), book('Automate the Boring Stuff with Python (ücretsiz)')]),
        t('control-flow', 'Koşullar ve döngüler', 'if/elif/else, for, while, break/continue.', 1, 3, [prac('Exercism: Python')]),
        t('functions', 'Fonksiyonlar', 'Parametreler, dönüş değeri, varsayılan değerler, *args/**kwargs.', 1, 3, []),
        t('collections', 'Listeler, sözlükler, kümeler', 'Yerleşik veri yapıları ve liste üreteçleri (comprehension).', 1, 4, []),
      ],
    },
    {
      id: 'intermediate',
      title: 'Orta seviye',
      emoji: '🧭',
      topics: [
        t('modules', 'Modüller ve paketler', 'import sistemi, pip, sanal ortam (venv) ve uv.', 1, 2, [doc('Python Packaging User Guide')]),
        t('files-errors', 'Dosyalar ve hata yönetimi', 'Dosya okuma/yazma, with, try/except, kendi istisnaların.', 1, 3, []),
        t('oop', 'Nesne yönelimli programlama', 'Sınıflar, kalıtım, dunder metotlar, dataclass.', 2, 5, [doc('Real Python: OOP in Python')]),
        t('stdlib', 'Standart kütüphane', 'pathlib, datetime, json, collections, itertools.', 2, 3, [doc('Python Module of the Week')]),
        t('typing', 'Tip ipuçları', 'Type hints ve mypy ile daha güvenli kod.', 2, 2, [doc('mypy Docs')]),
      ],
    },
    {
      id: 'advanced',
      title: 'İleri seviye',
      emoji: '🏔️',
      topics: [
        t('iterators', 'İteratörler ve üreteçler', 'yield, tembel değerlendirme, bellek dostu veri işleme.', 3, 3, []),
        t('decorators', 'Dekoratörler ve bağlam yöneticileri', 'Fonksiyonları sarmalamak, kendi with yapın.', 3, 3, []),
        t('async', 'Eşzamanlılık', 'asyncio, threading ve multiprocessing farkı; GIL.', 3, 5, [doc('Real Python: Async IO')]),
        opt('internals', 'Python’un iç yapısı', 'Bellek yönetimi, referans sayımı, bayt kodu.', 3, 4, [book('Fluent Python')]),
      ],
    },
    {
      id: 'quality',
      title: 'Kod kalitesi',
      emoji: '✅',
      topics: [
        t('testing', 'Test: pytest', 'Birim testleri, fikstürler, parametreli testler.', 2, 3, [doc('pytest Docs')]),
        t('style', 'Stil ve araçlar', 'PEP 8, Ruff ile lint ve biçimlendirme.', 1, 1, [doc('Ruff Docs')]),
        t('git', 'Git ile çalışma', 'Projelerini sürümle ve GitHub’a koy.', 1, 3, [doc('Pro Git (kitap, ücretsiz)')]),
      ],
    },
    {
      id: 'specialize',
      title: 'Bir alanda uzmanlaş',
      emoji: '🧩',
      topics: [
        t('web', 'Web: FastAPI ya da Django', 'API ya da tam web uygulaması geliştir.', 2, 12, [doc('FastAPI Docs'), doc('Django Girls Tutorial')]),
        alt('data', 'Veri: pandas ve görselleştirme', 'Veri temizleme, analiz ve grafik (pandas, matplotlib).', 2, 12, [book('Python for Data Analysis (ücretsiz web sürümü)')]),
        alt('automation', 'Otomasyon ve betikler', 'Dosya, e-posta, web kazıma (requests, BeautifulSoup, Playwright).', 1, 8, [book('Automate the Boring Stuff with Python (ücretsiz)')]),
        alt('ml', 'Makine öğrenmesi', 'scikit-learn ve PyTorch ile modeller.', 3, 15, [course('Google: Machine Learning Crash Course')]),
      ],
    },
    {
      id: 'projects',
      title: 'Projeler',
      emoji: '🚀',
      topics: [
        t('project-cli', 'Proje: Komut satırı aracı', 'Görev takibi ya da dosya düzenleyici; argparse/Typer ile.', 1, 6, [doc('Typer Docs')]),
        t('project-api', 'Proje: Web API ya da veri analizi', 'Seçtiğin uzmanlık alanında, testli ve belgelenmiş bir proje.', 2, 15, []),
        opt('open-source', 'Açık kaynağa katkı', '“good first issue” etiketli bir projeye ilk katkını yap.', 3, 6, [prac('Good First Issue (goodfirstissue.dev)')]),
      ],
    },
  ],
};
