import { useRef, useState } from 'react';
import {
  Animated,
  Pressable,
  StyleSheet,
  Text,
  TextInput,
  TextInputProps,
  View,
} from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { Palette, Radius } from '@/constants/theme';

interface Props extends Omit<TextInputProps, 'style'> {
  label?: string;
  error?: string;
  hint?: string;
  icon?: React.ComponentProps<typeof Ionicons>['name'];
  iconRight?: React.ComponentProps<typeof Ionicons>['name'];
  onIconRightPress?: () => void;
}

export function AppInput({
  label,
  error,
  hint,
  icon,
  iconRight,
  onIconRightPress,
  ...rest
}: Props) {
  const [focused, setFocused] = useState(false);
  const labelY = useRef(new Animated.Value(rest.value ? -22 : 0)).current;
  const labelScale = useRef(new Animated.Value(rest.value ? 0.8 : 1)).current;
  const borderColor = useRef(new Animated.Value(0)).current;

  const borderAnim = borderColor.interpolate({
    inputRange: [0, 1],
    outputRange: [Palette.border, Palette.primary],
  });

  function handleFocus(e: Parameters<NonNullable<TextInputProps['onFocus']>>[0]) {
    setFocused(true);
    Animated.parallel([
      Animated.spring(borderColor, { toValue: 1, useNativeDriver: false, speed: 40 }),
    ]).start();
    rest.onFocus?.(e);
  }

  function handleBlur(e: Parameters<NonNullable<TextInputProps['onBlur']>>[0]) {
    setFocused(false);
    Animated.spring(borderColor, { toValue: 0, useNativeDriver: false, speed: 40 }).start();
    rest.onBlur?.(e);
  }

  const hasError = !!error;

  return (
    <View style={styles.wrapper}>
      {label && (
        <Text style={[styles.label, focused && styles.labelFocused, hasError && styles.labelError]}>
          {label}
        </Text>
      )}

      <Animated.View
        style={[
          styles.container,
          {
            borderColor: hasError
              ? Palette.error
              : focused
              ? Palette.primary
              : Palette.border,
            backgroundColor: focused ? Palette.primaryLight : Palette.surfaceVariant,
          },
        ]}
      >
        {icon ? (
          <Ionicons
            name={icon}
            size={18}
            color={focused ? Palette.primary : Palette.textTertiary}
            style={styles.iconLeft}
          />
        ) : null}

        <TextInput
          style={[styles.input, icon && styles.inputWithIcon]}
          placeholderTextColor={Palette.textDisabled}
          onFocus={handleFocus}
          onBlur={handleBlur}
          {...rest}
        />

        {iconRight ? (
          <Pressable onPress={onIconRightPress} hitSlop={8}>
            <Ionicons
              name={iconRight}
              size={18}
              color={Palette.textTertiary}
            />
          </Pressable>
        ) : null}
      </Animated.View>

      {hasError && (
        <View style={styles.errorRow}>
          <Ionicons name="alert-circle" size={12} color={Palette.error} />
          <Text style={styles.errorText}>{error}</Text>
        </View>
      )}
      {hint && !hasError && (
        <Text style={styles.hint}>{hint}</Text>
      )}
    </View>
  );
}

const styles = StyleSheet.create({
  wrapper: { gap: 6 },
  label: {
    fontSize: 13,
    fontWeight: '700',
    color: Palette.textSecondary,
  },
  labelFocused: {
    color: Palette.primary,
  },
  labelError: {
    color: Palette.error,
  },
  container: {
    flexDirection: 'row',
    alignItems: 'center',
    borderWidth: 1.5,
    borderRadius: Radius.md,
    paddingHorizontal: 14,
    paddingVertical: 13,
    gap: 10,
  },
  iconLeft: { flexShrink: 0 },
  input: {
    flex: 1,
    fontSize: 15,
    color: Palette.text,
    padding: 0,
  },
  inputWithIcon: {},
  errorRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 4,
  },
  errorText: {
    fontSize: 12,
    color: Palette.error,
    fontWeight: '500',
  },
  hint: {
    fontSize: 12,
    color: Palette.textTertiary,
    fontWeight: '400',
  },
});
