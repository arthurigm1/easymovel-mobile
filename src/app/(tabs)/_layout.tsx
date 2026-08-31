import { useEffect } from 'react';
import { type ColorValue, Platform, StyleSheet, View } from 'react-native';
import { Tabs } from 'expo-router';
import { BlurView } from 'expo-blur';
import { Ionicons } from '@expo/vector-icons';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import Animated, {
  useAnimatedStyle,
  useReducedMotion,
  useSharedValue,
  withSpring,
} from 'react-native-reanimated';
import { tapLight } from '@/utils/haptics';
import { Palette, Radius, Shadow } from '@/constants/theme';

type IoniconName = React.ComponentProps<typeof Ionicons>['name'];

// Ícone de tab com indicador (pill) que anima ao focar + leve spring no ícone.
// Respeita reduced-motion: aplica o estado final instantaneamente, sem animar.
function TabBarIcon({
  focused,
  color,
  icon,
  iconActive,
}: {
  focused: boolean;
  color: ColorValue;
  icon: IoniconName;
  iconActive: IoniconName;
}) {
  const reduced = useReducedMotion();
  const progress = useSharedValue(focused ? 1 : 0);

  useEffect(() => {
    if (reduced) {
      progress.value = focused ? 1 : 0;
    } else {
      progress.value = withSpring(focused ? 1 : 0, { damping: 15, stiffness: 220 });
    }
  }, [focused, reduced, progress]);

  const pillStyle = useAnimatedStyle(() => ({
    opacity: progress.value,
    transform: [{ scale: 0.82 + progress.value * 0.18 }],
  }));
  const iconStyle = useAnimatedStyle(() => ({
    transform: [{ scale: reduced ? 1 : 1 + progress.value * 0.08 }],
  }));

  return (
    <View style={styles.iconWrap}>
      <Animated.View style={[styles.iconPill, pillStyle]} />
      <Animated.View style={iconStyle}>
        <Ionicons name={focused ? iconActive : icon} size={22} color={color} />
      </Animated.View>
    </View>
  );
}

interface TabConfig {
  name: string;
  title: string;
  icon: IoniconName;
  iconActive: IoniconName;
}

const TABS: TabConfig[] = [
  { name: 'inicio',          title: 'Início',      icon: 'home-outline',     iconActive: 'home' },
  { name: 'mapa',            title: 'Mapa',        icon: 'map-outline',      iconActive: 'map' },
  { name: 'favoritos',       title: 'Favoritos',   icon: 'heart-outline',    iconActive: 'heart' },
  { name: 'construtoras',    title: 'Construtoras',icon: 'business-outline', iconActive: 'business' },
  { name: 'perfil',          title: 'Perfil',      icon: 'person-outline',   iconActive: 'person' },
];

export default function TabsLayout() {
  const insets = useSafeAreaInsets();

  return (
    <Tabs
      screenListeners={{ tabPress: () => tapLight() }}
      screenOptions={{
        headerShown: false,
        tabBarActiveTintColor: Palette.primary,
        tabBarInactiveTintColor: Palette.textTertiary,
        tabBarStyle: {
          backgroundColor: Platform.OS === 'ios' ? 'transparent' : Palette.surface,
          borderTopWidth: StyleSheet.hairlineWidth,
          borderTopColor: Palette.border,
          height: 60 + insets.bottom,
          paddingTop: 10,
          paddingBottom: insets.bottom + 6,
          position: Platform.OS === 'ios' ? 'absolute' : undefined,
          ...Shadow.sm,
        },
        tabBarBackground: Platform.OS === 'ios'
          ? () => <BlurView intensity={90} tint="light" style={StyleSheet.absoluteFill} />
          : undefined,
        tabBarItemStyle: {
          paddingTop: 2,
        },
        tabBarLabelStyle: {
          fontSize: 11,
          fontWeight: '700',
          letterSpacing: -0.1,
          marginTop: 4,
        },
      }}
    >
      {TABS.map((tab) => (
        <Tabs.Screen
          key={tab.name}
          name={tab.name}
          options={{
            title: tab.title,
            tabBarIcon: ({ color, focused }) => (
              <TabBarIcon
                focused={focused}
                color={color}
                icon={tab.icon}
                iconActive={tab.iconActive}
              />
            ),
          }}
        />
      ))}
    </Tabs>
  );
}

const styles = StyleSheet.create({
  iconWrap: {
    width: 52,
    height: 32,
    alignItems: 'center',
    justifyContent: 'center',
  },
  iconPill: {
    position: 'absolute',
    top: 0,
    left: 0,
    right: 0,
    bottom: 0,
    borderRadius: Radius.full,
    backgroundColor: Palette.primaryLight,
  },
});
