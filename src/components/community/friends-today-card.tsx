import { StyleSheet, View } from 'react-native';

import { ThemedText } from '@/components/themed-text';
import { computeStreak } from '@/constants/activity';
import { Border, Radius, Spacing } from '@/constants/theme';
import { useFriends } from '@/hooks/use-friends';
import { useTheme } from '@/hooks/use-theme';

// Yol Haritam'da "Arkadaşların bugün" kartı: bugün çalışan en çok 3 arkadaşı gösterir.
// Arkadaş yoksa, kimse çalışmadıysa ya da veri okunamadıysa kart HİÇ görünmez (ana ekranı hata ile kirletmeyiz).
export function FriendsTodayCard() {
  const theme = useTheme();
  const { friends, status } = useFriends();
  if (status !== 'ready') return null;

  const active = friends
    .filter((f) => f.today_done > 0 || f.today_xp > 0)
    .sort((a, b) => b.today_done - a.today_done || b.today_xp - a.today_xp)
    .slice(0, 3);
  if (active.length === 0) return null;

  return (
    <View style={[styles.card, { backgroundColor: theme.card, borderColor: theme.border }]}>
      <ThemedText type="smallBold" accessibilityRole="header">
        🤝 Arkadaşların bugün
      </ThemedText>
      {active.map((f) => {
        const name = f.username ? `@${f.username}` : 'Bir arkadaşın';
        const { streak } = computeStreak(new Set(f.active_days));
        const what = f.today_done > 0 ? `bugün ${f.today_done} konu bitirdi` : 'bugün çalıştı';
        return (
          <ThemedText key={f.friendship_id} type="small">
            {name} {what}
            {streak > 0 ? ` 🔥${streak}` : ''}
          </ThemedText>
        );
      })}
    </View>
  );
}

const styles = StyleSheet.create({
  card: { gap: Spacing.one, padding: Spacing.three, borderRadius: Radius.lg, borderWidth: Border.thick },
});
