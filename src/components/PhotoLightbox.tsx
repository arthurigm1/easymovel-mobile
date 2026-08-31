import { Image } from 'expo-image';
import { useEffect, useRef, useState } from 'react';
import {
  Dimensions,
  FlatList,
  Modal,
  Platform,
  Share,
  StyleSheet,
  Text,
  TouchableOpacity,
  View,
} from 'react-native';
import {
  Gesture,
  GestureDetector,
  GestureHandlerRootView,
} from 'react-native-gesture-handler';
import Animated, {
  runOnJS,
  useAnimatedStyle,
  useSharedValue,
  withTiming,
} from 'react-native-reanimated';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { Ionicons } from '@expo/vector-icons';
import { Palette, Radius, Shadow, Spacing } from '@/constants/theme';
import type { AnexoItem } from '@/types';

const { width: SCREEN_W, height: SCREEN_H } = Dimensions.get('window');

const THUMB = 54;
const THUMB_GAP = Spacing.sm;
const MAX_SCALE = 4;
const DOUBLE_TAP_SCALE = 2.5;

interface Props {
  photos: AnexoItem[];
  initialIndex?: number;
  visible: boolean;
  onClose: () => void;
}

// ── Zoomable page ────────────────────────────────────────────────────────────
// Pinch + double-tap + pan on a single full-screen image. Zoom resets whenever
// the page is scrolled away (`active` flips to false). Reports zoom state up so
// the parent can freeze horizontal paging while the image is magnified.
interface ZoomableProps {
  uri?: string;
  active: boolean;
  onZoomChange: (zoomed: boolean) => void;
}

