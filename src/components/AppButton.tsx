import { useRef } from 'react';
import {
  ActivityIndicator,
  Animated,
  Pressable,
  StyleSheet,
  Text,
  View,
} from 'react-native';
import { Palette, Radius, Shadow } from '@/constants/theme';

type Variant = 'primary' | 'secondary' | 'ghost' | 'danger';
type Size = 'sm' | 'md' | 'lg';

interface Props {
  label: string;
  onPress: () => void;
  variant?: Variant;
  size?: Size;
  loading?: boolean;
  disabled?: boolean;
  iconLeft?: React.ReactNode;
  iconRight?: React.ReactNode;
  fullWidth?: boolean;
}

const CONFIG: Record<
  Variant,
  { bg: string; text: string; border?: string; shadow?: object }
> = {
  primary: {
    bg: Palette.primary,
    text: Palette.white,
    shadow: Shadow.lg,
  },
  secondary: {
    bg: Palette.surface,
    text: Palette.primary,
    border: Palette.primary,
    shadow: Shadow.sm,
  },
  ghost: {
    bg: 'transparent',
    text: Palette.primary,
  },
  danger: {
    bg: Palette.error,
    text: Palette.white,
    shadow: Shadow.sm,
  },
};

const SIZE_CONFIG: Record<Size, { py: number; px: number; fontSize: number; iconSize: number }> = {
  sm: { py: 8, px: 14, fontSize: 13, iconSize: 14 },
  md: { py: 13, px: 20, fontSize: 15, iconSize: 16 },
  lg: { py: 16, px: 26, fontSize: 16, iconSize: 18 },
};

export function AppButton({
  label,
  onPress,
  variant = 'primary',
  size = 'md',
  loading = false,
  disabled = false,
  iconLeft,
  iconRight,
  fullWidth = false,
}: Props) {
  const scale = useRef(new Animated.Value(1)).current;

  const cfg = CONFIG[variant];
  const sz = SIZE_CONFIG[size];
  const isDisabled = disabled || loading;

  function handlePressIn() {
    Animated.spring(scale, {
      toValue: 0.95,
      useNativeDriver: true,
      speed: 50,
      bounciness: 0,
    }).start();
  }

  function handlePressOut() {
    Animated.spring(scale, {
      toValue: 1,
      useNativeDriver: true,
      speed: 50,
      bounciness: 4,
    }).start();
  }

  return (
    <Animated.View
      style={[
        fullWidth && styles.fullWidth,
        { transform: [{ scale }] },
        cfg.shadow,
      ]}
    >
      <Pressable
        onPress={onPress}
        onPressIn={handlePressIn}
        onPressOut={handlePressOut}
        disabled={isDisabled}
        style={[
          styles.base,
          {
            backgroundColor: cfg.bg,
            paddingVertical: sz.py,
            paddingHorizontal: sz.px,
            borderWidth: cfg.border ? 1.5 : 0,
            borderColor: cfg.border ?? 'transparent',
            opacity: isDisabled ? 0.6 : 1,
          },
          fullWidth && styles.fullWidth,
        ]}
      >
        {loading ? (
          <ActivityIndicator
            size="small"
            color={cfg.text}
          />
        ) : (
          <View style={styles.inner}>
            {iconLeft ? <View style={{ marginRight: 6 }}>{iconLeft}</View> : null}
            <Text
              style={[
                styles.label,
                { color: cfg.text, fontSize: sz.fontSize },
              ]}
            >
              {label}
            </Text>
            {iconRight ? <View style={{ marginLeft: 6 }}>{iconRight}</View> : null}
          </View>
        )}
      </Pressable>
    </Animated.View>
  );
}

const styles = StyleSheet.create({
  base: {
    borderRadius: Radius.lg,
    alignItems: 'center',
    justifyContent: 'center',
  },
  fullWidth: {
    width: '100%',
  },
  inner: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
  },
  label: {
    fontWeight: '800',
    letterSpacing: 0.1,
  },
});
