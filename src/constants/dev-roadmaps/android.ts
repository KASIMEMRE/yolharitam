import { alt, book, course, doc, opt, prac, t, type DevRoadmap } from './types';

export const ANDROID: DevRoadmap = {
  id: 'android',
  kind: 'role',
  title: 'Android Geliştirici',
  tagline: 'Kotlin ve Jetpack Compose ile Android uygulaması yap, Play Store’a çıkar.',
  emoji: '🤖',
  hue: 'leaf',
  sections: [
    {
      id: 'kotlin-basics',
      title: 'Kotlin temelleri',
      emoji: '🧱',
      topics: [
        t('kotlin-syntax', 'Değişkenler, tipler ve akış', 'val/var, temel tipler, koşullar, döngüler ve fonksiyonlar; Kotlin’in yazım düzeni.', 1, 6, [doc('Kotlin Docs: Kotlin Koans'), book('Kotlin Docs: Learn Kotlin')]),
        t('null-safety', 'Null güvenliği', 'Kotlin null hatalarını derleme anında yakalar; ?, ?. ve ?: işleçleri.', 1, 2, [doc('Kotlin Docs: Null safety')]),
        t('classes-objects', 'Sınıflar, data class ve nesneler', 'class, data class, object ve interface ile veriyi ve davranışı modellemek.', 1, 5, [doc('Kotlin Docs: Classes')]),
        t('collections-lambdas', 'Koleksiyonlar ve lambda’lar', 'List, Map ile map/filter gibi işlemler; lambda Compose’da sürekli kullanılır.', 1, 4, [doc('Kotlin Docs: Collections')]),
        t('kotlin-advanced', 'Genişletme fonksiyonları ve generic’ler', 'Mevcut tiplere işlev eklemek, generic ile tekrar eden kodu azaltmak.', 2, 3, [doc('Kotlin Docs: Extensions')]),
      ],
    },
    {
      id: 'tools',
      title: 'Android Studio ve temeller',
      emoji: '🛠️',
      topics: [
        t('android-studio', 'Android Studio ve emülatör', 'Proje yapısı, Gradle’a giriş, emülatör ve gerçek cihazda çalıştırma.', 1, 3, [course('Android Basics with Compose (developer.android.com)')]),
        t('app-components', 'Activity ve uygulama yaşam döngüsü', 'Activity, manifest ve yaşam döngüsü; uygulamanın nasıl açılıp kapandığını anlamak.', 1, 3, [doc('Android Docs: Activity lifecycle')]),
        t('debugging', 'Hata ayıklama ve Logcat', 'Logcat, breakpoint ve Layout Inspector ile sorunları bulmak.', 1, 2, [doc('Android Docs: Debug your app')]),
      ],
    },
    {
      id: 'compose',
      title: 'Jetpack Compose',
      emoji: '🎨',
      topics: [
        t('compose-basics', 'Composable fonksiyonlar', 'Arayüzü Kotlin fonksiyonlarıyla tanımlamak; Text, Button, Image ve Modifier.', 1, 6, [course('Android Basics with Compose (developer.android.com)')]),
        t('compose-layout', 'Yerleşim: Row, Column, Box', 'Satır, sütun ve üst üste dizilim ile ekran düzeni kurmak.', 1, 4, [doc('Android Docs: Compose layouts')]),
        t('lazy-lists', 'LazyColumn ve listeler', 'Uzun listeleri verimli çizmek; neredeyse her uygulamada gerekir.', 1, 3, [doc('Android Docs: Lists and grids')]),
        t('material3', 'Material 3 ve tema', 'Renk, yazı tipi ve bileşenlerle tutarlı, karanlık mod uyumlu tasarım.', 2, 3, [doc('Material Design 3')]),
        opt('compose-animation', 'Animasyonlar', 'animate*AsState ve geçişlerle arayüzü canlandırmak.', 2, 3, [doc('Android Docs: Compose animation')]),
      ],
    },
    {
      id: 'state-navigation',
      title: 'Durum, ViewModel ve gezinme',
      emoji: '🧭',
      topics: [
        t('compose-state', 'Durum ve recomposition', 'remember ve mutableStateOf: veri değişince ekran kendiliğinden yenilenir.', 1, 4, [doc('Android Docs: State in Compose')]),
        t('viewmodel', 'ViewModel ve UI durumu', 'Ekran döndüğünde veriyi korumak ve mantığı arayüzden ayırmak.', 2, 4, [doc('Android Docs: ViewModel overview')]),
        t('navigation', 'Navigation Compose', 'NavHost ile ekranlar arası geçiş ve parametre aktarma.', 2, 3, [doc('Android Docs: Navigation')]),
      ],
    },
    {
      id: 'data-async',
      title: 'Ağ ve eşzamanlılık',
      emoji: '🌐',
      topics: [
        t('coroutines', 'Coroutine’ler', 'Arayüzü dondurmadan arka planda iş yapmak; suspend, launch ve scope kavramları.', 2, 5, [doc('Kotlin Docs: Coroutines guide')]),
        t('flow', 'Flow ile veri akışları', 'Zamanla değişen veriyi akış olarak sunmak; StateFlow ve collectAsState.', 2, 4, [doc('Android Docs: Kotlin flows on Android')]),
        t('retrofit', 'Retrofit ile ağ istekleri', 'REST API’den veri çekmek ve JSON’u Kotlin sınıflarına çevirmek.', 2, 4, [doc('Retrofit Docs'), doc('Kotlin Serialization Docs')]),
        alt('ktor', 'Ktor Client', 'Retrofit’in yerine kullanılabilen, Kotlin’e özgü ağ kütüphanesi.', 2, 4, [doc('Ktor Docs: Client')]),
      ],
    },
    {
      id: 'persistence-di',
      title: 'Yerel veri ve bağımlılıklar',
      emoji: '🗄️',
      topics: [
        t('datastore', 'DataStore ile ayarlar', 'Küçük kullanıcı ayarlarını güvenle saklamak; SharedPreferences’ın yerine.', 2, 2, [doc('Android Docs: DataStore')]),
        t('room', 'Room veritabanı', 'SQLite üzerinde entity, DAO ve sorgularla cihazda kalıcı veri.', 2, 6, [doc('Android Docs: Room')]),
        t('hilt', 'Hilt ile bağımlılık enjeksiyonu', 'Nesneleri elle oluşturmak yerine otomatik vermek; kod test edilebilir olur.', 3, 5, [doc('Android Docs: Dependency injection with Hilt')]),
      ],
    },
    {
      id: 'architecture-quality',
      title: 'Mimari ve test',
      emoji: '🏗️',
      topics: [
        t('architecture', 'Önerilen uygulama mimarisi', 'UI, domain ve data katmanlarına ayırma; Repository deseni.', 3, 5, [doc('Android Docs: Guide to app architecture')]),
        t('unit-testing', 'Birim testleri', 'JUnit ve sahte (fake) nesnelerle ViewModel ve Repository testi.', 2, 4, [doc('Android Docs: Test your app')]),
        t('ui-testing', 'Compose arayüz testleri', 'Ekranların beklendiği gibi çalıştığını otomatik doğrulamak.', 3, 3, [doc('Android Docs: Test your Compose layout')]),
        opt('accessibility', 'Erişilebilirlik', 'TalkBack, içerik açıklamaları ve dokunma alanı boyutu.', 2, 2, [doc('Android Docs: Accessibility')]),
      ],
    },
    {
      id: 'release',
      title: 'Yayınlama',
      emoji: '🚢',
      topics: [
        t('signing', 'İmzalama ve AAB', 'Uygulamayı imzalamak ve Play Store’un istediği AAB paketini üretmek.', 2, 3, [doc('Android Docs: Sign your app')]),
        t('play-console', 'Play Console ve yayın', 'Mağaza sayfası, iç/kapalı test kanalları ve gizlilik beyanları.', 3, 4, [doc('Play Console Help')]),
      ],
    },
    {
      id: 'project',
      title: 'Proje ve kariyer',
      emoji: '🏆',
      topics: [
        t('portfolio-app', 'Portfolyo uygulaması', 'API’den veri çeken, Room ile saklayan ve Play Store’a hazır tam bir uygulama yap.', 3, 30, [prac('Android Developers: Codelabs')]),
        opt('interview', 'Mülakat hazırlığı', 'Kotlin, yaşam döngüsü ve mimari sorularına çalış.', 3, 6, [prac('LeetCode')]),
      ],
    },
  ],
};
