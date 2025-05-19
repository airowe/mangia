import React, { useEffect, useState } from "react";
import {
  View,
  Text,
  StyleSheet,
  Button,
  ActivityIndicator,
  Image,
  Alert,
} from "react-native";
import { supabase } from "../lib/supabase";
import { CameraView, Camera } from "expo-camera";

export default function BarcodeScannerScreen() {
  const [hasPermission, setHasPermission] = useState<boolean | null>(null);
  const [scanned, setScanned] = useState(false);
  const [product, setProduct] = useState<any>(null);
  const [loading, setLoading] = useState(false);

  const apiURL =
    process.env.EXPO_PUBLIC_API_URL;

  useEffect(() => {
    (async () => {
      const { status } = await Camera.requestCameraPermissionsAsync();
      setHasPermission(status === "granted");
    })();
  }, []);

  const handleBarCodeScanned = async ({ data }: { data: string }) => {
    setScanned(true);
    setLoading(true);
    setProduct(null);

    try {
      const response = await fetch(`${apiURL}/lookup-barcode?barcode=${data}`);
      const json = await response.json();

      if (!response.ok) {
        Alert.alert("Not Found", json.error || "Product not found.");
      } else {
        setProduct(json);
      }
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

  if (hasPermission === null) {
    return <Text>Requesting camera permission...</Text>;
  }
  if (hasPermission === false) {
    return <Text>No access to camera</Text>;
  }

  return (
    <View style={styles.container}>
      {!scanned ? (

      <CameraView
        onBarcodeScanned={scanned ? undefined : handleBarCodeScanned}
        barcodeScannerSettings={{
          barcodeTypes: ["qr", "pdf417"],
        }}
        style={StyleSheet.absoluteFillObject}
      />
      ) : (
        <View style={styles.resultContainer}>
          {loading ? (
            <ActivityIndicator size="large" />
          ) : product ? (
            <>
              <Text style={styles.title}>{product.title}</Text>
              <Text>{product.brand}</Text>
              <Text>{product.category}</Text>
              {product.image && (
                <Image
                  source={{ uri: product.image }}
                  style={{ width: 150, height: 150 }}
                />
              )}
              <Button title="Save to Pantry" onPress={saveToPantry} />
              <Button title="Scan Another" onPress={() => setScanned(false)} />
            </>
          ) : (
            <>
              <Text>No product info</Text>
              <Button title="Try Again" onPress={() => setScanned(false)} />
            </>
          )}
        </View>
      )}
    </View>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1 },
  resultContainer: {
    flex: 1,
    justifyContent: "center",
    alignItems: "center",
    padding: 20,
  },
  title: { fontSize: 18, fontWeight: "bold", marginBottom: 10 },
});
