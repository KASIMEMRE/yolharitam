// Harita seçiminde arama (SAF fonksiyon). Harita adı, kısa açıklaması ve konu başlıklarında arar.
// Türkçe karakterlere duyarsız: "ogrenme" yazan "öğrenme"yi, "kubernets" gibi küçük yazım hataları hariç bulur.
import type { DevRoadmap } from '@/constants/dev-roadmaps';

// Arama için sadeleştir: küçük harf, Türkçe harfleri Latin karşılığına çevir, işaretleri at
export function normalizeSearch(s: string): string {
  return s
    .toLocaleLowerCase('tr-TR')
    .replace(/ı/g, 'i')
    .normalize('NFD')
    .replace(/[̀-ͯ]/g, '')
    .replace(/[^a-z0-9+#.]+/g, ' ')
    .trim();
}

export type RoadmapHit = {
  map: DevRoadmap;
  topicTitle?: string; // eşleşme konudaysa hangi konu (kullanıcıya "Konu: ..." diye gösterilir)
};

// Sonuç sırası: adı eşleşenler önce, sonra açıklaması, sonra konusu eşleşenler
export function searchRoadmaps(maps: DevRoadmap[], query: string): RoadmapHit[] {
  const q = normalizeSearch(query);
  if (!q) return maps.map((map) => ({ map }));
  const words = q.split(' ');
  const has = (text: string) => {
    const n = normalizeSearch(text);
    return words.every((w) => n.includes(w));
  };
  const byTitle: RoadmapHit[] = [];
  const byTagline: RoadmapHit[] = [];
  const byTopic: RoadmapHit[] = [];
  for (const map of maps) {
    if (has(map.title)) byTitle.push({ map });
    else if (has(map.tagline)) byTagline.push({ map });
    else {
      const topic = map.sections.flatMap((s) => s.topics).find((t) => has(t.title));
      if (topic) byTopic.push({ map, topicTitle: topic.title });
    }
  }
  return [...byTitle, ...byTagline, ...byTopic];
}
