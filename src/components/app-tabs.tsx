import { NativeTabs } from 'expo-router/unstable-native-tabs';

import { Fonts } from '@/constants/theme';
import { useTheme } from '@/hooks/use-theme';
import { useAuth } from '@/lib/auth-context';

// Alt sekme çubuğu (iOS/Android yerel sekmeleri). Renkler temadan gelir; seçili sekmenin simgesi ve etiketi accent (mürekkep) renginde, arkasında hap yok.
// İkonlar: iOS'ta SF Symbols (`sf`), Android'de Material Symbols (`md`). İkisi de ek dosya istemez.
export default function AppTabs() {
  const theme = useTheme();
  // Misafirde ilk sekme kataloğu gösterir: adı "Keşfet"
  const { session } = useAuth();

  return (
    <NativeTabs
      backgroundColor={theme.card}
      indicatorColor="transparent"
      tintColor={theme.accent}
      iconColor={{ default: theme.textSecondary, selected: theme.accent }}
      labelStyle={{
        default: { color: theme.textSecondary, fontSize: 11, fontFamily: Fonts.sansMedium },
        selected: { color: theme.accent, fontSize: 11, fontFamily: Fonts.sansSemiBold },
      }}>
      <NativeTabs.Trigger name="roadmap">
        <NativeTabs.Trigger.Label>{session ? 'Yol Haritam' : 'Keşfet'}</NativeTabs.Trigger.Label>
        <NativeTabs.Trigger.Icon sf={{ default: 'map', selected: 'map.fill' }} md="map" />
      </NativeTabs.Trigger>

      <NativeTabs.Trigger name="news">
        <NativeTabs.Trigger.Label>Gelişmeler</NativeTabs.Trigger.Label>
        <NativeTabs.Trigger.Icon sf={{ default: 'newspaper', selected: 'newspaper.fill' }} md="newspaper" />
      </NativeTabs.Trigger>

      <NativeTabs.Trigger name="community">
        <NativeTabs.Trigger.Label>Topluluk</NativeTabs.Trigger.Label>
        <NativeTabs.Trigger.Icon sf={{ default: 'person.3', selected: 'person.3.fill' }} md="groups" />
      </NativeTabs.Trigger>

      <NativeTabs.Trigger name="profile">
        <NativeTabs.Trigger.Label>Profil</NativeTabs.Trigger.Label>
        <NativeTabs.Trigger.Icon
          sf={{ default: 'person.crop.circle', selected: 'person.crop.circle.fill' }}
          md="person"
        />
      </NativeTabs.Trigger>
    </NativeTabs>
  );
}
