import Constants, { ExecutionEnvironment } from 'expo-constants';
import { Platform } from 'react-native';
import * as Sentry from '@sentry/react-native';

// Çökme ve hata takibi (Sentry). Kurulum adımları: docs/SENTRY.md
//
// DSN (Sentry'nin "bu raporları şu projeye gönder" adresi) EAS ortam değişkeninden gelir. Gizli değildir
// (zaten her uygulamanın içinde durur) ama yine de koda yazmıyoruz; böylece anahtarı değiştirmek için
// kodu değiştirmek gerekmez. DSN boşsa Sentry hiç başlatılmaz ve uygulama olduğu gibi çalışır.
const DSN = process.env.EXPO_PUBLIC_SENTRY_DSN;

// Expo Go'nun içinde yerel (native) Sentry parçası yok; orada hiç başlatmıyoruz ki uygulama bozulmasın.
// Web sürümü de mağaza ürünü değil; yalnız telefon uygulaması izlenir.
const isExpoGo = Constants.executionEnvironment === ExecutionEnvironment.StoreClient;
const canRun = !!DSN && !isExpoGo && Platform.OS !== 'web';

export function initSentry() {
  if (!canRun) return;

  Sentry.init({
    dsn: DSN,
    // Kimlik yok: IP, çerez, kullanıcı başlığı gibi varsayılan kişisel veriler gönderilmez.
    sendDefaultPii: false,
    // Geliştirmede gönderme: kendi denemelerimiz gerçek çökme sayısını şişirmesin.
    enabled: !__DEV__,
    environment: __DEV__ ? 'development' : 'production',
    // Yalnız hata: performans izleme, profil ve oturum tekrarı kapalı.
    tracesSampleRate: 0,
    profilesSampleRate: 0,
    replaysSessionSampleRate: 0,
    replaysOnErrorSampleRate: 0,
    enableAutoSessionTracking: false,
    attachScreenshot: false,
    attachViewHierarchy: false,
    // Ağ istekleri Supabase adreslerini (içinde kullanıcı kimliği olabilir) ve parametreleri taşır; atılır.
    beforeBreadcrumb(breadcrumb) {
      if (breadcrumb.category === 'fetch' || breadcrumb.category === 'xhr' || breadcrumb.type === 'http') {
        return null;
      }
      return breadcrumb;
    },
    // Son güvenlik ağı: olaya herhangi bir yoldan kullanıcı ya da istek bilgisi girmişse sil.
    beforeSend(event) {
      delete event.user;
      delete event.request;
      return event;
    },
  });
  // release ve dist'i kendimiz yazmıyoruz: SDK bunları derlemedeki sürüm ve sürüm koduyla (expo-constants /
  // yerel paket bilgisi) doldurur, kaynak haritası da aynı değerlerle yüklenir; elle yazarsak eşleşme bozulur.
  // expo-updates'in güncelleme kimliği de SDK tarafından olaya kendiliğinden eklenir.
}

// Kök bileşeni Sentry ile sarar. DSN yoksa bileşeni değiştirmeden döndürür.
export function wrapRoot<T extends React.ComponentType<any>>(component: T): T {
  return canRun ? (Sentry.wrap(component) as unknown as T) : component;
}

// Hata ekranının yakaladığı hatayı bildirir. Sentry başlatılmadıysa hiçbir şey yapmaz.
export function reportError(error: unknown) {
  if (!canRun) return;
  Sentry.captureException(error);
}
