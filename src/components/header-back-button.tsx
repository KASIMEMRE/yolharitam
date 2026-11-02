import { router } from 'expo-router';
import { Pressable, StyleSheet, Text } from 'react-native';

import { useTheme } from '@/hooks/use-theme';

// Üst çubuktaki özel geri düğmesi. Varsayılan geri oku web'de 30x30 kadar küçüktü;
// burada dokunma alanı en az 44x44 (parmakla rahat basılsın diye).
type HeaderBackButtonProps = {
  onPress: () => void;
  label: string; // ekran okuyucunun okuyacağı metin
};

export function HeaderBackButton({ onPress, label }: HeaderBackButtonProps) {
  const theme = useTheme();
  return (
    <Pressable
      onPress={onPress}
      accessibilityRole="button"
      accessibilityLabel={label}
      hitSlop={8}
      style={styles.button}>
      <Text style={[styles.text, { color: theme.accentInk }]}>‹</Text>
    </Pressable>
  );
}

// Web'de üst çubuğa konacak geri düğmesi. Geçmiş yoksa (sayfa yenilendi) `fallback` adresine gider.
// Native'de kullanılmaz: sistemin geri düğmesi ve kaydırma hareketi zaten doğru çalışır.
export function webHeaderLeft(fallback: '/profile' | '/settings' | '/community') {
  const goBack = () => {
    if (router.canGoBack()) router.back();
    else router.replace(fallback);
  };
  return function WebHeaderLeft() {
    return <HeaderBackButton onPress={goBack} label="Geri dön" />;
  };
}

const styles =StyleSheet.create({
  button: { minWidth: 44, minHeight: 44, alignItems: 'center', justifyContent: 'center' },
  text: { fontSize: 32, lineHeight: 36, fontWeight: '900' },
});
