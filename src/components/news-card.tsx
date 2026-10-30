import { openBrowserAsync } from 'expo-web-browser';
import { Linking, Pressable, StyleSheet, View } from 'react-native';

import { Glyph } from '@/components/icon';
import { ThemedText } from '@/components/themed-text';
import { Border, Edge, Radius, Spacing } from '@/constants/theme';
import { useTheme } from '@/hooks/use-theme';
import type { NewsItem } from '@/hooks/use-news';
import { relativeTime } from '@/lib/relative-time';

// Haberi kaynağın sitesinde açar. Telif gereği haberin tamamını biz göstermeyiz.
async function openSource(url: string) {
  try {
    // Uygulama içi tarayıcı; web'de çalışmazsa sistemin linkine düşeriz
    await openBrowserAsync(url);
  } catch {
    Linking.openURL(url).catch(() => {});
  }
}

type NewsCardProps = {
  item: NewsItem;
  // Kullanıcının haritalarıyla kesişen etiketler (en çok 2 gösterilir; belirli bir harita seçiliyken boş verilir)
  tags: { id: string; emoji: string; title: string }[];
};

export function NewsCard({ item, tags }: NewsCardProps) {
  const theme = useTheme();
  const when = relativeTime(item.published_at);
  const meta = [item.source_name, when].filter(Boolean).join(' · ');

  return (
    <Pressable
      onPress={() => openSource(item.url)}
      accessibilityRole="link"
      accessibilityLabel={[item.title, item.source_name, when].filter(Boolean).join(', ')}
      accessibilityHint="Kaynağın sitesinde açar"
      style={({ pressed }) => [
        styles.card,
        { backgroundColor: theme.card, borderColor: theme.border, borderBottomColor: theme.borderEdge, opacity: pressed ? 0.85 : 1 },
      ]}>
      <ThemedText type="eyebrow" themeColor="textSecondary" numberOfLines={1}>
        {meta}
      </ThemedText>
      <ThemedText type="cardTitle" numberOfLines={3}>
        {item.title}
      </ThemedText>
      {!!item.summary && (
        <ThemedText type="small" themeColor="textSecondary" numberOfLines={2}>
          {item.summary}
        </ThemedText>
      )}
      <View style={styles.footer}>
        <View style={styles.tags}>
          {tags.slice(0, 2).map((t) => (
            // Hafif etiket: kartın üstünde yumuşak zemin + ince kenar (çok dikkat çekmesin)
            <View key={t.id} style={[styles.tag, { backgroundColor: theme.backgroundElement, borderColor: theme.border }]}>
              <Glyph emoji={t.emoji} size={13} color={theme.textSecondary} strokeWidth={2.25} />
              <ThemedText type="chip" maxFontSizeMultiplier={1.3} numberOfLines={1}>
                {t.title}
              </ThemedText>
            </View>
          ))}
        </View>
        {/* flexShrink:0 + marginLeft:auto: dar ekranda etiketler alt satıra iner, bu metin asla bölünmez */}
        <ThemedText type="small" themeColor="accentInk" numberOfLines={1} style={styles.link}>
          Kaynağa git ↗
        </ThemedText>
      </View>
    </Pressable>
  );
}

const styles = StyleSheet.create({
  card: {
    gap: Spacing.two,
    padding: Spacing.three,
    borderRadius: Radius.lg,
    borderWidth: Border.thick,
    borderBottomWidth: Edge,
  },
  footer: { flexDirection: 'row', flexWrap: 'wrap', alignItems: 'center', columnGap: Spacing.two, rowGap: Spacing.two },
  tags: { flexDirection: 'row', flexWrap: 'wrap', gap: Spacing.one, flexGrow: 1 },
  tag: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: Spacing.one,
    paddingVertical: Spacing.one,
    paddingHorizontal: Spacing.two,
    borderRadius: Radius.pill,
    borderWidth: Border.thin,
  },
  link: { flexShrink: 0, marginLeft: 'auto' },
});
