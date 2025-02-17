import React from 'react';
import { View, Text, Button } from 'react-native';
import { useRouter } from 'expo-router';

export default function SettingsScreen() {
  const router = useRouter();

  return (
    <View style={{ flex: 1, justifyContent: 'center', alignItems: 'center' }}>
      <Text>Settings Drawer Screen</Text>
      <Button title="Close Drawer" onPress={() => router.back()} />
    </View>
  );
}