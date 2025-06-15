import React, { useState, useEffect, useRef } from 'react';
import { 
  View, 
  StyleSheet, 
  Text, 
  TouchableOpacity, 
  ScrollView,
  Alert,
  Dimensions,
} from 'react-native';
import { Camera } from "expo-camera";
import { colors } from '../theme/colors';
import { StackNavigationProp } from '@react-navigation/stack';
import { RootStackParamList } from '../navigation/HomeStack';
import { CameraViewer, CameraViewerRef } from '../components/CameraViewer';

const { width } = Dimensions.get('window');

// Import ReceiptItem and extend it with id for merging with pantry
import { ReceiptItem as BaseReceiptItem } from '../utils/receiptParser';

// Import pantry functions and types
import { fetchPantryItems, addToPantry, updatePantryItemQuantity } from '../lib/pantry';
import { PantryItem } from '../models/Product';

// Import parseReceipt from receiptParser
import { parseReceipt } from '../utils/receiptParser';

// Extend ReceiptItem with id for pantry merging
interface ReceiptItem extends BaseReceiptItem {
  id?: string;
  total?: number;
  title: string;
  quantity: number;
  price?: number;
  unit?: string;
  category?: string;
  location?: string;
}

interface ReceiptData {
  items: ReceiptItem[];
  total: number;
  date: string;
  vendor?: {
    name: string;
    address: string;
  };
  subtotal?: number;
  tax?: number;
  raw_text?: string;
}

type ReceiptScanScreenNavigationProp = StackNavigationProp<RootStackParamList, 'ReceiptScanScreen'>;

interface ReceiptScanScreenProps {
  navigation: ReceiptScanScreenNavigationProp;
}

