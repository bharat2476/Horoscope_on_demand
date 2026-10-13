import { MaterialCommunityIcons } from '@expo/vector-icons';
import { router, Tabs } from 'expo-router';
import { type ComponentProps } from 'react';
import { Pressable, type ColorValue } from 'react-native';

import { useTheme } from '@/hooks/use-theme';
import { useApp } from '@/providers/app-provider';

type IconName = ComponentProps<typeof MaterialCommunityIcons>['name'];

function tabIcon(name: IconName) {
  function Icon({ color, size }: { color: ColorValue; size: number }) {
    return <MaterialCommunityIcons name={name} color={color} size={size} />;
  }
  return Icon;
}

export default function TabLayout() {
  const { t } = useApp();
  const theme = useTheme();

  return (
    <Tabs
      screenOptions={{
        headerStyle: { backgroundColor: theme.background },
        headerTintColor: theme.text,
        headerShadowVisible: false,
        tabBarStyle: { backgroundColor: theme.background, borderTopColor: theme.border },
        tabBarActiveTintColor: theme.tint,
        tabBarInactiveTintColor: theme.textSecondary,
        sceneStyle: { backgroundColor: theme.background },
      }}
    >
      <Tabs.Screen
        name="index"
        options={{
          title: t('tabs.home'),
          tabBarIcon: tabIcon('home-outline'),
          headerRight: () => (
            <Pressable
              accessibilityRole="button"
              accessibilityLabel={t('tabs.settings')}
              onPress={() => router.push('/settings')}
              style={{ marginRight: 16 }}
            >
              <MaterialCommunityIcons name="cog-outline" size={24} color={theme.text} />
            </Pressable>
          ),
        }}
      />
      <Tabs.Screen
        name="horoscope"
        options={{
          title: t('tabs.horoscope'),
          tabBarIcon: tabIcon('star-outline'),
        }}
      />
      <Tabs.Screen
        name="panchang"
        options={{
          title: t('tabs.panchang'),
          tabBarIcon: tabIcon('calendar-month-outline'),
        }}
      />
      <Tabs.Screen
        name="rituals"
        options={{
          title: t('tabs.rituals'),
          tabBarIcon: tabIcon('book-open-outline'),
        }}
      />
      <Tabs.Screen
        name="temples"
        options={{
          title: t('tabs.temples'),
          tabBarIcon: tabIcon('map-marker-outline'),
        }}
      />
    </Tabs>
  );
}
