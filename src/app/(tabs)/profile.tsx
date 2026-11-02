import { router } from 'expo-router';
import { Linking, Pressable, StyleSheet, View } from 'react-native';

import { Glyph, IconLabel } from '@/components/icon';
import { Banner } from '@/components/banner';
import { AchievementsStrip } from '@/components/achievements-section';
import { Avatar } from '@/components/avatar';
import { Button } from '@/components/button';
import { ListGroup, ListRow } from '@/components/list-row';
import { ScreenHeader } from '@/components/screen-header';
import { Segmented } from '@/components/segmented';
import { Surface } from '@/components/surface';
import { TabScreen } from '@/components/tab-screen';
import { ThemedText } from '@/components/themed-text';
import { Border, MinTouch, Radius, Spacing } from '@/constants/theme';
import { describeTopic } from '@/constants/visuals';
import { useUsername } from '@/hooks/use-username';
import { useLatestRoadmap } from '@/hooks/use-latest-roadmap';
import { levelFor } from '@/constants/xp';
import { useXp } from '@/lib/xp';
import { useTheme } from '@/hooks/use-theme';
import { useAuth } from '@/lib/auth-context';
import { PRIVACY_URL, SUPPORT_EMAIL, TERMS_URL } from '@/lib/config';
import { openExternalUrl } from '@/lib/open-url';
import { setPreferences, usePreferences } from '@/lib/preferences';
import { ERROR_TEXT } from '@/lib/supabase-errors';


// Misafirde kimlik, XP, rozet ve harita sorguları atılmaz: ayrı bileşen (hook kuralı yüzünden koşullu çağrı olmaz).
export default function ProfileScreen() {
  const { session } = useAuth();
  return session ? <MemberProfileScreen /> : <GuestProfileScreen />;
}

// MİSAFİR profil: üstte tek birincil "Hesap oluştur" kartı, altında düz ayar/yasal listesi.
// Kimlik, XP, rozet gibi kişisel sorgular hiç atılmaz.
function GuestProfileScreen() {
  const prefs = usePreferences();
  return (
    <TabScreen>
      <ScreenHeader title="Profil" />

      {/* Ekrandaki tek birincil (3D) öğe */}
      <Surface tone="primary">
        <ThemedText type="cardTitle" accessibilityRole="header">
          Hesap oluştur
        </ThemedText>
        <ThemedText>Haritanı kaydet, konuları işaretle, XP ve rozet kazan. İlerlemen hesabında saklanır.</ThemedText>
        <View style={styles.guestActions}>
          <Button variant="secondary" label="Kayıt ol" onPress={() => router.push({ pathname: '/login', params: { mode: 'signup' } })} />
          <Button variant="text" label="Giriş yap" onPress={() => router.push({ pathname: '/login', params: { mode: 'login' } })} />
        </View>
      </Surface>

      <ListGroup>
        {/* Tema seçimi doğrudan burada (cihazda saklanır) */}
        <View style={styles.themeRow}>
          <ThemedText type="smallBold">Görünüm</ThemedText>
          <Segmented
            label="Görünüm"
            value={prefs.theme}
            onChange={(theme) => setPreferences({ theme })}
            options={[
              { id: 'system', label: 'Sistem' },
              { id: 'light', label: 'Açık', icon: '☀️' },
              { id: 'dark', label: 'Koyu', icon: '🌙' },
            ]}
          />
        </View>
        <ListRow icon="🛡️" title="Gizlilik politikası" chevron onPress={() => openExternalUrl(PRIVACY_URL)} />
        <ListRow icon="📄" title="Kullanım koşulları" chevron onPress={() => openExternalUrl(TERMS_URL)} />
        <ListRow
          icon="✉️"
          title="Destek"
          subtitle={SUPPORT_EMAIL}
          subtitleLines={1}
          chevron
          onPress={() =>
            Linking.openURL(`mailto:${SUPPORT_EMAIL}?subject=${encodeURIComponent('Yol Haritam destek')}`).catch(() => {})
          }
        />
      </ListGroup>
    </TabScreen>
  );
}

