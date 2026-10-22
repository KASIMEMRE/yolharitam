// Günün görevi: her gün TEK, küçük (≈5 dk) bir iş. Gün içinde sabit kalsın diye o gün ilk
// hesaplandığında cihazda saklanır (konu bitince hedef değişip görev "kaybolmasın").
import AsyncStorage from '@react-native-async-storage/async-storage';

import { dayKey } from '@/constants/activity';
import type { DevRoadmap } from '@/constants/dev-roadmaps';
import { nextTopic, type Personalization, type TopicStatus } from '@/constants/dev-roadmaps/personalize';
import { supabase } from '@/lib/supabase';

export type DailyTaskKind = 'finish' | 'quiz' | 'start';
export type DailyTask = {
  day: string;
  roadmapId: string;
  kind: DailyTaskKind;
  topicId: string;
  topicTitle: string;
};

const KEY_PREFIX = 'yolharitam.daily-task.v1';
let currentKey: string | null = null;
// Yükleme SÖZÜ (promise) önbelleği: eşzamanlı iki çağrı aynı okumayı bekler.
// (Eskiden "yüklendi" bayrağı okuma bitmeden kuruluyordu; ikinci çağrı kayıtlı görevi görmeden yenisini üretip eziyordu.)
let loading: Promise<DailyTask | null> | null = null;
let generation = 0; // oturum değişince artar; eski okumanın sonucu yeni oturuma karışmasın

async function currentUserId(): Promise<string> {
  try {
    const { data } = await supabase.auth.getSession(); // yerel okuma, ağ gerektirmez
    return data.session?.user.id ?? 'anon';
  } catch {
    return 'anon';
  }
}

function load(): Promise<DailyTask | null> {
  if (!loading) {
    loading = (async () => {
      // Okurken oturum değişirse (generation arttıysa) sonuç eski kullanıcıya aittir: at ve yeniden oku.
      // Aksi halde currentKey boş kalır ve yeni görev diske yazılmazdı.
      for (;;) {
        const gen = generation;
        // Anahtara kullanıcı id'si girer: aynı cihazda hesap değişince başkasının görevi gelmesin
        const key = `${KEY_PREFIX}.${await currentUserId()}`;
        let task: DailyTask | null = null;
        try {
          const raw = await AsyncStorage.getItem(key);
          task = raw ? (JSON.parse(raw) as DailyTask) : null;
        } catch {
          task = null;
        }
        if (gen === generation) {
          currentKey = key;
          return task;
        }
      }
    })();
  }
  return loading;
}

function save(task: DailyTask) {
  loading = Promise.resolve(task);
  if (currentKey) AsyncStorage.setItem(currentKey, JSON.stringify(task)).catch(() => {});
}

// Kullanıcı değişince (çıkış / başka hesap) bellek önbelleğini temizle
let lastUserId: string | null | undefined;
supabase.auth.onAuthStateChange((_event, session) => {
  const uid = session?.user.id ?? null;
  if (lastUserId !== undefined && uid !== lastUserId) {
    generation++;
    currentKey = null;
    loading = null;
  }
  lastUserId = uid;
});

// Günün sırasına göre görev türü: her gün aynı şey gelmesin diye dönüşümlü
const ROTATION: DailyTaskKind[] = ['quiz', 'finish', 'quiz', 'start'];

export function taskTitle(task: DailyTask): string {
  if (task.kind === 'finish') return `“${task.topicTitle}” konusunu bitir`;
  if (task.kind === 'quiz') return `“${task.topicTitle}” quiz'ini çöz`;
  return `“${task.topicTitle}” konusuna başla`;
}

// Bugünün görevini döndürür; yoksa haritanın durumuna göre oluşturur.
export async function getTodayTask(
  roadmapId: string,
  map: DevRoadmap,
  statuses: ReadonlyMap<string, TopicStatus>,
  personalization: Personalization
): Promise<DailyTask | null> {
  const today = dayKey(new Date());
  const existing = await load();
  if (existing && existing.day === today && existing.roadmapId === roadmapId) return existing;

  const target = nextTopic(map, statuses, personalization);
  if (!target) return null; // harita bitti: görev yok
  const status = statuses.get(target.id);
  const dayIndex = Math.floor(new Date().setHours(0, 0, 0, 0) / 86400000);
  let kind = ROTATION[dayIndex % ROTATION.length];
  // Mantığa uydur: zaten çalışılan konuda "başla" demeyelim, hiç başlanmamış konuyu "bitir" demeyelim
  if (status === 'in_progress' && kind === 'start') kind = 'finish';
  if (!status && kind === 'finish') kind = 'start';

  const task: DailyTask = { day: today, roadmapId, kind, topicId: target.id, topicTitle: target.title };
  save(task);
  return task;
}

// Bir XP olayı bugünün görevini tamamlıyor mu?
export async function matchesTodayTask(event: { kind: string; roadmapId?: string; topicId?: string }): Promise<boolean> {
  const task = await load();
  if (!task || task.day !== dayKey(new Date())) return false;
  if (event.roadmapId && event.roadmapId !== task.roadmapId) return false;
  if (task.kind === 'finish') return event.kind === 'topic_done' && event.topicId === task.topicId;
  if (task.kind === 'quiz') return event.kind === 'quiz_done' && event.topicId === task.topicId;
  // start: hedef konuya başlamak ya da onu doğrudan bitirmek
  return (event.kind === 'topic_started' || event.kind === 'topic_done') && event.topicId === task.topicId;
}
