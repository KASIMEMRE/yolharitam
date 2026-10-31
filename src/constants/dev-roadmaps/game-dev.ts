import { alt, book, course, doc, opt, prac, t, vid, type DevRoadmap } from './types';

export const GAME_DEV: DevRoadmap = {
  id: 'game-dev',
  kind: 'role',
  title: 'Oyun Geliştirici',
  tagline: 'Fikrini oynanabilir oyuna çevir ve oyuncularla buluştur.',
  emoji: '🕹️',
  hue: 'violet',
  sections: [
    {
      id: 'design-basics',
      title: 'Oyun tasarımı temelleri',
      emoji: '🎯',
      topics: [
        t('game-loop-design', 'Oyun nedir, ne eğlendirir?', 'Hedef, kural, geri bildirim ve zorluk dengesi; iyi oyunun ortak yapı taşları.', 1, 3, [book('A Theory of Fun for Game Design (Raph Koster)'), vid('GDC: Game Maker’s Toolkit')]),
        t('prototyping', 'Hızlı prototip ve oyun fikri', 'Fikri kâğıtta ve basit şekillerle çabuk dene; eğlenceli değilse erkenden vazgeç.', 1, 3, [book('The Art of Game Design (Jesse Schell)')]),
        opt('gdd', 'Oyun tasarım belgesi', 'Fikri kısa bir belgede topla; ekip ve kendin için yol haritası olur.', 2, 2, [book('The Art of Game Design (Jesse Schell)')]),
      ],
    },
    {
      id: 'math',
      title: 'Oyun matematiği',
      emoji: '📐',
      topics: [
        t('vectors', 'Vektörler', 'Konum, yön ve hız vektörlerle ifade edilir; toplama, normalize etme ve nokta çarpımı.', 1, 5, [course('Khan Academy: Vektörler'), vid('3Blue1Brown: Essence of Linear Algebra')]),
        t('matrices', 'Matrisler ve dönüşümler', 'Öteleme, döndürme ve ölçekleme matrislerle yapılır; 3B grafiğin temeli.', 2, 5, [vid('3Blue1Brown: Essence of Linear Algebra')]),
        t('trig-interp', 'Trigonometri ve interpolasyon', 'Açılar, sin/cos ve Lerp ile yumuşak hareket ve dairesel yörüngeler.', 2, 4, [course('Khan Academy: Trigonometri')]),
        opt('quaternions', 'Quaternion’lar', '3B dönüşleri kilitlenmeden (gimbal lock) ifade etmenin yolu.', 3, 3, [vid('3Blue1Brown: Quaternions')]),
      ],
    },
    {
      id: 'engine-choice',
      title: 'Oyun motoru seçimi',
      emoji: '🧰',
      topics: [
        t('engine-overview', 'Motorlara genel bakış', 'Motor grafik, fizik, ses ve girdiyi hazır sunar; seçenekleri ve farklarını tanı.', 1, 2, [doc('Unity Learn'), doc('Godot Docs')]),
        t('unity-setup', 'Unity kurulumu ve editör', 'Unity Hub, proje oluşturma, sahne, hiyerarşi ve inspector penceresi (önerilen yol).', 1, 4, [course('Unity Learn: Unity Essentials')]),
        alt('godot', 'Godot', 'Unity’ye alternatif; hafif, açık kaynak ve ücretsiz, kendi betik dili GDScript ile.', 1, 6, [doc('Godot Docs: Getting started')]),
        opt('unreal', 'Unreal Engine', 'Yüksek görsel kaliteli 3B oyunlar için; C++ ve Blueprint görsel betik sistemi.', 3, 15, [course('Epic Games: Unreal Online Learning')]),
      ],
    },
    {
      id: 'csharp-unity',
      title: 'C# ve Unity temelleri',
      emoji: '🔷',
      topics: [
        t('csharp-basics', 'C# temelleri', 'Değişken, koşul, döngü, metot ve sınıflar; Unity betiklerinin dili.', 1, 12, [doc('Microsoft Learn: C# başlangıç'), course('freeCodeCamp: C#')]),
        t('monobehaviour', 'MonoBehaviour ve bileşenler', 'GameObject’lere betik eklemek; Start, Update ve bileşen tabanlı düşünme.', 1, 5, [doc('Unity Docs: MonoBehaviour')]),
        t('scenes-loop', 'Sahne ve oyun döngüsü', 'Her karede çalışan Update, Time.deltaTime ve sahneler arası geçiş.', 1, 4, [doc('Unity Docs: Scripting'), course('Unity Learn: Junior Programmer')]),
        t('prefabs', 'Prefab ve nesne üretimi', 'Yeniden kullanılabilir nesneler hazırlayıp çalışma anında Instantiate ile oluşturmak.', 2, 3, [doc('Unity Docs: Prefabs')]),
      ],
    },
    {
      id: 'gameplay-systems',
      title: 'Oynanış sistemleri',
      emoji: '⚙️',
      topics: [
        t('input', 'Girdi', 'Klavye, fare, dokunmatik ve gamepad girdisi; Input System paketi.', 1, 4, [doc('Unity Docs: Input System')]),
        t('physics', 'Fizik ve çarpışma', 'Rigidbody, Collider ve tetikleyiciler; zıplama, düşme ve temas algılama.', 2, 6, [doc('Unity Docs: Physics')]),
        t('animation', 'Animasyon', 'Animator ve durum makineleriyle karakter ve nesne hareketlerini yönetmek.', 2, 6, [doc('Unity Docs: Animation')]),
        t('audio', 'Ses ve müzik', 'AudioSource ile efekt ve müzik çalmak; ses oyuncuya güçlü geri bildirim verir.', 2, 3, [doc('Unity Docs: Audio')]),
        t('ui', 'Oyun arayüzü', 'Canvas, buton, can çubuğu ve menüler; oyuncuya bilgi vermenin yolu.', 2, 5, [doc('Unity Docs: UI Toolkit'), course('Unity Learn: Creator Pathway')]),
      ],
    },
    {
      id: '2d-3d',
      title: '2B ve 3B oyun',
      emoji: '🧊',
      topics: [
        t('2d-game', '2B oyun yapımı', 'Sprite, tilemap ve 2B fizikle platform oyunu yapmak; başlangıç için en kolay yol.', 2, 15, [course('Unity Learn: 2D Beginner'), prac('Brackeys: 2D Platformer eğitimi')]),
        t('3d-game', '3B oyun yapımı', 'Model, kamera, ışık ve malzemelerle 3B sahne kurmak; karakter denetleyicisi.', 3, 15, [course('Unity Learn: 3D Beginner')]),
        t('ai-pathfinding', 'Yapay zekâ ve yol bulma', 'Düşmanlara davranış vermek: durum makinesi ve NavMesh ile yol bulma.', 3, 6, [doc('Unity Docs: AI Navigation')]),
        opt('shaders', 'Shader ve görsel efektler', 'Shader Graph ve parçacık sistemi ile ışıltılı, canlı görüntüler üretmek.', 3, 8, [doc('Unity Docs: Shader Graph')]),
      ],
    },
    {
      id: 'optimization',
      title: 'Optimizasyon ve kalite',
      emoji: '⚡',
      topics: [
        t('profiling', 'Profiler ile ölçüm', 'Yavaşlığın nedenini tahmin etme, ölç; CPU ve bellek kullanımını incelemek.', 3, 3, [doc('Unity Docs: Profiler')]),
        t('object-pooling', 'Nesne havuzu ve bellek', 'Sürekli oluştur/yok et yerine nesneleri yeniden kullanmak; çöp toplama takılmalarını azaltır.', 3, 3, [doc('Unity Docs: Object pooling')]),
        t('version-control', 'Oyun projesinde sürüm kontrolü', 'Git ve Git LFS ile büyük varlıkları (asset) sorunsuz yönetmek.', 2, 3, [book('Pro Git (ücretsiz)')]),
      ],
    },
    {
      id: 'publish',
      title: 'Yayınlama',
      emoji: '🚢',
      topics: [
        t('build-export', 'Derleme ve platformlar', 'Oyunu PC, web ve mobil için derlemek; çözünürlük ve girdi farklarını gözetmek.', 2, 3, [doc('Unity Docs: Build Settings')]),
        t('itch-io', 'itch.io’da yayınlama', 'Ücretsiz ve kolay; ilk oyunu paylaşıp geri bildirim toplamak için ideal.', 2, 2, [doc('itch.io Creators Docs')]),
        opt('steam', 'Steam’de yayınlama', 'Steamworks hesabı, mağaza sayfası ve tanıtım; ciddi bir yatırım gerektirir.', 3, 8, [doc('Steamworks Documentation')]),
        opt('mobile-publish', 'Mobil mağazalara çıkış', 'Google Play ve App Store için imzalama, reklam/satın alma ve mağaza kuralları.', 3, 6, [doc('Unity Docs: Mobile')]),
      ],
    },
    {
      id: 'project',
      title: 'Jam ve portfolyo',
      emoji: '🏆',
      topics: [
        t('game-jam', 'Oyun jam’lerine katılmak', 'Kısa sürede oyun bitirme pratiği; Ludum Dare ve Global Game Jam gibi etkinlikler.', 2, 24, [prac('itch.io Game Jams'), prac('Global Game Jam')]),
        t('portfolio', 'Portfolyo oyunu', 'Baştan sona bitmiş, yayınlanmış küçük bir oyun; kapsamı küçük tut ve bitir.', 3, 30, [prac('itch.io')]),
        opt('career', 'Kariyer ve topluluk', 'Demo videosu, devlog yazmak ve oyun topluluklarında görünür olmak.', 3, 4, [prac('GDC Vault')]),
      ],
    },
  ],
};
