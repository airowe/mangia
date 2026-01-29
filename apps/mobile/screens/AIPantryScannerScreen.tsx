// screens/AIPantryScannerScreen.tsx
// AI-powered pantry scanner with camera viewfinder
// Design reference: ai_pantry_scanner_1/code.html, ai_pantry_scanner_2/code.html

import React, { useState, useCallback, useEffect, useRef } from "react";
import {
  View,
  Text,
  StyleSheet,
  TouchableOpacity,
  Dimensions,
  StatusBar,
  Alert,
  ActivityIndicator,
} from "react-native";
import { MaterialCommunityIcons } from "@expo/vector-icons";
import { useNavigation } from "@react-navigation/native";
import { NativeStackNavigationProp } from "@react-navigation/native-stack";
import { CameraView, useCameraPermissions } from "expo-camera";
import ReanimatedAnimated, {
  FadeIn,
  FadeInUp,
  useAnimatedStyle,
  useSharedValue,
  withRepeat,
  withTiming,
  withSequence,
  Easing,
} from "react-native-reanimated";
import { useSafeAreaInsets } from "react-native-safe-area-context";

import { mangiaColors } from "../theme/tokens/colors";
import { fontFamily } from "../theme/tokens/typography";
import { scanPantryImage } from "../lib/pantry";
import { PantryStackParamList } from "../navigation/PantryStack";

const { width: SCREEN_WIDTH, height: SCREEN_HEIGHT } = Dimensions.get("window");

type NavigationProp = NativeStackNavigationProp<PantryStackParamList, "AIPantryScannerScreen">;

