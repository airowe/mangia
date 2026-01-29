// components/pantry/EmptyPantryState.tsx
// Empty state illustration for when the pantry has no items
// Design reference: empty_pantry_state/code.html

import React from "react";
import {
  View,
  Text,
  StyleSheet,
  TouchableOpacity,
  Dimensions,
} from "react-native";
import { MaterialCommunityIcons } from "@expo/vector-icons";
import ReanimatedAnimated, { FadeIn, FadeInUp, SlideInUp } from "react-native-reanimated";
import { LinearGradient } from "expo-linear-gradient";

import { mangiaColors } from "../../theme/tokens/colors";
import { fontFamily } from "../../theme/tokens/typography";

const { width: SCREEN_WIDTH } = Dimensions.get("window");

interface EmptyPantryStateProps {
  onScanPantry?: () => void;
  onAddManually?: () => void;
}

export const EmptyPantryState = React.memo<EmptyPantryStateProps>(function EmptyPantryState({
  onScanPantry,
  onAddManually,
}) {
  return (
    <ReanimatedAnimated.View
      style={styles.container}
      entering={FadeIn.duration(500)}
    >
      {/* Illustration Container */}
      <ReanimatedAnimated.View
        style={styles.illustrationContainer}
        entering={FadeInUp.delay(100).duration(600)}
      >
        {/* Decorative gradient blob */}
        <LinearGradient
          colors={[`${mangiaColors.terracotta}08`, 'transparent']}
          start={{ x: 0, y: 0 }}
          end={{ x: 1, y: 1 }}
          style={styles.gradientBlob}
        />

        {/* Floating shelves illustration */}
        <View style={styles.illustration}>
          {/* Top shelf */}
          <View style={styles.shelf}>
            <View style={styles.shelfLine} />
            <View style={[styles.jar, styles.jarSmall]}>
              <MaterialCommunityIcons
                name="bottle-wine-outline"
                size={20}
                color={mangiaColors.taupe}
              />
            </View>
          </View>

          {/* Middle shelf */}
          <View style={styles.shelf}>
            <View style={styles.shelfLine} />
            <View style={[styles.jar, styles.jarMedium]}>
              <MaterialCommunityIcons
                name="food-variant"
                size={28}
                color={mangiaColors.brown}
              />
            </View>
            <View style={[styles.jar, styles.jarTall]}>
              <MaterialCommunityIcons
                name="shaker-outline"
                size={24}
                color={mangiaColors.taupe}
              />
            </View>
          </View>

          {/* Bottom shelf - mostly empty */}
          <View style={styles.shelf}>
            <View style={styles.shelfLine} />
            <View style={[styles.jar, styles.jarWide, styles.jarEmpty]}>
              <MaterialCommunityIcons
                name="dots-horizontal"
                size={24}
                color={`${mangiaColors.taupe}50`}
              />
            </View>
          </View>

          {/* Decorative floating elements */}
          <ReanimatedAnimated.View
            style={styles.floatingDot1}
            entering={FadeIn.delay(400).duration(800)}
          />
          <ReanimatedAnimated.View
            style={styles.floatingDot2}
            entering={FadeIn.delay(600).duration(800)}
          />
        </View>
      </ReanimatedAnimated.View>

      {/* Text Content */}
      <ReanimatedAnimated.View
        style={styles.textContainer}
        entering={FadeInUp.delay(200).duration(600)}
      >
        <Text style={styles.headline}>
          Your Pantry{"\n"}is Quiet
        </Text>
        <Text style={styles.description}>
          Start building your digital kitchen by scanning your ingredients to discover what you can cook.
        </Text>
      </ReanimatedAnimated.View>

      {/* Actions */}
      <ReanimatedAnimated.View
        style={styles.actionsContainer}
        entering={FadeInUp.delay(300).duration(600)}
      >
        {/* Primary Button - Scan Pantry */}
        <TouchableOpacity
          style={styles.primaryButton}
          onPress={onScanPantry}
          activeOpacity={0.9}
        >
          <MaterialCommunityIcons
            name="camera-outline"
            size={22}
            color={mangiaColors.white}
          />
          <Text style={styles.primaryButtonText}>Scan Your Pantry</Text>
        </TouchableOpacity>

        {/* Secondary Link - Add Manually */}
        <TouchableOpacity
          style={styles.secondaryButton}
          onPress={onAddManually}
          activeOpacity={0.7}
        >
          <Text style={styles.secondaryButtonText}>Add items manually</Text>
        </TouchableOpacity>
      </ReanimatedAnimated.View>
    </ReanimatedAnimated.View>
  );
});

