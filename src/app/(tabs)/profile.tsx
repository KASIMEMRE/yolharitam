import { Link, router } from 'expo-router';
import { Pressable, StyleSheet, View } from 'react-native';

import { Glyph, IconLabel } from '@/components/icon';
import { Banner } from '@/components/banner';
import { AchievementsSection } from '@/components/achievements-section';
import { Avatar } from '@/components/avatar';
import { Button } from '@/components/button';
import { IconTile } from '@/components/icon-tile';
import { LevelBadge } from '@/components/level-badge';
import { ScreenHeader } from '@/components/screen-header';
import { Skeleton } from '@/components/skeleton';
import { TabScreen } from '@/components/tab-screen';
import { ThemedText } from '@/components/themed-text';
import { Border, Edge, MinTouch, Radius, Spacing } from '@/constants/theme';
import { describeTopic } from '@/constants/visuals';
import { useUsername } from '@/hooks/use-username';
import { useLatestRoadmap } from '@/hooks/use-latest-roadmap';
import { levelFor } from '@/constants/xp';
import { useXp } from '@/lib/xp';
import { useTheme } from '@/hooks/use-theme';
import { useAuth } from '@/lib/auth-context';
import { ERROR_TEXT } from '@/lib/supabase-errors';


export default function ProfileScreen() {
  const theme = useTheme();
  const { session } = useAuth();
  const { roadmap, loading, failed, retry } = useLatestRoadmap();
  const { username } = useUsername();
  const email = session?.user.email;

  // Bozuk/bilinmeyen yol gelirse varsayılan görünüm kullanılır (çökme yok)
  const { title: topicTitle, parents, category, hue, hasTopic } = describeTopic(roadmap?.topic_path);

  return (
    <TabScreen>
      {/* Ayarlar sayfa sonunda gömülü kalmasın: başlıkta her zaman görünen dişli düğmesi.
          Link asChild yerine router.push: stil fonksiyonu/dizisi Link'te web'de hata verebiliyor. */}
      <ScreenHeader
        title="Profil"
        right={
          <Pressable
            onPress={() => router.push('/settings')}
            accessibilityRole="button"
            accessibilityLabel="Ayarlar"
            style={({ pressed }) => [
              styles.gear,
              {
                backgroundColor: pressed ? theme.backgroundSelected : theme.card,
                borderColor: theme.borderStrong,
              },
            ]}>
            {({ pressed }) => <Glyph emoji="⚙️" size={22} color={pressed ? theme.text : theme.textSecondary} />}
          </Pressable>
        }
      />

      {/* Kimlik: kullanıcı adı + e-posta. Ad ve hesap işlemleri Ayarlar'da (burada tekrar edilmez). */}
      <View style={styles.identity}>
        <Avatar
          email={email}
          size={96}
          badgeEmoji={hasTopic ? category.emoji : undefined}
          badgeHue={hasTopic ? category.hue : undefined}
        />
        <ThemedText type="heading" style={styles.center}>
          {username ? `@${username}` : 'Gezgin'}
        </ThemedText>
        <ThemedText
          themeColor="textSecondary"
          numberOfLines={1}
          ellipsizeMode="middle"
          accessibilityLabel={email ?? undefined}
          style={styles.email}>
          {email}
        </ThemedText>
      </View>

      {/* Seviye: XP'den türetilir (bkz. constants/xp.ts) */}
      <LevelCard />

      <ThemedText type="eyebrow" themeColor="textSecondary">
        Şu anki haritan
      </ThemedText>

      {loading ? (
        <View
          accessible
          accessibilityLabel="Yükleniyor"
          accessibilityState={{ busy: true }}
          style={[styles.topicCard, { backgroundColor: theme.card, borderColor: theme.border, borderBottomColor: theme.borderEdge }]}>
          <Skeleton width={48} height={48} radius={14} />
          <View style={styles.topicTexts}>
            <Skeleton width="60%" height={20} />
            <Skeleton width="40%" height={14} />
          </View>
        </View>
      ) : failed ? (
        // Okunamadı ≠ haritan yok: yanlış "seçmedin" demek yerine hata + tekrar dene
        <View style={styles.errorBox}>
          <Banner tone="warning">{ERROR_TEXT.mapsLoadFailed}</Banner>
          <Button variant="secondary" icon="🔄" label="Tekrar dene" onPress={retry} />
        </View>
      ) : hasTopic && roadmap ? (
        <View
          style={[styles.topicCard, { backgroundColor: theme.card, borderColor: theme[hue.line], borderBottomColor: theme[hue.edge] }]}>
          <IconTile emoji={category.emoji} tone={category.hue} size={48} />
          <View style={styles.topicTexts}>
            <ThemedText type="cardTitle">{topicTitle}</ThemedText>
            {parents !== '' && (
              <ThemedText type="small" themeColor="textSecondary">
                {parents}
              </ThemedText>
            )}
            <LevelBadge levelId={roadmap.level} size="sm" />
          </View>
        </View>
      ) : (
        <View
          style={[styles.topicCard, { backgroundColor: theme.card, borderColor: theme.border, borderBottomColor: theme.borderEdge }]}>
          <IconTile emoji="🧭" tone="accent" size={48} />
          <View style={styles.topicTexts}>
            <ThemedText type="cardTitle">Henüz bir yol haritası seçmedin</ThemedText>
            <ThemedText type="small" themeColor="textSecondary">
              Yol Haritam sekmesinden bir harita seçebilirsin.
            </ThemedText>
          </View>
        </View>
      )}

      {/* Rozetler kendi hook'uyla yüklenir: ağ hatası olsa da yukarıdaki kartlar çalışmaya devam eder */}
      <AchievementsSection />

      {/* Kullanıcı adı, tema, haritaları yönetme, şifre ve çıkış: hepsi Ayarlar'da */}
      <Link href="/settings" asChild>
        <Button variant="secondary" icon="⚙️" label="Ayarlar" />
      </Link>
    </TabScreen>
  );
}

