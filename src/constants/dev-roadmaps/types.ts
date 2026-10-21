// Yazılımcı yol haritalarının veri tipleri.
//
// Kurgu roadmap.sh'ten ilham alır (rol ve beceri haritaları, bölüm → konu ağacı, önerilen /
// isteğe bağlı / alternatif işaretleri, konu başına ilerleme). İÇERİK bize aittir ve Türkçe yazılmıştır:
// roadmap.sh'in metinleri lisansı gereği uygulamaya kopyalanmaz.
//
// Haritalar herkes için AYNIDIR ve uygulamanın içinde durur. Veritabanına yalnız kullanıcının
// konu durumları (topic_progress) ve yapay zekânın kişisel işaretleri (roadmaps.personalization) yazılır.

import type { Hue } from '@/constants/visuals';

// core = önerilen (bu rol için gerekli) · optional = isteğe bağlı (iyi olur) · alt = alternatif
// (aynı bölümdeki önerilen konunun yerine seçilebilir; ikisini birden öğrenmek gerekmez)
export type TopicMarker = 'core' | 'optional' | 'alt';

// Konunun zorluk seviyesi. Kişiselleştirme bununla çalışır: başlangıç seviyesine 1'ler önerilir,
// ileri seviyedeki birine 1'ler "biliyorsan atlayabilirsin" olarak gösterilir.
export type TopicLevel = 1 | 2 | 3;

export type ResourceKind = 'docs' | 'video' | 'course' | 'book' | 'practice';

// Kaynaklar AD olarak verilir, link verilmez (linkler zamanla kırılır). Hepsi gerçek, bilinen kaynaklardır.
export type Resource = { kind: ResourceKind; title: string };

export type Topic = {
  id: string; // harita içinde benzersiz (ilerleme bu kimlikle saklanır: SONRADAN DEĞİŞTİRME)
  title: string;
  summary: string; // 1-2 cümle: ne, neden önemli
  level: TopicLevel;
  hours: number; // tahmini çalışma süresi (saat)
  marker: TopicMarker;
  resources: Resource[];
};

export type Section = {
  id: string;
  title: string;
  emoji: string;
  topics: Topic[];
};

// role = bir meslek/rol için baştan sona yol (Frontend, DevOps…)
// skill = tek bir beceri/teknoloji (Python, SQL, Git…)
export type RoadmapKind = 'role' | 'skill';

export type DevRoadmap = {
  id: string; // veritabanında roadmaps.topic_path olarak saklanır (SONRADAN DEĞİŞTİRME)
  kind: RoadmapKind;
  title: string;
  tagline: string; // seçim ekranındaki tek cümle
  emoji: string;
  hue: Hue;
  sections: Section[];
};

// ---- Kısa yazım yardımcıları (içerik dosyaları okunaklı kalsın diye) ----

export const doc = (title: string): Resource => ({ kind: 'docs', title });
export const vid = (title: string): Resource => ({ kind: 'video', title });
export const course = (title: string): Resource => ({ kind: 'course', title });
export const book = (title: string): Resource => ({ kind: 'book', title });
export const prac = (title: string): Resource => ({ kind: 'practice', title });

// t = önerilen konu, opt = isteğe bağlı, alt = alternatif
export function t(
  id: string,
  title: string,
  summary: string,
  level: TopicLevel,
  hours: number,
  resources: Resource[] = []
): Topic {
  return { id, title, summary, level, hours, marker: 'core', resources };
}
export function opt(...args: Parameters<typeof t>): Topic {
  return { ...t(...args), marker: 'optional' };
}
export function alt(...args: Parameters<typeof t>): Topic {
  return { ...t(...args), marker: 'alt' };
}
