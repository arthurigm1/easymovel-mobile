import { useEffect, useRef } from 'react';
import { Animated, StyleSheet, View } from 'react-native';

function SkeletonLine({ width, height = 14 }: { width: `${number}%` | number; height?: number }) {
  return <View style={[styles.line, { width, height, borderRadius: height / 2 }]} />;
}

export function SkeletonCard() {
  const opacity = useRef(new Animated.Value(0.4)).current;

  useEffect(() => {
    const anim = Animated.loop(
      Animated.sequence([
        Animated.timing(opacity, { toValue: 1, duration: 800, useNativeDriver: true }),
        Animated.timing(opacity, { toValue: 0.4, duration: 800, useNativeDriver: true }),
      ])
    );
    anim.start();
    return () => anim.stop();
  }, [opacity]);

  return (
    <Animated.View style={[styles.card, { opacity }]}>
      <View style={styles.image} />
      <View style={styles.body}>
        <SkeletonLine width="60%" height={12} />
        <SkeletonLine width="85%" height={18} />
        <SkeletonLine width="70%" height={14} />
        <View style={styles.row}>
          <SkeletonLine width={60} height={12} />
          <SkeletonLine width={60} height={12} />
          <SkeletonLine width={60} height={12} />
        </View>
      </View>
    </Animated.View>
  );
}

const styles = StyleSheet.create({
  card: {
    backgroundColor: '#FFFFFF',
    borderRadius: 16,
    marginHorizontal: 16,
    marginBottom: 16,
    overflow: 'hidden',
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.06,
    shadowRadius: 8,
    elevation: 3,
  },
  image: {
    height: 200,
    backgroundColor: '#E2E8F0',
  },
  body: {
    padding: 16,
    gap: 10,
  },
  line: {
    backgroundColor: '#E2E8F0',
  },
  row: {
    flexDirection: 'row',
    gap: 12,
    marginTop: 4,
  },
});
