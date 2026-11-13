import AsyncStorage from '@react-native-async-storage/async-storage';
import { createClient } from '@supabase/supabase-js';
import { AppState, Platform } from 'react-native';

import { SUPABASE_PUBLISHABLE_KEY, SUPABASE_URL } from './config';
import type { Database } from './database.types';

// Her ağ isteğine üst süre. Yarı kopuk bağlantıda (ör. otel Wi-Fi giriş sayfası) istek sonsuza dek
// beklemesin; süre dolunca istek hata verir ve ekranlar "Tekrar dene" gösterir.
//  - OKUMA (liste/ekran verisi): kısa süre. Kullanıcı hatayı ~4 sn'de görür, boş ekranda beklemez.
//  - YAZMA (işaretleme, kayıt, giriş): uzun süre. İstek sunucuda işlenmiş olabilir; erken kesersek
//    kullanıcı "kaydedilmedi" sanır ama kayıt yapılmış olur. Yazmayı KISALTMA.
const READ_TIMEOUT_MS = 4000;
const WRITE_TIMEOUT_MS = 15000;

// Veri okuyan RPC'ler POST ile gider ama yazmaz; süre kuralı için "okuma" sayılır.
const READ_RPC = /\/rest\/v1\/rpc\/(league_week|showcase_list|friends_overview|blocked_list)(\?|$)/;

function isRead(input: string | URL | Request, init?: RequestInit): boolean {
  const method = (init?.method ?? (typeof input === 'object' && 'method' in input ? input.method : 'GET')).toUpperCase();
  if (method === 'GET' || method === 'HEAD') return true;
  const url = typeof input === 'string' ? input : input instanceof URL ? input.href : input.url;
  return READ_RPC.test(url);
}

const fetchWithTimeout: typeof fetch = (input, init) => {
  // Çağıran kendi iptal sinyalini verdiyse (ör. yapay zekâ çağrılarındaki 20-30 sn'lik süre) ona dokunma
  if (init?.signal) return fetch(input, init);
  const controller = new AbortController();
  const timer = setTimeout(() => controller.abort(), isRead(input, init) ? READ_TIMEOUT_MS : WRITE_TIMEOUT_MS);
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
  // supabase-js okumalarda ağ hatasında kendiliğinden 3 kez dener (1+2+4 sn bekleyerek): hata ekranı
  // ~7 sn geç çıkıyordu. Yeniden deneme kararını kullanıcıya bırakırız ("Tekrar dene" düğmesi).
  db: { retry: false },
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
