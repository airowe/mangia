/**
 * FeaturedRecipeCard
 *
 * Editorial-style recipe card with hero image and gradient overlay.
 * Used for featured recipes on home and browse screens.
 */

import React, { useMemo } from 'react';
import { View, TouchableOpacity, Image, ImageStyle, ViewStyle, TextStyle } from 'react-native';
import { LinearGradient } from 'expo-linear-gradient';
import Animated, { FadeIn, FadeInUp } from 'react-native-reanimated';
import { MaterialCommunityIcons } from '@expo/vector-icons';
import { useTheme } from '../../theme';
import { Recipe } from '../../models/Recipe';
import { CardTitle, DisplayHeadline, Byline } from './EditorialText';

interface FeaturedRecipeCardProps {
  recipe: Recipe;
  onPress: (recipe: Recipe) => void;
  variant?: 'hero' | 'large' | 'standard';
  style?: ViewStyle;
}

export function FeaturedRecipeCard({
  recipe,
  onPress,
  variant = 'standard',
  style,
}: FeaturedRecipeCardProps) {
  const { theme, isDark } = useTheme();
  const { colors, spacing, borderRadius } = theme;

  const imageUrl = recipe.image_url ||
    `https://source.unsplash.com/featured/?${encodeURIComponent(recipe.title)},food`;

  // Calculate total time from prep_time and cook_time
  const totalTime = (recipe.prep_time || 0) + (recipe.cook_time || 0);
  const timeDisplay = totalTime > 0 ? `${totalTime} min` : null;

  const styles = useMemo(() => {
    const imageHeight = variant === 'hero' ? 280 : variant === 'large' ? 200 : 160;
    const gradientHeight = variant === 'hero' ? 180 : 120;

    return {
      container: {
        borderRadius: borderRadius.lg,
        overflow: 'hidden' as const,
        backgroundColor: colors.card,
        shadowColor: '#000',
        shadowOffset: { width: 0, height: 8 },
        shadowOpacity: isDark ? 0.4 : 0.15,
        shadowRadius: 16,
        elevation: 6,
        ...(variant === 'hero' && { marginHorizontal: spacing.lg }),
      } as ViewStyle,
      imageContainer: {
        position: 'relative' as const,
        height: imageHeight,
      } as ViewStyle,
      image: {
        width: '100%',
        height: '100%',
      } as ImageStyle,
      gradient: {
        position: 'absolute' as const,
        bottom: 0,
        left: 0,
        right: 0,
        height: gradientHeight,
      } as ViewStyle,
      content: {
        position: 'absolute' as const,
        bottom: 0,
        left: 0,
        right: 0,
        padding: spacing.lg,
      } as ViewStyle,
      category: {
        color: colors.accent,
        marginBottom: spacing.xs,
      } as TextStyle,
      title: {
        color: '#FFFFFF',
      } as TextStyle,
      metaRow: {
        flexDirection: 'row' as const,
        alignItems: 'center' as const,
        marginTop: spacing.sm,
        gap: spacing.md,
      } as ViewStyle,
      metaItem: {
        flexDirection: 'row' as const,
        alignItems: 'center' as const,
        gap: spacing.xs,
      } as ViewStyle,
      metaText: {
        color: 'rgba(255,255,255,0.9)',
        fontSize: 13,
        fontWeight: '500' as const,
        letterSpacing: 0.5,
      } as TextStyle,
    };
  }, [colors, spacing, borderRadius, isDark, variant]);

  const TitleComponent = variant === 'hero' ? DisplayHeadline : CardTitle;

  return (
    <TouchableOpacity activeOpacity={0.95} onPress={() => onPress(recipe)} style={style}>
      <Animated.View entering={FadeIn.duration(400)} style={styles.container}>
        <View style={styles.imageContainer}>
          <Image source={{ uri: imageUrl }} style={styles.image} resizeMode="cover" />
          <LinearGradient
            colors={['transparent', 'rgba(0,0,0,0.85)']}
            style={styles.gradient}
          />
        </View>

        <Animated.View entering={FadeInUp.delay(100).duration(300)} style={styles.content}>
          {recipe.meal_type && (
            <Byline style={styles.category}>
              {recipe.meal_type.toUpperCase()}
            </Byline>
          )}

          <TitleComponent style={styles.title} numberOfLines={2}>
            {recipe.title}
          </TitleComponent>

          <View style={styles.metaRow}>
            {timeDisplay && (
              <View style={styles.metaItem}>
                <MaterialCommunityIcons name="clock-outline" size={14} color="rgba(255,255,255,0.9)" />
                <Byline style={styles.metaText}>{timeDisplay}</Byline>
              </View>
            )}
            {recipe.servings && (
              <View style={styles.metaItem}>
                <MaterialCommunityIcons name="account-group-outline" size={14} color="rgba(255,255,255,0.9)" />
                <Byline style={styles.metaText}>{recipe.servings} servings</Byline>
              </View>
            )}
          </View>
        </Animated.View>
      </Animated.View>
    </TouchableOpacity>
  );
}
