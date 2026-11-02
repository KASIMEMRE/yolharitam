import { StyleSheet, View } from 'react-native';

import { Segmented } from '@/components/segmented';
import { SettingsPage } from '@/components/settings/settings-page';
import { ThemedText } from '@/components/themed-text';
import { Spacing } from '@/constants/theme';
import { setPreferences, usePreferences, type MapViewPref, type ThemePref } from '@/lib/preferences';

// Etiketli seçenek grubu: başlık + ortak Segmented (tema ve görünüm için)
function Choice<T extends string>({
  label,
  value,
  options,
  onChange,
}: {
  label: string;
  value: T;
  options: { id: T; label: string; icon?: string }[];
  onChange: (v: T) => void;
}) {
  return (
    <View style={styles.choiceBlock}>
      <ThemedText type="smallBold">{label}</ThemedText>
      <Segmented label={label} options={options} value={value} onChange={onChange} />
    </View>
  );
}

// Seçenekler kart içinde değil doğrudan sayfada: Segmented zaten kendi izini çiziyor.
export default function SettingsAppearanceScreen() {
  const prefs = usePreferences();
  return (
    <SettingsPage>
      <Choice<ThemePref>
        label="Tema"
        value={prefs.theme}
        options={[
          { id: 'system', label: 'Sistem' },
          { id: 'light', label: 'Açık', icon: '☀️' },
          { id: 'dark', label: 'Koyu', icon: '🌙' },
        ]}
        onChange={(theme) => setPreferences({ theme })}
      />
      <Choice<MapViewPref>
        label="Haritanın varsayılan görünümü"
        value={prefs.mapView}
        options={[
          { id: 'tree', label: 'Harita', icon: '🗺️' },
          { id: 'list', label: 'Liste', icon: '☰' },
        ]}
        onChange={(mapView) => setPreferences({ mapView })}
      />
      <ThemedText type="small" themeColor="textSecondary">
        Bu tercihler yalnız bu cihazda saklanır.
      </ThemedText>
    </SettingsPage>
  );
}

const styles = StyleSheet.create({
  choiceBlock: { gap: Spacing.two },
});
