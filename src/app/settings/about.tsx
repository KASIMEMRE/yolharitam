import Constants from 'expo-constants';
import { Linking, StyleSheet, View } from 'react-native';

import { Glyph } from '@/components/icon';
import { ListGroup, ListRow } from '@/components/list-row';
import { SettingsPage } from '@/components/settings/settings-page';
import { ThemedText } from '@/components/themed-text';
import { Spacing } from '@/constants/theme';
import { useTheme } from '@/hooks/use-theme';
import { PRIVACY_URL, SUPPORT_EMAIL, TERMS_URL } from '@/lib/config';
import { openExternalUrl } from '@/lib/open-url';

export default function SettingsAboutScreen() {
  const theme = useTheme();
  const version = Constants.expoConfig?.version ?? '1.0.0';
  // Dış bağlantı olduğunu sağdaki ok gösterir (">" alt sayfa, "↗" uygulamadan çıkış)
  const external = <Glyph emoji="↗" size={18} color={theme.textSecondary} />;
  return (
    <SettingsPage>
      <View style={styles.notes}>
        <ThemedText type="smallBold">Yol Haritam · sürüm {version}</ThemedText>
        <ThemedText type="small" themeColor="textSecondary">
          Harita kurgusu roadmap.sh projesinden ilham alır; içerikler Yol Haritam için Türkçe olarak yazılmıştır.
        </ThemedText>
        <ThemedText type="small" themeColor="textSecondary">
          Yapay zekâ önerileri ve açıklamaları hata içerebilir; önemli bilgileri önerilen kaynaklardan doğrula.
        </ThemedText>
      </View>

      {/* Yasal sayfalar ve destek: mağazalar bu bağlantıların uygulama içinden erişilebilir olmasını ister */}
      <ListGroup>
        <ListRow icon="🛡" title="Gizlilik politikası" right={external} onPress={() => openExternalUrl(PRIVACY_URL)} />
        <ListRow icon="📄" title="Kullanım koşulları" right={external} onPress={() => openExternalUrl(TERMS_URL)} />
        <ListRow
          icon="✉"
          title="Destek ve geri bildirim"
          right={external}
          onPress={() =>
            Linking.openURL(`mailto:${SUPPORT_EMAIL}?subject=${encodeURIComponent('Yol Haritam destek')}`).catch(() => {})
          }
        />
      </ListGroup>
      <ThemedText type="small" themeColor="textSecondary">
        Soru, öneri ya da uygunsuz içerik bildirimi için: {SUPPORT_EMAIL}
      </ThemedText>
    </SettingsPage>
  );
}

const styles = StyleSheet.create({
  notes: { gap: Spacing.two },
});
