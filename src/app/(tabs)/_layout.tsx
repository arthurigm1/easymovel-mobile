import { Tabs } from 'expo-router';
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
  { name: 'empreendimentos', title: 'Imóveis',     icon: 'grid-outline',     iconActive: 'grid' },
  { name: 'construtoras',    title: 'Construtoras',icon: 'business-outline', iconActive: 'business' },
  { name: 'busca',           title: 'Buscar',      icon: 'search-outline',   iconActive: 'search' },
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
          backgroundColor: Palette.surface,
          borderTopWidth: 1,
          borderTopColor: Palette.border,
          paddingTop: 6,
          paddingBottom: 6,
          height: 64,
        },
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
