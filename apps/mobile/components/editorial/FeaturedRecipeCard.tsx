/**
 * FeaturedRecipeCard
 *
 * Editorial-style hero recipe card with sticker badge.
 * Matches /ui-redesign/screens/home_screen.html (#featured-card_104)
 *
 * Design specs:
 * - Aspect ratio: 4:5
 * - Border-radius: 32px
 * - Border: 2px solid dark
 * - Sticker badge (terracotta, rotated 12deg)
 * - Gradient overlay with title and tags
 */

import React, { useMemo } from 'react';
import {
  View,
  Text,
  TouchableOpacity,
  StyleSheet,
  Dimensions,
} from 'react-native';
import { Image } from 'expo-image';
import { LinearGradient } from 'expo-linear-gradient';
import Animated, { FadeIn, FadeInUp } from 'react-native-reanimated';
import { useTheme } from '../../theme';
import { mangiaColors } from '../../theme/tokens/colors';
import { fontFamily } from '../../theme/tokens/typography';
import { Recipe } from '../../models/Recipe';

const { width: SCREEN_WIDTH } = Dimensions.get('window');
const CARD_HORIZONTAL_PADDING = 24; // px-6
const CARD_WIDTH = SCREEN_WIDTH - CARD_HORIZONTAL_PADDING * 2;
const CARD_HEIGHT = CARD_WIDTH * (5 / 4); // 4:5 aspect ratio

interface FeaturedRecipeCardProps {
  recipe: Recipe;
  onPress: (recipe: Recipe) => void;
  variant?: 'hero' | 'large' | 'standard';
}

export const FeaturedRecipeCard = React.memo<FeaturedRecipeCardProps>(function FeaturedRecipeCard({ recipe, onPress, variant = 'standard' }) {
  const { theme } = useTheme();

  const imageUrl =
    recipe.imageUrl ||
    `https://source.unsplash.com/featured/?${encodeURIComponent(recipe.title)},food`;

  // Calculate total time
  const totalTime = (recipe.prepTime || 0) + (recipe.cookTime || 0);

  // Get tags from mealType and sourceType
  const tags: string[] = [];
  if (recipe.mealType) tags.push(recipe.mealType);
  if (recipe.sourceType && recipe.sourceType !== 'manual') {
    tags.push(recipe.sourceType.charAt(0).toUpperCase() + recipe.sourceType.slice(1));
  }

  return (
    <TouchableOpacity activeOpacity={0.98} onPress={() => onPress(recipe)}>
      <Animated.View entering={FadeIn.duration(400)} style={styles.container}>
        {/* Recipe Image */}
        <Image
          source={{ uri: imageUrl }}
          style={styles.image}
          contentFit="cover"
          transition={200}
          cachePolicy="memory-disk"
        />

        {/* Sticker Badge (time) */}
        {totalTime > 0 && (
          <View style={styles.stickerContainer}>
            <View style={styles.sticker}>
              <Text style={styles.stickerNumber}>{totalTime}</Text>
              <Text style={styles.stickerLabel}>Min</Text>
            </View>
          </View>
        )}

        {/* Gradient Overlay */}
        <LinearGradient
          colors={[
            'transparent',
            `${mangiaColors.deepBrown}80`,
            `${mangiaColors.deepBrown}E6`,
          ]}
          locations={[0, 0.4, 1]}
          style={styles.gradient}
        />

        {/* Content */}
        <Animated.View
          entering={FadeInUp.delay(100).duration(300)}
          style={styles.content}
        >
          <Text style={styles.title} numberOfLines={2}>
            {recipe.title}
          </Text>

          {tags.length > 0 && (
            <View style={styles.tagsRow}>
              {tags.slice(0, 2).map((tag, index) => (
                <View key={index} style={styles.tag}>
                  <Text style={styles.tagText}>{tag}</Text>
                </View>
              ))}
            </View>
          )}
        </Animated.View>
      </Animated.View>
    </TouchableOpacity>
  );
});

FeaturedRecipeCard.displayName = 'FeaturedRecipeCard';

const styles = StyleSheet.create({
  container: {
    width: CARD_WIDTH,
    height: CARD_HEIGHT,
    borderRadius: 32,
    borderWidth: 2,
    borderColor: mangiaColors.dark,
    overflow: 'hidden',
    backgroundColor: mangiaColors.creamDark,
    // Shadow
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 12 },
    shadowOpacity: 0.2,
    shadowRadius: 24,
    elevation: 12,
  },
  image: {
    width: '100%',
    height: '100%',
    position: 'absolute',
  },
  stickerContainer: {
    position: 'absolute',
    top: 16,
    right: 16,
    zIndex: 10,
  },
  sticker: {
    width: 64,
    height: 64,
    borderRadius: 32,
    backgroundColor: mangiaColors.terracotta,
    borderWidth: 2,
    borderColor: mangiaColors.white,
    alignItems: 'center',
    justifyContent: 'center',
    transform: [{ rotate: '12deg' }],
    // Shadow
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.2,
    shadowRadius: 8,
    elevation: 6,
  },
  stickerNumber: {
    fontFamily: fontFamily.bold,
    fontSize: 18,
    fontWeight: '700',
    color: mangiaColors.white,
    lineHeight: 20,
  },
  stickerLabel: {
    fontFamily: fontFamily.bold,
    fontSize: 10,
    fontWeight: '700',
    color: mangiaColors.white,
    textTransform: 'uppercase',
    letterSpacing: 1,
  },
  gradient: {
    position: 'absolute',
    bottom: 0,
    left: 0,
    right: 0,
    height: '50%',
  },
  content: {
    position: 'absolute',
    bottom: 0,
    left: 0,
    right: 0,
    padding: 24,
  },
  title: {
    fontFamily: fontFamily.serif,
    fontSize: 24,
    fontWeight: '400',
    color: mangiaColors.cream,
    lineHeight: 28,
    marginBottom: 8,
  },
  tagsRow: {
    flexDirection: 'row',
    gap: 8,
  },
  tag: {
    backgroundColor: 'rgba(255, 255, 255, 0.2)',
    paddingHorizontal: 8,
    paddingVertical: 4,
    borderRadius: 6,
  },
  tagText: {
    fontFamily: fontFamily.bold,
    fontSize: 12,
    fontWeight: '700',
    color: mangiaColors.creamDark,
    textTransform: 'uppercase',
    letterSpacing: 1,
  },
});
