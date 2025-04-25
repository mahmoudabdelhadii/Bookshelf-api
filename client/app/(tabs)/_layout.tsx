import React, { useState } from 'react';
import { Tabs } from 'expo-router';
import { View, Pressable, GestureResponderEvent } from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { useColorScheme } from 'nativewind';
import * as Haptics from 'expo-haptics';
import Colors from '../../constants/Colors';
import { TabBarIcon } from '@/components/navigation/TabBarIcon';
import BottomModal from '@/components/BottomModal';
import { DrawerActions, useNavigation } from '@react-navigation/native';

export default function TabLayout() {
  const { colorScheme } = useColorScheme();
  const navigation = useNavigation();

  const handleHapticFeedback = () => {
    Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Medium);
  };

  const [modalVisible, setModalVisible] = useState(false);

  const handleAddBook = () => {
    console.log('Add Book clicked');
  };

  const handleAddMultipleBooks = () => {
    console.log('Add Multiple Books clicked');
  };

  const handleAddBookManually = () => {
    console.log('Add Book Manually clicked');
  };
  const closeModal = () => {
    setModalVisible(false);
  };
  return (
    <>
      <Tabs
        screenOptions={{
          headerShown: false,
          tabBarShowLabel: false,
          tabBarActiveTintColor: Colors.colors['primary'],
          tabBarInactiveTintColor: colorScheme === 'light' ? Colors.colors['foreground'] : Colors.colors['copy'],
          tabBarStyle: {
            position: 'absolute',
            bottom: 25,
            marginRight: 15,
            marginLeft: 15,
            paddingBottom: 0,
            elevation: 10,
            borderRadius: 15,
            height: 50,
            backgroundColor: colorScheme === 'light' ? Colors.colors['copy'] : Colors.colors['foreground'],
            borderTopWidth: 0,
            borderWidth: 2,
            borderColor: Colors.colors.border,
          },
        }}>
        <Tabs.Screen
          name="index"
          options={{
            title: 'Books',
            tabBarIcon: ({ color, size }) => (
              <TabBarIcon name="library-outline" color={color} size={size} />
            ),
            tabBarButton: props => (
              <Pressable
                {...props}
                onPress={(e: GestureResponderEvent) => {
                  handleHapticFeedback();
                  props.onPress?.(e);
                }}
              />
            ),
          }}
        />

        <Tabs.Screen
          name="compass"
          options={{
            title: 'Compass',
            tabBarIcon: ({ color, size }) => (
              <TabBarIcon name="compass" color={color} size={size} />
            ),
            tabBarButton: props => (
              <Pressable
                {...props}
                onPress={(e: GestureResponderEvent) => {
                  handleHapticFeedback();
                  props.onPress?.(e);
                }}
              />
            ),
          }}
        />

        <Tabs.Screen
          name="add"
          options={{
            tabBarLabel: 'add',
            tabBarIcon: () => (
              <View
                style={{
                  top: -30,
                  width: 50,
                  height: 50,
                  borderRadius: 35,
                  backgroundColor: Colors.colors['primary'],
                  justifyContent: 'center',
                  alignItems: 'center',
                  elevation: 10,
                }}>
                <Ionicons
                  name="add"
                  color={Colors.colors.foreground}
                  size={40}
                />
              </View>),
            tabBarButton: props => (
              <Pressable
                {...props}
                onPress={(e: GestureResponderEvent) => {
                  e.preventDefault();
                  setModalVisible(true);
                  handleHapticFeedback();
                }}
              />
            ),
          }}
        />

        <Tabs.Screen
          name="other"
          options={{
            title: 'Other',
            tabBarIcon: ({ color, size }) => (
              <TabBarIcon name="star" color={color} size={size} />
            ),
            tabBarButton: props => (
              <Pressable
                {...props}
                onPress={(e: GestureResponderEvent) => {
                  handleHapticFeedback();
                  props.onPress?.(e);
                }}
              />
            ),
          }}
        />

        <Tabs.Screen
          name="settings"
          options={{
            title: 'Settings',
            tabBarIcon: ({ color, size }) => (
              <TabBarIcon name="menu-outline" color={color} size={size} />
            ),
            tabBarButton: props => (
              <Pressable
                {...props}
                onPress={(e: GestureResponderEvent) => {
                  e.preventDefault();
                  handleHapticFeedback();
                  navigation.dispatch(DrawerActions.toggleDrawer());
                  props.onPress?.(e);
                }}
              />
            ),
          }}
        />
      </Tabs>

      <BottomModal
        visible={modalVisible}
        onClose={closeModal}
      />
    </>
  );
}
