import { router } from 'expo-router';
import { Pressable, ScrollView, StyleSheet, View } from 'react-native';

import { Banner } from '@/components/banner';
import { Button } from '@/components/button';
import { IconTile } from '@/components/icon-tile';
import { StatusChip } from '@/components/level-badge';
import { SectionHeader } from '@/components/section-header';
import { Skeleton } from '@/components/skeleton';
import { ThemedText } from '@/components/themed-text';
import { summaryText, type AchievementResult } from '@/constants/achievements';
import { Border, Radius, Spacing } from '@/constants/theme';
import { useAchievements } from '@/hooks/use-achievements';
import { useTheme } from '@/hooks/use-theme';
import { ERROR_TEXT } from '@/lib/supabase-errors';

// Profil'deki "Başarımlar" bölümü: durum (yükleniyor/hata/hazır) burada, hesap constants/achievements.ts'te.
// Kazanılan rozet renkli + "Kazanıldı" çipi; kazanılmayan soluk + NASIL kazanılacağı + varsa gerçek ilerleme.
// Durum yalnız renkle değil çip ve metinle de anlatılır (renk körlüğü / ekran okuyucu için).
export function AchievementsSection() {
  const { status, achievements, earnedCount, hasRoadmap, retrying, retry } = useAchievements();

  // Kazanılanlar önce; kendi içinde tanım sırası korunur (sort kararlıdır)
  const ordered = [...achievements].sort((a, b) => Number(b.earned) - Number(a.earned));
  // 2 sütun: satırlara böleriz, her kart flex:1 → dar ekranda (320 px) de taşmaz
  const rows: AchievementResult[][] = [];
  for (let i = 0; i < ordered.length; i += 2) rows.push(ordered.slice(i, i + 2));

  const failed = status === 'schema' || status === 'network' || status === 'error';
  const errorText =
    status === 'schema' ? ERROR_TEXT.loadSchema : status === 'network' ? ERROR_TEXT.achievementsFailed : ERROR_TEXT.other;

  return (
    <View style={styles.section}>
      <View style={styles.header}>
        <ThemedText type="eyebrow" themeColor="textSecondary">
          Başarımlar
        </ThemedText>
        {status === 'ready' && (
          <ThemedText type="smallBold" accessibilityLiveRegion="polite">
            {summaryText(earnedCount, achievements.length)}
          </ThemedText>
        )}
      </View>

      {status === 'loading' && (
        <View accessible accessibilityLabel="Başarımlar yükleniyor" accessibilityState={{ busy: true }} style={styles.grid}>
          {[0, 1].map((row) => (
            <View key={row} style={styles.row}>
              <Skeleton width="48%" height={132} radius={Radius.lg} />
              <Skeleton width="48%" height={132} radius={Radius.lg} />
            </View>
          ))}
        </View>
      )}

      {failed && (
        <View style={styles.grid}>
          <Banner tone="warning">{errorText}</Banner>
          <Button variant="secondary" label="Tekrar dene" loading={retrying} onPress={retry} />
        </View>
      )}

      {status === 'ready' && (
        <>
          {/* Yol haritası yoksa hiçbir rozet kazanılamaz: neden olduğunu söyleriz */}
          {!hasRoadmap && (
            <ThemedText type="small" themeColor="textSecondary">
              Rozet kazanmak için önce bir yol haritası seç.
            </ThemedText>
          )}
          <View style={styles.grid}>
            {rows.map((row) => (
              <View key={row[0].id} style={styles.row}>
                {row.map((a) => (
                  <AchievementCard key={a.id} item={a} />
                ))}
                {/* Tek kalan kart varsa yarım genişlikte kalsın diye boş yer tutucu */}
                {row.length === 1 && <View style={styles.spacer} />}
              </View>
            ))}
          </View>
          <ThemedText type="small" themeColor="textSecondary">
            Rozetler bitirdiğin konulardan hesaplanır. Bir konunun işaretini kaldırırsan rozet de değişebilir.
          </ThemedText>
        </>
      )}
    </View>
  );
}

// Profil'deki yatay şerit: ilk birkaç rozet (kazanılanlar önce) + "Tümü" ile tam liste ekranı.
// Neden şerit: profilde 9 kartlık ızgara sayfayı uzatıyordu; ayrıntı aşamalı gösterilir (dokununca açılır).
const STRIP_COUNT = 5;

