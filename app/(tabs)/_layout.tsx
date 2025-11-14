import React from 'react';
import { Tabs } from 'expo-router';
import { Clock, Compass } from 'lucide-react-native';
import { useFonts, Inter_600SemiBold } from '@expo-google-fonts/inter';

export default function TabLayout() {
  const [fontsLoaded] = useFonts({
    Inter_600SemiBold,
  });

  if (!fontsLoaded) {
    return null;
  }

  return (
    <Tabs
      screenOptions={{
        headerShown: false,
        tabBarActiveTintColor: '#fff',
        tabBarInactiveTintColor: 'rgba(255, 255, 255, 0.6)',
        tabBarStyle: {
          backgroundColor: '#1a5f4f',
          borderTopWidth: 1,
          borderTopColor: 'rgba(255, 255, 255, 0.1)',
          height: 65,
          paddingBottom: 10,
          paddingTop: 5,
        },
        tabBarLabelStyle: {
          fontFamily: 'Inter_600SemiBold',
          fontSize: 12,
        },
      }}
    >
      <Tabs.Screen
        name="index"
        options={{
          title: 'Vakitler',
          tabBarIcon: ({ color, focused }) => (
            <Clock color={color} size={focused ? 28 : 24} strokeWidth={focused ? 2.5 : 2} />
          ),
        }}
      />
      <Tabs.Screen
        name="kible"
        options={{
          title: 'Kıble',
          tabBarIcon: ({ color, focused }) => (
            <Compass color={color} size={focused ? 28 : 24} strokeWidth={focused ? 2.5 : 2} />
          ),
        }}
      />
    </Tabs>
  );
}
