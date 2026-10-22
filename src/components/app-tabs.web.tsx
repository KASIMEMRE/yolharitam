import {
  Tabs,
  TabList,
  TabTrigger,
  TabSlot,
  TabTriggerSlotProps,
  TabListProps,
} from 'expo-router/ui';
import { Pressable, StyleSheet, Text, useWindowDimensions, View } from 'react-native';

import { ThemedText } from './themed-text';

import { Border, MaxContentWidth, Radius, Spacing } from '@/constants/theme';
import { useTheme } from '@/hooks/use-theme';

// Web'deki sekme çubuğu (geliştirme/önizleme için). Geniş ekranda üstte yüzen kapsül,
// dar ekranda altta tam genişlik çubuk. Emoji kullanıyoruz: ek ikon paketi gerekmez.
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
  ...props
}: TabTriggerSlotProps & { emoji?: string }) {
  const theme = useTheme();
  const { width } = useWindowDimensions();
  const narrow = width < 600;

  return (
    <Pressable
      {...props}
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
      <Text allowFontScaling={false} style={narrow ? styles.emojiNarrow : styles.emoji}>
        {emoji}
      </Text>
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
  emoji: { fontSize: 18 },
  emojiNarrow: { fontSize: 22, lineHeight: 26 },
  labelNarrow: { fontSize: 13, lineHeight: 16, textAlign: 'center', maxWidth: '100%' },
});
