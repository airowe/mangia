import React, { useCallback, useEffect, useRef, useState } from "react";
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
  Dimensions,
} from "react-native";
import { addToPantry } from "../lib/pantry";
import { BarcodeProduct, lookupBarcode } from "../lib/ai";
import { CameraView, Camera } from "expo-camera";
import { MaterialIcons } from "@expo/vector-icons";
import { useSafeAreaInsets } from "react-native-safe-area-context";
import { STORAGE_CATEGORIES } from "../models/constants";
import type { PantryItem, Product } from "../models/Product";

// Simple debounce function
const debounce = <F extends (...args: any[]) => any>(func: F, wait: number) => {
  let timeout: NodeJS.Timeout;

  return function executedFunction(...args: Parameters<F>) {
    const later = () => {
      clearTimeout(timeout);
      func(...args);
    };

    clearTimeout(timeout);
    timeout = setTimeout(later, wait);
  };
};

interface BarcodeScannerScreenProps {
  navigation: any;
}

const { width } = Dimensions.get("window");

// Helper function to map API categories to our storage categories
const mapCategoryToStorage = (apiCategory: string): string => {
  if (!apiCategory) return STORAGE_CATEGORIES[0];
  const lowerCategory = apiCategory.toLowerCase();

  // Map common API categories to our storage categories
  if (
    lowerCategory.includes("dairy") ||
    lowerCategory.includes("milk") ||
    lowerCategory.includes("cheese")
  ) {
    return "Dairy";
  } else if (
    lowerCategory.includes("meat") ||
    lowerCategory.includes("poultry") ||
    lowerCategory.includes("beef") ||
    lowerCategory.includes("chicken")
  ) {
    return "Meat";
  } else if (
    lowerCategory.includes("produce") ||
    lowerCategory.includes("vegetable") ||
    lowerCategory.includes("fruit")
  ) {
    return "Produce";
  } else if (lowerCategory.includes("frozen")) {
    return "Frozen";
  } else if (
    lowerCategory.includes("beverage") ||
    lowerCategory.includes("drink")
  ) {
    return "Beverages";
  } else if (lowerCategory.includes("snack")) {
    return "Snacks";
  } else if (
    lowerCategory.includes("bakery") ||
    lowerCategory.includes("bread")
  ) {
    return "Bakery";
  } else if (
    lowerCategory.includes("canned") ||
    lowerCategory.includes("can")
  ) {
    return "Canned Goods";
  } else if (
    lowerCategory.includes("dry") ||
    lowerCategory.includes("pantry")
  ) {
    return "Dry Goods";
  } else if (lowerCategory.includes("baking")) {
    return "Baking";
  } else if (
    lowerCategory.includes("spice") ||
    lowerCategory.includes("seasoning")
  ) {
    return "Spices";
  } else if (
    lowerCategory.includes("condiment") ||
    lowerCategory.includes("sauce")
  ) {
    return "Condiments";
  } else if (
    lowerCategory.includes("oil") ||
    lowerCategory.includes("vinegar")
  ) {
    return "Oils & Vinegars";
  } else if (
    lowerCategory.includes("pasta") ||
    lowerCategory.includes("noodle") ||
    lowerCategory.includes("rice")
  ) {
    return "Grains & Pasta";
  } else if (
    lowerCategory.includes("cereal") ||
    lowerCategory.includes("breakfast")
  ) {
    return "Breakfast";
  } else if (
    lowerCategory.includes("spread") ||
    lowerCategory.includes("nut butter") ||
    lowerCategory.includes("jam")
  ) {
    return "Spreads";
  } else if (
    lowerCategory.includes("soup") ||
    lowerCategory.includes("broth")
  ) {
    return "Soups & Broths";
  } else if (
    lowerCategory.includes("nut") ||
    lowerCategory.includes("seed") ||
    lowerCategory.includes("trail mix")
  ) {
    return "Nuts & Seeds";
  } else if (
    lowerCategory.includes("dessert") ||
    lowerCategory.includes("candy") ||
    lowerCategory.includes("chocolate")
  ) {
    return "Sweets";
  } else if (
    lowerCategory.includes("coffee") ||
    lowerCategory.includes("tea") ||
    lowerCategory.includes("cocoa")
  ) {
    return "Coffee & Tea";
  } else if (
    lowerCategory.includes("alcohol") ||
    lowerCategory.includes("beer") ||
    lowerCategory.includes("wine") ||
    lowerCategory.includes("liquor")
  ) {
    return "Alcohol";
  } else if (
    lowerCategory.includes("baby") ||
    lowerCategory.includes("infant")
  ) {
    return "Baby";
  } else if (
    lowerCategory.includes("pet") ||
    lowerCategory.includes("dog") ||
    lowerCategory.includes("cat")
  ) {
    return "Pet Supplies";
  } else if (
    lowerCategory.includes("health") ||
    lowerCategory.includes("beauty") ||
    lowerCategory.includes("personal care")
  ) {
    return "Health & Beauty";
  } else if (
    lowerCategory.includes("household") ||
    lowerCategory.includes("cleaning") ||
    lowerCategory.includes("paper")
  ) {
    return "Household";
  }
  return STORAGE_CATEGORIES[0];
};

