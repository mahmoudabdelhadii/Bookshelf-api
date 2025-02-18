import React, { useRef, useEffect, useState } from 'react';
import { View, Text, Pressable, Animated } from 'react-native';
import Modal from 'react-native-modal';
import { Ionicons } from '@expo/vector-icons';
import Colors from '../constants/Colors';
import ScannerModal from './barcodeScannerModal';

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
  const [scannerMode, setScannerMode] = useState<'single' | 'batch'>('single');
  const [torchOn, setTorchOn] = useState(false);

  const buttonAnimations = [
    useRef(new Animated.Value(0)).current, // Bottom button
    useRef(new Animated.Value(0)).current, // 3rd button
    useRef(new Animated.Value(0)).current, // 2nd button
    useRef(new Animated.Value(0)).current, // Top button
  ];

  // Handle single or batch mode scanning
  const openScanner = (mode: 'single' | 'batch') => {
    setScannerMode(mode);
    setScannerVisible(true);
    // close the bottom modal
    closeBottomModal();
  };

  // Animate open/close
  useEffect(() => {
    if (visible) {
      Animated.stagger(
        100,
        buttonAnimations.map(anim =>
          Animated.timing(anim, {
            toValue: 1,
            duration: 300,
            useNativeDriver: true,
          }),
        ),
      ).start();
    } else {
      Animated.stagger(
        100,
        buttonAnimations.map(anim =>
          Animated.timing(anim, {
            toValue: 0,
            duration: 300,
            useNativeDriver: true,
          }),
        ),
      ).start(() => {
        // Once animation finishes, call onClose
        onClose();
      });
    }
  }, [visible]);

  // Called when user taps outside the modal or hits back
  const closeBottomModal = () => {
    // This triggers the reverse animation in the useEffect above
    // which eventually calls `onClose()` after animation
    // so you do not call onClose() directly here
    if (visible) {
      // Force re-render to run the closing animation
      Animated.stagger(
        100,
        buttonAnimations.map(anim =>
          Animated.timing(anim, {
            toValue: 0,
            duration: 300,
            useNativeDriver: true,
          }),
        ),
      ).start(() => {
        onClose();
      });
    }
  };

  // When a barcode is scanned
  const handleBarcodeScanned = (data: string) => {
    console.log('Scanned data:', data);
    setTorchOn(false); // reset torch
    setScannerVisible(false);
  };

  return (
    <>
      {/* Bottom Modal with Buttons */}
      <Modal
        isVisible={visible}
        useNativeDriver
        backdropOpacity={0.2}
        style={{ justifyContent: 'flex-end', margin: 0 }}
        animationIn="fadeIn"
        animationOut="fadeOut"
        animationInTiming={150}
        animationOutTiming={150}
        onBackdropPress={closeBottomModal}
        onBackButtonPress={closeBottomModal}>
        <View
          style={{
            backgroundColor: 'transparent',
            alignItems: 'center',
            marginBottom: 110,
          }}>
          {/* Top Button - Single Scan */}
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
              onPress={() => openScanner('single')}
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

          {/* 2nd Button - Batch Scan */}
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
                openScanner('batch');
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
                closeBottomModal();
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

          {/* Bottom Button - Add Book Manually */}
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
                closeBottomModal();
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

      {/* Full-Screen Scanner Modal */}
      <ScannerModal
        visible={scannerVisible}
        onClose={() => {
          setScannerVisible(false);
          setTorchOn(false); // reset torch
        }}
        torchOn={torchOn}
        setTorchOn={setTorchOn}
        mode={scannerMode}
        onBarcodeScanned={handleBarcodeScanned}
      />
    </>
  );
}
