import { StyleSheet, Text, View } from 'react-native';
import { Palette, Radius } from '@/constants/theme';

interface Props {
  value: number; // 0-1
  showLabel?: boolean;
}

export function ProgressBar({ value, showLabel = true }: Props) {
  const pct = Math.min(Math.max(value * 100, 0), 100);
  const isComplete = pct >= 100;
  const color = isComplete
    ? Palette.textSecondary
    : pct >= 90
    ? Palette.error
    : pct >= 60
    ? Palette.warning
    : Palette.primary;

  return (
    <View style={styles.wrapper}>
      <View style={styles.track}>
        <View
          style={[styles.fill, { width: `${pct}%` as `${number}%`, backgroundColor: color }]}
        />
      </View>
      {showLabel && !isComplete && (
        <Text style={[styles.label, { color }]}>{Math.round(pct)}% vendido</Text>
      )}
    </View>
  );
}

const styles = StyleSheet.create({
  wrapper: { gap: 5 },
  track: {
    height: 5,
    borderRadius: Radius.full,
    backgroundColor: Palette.border,
    overflow: 'hidden',
  },
  fill: {
    height: '100%',
    borderRadius: Radius.full,
  },
  label: {
    fontSize: 11,
    fontWeight: '600',
  },
});
