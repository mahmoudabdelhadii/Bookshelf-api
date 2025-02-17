import React, { useEffect, useState } from 'react';
import {
  View,
  Text,
  StyleSheet,
  TouchableOpacity,
  StatusBar,
} from 'react-native';
import Modal from 'react-native-modal';
import { CameraView, Camera, BarcodeScanningResult } from 'expo-camera';
import { Ionicons } from '@expo/vector-icons';
import Colors from '../constants/Colors';

type ScannerModalProps = {
  visible: boolean;
  onClose: () => void;
  torchOn: boolean;
  setTorchOn: (val: boolean) => void;
  mode: 'single' | 'batch';
  onBarcodeScanned: (data: string) => void;
};

export default function ScannerModal({
  visible,
  onClose,
  torchOn,
  setTorchOn,
  mode,
  onBarcodeScanned,
}: ScannerModalProps) {
  const [hasPermission, setHasPermission] = useState<boolean | null>(null);
  const [scanned, setScanned] = useState(false);

  // Ask for camera permissions
  useEffect(() => {
    (async () => {
      const { status } = await Camera.requestCameraPermissionsAsync();
      setHasPermission(status === 'granted');
    })();
  }, []);

  const handleBarCodeScanned = ({ data }: BarcodeScanningResult) => {
    if (scanned) return; // Prevent re-scanning

    setScanned(true);
    onBarcodeScanned(data);

    // If single mode, close after first scan
    if (mode === 'single') {
      setTimeout(() => {
        onClose();
        setScanned(false); // reset state for next time
      }, 800);
    } else {
      // if batch, do not auto-close
      // you can remove this setScanned(false) if you want to avoid re-scanning 
      // the same barcode. Or keep it to re-scan new barcodes:
      setTimeout(() => setScanned(false), 800);
    }
  };

  if (hasPermission === null) {
    return (
      <Modal isVisible={visible} style={styles.modal} statusBarTranslucent>
        <View style={styles.permissionContainer}>
          <Text style={styles.permissionText}>Requesting camera permission...</Text>
        </View>
      </Modal>
    );
  }

  if (hasPermission === false) {
    return (
      <Modal isVisible={visible} style={styles.modal} statusBarTranslucent>
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
      isVisible={visible}
      style={styles.modal}
      animationIn="slideInUp"
      animationOut="slideOutDown"
      statusBarTranslucent
    >
      <View style={styles.container}>
        {/* Header with Close and Torch Toggle */}
        <View style={styles.header}>
          <TouchableOpacity onPress={onClose}>
            <Ionicons name="close" size={30} color="white" />
          </TouchableOpacity>
          <Text style={styles.modeText}>
            {mode === 'single' ? 'Single ISBN Scan' : 'Batch ISBN Scan'}
          </Text>
          <TouchableOpacity onPress={() => setTorchOn(!torchOn)}>
            <Ionicons
              name={torchOn ? 'flashlight' : 'flashlight-outline'}
              size={30}
              color="white"
            />
          </TouchableOpacity>
        </View>

        {/* Camera */}
        <View style={styles.scannerContainer}>
          <CameraView
            style={StyleSheet.absoluteFillObject}
            facing="back"
            flash={torchOn ? 'on' : 'off'}
            onBarcodeScanned={scanned ? undefined : handleBarCodeScanned}
            barcodeScannerSettings={{
              // Adjust as needed (e.g., ['ean13', 'qr'] if you want more types)
              barcodeTypes: ['ean13'],
            }}
          />
        </View>
      </View>
    </Modal>
  );
}

const styles = StyleSheet.create({
  modal: {
    margin: 0, // full screen
  },
  container: {
    flex: 1,
    backgroundColor: 'black',
  },
  header: {
    height: 60,
    backgroundColor: 'black',
    paddingTop: StatusBar.currentHeight || 15,
    paddingHorizontal: 16,
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
  },
  modeText: {
    color: 'white',
    fontWeight: 'bold',
    fontSize: 18,
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