export default function AIPantryScannerScreen() {
  const navigation = useNavigation<NavigationProp>();
  const insets = useSafeAreaInsets();
  const cameraRef = useRef<CameraView>(null);

  const [permission, requestPermission] = useCameraPermissions();
  const [flashOn, setFlashOn] = useState(false);
  const [isCapturing, setIsCapturing] = useState(false);

  // Pulsing animation for the scanner indicator
  const pulseScale = useSharedValue(1);

  useEffect(() => {
    pulseScale.value = withRepeat(
      withSequence(
        withTiming(1.2, { duration: 1000, easing: Easing.ease }),
        withTiming(1, { duration: 1000, easing: Easing.ease })
      ),
      -1,
      false
    );
  }, []);

  const pulseStyle = useAnimatedStyle(() => ({
    transform: [{ scale: pulseScale.value }],
    opacity: 2 - pulseScale.value,
  }));

  // Request camera permission on mount
  useEffect(() => {
    if (!permission?.granted) {
      requestPermission();
    }
  }, [permission]);

  const handleClose = useCallback(() => {
    navigation.goBack();
  }, [navigation]);

  const handleCapture = useCallback(async () => {
    if (!cameraRef.current || isCapturing) return;

    setIsCapturing(true);
    try {
      // Capture photo as base64 JPEG
      const photo = await cameraRef.current.takePictureAsync({
        base64: true,
        quality: 0.7, // Compress to keep under 4MB
      });

      if (!photo?.base64) {
        Alert.alert("Error", "Failed to capture photo. Please try again.");
        return;
      }

      // Send to server for AI analysis
      const items = await scanPantryImage(photo.base64);

      if (items.length === 0) {
        Alert.alert(
          "No Items Found",
          "We couldn't identify any food items in this photo. Try taking a clearer photo.",
          [{ text: "OK" }],
        );
        return;
      }

      // Navigate to confirmation screen with real data
      navigation.navigate("ConfirmScannedItemsScreen", {
        scannedItems: items,
      });
    } catch (error: any) {
      const message =
        error?.code === "PREMIUM_REQUIRED"
          ? "AI Pantry Scanner is a premium feature. Upgrade to use it."
          : "Failed to scan image. Please try again.";
      Alert.alert("Scan Error", message);
    } finally {
      setIsCapturing(false);
    }
  }, [navigation, isCapturing]);

  const toggleFlash = useCallback(() => {
    setFlashOn((prev) => !prev);
  }, []);

  // Show permission request if not granted
  if (!permission?.granted) {
    return (
      <View style={[styles.container, styles.permissionContainer]}>
        <StatusBar barStyle="light-content" />
        <MaterialCommunityIcons name="camera-off" size={48} color={`${mangiaColors.white}60`} />
        <Text style={styles.permissionText}>Camera access is required to scan your pantry.</Text>
        <TouchableOpacity style={styles.permissionButton} onPress={requestPermission}>
          <Text style={styles.permissionButtonText}>Grant Access</Text>
        </TouchableOpacity>
        <TouchableOpacity onPress={handleClose} style={{ marginTop: 16 }}>
          <Text style={[styles.permissionButtonText, { color: `${mangiaColors.white}80` }]}>Go Back</Text>
        </TouchableOpacity>
      </View>
    );
  }

  return (
    <View style={styles.container}>
      <StatusBar barStyle="light-content" />

      {/* Camera Background */}
      <CameraView
        ref={cameraRef}
        style={styles.cameraBackground}
        facing="back"
        flash={flashOn ? "on" : "off"}
      />

      {/* Gradient Overlay */}
      <View style={styles.gradientOverlay} />

      {/* Top Bar */}
      <ReanimatedAnimated.View
        entering={FadeIn.duration(400)}
        style={[styles.topBar, { paddingTop: insets.top + 12 }]}
      >
        <TouchableOpacity
          style={styles.iconButton}
          onPress={handleClose}
          activeOpacity={0.7}
        >
          <MaterialCommunityIcons name="close" size={24} color={mangiaColors.white} />
        </TouchableOpacity>

        {/* Scanner Status Pill */}
        <View style={styles.statusPill}>
          <View style={styles.pulseContainer}>
            <ReanimatedAnimated.View style={[styles.pulseDot, pulseStyle]} />
            <View style={styles.solidDot} />
          </View>
          <Text style={styles.statusText}>
            {isCapturing ? "Scanning..." : "AI Vision Active"}
          </Text>
        </View>

        <TouchableOpacity style={styles.iconButton} activeOpacity={0.7}>
          <MaterialCommunityIcons name="dots-vertical" size={24} color={mangiaColors.white} />
        </TouchableOpacity>
      </ReanimatedAnimated.View>

      {/* Scanner Viewfinder */}
      <View style={styles.viewfinderContainer}>
        {/* Corner Markers */}
        <View style={[styles.corner, styles.cornerTL]} />
        <View style={[styles.corner, styles.cornerTR]} />
        <View style={[styles.corner, styles.cornerBL]} />
        <View style={[styles.corner, styles.cornerBR]} />
      </View>

      {/* Instruction Text */}
      <ReanimatedAnimated.View
        entering={FadeInUp.delay(200).duration(400)}
        style={styles.instructionContainer}
      >
        <Text style={styles.instructionText}>
          {isCapturing
            ? "Analyzing your pantry..."
            : "Point at your pantry or fridge and tap capture."}
        </Text>
      </ReanimatedAnimated.View>

      {/* Bottom Controls */}
      <View style={[styles.bottomControls, { paddingBottom: insets.bottom + 24 }]}>
        {/* Control Buttons Row */}
        <View style={styles.controlsRow}>
          {/* Spacer for thumbnail */}
          <View style={styles.thumbnailButton} />

          {/* Capture Button */}
          <TouchableOpacity
            style={[styles.captureButton, isCapturing && { opacity: 0.5 }]}
            onPress={handleCapture}
            disabled={isCapturing}
            activeOpacity={0.9}
          >
            <View style={styles.captureButtonInner}>
              {isCapturing ? (
                <ActivityIndicator size="large" color={mangiaColors.white} />
              ) : (
                <MaterialCommunityIcons name="camera" size={32} color={mangiaColors.white} />
              )}
            </View>
          </TouchableOpacity>

          {/* Flash Toggle */}
          <TouchableOpacity
            style={[styles.flashButton, flashOn && styles.flashButtonOn]}
            onPress={toggleFlash}
            activeOpacity={0.8}
          >
            <MaterialCommunityIcons
              name={flashOn ? "flash" : "flash-off"}
              size={24}
              color={mangiaColors.white}
            />
          </TouchableOpacity>
        </View>

        {/* Page Indicator Dots */}
        <View style={styles.pageIndicator}>
          <View style={[styles.dot, styles.dotActive]} />
          <View style={styles.dot} />
          <View style={styles.dot} />
        </View>
      </View>
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: "#000",
  },

  // Permission screen
  permissionContainer: {
    justifyContent: "center",
    alignItems: "center",
    gap: 16,
    paddingHorizontal: 32,
  },
  permissionText: {
    fontFamily: fontFamily.regular,
    fontSize: 16,
    color: `${mangiaColors.white}80`,
    textAlign: "center",
    lineHeight: 24,
  },
  permissionButton: {
    paddingHorizontal: 24,
    paddingVertical: 12,
    borderRadius: 24,
    backgroundColor: mangiaColors.terracotta,
    marginTop: 8,
  },
  permissionButtonText: {
    fontFamily: fontFamily.medium,
    fontSize: 16,
    color: mangiaColors.white,
  },

  // Camera Background
  cameraBackground: {
    ...StyleSheet.absoluteFillObject,
  },

  // Gradient Overlay
  gradientOverlay: {
    ...StyleSheet.absoluteFillObject,
    backgroundColor: "transparent",
  },

  // Top Bar
  topBar: {
    position: "absolute",
    top: 0,
    left: 0,
    right: 0,
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "space-between",
    paddingHorizontal: 24,
    paddingBottom: 16,
    zIndex: 10,
  },
  iconButton: {
    width: 40,
    height: 40,
    borderRadius: 20,
    backgroundColor: "rgba(0, 0, 0, 0.2)",
    justifyContent: "center",
    alignItems: "center",
  },
  statusPill: {
    flexDirection: "row",
    alignItems: "center",
    gap: 8,
    paddingHorizontal: 16,
    paddingVertical: 8,
    borderRadius: 20,
    backgroundColor: "rgba(0, 0, 0, 0.4)",
    borderWidth: 1,
    borderColor: "rgba(255, 255, 255, 0.1)",
  },
  pulseContainer: {
    width: 8,
    height: 8,
    justifyContent: "center",
    alignItems: "center",
  },
  pulseDot: {
    position: "absolute",
    width: 8,
    height: 8,
    borderRadius: 4,
    backgroundColor: mangiaColors.terracotta,
  },
  solidDot: {
    width: 8,
    height: 8,
    borderRadius: 4,
    backgroundColor: mangiaColors.terracotta,
  },
  statusText: {
    fontFamily: fontFamily.medium,
    fontSize: 11,
    color: mangiaColors.white,
    letterSpacing: 1,
    textTransform: "uppercase",
  },

  // Viewfinder
  viewfinderContainer: {
    flex: 1,
    justifyContent: "center",
    alignItems: "center",
    paddingHorizontal: 32,
    marginTop: 80,
    marginBottom: 120,
  },
  corner: {
    position: "absolute",
    width: 32,
    height: 32,
    borderColor: "rgba(255, 255, 255, 0.7)",
  },
  cornerTL: {
    top: 0,
    left: 0,
    borderTopWidth: 2,
    borderLeftWidth: 2,
    borderTopLeftRadius: 16,
  },
  cornerTR: {
    top: 0,
    right: 0,
    borderTopWidth: 2,
    borderRightWidth: 2,
    borderTopRightRadius: 4,
  },
  cornerBL: {
    bottom: 0,
    left: 0,
    borderBottomWidth: 2,
    borderLeftWidth: 2,
    borderBottomLeftRadius: 4,
  },
  cornerBR: {
    bottom: 0,
    right: 0,
    borderBottomWidth: 2,
    borderRightWidth: 2,
    borderBottomRightRadius: 16,
  },

  // Instruction
  instructionContainer: {
    position: "absolute",
    bottom: 240,
    left: 0,
    right: 0,
    paddingHorizontal: 48,
    alignItems: "center",
  },
  instructionText: {
    fontFamily: fontFamily.serif,
    fontSize: 28,
    fontWeight: "300",
    fontStyle: "italic",
    color: mangiaColors.white,
    textAlign: "center",
    lineHeight: 36,
    textShadowColor: "rgba(0, 0, 0, 0.5)",
    textShadowOffset: { width: 0, height: 2 },
    textShadowRadius: 8,
  },

  // Bottom Controls
  bottomControls: {
    position: "absolute",
    bottom: 0,
    left: 0,
    right: 0,
    paddingHorizontal: 32,
    alignItems: "center",
  },

  // Control Buttons
  controlsRow: {
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "space-between",
    width: "100%",
    marginBottom: 24,
  },
  thumbnailButton: {
    width: 56,
    height: 56,
  },
  captureButton: {
    width: 80,
    height: 80,
    borderRadius: 40,
    borderWidth: 4,
    borderColor: "rgba(255, 255, 255, 0.2)",
    padding: 4,
  },
  captureButtonInner: {
    flex: 1,
    borderRadius: 36,
    backgroundColor: mangiaColors.terracotta,
    justifyContent: "center",
    alignItems: "center",
    shadowColor: mangiaColors.terracotta,
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.4,
    shadowRadius: 12,
    elevation: 8,
  },
  flashButton: {
    width: 56,
    height: 56,
    borderRadius: 28,
    backgroundColor: "rgba(0, 0, 0, 0.4)",
    justifyContent: "center",
    alignItems: "center",
    borderWidth: 1,
    borderColor: "rgba(255, 255, 255, 0.1)",
  },
  flashButtonOn: {
    backgroundColor: "rgba(255, 255, 255, 0.2)",
  },

  // Page Indicator
  pageIndicator: {
    flexDirection: "row",
    gap: 4,
  },
  dot: {
    width: 4,
    height: 4,
    borderRadius: 2,
    backgroundColor: "rgba(255, 255, 255, 0.3)",
  },
  dotActive: {
    backgroundColor: "rgba(255, 255, 255, 0.8)",
  },
});
