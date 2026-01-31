// components/RecipeQueueCard.tsx
// Recipe card for the "Want to Cook" queue with swipe actions

import React from "react";
import {
  View,
  Text,
  StyleSheet,
  Pressable,
  Dimensions,
} from "react-native";
import Animated, {
  useSharedValue,
  useAnimatedStyle,
  withSpring,
} from "react-native-reanimated";
import { Image } from "expo-image";
import { IconButton } from "react-native-paper";
import { MaterialCommunityIcons } from "@expo/vector-icons";
import { Recipe, RecipeSourceType } from "../models/Recipe";
import { colors } from "../theme/colors";

const { width: SCREEN_WIDTH } = Dimensions.get("window");
const CARD_WIDTH = SCREEN_WIDTH - 32;

interface RecipeQueueCardProps {
  recipe: Recipe;
  onPress: (recipe: Recipe) => void;
  onMarkCooked?: (recipe: Recipe) => void;
  onArchive?: (recipe: Recipe) => void;
  onDelete?: (recipe: Recipe) => void;
}

// Platform icons and colors
const PLATFORM_CONFIG: Record<
  RecipeSourceType,
  {
    icon: keyof typeof MaterialCommunityIcons.glyphMap;
    color: string;
    label: string;
  }
> = {
  tiktok: { icon: "music-note", color: "#000000", label: "TikTok" },
  youtube: { icon: "youtube", color: "#FF0000", label: "YouTube" },
  instagram: { icon: "instagram", color: "#E4405F", label: "Instagram" },
  blog: { icon: "web", color: "#4CAF50", label: "Blog" },
  manual: { icon: "pencil", color: colors.primary, label: "Manual" },
};

export const RecipeQueueCard = React.memo<RecipeQueueCardProps>(function RecipeQueueCard({
  recipe,
  onPress,
  onMarkCooked,
  onArchive,
  onDelete,
}) {
  const sourceType = recipe.sourceType || "manual";
  const platform = PLATFORM_CONFIG[sourceType] || PLATFORM_CONFIG.manual;
  const scale = useSharedValue(1);

  const animatedStyle = useAnimatedStyle(() => ({
    transform: [{ scale: scale.value }],
  }));

  const handlePressIn = () => {
    scale.value = withSpring(0.97, { damping: 15, stiffness: 400 });
  };

  const handlePressOut = () => {
    scale.value = withSpring(1, { damping: 12, stiffness: 300 });
  };

  // Calculate total time
  const totalTime = (recipe.prepTime || 0) + (recipe.cookTime || 0);
  const timeDisplay = totalTime > 0 ? `${totalTime} min` : null;

  return (
    <Pressable
      onPressIn={handlePressIn}
      onPressOut={handlePressOut}
      onPress={() => onPress(recipe)}
    >
      <Animated.View style={[styles.card, animatedStyle]}>
      {/* Recipe Image */}
      <View style={styles.imageContainer}>
        {recipe.imageUrl ? (
          <Image
            source={{ uri: recipe.imageUrl }}
            style={styles.image}
            contentFit="cover"
            transition={200}
            cachePolicy="memory-disk"
          />
        ) : (
          <View style={styles.placeholderImage}>
            <MaterialCommunityIcons
              name="food"
              size={48}
              color={colors.textTertiary}
            />
          </View>
        )}
      </View>

      {/* Recipe Info */}
      <View style={styles.content}>
        <Text style={styles.title} numberOfLines={2}>
          {recipe.title}
        </Text>

        {/* Source and Time Row */}
        <View style={styles.metaRow}>
          {/* Platform Icon */}
          <View style={styles.platformBadge}>
            <MaterialCommunityIcons
              name={platform.icon}
              size={14}
              color={platform.color}
            />
            <Text style={[styles.platformLabel, { color: platform.color }]}>
              {platform.label}
            </Text>
          </View>

          {/* Time */}
          {timeDisplay && (
            <View style={styles.timeBadge}>
              <MaterialCommunityIcons
                name="clock-outline"
                size={14}
                color={colors.textSecondary}
              />
              <Text style={styles.timeLabel}>{timeDisplay}</Text>
            </View>
          )}
        </View>

        {/* Servings */}
        {recipe.servings && (
          <View style={styles.servingsRow}>
            <MaterialCommunityIcons
              name="account-group-outline"
              size={14}
              color={colors.textTertiary}
            />
            <Text style={styles.servingsLabel}>Serves {recipe.servings}</Text>
          </View>
        )}
      </View>

      {/* Quick Actions */}
      <View style={styles.actions}>
        {onMarkCooked && (
          <IconButton
            icon="check-circle-outline"
            iconColor={colors.success}
            size={22}
            onPress={() => onMarkCooked(recipe)}
            style={styles.actionButton}
          />
        )}
        {onArchive && (
          <IconButton
            icon="archive-outline"
            iconColor={colors.textSecondary}
            size={22}
            onPress={() => onArchive(recipe)}
            style={styles.actionButton}
          />
        )}
        {onDelete && (
          <IconButton
            icon="delete-outline"
            iconColor={colors.error}
            size={22}
            onPress={() => onDelete(recipe)}
            style={styles.actionButton}
          />
        )}
      </View>
      </Animated.View>
    </Pressable>
  );
});

RecipeQueueCard.displayName = 'RecipeQueueCard';

const styles = StyleSheet.create({
  card: {
    flexDirection: "row",
    backgroundColor: colors.surface,
    borderRadius: 12,
    marginHorizontal: 16,
    marginVertical: 8,
    overflow: "hidden",
    elevation: 2,
    shadowColor: "#000",
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.1,
    shadowRadius: 4,
  },
  imageContainer: {
    width: 100,
    height: 100,
  },
  image: {
    width: "100%",
    height: "100%",
  },
  placeholderImage: {
    width: "100%",
    height: "100%",
    backgroundColor: colors.lightGray,
    justifyContent: "center",
    alignItems: "center",
  },
  content: {
    flex: 1,
    padding: 12,
    justifyContent: "center",
  },
  title: {
    fontSize: 16,
    fontWeight: "600",
    color: colors.text,
    marginBottom: 8,
  },
  metaRow: {
    flexDirection: "row",
    alignItems: "center",
    gap: 12,
    marginBottom: 4,
  },
  platformBadge: {
    flexDirection: "row",
    alignItems: "center",
    gap: 4,
  },
  platformLabel: {
    fontSize: 12,
    fontWeight: "500",
  },
  timeBadge: {
    flexDirection: "row",
    alignItems: "center",
    gap: 4,
  },
  timeLabel: {
    fontSize: 12,
    color: colors.textSecondary,
  },
  servingsRow: {
    flexDirection: "row",
    alignItems: "center",
    gap: 4,
    marginTop: 4,
  },
  servingsLabel: {
    fontSize: 12,
    color: colors.textTertiary,
  },
  actions: {
    flexDirection: "column",
    justifyContent: "center",
    paddingRight: 4,
  },
  actionButton: {
    margin: 0,
  },
});

export default RecipeQueueCard;