const ReceiptScanScreen: React.FC<ReceiptScanScreenProps> = ({ navigation }) => {
  const [hasPermission, setHasPermission] = useState<boolean | null>(null);
  const [isScanning, setIsScanning] = useState(false);
  const [isSaving, setIsSaving] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [receiptData, setReceiptData] = useState<ReceiptData | null>(null);
  const cameraRef = useRef<CameraViewerRef>(null);
  const [flashMode, setFlashMode] = useState<"on" | "off">("off");
  const [cameraType, setCameraType] = useState<"front" | "back">("back");

  // Request camera permission
  useEffect(() => {
    (async () => {
      const { status } = await Camera.requestCameraPermissionsAsync();
      setHasPermission(status === 'granted');
    })();
  }, []);

  const toggleFlash = () => {
    setFlashMode(flashMode === "on" ? "off" : "on");
  };

  const toggleCameraType = () => {
    setCameraType((current) => (current === "back" ? "front" : "back"));
  };

  const takePicture = async () => {
    if (!cameraRef.current) return;
    
    try {
      setIsScanning(true);
      setError(null);
      
      // Take picture
      const photo = await cameraRef.current.takePicture({
        quality: 0.8,
        base64: false,
        exif: false
      });
      
      if (!photo.uri) throw new Error('Failed to capture image');
      
      // Process the image with Tesseract.js
      const receiptItems = await parseReceipt(photo.uri);
      
      // Get current pantry items to check for duplicates
      const pantryItems = await fetchPantryItems();
      
      // Merge receipt items with pantry items
      const mergedItems = receiptItems.map((item: ReceiptItem) => {
        const matchingPantryItem = pantryItems.find((pantryItem: PantryItem) => 
          pantryItem.title?.toLowerCase() === item.title.toLowerCase()
        );
        
        return {
          ...item,
          id: matchingPantryItem?.id,
          title: item.title,
          description: '',
          created_at: new Date().toISOString(),
          category: item.category || 'Uncategorized',
          location: item.location || 'Pantry',
          unit: item.unit || 'unit',
          quantity: item.quantity || 1,
          price: item.price || 0
        } as PantryItem;
      });
      
      setReceiptData({
        items: mergedItems,
        total: mergedItems.reduce((sum: number, item: ReceiptItem) => sum + (item.total || 0), 0),
        date: new Date().toISOString(),
        vendor: {
          name: 'Unknown Store',
          address: ''
        }
      });
      
    } catch (err) {
      console.error('Error processing receipt:', err);
      setError('Failed to process receipt. Please try again.');
    } finally {
      setIsScanning(false);
    }
  };

  const retakePicture = () => {
    setReceiptData(null);
    setError(null);
  };

  const saveReceipt = async () => {
    if (!receiptData) return;
    
    try {
      setIsSaving(true);
      
      // Save each item to pantry
      for (const item of receiptData.items) {
        try {
          if (item.id) {
            // Update existing item
            await updatePantryItemQuantity(item.id, item.quantity);
          } else {
            // Add new item
            const newItem: PantryItem = {
              title: item.title,
              quantity: item.quantity,
              price: item.price || 0,
              category: 'Other',
              location: 'Pantry',
              unit: 'unit',
              expiryDate: '',
              id: ''
            };
            await addToPantry(newItem);
          }
        } catch (err) {
          console.error(`Error saving item ${item.title}:`, err);
          // Continue with other items even if one fails
        }
      }
      
      // Navigate back with success
      navigation.goBack();
      
    } catch (err) {
      console.error('Error saving receipt:', err);
      setError('Failed to save receipt. Please try again.');
    } finally {
      setIsSaving(false);
    }
  };

  // Check camera permissions
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

  return (
    <View style={styles.container}>
      {!receiptData ? (
        <CameraViewer 
          ref={cameraRef}
          onTakePicture={takePicture}
          onFlashToggle={setFlashMode}
          onCameraToggle={setCameraType}
          isScanning={isScanning}
          flashMode={flashMode}
          cameraType={cameraType}
          overlayText="Align receipt within the frame"
          showViewfinder={true}
          showControls={false}
        />
      ) : (
        <View style={styles.receiptContainer}>
          <ScrollView style={styles.receiptScroll}>
            <View style={styles.receiptHeader}>
              <Text style={styles.receiptTitle}>Receipt Scan Results</Text>
              {receiptData.vendor && (
                <View style={styles.section}>
                  <Text style={styles.sectionTitle}>Vendor</Text>
                  <Text style={styles.vendorName}>
                    {receiptData.vendor.name}
                  </Text>
                  <Text style={styles.vendorAddress}>
                    {receiptData.vendor.address}
                  </Text>
                </View>
              )}
              <Text style={styles.receiptDate}>
                {new Date(receiptData.date).toLocaleDateString()}
              </Text>
            </View>

            <View style={styles.itemsContainer}>
              {receiptData.items.map((item, index) => (
                <View key={index} style={styles.itemRow}>
                  <Text style={styles.itemName}>
                    {item.quantity > 1 ? `${item.quantity}x ` : ''}{item.title}
                  </Text>
                  <Text style={styles.itemPrice}>
                    ${((item?.price || 0) * item.quantity).toFixed(2)}
                  </Text>
                </View>
              ))}
            </View>

            <View style={styles.totalsContainer}>
              {receiptData.subtotal !== undefined && (
                <View style={styles.totalRow}>
                  <Text>Subtotal:</Text>
                  <Text>${receiptData.subtotal.toFixed(2)}</Text>
                </View>
              )}
              {receiptData.tax !== undefined && (
                <View style={styles.totalRow}>
                  <Text>Tax:</Text>
                  <Text>${receiptData.tax.toFixed(2)}</Text>
                </View>
              )}
              <View style={[styles.totalRow, styles.grandTotal]}>
                <Text style={styles.grandTotalText}>Total:</Text>
                <Text style={styles.grandTotalText}>${receiptData.total.toFixed(2)}</Text>
              </View>
            </View>
          </ScrollView>

          <View style={styles.actionButtons}>
            <TouchableOpacity 
              style={[styles.primaryButton]}
              onPress={retakePicture}
            >
              <Text style={styles.primaryButtonText}>Retake</Text>
            </TouchableOpacity>
            <TouchableOpacity 
              style={[styles.primaryButton]}
              onPress={saveReceipt}
            >
              <Text style={[styles.primaryButtonText]}>Save to Pantry</Text>
            </TouchableOpacity>
          </View>
        </View>
      )}

      {error && (
        <View style={styles.errorContainer}>
          <Text style={styles.errorText}>{error}</Text>
        </View>
      )}
    </View>
  );
};

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: colors.background,
  },
  // Receipt styles
  receiptContainer: {
    flex: 1,
    backgroundColor: colors.background,
  },
  receiptScroll: {
    flex: 1,
    padding: 20,
  },
  receiptHeader: {
    alignItems: 'center',
    marginBottom: 20,
    paddingBottom: 15,
    borderBottomWidth: 1,
    borderBottomColor: '#eee',
  },
  receiptTitle: {
    fontSize: 22,
    fontWeight: 'bold',
    marginBottom: 5,
    color: colors.text,
  },
  receiptDate: {
    fontSize: 14,
    color: colors.textSecondary,
    marginBottom: 16,
  },
  section: {
    marginBottom: 16,
    width: '100%',
  },
  sectionTitle: {
    fontSize: 16,
    fontWeight: '600',
    color: colors.primary,
    marginBottom: 8,
  },
  vendorName: {
    fontSize: 16,
    color: colors.text,
    marginBottom: 4,
  },
  vendorAddress: {
    fontSize: 14,
    color: colors.textSecondary,
  },
  itemsContainer: {
    marginBottom: 20,
  },
  itemRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    marginBottom: 10,
    paddingBottom: 5,
    borderBottomWidth: 1,
    borderBottomColor: '#f0f0f0',
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
    borderTopColor: '#eee',
    paddingTop: 15,
  },
  totalRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    marginBottom: 8,
  },
  grandTotal: {
    marginTop: 10,
    paddingTop: 10,
    borderTopWidth: 1,
    borderTopColor: '#ddd',
  },
  grandTotalText: {
    fontSize: 18,
    fontWeight: 'bold',
    color: colors.primary,
  },
  actionButtons: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    marginTop: 30,
    paddingHorizontal: 20,
  },
  primaryButton: {
    flex: 1,
    backgroundColor: colors.primary,
    padding: 15,
    borderRadius: 8,
    marginLeft: 10,
  },
  primaryButtonText: {
    color: 'white',
    textAlign: 'center',
    fontWeight: '600',
  },
  secondaryButton: {
    flex: 1,
    backgroundColor: 'transparent',
    borderWidth: 1,
    borderColor: colors.primary,
    padding: 15,
    borderRadius: 8,
    marginRight: 10,
  },
  secondaryButtonText: {
    color: colors.primary,
    textAlign: 'center',
    fontWeight: '600',
  },
  errorContainer: {
    backgroundColor: '#ffebee',
    padding: 15,
    borderRadius: 8,
    margin: 20,
    alignItems: 'center',
  },
  errorText: {
    color: '#d32f2f',
    textAlign: 'center',
  },
  // Camera styles
  buttonText: {
    color: colors.text,
    fontSize: 16,
    fontWeight: '500',
  },
  iconButton: {
    width: 60,
    height: 60,
    borderRadius: 30,
    backgroundColor: 'rgba(0, 0, 0, 0.5)',
    justifyContent: 'center',
    alignItems: 'center',
  },
  cameraContainer: {
    flex: 1,
    position: 'relative',
  },
  camera: {
    flex: 1,
  },
  overlay: {
    ...StyleSheet.absoluteFillObject,
    backgroundColor: 'rgba(0, 0, 0, 0.4)',
  },
  overlayInner: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
  },
  overlayFrame: {
    width: '80%',
    aspectRatio: 3/4,
    borderWidth: 2,
    borderColor: '#fff',
    backgroundColor: 'transparent',
  },
  overlayText: {
    color: '#fff',
    marginTop: 10,
    fontSize: 16,
  },
  captureButtonDisabled: {
    opacity: 0.5,
  },
  scanIndicator: {
    position: 'absolute',
    top: 0,
    left: 0,
    right: 0,
    height: 2,
    backgroundColor: 'rgba(255, 0, 0, 0.7)',
  },
  scanLine: {
    height: 2,
    backgroundColor: 'rgba(255, 0, 0, 0.7)',
    width: '100%',
  },
  topOverlay: {
    position: 'absolute',
    top: 0,
    left: 0,
    right: 0,
    height: '30%',
    backgroundColor: 'rgba(0, 0, 0, 0.5)',
  },
  middleOverlay: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
  },
  viewfinder: {
    width: width * 0.7,
    height: width * 0.5,
    borderWidth: 2,
    borderColor: '#fff',
    borderRadius: 12,
    backgroundColor: 'transparent',
    position: 'relative',
  },
  cornerTopLeft: {
    position: 'absolute',
    top: -2,
    left: -2,
    width: 40,
    height: 40,
    borderLeftWidth: 4,
    borderTopWidth: 4,
    borderColor: '#007AFF',
    borderTopLeftRadius: 8,
  },
  cornerTopRight: {
    position: 'absolute',
    top: -2,
    right: -2,
    width: 40,
    height: 40,
    borderRightWidth: 4,
    borderTopWidth: 4,
    borderColor: '#007AFF',
    borderTopRightRadius: 8,
  },
  cornerBottomLeft: {
    position: 'absolute',
    bottom: -2,
    left: -2,
    width: 40,
    height: 40,
    borderLeftWidth: 4,
    borderBottomWidth: 4,
    borderColor: '#007AFF',
    borderBottomLeftRadius: 8,
  },
  cornerBottomRight: {
    position: 'absolute',
    bottom: -2,
    right: -2,
    width: 40,
    height: 40,
    borderRightWidth: 4,
    borderBottomWidth: 4,
    borderColor: '#007AFF',
    borderBottomRightRadius: 8,
  },
  bottomOverlay: {
    position: 'absolute',
    left: 0,
    right: 0,
    alignItems: 'center',
  },
  buttonRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    width: '100%',
    paddingHorizontal: 40,
  },
  buttonContainer: {
    position: 'absolute',
    bottom: 40,
    left: 0,
    right: 0,
    flexDirection: 'row',
    justifyContent: 'center',
    alignItems: 'center',
  },
  captureButton: {
    width: 70,
    height: 70,
    borderRadius: 35,
    backgroundColor: colors.primary,
    justifyContent: 'center',
    alignItems: 'center',
    elevation: 5,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.3,
    shadowRadius: 3,
  },
});

export default ReceiptScanScreen;
