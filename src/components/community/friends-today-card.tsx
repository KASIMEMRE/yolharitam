import { StyleSheet, View } from 'react-native';

import { IconLabel } from '@/components/icon';
import { ThemedText } from '@/components/themed-text';
import { computeStreak } from '@/constants/activity';
import { Border, Radius, Spacing } from '@/constants/theme';
import { useFriends } from '@/hooks/use-friends';
import { useTheme } from '@/hooks/use-theme';

// Yol Haritam'da "Arkadaşların bugün" kartı: bugün çalışan en çok 3 arkadaşı gösterir.
// compact: başka bir kartın içine gömülürken kendi çerçevesi olmaz.
// Arkadaş yoksa, kimse çalışmadıysa ya da veri okunamadıysa kart HİÇ görünmez (ana ekranı hata ile kirletmeyiz).
export function FriendsTodayCard({ compact = false }: { compact?: boolean }) {
  const theme = useTheme();
  const { friends, status } = useFriends();
  if (status !== 'ready') return null;

  const active = friends
    .filter((f) => f.today_done > 0 || f.today_xp > 0)
    .sort((a, b) => b.today_done - a.today_done || b.today_xp - a.today_xp)
    .slice(0, 3);
  if (active.length === 0) return null;

  return (
    <View style={compact ? styles.compact : [styles.card, { backgroundColor: theme.card, borderColor: theme.border }]}>
      <IconLabel emoji="🤝" type="smallBold" iconSize={16}>
        Arkadaşların bugün
      </IconLabel>
      {active.map((f) => {
        const name = f.username ? `@${f.username}` : 'Bir arkadaşın';
        const { streak } = computeStreak(new Set(f.active_days));
        const what = f.today_done > 0 ? `bugün ${f.today_done} konu bitirdi` : 'bugün çalıştı';
        return (
          <ThemedText key={f.friendship_id} type="small">
            {name} {what}
            {streak > 0 ? ` · ${streak} günlük seri` : ''}
          </ThemedText>
        );
      })}
    </View>
  );
}

const styles = StyleSheet.create({
  compact: { gap: Spacing.one },
  card: { gap: Spacing.one, padding: Spacing.three, borderRadius: Radius.lg, borderWidth: Border.thick },
});
