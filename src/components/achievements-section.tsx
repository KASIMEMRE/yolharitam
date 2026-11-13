import { router } from 'expo-router';
import { Pressable, ScrollView, StyleSheet, View } from 'react-native';

import { Glyph } from '@/components/icon';
import { ListGroup } from '@/components/list-row';
import { LoadError } from '@/components/load-error';
import { SectionHeader } from '@/components/section-header';
import { Skeleton } from '@/components/skeleton';
import { ThemedText } from '@/components/themed-text';
import { summaryText, type AchievementResult } from '@/constants/achievements';
import { Border, Radius, Spacing } from '@/constants/theme';
import { useAchievements } from '@/hooks/use-achievements';
import { useTheme } from '@/hooks/use-theme';
import { loadErrorKind } from '@/lib/supabase-errors';

// Tüm başarımlar ekranının gövdesi: durum (yükleniyor/hata/hazır) burada, hesap constants/achievements.ts'te.
// Sade rozet görünümü: renkli kutu yok; kazanılan rozet mürekkep halkalı, kazanılmayan soluk. Satırlar ince çizgiyle ayrılır.
// Durum yalnız renkle değil metinle de anlatılır (renk körlüğü / ekran okuyucu için).
export function AchievementsSection() {
  const { status, achievements, earnedCount, hasRoadmap, retrying, retry } = useAchievements();

  // Kazanılanlar önce; kendi içinde tanım sırası korunur (sort kararlıdır)
  const ordered = [...achievements].sort((a, b) => Number(b.earned) - Number(a.earned));

  const failed = status === 'schema' || status === 'network' || status === 'error';

  return (
    <View style={styles.section}>
      {/* Kazanılan / toplam: ekran başlığının (üst çubuk) altında sade bir sayı */}
      {status === 'ready' && (
        <View
          accessible
          accessibilityLiveRegion="polite"
          accessibilityLabel={summaryText(earnedCount, achievements.length)}
          style={styles.count}>
          <ThemedText type="display" style={styles.countNumber}>
            {earnedCount}
          </ThemedText>
          <ThemedText type="cardTitle" themeColor="textSecondary">
            {`/ ${achievements.length}`}
          </ThemedText>
        </View>
      )}

      {status === 'loading' && (
        <View accessible accessibilityLabel="Başarımlar yükleniyor" accessibilityState={{ busy: true }} style={styles.grid}>
          {[0, 1, 2].map((row) => (
            <Skeleton key={row} height={64} radius={Radius.md} />
          ))}
        </View>
      )}

      {failed && <LoadError kind={loadErrorKind(status)} retrying={retrying} onRetry={retry} />}

      {status === 'ready' && (
        <>
          {/* Yol haritası yoksa hiçbir rozet kazanılamaz: neden olduğunu söyleriz */}
          {!hasRoadmap && (
            <ThemedText type="small" themeColor="textSecondary">
              Rozet kazanmak için önce bir yol haritası seç.
            </ThemedText>
          )}
          <ListGroup>
            {ordered.map((a) => (
              <AchievementRow key={a.id} item={a} />
            ))}
          </ListGroup>
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
  const openAll = () => router.push('/achievements');

  return (
    <View style={styles.section}>
      <SectionHeader
        title="Başarımlar"
        count={status === 'ready' ? `${earnedCount} / ${achievements.length}` : undefined}
        action={status === 'ready' ? { label: 'Tümü', onPress: openAll } : undefined}
      />
      {status === 'loading' && (
        <View accessible accessibilityLabel="Başarımlar yükleniyor" accessibilityState={{ busy: true }} style={styles.stripRow}>
          {[0, 1, 2, 3].map((i) => (
            <Skeleton key={i} width={72} height={84} radius={Radius.md} />
          ))}
        </View>
      )}
      {failed && <LoadError variant="inline" kind={loadErrorKind(status)} retrying={retrying} onRetry={retry} />}
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
              <Badge emoji={a.emoji} earned={a.earned} size={48} />
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

// Sade rozet: yuvarlak halka içinde çizgi simge. Kazanılan = mürekkep halka + koyu simge; kazanılmayan = ince halka + soluk simge.
function Badge({ emoji, earned, size }: { emoji: string; earned: boolean; size: number }) {
  const theme = useTheme();
  return (
    <View
      accessibilityElementsHidden
      importantForAccessibility="no-hide-descendants"
      style={[
        styles.badge,
        {
          width: size,
          height: size,
          borderRadius: size / 2,
          borderWidth: earned ? 1.5 : Border.thin,
          borderColor: earned ? theme.accent : theme.borderEdge,
        },
      ]}>
      <View style={earned ? undefined : styles.dimmed}>
        <Glyph emoji={emoji} size={Math.round(size * 0.45)} color={earned ? theme.text : theme.textSecondary} strokeWidth={2} />
      </View>
    </View>
  );
}

function AchievementRow({ item }: { item: AchievementResult }) {
  const theme = useTheme();
  const { earned, hint } = item;

  // Ekran okuyucu: "Ad. Kazanıldı." ya da "Ad. Henüz kazanılmadı. Koşul. İlerleme: 2 / 3 adım."
  const label = earned
    ? `${item.title}. Kazanıldı. ${item.description}`
    : `${item.title}. Henüz kazanılmadı. ${item.howTo}${hint ? ` İlerleme: ${hint.label}.` : ''}`;

  return (
    <View accessible accessibilityRole="text" accessibilityLabel={label} style={styles.achRow}>
      <Badge emoji={item.emoji} earned={earned} size={44} />
      <View style={styles.achTexts}>
        <ThemedText type="defaultSemiBold" themeColor={earned ? 'text' : 'textSecondary'} style={styles.achTitle}>
          {item.title}
        </ThemedText>
        <ThemedText type="small" themeColor="textSecondary">
          {earned ? item.description : item.howTo}
        </ThemedText>
        {!earned && hint && (
          <View style={styles.hintBlock}>
            <ThemedText type="chip" themeColor="textSecondary">
              {hint.label}
            </ThemedText>
            {/* Çubuk yalnız süs; asıl bilgi yukarıdaki sayı metni */}
            <View style={[styles.track, { backgroundColor: theme.backgroundSelected }]}>
              <View style={[styles.fill, { backgroundColor: theme.accent, width: `${Math.round((hint.current / hint.target) * 100)}%` }]} />
            </View>
          </View>
        )}
      </View>
      {earned && (
        <ThemedText type="smallBold" themeColor="accentInk">
          Kazanıldı
        </ThemedText>
      )}
    </View>
  );
}

const styles = StyleSheet.create({
  section: { gap: Spacing.two },
  grid: { gap: Spacing.two },
  count: { flexDirection: 'row', alignItems: 'baseline', gap: Spacing.two },
  countNumber: { fontSize: 40, lineHeight: 46 },
  badge: { alignItems: 'center', justifyContent: 'center' },
  achRow: { flexDirection: 'row', alignItems: 'flex-start', gap: Spacing.three, paddingVertical: Spacing.three },
  achTexts: { flex: 1, minWidth: 0, gap: Spacing.half },
  achTitle: { fontSize: 15, lineHeight: 22 },
  stripRow: { flexDirection: 'row', gap: Spacing.three },
  chip: { width: 72, alignItems: 'center', gap: Spacing.one },
  chipText: { textAlign: 'center' },
  dimmed: { opacity: 0.55 },
  hintBlock: { gap: Spacing.one, marginTop: Spacing.one },
  track: { height: 4, borderRadius: Radius.pill, overflow: 'hidden' },
  fill: { height: 4, borderRadius: Radius.pill },
});