export default function BarcodeScannerScreen({
  navigation,
}: BarcodeScannerScreenProps) {
  const [hasPermission, setHasPermission] = useState<boolean | null>(null);
  const [scanned, setScanned] = useState(false);
  const [loading, setLoading] = useState(false);
  const [flashMode, setFlashMode] = useState<"on" | "off">("off");
  const [cameraType, setCameraType] = useState<"front" | "back">("back");
  const [product, setProduct] = useState<BarcodeProduct | null>(null);
  const [saving, setSaving] = useState(false);
  const isFirstScan = useRef(true);
  const insets = useSafeAreaInsets();
  const scanTimeoutRef = useRef<NodeJS.Timeout | null>(null);
  const flashModeForCamera = flashMode === "on" ? "torch" : ("off" as const);

  const toggleFlash = () => {
    setFlashMode(flashMode === "on" ? "off" : "on");
  };

  const toggleCameraType = () => {
    setCameraType((current) => (current === "back" ? "front" : "back"));
  };

  useEffect(() => {
    (async () => {
      const { status } = await Camera.requestCameraPermissionsAsync();
      setHasPermission(status === "granted");
    })();
  }, []);

  const handleBarcodeLookup = async (barcode: string) => {
    if (!barcode || loading) return;

    setScanned(true);
    setLoading(true);

    try {
      const response = await lookupBarcode(barcode);

      if (!response || !response.product) {
        const errorProduct: BarcodeProduct = {
          attributes: {
            product: "Error",
            description: "Failed to perform barcode lookup",
            category: "",
            category_text: "Error",
            category_text_long: "Error",
            long_desc: "Failed to perform barcode lookup",
          },
          EAN13: barcode,
          UPCA: barcode,
          barcode: {
            EAN13: `error`,
            UPCA: `error`,
          },
          image: "",
          error: "Failed to perform barcode lookup",
        };
        setProduct(errorProduct);
        return;
      }

      const productData = response.product;
      const categoryGuess = mapCategoryToStorage(
        productData.attributes?.category || ""
      );

      setProduct({
        ...productData,
        unit: "pcs",
        attributes: {
          ...productData.attributes,
          category: STORAGE_CATEGORIES.includes(categoryGuess as any)
            ? categoryGuess
            : "Pantry",
        },
      });
    } catch (error) {
      console.error("Error looking up product:", error);
      Alert.alert(
        "Error",
        error instanceof Error ? error.message : "Unknown error occurred"
      );
      setProduct({
        attributes: {
          product: "Error",
          description: "Failed to perform barcode lookup",
          category: "",
          category_text: "Error",
          category_text_long: "Error",
          long_desc: "Failed to perform barcode lookup",
        },
        EAN13: barcode,
        UPCA: barcode,
        barcode: {
          EAN13: barcode,
          UPCA: barcode,
        },
        image: "",
        error:
          error instanceof Error ? error.message : "Unknown error occurred",
      });
    } finally {
      setLoading(false);
    }
  };

  // Create a debounced version of handleBarcodeLookup
  const debouncedBarcodeLookup = useCallback(
    debounce((barcode: string) => {
      handleBarcodeLookup(barcode);
    }, 500), // 500ms debounce time for subsequent scans
    []
  );

  const handleBarCodeScanned = useCallback(
    ({ data: barcode }: { data: string }) => {
      if (!barcode || scanned || loading) return;

      if (isFirstScan.current) {
        // First scan is immediate
        isFirstScan.current = false;
        handleBarcodeLookup(barcode);
      } else {
        // Subsequent scans use debounce
        debouncedBarcodeLookup(barcode);
      }
    },
    [scanned, loading, debouncedBarcodeLookup]
  );

  // Clean up on unmount
  useEffect(() => {
    return () => {
      if (scanTimeoutRef.current) {
        clearTimeout(scanTimeoutRef.current);
      }
    };
  }, []);

  const resetScanner = () => {
    setScanned(false);
    setProduct(null);
    setLoading(false);
    isFirstScan.current = true;
  };

  const handleScanAgain = () => {
    resetScanner();
  };

  const handleSaveToPantry = async () => {
    if (!product || !product.attributes?.product) {
      Alert.alert("Error", "Product information is incomplete");
      return;
    }

    setSaving(true);

    try {
      const categoryGuess = mapCategoryToStorage(
        product.attributes.category || ""
      );

      const productToSave: PantryItem = {
        id: product.EAN13 || product.UPCA || Date.now().toString(),
        title: product.attributes.product,
        category: STORAGE_CATEGORIES.includes(categoryGuess as any)
          ? categoryGuess
          : "Pantry",
        quantity: 1,
        unit: product.unit || "pcs",
        barcode: product.EAN13 || product.UPCA || "",
        imageUrl: product.image,
        description:
          product.attributes.long_desc || product.attributes.description,
        ...(product.attributes.asin_com && {
          asin: product.attributes.asin_com,
        }),
      };

      // Use the saveToPantry function from the pantry library
      await addToPantry(productToSave);

      Alert.alert(
        "Success",
        `${product.attributes.product} has been added to your pantry`,
        [
          {
            text: "Scan Another",
            onPress: resetScanner,
          },
          {
            text: "Done",
            onPress: () => navigation.goBack(),
            style: "default",
          },
        ]
      );
    } catch (error) {
      console.error("Error saving product:", error);
      Alert.alert(
        "Error",
        error instanceof Error ? error.message : "Failed to save product"
      );
    } finally {
      setSaving(false);
    }
  };

  const requestPermission = async () => {
    const { status } = await Camera.requestCameraPermissionsAsync();
    setHasPermission(status === "granted");
  };

  if (hasPermission === null) {
    return (
      <View style={styles.permissionContainer}>
        <ActivityIndicator size="large" color="#007AFF" />
        <Text style={styles.permissionText}>
          Requesting camera permission...
        </Text>
      </View>
    );
  }

  if (hasPermission === false) {
    return (
      <View style={styles.permissionContainer}>
        <MaterialIcons name="no-photography" size={48} color="#666" />
        <Text style={styles.permissionText}>
          Camera access is required to scan barcodes
        </Text>
        <Button title="Grant Permission" onPress={requestPermission} />
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
            flash={flashModeForCamera as any}
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

            <View
              style={[
                styles.bottomOverlay,
                { paddingBottom: insets.bottom + 20 },
              ]}
            >
              <View style={styles.buttonRow}>
                <TouchableOpacity
                  style={styles.iconButton}
                  onPress={toggleFlash}
                >
                  <MaterialIcons
                    name={flashMode === "on" ? "flash-on" : "flash-off"}
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
                  {product.attributes.product}
                </Text>
                {product.attributes.asin_com && (
                  <Text style={styles.productBrand}>
                    ASIN: {product.attributes.asin_com}
                  </Text>
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
                    <MaterialIcons
                      name="no-photography"
                      size={48}
                      color="#999"
                    />
                  </View>
                )}
              </View>

              <View style={styles.detailsContainer}>
                <View style={styles.detailRow}>
                  <Text style={styles.detailLabel}>EAN-13:</Text>
                  <Text style={styles.detailValue} numberOfLines={1}>
                    {product.EAN13}
                  </Text>
                </View>
                <View style={styles.detailRow}>
                  <Text style={styles.detailLabel}>UPC-A:</Text>
                  <Text style={styles.detailValue} numberOfLines={1}>
                    {product.UPCA}
                  </Text>
                </View>
                <View style={styles.detailRow}>
                  <Text style={styles.detailLabel}>Category:</Text>
                  <Text style={styles.detailValue}>
                    {product.attributes.category_text_long || "Not specified"}
                  </Text>
                </View>

                <View style={styles.quantityContainer}>
                  <Text style={styles.detailLabel}>Quantity:</Text>
                  <View style={styles.quantityControls}>
                    <TouchableOpacity
                      style={styles.quantityButton}
                      onPress={() =>
                        setProduct({
                          ...product,
                        })
                      }
                      disabled={saving}
                    >
                      <Text style={styles.quantityButtonText}>-</Text>
                    </TouchableOpacity>
                    <Text style={styles.quantityText}>{1}</Text>
                    <TouchableOpacity
                      style={styles.quantityButton}
                      onPress={() =>
                        setProduct({
                          ...product,
                        })
                      }
                      disabled={saving}
                    >
                      <Text style={styles.quantityButtonText}>+</Text>
                    </TouchableOpacity>
                  </View>
                </View>

                <View style={styles.buttonContainer}>
                  <TouchableOpacity
                    style={[styles.button, styles.primaryButton]}
                    onPress={handleSaveToPantry}
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
                    <Text style={[styles.buttonText, { color: "#007AFF" }]}>
                      Scan Again
                    </Text>
                  </TouchableOpacity>
                </View>
              </View>
            </View>
          ) : (
            <View style={styles.errorContainer}>
              <MaterialIcons name="error-outline" size={48} color="#FF3B30" />
              <Text style={styles.errorText}>
                {product || "Failed to load product information"}
              </Text>
              <TouchableOpacity
                style={[
                  styles.button,
                  styles.secondaryButton,
                  { marginTop: 20 },
                ]}
                onPress={() => setScanned(false)}
              >
                <Text style={[styles.buttonText, { color: "#007AFF" }]}>
                  Try Again
                </Text>
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
    backgroundColor: "#000",
  },
  permissionContainer: {
    flex: 1,
    justifyContent: "center",
    alignItems: "center",
    padding: 20,
    backgroundColor: "#fff",
  },
  permissionText: {
    marginTop: 16,
    fontSize: 16,
    textAlign: "center",
    color: "#666",
  },

  // Camera styles
  cameraContainer: {
    flex: 1,
    position: "relative",
  },
  camera: {
    flex: 1,
  },
  overlay: {
    ...StyleSheet.absoluteFillObject,
    backgroundColor: "rgba(0, 0, 0, 0.4)",
  },
  topOverlay: {
    position: "absolute",
    left: 0,
    right: 0,
    alignItems: "center",
  },
  overlayText: {
    color: "#fff",
    fontSize: 16,
    fontWeight: "500",
    textAlign: "center",
    backgroundColor: "rgba(0, 0, 0, 0.6)",
    padding: 8,
    borderRadius: 8,
  },
  middleOverlay: {
    flex: 1,
    justifyContent: "center",
    alignItems: "center",
  },
  viewfinder: {
    width: width * 0.7,
    height: width * 0.5,
    borderWidth: 2,
    borderColor: "#fff",
    borderRadius: 12,
    backgroundColor: "transparent",
    position: "relative",
  },
  cornerTopLeft: {
    position: "absolute",
    top: -2,
    left: -2,
    width: 40,
    height: 40,
    borderLeftWidth: 4,
    borderTopWidth: 4,
    borderColor: "#007AFF",
    borderTopLeftRadius: 8,
  },
  cornerTopRight: {
    position: "absolute",
    top: -2,
    right: -2,
    width: 40,
    height: 40,
    borderRightWidth: 4,
    borderTopWidth: 4,
    borderColor: "#007AFF",
    borderTopRightRadius: 8,
  },
  cornerBottomLeft: {
    position: "absolute",
    bottom: -2,
    left: -2,
    width: 40,
    height: 40,
    borderLeftWidth: 4,
    borderBottomWidth: 4,
    borderColor: "#007AFF",
    borderBottomLeftRadius: 8,
  },
  cornerBottomRight: {
    position: "absolute",
    bottom: -2,
    right: -2,
    width: 40,
    height: 40,
    borderRightWidth: 4,
    borderBottomWidth: 4,
    borderColor: "#007AFF",
    borderBottomRightRadius: 8,
  },
  bottomOverlay: {
    position: "absolute",
    left: 0,
    right: 0,
    alignItems: "center",
  },
  buttonRow: {
    flexDirection: "row",
    justifyContent: "space-between",
    alignItems: "center",
    width: "100%",
    paddingHorizontal: 40,
  },
  iconButton: {
    width: 60,
    height: 60,
    borderRadius: 30,
    backgroundColor: "rgba(0, 0, 0, 0.5)",
    justifyContent: "center",
    alignItems: "center",
  },
  scanIndicator: {
    width: 60,
    height: 60,
    justifyContent: "center",
    alignItems: "center",
  },
  scanLine: {
    width: 40,
    height: 4,
    backgroundColor: "#007AFF",
    borderRadius: 2,
  },

  // Result styles
  resultContainer: {
    flex: 1,
    backgroundColor: "#fff",
  },
  loadingContainer: {
    flex: 1,
    justifyContent: "center",
    alignItems: "center",
    padding: 20,
  },
  loadingText: {
    marginTop: 16,
    fontSize: 16,
    color: "#666",
  },
  errorContainer: {
    flex: 1,
    justifyContent: "center",
    alignItems: "center",
    padding: 20,
  },
  errorText: {
    marginTop: 16,
    fontSize: 16,
    color: "#FF3B30",
    textAlign: "center",
    marginBottom: 20,
  },
  productContainer: {
    flex: 1,
    padding: 20,
  },
  productHeader: {
    marginBottom: 20,
  },
  productTitle: {
    fontSize: 24,
    fontWeight: "bold",
    marginBottom: 4,
  },
  productBrand: {
    fontSize: 16,
    color: "#666",
  },
  imageContainer: {
    width: "100%",
    height: 200,
    backgroundColor: "#f5f5f5",
    borderRadius: 12,
    marginBottom: 20,
    overflow: "hidden",
    justifyContent: "center",
    alignItems: "center",
  },
  productImage: {
    width: "100%",
    height: "100%",
  },
  noImage: {
    justifyContent: "center",
    alignItems: "center",
  },
  detailsContainer: {
    flex: 1,
  },
  detailRow: {
    flexDirection: "row",
    justifyContent: "space-between",
    marginBottom: 16,
    alignItems: "center",
  },
  detailLabel: {
    fontSize: 16,
    color: "#666",
    flex: 1,
  },
  detailValue: {
    fontSize: 16,
    fontWeight: "500",
    flex: 2,
    textAlign: "right",
  },
  quantityContainer: {
    flexDirection: "row",
    justifyContent: "space-between",
    alignItems: "center",
    marginBottom: 24,
  },
  quantityControls: {
    flexDirection: "row",
    alignItems: "center",
  },
  quantityButton: {
    width: 40,
    height: 40,
    borderRadius: 20,
    backgroundColor: "#F2F2F7",
    justifyContent: "center",
    alignItems: "center",
  },
  quantityButtonText: {
    fontSize: 20,
    color: "#007AFF",
    lineHeight: 20,
  },
  quantityText: {
    fontSize: 18,
    fontWeight: "600",
    marginHorizontal: 16,
    minWidth: 30,
    textAlign: "center",
  },
  buttonContainer: {
    marginTop: "auto",
    marginBottom: 20,
  },
  button: {
    padding: 16,
    borderRadius: 12,
    justifyContent: "center",
    alignItems: "center",
    marginBottom: 12,
  },
  primaryButton: {
    backgroundColor: "#007AFF",
  },
  secondaryButton: {
    backgroundColor: "#F2F2F7",
  },
  buttonText: {
    color: "#fff",
    fontSize: 16,
    fontWeight: "600",
  },
});
