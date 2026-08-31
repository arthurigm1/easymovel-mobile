import { useRef } from 'react';
import { Animated, Pressable, StyleSheet, type GestureResponderEvent } from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { useFavorites } from '@/store/favorites';
import { tapLight, notifySuccess } from '@/utils/haptics';
import { Palette, Shadow } from '@/constants/theme';

interface Props {
  id: string;
  size?: number;
  // 'overlay' = círculo escuro translúcido sobre foto; 'surface' = chip branco.
  variant?: 'overlay' | 'surface';
}

export function FavoriteButton({ id, size = 20, variant = 'overlay' }: Props) {
  const isFav = useFavorites((s) => s.ids.includes(id));
  const toggle = useFavorites((s) => s.toggle);
  const scale = useRef(new Animated.Value(1)).current;

  function onPress(e: GestureResponderEvent) {
    e.stopPropagation?.();
    Animated.sequence([
      Animated.spring(scale, { toValue: 1.25, useNativeDriver: true, speed: 60, bounciness: 12 }),
      Animated.spring(scale, { toValue: 1, useNativeDriver: true, speed: 40, bounciness: 8 }),
    ]).start();
    if (isFav) tapLight();
    else notifySuccess();
    toggle(id);
  }

  const iconColor = isFav
    ? Palette.error
    : variant === 'overlay'
    ? Palette.white
    : Palette.textSecondary;

  return (
    <Pressable
      onPress={onPress}
      hitSlop={10}
      accessibilityRole="button"
      accessibilityState={{ selected: isFav }}
      accessibilityLabel={isFav ? 'Remover dos favoritos' : 'Adicionar aos favoritos'}
      style={[
        styles.base,
        variant === 'overlay' ? styles.overlay : styles.surface,
      ]}
    >
      <Animated.View style={{ transform: [{ scale }] }}>
        <Ionicons name={isFav ? 'heart' : 'heart-outline'} size={size} color={iconColor} />
      </Animated.View>
    </Pressable>
  );
}

const styles = StyleSheet.create({
  base: {
    width: 38,
    height: 38,
    borderRadius: 19,
    alignItems: 'center',
    justifyContent: 'center',
  },
  overlay: {
    backgroundColor: 'rgba(0,0,0,0.32)',
  },
  surface: {
    backgroundColor: Palette.surface,
    ...Shadow.xs,
  },
});
