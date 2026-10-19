import { useState, type ReactNode } from 'react';
import { StyleSheet, TextInput, View, type TextInputProps } from 'react-native';

import { ThemedText } from '@/components/themed-text';
import { Spacing } from '@/constants/theme';
import { useTheme } from '@/hooks/use-theme';

// Etiketli metin alanı. TextInput'un tüm özelliklerini alır (...rest),
// üstüne etiket, alt bilgi ve sağda bir ek (örn. "Göster" butonu) ekler.
type TextFieldProps = TextInputProps & {
  label: string;
  hint?: string; // Alanın altındaki küçük açıklama
  hintTone?: 'neutral' | 'good';
  right?: ReactNode; // Alanın sağ ucuna konacak öğe
};

export function TextField({ label, hint, hintTone = 'neutral', right, style, ...rest }: TextFieldProps) {
  const theme = useTheme();
  const [focused, setFocused] = useState(false);

  return (
    <View style={styles.wrapper}>
      <ThemedText type="smallBold">{label}</ThemedText>
      <View
        style={[
          styles.box,
          { backgroundColor: theme.backgroundElement, borderColor: focused ? theme.accent : 'transparent' },
        ]}>
        <TextInput
          {...rest}
          style={[styles.input, { color: theme.text }, style]}
          placeholderTextColor={theme.textSecondary}
          accessibilityLabel={label}
          onFocus={(e) => {
            setFocused(true);
            rest.onFocus?.(e);
          }}
          onBlur={(e) => {
            setFocused(false);
            rest.onBlur?.(e);
          }}
        />
        {right}
      </View>
      {hint && (
        <ThemedText
          type="small"
          style={hintTone === 'good' ? { color: theme.accent } : undefined}
          themeColor={hintTone === 'good' ? undefined : 'textSecondary'}>
          {hint}
        </ThemedText>
      )}
    </View>
  );
}

const styles = StyleSheet.create({
  wrapper: { gap: Spacing.two },
  box: {
    flexDirection: 'row',
    alignItems: 'center',
    borderRadius: Spacing.three,
    borderWidth: 2,
    paddingHorizontal: Spacing.three,
  },
  input: { flex: 1, paddingVertical: Spacing.three, fontSize: 16 },
});
