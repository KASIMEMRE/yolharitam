import { Link } from 'expo-router';
import { StyleSheet, View } from 'react-native';

import { Avatar } from '@/components/avatar';
import { Button } from '@/components/button';
import { IconTile } from '@/components/icon-tile';
import { LevelBadge } from '@/components/level-badge';
import { LockedCard } from '@/components/locked-card';
import { ScreenHeader } from '@/components/screen-header';
import { Skeleton } from '@/components/skeleton';
import { TabScreen } from '@/components/tab-screen';
import { ThemedText } from '@/components/themed-text';
import { Border, Edge, Radius, Spacing } from '@/constants/theme';
import { getTopicChain } from '@/constants/topics';
import { HUES, getCategoryStyle } from '@/constants/visuals';
import { useLatestRoadmap } from '@/hooks/use-latest-roadmap';
import { useTheme } from '@/hooks/use-theme';
import { useAuth } from '@/lib/auth-context';
import { supabase } from '@/lib/supabase';

export default function ProfileScreen() {
  const theme = useTheme();
  const { session } = useAuth();
  const { roadmap, loading } = useLatestRoadmap();
  const email = session?.user.email;

  // Bozuk/bilinmeyen yol gelirse varsayılan görünüm kullanılır (çökme yok)
  const chain = roadmap ? getTopicChain(roadmap.topic_path.split('/')) : [];
  const category = getCategoryStyle(roadmap?.topic_path);
  const hue = HUES[category.hue];
  const topicTitle = chain.at(-1)?.title ?? 'Seçtiğin konu';
  const parents = chain.slice(0, -1).map((t) => t.title).join(' › ');

  return (
    <TabScreen>
      <ScreenHeader title="Profil" />

      {/* Kimlik: e-postanın baş harfi + varsa seçili konunun kategori rozeti */}
      <View style={styles.identity}>
        <Avatar
          email={email}
          size={96}
          badgeEmoji={roadmap ? category.emoji : undefined}
          badgeHue={roadmap ? category.hue : undefined}
        />
        <ThemedText
          themeColor="textSecondary"
          numberOfLines={1}
          ellipsizeMode="middle"
          accessibilityLabel={email ?? undefined}
          style={styles.email}>
          {email}
        </ThemedText>
      </View>

      <ThemedText type="eyebrow" themeColor="textSecondary">
        Şu anki konun
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
      ) : roadmap ? (
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
            <ThemedText type="cardTitle">Henüz konu seçmedin</ThemedText>
          </View>
        </View>
      )}

      <Link href="/onboarding" asChild>
        <Button variant="secondary" icon="🧭" label="Konumu değiştir" />
      </Link>

      <LockedCard
        compact
        emoji="🏆"
        title="Başarımlar"
        description="Öğrenmeye başladıkça rozetlerin burada toplanacak."
      />

      {/* Çıkış yapınca oturum null olur; Stack.Protected bizi karşılama ekranına atar */}
      <View style={styles.signOut}>
        <Button variant="quiet" label="Çıkış yap" onPress={() => supabase.auth.signOut()} />
      </View>
    </TabScreen>
  );
}

const styles = StyleSheet.create({
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
  signOut: { marginTop: Spacing.three },
});
