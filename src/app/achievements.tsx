import { AchievementsSection } from '@/components/achievements-section';
import { SettingsPage } from '@/components/settings/settings-page';

// Tüm başarımlar (Profil'deki şeritte "Tümü"). Çerçeve olarak Ayarlar sayfasının aynı düzenini kullanır.
export default function AchievementsScreen() {
  return (
    <SettingsPage>
      <AchievementsSection />
    </SettingsPage>
  );
}
