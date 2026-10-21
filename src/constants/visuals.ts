import { getRoadmap, KIND_LABEL, type ResourceKind, type TopicMarker } from '@/constants/dev-roadmaps';
import type { TopicStatus } from '@/constants/dev-roadmaps/personalize';
import type { ThemeColor } from '@/constants/theme';

// Görsel eşleme tabloları: hangi durumun/işaretin hangi emoji ve renkle görüneceği SADECE burada tutulur.
// (Haritaların kendi emoji ve rengi dev-roadmaps içinde, haritayla birlikte durur.)

export type Hue = 'accent' | 'marker' | 'sky' | 'coral' | 'violet' | 'berry' | 'leaf';

// line = kenarlık/ikon çerçevesi, soft = zemin, ink = o zemin üstündeki yazı, edge = 3D alt kenar.
// Değerler theme.ts anahtarlarıdır (hex değil); bileşen `theme[anahtar]` ile gerçek rengi alır.
export const HUES: Record<Hue, { line: ThemeColor; soft: ThemeColor; ink: ThemeColor; edge: ThemeColor }> = {
  accent: { line: 'accent', soft: 'accentSoft', ink: 'accentInk', edge: 'accentEdge' },
  // Düz marker kenarlık için fazla açık (kontrast düşük), o yüzden markerEdge kullanılır
  marker: { line: 'markerEdge', soft: 'markerSoft', ink: 'markerInk', edge: 'markerEdge' },
  sky: { line: 'sky', soft: 'skySoft', ink: 'skyInk', edge: 'skyEdge' },
  coral: { line: 'coral', soft: 'coralSoft', ink: 'coralInk', edge: 'coralEdge' },
  violet: { line: 'violet', soft: 'violetSoft', ink: 'violetInk', edge: 'violetEdge' },
  berry: { line: 'berry', soft: 'berrySoft', ink: 'berryInk', edge: 'berryEdge' },
  leaf: { line: 'leaf', soft: 'leafSoft', ink: 'leafInk', edge: 'leafEdge' },
};

// Seviye id'leri onboarding.ts içindeki LEVELS ile birebir aynı.
// Seviyede renk ailesi YOK (renk yalnız kategoriye ait), sadece emoji.
export const LEVEL_STYLE: Record<string, { emoji: string }> = {
  beginner: { emoji: '🌱' },
  intermediate: { emoji: '🧭' },
  advanced: { emoji: '🏔️' },
};

// Konu durumları (bitti / çalışıyorum / atladım) ve harita işaretleri (önerilen / isteğe bağlı / alternatif).
// Anahtarlar dev-roadmaps tipleriyle birebir aynı.
export const STATUS_STYLE: Record<TopicStatus, { label: string; emoji: string; hue: Hue | null }> = {
  done: { label: 'Bitti', emoji: '✅', hue: 'accent' },
  in_progress: { label: 'Çalışıyorum', emoji: '⏳', hue: 'marker' },
  skipped: { label: 'Atladım', emoji: '⏭️', hue: null },
};

export const MARKER_STYLE: Record<TopicMarker, { label: string; description: string }> = {
  core: { label: 'Önerilen', description: 'Bu yol için öğrenmen önerilir.' },
  optional: { label: 'İsteğe bağlı', description: 'Bilmek artı kazandırır ama şart değil.' },
  alt: { label: 'Alternatif', description: 'Bölümdeki önerilen konunun yerine seçebilirsin; ikisi birden gerekmez.' },
};

export const RESOURCE_KIND_STYLE: Record<ResourceKind, { label: string; emoji: string }> = {
  docs: { label: 'Doküman', emoji: '📄' },
  video: { label: 'Video', emoji: '🎬' },
  course: { label: 'Kurs', emoji: '🎓' },
  book: { label: 'Kitap', emoji: '📚' },
  practice: { label: 'Alıştırma', emoji: '🛠️' },
};

// Tanımadığımız bir kimlik gelirse (örn. eski sürümden kalan konu yolu) çökmek yerine bunu kullan.
export const DEFAULT_CATEGORY: { emoji: string; hue: Hue } = { emoji: '🧭', hue: 'accent' };

// Yol haritası kaydındaki topic_path'ten (harita kimliği) ekranların ortak ihtiyacı olan özeti çıkarır.
// Eski sürümden kalan konu yollarında ('sports/football/…') hasTopic=false döner; ekranlar
// kullanıcıyı yeni bir harita seçmeye yönlendirir.
export function describeTopic(topicPath?: string | null) {
  const map = getRoadmap(topicPath);
  const category = map ? { emoji: map.emoji, hue: map.hue } : DEFAULT_CATEGORY;
  return {
    title: map?.title ?? 'Seçtiğin konu',
    parents: map ? KIND_LABEL[map.kind] : '',
    category,
    hue: HUES[category.hue],
    hasTopic: Boolean(map),
  };
}
