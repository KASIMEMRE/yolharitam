import { StyleSheet, View } from 'react-native';

import { Banner } from '@/components/banner';
import { Button } from '@/components/button';
import { ThemedText } from '@/components/themed-text';
import { Spacing } from '@/constants/theme';
import { LOAD_ERROR_TEXT, type LoadErrorKind } from '@/lib/supabase-errors';

// Tüm veri ekranlarının ORTAK "okunamadı" görünümü. Neden tek bileşen: her ekran kendi cümlesini ve
// düğmesini yazınca üslup dağılıyordu; ağ hatası "kayıt yok" gibi de görünebiliyordu.
//  - screen: ekranın ortasında sade metin + "Tekrar dene" (gösterecek veri yokken). Kart/çerçeve yok.
//  - inline: eldeki eski veri ekranda DURURKEN kısa uyarı + düğme (yenileme başarısızsa).
type LoadErrorProps = {
  kind?: LoadErrorKind;
  // Bağlama özgü başlık gerekirse; verilmezse türe göre ortak cümle
  message?: string;
  onRetry: () => void;
  retrying?: boolean;
  variant?: 'screen' | 'inline';
};

export function LoadError({ kind = 'network', message, onRetry, retrying = false, variant = 'screen' }: LoadErrorProps) {
  const text = LOAD_ERROR_TEXT[kind];
  const title = message ?? text.title;

  if (variant === 'inline') {
    return (
      <View style={styles.inline}>
        <Banner tone="warning">{`${title} ${text.hint}`}</Banner>
        <Button variant="secondary" icon="🔄" label="Tekrar dene" loading={retrying} onPress={onRetry} />
      </View>
    );
  }

  return (
    // alert + polite: hata belirince ekran okuyucu bir kez okur, odağı çalmaz
    <View accessibilityRole="alert" accessibilityLiveRegion="polite" style={styles.screen}>
      <View style={styles.texts}>
        <ThemedText type="cardTitle" style={styles.center}>
          {title}
        </ThemedText>
        <ThemedText themeColor="textSecondary" style={styles.center}>
          {text.hint}
        </ThemedText>
      </View>
      {/* Düğme tam genişlikte uzamasın: dar bir sütunda ortalı durur */}
      <View style={styles.action}>
        <Button variant="secondary" icon="🔄" label="Tekrar dene" loading={retrying} onPress={onRetry} />
      </View>
    </View>
  );
}

const styles = StyleSheet.create({
  screen: { alignItems: 'center', gap: Spacing.three, paddingVertical: Spacing.five, paddingHorizontal: Spacing.three },
  texts: { alignItems: 'center', gap: Spacing.one },
  center: { textAlign: 'center' },
  action: { width: '100%', maxWidth: 280 },
  inline: { gap: Spacing.three },
});
