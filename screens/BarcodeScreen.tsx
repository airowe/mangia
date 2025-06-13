import React, { useCallback, useEffect, useRef, useState } from "react";
import {
  View,
  Text,
  StyleSheet,
  ActivityIndicator,
  Alert,
  TouchableOpacity,
  SafeAreaView,
  Dimensions,
} from "react-native";
import { lookupBarcode } from "../lib/ai";
import { MaterialIcons } from "@expo/vector-icons";
import { useSafeAreaInsets } from "react-native-safe-area-context";
import type { Product } from "../models/Product";
import { CameraViewer, CameraViewerRef } from "../components/CameraViewer";
import { Camera } from "expo-camera";

type BarcodeScannerScreenProps = {
  navigation: {
    navigate: (screen: string, params?: any) => void;
    goBack: () => void;
  };
  route: {
    params?: {
      onBarcodeScanned: (barcode: string, product: Product) => void;
    };
  };
};

const { width } = Dimensions.get("window");

// Main component
export default function BarcodeScannerScreen({
  navigation,
  route,
}: BarcodeScannerScreenProps) {
  // Refs
  const cameraViewRef = useRef<CameraViewerRef>(null);
  const isFirstScan = useRef(true);
  const scanTimeoutRef = useRef<ReturnType<typeof setTimeout> | null>(null);

  // State
  const [hasPermission, setHasPermission] = useState<boolean | null>(null);
  const [loading, setLoading] = useState(false);
  const [flashMode, setFlashMode] = useState<"on" | "off">("off");
  const [cameraType, setCameraType] = useState<"front" | "back">("back");
  const insets = useSafeAreaInsets();

  // Handlers
  const toggleFlash = useCallback(() => {
    setFlashMode(prev => prev === "on" ? "off" : "on");
  }, []);

  const toggleCameraType = useCallback(() => {
    setCameraType(prev => prev === "back" ? "front" : "back");
  }, []);

  const requestPermission = useCallback(async () => {
    const { status } = await Camera.requestCameraPermissionsAsync();
    setHasPermission(status === 'granted');
  }, []);

  // Handle barcode lookup
  const handleBarcodeLookup = useCallback(async (barcode: string) => {
    if (!barcode || loading) return;

    setLoading(true);

    try {
      const response = await lookupBarcode(barcode);
      if (response?.data) {
        // If there's a callback from the parent, call it with the scanned data
        if (route.params?.onBarcodeScanned) {
          route.params.onBarcodeScanned(barcode, response.data);
          navigation.goBack();
        } else {
          // Otherwise, navigate to the product details screen
          navigation.navigate('ProductDetails', { product: response.data });
        }
      } else {
        Alert.alert("Product Not Found", "We couldn't find this product. Please try again or enter the details manually.");
      }
    } catch (error) {
      console.error("Error looking up product:", error);
      Alert.alert(
        "Error",
        error instanceof Error ? error.message : "Failed to look up product"
      );
    } finally {
      setLoading(false);
    }
  }, [loading, navigation, route.params]);

  // Handle barcode scanned event
  const handleBarcodeScanned = useCallback(({ data }: { data: string }) => {
    if (isFirstScan.current) {
      isFirstScan.current = false;
      handleBarcodeLookup(data);
    }
  }, [handleBarcodeLookup]);

  // Reset the first scan flag to allow scanning again
  const handleRetry = useCallback(() => {
    isFirstScan.current = true;
  }, []);

  // Request camera permission on mount
  useEffect(() => {
    requestPermission();
  }, [requestPermission]);

  // Render loading state while checking permission
  if (hasPermission === null) {
    return (
      <View style={styles.loadingContainer}>
        <ActivityIndicator size="large" color="#007AFF" />
        <Text style={styles.loadingText}>Requesting camera permission...</Text>
      </View>
    );
  }

  // Render permission denied state
  if (hasPermission === false) {
    return (
      <View style={styles.permissionContainer}>
        <MaterialIcons name="no-photography" size={48} color="#666" />
        <Text style={styles.permissionText}>
          Camera access is required to scan barcodes
        </Text>
        <TouchableOpacity 
          style={styles.permissionButton}
          onPress={requestPermission}
        >
          <Text style={styles.permissionButtonText}>Grant Permission</Text>
        </TouchableOpacity>
      </View>
    );
  }

  // Main render
  return (
    <SafeAreaView style={[styles.container, { paddingTop: insets.top }]}>
      <View style={{ flex: 1 }}>
        <View style={styles.header}>
          <TouchableOpacity 
            style={styles.closeButton}
            onPress={() => navigation.goBack()}
          >
            <MaterialIcons name="close" size={24} color="#000" />
          </TouchableOpacity>
          <Text style={styles.screenTitle}>Scan Barcode</Text>
          <View style={{ width: 24 }} />
        </View>
        
        <View style={styles.cameraContainer}>
          <CameraViewer
            ref={cameraViewRef}
            onBarcodeScanned={handleBarcodeScanned}
            flashMode={flashMode}
            cameraType={cameraType}
            onFlashToggle={toggleFlash}
            onCameraToggle={toggleCameraType}
            isScanning={true}
            showControls={false}
          />
          
          <View style={styles.cameraOverlay}>
            <View style={styles.cameraOverlayFrame} />
            <Text style={styles.cameraOverlayText}>Position barcode in frame</Text>
            
            <View style={styles.cameraControls}>
              <TouchableOpacity 
                style={styles.cameraButton}
                onPress={toggleFlash}
              >
                <MaterialIcons 
                  name={flashMode === 'on' ? 'flash-on' : 'flash-off'} 
                  size={28} 
                  color="white" 
                />
              </TouchableOpacity>
              
              <TouchableOpacity 
                style={styles.cameraButton}
                onPress={toggleCameraType}
              >
                <MaterialIcons 
                  name="flip-camera-ios" 
                  size={28} 
                  color="white" 
                />
              </TouchableOpacity>
            </View>
          </View>
        </View>
        
        {loading && (
          <View style={styles.overlay}>
            <ActivityIndicator size="large" color="#007AFF" />
            <Text style={styles.overlayText}>Looking up product...</Text>
          </View>
        )}
      </View>
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  // Main container
  container: {
    flex: 1,
    backgroundColor: '#000',
  },
  // Header
  header: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    padding: 16,
    backgroundColor: 'rgba(0, 0, 0, 0.5)',
    position: 'absolute',
    top: 0,
    left: 0,
    right: 0,
    zIndex: 10,
  },
  closeButton: {
    padding: 8,
    backgroundColor: 'rgba(255, 255, 255, 0.2)',
    borderRadius: 20,
  },
  screenTitle: {
    fontSize: 18,
    fontWeight: '600',
    color: '#fff',
  },
  // Camera container
  cameraContainer: {
    flex: 1,
    backgroundColor: '#000',
    position: 'relative',
  },
  // Camera overlay
  cameraOverlay: {
    ...StyleSheet.absoluteFillObject,
    justifyContent: 'center',
    alignItems: 'center',
    padding: 20,
  },
  cameraOverlayFrame: {
    width: width * 0.7,
    height: width * 0.7,
    borderWidth: 2,
    borderColor: 'rgba(255, 255, 255, 0.7)',
    borderRadius: 16,
    backgroundColor: 'transparent',
    marginBottom: 20,
  },
  cameraOverlayText: {
    color: '#fff',
    fontSize: 16,
    marginTop: 20,
    textAlign: 'center',
    backgroundColor: 'rgba(0, 0, 0, 0.5)',
    padding: 12,
    borderRadius: 8,
    marginBottom: 20,
  },
  cameraControls: {
    position: 'absolute',
    bottom: 60,
    left: 0,
    right: 0,
    flexDirection: 'row',
    justifyContent: 'center',
    gap: 40,
    paddingHorizontal: 20,
  },
  cameraButton: {
    width: 50,
    height: 50,
    borderRadius: 25,
    backgroundColor: 'rgba(255, 255, 255, 0.2)',
    justifyContent: 'center',
    alignItems: 'center',
  },
  // Loading and permission states
  loadingContainer: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
    backgroundColor: '#000',
  },
  loadingText: {
    marginTop: 16,
    fontSize: 16,
    color: '#fff',
  },
  permissionContainer: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
    padding: 32,
    backgroundColor: '#000',
  },
  permissionText: {
    fontSize: 18,
    textAlign: 'center',
    marginVertical: 24,
    color: '#fff',
  },
  permissionButton: {
    backgroundColor: '#007AFF',
    paddingVertical: 12,
    paddingHorizontal: 24,
    borderRadius: 25,
  },
  permissionButtonText: {
    color: '#fff',
    fontSize: 16,
    fontWeight: '600',
  },
  // Overlay for loading state
  overlay: {
    ...StyleSheet.absoluteFillObject,
    backgroundColor: 'rgba(0, 0, 0, 0.7)',
    justifyContent: 'center',
    alignItems: 'center',
  },
  overlayText: {
    color: '#fff',
    fontSize: 16,
    marginTop: 16,
  },
  // Bottom sheet styles (kept for potential future use)
  sheetBackground: {
    backgroundColor: '#fff',
    borderTopLeftRadius: 20,
    borderTopRightRadius: 20,
  },
  sheetHandle: {
    backgroundColor: '#ccc',
    width: 40,
    height: 5,
    borderRadius: 2.5,
    marginTop: 10,
  },
  sheetContainer: {
    flex: 1,
    padding: 20,
    alignItems: 'center',
  },
  sheetTitle: {
    fontSize: 20,
    fontWeight: '600',
    marginBottom: 8,
    textAlign: 'center',
  },
  sheetSubtitle: {
    fontSize: 14,
    color: '#666',
    marginBottom: 24,
    textAlign: 'center',
  },
  sheetButtons: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    width: '100%',
    paddingHorizontal: 20,
  },
  sheetButton: {
    width: '48%',
    padding: 16,
    borderRadius: 12,
    alignItems: 'center',
    justifyContent: 'center',
    borderWidth: 1,
  },
  barcodeButton: {
    borderColor: '#007AFF',
  },
  receiptButton: {
    borderColor: '#34C759',
  },
  sheetButtonText: {
    marginTop: 8,
    fontSize: 14,
    fontWeight: '500',
    textAlign: 'center',
  },
});
