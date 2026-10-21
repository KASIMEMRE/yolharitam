import { alt, book, course, doc, opt, t, type DevRoadmap } from './types';

export const MOBILE: DevRoadmap = {
  id: 'mobile',
  kind: 'role',
  title: 'Mobil Geliştirici',
  tagline: 'iOS ve Android için uygulama geliştir, mağazalarda yayınla.',
  emoji: '📱',
  hue: 'coral',
  sections: [
    {
      id: 'basics',
      title: 'Programlama temelleri',
      emoji: '🧠',
      topics: [
        t('programming', 'Programlama mantığı', 'Değişken, koşul, döngü, fonksiyon ve veri yapıları.', 1, 8, [course('CS50x (Harvard, ücretsiz)')]),
        t('git', 'Git ve GitHub', 'Kodunu sürümle, dallarla çalış, GitHub’a koy.', 1, 4, [doc('Pro Git (kitap, ücretsiz)')]),
        t('mobile-concepts', 'Mobil dünyayı tanı', 'iOS ve Android farkları, yaşam döngüsü, izinler, mağaza kuralları.', 1, 2, [doc('Apple Human Interface Guidelines'), doc('Material Design 3')]),
      ],
    },
    {
      id: 'path',
      title: 'Bir yol seç',
      emoji: '🧭',
      topics: [
        t('react-native', 'React Native + Expo', 'JavaScript/TypeScript ile tek kod tabanından iki platform. Web biliyorsan en hızlı yol.', 2, 20, [doc('Expo Docs: Tutorial'), doc('React Native Docs')]),
        alt('flutter', 'Flutter (Dart)', 'Google’ın çapraz platform çatısı; kendi çizim motoruyla tutarlı arayüz.', 2, 20, [doc('Flutter Docs: Get started'), course('Flutter Codelabs')]),
        alt('native-ios', 'Yerel iOS: Swift + SwiftUI', 'Apple platformlarında en iyi performans ve en yeni özellikler.', 2, 25, [course('Stanford CS193p (ücretsiz)'), doc('Apple: Develop in Swift')]),
        alt('native-android', 'Yerel Android: Kotlin + Compose', 'Android’in resmi yolu; modern bildirimsel arayüz.', 2, 25, [course('Android Basics with Compose (Google)')]),
      ],
    },
    {
      id: 'ui',
      title: 'Arayüz ve gezinme',
      emoji: '🎨',
      topics: [
        t('layout', 'Yerleşim ve bileşenler', 'Flexbox tabanlı yerleşim, listeler, görseller, dokunma alanları.', 1, 6, [doc('React Native Docs: Layout with Flexbox')]),
        t('navigation', 'Gezinme (navigation)', 'Yığın, sekme ve modal ekranlar; derin bağlantılar.', 2, 5, [doc('Expo Router Docs')]),
        t('forms-input', 'Formlar ve klavye', 'Metin girişi, klavye yönetimi, doğrulama.', 2, 3, [doc('React Hook Form Docs')]),
        t('mobile-a11y', 'Mobil erişilebilirlik', 'Ekran okuyucu etiketleri, büyük yazı, kontrast, dokunma hedefleri.', 2, 3, [doc('React Native Docs: Accessibility')]),
        opt('animation', 'Animasyonlar', 'Reanimated ile akıcı, 60 FPS hareketler.', 3, 5, [doc('Reanimated Docs')]),
      ],
    },
    {
      id: 'data',
      title: 'Veri ve durum',
      emoji: '🗂️',
      topics: [
        t('state', 'Durum yönetimi', 'Yerel state, Context ve Zustand ile uygulama durumu.', 2, 4, [doc('Zustand Docs')]),
        t('networking', 'Ağ istekleri', 'API’den veri çekme, yükleniyor/hata durumları, TanStack Query.', 2, 4, [doc('TanStack Query Docs')]),
        t('storage', 'Yerel depolama', 'AsyncStorage, SecureStore (gizli veriler için) ve SQLite.', 2, 3, [doc('Expo Docs: SecureStore'), doc('Expo Docs: SQLite')]),
        opt('offline', 'Çevrimdışı öncelikli uygulama', 'İnternet yokken çalışma ve sonradan senkronizasyon.', 3, 5, []),
        t('backend', 'Hazır arka uç', 'Supabase ya da Firebase ile kimlik doğrulama ve veritabanı.', 2, 5, [doc('Supabase Docs'), doc('Firebase Docs')]),
      ],
    },
    {
      id: 'device',
      title: 'Cihaz özellikleri',
      emoji: '📷',
      topics: [
        t('permissions', 'İzinler', 'Kamera, konum, bildirim izinlerini doğru zamanda ve gerekçeyle iste.', 2, 2, [doc('Expo Docs: Permissions')]),
        t('push', 'Anlık bildirimler', 'APNs ve FCM üzerinden bildirim gönderme.', 3, 4, [doc('Expo Docs: Push notifications')]),
        opt('camera-location', 'Kamera, konum, sensörler', 'Cihaz donanımını uygulamana bağla.', 2, 4, [doc('Expo SDK referansı')]),
        opt('native-modules', 'Yerel modüller', 'Hazır olmayan bir özelliği yerel kodla köprülemek.', 3, 6, [doc('Expo Modules API')]),
      ],
    },
    {
      id: 'quality',
      title: 'Test ve performans',
      emoji: '🧪',
      topics: [
        t('testing', 'Test', 'Bileşen testleri (Testing Library) ve uçtan uca testler (Maestro).', 3, 5, [doc('React Native Testing Library'), doc('Maestro Docs')]),
        t('performance', 'Performans', 'Liste sanallaştırma, gereksiz yeniden çizimler, açılış süresi.', 3, 4, [doc('React Native Docs: Performance')]),
        opt('debugging', 'Hata ayıklama ve hata izleme', 'Geliştirici araçları ve Sentry ile canlı hataları yakala.', 2, 2, [doc('Sentry Docs: React Native')]),
      ],
    },
    {
      id: 'release',
      title: 'Yayınlama',
      emoji: '🚀',
      topics: [
        t('builds', 'Derleme ve imzalama', 'Bulutta derleme (EAS Build), sertifikalar ve sürüm numaraları.', 3, 4, [doc('EAS Build Docs')]),
        t('stores', 'App Store ve Google Play', 'Mağaza sayfası, ekran görüntüleri, inceleme süreci, gizlilik etiketleri.', 3, 4, [doc('App Store Review Guidelines'), doc('Google Play Console Yardım')]),
        opt('ota', 'Uygulama içi güncelleme (OTA)', 'Mağazaya gitmeden JavaScript güncellemesi gönder.', 3, 2, [doc('EAS Update Docs')]),
        opt('iap', 'Uygulama içi satın alma', 'Abonelik ve tek seferlik satışlar (RevenueCat).', 3, 5, [doc('RevenueCat Docs')]),
      ],
    },
    {
      id: 'career',
      title: 'Projeler ve kariyer',
      emoji: '💼',
      topics: [
        t('project-1', 'Proje: API kullanan uygulama', 'Hava durumu ya da film uygulaması: liste, detay, arama.', 2, 15, []),
        t('project-2', 'Proje: Mağazada yayınlanmış uygulama', 'Kimlik doğrulamalı, verisi bulutta duran ve mağazada yayınlanmış bir ürün.', 3, 30, []),
        opt('interview', 'Mülakat hazırlığı', 'Yaşam döngüsü, performans ve mimari soruları; projeni demo et.', 3, 8, [book('React Native Interview Questions (GitHub)')]),
      ],
    },
  ],
};
