import React, { useState } from "react";
import { View, Modal, Pressable, Text } from "react-native";
import Ionicons from "@expo/vector-icons/Ionicons";
import { useColorScheme } from "nativewind";
import Colors from "../constants/Colors";

type FloatingActionButtonProps = {
  onPress?: () => void; // Optional prop for external actions
};

export default function FloatingActionButton({ onPress }: FloatingActionButtonProps) {
  const [modalVisible, setModalVisible] = useState(false);
  const { colorScheme } = useColorScheme();

  // Handle button press
  const handlePress = () => {
    setModalVisible(true);
    if (onPress) onPress(); // Call external onPress if provided
  };

  return (
    <View className="items-center">
      {/* Floating Button */}
      <Pressable
        onPress={handlePress}
        className="absolute -top-7 w-16 h-16 rounded-full bg-primary justify-center items-center shadow-lg"
        style={{
          elevation: 10, // Add elevation for Android shadow
        }}
      >
        <Ionicons name="add" size={32} color={Colors.colors.foreground} />
      </Pressable>

      {/* Modal Component */}
      <Modal
        visible={modalVisible}
        transparent={true}
        animationType="slide"
        onRequestClose={() => setModalVisible(false)}
      >
        <Pressable
          className="flex-1 bg-black bg-opacity-30 justify-end"
          onPress={() => setModalVisible(false)}
        >
          <View className="bg-white p-6 rounded-t-3xl">
            {/* Modal Content */}
            <Text className="text-lg font-bold text-gray-800 mb-4">
              Add New Item
            </Text>
            <Text className="text-gray-600 mb-4">
              This is where you can add your items.
            </Text>

            {/* Modal Close Button */}
            <Pressable
              onPress={() => setModalVisible(false)}
              className="bg-primary py-3 px-4 rounded-lg items-center"
            >
              <Text className="text-primary-content text-base font-semibold">
                Close
              </Text>
            </Pressable>
          </View>
        </Pressable>
      </Modal>
    </View>
  );
}
