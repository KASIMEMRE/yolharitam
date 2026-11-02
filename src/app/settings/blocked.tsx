import { BlockedUsersList } from '@/components/settings/blocked-users';
import { SettingsPage } from '@/components/settings/settings-page';

export default function SettingsBlockedScreen() {
  return (
    <SettingsPage>
      <BlockedUsersList />
    </SettingsPage>
  );
}