EmptyPantryState.displayName = 'EmptyPantryState';

const styles = StyleSheet.create({
  container: {
    flex: 1,
    alignItems: "center",
    justifyContent: "center",
    paddingHorizontal: 24,
    paddingBottom: 32,
  },

  // Illustration
  illustrationContainer: {
    width: Math.min(SCREEN_WIDTH - 48, 320),
    aspectRatio: 1,
    marginBottom: 32,
    alignItems: "center",
    justifyContent: "center",
  },
  gradientBlob: {
    position: "absolute",
    width: "100%",
    height: "100%",
    borderRadius: 999,
    transform: [{ scale: 0.9 }],
  },
  illustration: {
    width: "80%",
    height: "80%",
    justifyContent: "space-evenly",
  },
  shelf: {
    flexDirection: "row",
    alignItems: "flex-end",
    justifyContent: "center",
    paddingHorizontal: 16,
    gap: 12,
    position: "relative",
  },
  shelfLine: {
    position: "absolute",
    bottom: 0,
    left: 0,
    right: 0,
    height: 2,
    backgroundColor: `${mangiaColors.brown}20`,
    borderRadius: 1,
  },
  jar: {
    backgroundColor: `${mangiaColors.cream}`,
    borderWidth: 1,
    borderColor: `${mangiaColors.brown}15`,
    borderRadius: 8,
    alignItems: "center",
    justifyContent: "center",
    shadowColor: "#000",
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.05,
    shadowRadius: 4,
    elevation: 2,
  },
  jarSmall: {
    width: 36,
    height: 48,
    borderTopLeftRadius: 4,
    borderTopRightRadius: 4,
  },
  jarMedium: {
    width: 52,
    height: 56,
    borderRadius: 12,
  },
  jarTall: {
    width: 32,
    height: 64,
    borderTopLeftRadius: 4,
    borderTopRightRadius: 4,
  },
  jarWide: {
    width: 72,
    height: 44,
    borderRadius: 10,
  },
  jarEmpty: {
    backgroundColor: "transparent",
    borderStyle: "dashed",
    borderColor: `${mangiaColors.taupe}40`,
  },
  floatingDot1: {
    position: "absolute",
    top: "15%",
    right: "20%",
    width: 8,
    height: 8,
    borderRadius: 4,
    backgroundColor: `${mangiaColors.sage}40`,
  },
  floatingDot2: {
    position: "absolute",
    bottom: "25%",
    left: "15%",
    width: 6,
    height: 6,
    borderRadius: 3,
    backgroundColor: `${mangiaColors.terracotta}30`,
  },

  // Text
  textContainer: {
    alignItems: "center",
    maxWidth: 320,
    marginBottom: 40,
  },
  headline: {
    fontFamily: fontFamily.serif,
    fontSize: 40,
    fontWeight: "500",
    color: mangiaColors.dark,
    textAlign: "center",
    lineHeight: 48,
    letterSpacing: -0.5,
    marginBottom: 16,
  },
  description: {
    fontFamily: fontFamily.regular,
    fontSize: 16,
    color: mangiaColors.brown,
    textAlign: "center",
    lineHeight: 24,
  },

  // Actions
  actionsContainer: {
    width: "100%",
    maxWidth: 320,
    alignItems: "center",
    gap: 20,
  },
  primaryButton: {
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "center",
    width: "100%",
    height: 56,
    backgroundColor: mangiaColors.terracotta,
    borderRadius: 16,
    gap: 8,
    shadowColor: mangiaColors.terracotta,
    shadowOffset: { width: 0, height: 8 },
    shadowOpacity: 0.25,
    shadowRadius: 16,
    elevation: 8,
  },
  primaryButtonText: {
    fontFamily: fontFamily.bold,
    fontSize: 18,
    color: mangiaColors.white,
    letterSpacing: 0.5,
  },
  secondaryButton: {
    paddingVertical: 8,
    paddingHorizontal: 4,
  },
  secondaryButtonText: {
    fontFamily: fontFamily.medium,
    fontSize: 14,
    color: mangiaColors.brown,
  },
});

export default EmptyPantryState;
