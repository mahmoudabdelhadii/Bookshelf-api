import React, { useEffect, useState } from 'react';
import { View, Text,Platform, Modal, TouchableOpacity, StyleSheet, StatusBar } from 'react-native';
import { CameraView, Camera, BarcodeScanningResult } from 'expo-camera';
import { Ionicons } from '@expo/vector-icons';
import Colors from '../constants/Colors';

type BarcodeScannerModalProps = {
  visible: boolean;
  onClose: () => void;
  torchOn: boolean;
  setTorchOn: (value: boolean) => void;
  onBarcodeScanned: (data: string) => void;
};

export default function barcodeScannerModal({
  visible,
  onClose,
  torchOn,
  setTorchOn,
  onBarcodeScanned,
}: BarcodeScannerModalProps) {
  const [hasPermission, setHasPermission] = useState<boolean | null>(null);
  const [scanned, setScanned] = useState(false);

  useEffect(() => {
    // Request camera permission
    (async () => {
      const { status } = await Camera.requestCameraPermissionsAsync();
      setHasPermission(status === 'granted');
    })();
  }, []);

  const handleBarCodeScanned = ({ data }: BarcodeScanningResult) => {
    setScanned(true);
    onBarcodeScanned(data);
  };

  if (hasPermission === null) {
    return (
      <Modal visible={visible} transparent>
        <View style={styles.permissionContainer}>
          <Text style={styles.permissionText}>
            Requesting camera permission...
          </Text>
        </View>
      </Modal>
    );
  }

  if (hasPermission === false) {
    return (
      <Modal visible={visible} transparent>
        <View style={styles.permissionContainer}>
          <Text style={styles.permissionText}>No access to camera.</Text>
          <TouchableOpacity onPress={onClose} style={styles.closeButton}>
            <Text style={styles.closeButtonText}>Close</Text>
          </TouchableOpacity>
        </View>
      </Modal>
    );
  }

  return (
    <Modal
      visible={visible}
      animationType="slide"
      onRequestClose={onClose}
      statusBarTranslucent>
      <View style={styles.container}>
        {/* Header */}
        <View style={styles.header}>
          <TouchableOpacity onPress={onClose}>
            <Ionicons name="close" size={30} color="white" />
          </TouchableOpacity>
          <TouchableOpacity onPress={() => setTorchOn(!torchOn)}>
            <Ionicons
              name={torchOn ? 'flashlight' : 'flashlight-outline'}
              size={30}
              color="white"
            />
          </TouchableOpacity>
        </View>

        {/* Camera with Barcode Scanner */}
        <View style={styles.scannerContainer}>
          <CameraView
            style={StyleSheet.absoluteFillObject}
            facing="back"
            flash={torchOn ? 'on' : 'off'}
            onBarcodeScanned={scanned ? undefined : handleBarCodeScanned}
            barcodeScannerSettings={{
              barcodeTypes: ['ean13'],
            }}
          />
        </View>
      </View>
    </Modal>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: 'black',
  },
  header: {
    height: 60,
    backgroundColor: 'black',
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    paddingHorizontal: 16,
    paddingTop: 20, // For status bar height
  },
  scannerContainer: {
    flex: 1,
  },
  permissionContainer: {
    flex: 1,
    backgroundColor: 'black',
    justifyContent: 'center',
    alignItems: 'center',
  },
  permissionText: {
    color: 'white',
    fontSize: 16,
    marginBottom: 20,
  },
  closeButton: {
    backgroundColor: Colors.colors.primary,
    paddingVertical: 10,
    paddingHorizontal: 20,
    borderRadius: 8,
  },
  closeButtonText: {
    color: Colors.colors['primary-content'],
    fontWeight: 'bold',
  },
});