export function AchievementsStrip() {
  const { status, achievements, earnedCount, retrying, retry } = useAchievements();
  const ordered = [...achievements].sort((a, b) => Number(b.earned) - Number(a.earned));
  const failed = status === 'schema' || status === 'network' || status === 'error';
  const errorText =
    status === 'schema' ? ERROR_TEXT.loadSchema : status === 'network' ? ERROR_TEXT.achievementsFailed : ERROR_TEXT.other;
  const openAll = () => router.push('/achievements');

  return (
    <View style={styles.section}>
      <SectionHeader
        title="Başarımlar"
        subtitle={status === 'ready' ? summaryText(earnedCount, achievements.length) : undefined}
        action={status === 'ready' ? { label: 'Tümü', onPress: openAll } : undefined}
      />
      {status === 'loading' && (
        <View accessible accessibilityLabel="Başarımlar yükleniyor" accessibilityState={{ busy: true }} style={styles.stripRow}>
          {[0, 1, 2, 3].map((i) => (
            <Skeleton key={i} width={72} height={84} radius={Radius.md} />
          ))}
        </View>
      )}
      {failed && (
        <View style={styles.grid}>
          <Banner tone="warning">{errorText}</Banner>
          <Button variant="secondary" label="Tekrar dene" loading={retrying} onPress={retry} />
        </View>
      )}
      {status === 'ready' && (
        <ScrollView horizontal showsHorizontalScrollIndicator={false} contentContainerStyle={styles.stripRow}>
          {ordered.slice(0, STRIP_COUNT).map((a) => (
            <Pressable
              key={a.id}
              onPress={openAll}
              accessibilityRole="button"
              accessibilityLabel={`${a.title}. ${a.earned ? 'Kazanıldı' : 'Henüz kazanılmadı'}. Tüm başarımları aç`}
              style={styles.chip}>
              {/* Kazanılmayan soluk; renk tek başına anlam taşımasın diye erişilebilirlik etiketi durumu da söyler */}
              <View style={a.earned ? undefined : styles.dimmed}>
                <IconTile emoji={a.emoji} tone={a.earned ? a.hue : 'neutral'} size={48} />
              </View>
              <ThemedText type="small" themeColor={a.earned ? 'text' : 'textSecondary'} numberOfLines={2} style={styles.chipText}>
                {a.title}
              </ThemedText>
            </Pressable>
          ))}
        </ScrollView>
      )}
    </View>
  );
}

function AchievementCard({ item }: { item: AchievementResult }) {
  const theme = useTheme();
  const { earned, hint } = item;

  // Ekran okuyucu: "Ad. Kazanıldı." ya da "Ad. Henüz kazanılmadı. Koşul. İlerleme: 2 / 3 adım."
  const label = earned
    ? `${item.title}. Kazanıldı. ${item.description}`
    : `${item.title}. Henüz kazanılmadı. ${item.howTo}${hint ? ` İlerleme: ${hint.label}.` : ''}`;

  return (
    <View
      accessible
      accessibilityRole="text"
      accessibilityLabel={label}
      style={[
        styles.card,
        // Sadelik: rozet kartları düz (ince kenar, 3D alt kenar yok). Renk kimliği yalnız simge kutusunda;
        // kazanıldı bilgisi çip ve metinle verilir. 9 renkli 3D kart ekranı bağırtıyordu.
        earned
          ? { backgroundColor: theme.card, borderColor: theme.border }
          : { backgroundColor: theme.backgroundElement, borderColor: 'transparent' },
      ]}>
      {/* Kazanılmayanın simgesi soluk: "henüz senin değil" hissi; metin okunaklı kalsın diye yalnız simge solar */}
      <View style={earned ? undefined : styles.dimmed}>
        <IconTile emoji={item.emoji} tone={earned ? item.hue : 'neutral'} size={48} />
      </View>
      <ThemedText type="smallBold" themeColor={earned ? 'text' : 'textSecondary'}>
        {item.title}
      </ThemedText>
      {earned ? (
        <>
          <ThemedText type="small" themeColor="textSecondary">
            {item.description}
          </ThemedText>
          <StatusChip label="Kazanıldı" emoji="✓" tone="accent" />
        </>
      ) : (
        <>
          <ThemedText type="small" themeColor="textSecondary">
            {item.howTo}
          </ThemedText>
          {hint && (
            <View style={styles.hintBlock}>
              <ThemedText type="chip" themeColor="textSecondary">
                {hint.label}
              </ThemedText>
              {/* Çubuk yalnız süs; asıl bilgi yukarıdaki sayı metni */}
              <View style={[styles.track, { backgroundColor: theme.backgroundSelected }]}>
                <View
                  style={[
                    styles.fill,
                    { backgroundColor: theme.accent, width: `${Math.round((hint.current / hint.target) * 100)}%` },
                  ]}
                />
              </View>
            </View>
          )}
        </>
      )}
    </View>
  );
}

const styles = StyleSheet.create({
  section: { gap: Spacing.two },
  header: { gap: Spacing.one },
  grid: { gap: Spacing.two },
  row: { flexDirection: 'row', gap: Spacing.two },
  spacer: { flex: 1 },
  card: {
    flex: 1,
    minWidth: 0, // dar ekranda uzun metin kartı taşırmasın
    gap: Spacing.one,
    padding: Spacing.three,
    borderRadius: Radius.lg,
    borderWidth: Border.thin,
  },
  stripRow: { flexDirection: 'row', gap: Spacing.three },
  chip: { width: 72, alignItems: 'center', gap: Spacing.one },
  chipText: { textAlign: 'center' },
  dimmed: { opacity: 0.5, alignSelf: 'flex-start' },
  hintBlock: { gap: Spacing.one, marginTop: Spacing.one },
  track: { height: 6, borderRadius: Radius.pill, overflow: 'hidden' },
  fill: { height: 6, borderRadius: Radius.pill },
});
