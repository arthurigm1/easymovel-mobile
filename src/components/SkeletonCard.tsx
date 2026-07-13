import { useEffect, useRef } from 'react';
import { Animated, StyleSheet, View } from 'react-native';
import { Palette, Radius, Shadow, Spacing } from '@/constants/theme';

function SkeletonLine({ width, height = 14 }: { width: `${number}%` | number; height?: number }) {
  return (
    <View
      style={[
        styles.line,
        { width, height, borderRadius: height / 2 },
      ]}
    />
  );
}

export function SkeletonCard() {
  const shimmer = useRef(new Animated.Value(0)).current;

  useEffect(() => {
    const anim = Animated.loop(
      Animated.sequence([
        Animated.timing(shimmer, {
          toValue: 1,
          duration: 900,
          useNativeDriver: true,
        }),
        Animated.timing(shimmer, {
          toValue: 0,
          duration: 900,
          useNativeDriver: true,
        }),
      ])
    );
    anim.start();
    return () => anim.stop();
  }, [shimmer]);

  const opacity = shimmer.interpolate({
    inputRange: [0, 1],
    outputRange: [0.5, 1],
  });

  return (
    <Animated.View style={[styles.card, { opacity }]}>
      <View style={styles.image} />
      <View style={styles.body}>
        <SkeletonLine width="55%" height={11} />
        <SkeletonLine width="88%" height={20} />
        <SkeletonLine width="68%" height={13} />
        <View style={styles.chipRow}>
          <SkeletonLine width={56} height={26} />
          <SkeletonLine width={56} height={26} />
          <SkeletonLine width={56} height={26} />
        </View>
        <SkeletonLine width="40%" height={20} />
      </View>
    </Animated.View>
  );
}

export function SkeletonList({ count = 3 }: { count?: number }) {
  return (
    <>
      {Array.from({ length: count }).map((_, i) => (
        <SkeletonCard key={i} />
      ))}
    </>
  );
}

export function SkeletonRow() {
  const shimmer = useRef(new Animated.Value(0)).current;

  useEffect(() => {
    const anim = Animated.loop(
      Animated.sequence([
        Animated.timing(shimmer, { toValue: 1, duration: 900, useNativeDriver: true }),
        Animated.timing(shimmer, { toValue: 0, duration: 900, useNativeDriver: true }),
      ])
    );
    anim.start();
    return () => anim.stop();
  }, [shimmer]);

  const opacity = shimmer.interpolate({ inputRange: [0, 1], outputRange: [0.5, 1] });

  return (
    <Animated.View style={[rowStyles.row, { opacity }]}>
      <View style={rowStyles.square} />
      <View style={rowStyles.lines}>
        <View style={[rowStyles.line, { width: '60%' }]} />
        <View style={[rowStyles.line, { width: '40%', height: 11 }]} />
        <View style={[rowStyles.line, { width: '30%', height: 10 }]} />
      </View>
    </Animated.View>
  );
}

const rowStyles = StyleSheet.create({
  row: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: Palette.surface,
    borderRadius: Radius.lg,
    marginHorizontal: Spacing.lg,
    marginBottom: 10,
    padding: 14,
    gap: 14,
    borderWidth: 1,
    borderColor: Palette.borderLight,
  },
  square: {
    width: 60,
    height: 60,
    borderRadius: Radius.md,
    backgroundColor: Palette.border,
  },
  lines: { flex: 1, gap: 8 },
  line: {
    height: 14,
    borderRadius: 7,
    backgroundColor: Palette.border,
  },
});

const styles = StyleSheet.create({
  card: {
    backgroundColor: Palette.surface,
    borderRadius: Radius.xl,
    marginHorizontal: Spacing.lg,
    marginBottom: Spacing.lg,
    overflow: 'hidden',
    ...Shadow.sm,
    borderWidth: 1,
    borderColor: Palette.borderLight,
  },
  image: {
    height: 210,
    backgroundColor: Palette.surfaceVariant,
  },
  body: {
    padding: Spacing.lg,
    gap: 10,
  },
  line: {
    backgroundColor: Palette.border,
  },
  chipRow: {
    flexDirection: 'row',
    gap: 8,
    marginTop: 2,
  },
});
