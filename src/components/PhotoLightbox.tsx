import { Image } from 'expo-image';
import { useRef, useEffect, useState } from 'react';
import {
  Dimensions,
  FlatList,
  Modal,
  StyleSheet,
  Text,
  TouchableOpacity,
  View,
} from 'react-native';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { Ionicons } from '@expo/vector-icons';
import type { AnexoItem } from '@/types';

const { width: SCREEN_W, height: SCREEN_H } = Dimensions.get('window');

interface Props {
  photos: AnexoItem[];
  initialIndex?: number;
  visible: boolean;
  onClose: () => void;
}

export function PhotoLightbox({ photos, initialIndex = 0, visible, onClose }: Props) {
  const insets = useSafeAreaInsets();
  const listRef = useRef<FlatList>(null);
  const [currentIndex, setCurrentIndex] = useState(initialIndex);

  useEffect(() => {
    if (visible && photos.length > 0) {
      setCurrentIndex(initialIndex);
      // Defer scroll to let the modal finish mounting
      setTimeout(() => {
        listRef.current?.scrollToIndex({ index: initialIndex, animated: false });
      }, 50);
    }
  }, [visible, initialIndex]);

  if (photos.length === 0) return null;

  return (
    <Modal
      visible={visible}
      transparent={false}
      animationType="fade"
      statusBarTranslucent
      onRequestClose={onClose}
    >
      <View style={styles.container}>
        {/* Close button */}
        <TouchableOpacity
          style={[styles.closeBtn, { top: insets.top + 8 }]}
          onPress={onClose}
          hitSlop={12}
        >
          <Ionicons name="close" size={22} color="#fff" />
        </TouchableOpacity>

        {/* Counter */}
        <View style={[styles.counter, { top: insets.top + 14 }]}>
          <Text style={styles.counterText}>
            {currentIndex + 1} / {photos.length}
          </Text>
        </View>

        {/* Photo strip */}
        <FlatList
          ref={listRef}
          data={photos}
          horizontal
          pagingEnabled
          keyExtractor={(p) => p.id}
          showsHorizontalScrollIndicator={false}
          getItemLayout={(_, index) => ({
            length: SCREEN_W,
            offset: SCREEN_W * index,
            index,
          })}
          onMomentumScrollEnd={(e) => {
            const idx = Math.round(e.nativeEvent.contentOffset.x / SCREEN_W);
            setCurrentIndex(idx);
          }}
          renderItem={({ item }) => {
            // Load full-res version: strip /medium/ path segment (same as frontend)
            const hiRes = item.link?.replace(/\/medium\//g, '/') ?? item.link;
            return (
              <View style={styles.slide}>
                <Image
                  source={hiRes}
                  style={styles.photo}
                  contentFit="contain"
                  cachePolicy="memory-disk"
                  transition={150}
                />
              </View>
            );
          }}
        />

        {/* Description */}
        {photos[currentIndex]?.descricao ? (
          <View style={[styles.caption, { paddingBottom: insets.bottom + 12 }]}>
            <Text style={styles.captionText} numberOfLines={2}>
              {photos[currentIndex].descricao}
            </Text>
          </View>
        ) : (
          <View style={{ height: insets.bottom + 12 }} />
        )}

        {/* Dot indicators (max 10) */}
        {photos.length > 1 && photos.length <= 10 && (
          <View style={[styles.dots, { bottom: (insets.bottom || 16) + 48 }]}>
            {photos.map((_, i) => (
              <View
                key={i}
                style={[styles.dot, i === currentIndex && styles.dotActive]}
              />
            ))}
          </View>
        )}
      </View>
    </Modal>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#000',
  },
  closeBtn: {
    position: 'absolute',
    left: 16,
    zIndex: 10,
    width: 36,
    height: 36,
    borderRadius: 18,
    backgroundColor: 'rgba(255,255,255,0.15)',
    alignItems: 'center',
    justifyContent: 'center',
  },
  counter: {
    position: 'absolute',
    alignSelf: 'center',
    left: 0,
    right: 0,
    zIndex: 10,
    alignItems: 'center',
  },
  counterText: {
    color: '#fff',
    fontSize: 14,
    fontWeight: '600',
    opacity: 0.85,
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
  caption: {
    position: 'absolute',
    bottom: 0,
    left: 0,
    right: 0,
    backgroundColor: 'rgba(0,0,0,0.6)',
    paddingHorizontal: 20,
    paddingTop: 12,
  },
  captionText: {
    color: '#fff',
    fontSize: 13,
    fontWeight: '500',
    textAlign: 'center',
    lineHeight: 18,
  },
  dots: {
    position: 'absolute',
    alignSelf: 'center',
    left: 0,
    right: 0,
    flexDirection: 'row',
    justifyContent: 'center',
    gap: 5,
  },
  dot: {
    width: 5,
    height: 5,
    borderRadius: 3,
    backgroundColor: 'rgba(255,255,255,0.4)',
  },
  dotActive: {
    backgroundColor: '#fff',
    width: 16,
  },
});
