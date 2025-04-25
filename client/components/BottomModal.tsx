import React, { useState } from 'react';
import { View, Text, StyleSheet, TouchableOpacity, Modal, Animated } from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { useColorScheme } from 'nativewind';
import Colors from '../constants/Colors';
import { DrawerActions, useNavigation } from '@react-navigation/native';
import { NativeStackNavigationProp } from '@react-navigation/native-stack';
import ScannerModal from './ScannerModal';

type RootStackParamList = {
  search: undefined;
};

type NavigationProp = NativeStackNavigationProp<RootStackParamList>;

interface BottomModalProps {
  visible: boolean;
  onClose: () => void;
}

export default function BottomModal({ visible, onClose }: BottomModalProps) {
  const { colorScheme } = useColorScheme();
  const navigation = useNavigation<NavigationProp>();
  const [showScanner, setShowScanner] = useState(false);

  const handleSingleScan = () => {
    setShowScanner(true);
    onClose();
  };

  const handleBatchScan = () => {
    // TODO: Implement batch scan
    onClose();
  };

  const handleSearchBooks = () => {
    navigation.navigate('search');
    onClose();
  };

  return (
    <>
      <Modal
        visible={visible}
        transparent
        animationType="slide"
        onRequestClose={onClose}>
        <View style={styles.modalContainer}>
          <View style={styles.modalContent}>
            <View style={styles.header}>
              <Text style={styles.title}>Add Books</Text>
              <TouchableOpacity onPress={onClose} style={styles.closeButton}>
                <Ionicons name="close" size={24} color="white" />
              </TouchableOpacity>
            </View>

            <View style={styles.buttonsContainer}>
              <TouchableOpacity
                style={styles.button}
                onPress={handleSingleScan}>
                <View style={styles.buttonIcon}>
                  <Ionicons name="barcode" size={24} color="white" />
                </View>
                <Text style={styles.buttonText}>Scan Book ISBN</Text>
              </TouchableOpacity>

              <TouchableOpacity
                style={styles.button}
                onPress={handleBatchScan}>
                <View style={styles.buttonIcon}>
                  <Ionicons name="scan" size={24} color="white" />
                </View>
                <Text style={styles.buttonText}>Batch Scan Books</Text>
              </TouchableOpacity>

              <TouchableOpacity
                style={styles.button}
                onPress={handleSearchBooks}>
                <View style={styles.buttonIcon}>
                  <Ionicons name="search" size={24} color="white" />
                </View>
                <Text style={styles.buttonText}>Search New Books</Text>
              </TouchableOpacity>
            </View>
          </View>
        </View>
      </Modal>

      <ScannerModal
        visible={showScanner}
        onClose={() => setShowScanner(false)}
      />
    </>
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
    padding: 20,
  },
  header: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: 20,
  },
  title: {
    color: 'white',
    fontSize: 20,
    fontWeight: 'bold',
  },
  closeButton: {
    padding: 10,
  },
  buttonsContainer: {
    gap: 15,
  },
  button: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: Colors.colors.primary,
    padding: 15,
    borderRadius: 10,
  },
  buttonIcon: {
    marginRight: 10,
  },
  buttonText: {
    color: 'white',
    fontSize: 16,
    fontWeight: 'bold',
  },
});