function LevelCard() {
  const theme = useTheme();
  const xp = useXp();
  const level = levelFor(xp.total);
  return (
    <View
      accessible
      accessibilityLabel={`Seviye ${level.title}, ${xp.total} XP${level.next ? `, ${level.next.title} seviyesine ${level.next.remaining} XP kaldı` : ''}`}
      style={[styles.topicCard, styles.levelCard, { backgroundColor: theme.markerSoft, borderColor: theme.markerEdge, borderBottomColor: theme.markerEdge }]}>
      <View style={styles.levelRow}>
        <IconLabel emoji={level.emoji} type="cardTitle" themeColor="markerInk" iconSize={20}>
          {level.title}
        </IconLabel>
        <IconLabel emoji="⭐" type="smallBold" themeColor="markerInk">
          {`${xp.total} XP`}
        </IconLabel>
      </View>
      <View style={[styles.levelTrack, { backgroundColor: theme.card }]}>
        <View style={[styles.levelFill, { width: `${Math.round(level.progress * 100)}%`, backgroundColor: theme.marker }]} />
      </View>
      <ThemedText type="small" themeColor="markerInk">
        {level.next
          ? `${level.next.title} seviyesine ${level.next.remaining} XP kaldı. Konu bitir (+20), quiz çöz, günün görevini yap (+30).`
          : 'En yüksek seviyedesin. Efsane!'}
      </ThemedText>
    </View>
  );
}

const styles = StyleSheet.create({
  gear: {
    width: MinTouch,
    height: MinTouch,
    borderRadius: Radius.pill,
    borderWidth: Border.thick,
    alignItems: 'center',
    justifyContent: 'center',
  },
  levelCard: { flexDirection: 'column', alignItems: 'stretch', gap: Spacing.two },
  levelRow: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center' },
  levelTrack: { height: 10, borderRadius: Radius.pill, overflow: 'hidden' },
  levelFill: { height: '100%', borderRadius: Radius.pill },
  identity: { alignItems: 'center', gap: Spacing.three },
  email: { alignSelf: 'stretch', textAlign: 'center' },
  topicCard: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: Spacing.three,
    padding: Spacing.three,
    borderRadius: Radius.lg,
    borderWidth: Border.thick,
    borderBottomWidth: Border.thick + Edge,
  },
  topicTexts: { flex: 1, minWidth: 0, gap: Spacing.one },
  center: { textAlign: 'center' },
  errorBox: { gap: Spacing.three },
});
