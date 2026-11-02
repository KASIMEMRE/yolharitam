import { UsernameForm } from '@/components/community/username-gate';
import { ListGroup, ListRow } from '@/components/list-row';
import { DeleteAccountLink } from '@/components/settings/delete-account';
import { PasswordSection } from '@/components/settings/password-section';
import { SettingsPage } from '@/components/settings/settings-page';
import { useAuth } from '@/lib/auth-context';
import { supabase } from '@/lib/supabase';

// Hesap ve güvenlik: kullanıcı adı, şifre, çıkış. Hesabı silme sayfanın EN ALTINDA, soluk bir bağlantı.
export default function SettingsAccountScreen() {
  const { session } = useAuth();
  const email = session?.user.email ?? null;
  return (
    <SettingsPage intro={email ?? undefined}>
      {/* Uygulamadaki tek ad: benzersiz @kullanıcı adı (selamlama, profil, lig, arkadaşlar).
          Bölümler kartsız: yalnız boşlukla ayrılır (formun kendi etiketi başlık işini görür). */}
      <UsernameForm />

      <PasswordSection email={email} />

      <ListGroup>
        <ListRow icon="🚪" title="Çıkış yap" destructive onPress={() => supabase.auth.signOut()} />
      </ListGroup>

      <DeleteAccountLink email={email} />
    </SettingsPage>
  );
}
