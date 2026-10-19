import { Pressable, StyleSheet } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';

import { ThemedText } from '@/components/themed-text';
import { ThemedView } from '@/components/themed-view';
import { Spacing } from '@/constants/theme';
import { Link } from 'expo-router';

export default function OnboardingScreen() {
    return (
        <ThemedView style={styles.container}>
            <SafeAreaView style={styles.safeArea}>
                <ThemedText type="subtitle">Ne Öğrenmek İstiyorsun?</ThemedText>
                <ThemedText themeColor="textSecondary">Alanını ve seviyeni seç, sana özel yol haritanı oluşturalım.</ThemedText>
                <Link href="/roadmap" asChild>
                    <Pressable style={({ pressed }) => pressed && styles.pressed}>
                        <ThemedView type="backgroundElement" style={styles.button}>
                            <ThemedText type="smallBold">Hadi →</ThemedText>
                        </ThemedView>
                    </Pressable>
                </Link>
            </SafeAreaView>
        </ThemedView>
    );


}

const styles = StyleSheet.create({

    container: {
        flex: 1,
        justifyContent: 'center',
        flexDirection: 'row',
    },
    safeArea: {
        flex: 1,
        paddingHorizontal: Spacing.four,
        alignItems: 'center',
        justifyContent: 'center',
        gap: Spacing.three,
        
    },
    heroSection: {
        alignItems: 'center',
        justifyContent: 'center',
        paddingHorizontal: Spacing.four,
        gap: Spacing.four,
    },
    title: {
        textAlign: 'center',
    },
    code: {
        textTransform: 'uppercase',
    },
    button: {
        paddingVertical: Spacing.three,
        paddingHorizontal: Spacing.five,
        borderRadius: Spacing.five,
    },
    pressed: {
        opacity: 0.7,
    },

});


