import type { ThemeColor } from '@/constants/theme';

// Görsel eşleme tabloları: veri dosyaları (topics.ts, onboarding.ts) değişmez,
// hangi kategorinin hangi emoji/renkle görüneceği SADECE burada tutulur.

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

// Kategori id'leri topics.ts'teki kök id'lerle birebir aynı.
export const CATEGORY_STYLE: Record<string, { emoji: string; hue: Hue }> = {
  tech: { emoji: '💻', hue: 'sky' },
  business: { emoji: '💼', hue: 'coral' },
  finance: { emoji: '💰', hue: 'leaf' },
  science: { emoji: '🔬', hue: 'violet' },
  design: { emoji: '🎨', hue: 'berry' },
  languages: { emoji: '🗣️', hue: 'accent' },
  sports: { emoji: '⚽', hue: 'coral' },
  personal: { emoji: '🌟', hue: 'violet' },
};

// Tanımadığımız bir id gelirse (örn. veritabanında eski/bozuk veri) çökmek yerine bunu kullan.
export const DEFAULT_CATEGORY: { emoji: string; hue: Hue } = { emoji: '🧭', hue: 'accent' };

// topic_path ('tech/ai/llm') içinden kategori görünümünü bulur.
export function getCategoryStyle(topicPath?: string | null) {
  const rootId = topicPath?.split('/')[0] ?? '';
  return CATEGORY_STYLE[rootId] ?? DEFAULT_CATEGORY;
}
