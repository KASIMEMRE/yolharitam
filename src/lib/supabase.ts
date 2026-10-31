import AsyncStorage from '@react-native-async-storage/async-storage';
import { createClient } from '@supabase/supabase-js';
import { AppState, Platform } from 'react-native';

import { SUPABASE_PUBLISHABLE_KEY, SUPABASE_URL } from './config';
import type { Database } from './database.types';

// Her ağ isteğine üst süre: yarı kopuk bağlantıda (ör. otel Wi-Fi giriş sayfası) istek sonsuza dek
// beklemesin; süre dolunca istek hata verir ve ekranlar "Tekrar dene" gösterir.
const REQUEST_TIMEOUT_MS = 15000;
const fetchWithTimeout: typeof fetch = (input, init) => {
  // Çağıran kendi iptal sinyalini verdiyse (ör. yapay zekâ çağrılarındaki 20-30 sn'lik süre) ona dokunma
  if (init?.signal) return fetch(input, init);
  const controller = new AbortController();
  const timer = setTimeout(() => controller.abort(), REQUEST_TIMEOUT_MS);
  return fetch(input, { ...init, signal: controller.signal }).finally(() => clearTimeout(timer));
};

// Uygulamanın Supabase ile konuştuğu TEK nesne. Her yerden bunu import edeceğiz.
// <Database> sayesinde TypeScript tablolarımızı ve sütunlarımızı tanır.
// Web'de Expo Router sayfaları önce Node'da (sunucu tarafı render) çalıştırır.
// Node'da `window` yoktur; AsyncStorage web'de window.localStorage kullandığı için
// orada çağrılırsa "window is not defined" ile çöker. Bu yüzden sunucuda depolama
// vermiyoruz ve oturum saklama/yenilemeyi kapatıyoruz (sunucuda oturum zaten olmaz).
const isServer = typeof window === 'undefined';

export const supabase = createClient<Database>(SUPABASE_URL, SUPABASE_PUBLISHABLE_KEY, {
  global: { fetch: fetchWithTimeout },
  auth: {
    storage: isServer ? undefined : AsyncStorage, // Oturumu cihazda sakla: uygulama kapanınca çıkış yapılmasın
    autoRefreshToken: !isServer, // Oturum anahtarı süresi dolmadan kendiliğinden yenilensin
    persistSession: !isServer,
    detectSessionInUrl: false, // Giriş e-posta linkiyle değil kodla/şifreyle yapılıyor; adres çubuğunu taramaya gerek yok
  },
});

// Uygulama ön plandayken oturum yenilemeyi çalıştır, arka plana geçince durdur (pil tasarrufu).
if (Platform.OS !== 'web') {
  AppState.addEventListener('change', (state) => {
    if (state === 'active') {
      supabase.auth.startAutoRefresh();
    } else {
      supabase.auth.stopAutoRefresh();
    }
  });
}
