import { useEffect, useRef } from 'react';
import { Animated, StyleSheet, View, useWindowDimensions } from 'react-native';
import { LinearGradient } from 'expo-linear-gradient';
import Reanimated, {
  Easing,
  cancelAnimation,
  useAnimatedStyle,
  useReducedMotion,
  useSharedValue,
  withRepeat,
  withTiming,
} from 'react-native-reanimated';
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

// A soft light band that sweeps horizontally across the card so loading feels
// alive. Runs on the UI thread; skipped entirely under reduced motion.
function Shimmer() {
  const reduced = useReducedMotion();
  const { width } = useWindowDimensions();
  const cardW = width - Spacing.lg * 2;
  const bandW = Math.round(cardW * 0.6);
  const x = useSharedValue(-bandW);

  useEffect(() => {
    if (reduced) return;
    x.value = -bandW;
    x.value = withRepeat(
      withTiming(cardW, { duration: 1250, easing: Easing.inOut(Easing.ease) }),
      -1,
      false,
    );
    return () => cancelAnimation(x);
  }, [reduced, cardW, bandW, x]);

  const style = useAnimatedStyle(() => ({ transform: [{ translateX: x.value }] }));

  if (reduced) return null;

  return (
    <Reanimated.View pointerEvents="none" style={[styles.shimmerBand, { width: bandW }, style]}>
      {/* rgba only — translucent highlight overlay (scrim-like), blocks stay on Palette tokens. */}
      <LinearGradient
        colors={['rgba(255,255,255,0)', 'rgba(255,255,255,0.7)', 'rgba(255,255,255,0)']}
        start={{ x: 0, y: 0 }}
        end={{ x: 1, y: 0 }}
        style={StyleSheet.absoluteFill}
      />
    </Reanimated.View>
  );
}

export function SkeletonCard() {
  return (
    <View style={styles.card}>
      {/* Hero with overlaid name/location, mirroring the real card. */}
      <View style={styles.image}>
        <View style={styles.imageOverlay}>
          <SkeletonLine width="34%" height={9} />
          <SkeletonLine width="72%" height={20} />
          <SkeletonLine width="50%" height={12} />
        </View>
      </View>
      <View style={styles.body}>
        <View style={styles.specsRow}>
          <SkeletonLine width={78} height={13} />
          <SkeletonLine width={64} height={13} />
        </View>
        <View style={styles.priceRow}>
          <SkeletonLine width="45%" height={22} />
          <SkeletonLine width={58} height={22} />
        </View>
      </View>
      <Shimmer />
    </View>
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
    marginBottom: Spacing.md,
    overflow: 'hidden',
    ...Shadow.sm,
    borderWidth: 1,
    borderColor: Palette.borderLight,
  },
  image: {
    aspectRatio: 16 / 10,
    backgroundColor: Palette.surfaceVariant,
    justifyContent: 'flex-end',
  },
  imageOverlay: {
    paddingHorizontal: 14,
    paddingBottom: 12,
    gap: 6,
  },
  body: {
    paddingHorizontal: 14,
    paddingTop: 11,
    paddingBottom: 13,
    gap: 12,
  },
  line: {
    backgroundColor: Palette.border,
  },
  shimmerBand: {
    position: 'absolute',
    top: 0,
    bottom: 0,
    left: 0,
  },
  specsRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 16,
  },
  priceRow: {
    flexDirection: 'row',
    alignItems: 'flex-end',
    justifyContent: 'space-between',
  },
});
