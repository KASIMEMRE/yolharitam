import AsyncStorage from '@react-native-async-storage/async-storage';
import { createClient } from '@supabase/supabase-js';
import { AppState, Platform } from 'react-native';

import type { Database } from './database.types';

// .env.local dosyasındaki değerler. EXPO_PUBLIC_ ön eki sayesinde uygulamaya gömülür.
const supabaseUrl = process.env.EXPO_PUBLIC_SUPABASE_URL!;
const supabasePublishableKey = process.env.EXPO_PUBLIC_SUPABASE_PUBLISHABLE_KEY!;

// Uygulamanın Supabase ile konuştuğu TEK nesne. Her yerden bunu import edeceğiz.
// <Database> sayesinde TypeScript tablolarımızı ve sütunlarımızı tanır.
export const supabase = createClient<Database>(supabaseUrl, supabasePublishableKey, {
  auth: {
    storage: AsyncStorage, // Oturumu telefonda sakla: uygulama kapanınca çıkış yapılmasın
    autoRefreshToken: true, // Oturum anahtarı süresi dolmadan kendiliğinden yenilensin
    persistSession: true,
    detectSessionInUrl: false, // Bu web'e özgü bir ayar; mobilde kapalı
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
