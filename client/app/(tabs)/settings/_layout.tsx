import { Drawer } from 'expo-router/drawer';
import { useColorScheme } from 'react-native';
import Colors from '../../../constants/Colors';
import { Ionicons } from '@expo/vector-icons';

export default function SettingsLayout() {
  const colorScheme = useColorScheme();

  return (
    <Drawer
      screenOptions={{
        headerStyle: {
          backgroundColor: Colors.colors.primary,
        },
        headerTintColor: Colors.colors['primary-content'],
        drawerStyle: {
          backgroundColor: Colors.colors.background,
        },
        drawerActiveTintColor: Colors.colors.primary,
        drawerInactiveTintColor: Colors.colors.copy,
        drawerPosition: 'right',
      }}>
      <Drawer.Screen
        name="index"
        options={{
          title: 'Settings',
          drawerIcon: ({ color, size }) => (
            <Ionicons name="settings-outline" size={size} color={color} />
          ),
        }}
      />
      <Drawer.Screen
        name="profile"
        options={{
          title: 'Profile',
          drawerIcon: ({ color, size }) => (
            <Ionicons name="person-outline" size={size} color={color} />
          ),
        }}
      />
      <Drawer.Screen
        name="about"
        options={{
          title: 'About',
          drawerIcon: ({ color, size }) => (
            <Ionicons name="information-circle-outline" size={size} color={color} />
          ),
        }}
      />
      <Drawer.Screen
        name="support"
        options={{
          title: 'Help & Support',
          drawerIcon: ({ color, size }) => (
            <Ionicons name="help-circle-outline" size={size} color={color} />
          ),
        }}
      />
    </Drawer>
  );
}
