import type { ComponentRef, Ref } from 'react';
import {
  Tabs,
  TabList,
  TabTrigger,
  TabSlot,
  TabTriggerSlotProps,
  TabListProps,
} from 'expo-router/ui';
import { Pressable, StyleSheet, useWindowDimensions, View } from 'react-native';

import { ThemedText } from './themed-text';

import { Glyph } from '@/components/icon';
import { Border, MaxContentWidth, Radius, Spacing } from '@/constants/theme';
import { useTheme } from '@/hooks/use-theme';

// Web'deki sekme çubuğu (geliştirme/önizleme için). Geniş ekranda üstte yüzen kapsül,
// dar ekranda altta tam genişlik çubuk. Simgeler uygulamanın ortak çizgi simge setinden (icon.tsx).
export default function AppTabs() {
  return (
    <Tabs>
      <TabSlot style={{ height: '100%' }} />
      <TabList asChild>
        <CustomTabList>
          <TabTrigger name="roadmap" href="/roadmap" asChild>
            <TabButton emoji="🗺️">Yol Haritam</TabButton>
          </TabTrigger>
          <TabTrigger name="news" href="/news" asChild>
            <TabButton emoji="📰">Gelişmeler</TabButton>
          </TabTrigger>
          <TabTrigger name="community" href="/community" asChild>
            <TabButton emoji="👥">Topluluk</TabButton>
          </TabTrigger>
          <TabTrigger name="profile" href="/profile" asChild>
            <TabButton emoji="👤">Profil</TabButton>
          </TabTrigger>
        </CustomTabList>
      </TabList>
    </Tabs>
  );
}

export function TabButton({
  children,
  isFocused,
  emoji,
  ref,
  ...props
}: TabTriggerSlotProps & { emoji?: string }) {
  const theme = useTheme();
  const { width } = useWindowDimensions();
  const narrow = width < 600;

  return (
    <Pressable
      {...props}
      // expo-router'ın ref tipi RN 0.88'in yeni öğe tipiyle henüz uyuşmuyor; çalışma anında aynı nesne
      ref={ref as Ref<ComponentRef<typeof Pressable>>}
      accessibilityRole="tab"
      accessibilityState={{ selected: !!isFocused }}
      style={[
        styles.tab,
        narrow && styles.tabNarrow,
        {
          backgroundColor: isFocused ? theme.accentSoft : 'transparent',
          borderColor: isFocused ? theme.accent : 'transparent',
        },
      ]}>
      {emoji && (
        <Glyph emoji={emoji} size={narrow ? 22 : 18} color={isFocused ? theme.accentInk : theme.textSecondary} strokeWidth={isFocused ? 2.25 : 2} />
      )}
      <ThemedText
        type={isFocused ? 'smallBold' : 'small'}
        themeColor={isFocused ? 'accentInk' : 'textSecondary'}
        numberOfLines={1}
        adjustsFontSizeToFit
        minimumFontScale={0.8}
        style={narrow && styles.labelNarrow}>
        {children}
      </ThemedText>
    </Pressable>
  );
}

export function CustomTabList(props: TabListProps) {
  const theme = useTheme();
  const { width } = useWindowDimensions();
  const narrow = width < 600;

  return (
    <View
      {...props}
      style={[styles.container, narrow ? styles.containerBottom : styles.containerTop]}
      pointerEvents="box-none">
      <View
        style={[
          styles.inner,
          { backgroundColor: theme.card },
          narrow
            ? { borderTopWidth: Border.thick, borderTopColor: theme.border }
            : { borderWidth: Border.thick, borderColor: theme.border, borderRadius: Radius.xl, maxWidth: MaxContentWidth },
          narrow && styles.innerNarrow,
        ]}>
        {!narrow && (
          <ThemedText type="cardTitle" style={styles.brand}>
            🧭 Yol Haritam
          </ThemedText>
        )}
        {props.children}
      </View>
    </View>
  );
}

const styles = StyleSheet.create({
  container: { position: 'absolute', width: '100%', flexDirection: 'row', justifyContent: 'center' },
  containerTop: { top: 0, padding: Spacing.three },
  containerBottom: { bottom: 0 },
  inner: {
    flexDirection: 'row',
    alignItems: 'center',
    flexGrow: 1,
    gap: Spacing.two,
    paddingVertical: Spacing.two,
    paddingHorizontal: Spacing.three,
  },
  innerNarrow: { paddingHorizontal: Spacing.two },
  brand: { marginRight: 'auto' },
  tab: {
    minHeight: 48,
    flexDirection: 'row',
    alignItems: 'center',
    gap: Spacing.two,
    paddingHorizontal: Spacing.three,
    borderRadius: Radius.md,
    borderWidth: Border.thick,
  },
  tabNarrow: { flex: 1, minWidth: 0, flexDirection: 'column', justifyContent: 'center', gap: 0, paddingHorizontal: 2 },
  labelNarrow: { fontSize: 13, lineHeight: 16, textAlign: 'center', maxWidth: '100%' },
});
