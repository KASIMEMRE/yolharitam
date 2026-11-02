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
          subtitle="Haritaları aç, kaldır ya da yeni ekle"
          chevron
          onPress={() => router.push('/settings/maps')}
        />
        <ListRow
          icon="🎨"
          title="Görünüm"
          subtitle="Tema ve haritanın varsayılan görünümü"
          chevron
          onPress={() => router.push('/settings/appearance')}
        />
        <ListRow
          icon="👤"
          title="Hesap ve güvenlik"
          subtitle="Kullanıcı adı, şifre, çıkış, hesabı silme"
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
          subtitle="Sürüm, gizlilik, koşullar, destek"
          chevron
          onPress={() => router.push('/settings/about')}
        />
      </ListGroup>
    </SettingsPage>
  );
}
