import AsyncStorage from '@react-native-async-storage/async-storage';
import { createClient } from '@supabase/supabase-js';
import { AppState, Platform } from 'react-native';

import type { Database } from './database.types';

// .env.local dosyasındaki değerler. EXPO_PUBLIC_ ön eki sayesinde uygulamaya gömülür.
const supabaseUrl = process.env.EXPO_PUBLIC_SUPABASE_URL!;
const supabasePublishableKey = process.env.EXPO_PUBLIC_SUPABASE_PUBLISHABLE_KEY!;

// Uygulamanın Supabase ile konuştuğu TEK nesne. Her yerden bunu import edeceğiz.
// <Database> sayesinde TypeScript tablolarımızı ve sütunlarımızı tanır.
// Web'de Expo Router sayfaları önce Node'da (sunucu tarafı render) çalıştırır.
// Node'da `window` yoktur; AsyncStorage web'de window.localStorage kullandığı için
// orada çağrılırsa "window is not defined" ile çöker. Bu yüzden sunucuda depolama
// vermiyoruz ve oturum saklama/yenilemeyi kapatıyoruz (sunucuda oturum zaten olmaz).
const isServer = typeof window === 'undefined';

export const supabase = createClient<Database>(supabaseUrl, supabasePublishableKey, {
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
