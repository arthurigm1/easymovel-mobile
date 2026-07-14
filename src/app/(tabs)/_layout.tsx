import { Platform } from 'react-native';
import { Tabs } from 'expo-router';
import { BlurView } from 'expo-blur';
import { Ionicons } from '@expo/vector-icons';
import { Palette } from '@/constants/theme';

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
  return (
    <Tabs
      screenOptions={{
        headerShown: false,
        tabBarActiveTintColor: Palette.primary,
        tabBarInactiveTintColor: Palette.textTertiary,
        tabBarStyle: {
          backgroundColor: Platform.OS === 'android' ? Palette.surface : 'transparent',
          borderTopWidth: 1,
          borderTopColor: Palette.border,
          paddingTop: 6,
          paddingBottom: 6,
          height: 64,
          position: Platform.OS === 'ios' ? 'absolute' : undefined,
        },
        tabBarBackground: Platform.OS === 'ios'
          ? () => <BlurView intensity={80} tint="light" style={{ flex: 1 }} />
          : undefined,
        tabBarLabelStyle: {
          fontSize: 10,
          fontWeight: '700',
          marginTop: 2,
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
              <Ionicons
                name={focused ? tab.iconActive : tab.icon}
                size={22}
                color={color}
              />
            ),
          }}
        />
      ))}
    </Tabs>
  );
}
