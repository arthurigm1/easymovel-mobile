import { Platform, StyleSheet, View } from 'react-native';
import { Tabs } from 'expo-router';
import { BlurView } from 'expo-blur';
import { Ionicons } from '@expo/vector-icons';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { Palette, Radius, Shadow } from '@/constants/theme';

type IoniconName = React.ComponentProps<typeof Ionicons>['name'];

interface TabConfig {
  name: string;
  title: string;
  icon: IoniconName;
  iconActive: IoniconName;
}

const TABS: TabConfig[] = [
  { name: 'inicio',          title: 'Início',      icon: 'home-outline',     iconActive: 'home' },
  { name: 'construtoras',    title: 'Construtoras',icon: 'business-outline', iconActive: 'business' },
  { name: 'perfil',          title: 'Perfil',      icon: 'person-outline',   iconActive: 'person' },
];

export default function TabsLayout() {
  const insets = useSafeAreaInsets();

  return (
    <Tabs
      screenOptions={{
        headerShown: false,
        tabBarActiveTintColor: Palette.primary,
        tabBarInactiveTintColor: Palette.textTertiary,
        tabBarStyle: {
          backgroundColor: Platform.OS === 'ios' ? 'transparent' : Palette.surface,
          borderTopWidth: 1,
          borderTopColor: Palette.borderLight,
          height: 56 + insets.bottom,
          paddingTop: 8,
          paddingBottom: insets.bottom,
          position: Platform.OS === 'ios' ? 'absolute' : undefined,
          ...Shadow.xs,
        },
        tabBarBackground: Platform.OS === 'ios'
          ? () => <BlurView intensity={90} tint="light" style={StyleSheet.absoluteFill} />
          : undefined,
        tabBarLabelStyle: {
          fontSize: 10.5,
          fontWeight: '700',
          marginTop: 3,
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
              <View style={styles.iconWrap}>
                <Ionicons name={focused ? tab.iconActive : tab.icon} size={23} color={color} />
                {focused && <View style={styles.indicator} />}
              </View>
            ),
          }}
        />
      ))}
    </Tabs>
  );
}

const styles = StyleSheet.create({
  iconWrap: {
    alignItems: 'center',
    justifyContent: 'center',
    gap: 3,
  },
  indicator: {
    position: 'absolute',
    top: -8,
    width: 16,
    height: 3,
    borderRadius: Radius.full,
    backgroundColor: Palette.primary,
  },
});
