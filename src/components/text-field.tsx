import { useState, type ReactNode } from 'react';
import { StyleSheet, TextInput, View, type TextInputProps } from 'react-native';
import Animated, {
  interpolateColor,
  useAnimatedStyle,
  useReducedMotion,
  useSharedValue,
  withTiming,
} from 'react-native-reanimated';

import { ThemedText } from '@/components/themed-text';
import { Border, Radius, Spacing } from '@/constants/theme';
import { useTheme } from '@/hooks/use-theme';

// Etiketli metin alanı. TextInput'un tüm özelliklerini alır (...rest),
// üstüne etiket, alt bilgi ve sağda bir ek (örn. "Göster" butonu) ekler.
type TextFieldProps = TextInputProps & {
  label: string;
  hint?: string; // Alanın altındaki küçük açıklama
  hintTone?: 'neutral' | 'good';
  invalid?: boolean; // true ise kenar ve ipucu mercan rengine döner
  right?: ReactNode; // Alanın sağ ucuna konacak öğe
};

export function TextField({
  label,
  hint,
  hintTone = 'neutral',
  invalid = false,
  right,
  style,
  ...rest
}: TextFieldProps) {
  const theme = useTheme();
  const reduceMotion = useReducedMotion();
  const [focused, setFocused] = useState(false);
  // 0 = odakta değil, 1 = odakta. Kenar rengi bu değere göre yumuşakça geçer.
  const focus = useSharedValue(0);

  const idleColor = invalid ? theme.coral : theme.borderStrong;
  const activeColor = invalid ? theme.coral : theme.accent;
  const borderStyle = useAnimatedStyle(() => ({
    borderColor: interpolateColor(focus.value, [0, 1], [idleColor, activeColor]),
  }));

  function animateTo(value: 0 | 1) {
    focus.value = reduceMotion ? value : withTiming(value, { duration: 150 });
  }

  return (
    <View style={styles.wrapper}>
      <ThemedText type="smallBold">{label}</ThemedText>
      {/* Dış halka: odaklanınca kutunun etrafında yumuşak bir yeşil çerçeve belirir */}
      <View
        style={[
          styles.halo,
          { borderColor: focused ? theme.accentSoft : 'transparent' },
        ]}>
        <Animated.View style={[styles.box, { backgroundColor: theme.card }, borderStyle]}>
          <TextInput
            {...rest}
            style={[styles.input, { color: theme.text }, style]}
            placeholderTextColor={theme.textSecondary}
            accessibilityLabel={label}
            onFocus={(e) => {
              setFocused(true);
              animateTo(1);
              rest.onFocus?.(e);
            }}
            onBlur={(e) => {
              setFocused(false);
              animateTo(0);
              rest.onBlur?.(e);
            }}
          />
          {right}
        </Animated.View>
      </View>
      {hint && (
        <ThemedText
          type="small"
          themeColor={invalid ? 'coralInk' : hintTone === 'good' ? 'accentInk' : 'textSecondary'}>
          {hint}
        </ThemedText>
      )}
    </View>
  );
}

const styles = StyleSheet.create({
  wrapper: { gap: Spacing.two },
  // Halka 4px kalınlığında sabit yer kaplar (şeffafken de), böylece odaklanınca yerleşim zıplamaz.
  // margin -4: halka kutunun DIŞINA taşar; böylece kutu etiket/segment/butonla aynı x hizasında durur.
  halo: { borderWidth: 4, borderRadius: Radius.md + 4, margin: -4 },
  box: {
    flexDirection: 'row',
    alignItems: 'center',
    minHeight: 56,
    borderRadius: Radius.md,
    borderWidth: Border.thick,
    paddingLeft: Spacing.three,
    paddingRight: Spacing.two, // sağdaki "Göster" kenara yapışmasın
  },
  input: { flex: 1, paddingVertical: Spacing.three, fontSize: 17 },
});
