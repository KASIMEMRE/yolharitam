import { NativeTabs } from 'expo-router/unstable-native-tabs';

import { useTheme } from '@/hooks/use-theme';

// Alt sekme çubuğu (iOS/Android yerel sekmeleri). Renkler temadan gelir, aktif sekme yeşil.
// İkonlar: iOS'ta SF Symbols (`sf`), Android'de Material Symbols (`md`). İkisi de ek dosya istemez.
export default function AppTabs() {
  const theme = useTheme();

  return (
    <NativeTabs
      backgroundColor={theme.card}
      indicatorColor={theme.accentSoft}
      tintColor={theme.accent}
      iconColor={{ default: theme.textSecondary, selected: theme.accentInk }}
      labelStyle={{
        default: { color: theme.textSecondary, fontSize: 13, fontWeight: '700' },
        selected: { color: theme.accentInk, fontSize: 13, fontWeight: '900' },
      }}>
      <NativeTabs.Trigger name="roadmap">
        <NativeTabs.Trigger.Label>Yol Haritam</NativeTabs.Trigger.Label>
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
