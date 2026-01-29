// components/pantry/ExpiringNotificationCard.tsx
// Notification-style card for expiring items (lock screen aesthetic)
// Design reference: expiring_items_notification/code.html

import React from "react";
import {
  View,
  Text,
  StyleSheet,
  TouchableOpacity,
} from "react-native";
import { Image } from "expo-image";
import { MaterialCommunityIcons } from "@expo/vector-icons";
import { BlurView } from "expo-blur";
import ReanimatedAnimated, { FadeInDown, FadeInUp } from "react-native-reanimated";

import { mangiaColors } from "../../theme/tokens/colors";
import { fontFamily } from "../../theme/tokens/typography";

interface ExpiringItem {
  id: string;
  name: string;
  imageUrl?: string;
}

interface ExpiringNotificationCardProps {
  items: ExpiringItem[];
  timestamp?: string;
  onViewRecipes?: () => void;
  onAddToShoppingList?: () => void;
  onDismiss?: () => void;
}

export function ExpiringNotificationCard({
  items,
  timestamp = "now",
  onViewRecipes,
  onAddToShoppingList,
  onDismiss,
}: ExpiringNotificationCardProps) {
  // Build message based on items
  const itemNames = items.map((i) => i.name);
  const message =
    itemNames.length === 1
      ? `Your ${itemNames[0]} is about to expire. Want to find a recipe to use it?`
      : itemNames.length === 2
      ? `Your ${itemNames[0]} and ${itemNames[1]} are about to expire. Want to find a recipe to use them?`
      : `Your ${itemNames.slice(0, -1).join(", ")}, and ${itemNames[itemNames.length - 1]} are about to expire.`;

  return (
    <ReanimatedAnimated.View
      entering={FadeInDown.duration(400).springify()}
      style={styles.container}
    >
      <BlurView intensity={80} tint="light" style={styles.blurContainer}>
        {/* Header */}
        <View style={styles.header}>
          <View style={styles.headerLeft}>
            <View style={styles.appIcon}>
              <MaterialCommunityIcons
                name="silverware-fork-knife"
                size={14}
                color={mangiaColors.white}
              />
            </View>
            <Text style={styles.appName}>MANGIA</Text>
          </View>
          <Text style={styles.timestamp}>{timestamp}</Text>
        </View>

        {/* Main Content */}
        <View style={styles.content}>
          {/* Thumbnail */}
          <View style={styles.thumbnail}>
            {items[0]?.imageUrl ? (
              <Image
                source={{ uri: items[0].imageUrl }}
                style={styles.thumbnailImage}
                contentFit="cover"
                transition={200}
              />
            ) : (
              <View style={styles.thumbnailPlaceholder}>
                <MaterialCommunityIcons
                  name="food-variant"
                  size={24}
                  color={mangiaColors.sage}
                />
              </View>
            )}
          </View>

          {/* Text */}
          <View style={styles.textContainer}>
            <Text style={styles.title}>Expiring Soon</Text>
            <Text style={styles.message} numberOfLines={3}>
              {message}
            </Text>
          </View>
        </View>

        {/* Action Buttons */}
        <View style={styles.actions}>
          <TouchableOpacity
            style={styles.primaryButton}
            onPress={onViewRecipes}
            activeOpacity={0.9}
          >
            <Text style={styles.primaryButtonText}>View Recipes</Text>
          </TouchableOpacity>
          <TouchableOpacity
            style={styles.secondaryButton}
            onPress={onAddToShoppingList}
            activeOpacity={0.9}
          >
            <Text style={styles.secondaryButtonText}>Add to Shopping List</Text>
          </TouchableOpacity>
        </View>
      </BlurView>

      {/* Stacked notification effect */}
      <View style={styles.stackedCard1} />
      <View style={styles.stackedCard2} />
    </ReanimatedAnimated.View>
  );
}