// Sadelik: tek sütunda kimlik → seviye → başarımlar şeridi → iki satırlık liste. Ayrı çerçeveli kart yok;
// gruplama boşlukla yapılır, yalnız liste tek bir ListGroup içinde durur.
function MemberProfileScreen() {
  const theme = useTheme();
  const { session } = useAuth();
  const { roadmap, loading, failed, retry } = useLatestRoadmap();
  const { username } = useUsername();
  const email = session?.user.email;

  // Bozuk/bilinmeyen yol gelirse varsayılan görünüm kullanılır (çökme yok)
  const { title: topicTitle, category, hasTopic } = describeTopic(roadmap?.topic_path);

  // "Şu anki haritan" artık ayrı kart değil, Haritalarım satırının alt yazısı
  const mapsSubtitle = loading
    ? 'Yükleniyor…'
    : failed
      ? undefined
      : hasTopic && roadmap
        ? `Şu an: ${topicTitle}`
        : 'Henüz bir yol haritası seçmedin';

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

      {/* Kimlik: avatar + kullanıcı adı + küçük e-posta. Ad ve hesap işlemleri Ayarlar'da. */}
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
          type="small"
          themeColor="textSecondary"
          numberOfLines={1}
          ellipsizeMode="middle"
          accessibilityLabel={email ?? undefined}
          style={styles.email}>
          {email}
        </ThemedText>
      </View>

      {/* Seviye: XP'den türetilir (bkz. constants/xp.ts). Düz satır, çerçevesiz */}
      <LevelRow />

      {/* Rozetler kendi hook'uyla yüklenir: ağ hatası olsa da diğer bölümler çalışmaya devam eder */}
      <AchievementsStrip />

      {/* Okunamadı ≠ haritan yok: yanlış "seçmedin" demek yerine hata + tekrar dene */}
      {failed && (
        <View style={styles.errorBox}>
          <Banner tone="warning">{ERROR_TEXT.mapsLoadFailed}</Banner>
          <Button variant="secondary" icon="🔄" label="Tekrar dene" onPress={retry} />
        </View>
      )}

      <ListGroup>
        <ListRow
          icon="🗺"
          title="Haritalarım"
          subtitle={mapsSubtitle}
          chevron
          onPress={() => router.push('/settings/maps')}
        />
        <ListRow icon="⚙" title="Ayarlar" chevron onPress={() => router.push('/settings')} />
      </ListGroup>
    </TabScreen>
  );
}

function LevelRow() {
  const theme = useTheme();
  const xp = useXp();
  const level = levelFor(xp.total);
  return (
    <View
      accessible
      accessibilityLabel={`Seviye ${level.title}, ${xp.total} XP${level.next ? `, ${level.next.title} seviyesine ${level.next.remaining} XP kaldı` : ''}`}
      style={styles.levelBox}>
      <View style={styles.levelRow}>
        <IconLabel emoji={level.emoji} type="cardTitle" iconSize={20}>
          {level.title}
        </IconLabel>
        <IconLabel emoji="⭐" type="smallBold" themeColor="markerInk">
          {`${xp.total} XP`}
        </IconLabel>
      </View>
      <View style={[styles.levelTrack, { backgroundColor: theme.backgroundSelected }]}>
        <View style={[styles.levelFill, { width: `${Math.round(level.progress * 100)}%`, backgroundColor: theme.marker }]} />
      </View>
      <ThemedText type="small" themeColor="textSecondary">
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
  levelBox: { gap: Spacing.two },
  levelRow: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center' },
  levelTrack: { height: 10, borderRadius: Radius.pill, overflow: 'hidden' },
  levelFill: { height: '100%', borderRadius: Radius.pill },
  identity: { alignItems: 'center', gap: Spacing.two },
  email: { alignSelf: 'stretch', textAlign: 'center' },
  center: { textAlign: 'center' },
  errorBox: { gap: Spacing.three },
  guestActions: { gap: Spacing.one },
  themeRow: { gap: Spacing.two, padding: Spacing.three },
});
