// screens/AIPantryScannerScreen.tsx
// AI-powered pantry scanner with camera viewfinder
// Design reference: ai_pantry_scanner_1/code.html, ai_pantry_scanner_2/code.html

import React, { useState, useCallback, useEffect } from "react";
import {
  View,
  Text,
  StyleSheet,
  TouchableOpacity,
  Dimensions,
  StatusBar,
} from "react-native";
import { Image } from "expo-image";
import { MaterialCommunityIcons } from "@expo/vector-icons";
import { useNavigation } from "@react-navigation/native";
import ReanimatedAnimated, {
  FadeIn,
  FadeInUp,
  FadeOut,
  useAnimatedStyle,
  useSharedValue,
  withRepeat,
  withTiming,
  withSequence,
  Easing,
} from "react-native-reanimated";
import { useSafeAreaInsets } from "react-native-safe-area-context";
import { BlurView } from "expo-blur";

import { mangiaColors } from "../theme/tokens/colors";
import { fontFamily } from "../theme/tokens/typography";

const { width: SCREEN_WIDTH, height: SCREEN_HEIGHT } = Dimensions.get("window");

// Simulated detected items for demo
interface DetectedItem {
  id: string;
  name: string;
  top: number;
  left?: number;
  right?: number;
}

export default function AIPantryScannerScreen() {
  const navigation = useNavigation();
  const insets = useSafeAreaInsets();

  const [flashOn, setFlashOn] = useState(false);
  const [isScanning, setIsScanning] = useState(true);
  const [detectedExpiry, setDetectedExpiry] = useState<string | null>(null);
  const [detectedItems] = useState<DetectedItem[]>([
    { id: "1", name: "San Marzano Tomatoes", top: 80, left: 40 },
    { id: "2", name: "Arborio Rice", top: 280, right: 60 },
  ]);

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

  // Simulate detection after a delay
  useEffect(() => {
    const timer = setTimeout(() => {
      setDetectedExpiry("Oct 12, 2024");
    }, 3000);
    return () => clearTimeout(timer);
  }, []);

  const handleClose = useCallback(() => {
    navigation.goBack();
  }, [navigation]);

  const handleCapture = useCallback(() => {
    // Navigate to confirm scanned items screen
    // navigation.navigate("ConfirmScannedItemsScreen");
  }, [navigation]);

  const toggleFlash = useCallback(() => {
    setFlashOn((prev) => !prev);
  }, []);

  return (
    <View style={styles.container}>
      <StatusBar barStyle="light-content" />

      {/* Camera Background (placeholder) */}
      <View style={styles.cameraBackground}>
        <View style={styles.cameraPlaceholder}>
          <MaterialCommunityIcons
            name="camera"
            size={48}
            color={`${mangiaColors.white}30`}
          />
          <Text style={styles.cameraPlaceholderText}>Camera Preview</Text>
        </View>
      </View>

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
          <Text style={styles.statusText}>AI Vision Active</Text>
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

        {/* Detection Box (when scanning) */}
        {isScanning && (
          <ReanimatedAnimated.View
            entering={FadeIn.duration(300)}
            style={styles.detectionBox}
          >
            <View style={styles.detectionTooltip}>
              <Text style={styles.detectionTooltipText}>Detecting Date...</Text>
              <View style={styles.tooltipArrow} />
            </View>
          </ReanimatedAnimated.View>
        )}

        {/* Floating Item Tags */}
        {detectedItems.map((item) => (
          <ReanimatedAnimated.View
            key={item.id}
            entering={FadeIn.delay(500).duration(400)}
            style={[
              styles.itemTag,
              {
                top: item.top,
                left: item.left,
                right: item.right,
              },
            ]}
          >
            {item.left !== undefined && (
              <>
                <View style={styles.itemDot} />
                <Text style={styles.itemTagText}>{item.name}</Text>
              </>
            )}
            {item.right !== undefined && (
              <>
                <Text style={styles.itemTagText}>{item.name}</Text>
                <View style={styles.itemDot} />
              </>
            )}
          </ReanimatedAnimated.View>
        ))}
      </View>

      {/* Instruction Text */}
      <ReanimatedAnimated.View
        entering={FadeInUp.delay(200).duration(400)}
        style={styles.instructionContainer}
      >
        <Text style={styles.instructionText}>
          Align the date within the frame to scan expiration.
        </Text>
      </ReanimatedAnimated.View>

      {/* Bottom Controls */}
      <View style={[styles.bottomControls, { paddingBottom: insets.bottom + 24 }]}>
        {/* Expiry Detection Toast */}
        {detectedExpiry && (
          <ReanimatedAnimated.View
            entering={FadeInUp.duration(400)}
            style={styles.expiryToast}
          >
            <View style={styles.expiryCheckmark}>
              <MaterialCommunityIcons name="check" size={14} color={mangiaColors.sage} />
            </View>
            <Text style={styles.expiryToastText}>
              Expiration detected: {detectedExpiry}
            </Text>
          </ReanimatedAnimated.View>
        )}

        {/* Control Buttons Row */}
        <View style={styles.controlsRow}>
          {/* Recent Scan Thumbnail */}
          <TouchableOpacity style={styles.thumbnailButton} activeOpacity={0.8}>
            <View style={styles.thumbnailPlaceholder}>
              <MaterialCommunityIcons
                name="image"
                size={20}
                color={`${mangiaColors.white}60`}
              />
            </View>
          </TouchableOpacity>

          {/* Capture Button */}
          <TouchableOpacity
            style={styles.captureButton}
            onPress={handleCapture}
            activeOpacity={0.9}
          >
            <View style={styles.captureButtonInner}>
              <MaterialCommunityIcons name="camera" size={32} color={mangiaColors.white} />
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

  // Camera Background
  cameraBackground: {
    ...StyleSheet.absoluteFillObject,
    backgroundColor: "#1a1a1a",
  },
  cameraPlaceholder: {
    flex: 1,
    justifyContent: "center",
    alignItems: "center",
    gap: 12,
  },
  cameraPlaceholderText: {
    fontFamily: fontFamily.regular,
    fontSize: 14,
    color: `${mangiaColors.white}40`,
  },

  // Gradient Overlay
  gradientOverlay: {
    ...StyleSheet.absoluteFillObject,
    backgroundColor: "transparent",
    // Simulated gradient with partial overlays
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

  // Detection Box
  detectionBox: {
    position: "absolute",
    top: "45%",
    left: "25%",
    width: 128,
    height: 48,
    borderRadius: 8,
    borderWidth: 2,
    borderColor: mangiaColors.sage,
    backgroundColor: `${mangiaColors.sage}15`,
    shadowColor: mangiaColors.sage,
    shadowOffset: { width: 0, height: 0 },
    shadowOpacity: 0.6,
    shadowRadius: 15,
    elevation: 8,
  },
  detectionTooltip: {
    position: "absolute",
    top: -32,
    left: "50%",
    transform: [{ translateX: -40 }],
    backgroundColor: "#4a6347",
    paddingHorizontal: 8,
    paddingVertical: 4,
    borderRadius: 4,
  },
  detectionTooltipText: {
    fontFamily: fontFamily.medium,
    fontSize: 10,
    color: mangiaColors.white,
  },
  tooltipArrow: {
    position: "absolute",
    bottom: -6,
    left: "50%",
    marginLeft: -6,
    width: 0,
    height: 0,
    borderLeftWidth: 6,
    borderRightWidth: 6,
    borderTopWidth: 6,
    borderLeftColor: "transparent",
    borderRightColor: "transparent",
    borderTopColor: "#4a6347",
  },

  // Item Tags
  itemTag: {
    position: "absolute",
    flexDirection: "row",
    alignItems: "center",
    gap: 8,
    opacity: 0.5,
  },
  itemDot: {
    width: 8,
    height: 8,
    borderRadius: 4,
    backgroundColor: mangiaColors.terracotta,
    shadowColor: mangiaColors.terracotta,
    shadowOffset: { width: 0, height: 0 },
    shadowOpacity: 0.8,
    shadowRadius: 10,
    elevation: 4,
  },
  itemTagText: {
    fontFamily: fontFamily.regular,
    fontSize: 10,
    color: mangiaColors.white,
    backgroundColor: "rgba(0, 0, 0, 0.5)",
    paddingHorizontal: 8,
    paddingVertical: 4,
    borderRadius: 4,
    overflow: "hidden",
    letterSpacing: 0.5,
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
  expiryToast: {
    flexDirection: "row",
    alignItems: "center",
    gap: 8,
    paddingHorizontal: 16,
    paddingVertical: 12,
    marginBottom: 32,
    borderRadius: 24,
    backgroundColor: `${mangiaColors.sage}E6`,
    borderWidth: 1,
    borderColor: "rgba(255, 255, 255, 0.2)",
    shadowColor: "#000",
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.2,
    shadowRadius: 12,
    elevation: 8,
  },
  expiryCheckmark: {
    width: 20,
    height: 20,
    borderRadius: 10,
    backgroundColor: mangiaColors.white,
    justifyContent: "center",
    alignItems: "center",
  },
  expiryToastText: {
    fontFamily: fontFamily.medium,
    fontSize: 14,
    color: mangiaColors.white,
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
    borderRadius: 24,
    borderTopRightRadius: 4,
    overflow: "hidden",
    borderWidth: 1,
    borderColor: "rgba(255, 255, 255, 0.2)",
  },
  thumbnailPlaceholder: {
    flex: 1,
    backgroundColor: "rgba(0, 0, 0, 0.4)",
    justifyContent: "center",
    alignItems: "center",
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
