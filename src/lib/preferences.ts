// Kullanıcı tercihleri (yalnız bu cihazda saklanır): tema ve haritanın varsayılan görünümü.
//
// Neden veritabanı değil? Bunlar cihaza özel görünüm ayarları; telefonda koyu, tablette açık
// kullanmak isteyebilirsin. AsyncStorage'da tutulur.
//
// Basit bir "dış depo" (external store): değer modül düzeyinde durur, değişince aboneler haberdar edilir.
// Bileşenler useSyncExternalStore ile okur; böylece her ekran aynı değeri görür ve ayar değişince
// uygulamanın tamamı anında güncellenir (Context sağlayıcısı gerekmez).
import AsyncStorage from '@react-native-async-storage/async-storage';
import { useSyncExternalStore } from 'react';

export type ThemePref = 'system' | 'light' | 'dark';
export type MapViewPref = 'tree' | 'list';
export type Preferences = { theme: ThemePref; mapView: MapViewPref };

const KEY = 'yolharitam.preferences.v1';
const DEFAULTS: Preferences = { theme: 'system', mapView: 'tree' };

let current: Preferences = DEFAULTS;
const listeners = new Set<() => void>();

function emit() {
  for (const l of listeners) l();
}

function sanitize(value: unknown): Preferences {
  const v = (value ?? {}) as Partial<Preferences>;
  return {
    theme: v.theme === 'light' || v.theme === 'dark' ? v.theme : 'system',
    mapView: v.mapView === 'list' ? 'list' : 'tree',
  };
}

// Uygulama açılırken bir kez okunur. Web'in sunucu tarafında (window yok) AsyncStorage çağrılmaz.
if (typeof window !== 'undefined') {
  AsyncStorage.getItem(KEY)
    .then((raw) => {
      if (!raw) return;
      current = sanitize(JSON.parse(raw));
      emit();
    })
    .catch(() => {
      // okunamazsa varsayılanlarla devam
    });
}

export function setPreferences(patch: Partial<Preferences>) {
  current = sanitize({ ...current, ...patch });
  emit();
  AsyncStorage.setItem(KEY, JSON.stringify(current)).catch(() => {
    // kaydedilemezse bu oturumda yine geçerli kalır
  });
}

function subscribe(listener: () => void) {
  listeners.add(listener);
  return () => listeners.delete(listener);
}

export function usePreferences(): Preferences {
  return useSyncExternalStore(
    subscribe,
    () => current,
    () => DEFAULTS
  );
}