function ZoomableImage({ uri, active, onZoomChange }: ZoomableProps) {
  const scale = useSharedValue(1);
  const savedScale = useSharedValue(1);
  const tx = useSharedValue(0);
  const ty = useSharedValue(0);
  const savedTx = useSharedValue(0);
  const savedTy = useSharedValue(0);

  // Snap back to 1x with no animation whenever this page leaves the viewport.
  useEffect(() => {
    if (!active) {
      scale.value = 1;
      savedScale.value = 1;
      tx.value = 0;
      ty.value = 0;
      savedTx.value = 0;
      savedTy.value = 0;
    }
  }, [active]);

  const resetZoom = () => {
    'worklet';
    scale.value = withTiming(1);
    savedScale.value = 1;
    tx.value = withTiming(0);
    ty.value = withTiming(0);
    savedTx.value = 0;
    savedTy.value = 0;
  };

  const clamp = () => {
    'worklet';
    const maxX = ((scale.value - 1) * SCREEN_W) / 2;
    const maxY = ((scale.value - 1) * SCREEN_H) / 2;
    tx.value = Math.min(Math.max(tx.value, -maxX), maxX);
    ty.value = Math.min(Math.max(ty.value, -maxY), maxY);
  };

  const pinch = Gesture.Pinch()
    .onUpdate((e) => {
      scale.value = Math.min(Math.max(savedScale.value * e.scale, 1), MAX_SCALE);
    })
    .onEnd(() => {
      if (scale.value <= 1.02) {
        resetZoom();
        runOnJS(onZoomChange)(false);
      } else {
        savedScale.value = scale.value;
        clamp();
        savedTx.value = tx.value;
        savedTy.value = ty.value;
        runOnJS(onZoomChange)(true);
      }
    });

  // Two-finger friendly pan; only moves the image once it is zoomed in.
  const pan = Gesture.Pan()
    .maxPointers(2)
    .onUpdate((e) => {
      if (scale.value <= 1) return;
      tx.value = savedTx.value + e.translationX;
      ty.value = savedTy.value + e.translationY;
    })
    .onEnd(() => {
      if (scale.value > 1) {
        clamp();
        savedTx.value = tx.value;
        savedTy.value = ty.value;
      }
    });

  const doubleTap = Gesture.Tap()
    .numberOfTaps(2)
    .maxDelay(250)
    .onEnd((e) => {
      if (scale.value > 1) {
        resetZoom();
        runOnJS(onZoomChange)(false);
      } else {
        // Keep the tapped point anchored while zooming toward it.
        const focalX = e.x - SCREEN_W / 2;
        const focalY = e.y - SCREEN_H / 2;
        const target = focalX * (1 - DOUBLE_TAP_SCALE);
        const targetY = focalY * (1 - DOUBLE_TAP_SCALE);
        scale.value = withTiming(DOUBLE_TAP_SCALE);
        savedScale.value = DOUBLE_TAP_SCALE;
        tx.value = withTiming(target);
        ty.value = withTiming(targetY);
        savedTx.value = target;
        savedTy.value = targetY;
        runOnJS(onZoomChange)(true);
      }
    });

  const gesture = Gesture.Exclusive(doubleTap, Gesture.Simultaneous(pinch, pan));

  const animStyle = useAnimatedStyle(() => ({
    transform: [
      { translateX: tx.value },
      { translateY: ty.value },
      { scale: scale.value },
    ],
  }));

  const hiRes = uri?.replace(/\/medium\//g, '/') ?? uri;

  return (
    <GestureDetector gesture={gesture}>
      <Animated.View style={[styles.slide, animStyle]}>
        <Image
          source={hiRes}
          style={styles.photo}
          contentFit="contain"
          cachePolicy="memory-disk"
          transition={150}
          accessibilityIgnoresInvertColors
        />
      </Animated.View>
    </GestureDetector>
  );
}

// ── Lightbox ─────────────────────────────────────────────────────────────────
export function PhotoLightbox({ photos, initialIndex = 0, visible, onClose }: Props) {
  const insets = useSafeAreaInsets();
  const listRef = useRef<FlatList>(null);
  const thumbRef = useRef<FlatList>(null);
  const [currentIndex, setCurrentIndex] = useState(initialIndex);
  const [pagingEnabled, setPagingEnabled] = useState(true);

  const multi = photos.length > 1;

  useEffect(() => {
    if (visible && photos.length > 0) {
      setCurrentIndex(initialIndex);
      setPagingEnabled(true);
      // Defer scroll to let the modal finish mounting.
      setTimeout(() => {
        listRef.current?.scrollToIndex({ index: initialIndex, animated: false });
      }, 50);
    }
  }, [visible, initialIndex]);

  // Keep the thumbnail strip centered on the active photo.
  useEffect(() => {
    if (!multi) return;
    thumbRef.current?.scrollToIndex({
      index: currentIndex,
      animated: true,
      viewPosition: 0.5,
    });
  }, [currentIndex, multi]);

  if (photos.length === 0) return null;

  const goTo = (index: number) => {
    setPagingEnabled(true);
    setCurrentIndex(index);
    listRef.current?.scrollToIndex({ index, animated: true });
  };

  const onShare = async () => {
    const link = photos[currentIndex]?.link;
    if (!link) return;
    try {
      await Share.share(Platform.OS === 'ios' ? { url: link } : { message: link });
    } catch {
      // user cancelled / share unavailable — no-op
    }
  };

  const canShare = !!photos[currentIndex]?.link;

  return (
    <Modal
      visible={visible}
      transparent={false}
      animationType="fade"
      statusBarTranslucent
      onRequestClose={onClose}
    >
      {/* Own gesture root: the app has none, and a RN Modal renders in a separate
          native tree, so gestures need their own root here to work on both OSes. */}
      <GestureHandlerRootView style={styles.root}>
        <View style={styles.container}>
          {/* Full-screen paged photos */}
          <FlatList
            ref={listRef}
            data={photos}
            horizontal
            pagingEnabled
            scrollEnabled={pagingEnabled}
            keyExtractor={(p) => p.id}
            showsHorizontalScrollIndicator={false}
            getItemLayout={(_, index) => ({
              length: SCREEN_W,
              offset: SCREEN_W * index,
              index,
            })}
            onScrollToIndexFailed={() => {}}
            onMomentumScrollEnd={(e) => {
              const idx = Math.round(e.nativeEvent.contentOffset.x / SCREEN_W);
              setPagingEnabled(true);
              setCurrentIndex(idx);
            }}
            renderItem={({ item, index }) => (
              <ZoomableImage
                uri={item.link}
                active={index === currentIndex}
                onZoomChange={(zoomed) => setPagingEnabled(!zoomed)}
              />
            )}
          />

          {/* Top bar: close · counter · share */}
          <View style={[styles.topBar, { top: insets.top + Spacing.sm }]}>
            <TouchableOpacity
              style={styles.iconBtn}
              onPress={onClose}
              hitSlop={10}
              accessibilityRole="button"
              accessibilityLabel="Fechar galeria de fotos"
            >
              <Ionicons name="close" size={24} color={Palette.white} />
            </TouchableOpacity>

            {multi ? (
              <View style={styles.counter}>
                <Text style={styles.counterText}>
                  {currentIndex + 1} / {photos.length}
                </Text>
              </View>
            ) : (
              <View style={styles.iconBtn} />
            )}

            {canShare ? (
              <TouchableOpacity
                style={styles.iconBtn}
                onPress={onShare}
                hitSlop={10}
                accessibilityRole="button"
                accessibilityLabel="Compartilhar esta foto"
              >
                <Ionicons name="share-outline" size={22} color={Palette.white} />
              </TouchableOpacity>
            ) : (
              <View style={styles.iconBtn} />
            )}
          </View>

          {/* Bottom: caption + thumbnail strip */}
          <View style={[styles.bottom, { paddingBottom: insets.bottom || Spacing.md }]}>
            {photos[currentIndex]?.descricao ? (
              <Text style={styles.captionText} numberOfLines={2}>
                {photos[currentIndex].descricao}
              </Text>
            ) : null}

            {multi && (
              <FlatList
                ref={thumbRef}
                data={photos}
                horizontal
                keyExtractor={(p) => `t-${p.id}`}
                showsHorizontalScrollIndicator={false}
                style={styles.thumbStrip}
                contentContainerStyle={styles.thumbContent}
                getItemLayout={(_, index) => ({
                  length: THUMB + THUMB_GAP,
                  offset: (THUMB + THUMB_GAP) * index,
                  index,
                })}
                onScrollToIndexFailed={() => {}}
                renderItem={({ item, index }) => {
                  const isActive = index === currentIndex;
                  return (
                    <TouchableOpacity
                      onPress={() => goTo(index)}
                      activeOpacity={0.8}
                      accessibilityRole="imagebutton"
                      accessibilityLabel={`Ver foto ${index + 1} de ${photos.length}`}
                      accessibilityState={{ selected: isActive }}
                      style={[styles.thumbTouch, isActive && styles.thumbTouchActive]}
                    >
                      <Image
                        source={item.link}
                        style={styles.thumbImg}
                        contentFit="cover"
                        cachePolicy="memory-disk"
                        transition={100}
                      />
                      {!isActive && <View style={styles.thumbDim} />}
                    </TouchableOpacity>
                  );
                }}
              />
            )}
          </View>
        </View>
      </GestureHandlerRootView>
    </Modal>
  );
}

const styles = StyleSheet.create({
  root: {
    flex: 1,
    backgroundColor: Palette.black,
  },
  container: {
    flex: 1,
    backgroundColor: Palette.black,
  },
  slide: {
    width: SCREEN_W,
    height: SCREEN_H,
    alignItems: 'center',
    justifyContent: 'center',
  },
  photo: {
    width: SCREEN_W,
    height: SCREEN_H,
  },

  // Top bar
  topBar: {
    position: 'absolute',
    left: Spacing.md,
    right: Spacing.md,
    zIndex: 10,
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
  },
  iconBtn: {
    width: 44,
    height: 44,
    borderRadius: Radius.full,
    backgroundColor: 'rgba(0,0,0,0.45)',
    alignItems: 'center',
    justifyContent: 'center',
    ...Shadow.sm,
  },
  counter: {
    paddingHorizontal: Spacing.md,
    height: 32,
    borderRadius: Radius.full,
    backgroundColor: 'rgba(0,0,0,0.45)',
    alignItems: 'center',
    justifyContent: 'center',
    ...Shadow.sm,
  },
  counterText: {
    color: Palette.white,
    fontSize: 14,
    fontWeight: '700',
  },

  // Bottom cluster
  bottom: {
    position: 'absolute',
    left: 0,
    right: 0,
    bottom: 0,
    zIndex: 10,
    paddingTop: Spacing.md,
    gap: Spacing.sm,
    backgroundColor: 'rgba(0,0,0,0.35)',
  },
  captionText: {
    color: Palette.white,
    fontSize: 13,
    fontWeight: '500',
    textAlign: 'center',
    lineHeight: 18,
    paddingHorizontal: Spacing.xl,
  },
  thumbStrip: {
    flexGrow: 0,
  },
  thumbContent: {
    paddingHorizontal: Spacing.md,
    gap: THUMB_GAP,
  },
  thumbTouch: {
    width: THUMB,
    height: THUMB,
    borderRadius: Radius.md,
    overflow: 'hidden',
    borderWidth: 2,
    borderColor: 'transparent',
  },
  thumbTouchActive: {
    borderColor: Palette.primary,
  },
  thumbImg: {
    width: '100%',
    height: '100%',
    borderRadius: Radius.sm,
  },
  thumbDim: {
    position: 'absolute',
    top: 0,
    left: 0,
    right: 0,
    bottom: 0,
    backgroundColor: 'rgba(0,0,0,0.35)',
  },
});
