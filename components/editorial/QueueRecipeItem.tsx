/**
 * QueueRecipeItem
 *
 * Horizontal recipe card for the "Up Next" queue.
 * Matches /ui-redesign/screens/home_screen.html (#queue-item-1_107)
 *
 * Design specs:
 * - White background, p-3, rounded-2xl
 * - Border: 1px creamDark
 * - Thumbnail: 80x80, rounded-xl
 * - Action button: 40x40, rounded-full
 */

import React from 'react';
import {
  View,
  Text,
  TouchableOpacity,
  Image,
  StyleSheet,
  Pressable,
} from 'react-native';
import { Feather } from '@expo/vector-icons';
import Animated, { FadeInDown } from 'react-native-reanimated';
import * as Haptics from 'expo-haptics';
import { mangiaColors } from '../../theme/tokens/colors';
import { fontFamily } from '../../theme/tokens/typography';
import { Recipe } from '../../models/Recipe';

interface QueueRecipeItemProps {
  recipe: Recipe;
  index: number;
  onPress: (recipe: Recipe) => void;
  onStartCooking?: (recipe: Recipe) => void;
}

export function QueueRecipeItem({
  recipe,
  index,
  onPress,
  onStartCooking,
}: QueueRecipeItemProps) {
  const imageUrl =
    recipe.image_url ||
    `https://source.unsplash.com/featured/?${encodeURIComponent(recipe.title)},food`;

  // Calculate total time
  const totalTime = (recipe.prep_time || 0) + (recipe.cook_time || 0);

  const handleActionPress = () => {
    Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light);
    onStartCooking?.(recipe);
  };

  return (
    <Animated.View entering={FadeInDown.delay(index * 80).duration(300)}>
      <TouchableOpacity
        activeOpacity={0.9}
        onPress={() => onPress(recipe)}
        style={styles.container}
      >
        {/* Thumbnail */}
        <View style={styles.thumbnailContainer}>
          <Image
            source={{ uri: imageUrl }}
            style={styles.thumbnail}
            resizeMode="cover"
          />
        </View>

        {/* Info */}
        <View style={styles.info}>
          <Text style={styles.title} numberOfLines={1}>
            {recipe.title}
          </Text>
          <View style={styles.metaRow}>
            <Feather name="clock" size={12} color={mangiaColors.brown} />
            <Text style={styles.metaText}>
              {totalTime > 0 ? `${totalTime} min` : 'Time varies'}
            </Text>
            <View style={styles.dot} />
            <Text style={styles.metaText}>
              {recipe.meal_type || 'Recipe'}
            </Text>
          </View>
        </View>

        {/* Action Button */}
        <Pressable
          onPress={handleActionPress}
          style={({ pressed }) => [
            styles.actionButton,
            pressed && styles.actionButtonPressed,
          ]}
        >
          <Feather
            name="play"
            size={20}
            color={mangiaColors.terracotta}
            style={styles.actionIcon}
          />
        </Pressable>
      </TouchableOpacity>
    </Animated.View>
  );
}

const styles = StyleSheet.create({
  container: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 16,
    backgroundColor: mangiaColors.white,
    padding: 12,
    borderRadius: 16,
    borderWidth: 1,
    borderColor: mangiaColors.creamDark,
    // Shadow
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.05,
    shadowRadius: 4,
    elevation: 2,
  },
  thumbnailContainer: {
    width: 80,
    height: 80,
    borderRadius: 12,
    overflow: 'hidden',
    borderWidth: 1,
    borderColor: mangiaColors.creamDark,
  },
  thumbnail: {
    width: '100%',
    height: '100%',
  },
  info: {
    flex: 1,
  },
  title: {
    fontFamily: fontFamily.serif,
    fontSize: 18,
    fontWeight: '400',
    color: mangiaColors.dark,
    lineHeight: 22,
    marginBottom: 4,
  },
  metaRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 4,
  },
  metaText: {
    fontFamily: fontFamily.regular,
    fontSize: 12,
    color: mangiaColors.brown,
  },
  dot: {
    width: 4,
    height: 4,
    borderRadius: 2,
    backgroundColor: mangiaColors.brown,
  },
  actionButton: {
    width: 40,
    height: 40,
    borderRadius: 20,
    borderWidth: 1,
    borderColor: mangiaColors.creamDark,
    alignItems: 'center',
    justifyContent: 'center',
  },
  actionButtonPressed: {
    backgroundColor: mangiaColors.terracotta,
    borderColor: mangiaColors.terracotta,
  },
  actionIcon: {
    marginLeft: 2, // Offset for play icon visual balance
  },
});
