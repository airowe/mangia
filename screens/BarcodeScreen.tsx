import React, { useEffect, useState } from "react";
import {
  View,
  Text,
  StyleSheet,
  Button,
  ActivityIndicator,
  Image,
  Alert,
  TouchableOpacity,
  SafeAreaView,
  TextInput,
  Dimensions,
  Platform,
} from "react-native";
import { supabase } from "../lib/supabase";
import { CameraView, Camera } from "expo-camera";
import { MaterialIcons } from "@expo/vector-icons";
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { STORAGE_CATEGORIES } from '../models/constants';

const { width } = Dimensions.get('window');

// Helper function to map API categories to our storage categories
const mapCategoryToStorage = (apiCategory: string): string => {
  if (!apiCategory) return STORAGE_CATEGORIES[0];
  
  const lowerCategory = apiCategory.toLowerCase();
  
  // Map common API categories to our storage categories
  if (lowerCategory.includes('dairy') || lowerCategory.includes('milk') || lowerCategory.includes('cheese')) {
    return 'Dairy';
  } else if (lowerCategory.includes('meat') || lowerCategory.includes('poultry') || lowerCategory.includes('beef') || lowerCategory.includes('chicken')) {
    return 'Meat';
  } else if (lowerCategory.includes('produce') || lowerCategory.includes('vegetable') || lowerCategory.includes('fruit')) {
    return 'Produce';
  } else if (lowerCategory.includes('frozen')) {
    return 'Frozen';
  } else if (lowerCategory.includes('beverage') || lowerCategory.includes('drink')) {
    return 'Beverages';
  } else if (lowerCategory.includes('snack')) {
    return 'Snacks';
  } else if (lowerCategory.includes('bakery') || lowerCategory.includes('bread')) {
    return 'Bakery';
  } else if (lowerCategory.includes('canned') || lowerCategory.includes('can')) {
    return 'Canned Goods';
  } else if (lowerCategory.includes('dry') || lowerCategory.includes('pantry')) {
    return 'Dry Goods';
  } else if (lowerCategory.includes('baking')) {
    return 'Baking';
  } else if (lowerCategory.includes('spice') || lowerCategory.includes('seasoning')) {
    return 'Spices';
  } else if (lowerCategory.includes('condiment') || lowerCategory.includes('sauce')) {
    return 'Condiments';
  } else if (lowerCategory.includes('oil') || lowerCategory.includes('vinegar')) {
    return 'Oils & Vinegars';
  } else if (lowerCategory.includes('pasta') || lowerCategory.includes('noodle') || lowerCategory.includes('rice')) {
    return 'Grains & Pasta';
  } else if (lowerCategory.includes('cereal') || lowerCategory.includes('breakfast')) {
    return 'Breakfast';
  } else if (lowerCategory.includes('baking') || lowerCategory.includes('flour') || lowerCategory.includes('sugar')) {
    return 'Baking';
  } else if (lowerCategory.includes('spread') || lowerCategory.includes('nut butter') || lowerCategory.includes('jam')) {
    return 'Spreads';
  } else if (lowerCategory.includes('soup') || lowerCategory.includes('broth')) {
    return 'Soups & Broths';
  } else if (lowerCategory.includes('snack') || lowerCategory.includes('chip') || lowerCategory.includes('cracker')) {
    return 'Snacks';
  } else if (lowerCategory.includes('nut') || lowerCategory.includes('seed') || lowerCategory.includes('trail mix')) {
    return 'Nuts & Seeds';
  } else if (lowerCategory.includes('dessert') || lowerCategory.includes('candy') || lowerCategory.includes('chocolate')) {
    return 'Sweets';
  } else if (lowerCategory.includes('coffee') || lowerCategory.includes('tea') || lowerCategory.includes('cocoa')) {
    return 'Coffee & Tea';
  } else if (lowerCategory.includes('alcohol') || lowerCategory.includes('beer') || lowerCategory.includes('wine') || lowerCategory.includes('liquor')) {
    return 'Alcohol';
  } else if (lowerCategory.includes('baby') || lowerCategory.includes('infant')) {
    return 'Baby';
  } else if (lowerCategory.includes('pet') || lowerCategory.includes('dog') || lowerCategory.includes('cat')) {
    return 'Pet Supplies';
  } else if (lowerCategory.includes('health') || lowerCategory.includes('beauty') || lowerCategory.includes('personal care')) {
    return 'Health & Beauty';
  } else if (lowerCategory.includes('household') || lowerCategory.includes('cleaning') || lowerCategory.includes('paper')) {
    return 'Household';
  } else if (lowerCategory.includes('other') || lowerCategory.includes('misc') || lowerCategory.includes('miscellaneous')) {
    return 'Other';
  }
  
  return STORAGE_CATEGORIES[0];
};

