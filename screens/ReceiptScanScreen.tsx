import React, { useState, useEffect, useRef, useCallback } from 'react';
import { View, StyleSheet, Text, TouchableOpacity, ActivityIndicator, Alert, ScrollView, Platform } from 'react-native';
import { Camera as ExpoCamera } from 'expo-camera';
import { Ionicons } from '@expo/vector-icons';
import { colors } from '../theme/colors';
import { StackNavigationProp } from '@react-navigation/stack';
import * as FileSystem from 'expo-file-system';
import { scanReceipt, mockScanReceipt, ReceiptData } from '../services/receiptScanner';
import { addToPantry } from '../lib/pantry';

type RootStackParamList = {
  Home: undefined;
  ReceiptScanner: undefined;
  // Add other screens as needed
};

type ReceiptScanScreenNavigationProp = StackNavigationProp<RootStackParamList, 'ReceiptScanner'>;

interface ReceiptScanScreenProps {
  navigation: ReceiptScanScreenNavigationProp;
}

// Using any type for camera ref to avoid TypeScript issues
const Camera = ExpoCamera as any;

export default function ReceiptScanScreen({ navigation }: ReceiptScanScreenProps) {
  const [hasPermission, setHasPermission] = useState<boolean | null>(null);
  const [isScanning, setIsScanning] = useState(false);
  const [receiptData, setReceiptData] = useState<ReceiptData | null>(null);
  const [error, setError] = useState<string | null>(null);
  const cameraRef = useRef<any>(null);
  
  // Request camera permissions on mount
  useEffect(() => {
    (async () => {
      const { status } = await Camera.requestCameraPermissionsAsync();
      setHasPermission(status === 'granted');
    })();
  }, []);

  const processReceipt = useCallback(async (photoUri: string) => {
    try {
      setIsScanning(true);
      setError(null);
      
      // In development, use mock data to avoid API calls
      const useMock = __DEV__;
      const result = useMock 
        ? await mockScanReceipt()
        : await scanReceipt(photoUri);
      
      setReceiptData(result);
      
      // TODO: Save items to pantry
      console.log('Processed receipt:', result);

      // addToPantry(result.line_items);
      
    } catch (err) {
      console.error('Error processing receipt:', err);
      setError('Failed to process receipt. Please try again.');
    } finally {
      setIsScanning(false);
    }
  }, []);

  const takePicture = async () => {
    if (!cameraRef.current) return;
    
    try {
      const photo = await cameraRef.current.takePictureAsync({
        quality: 0.8,
        base64: false,
        exif: false
      });
      
      console.log('Photo taken:', photo.uri);
      await processReceipt(photo.uri);
      
    } catch (error) {
      console.error('Error taking picture:', error);
      setError('Failed to take picture. Please try again.');
    }
  };

  if (hasPermission === null) {
    return (
      <View style={styles.container}>
        <Text>Requesting camera permission...</Text>
      </View>
    );
  }
  
  if (hasPermission === false) {
    return (
      <View style={styles.container}>
        <Text>No access to camera</Text>
      </View>
    );
  }

  const renderScanButton = () => (
    <View style={styles.scanButtonContainer}>
      <TouchableOpacity
        style={styles.scanButton}
        onPress={takePicture}
        disabled={isScanning}
      >
        <Ionicons name="camera" size={32} color="white" />
        <Text style={styles.scanButtonText}>
          {isScanning ? 'Processing...' : 'Scan Receipt'}
        </Text>
      </TouchableOpacity>
    </View>
  );
  
  if (error) {
    return (
      <View style={[styles.container, styles.centered]}>
        <Text style={styles.errorText}>{error}</Text>
        <TouchableOpacity 
          style={styles.retryButton}
          onPress={() => setError(null)}
        >
          <Text style={styles.buttonText}>Try Again</Text>
        </TouchableOpacity>
      </View>
    );
  }
  
  if (receiptData) {
    return (
      <View style={styles.container}>
        <ScrollView style={styles.receiptContainer}>
          <Text style={styles.receiptHeader}>Receipt Details</Text>
          <Text style={styles.vendorName}>{receiptData.vendor.name}</Text>
          <Text style={styles.receiptDate}>
            {new Date(receiptData.date).toLocaleDateString()}
          </Text>
          
          <View style={styles.itemsContainer}>
            {receiptData.line_items.map((item, index) => (
              <View key={index} style={styles.itemRow}>
                <Text style={styles.itemName}>
                  {item.quantity > 1 ? `${item.quantity}x ` : ''}{item.name}
                </Text>
                <Text style={styles.itemPrice}>
                  ${item.total.toFixed(2)}
                </Text>
              </View>
            ))}
          </View>
          
          <View style={styles.totalsContainer}>
            <View style={styles.totalRow}>
              <Text>Subtotal:</Text>
              <Text>${receiptData.subtotal.toFixed(2)}</Text>
            </View>
            <View style={styles.totalRow}>
              <Text>Tax:</Text>
              <Text>${receiptData.tax.toFixed(2)}</Text>
            </View>
            <View style={[styles.totalRow, styles.grandTotal]}>
              <Text>Total:</Text>
              <Text>${receiptData.total.toFixed(2)}</Text>
            </View>
          </View>
        </ScrollView>
        
        <View style={styles.actionButtons}>
          <TouchableOpacity 
            style={[styles.actionButton, styles.cancelButton]}
            onPress={() => setReceiptData(null)}
          >
            <Text style={styles.buttonText}>Cancel</Text>
          </TouchableOpacity>
          <TouchableOpacity 
            style={[styles.actionButton, styles.saveButton]}
            onPress={() => {
              // TODO: Save items to pantry
              Alert.alert(
                'Success',
                'Items have been added to your pantry!',
                [{ text: 'OK', onPress: () => navigation.goBack() }]
              );
            }}
          >
            <Text style={styles.buttonText}>Add to Pantry</Text>
          </TouchableOpacity>
        </View>
      </View>
    );
  }

  return (
    <View style={styles.container}>
      <View style={styles.cameraContainer}>
        <Camera
          ref={cameraRef}
          style={styles.camera}
          type={Camera.Constants.Type.back}
          ratio="16:9"
        >
          <View style={styles.overlay} />
          {!isScanning && renderScanButton()}
        </Camera>
        {Platform.OS === 'ios' && (
          <View style={styles.scanButtonContainer}>
            {!isScanning && renderScanButton()}
          </View>
        )}
      </View>
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: colors.background,
    justifyContent: 'center',
    alignItems: 'center',
    ...Platform.select({
      android: {
        elevation: 5,
      },
      ios: {
        shadowColor: '#000',
        shadowOffset: { width: 0, height: 2 },
        shadowOpacity: 0.25,
        shadowRadius: 3.84,
      },
    }),
  },
  centered: {
    justifyContent: 'center',
    alignItems: 'center',
    padding: 20,
  },
  errorText: {
    color: colors.error,
    fontSize: 16,
    marginBottom: 20,
    textAlign: 'center',
  },
  retryButton: {
    backgroundColor: colors.primary,
    padding: 15,
    borderRadius: 8,
    width: '80%',
    alignItems: 'center',
  },
  receiptContainer: {
    flex: 1,
    padding: 15,
  },
  receiptHeader: {
    fontSize: 24,
    fontWeight: 'bold',
    marginBottom: 10,
    color: colors.text,
  },
  vendorName: {
    fontSize: 20,
    fontWeight: '600',
    marginBottom: 5,
    color: colors.text,
  },
  receiptDate: {
    color: colors.textSecondary,
    marginBottom: 15,
  },
  itemsContainer: {
    marginBottom: 20,
  },
  itemRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    paddingVertical: 8,
    borderBottomWidth: 1,
    borderBottomColor: colors.border,
  },
  itemName: {
    flex: 2,
    color: colors.text,
  },
  itemPrice: {
    flex: 1,
    textAlign: 'right',
    color: colors.text,
  },
  totalsContainer: {
    marginTop: 10,
    borderTopWidth: 1,
    borderTopColor: colors.border,
    paddingTop: 10,
  },
  totalRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    marginVertical: 5,
  },
  grandTotal: {
    marginTop: 10,
    paddingTop: 10,
    borderTopWidth: 1,
    borderTopColor: colors.border,
    fontWeight: 'bold',
  },
  actionButtons: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    padding: 15,
    borderTopWidth: 1,
    borderTopColor: colors.border,
    backgroundColor: colors.card,
  },
  actionButton: {
    padding: 15,
    borderRadius: 8,
    width: '48%',
    alignItems: 'center',
  },
  cancelButton: {
    backgroundColor: colors.border,
  },
  saveButton: {
    backgroundColor: colors.primary,
  },
  buttonText: {
    color: colors.buttonText,
    fontWeight: '600',
  },
  cameraContainer: {
    flex: 1,
    width: '100%',
  },
  camera: {
    flex: 1,
    width: '100%',
  },
  overlay: {
    flex: 1,
    width: '100%',
    backgroundColor: 'transparent',
    justifyContent: 'center',
    alignItems: 'center',
  },
  scanButtonContainer: {
    position: 'absolute',
    bottom: 40,
    width: '100%',
    alignItems: 'center',
  },
  scanButton: {
    backgroundColor: colors.primary,
    padding: 16,
    borderRadius: 30,
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    width: '70%',
    ...Platform.select({
      android: {
        elevation: 3,
      },
      ios: {
        shadowColor: '#000',
        shadowOffset: { width: 0, height: 2 },
        shadowOpacity: 0.25,
        shadowRadius: 3.84,
      },
    }),
  },
  scanButtonText: {
    color: 'white',
    fontSize: 18,
    fontWeight: '600',
    marginLeft: 10,
  },
  captureButtonDisabled: {
    backgroundColor: colors.muted,
  },
});
