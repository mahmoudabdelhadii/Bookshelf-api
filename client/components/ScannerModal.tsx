import React, { useState, useEffect, useRef } from 'react';
import { View, Text, StyleSheet, TouchableOpacity, Modal, Animated, TextInput } from 'react-native';
import { Camera, CameraView } from 'expo-camera';
import { Ionicons } from '@expo/vector-icons';
import * as Haptics from 'expo-haptics';
import { Audio } from 'expo-av';
import { useNavigation } from '@react-navigation/native';
import { DrawerActions } from '@react-navigation/native';
import Colors from '../constants/Colors';
import { NativeStackNavigationProp } from '@react-navigation/native-stack';

type RootStackParamList = {
  search: { barcode: string };
};

type NavigationProp = NativeStackNavigationProp<RootStackParamList>;

interface ScannerModalProps {
  visible: boolean;
  onClose: () => void;
}

export default function ScannerModal({ visible, onClose }: ScannerModalProps) {
  const [hasPermission, setHasPermission] = useState<boolean | null>(null);
  const [scanned, setScanned] = useState(false);
  const [torchOn, setTorchOn] = useState(false);
  const [showManualEntry, setShowManualEntry] = useState(false);
  const [manualBarcode, setManualBarcode] = useState('');
  const [sound, setSound] = useState<Audio.Sound>();
  const navigation = useNavigation<NavigationProp>();
  const scanLineAnim = new Animated.Value(0);
  const cameraRef = useRef<CameraView>(null);

  useEffect(() => {
    const getCameraPermissions = async () => {
      const { status } = await Camera.requestCameraPermissionsAsync();
      setHasPermission(status === 'granted');
    };

    getCameraPermissions();
  }, []);

  useEffect(() => {
    if (visible) {
      setScanned(false);
      startScanAnimation();
    }
  }, [visible]);

  const startScanAnimation = () => {
    scanLineAnim.setValue(0);
    Animated.loop(
      Animated.timing(scanLineAnim, {
        toValue: 1,
        duration: 2000,
        useNativeDriver: true,
      })
    ).start();
  };

  const handleBarCodeScanned = async ({ data }: { data: string }) => {
    if (!scanned) {
      setScanned(true);
      try {
        await Haptics.notificationAsync(Haptics.NotificationFeedbackType.Success);
        navigation.navigate('search', { barcode: data });
        onClose();
      } catch (error) {
        console.error('Error handling barcode scan:', error);
      }
    }
  };

  const handleManualEntry = () => {
    if (manualBarcode.trim()) {
      navigation.navigate('search', { barcode: manualBarcode.trim() });
      onClose();
    }
  };

  if (hasPermission === null) {
    return (
      <Modal visible={visible} transparent animationType="slide">
        <View style={styles.modalContainer}>
          <View style={styles.modalContent}>
            <Text>Requesting camera permission...</Text>
          </View>
        </View>
      </Modal>
    );
  }

  if (hasPermission === false) {
    return (
      <Modal visible={visible} transparent animationType="slide">
        <View style={styles.modalContainer}>
          <View style={styles.modalContent}>
            <Text>No access to camera</Text>
            <TouchableOpacity style={styles.button} onPress={onClose}>
              <Text style={styles.buttonText}>Close</Text>
            </TouchableOpacity>
          </View>
        </View>
      </Modal>
    );
  }

  return (
    <Modal visible={visible} transparent animationType="slide">
      <View style={styles.modalContainer}>
        <View style={styles.modalContent}>
          {!showManualEntry ? (
            <>
              <View style={styles.header}>
                <TouchableOpacity onPress={onClose} style={styles.closeButton}>
                  <Ionicons name="close" size={24} color="white" />
                </TouchableOpacity>
                <TouchableOpacity
                  onPress={() => setTorchOn(!torchOn)}
                  style={styles.torchButton}>
                  <Ionicons
                    name={torchOn ? 'flash' : 'flash-outline'}
                    size={24}
                    color="white"
                  />
                </TouchableOpacity>
                <TouchableOpacity
                  onPress={() => setShowManualEntry(true)}
                  style={styles.manualButton}>
                  <Ionicons name="keypad-outline" size={24} color="white" />
                </TouchableOpacity>
              </View>

              <View style={styles.scannerContainer}>
                <CameraView
                  ref={cameraRef}
                  style={styles.scanner}
                  barcodeScannerSettings={{
                    barcodeTypes: ['ean13', 'ean8', 'upc_a', 'upc_e', 'code39', 'code93', 'code128', 'codabar', 'itf14', 'datamatrix', 'qr'],
                  }}
                  onBarcodeScanned={scanned ? undefined : handleBarCodeScanned}
                  enableTorch={torchOn}
                />
                <View style={styles.overlay}>
                  <View style={styles.scanArea}>
                    <Animated.View
                      style={[
                        styles.scanLine,
                        {
                          transform: [
                            {
                              translateY: scanLineAnim.interpolate({
                                inputRange: [0, 1],
                                outputRange: [0, 200],
                              }),
                            },
                          ],
                        },
                      ]}
                    />
                  </View>
                </View>
              </View>
            </>
          ) : (
            <View style={styles.manualEntryContainer}>
              <View style={styles.header}>
                <TouchableOpacity
                  onPress={() => setShowManualEntry(false)}
                  style={styles.closeButton}>
                  <Ionicons name="arrow-back" size={24} color="white" />
                </TouchableOpacity>
                <Text style={styles.manualEntryTitle}>Enter Barcode</Text>
              </View>
              <View style={styles.inputContainer}>
                <TextInput
                  style={styles.input}
                  value={manualBarcode}
                  onChangeText={setManualBarcode}
                  placeholder="Enter ISBN or barcode"
                  placeholderTextColor="#666"
                  keyboardType="numeric"
                  autoFocus
                />
                <TouchableOpacity
                  style={styles.submitButton}
                  onPress={handleManualEntry}>
                  <Text style={styles.submitButtonText}>Submit</Text>
                </TouchableOpacity>
              </View>
            </View>
          )}
        </View>
      </View>
    </Modal>
  );
}

