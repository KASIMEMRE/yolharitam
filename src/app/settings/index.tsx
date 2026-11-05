import { router } from 'expo-router';

import { ListGroup, ListRow } from '@/components/list-row';
import { SettingsPage } from '@/components/settings/settings-page';

// Ayarlar ana listesi: yalnız başlıklar; her işlem kendi alt sayfasında (ayrıntı aşamalı gösterilir).
// Alt sayfalar `router.push` ile açılır: geri düğmesi önce bu listeye döner.
export default function SettingsIndexScreen() {
  return (
    <SettingsPage>
      <ListGroup>
        <ListRow
          icon="🗺"
          title="Haritalarım"
          chevron
          onPress={() => router.push('/settings/maps')}
        />
        <ListRow
          icon="🎨"
          title="Görünüm"
          chevron
          onPress={() => router.push('/settings/appearance')}
        />
        <ListRow
          icon="👤"
          title="Hesap ve güvenlik"
          chevron
          onPress={() => router.push('/settings/account')}
        />
        <ListRow
          icon="🚫"
          title="Engellenen kullanıcılar"
          chevron
          onPress={() => router.push('/settings/blocked')}
        />
        <ListRow
          icon="ℹ"
          title="Hakkında ve yasal"
          chevron
          onPress={() => router.push('/settings/about')}
        />
      </ListGroup>
    </SettingsPage>
  );
}
