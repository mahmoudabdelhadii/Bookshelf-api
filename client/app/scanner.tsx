import React, { useEffect, useState } from 'react';
import {
  View,
  Text,
  StyleSheet,
  TouchableOpacity,
  StatusBar,
  Alert,
  TextInput,
  KeyboardAvoidingView,
  Platform,
  Clipboard,
  Animated,
  ScrollView,
} from 'react-native';
import Modal from 'react-native-modal';
import { CameraView, Camera, BarcodeScanningResult } from 'expo-camera';
import { Ionicons } from '@expo/vector-icons';
import Colors from '@/constants/Colors';
import * as Haptics from 'expo-haptics';
import { Audio } from 'expo-av';
import { useNavigation } from '@react-navigation/native';
import { NativeStackNavigationProp } from '@react-navigation/native-stack';

type RootStackParamList = {
  search: { barcode: string };
};

type NavigationProp = NativeStackNavigationProp<RootStackParamList>;

type BarcodeHistoryItem = {
  id: string;
  barcode: string;
  timestamp: Date;
};

export default function ScannerModal() {
  const navigation = useNavigation<NavigationProp>();
  const [visible, setVisible] = useState(false);
  const [hasPermission, setHasPermission] = useState<boolean | null>(null);
  const [scanned, setScanned] = useState(false);
  const [showManualEntry, setShowManualEntry] = useState(false);
  const [manualBarcode, setManualBarcode] = useState('');
  const [sound, setSound] = useState<Audio.Sound | null>(null);
  const [barcodeHistory, setBarcodeHistory] = useState<BarcodeHistoryItem[]>([]);
  const [showHistory, setShowHistory] = useState(false);
  const [scanAnimation] = useState(new Animated.Value(0));
  const [torchOn, setTorchOn] = useState(false);

  // Load success sound
  useEffect(() => {
    const loadSound = async () => {
      try {
        const { sound } = await Audio.Sound.createAsync(
          require('../../assets/sounds/success.mp3')
        );
        setSound(sound);
      } catch (error) {
        console.error('Error loading sound:', error);
      }
    };
    loadSound();

    return () => {
      if (sound) {
        sound.unloadAsync();
      }
    };
  }, []);

  // Start scanning animation
  useEffect(() => {
    if (visible && !scanned) {
      Animated.loop(
        Animated.sequence([
          Animated.timing(scanAnimation, {
            toValue: 1,
            duration: 2000,
            useNativeDriver: true,
          }),
          Animated.timing(scanAnimation, {
            toValue: 0,
            duration: 2000,
            useNativeDriver: true,
          }),
        ])
      ).start();
    }
  }, [visible, scanned]);

  // Ask for camera permissions
  useEffect(() => {
    (async () => {
      try {
        const { status } = await Camera.requestCameraPermissionsAsync();
        setHasPermission(status === 'granted');
      } catch (error) {
        console.error('Error requesting camera permission:', error);
        setHasPermission(false);
      }
    })();
  }, []);

  // Reset states when modal closes
  useEffect(() => {
    if (!visible) {
      setScanned(false);
      setShowManualEntry(false);
      setManualBarcode('');
      setShowHistory(false);
    }
  }, [visible]);

  const playSuccessFeedback = async () => {
    try {
      // Play haptic feedback
      await Haptics.notificationAsync(Haptics.NotificationFeedbackType.Success);

      // Play success sound
      if (sound) {
        await sound.replayAsync();
      }
    } catch (error) {
      console.error('Error playing feedback:', error);
    }
  };

  const copyToClipboard = async (barcode: string) => {
    await Clipboard.setString(barcode);
    Alert.alert('Success', 'Barcode copied to clipboard');
  };

  const addToHistory = (barcode: string) => {
    const newItem: BarcodeHistoryItem = {
      id: Date.now().toString(),
      barcode,
      timestamp: new Date(),
    };
    setBarcodeHistory(prev => [newItem, ...prev].slice(0, 10)); // Keep last 10 items
  };

  const handleBarCodeScanned = async ({ data }: BarcodeScanningResult) => {
    if (scanned) return; // Prevent re-scanning

    try {
      setScanned(true);
      await playSuccessFeedback();
      addToHistory(data);

      // Navigate to search with the barcode
      navigation.navigate('search', { barcode: data });

      setTimeout(() => {
        setVisible(false);
        setScanned(false); // reset state for next time
      }, 800);
    } catch (error) {
      console.error('Error handling barcode scan:', error);
      setScanned(false); // Reset scanned state on error
    }
  };

  const handleManualEntry = async () => {
    if (!manualBarcode.trim()) {
      Alert.alert('Error', 'Please enter a valid barcode');
      return;
    }

    try {
      setScanned(true);
      await playSuccessFeedback();
      addToHistory(manualBarcode.trim());

      // Navigate to search with the barcode
      navigation.navigate('search', { barcode: manualBarcode.trim() });

      setTimeout(() => {
        setVisible(false);
        setScanned(false);
        setManualBarcode('');
        setShowManualEntry(false);
      }, 800);
    } catch (error) {
      console.error('Error handling manual entry:', error);
      setScanned(false); // Reset scanned state on error
    }
  };

  if (hasPermission === null) {
    return null;
  }

  if (hasPermission === false) {
    return null;
  }

  return (
    <Modal
      isVisible={visible}
      style={styles.modal}
      animationIn="slideInUp"
      animationOut="slideOutDown"
      statusBarTranslucent>
      <KeyboardAvoidingView
        behavior={Platform.OS === 'ios' ? 'padding' : 'height'}
        style={styles.container}>
        <View style={styles.container}>
          {/* Header with Close and Torch Toggle */}
          <View style={styles.header}>
            <TouchableOpacity onPress={() => setVisible(false)}>
              <Ionicons name="close" size={30} color="white" />
            </TouchableOpacity>
            <Text style={styles.modeText}>Scan ISBN</Text>
            <View style={styles.headerRight}>
              <TouchableOpacity
                style={styles.historyButton}
                onPress={() => setShowHistory(!showHistory)}>
                <Ionicons name="time-outline" size={24} color="white" />
              </TouchableOpacity>
              <TouchableOpacity onPress={() => setTorchOn(!torchOn)}>
                <Ionicons
                  name={torchOn ? 'flashlight' : 'flashlight-outline'}
                  size={30}
                  color="white"
                />
              </TouchableOpacity>
            </View>
          </View>

          {!showManualEntry ? (
            <>
              {/* Camera */}
              <View style={styles.scannerContainer}>
                <CameraView
                  style={StyleSheet.absoluteFillObject}
                  facing="back"
                  flash={torchOn ? 'on' : 'off'}
                  onBarcodeScanned={scanned ? undefined : handleBarCodeScanned}
                  barcodeScannerSettings={{
                    barcodeTypes: ['ean13', 'ean8', 'upc_a', 'upc_e', 'qr'],
                  }}
                />
                <View style={styles.overlay}>
                  <View style={styles.scanArea}>
                    <Animated.View
                      style={[
                        styles.scanLine,
                        {
                          transform: [
                            {
                              translateY: scanAnimation.interpolate({
                                inputRange: [0, 1],
                                outputRange: [0, 250],
                              }),
                            },
                          ],
                        },
                      ]}
                    />
                  </View>
                </View>
              </View>

              {/* Manual Entry Button */}
              <TouchableOpacity
                style={styles.manualEntryButton}
                onPress={() => setShowManualEntry(true)}>
                <Ionicons name="keypad-outline" size={24} color="white" />
                <Text style={styles.manualEntryText}>Enter Barcode Manually</Text>
              </TouchableOpacity>

              {/* History Panel */}
              {showHistory && (
                <View style={styles.historyPanel}>
                  <Text style={styles.historyTitle}>Recent Scans</Text>
                  <ScrollView style={styles.historyList}>
                    {barcodeHistory.map(item => (
                      <View key={item.id} style={styles.historyItem}>
                        <Text style={styles.historyBarcode}>{item.barcode}</Text>
                        <Text style={styles.historyTime}>
                          {item.timestamp.toLocaleTimeString()}
                        </Text>
                        <TouchableOpacity
                          style={styles.copyButton}
                          onPress={() => copyToClipboard(item.barcode)}>
                          <Ionicons name="copy-outline" size={20} color="white" />
                        </TouchableOpacity>
                      </View>
                    ))}
                  </ScrollView>
                </View>
              )}
            </>
          ) : (
            <View style={styles.manualEntryContainer}>
              <Text style={styles.manualEntryTitle}>Enter Barcode</Text>
              <TextInput
                style={styles.input}
                value={manualBarcode}
                onChangeText={setManualBarcode}
                placeholder="Enter barcode number"
                placeholderTextColor="#666"
                keyboardType="number-pad"
                autoFocus
              />
              <View style={styles.manualEntryButtons}>
                <TouchableOpacity
                  style={[styles.button, styles.cancelButton]}
                  onPress={() => {
                    setShowManualEntry(false);
                    setManualBarcode('');
                  }}>
                  <Text style={styles.buttonText}>Cancel</Text>
                </TouchableOpacity>
                <TouchableOpacity
                  style={[styles.button, styles.submitButton]}
                  onPress={handleManualEntry}>
                  <Text style={styles.buttonText}>Submit</Text>
                </TouchableOpacity>
              </View>
            </View>
          )}
        </View>
      </KeyboardAvoidingView>
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
  headerRight: {
    flexDirection: 'row',
    alignItems: 'center',
  },
  historyButton: {
    marginRight: 15,
  },
  modeText: {
    color: 'white',
    fontWeight: 'bold',
    fontSize: 18,
  },
  scannerContainer: {
    flex: 1,
    position: 'relative',
  },
  overlay: {
    ...StyleSheet.absoluteFillObject,
    backgroundColor: 'rgba(0,0,0,0.5)',
    justifyContent: 'center',
    alignItems: 'center',
  },
  scanArea: {
    width: 250,
    height: 250,
    borderWidth: 2,
    borderColor: Colors.colors.primary,
    backgroundColor: 'transparent',
    overflow: 'hidden',
  },
  scanLine: {
    width: '100%',
    height: 2,
    backgroundColor: Colors.colors.primary,
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
  manualEntryButton: {
    position: 'absolute',
    bottom: 20,
    left: 20,
    right: 20,
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    backgroundColor: 'rgba(0,0,0,0.7)',
    padding: 15,
    borderRadius: 10,
  },
  manualEntryText: {
    color: 'white',
    marginLeft: 10,
    fontSize: 16,
  },
  manualEntryContainer: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
    padding: 20,
  },
  manualEntryTitle: {
    color: 'white',
    fontSize: 24,
    fontWeight: 'bold',
    marginBottom: 20,
  },
  input: {
    width: '100%',
    height: 50,
    backgroundColor: 'rgba(255,255,255,0.1)',
    borderRadius: 10,
    paddingHorizontal: 15,
    color: 'white',
    fontSize: 18,
    marginBottom: 20,
  },
  manualEntryButtons: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    width: '100%',
  },
  button: {
    flex: 1,
    padding: 15,
    borderRadius: 10,
    marginHorizontal: 5,
  },
  cancelButton: {
    backgroundColor: 'rgba(255,255,255,0.1)',
  },
  submitButton: {
    backgroundColor: Colors.colors.primary,
  },
  buttonText: {
    color: 'white',
    textAlign: 'center',
    fontWeight: 'bold',
    fontSize: 16,
  },
  historyPanel: {
    position: 'absolute',
    top: 60,
    right: 0,
    width: 250,
    backgroundColor: 'rgba(0,0,0,0.9)',
    borderRadius: 10,
    padding: 10,
    margin: 10,
  },
  historyTitle: {
    color: 'white',
    fontSize: 16,
    fontWeight: 'bold',
    marginBottom: 10,
  },
  historyList: {
    maxHeight: 200,
  },
  historyItem: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingVertical: 8,
    borderBottomWidth: 1,
    borderBottomColor: 'rgba(255,255,255,0.1)',
  },
  historyBarcode: {
    flex: 1,
    color: 'white',
    fontSize: 14,
  },
  historyTime: {
    color: 'rgba(255,255,255,0.5)',
    fontSize: 12,
    marginRight: 10,
  },
  copyButton: {
    padding: 5,
  },
}); 
