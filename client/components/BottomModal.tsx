import React, { useRef, useEffect, useState } from 'react';
import { View, Text, Pressable, Animated } from 'react-native';
import Modal from 'react-native-modal';
import { Ionicons } from '@expo/vector-icons';
import Colors from '../constants/Colors';
import BarcodeScannerModal from '@/components/BarcodeScannerModal';

type BottomModalProps = {
  visible: boolean;
  onClose: () => void;
  onPress?: (action: string) => void;
};

export default function BottomModal({
  visible,
  onClose,
  onPress,
}: BottomModalProps) {
  const [scannerVisible, setScannerVisible] = useState(false);
  const [torchOn, setTorchOn] = useState(false);

  const handleBarcodeScanned = (data: any) => {
    console.log('Scanned data:', data);
    setScannerVisible(false);
    setTorchOn(false); // Reset torch state
  };

  // Animated values for each button (now four buttons)
  const buttonAnimations = [
    useRef(new Animated.Value(0)).current, // Bottom button
    useRef(new Animated.Value(0)).current, // 3rd button
    useRef(new Animated.Value(0)).current, // 2nd button
    useRef(new Animated.Value(0)).current, // Top button
  ];

  useEffect(() => {
    if (visible) {
      // Staggered animations from bottom to top
      Animated.stagger(100, [
        Animated.timing(buttonAnimations[0], {
          toValue: 1,
          duration: 300,
          useNativeDriver: true,
        }),
        Animated.timing(buttonAnimations[1], {
          toValue: 1,
          duration: 300,
          useNativeDriver: true,
        }),
        Animated.timing(buttonAnimations[2], {
          toValue: 1,
          duration: 300,
          useNativeDriver: true,
        }),
        Animated.timing(buttonAnimations[3], {
          toValue: 1,
          duration: 300,
          useNativeDriver: true,
        }),
      ]).start();
    } else {
      // Reset animations
      buttonAnimations.forEach(animation => animation.setValue(0));
    }
  }, [visible]);

  return (
    <>
      {/* Main Modal with Buttons */}
      <Modal
        isVisible={visible}
        onBackdropPress={onClose}
        onBackButtonPress={onClose}
        useNativeDriver={true}
        backdropOpacity={0.2}
        style={{ justifyContent: 'flex-end', margin: 0 }}
        animationIn="fadeIn"
        animationOut="fadeOut"
        animationInTiming={100}
        animationOutTiming={100}>
        <View
          style={{
            backgroundColor: 'transparent',
            alignItems: 'center',
            marginBottom: 110,
          }}>
          {/* Top Button - Scan Book ISBN */}
          <Animated.View
            style={{
              opacity: buttonAnimations[3],
              transform: [
                {
                  translateY: buttonAnimations[3].interpolate({
                    inputRange: [0, 1],
                    outputRange: [20, 0],
                  }),
                },
              ],
            }}>
            <Pressable
              onPress={() => {
                setScannerVisible(true); // Open the Barcode Scanner modal
                onClose(); // Close the bottom modal
              }}
              style={{
                flexDirection: 'row',
                alignItems: 'center',
                backgroundColor: Colors.colors.primary,
                borderRadius: 10,
                paddingVertical: 12,
                paddingHorizontal: 20,
                marginBottom: 8,
                width: 220,
              }}>
              <Ionicons
                name="barcode-outline"
                size={24}
                color={Colors.colors['primary-content']}
                style={{ marginRight: 10 }}
              />
              <Text
                style={{
                  color: Colors.colors['primary-content'],
                  fontWeight: 'bold',
                }}>
                Scan Book ISBN
              </Text>
            </Pressable>
          </Animated.View>

          {/* 2nd Button - Batch Scan Books */}
          <Animated.View
            style={{
              opacity: buttonAnimations[2],
              transform: [
                {
                  translateY: buttonAnimations[2].interpolate({
                    inputRange: [0, 1],
                    outputRange: [20, 0],
                  }),
                },
              ],
            }}>
            <Pressable
              onPress={() => {
                if (onPress) onPress('batchScan');
                onClose();
              }}
              style={{
                flexDirection: 'row',
                alignItems: 'center',
                backgroundColor: Colors.colors.primary,
                borderRadius: 10,
                paddingVertical: 12,
                paddingHorizontal: 20,
                marginBottom: 8,
                width: 220,
              }}>
              <Ionicons
                name="scan-outline"
                size={24}
                color={Colors.colors['primary-content']}
                style={{ marginRight: 10 }}
              />
              <Text
                style={{
                  color: Colors.colors['primary-content'],
                  fontWeight: 'bold',
                }}>
                Batch Scan Books
              </Text>
            </Pressable>
          </Animated.View>

          {/* 3rd Button - Search New Books */}
          <Animated.View
            style={{
              opacity: buttonAnimations[1],
              transform: [
                {
                  translateY: buttonAnimations[1].interpolate({
                    inputRange: [0, 1],
                    outputRange: [20, 0],
                  }),
                },
              ],
            }}>
            <Pressable
              onPress={() => {
                if (onPress) onPress('searchBooks');
                onClose();
              }}
              style={{
                flexDirection: 'row',
                alignItems: 'center',
                backgroundColor: Colors.colors.primary,
                borderRadius: 10,
                paddingVertical: 12,
                paddingHorizontal: 20,
                marginBottom: 8,
                width: 220,
              }}>
              <Ionicons
                name="search-outline"
                size={24}
                color={Colors.colors['primary-content']}
                style={{ marginRight: 10 }}
              />
              <Text
                style={{
                  color: Colors.colors['primary-content'],
                  fontWeight: 'bold',
                }}>
                Search New Books
              </Text>
            </Pressable>
          </Animated.View>

          {/* Bottom Button - Add New Book Manually */}
          <Animated.View
            style={{
              opacity: buttonAnimations[0],
              transform: [
                {
                  translateY: buttonAnimations[0].interpolate({
                    inputRange: [0, 1],
                    outputRange: [20, 0],
                  }),
                },
              ],
            }}>
            <Pressable
              onPress={() => {
                if (onPress) onPress('addBookManually');
                onClose();
              }}
              style={{
                flexDirection: 'row',
                alignItems: 'center',
                backgroundColor: Colors.colors.primary,
                borderRadius: 10,
                paddingVertical: 12,
                paddingHorizontal: 20,
                width: 220,
              }}>
              <Ionicons
                name="create-outline"
                size={24}
                color={Colors.colors['primary-content']}
                style={{ marginRight: 10 }}
              />
              <Text
                style={{
                  color: Colors.colors['primary-content'],
                  fontWeight: 'bold',
                }}>
                Add Book Manually
              </Text>
            </Pressable>
          </Animated.View>
        </View>
      </Modal>

      {/* Barcode Scanner Modal */}
      <BarcodeScannerModal
        visible={scannerVisible}
        onClose={() => {
          setScannerVisible(false);
          setTorchOn(false);
        }}
        torchOn={torchOn}
        setTorchOn={setTorchOn}
        onBarcodeScanned={handleBarcodeScanned}
      />
    </>
  );
}