interface BarcodeProduct {
  title?: string;
  brand?: string;
  category?: string;
  barcode?: string;
  image?: string;
  quantity?: number;
}

export default function BarcodeScannerScreen() {
  const [hasPermission, setHasPermission] = useState<boolean | null>(null);
  const [scanned, setScanned] = useState(false);
  const [product, setProduct] = useState<BarcodeProduct | null>(null);
  const [loading, setLoading] = useState(false);
  const [saving, setSaving] = useState(false);
  const [cameraType, setCameraType] = useState<'back' | 'front'>('back');
  const [flashMode, setFlashMode] = useState<'on' | 'off'>('off');
  const insets = useSafeAreaInsets();

  const toggleFlash = () => {
    setFlashMode(flashMode === 'on' ? 'off' : 'on');
  };

  const toggleCameraType = () => {
    setCameraType(current => (current === 'back' ? 'front' : 'back'));
  };

  const apiURL =
    process.env.EXPO_PUBLIC_API_URL ||
    "https://your-vercel-app.vercel.app/api/lookup-barcode";

  useEffect(() => {
    (async () => {
      const { status } = await Camera.requestCameraPermissionsAsync();
      setHasPermission(status === "granted");
    })();
  }, []);

  const handleBarCodeScanned = async ({ data: barcode }: { data: string }) => {
    if (scanned) return;
    
    setScanned(true);
    setLoading(true);
    
    try {
      // First, set a minimal product to prevent undefined errors
      setProduct({
        title: 'Loading...',
        barcode,
        quantity: 1,
        category: STORAGE_CATEGORIES[0]
      });
      
      const response = await fetch(`${apiURL}/lookup-barcode?barcode=${barcode}`);
      
      if (!response.ok) {
        const error = await response.json().catch(() => ({}));
        throw new Error(error.error || "Product not found");
      }
      
      const data = await response.json();
      
      // Map API response to our product model with proper null checks
      const mappedProduct: BarcodeProduct = {
        title: data?.title || data?.product_name || 'Unknown Product',
        brand: data?.brand || 'Unknown Brand',
        barcode: barcode,
        image: data?.image || data?.image_url || undefined,
        category: mapCategoryToStorage(data?.category) || STORAGE_CATEGORIES[0],
        quantity: 1
      };

      setProduct(mappedProduct);
    } catch (err) {
      Alert.alert("Error", "Failed to fetch product info.");
    } finally {
      setLoading(false);
    }
  };

  const saveToPantry = async () => {
    if (!product) return;

    const { data: user } = await supabase.auth.getUser();
    const userId = user?.user?.id;

    if (!userId) {
      Alert.alert("Not logged in");
      return;
    }

    const categoryGuess = (() => {
      const c = product.category?.toLowerCase();
      if (!c) return "Pantry";
      if (c.includes("frozen")) return "Freezer";
      if (c.includes("spice")) return "Spice Drawer";
      if (c.includes("dairy") || c.includes("refrigerated")) return "Fridge";
      return "Pantry";
    })();

    const { error } = await supabase.from("products").insert([
      {
        title: product.title,
        brand: product.brand,
        category: categoryGuess,
        barcode: product.barcode,
        image: product.image,
        quantity: 1,
        user_id: userId,
      },
    ]);

    if (error) {
      console.error("Supabase insert error:", error);
      Alert.alert("Error saving to pantry");
    } else {
      Alert.alert("Success", `${product.title} saved to pantry.`);
    }
  };

  const requestPermission = async () => {
    const { status } = await Camera.requestCameraPermissionsAsync();
    setHasPermission(status === 'granted');
  };

  if (hasPermission === null) {
    return (
      <View style={styles.permissionContainer}>
        <ActivityIndicator size="large" color="#007AFF" />
        <Text style={styles.permissionText}>Requesting camera permission...</Text>
      </View>
    );
  }

  if (hasPermission === false) {
    return (
      <View style={styles.permissionContainer}>
        <MaterialIcons name="no-photography" size={48} color="#666" />
        <Text style={styles.permissionText}>Camera access is required to scan barcodes</Text>
        <Button 
          title="Grant Permission" 
          onPress={requestPermission}
        />
      </View>
    );
  }

  return (
    <SafeAreaView style={styles.container}>
      {!scanned ? (
        <View style={styles.cameraContainer}>
          <CameraView
            onBarcodeScanned={scanned ? undefined : handleBarCodeScanned}
            barcodeScannerSettings={{
              barcodeTypes: ["ean13", "upc_a", "upc_e", "qr", "pdf417"],
            }}
            style={styles.camera}
            facing={cameraType}
            flash={flashMode}
          />
          
          <View style={styles.overlay}>
            <View style={[styles.topOverlay, { paddingTop: insets.top + 20 }]}>
              <Text style={styles.overlayText}>Position barcode in frame</Text>
            </View>
            
            <View style={styles.middleOverlay}>
              <View style={styles.viewfinder}>
                <View style={styles.cornerTopLeft} />
                <View style={styles.cornerTopRight} />
                <View style={styles.cornerBottomLeft} />
                <View style={styles.cornerBottomRight} />
              </View>
            </View>
            
            <View style={[styles.bottomOverlay, { paddingBottom: insets.bottom + 20 }]}>
              <View style={styles.buttonRow}>
                <TouchableOpacity 
                  style={styles.iconButton}
                  onPress={toggleFlash}
                >
                  <MaterialIcons 
                    name={flashMode === 'on' ? 'flash-on' : 'flash-off'} 
                    size={28} 
                    color="white" 
                  />
                </TouchableOpacity>
                
                <View style={styles.scanIndicator}>
                  <View style={styles.scanLine} />
                </View>
                
                <TouchableOpacity 
                  style={styles.iconButton}
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
        </View>
      ) : (
        <View style={[styles.resultContainer, { paddingTop: insets.top }]}>
          {loading ? (
            <View style={styles.loadingContainer}>
              <ActivityIndicator size="large" color="#007AFF" />
              <Text style={styles.loadingText}>Looking up product...</Text>
            </View>
          ) : product ? (
            <View style={styles.productContainer}>
              <View style={styles.productHeader}>
                <Text style={styles.productTitle} numberOfLines={2}>
                  {product.title}
                </Text>
                {product.brand && (
                  <Text style={styles.productBrand}>{product.brand}</Text>
                )}
              </View>
              
              <View style={styles.imageContainer}>
                {product.image ? (
                  <Image 
                    source={{ uri: product.image }} 
                    style={styles.productImage} 
                    resizeMode="contain"
                  />
                ) : (
                  <View style={styles.noImage}>
                    <MaterialIcons name="no-photography" size={48} color="#999" />
                  </View>
                )}
              </View>
              
              <View style={styles.detailsContainer}>
                <View style={styles.detailRow}>
                  <Text style={styles.detailLabel}>Category:</Text>
                  <Text style={styles.detailValue}>{product.category || 'Not specified'}</Text>
                </View>
                
                <View style={styles.quantityContainer}>
                  <Text style={styles.detailLabel}>Quantity:</Text>
                  <View style={styles.quantityControls}>
                    <TouchableOpacity 
                      style={styles.quantityButton}
                      onPress={() => setProduct({
                        ...product,
                        quantity: Math.max(1, (product.quantity || 1) - 1)
                      })}
                    >
                      <Text style={styles.quantityButtonText}>-</Text>
                    </TouchableOpacity>
                    
                    <TextInput
                      style={styles.quantityInput}
                      value={product.quantity?.toString()}
                      onChangeText={(text) => {
                        const num = parseInt(text) || 1;
                        setProduct({...product, quantity: Math.max(1, num)});
                      }}
                      keyboardType="number-pad"
                      selectTextOnFocus
                    />
                    
                    <TouchableOpacity 
                      style={styles.quantityButton}
                      onPress={() => setProduct({
                        ...product,
                        quantity: (product.quantity || 1) + 1
                      })}
                    >
                      <Text style={styles.quantityButtonText}>+</Text>
                    </TouchableOpacity>
                  </View>
                </View>
              </View>
              
              <View style={styles.buttonContainer}>
                <TouchableOpacity 
                  style={[styles.button, styles.primaryButton]}
                  onPress={saveToPantry}
                  disabled={saving}
                >
                  {saving ? (
                    <ActivityIndicator color="white" />
                  ) : (
                    <Text style={styles.buttonText}>Save to Pantry</Text>
                  )}
                </TouchableOpacity>
                
                <TouchableOpacity 
                  style={[styles.button, styles.secondaryButton]}
                  onPress={() => setScanned(false)}
                  disabled={saving}
                >
                  <Text style={[styles.buttonText, styles.secondaryButtonText]}>Scan Another</Text>
                </TouchableOpacity>
              </View>
            </View>
          ) : (
            <View style={styles.errorContainer}>
              <MaterialIcons name="error-outline" size={48} color="#FF3B30" />
              <Text style={styles.errorText}>
                Couldn't find product information
              </Text>
              <TouchableOpacity 
                style={styles.retryButton}
                onPress={() => setScanned(false)}
              >
                <Text style={styles.retryButtonText}>Try Again</Text>
              </TouchableOpacity>
            </View>
          )}
        </View>
      )}
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  // Container styles
  container: {
    flex: 1,
    backgroundColor: '#000',
  },
  permissionContainer: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
    padding: 20,
    backgroundColor: '#fff',
  },
  permissionText: {
    marginTop: 16,
    fontSize: 16,
    textAlign: 'center',
    color: '#666',
  },
  
  // Camera styles
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
  topOverlay: {
    position: 'absolute',
    left: 0,
    right: 0,
    alignItems: 'center',
  },
  overlayText: {
    color: '#fff',
    fontSize: 16,
    fontWeight: '500',
    textShadowColor: 'rgba(0, 0, 0, 0.75)',
    textShadowOffset: { width: 1, height: 1 },
    textShadowRadius: 4,
    backgroundColor: 'rgba(0, 0, 0, 0.5)',
    paddingHorizontal: 16,
    paddingVertical: 8,
    borderRadius: 20,
    overflow: 'hidden',
  },
  middleOverlay: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
  },
  viewfinder: {
    width: width * 0.8,
    aspectRatio: 1,
    borderWidth: 2,
    borderColor: 'rgba(255, 255, 255, 0.3)',
    backgroundColor: 'transparent',
    position: 'relative',
    borderRadius: 16,
    overflow: 'hidden',
  },
  cornerTopLeft: {
    position: 'absolute',
    top: 0,
    left: 0,
    width: 40,
    height: 40,
    borderLeftWidth: 4,
    borderTopWidth: 4,
    borderColor: '#007AFF',
    borderTopLeftRadius: 12,
  },
  cornerTopRight: {
    position: 'absolute',
    top: 0,
    right: 0,
    width: 40,
    height: 40,
    borderRightWidth: 4,
    borderTopWidth: 4,
    borderColor: '#007AFF',
    borderTopRightRadius: 12,
  },
  cornerBottomLeft: {
    position: 'absolute',
    bottom: 0,
    left: 0,
    width: 40,
    height: 40,
    borderLeftWidth: 4,
    borderBottomWidth: 4,
    borderColor: '#007AFF',
    borderBottomLeftRadius: 12,
  },
  cornerBottomRight: {
    position: 'absolute',
    bottom: 0,
    right: 0,
    width: 40,
    height: 40,
    borderRightWidth: 4,
    borderBottomWidth: 4,
    borderColor: '#007AFF',
    borderBottomRightRadius: 12,
  },
  bottomOverlay: {
    position: 'absolute',
    left: 0,
    right: 0,
    paddingHorizontal: 24,
  },
  buttonRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
  },
  iconButton: {
    width: 56,
    height: 56,
    borderRadius: 28,
    backgroundColor: 'rgba(0, 0, 0, 0.5)',
    justifyContent: 'center',
    alignItems: 'center',
  },
  scanIndicator: {
    width: 80,
    height: 4,
    backgroundColor: 'rgba(255, 255, 255, 0.5)',
    borderRadius: 2,
    overflow: 'hidden',
  },
  scanLine: {
    ...StyleSheet.absoluteFillObject,
    backgroundColor: '#007AFF',
    width: '30%',
    borderRadius: 2,
  },
  
  // Result styles
  resultContainer: {
    flex: 1,
    backgroundColor: '#fff',
  },
  loadingContainer: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
    padding: 20,
  },
  loadingText: {
    marginTop: 16,
    fontSize: 16,
    color: '#666',
  },
  errorContainer: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
    padding: 40,
  },
  errorText: {
    fontSize: 18,
    fontWeight: '500',
    textAlign: 'center',
    marginVertical: 16,
    color: '#333',
  },
  retryButton: {
    marginTop: 20,
    paddingVertical: 12,
    paddingHorizontal: 32,
    borderRadius: 8,
    backgroundColor: '#007AFF',
  },
  retryButtonText: {
    color: '#fff',
    fontSize: 16,
    fontWeight: '600',
  },
  
  // Product details styles
  productContainer: {
    flex: 1,
    padding: 20,
  },
  productHeader: {
    marginBottom: 20,
  },
  productTitle: {
    fontSize: 24,
    fontWeight: '700',
    color: '#1C1C1E',
    marginBottom: 4,
  },
  productBrand: {
    fontSize: 16,
    color: '#8E8E93',
    fontWeight: '500',
  },
  imageContainer: {
    width: '100%',
    height: 200,
    backgroundColor: '#F2F2F7',
    borderRadius: 12,
    marginBottom: 24,
    overflow: 'hidden',
    justifyContent: 'center',
    alignItems: 'center',
  },
  productImage: {
    width: '100%',
    height: '100%',
  },
  noImage: {
    justifyContent: 'center',
    alignItems: 'center',
  },
  detailsContainer: {
    marginBottom: 24,
  },
  detailRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    paddingVertical: 12,
    borderBottomWidth: 1,
    borderBottomColor: '#F2F2F7',
  },
  detailLabel: {
    fontSize: 16,
    color: '#8E8E93',
  },
  detailValue: {
    fontSize: 16,
    color: '#1C1C1E',
    fontWeight: '500',
  },
  quantityContainer: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    paddingVertical: 12,
  },
  quantityControls: {
    flexDirection: 'row',
    alignItems: 'center',
  },
  quantityButton: {
    width: 40,
    height: 40,
    borderRadius: 20,
    backgroundColor: '#F2F2F7',
    justifyContent: 'center',
    alignItems: 'center',
  },
  quantityButtonText: {
    fontSize: 20,
    color: '#007AFF',
    fontWeight: '600',
    lineHeight: 24,
  },
  quantityInput: {
    width: 50,
    height: 40,
    textAlign: 'center',
    fontSize: 16,
    fontWeight: '600',
    color: '#1C1C1E',
    marginHorizontal: 8,
  },
  buttonContainer: {
    marginTop: 'auto',
    paddingBottom: 20,
  },
  button: {
    padding: 16,
    borderRadius: 12,
    alignItems: 'center',
    justifyContent: 'center',
    marginBottom: 12,
    flexDirection: 'row',
  },
  primaryButton: {
    backgroundColor: '#007AFF',
  },
  secondaryButton: {
    backgroundColor: '#F2F2F7',
  },
  buttonText: {
    color: '#fff',
    fontSize: 16,
    fontWeight: '600',
  },
  secondaryButtonText: {
    color: '#007AFF',
  },
});
