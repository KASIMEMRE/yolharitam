import { MapsSection } from '@/components/settings/maps-section';
import { SettingsPage } from '@/components/settings/settings-page';

export default function SettingsMapsScreen() {
  return (
    <SettingsPage intro="Birini kaldırınca o haritadaki ilerlemen de silinir.">
      <MapsSection />
    </SettingsPage>
  );
}