const styles = StyleSheet.create({
  modalContainer: {
    flex: 1,
    backgroundColor: 'rgba(0, 0, 0, 0.5)',
    justifyContent: 'flex-end',
  },
  modalContent: {
    backgroundColor: '#000',
    borderTopLeftRadius: 20,
    borderTopRightRadius: 20,
    height: '80%',
    padding: 20,
  },
  header: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: 20,
  },
  closeButton: {
    padding: 10,
  },
  torchButton: {
    padding: 10,
  },
  manualButton: {
    padding: 10,
  },
  scannerContainer: {
    flex: 1,
    overflow: 'hidden',
    borderRadius: 20,
  },
  scanner: {
    ...StyleSheet.absoluteFillObject,
  },
  overlay: {
    ...StyleSheet.absoluteFillObject,
    backgroundColor: 'rgba(0,0,0,0.5)',
  },
  scanArea: {
    width: 250,
    height: 250,
    alignSelf: 'center',
    marginTop: '20%',
    borderWidth: 2,
    borderColor: '#fff',
    position: 'relative',
  },
  scanLine: {
    width: '100%',
    height: 2,
    backgroundColor: '#fff',
    position: 'absolute',
  },
  manualEntryContainer: {
    flex: 1,
  },
  manualEntryTitle: {
    color: 'white',
    fontSize: 18,
    fontWeight: 'bold',
  },
  inputContainer: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
  },
  input: {
    width: '80%',
    height: 50,
    backgroundColor: '#333',
    borderRadius: 10,
    paddingHorizontal: 15,
    color: 'white',
    fontSize: 16,
    marginBottom: 20,
  },
  submitButton: {
    backgroundColor: Colors.colors.primary,
    paddingHorizontal: 30,
    paddingVertical: 15,
    borderRadius: 10,
  },
  submitButtonText: {
    color: 'white',
    fontSize: 16,
    fontWeight: 'bold',
  },
  button: {
    backgroundColor: Colors.colors.primary,
    padding: 15,
    borderRadius: 10,
    marginTop: 20,
  },
  buttonText: {
    color: 'white',
    fontSize: 16,
    fontWeight: 'bold',
  },
}); 