// Kayıt kapısı: misafir gezinirken hesap gerektiren bir şey yapmak isterse (harita seçmek, konu açmak,
// topluluğa katılmak) önce kayıt ekranı açılır. Yarım kalan iş "bekleyen niyet" olarak cihazda saklanır;
// kişi giriş yapınca kaldığı yerden devam eder (bkz. usePendingIntentRunner).
import AsyncStorage from '@react-native-async-storage/async-storage';
import { router, usePathname } from 'expo-router';
import { useEffect, useRef, useState } from 'react';

import { getRoadmap } from '@/constants/dev-roadmaps';
import { useAuth } from '@/lib/auth-context';

export type PendingIntent =
  | { type: 'pick-map'; mapId: string }
  | { type: 'open-topic'; mapId: string; topicId: string }
  | { type: 'community'; tab?: 'league' | 'friends' | 'showcase' };

const KEY = 'yolharitam.pending-intent.v1';
// Niyet yalnız kısa süre geçerli: kayıt ekranını kapatıp günler sonra giriş yapan kişi habersiz yönlendirilmesin
const MAX_AGE_MS = 30 * 60 * 1000;

// Niyeti yazar. Depolama hatası kayıt akışını bozmasın diye sessizce yutulur (en kötü ihtimal: kişi
// kayıttan sonra yarım kalan işe değil, normal açılışa gider).
export async function savePendingIntent(intent: PendingIntent): Promise<void> {
  try {
    await AsyncStorage.setItem(KEY, JSON.stringify({ ...intent, at: Date.now() }));
  } catch {
    // yut
  }
}

// Bozuk ya da eski sürümden kalma bir kayıt asla yönlendirme yapmasın: şekli elle doğrularız.
function parseIntent(raw: string | null): PendingIntent | null {
  if (!raw) return null;
  try {
    const v = JSON.parse(raw) as Record<string, unknown>;
    if (typeof v.at !== 'number' || Date.now() - v.at > MAX_AGE_MS) return null; // eski niyet: yok say
    if (v.type === 'pick-map' && typeof v.mapId === 'string') return { type: 'pick-map', mapId: v.mapId };
    if (v.type === 'open-topic' && typeof v.mapId === 'string' && typeof v.topicId === 'string')
      return { type: 'open-topic', mapId: v.mapId, topicId: v.topicId };
    if (v.type === 'community') {
      const tab = v.tab === 'league' || v.tab === 'friends' || v.tab === 'showcase' ? v.tab : undefined;
      return { type: 'community', tab };
    }
  } catch {
    // bozuk JSON: yok say
  }
  return null;
}

// Oku + sil: TEK SEFERLİK. Önce silmek, uygulama sırasında bir hata olsa da niyetin
// ikinci kez (döngüyle) uygulanmasını engeller.
export async function takePendingIntent(): Promise<PendingIntent | null> {
  try {
    const raw = await AsyncStorage.getItem(KEY);
    if (raw !== null) await AsyncStorage.removeItem(KEY);
    return parseIntent(raw);
  } catch {
    return null;
  }
}

// Niyeti iptal et: kişi kayıt ekranını "Şimdilik gez" ile kapatınca ya da çıkış yapınca
export async function clearPendingIntent(): Promise<void> {
  try {
    await AsyncStorage.removeItem(KEY);
  } catch {
    // yut
  }
}

// Son girişte yapılan "niyeti al" işi (bitse de sonucu saklanır). İlk harita yönlendirmesi
// (use-first-map-redirect) bunu bekler: bekleyen niyet varsa o çalışır, "ilk haritanı seç" atlanır.
let taking: Promise<PendingIntent | null> | null = null;
export function intentBeingApplied(): Promise<PendingIntent | null> {
  return taking ?? Promise.resolve(null);
}

// Niyetin gideceği adres. Bilinmeyen harita gelirse null: yok sayılır (içerik sonradan değişmiş olabilir).
function targetOf(intent: PendingIntent) {
  if (intent.type === 'community')
    return { pathname: '/community' as const, params: intent.tab ? { tab: intent.tab } : {} };
  if (!getRoadmap(intent.mapId)) return null;
  if (intent.type === 'pick-map') return { pathname: '/onboarding' as const, params: { map: intent.mapId } };
  return { pathname: '/topic/[id]' as const, params: { id: intent.topicId, map: intent.mapId } };
}

// Kök düzende bir kez çağrılır: oturum yokken doluya geçince bekleyen niyeti alır ve uygular.
//
// NEDEN yol (pathname) bekliyoruz? Oturum açılınca `login` ekranı korumalı gruptan çıkar ve expo-router
// yığını kendisi toparlar (ara bir "/" ve ardından "/roadmap"a düşer). Niyeti bu toparlamadan ÖNCE
// uygularsak toparlama onu ezer. Bu yüzden yol "/login" ve "/" dışına çıkana kadar bekler, sonra uygularız.
// Yığın toparlanmış olduğundan push kullanılır: geri düğmesi sekmelere döner.
export function usePendingIntentRunner() {
  const { session, loading } = useAuth();
  const uid = session?.user.id;
  const pathname = usePathname();
  const [intent, setIntent] = useState<PendingIntent | null>(null);
  // Aynı niyet ikinci kez uygulanmasın (yol her değiştiğinde efekt yeniden çalışır)
  const applied = useRef<PendingIntent | null>(null);

  // 1) Oturum oluşunca niyeti oku (ve sil). Çıkışta önceki oturumun izleri temizlenir.
  useEffect(() => {
    if (loading) return;
    if (!uid) {
      taking = null;
      applied.current = null;
      return;
    }
    // İptal bayrağı bilerek yok: niyet okunurken silinir, geliştirmedeki çift efekt çalışmasında
    // ikinci çalışma boş dönerdi; birincinin sonucu uygulanmalı.
    const job = takePendingIntent();
    taking = job;
    job.then(setIntent);
  }, [loading, uid]);

  // 2) Yığın oturduğunda uygula
  useEffect(() => {
    // Kimlik değil İÇERİK karşılaştırılır: geliştirmedeki çift efekt aynı niyeti iki ayrı nesne olarak getirebilir
    if (!intent || (applied.current && JSON.stringify(applied.current) === JSON.stringify(intent))) return;
    if (pathname === '/login' || pathname === '/') return;
    applied.current = intent;
    // Bilinmeyen harita (içerik değişmiş): yeni kullanıcı boş ekranda kalmasın, katalog açılsın
    const target = targetOf(intent) ?? { pathname: '/onboarding' as const, params: {} };
    // Zaten o ekrandaysak (örn. toparlama doğrudan oraya düştüyse) yığına bir kopya daha ekleme
    if (pathname === target.pathname) router.replace(target);
    else router.push(target);
  }, [intent, pathname]);
}

// Ekranların kullandığı kapı. requireAuth true dönerse işe devam edilir; false dönerse kayıt ekranı
// açılmıştır ve çağıran ekran işini bırakmalıdır.
export function useAuthGate() {
  const { session } = useAuth();

  function requireAuth(intent: PendingIntent, reason: string): boolean {
    if (session) return true;
    void savePendingIntent(intent);
    router.push({ pathname: '/login', params: { mode: 'signup', reason } });
    return false;
  }

  return { requireAuth, isGuest: !session };
}
