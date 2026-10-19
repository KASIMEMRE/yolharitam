import { Link } from 'expo-router';
import { Pressable, StyleSheet } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';

import { ThemedText } from '@/components/themed-text';
import { ThemedView } from '@/components/themed-view';
import { Spacing } from '@/constants/theme';
import { useAuth } from '@/lib/auth-context';
import { supabase } from '@/lib/supabase';

export default function ProfileScreen() {
  const { session } = useAuth();

  return (
    <ThemedView style={styles.container}>
      <SafeAreaView style={styles.safeArea}>
        <ThemedText type="subtitle">Profil</ThemedText>
        <ThemedText themeColor="textSecondary">{session?.user.email}</ThemedText>

        <Link href="/onboarding" asChild>
          <Pressable style={({ pressed }) => pressed && styles.pressed}>
            <ThemedView type="backgroundElement" style={styles.button}>
              <ThemedText type="smallBold">Konumu değiştir</ThemedText>
            </ThemedView>
          </Pressable>
        </Link>

        {/* Çıkış yapınca oturum null olur; Stack.Protected bizi karşılama ekranına atar */}
        <Pressable
          onPress={() => supabase.auth.signOut()}
          style={({ pressed }) => pressed && styles.pressed}>
          <ThemedView type="backgroundElement" style={styles.button}>
            <ThemedText type="smallBold">Çıkış yap</ThemedText>
          </ThemedView>
        </Pressable>
      </SafeAreaView>
    </ThemedView>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1 },
  safeArea: { flex: 1, padding: Spacing.four, gap: Spacing.three },
  button: { paddingVertical: Spacing.three, borderRadius: Spacing.five, alignItems: 'center' },
  pressed: { opacity: 0.7 },
});