const styles = StyleSheet.create({
  container: {
    width: "100%",
    maxWidth: 370,
    alignSelf: "center",
  },
  blurContainer: {
    borderRadius: 24,
    overflow: "hidden",
    backgroundColor: "rgba(255, 255, 255, 0.8)",
  },

  // Header
  header: {
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "space-between",
    paddingHorizontal: 16,
    paddingTop: 12,
    paddingBottom: 8,
  },
  headerLeft: {
    flexDirection: "row",
    alignItems: "center",
    gap: 8,
  },
  appIcon: {
    width: 24,
    height: 24,
    borderRadius: 6,
    backgroundColor: mangiaColors.terracotta,
    justifyContent: "center",
    alignItems: "center",
    shadowColor: "#000",
    shadowOffset: { width: 0, height: 1 },
    shadowOpacity: 0.1,
    shadowRadius: 2,
    elevation: 2,
  },
  appName: {
    fontFamily: fontFamily.bold,
    fontSize: 11,
    color: "#1F2937",
    letterSpacing: 1.5,
    textTransform: "uppercase",
  },
  timestamp: {
    fontFamily: fontFamily.regular,
    fontSize: 12,
    color: "#6B7280",
  },

  // Content
  content: {
    flexDirection: "row",
    gap: 16,
    paddingHorizontal: 16,
    paddingBottom: 16,
  },
  thumbnail: {
    width: 64,
    height: 64,
    borderRadius: 12,
    overflow: "hidden",
    shadowColor: "#000",
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.1,
    shadowRadius: 4,
    elevation: 3,
  },
  thumbnailImage: {
    width: "100%",
    height: "100%",
  },
  thumbnailPlaceholder: {
    flex: 1,
    backgroundColor: `${mangiaColors.sage}30`,
    justifyContent: "center",
    alignItems: "center",
  },
  textContainer: {
    flex: 1,
    paddingRight: 8,
  },
  title: {
    fontFamily: fontFamily.bold,
    fontSize: 16,
    color: "#111827",
    marginBottom: 4,
  },
  message: {
    fontFamily: fontFamily.regular,
    fontSize: 14,
    color: "#374151",
    lineHeight: 20,
  },

  // Actions
  actions: {
    borderTopWidth: 1,
    borderTopColor: "rgba(229, 231, 235, 0.5)",
    backgroundColor: "rgba(249, 250, 251, 0.5)",
    padding: 8,
    gap: 8,
  },
  primaryButton: {
    backgroundColor: mangiaColors.terracotta,
    paddingVertical: 14,
    paddingHorizontal: 16,
    borderRadius: 12,
    alignItems: "center",
    shadowColor: mangiaColors.terracotta,
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.2,
    shadowRadius: 4,
    elevation: 3,
  },
  primaryButtonText: {
    fontFamily: fontFamily.bold,
    fontSize: 14,
    color: mangiaColors.white,
  },
  secondaryButton: {
    backgroundColor: mangiaColors.white,
    paddingVertical: 14,
    paddingHorizontal: 16,
    borderRadius: 12,
    alignItems: "center",
    shadowColor: "#000",
    shadowOffset: { width: 0, height: 1 },
    shadowOpacity: 0.05,
    shadowRadius: 2,
    elevation: 1,
  },
  secondaryButtonText: {
    fontFamily: fontFamily.bold,
    fontSize: 14,
    color: "#1F2937",
  },

  // Stacked notification effect
  stackedCard1: {
    position: "absolute",
    bottom: -4,
    left: "2.5%",
    right: "2.5%",
    height: 8,
    borderRadius: 12,
    backgroundColor: "rgba(255, 255, 255, 0.4)",
    zIndex: -1,
  },
  stackedCard2: {
    position: "absolute",
    bottom: -8,
    left: "5%",
    right: "5%",
    height: 8,
    borderRadius: 12,
    backgroundColor: "rgba(255, 255, 255, 0.2)",
    zIndex: -2,
  },
});

export default ExpiringNotificationCard;
