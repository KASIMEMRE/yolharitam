import { Pressable, StyleSheet, View } from 'react-native';

import { Glyph } from '@/components/icon';
import { ThemedText } from '@/components/themed-text';
import { Spacing } from '@/constants/theme';
import { HUES, type Hue } from '@/constants/visuals';
import { useTheme } from '@/hooks/use-theme';
import type { NewsItem } from '@/hooks/use-news';
import { openExternalUrl } from '@/lib/open-url';
import { relativeTime } from '@/lib/relative-time';

type NewsCardProps = {
  item: NewsItem;
  // Kullanıcının haritalarıyla kesişen etiketler (en çok 2 gösterilir; belirli bir harita seçiliyken boş verilir)
  tags: { id: string; hue: Hue; title: string }[];
};

// Haber satırı: kendi kartı yoktur; Gelişmeler ekranında `ListGroup` içinde ince ayırıcılarla dizilir
// (düz liste: başlık, kaynak · zaman, kısa özet, en çok 2 küçük etiket).
export function NewsCard({ item, tags }: NewsCardProps) {
  const theme = useTheme();
  const when = relativeTime(item.published_at);
  const meta = [item.source_name, when].filter(Boolean).join(' · ');

  return (
    <Pressable
      // Haberi kaynağın sitesinde açar. Telif gereği haberin tamamını biz göstermeyiz.
      onPress={() => openExternalUrl(item.url)}
      accessibilityRole="link"
      accessibilityLabel={[item.title, item.source_name, when].filter(Boolean).join(', ')}
      accessibilityHint="Kaynağın sitesinde açar"
      style={({ pressed }) => [styles.row, pressed && { backgroundColor: theme.backgroundElement }]}>
      <View style={styles.metaLine}>
        <ThemedText type="eyebrow" themeColor="textSecondary" numberOfLines={1} style={styles.meta}>
          {meta}
        </ThemedText>
        {/* "Kaynağa git" yazısı yerine simge: tüm satır dokunulabilir, ok bunu anlatır */}
        <Glyph emoji="↗" size={16} color={theme.textSecondary} strokeWidth={2.25} />
      </View>
      <ThemedText type="cardTitle" numberOfLines={3}>
        {item.title}
      </ThemedText>
      {!!item.summary && (
        <ThemedText type="small" themeColor="textSecondary" numberOfLines={2}>
          {item.summary}
        </ThemedText>
      )}
      {tags.length > 0 && (
        <View style={styles.tags}>
          {tags.slice(0, 2).map((t) => (
            // Etiket kutusuz: harita rengi noktası + ad
            <View key={t.id} style={styles.tag}>
              <View style={[styles.dot, { backgroundColor: theme[HUES[t.hue].line] }]} />
              <ThemedText type="small" themeColor="textSecondary" maxFontSizeMultiplier={1.3} numberOfLines={1}>
                {t.title}
              </ThemedText>
            </View>
          ))}
        </View>
      )}
    </Pressable>
  );
}

const styles = StyleSheet.create({
  row: { gap: Spacing.one, paddingVertical: Spacing.three },
  metaLine: { flexDirection: 'row', alignItems: 'center', gap: Spacing.two },
  meta: { flex: 1, minWidth: 0 },
  tags: { flexDirection: 'row', flexWrap: 'wrap', columnGap: Spacing.three, rowGap: Spacing.half, paddingTop: Spacing.one },
  tag: { flexDirection: 'row', alignItems: 'center', gap: 6, flexShrink: 1 },
  dot: { width: 8, height: 8, borderRadius: 4 },
});
