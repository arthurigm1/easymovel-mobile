import { StyleSheet, Text, View } from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { Palette, Radius, Spacing } from '@/constants/theme';

type IoniconName = React.ComponentProps<typeof Ionicons>['name'];

interface BadgeProps {
  label: string;
  color?: string;
  bg?: string;
  icon?: IoniconName;
  size?: 'sm' | 'md';
  inverted?: boolean;
}

// Pill único usado em todo o app para status/tags — uma cor por vez, sem
// borda dupla, texto pequeno. Substitui as reimplementações espalhadas em
// EmpreendimentoCard/EmpreendimentoCardCompact/FilterSheet.

export function Badge({
  label,
  color = Palette.primary,
  bg = Palette.primaryLight,
  icon,
  size = 'md',
  inverted = false,
}: BadgeProps) {
  const isCompact = size === 'sm';
  const bgColor = inverted ? color : bg;
  const textColor = inverted ? Palette.white : color;

  return (
    <View style={[styles.badge, isCompact && styles.badgeSm, { backgroundColor: bgColor }]}>
      {icon ? <Ionicons name={icon} size={isCompact ? 10 : 12} color={textColor} /> : null}
      <Text
        style={[styles.text, isCompact && styles.textSm, { color: textColor }]}
        numberOfLines={1}
      >
        {label}
      </Text>
    </View>
  );
}

const styles = StyleSheet.create({
  badge: {
    flexDirection: 'row',
    alignItems: 'center',
    alignSelf: 'flex-start',
    gap: Spacing.xs,
    borderRadius: Radius.full,
    paddingHorizontal: Spacing.md,
    paddingVertical: Spacing.xs,
  },
  badgeSm: {
    paddingHorizontal: Spacing.sm,
    paddingVertical: 3,
  },
  text: {
    fontSize: 12,
    fontWeight: '700',
    letterSpacing: 0.2,
  },
  textSm: {
    fontSize: 10,
  },
});
