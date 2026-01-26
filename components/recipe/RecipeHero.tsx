/**
 * RecipeHero Component
 *
 * Editorial hero image section for recipe detail screen.
 * Features:
 * - 40% screen height hero image
 * - Gradient overlay from deepBrown
 * - Glass-blur navigation buttons
 * - Category tag rotated -1 degree
 * - Title and author at bottom
 */

import React from 'react';
import {
  View,
  Text,
  Image,
  TouchableOpacity,
  StyleSheet,
  Dimensions,
} from 'react-native';
import { BlurView } from 'expo-blur';
import { LinearGradient } from 'expo-linear-gradient';
import { Feather } from '@expo/vector-icons';
import Animated, { FadeIn, FadeInDown } from 'react-native-reanimated';
import { mangiaColors } from '../../theme/tokens/colors';

const { height: SCREEN_HEIGHT } = Dimensions.get('window');
const HERO_HEIGHT = SCREEN_HEIGHT * 0.4;

interface RecipeHeroProps {
  imageUrl?: string | null;
  title: string;
  author?: string;
  category?: string;
  onBack: () => void;
  onSave?: () => void;
  onMore?: () => void;
}

export function RecipeHero({
  imageUrl,
  title,
  author,
  category,
  onBack,
  onSave,
  onMore,
}: RecipeHeroProps) {
  return (
    <Animated.View entering={FadeIn.duration(400)} style={styles.container}>
      {/* Hero Image */}
      {imageUrl ? (
        <Image
          source={{ uri: imageUrl }}
          style={styles.image}
          resizeMode="cover"
        />
      ) : (
        <View style={styles.placeholder}>
          <Feather name="image" size={64} color={mangiaColors.taupe} />
        </View>
      )}

      {/* Gradient Overlay */}
      <LinearGradient
        colors={['transparent', 'rgba(42, 31, 24, 0.5)', 'rgba(42, 31, 24, 0.8)']}
        locations={[0, 0.5, 1]}
        style={styles.gradient}
      />

      {/* Navigation Controls */}
      <View style={styles.navContainer}>
        {/* Back Button */}
        <TouchableOpacity onPress={onBack} activeOpacity={0.8}>
          <BlurView intensity={40} tint="dark" style={styles.navButton}>
            <Feather name="arrow-left" size={20} color="white" />
          </BlurView>
        </TouchableOpacity>

        {/* Right Buttons */}
        <View style={styles.rightButtons}>
          {onSave && (
            <TouchableOpacity onPress={onSave} activeOpacity={0.8}>
              <BlurView intensity={40} tint="dark" style={styles.navButton}>
                <Feather name="bookmark" size={20} color="white" />
              </BlurView>
            </TouchableOpacity>
          )}
          {onMore && (
            <TouchableOpacity onPress={onMore} activeOpacity={0.8}>
              <BlurView intensity={40} tint="dark" style={styles.navButton}>
                <Feather name="more-horizontal" size={20} color="white" />
              </BlurView>
            </TouchableOpacity>
          )}
        </View>
      </View>

      {/* Hero Content */}
      <View style={styles.contentContainer}>
        {/* Category Tag */}
        {category && (
          <Animated.View
            entering={FadeInDown.delay(100).duration(300)}
            style={styles.categoryTag}
          >
            <Text style={styles.categoryText}>{category}</Text>
          </Animated.View>
        )}

        {/* Title */}
        <Animated.Text
          entering={FadeInDown.delay(200).duration(300)}
          style={styles.title}
          numberOfLines={3}
        >
          {title}
        </Animated.Text>

        {/* Author */}
        {author && (
          <Animated.Text
            entering={FadeInDown.delay(300).duration(300)}
            style={styles.author}
          >
            {author}
          </Animated.Text>
        )}
      </View>
    </Animated.View>
  );
}

const styles = StyleSheet.create({
  container: {
    height: HERO_HEIGHT,
    width: '100%',
    position: 'relative',
  },
  image: {
    width: '100%',
    height: '100%',
  },
  placeholder: {
    width: '100%',
    height: '100%',
    backgroundColor: mangiaColors.creamDark,
    alignItems: 'center',
    justifyContent: 'center',
  },
  gradient: {
    position: 'absolute',
    bottom: 0,
    left: 0,
    right: 0,
    height: '70%',
  },
  navContainer: {
    position: 'absolute',
    top: 56,
    left: 24,
    right: 24,
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
  },
  navButton: {
    width: 40,
    height: 40,
    borderRadius: 20,
    overflow: 'hidden',
    alignItems: 'center',
    justifyContent: 'center',
    backgroundColor: 'rgba(255, 255, 255, 0.2)',
  },
  rightButtons: {
    flexDirection: 'row',
    gap: 12,
  },
  contentContainer: {
    position: 'absolute',
    bottom: 32,
    left: 24,
    right: 24,
  },
  categoryTag: {
    alignSelf: 'flex-start',
    backgroundColor: mangiaColors.sage,
    paddingHorizontal: 12,
    paddingVertical: 4,
    borderRadius: 2,
    transform: [{ rotate: '-1deg' }],
    marginBottom: 12,
  },
  categoryText: {
    fontFamily: 'System',
    fontSize: 10,
    fontWeight: '700',
    color: mangiaColors.deepBrown,
    textTransform: 'uppercase',
    letterSpacing: 2,
  },
  title: {
    fontFamily: 'Georgia',
    fontSize: 32,
    fontWeight: '400',
    color: mangiaColors.cream,
    lineHeight: 38,
    marginBottom: 8,
    textShadowColor: 'rgba(0, 0, 0, 0.3)',
    textShadowOffset: { width: 0, height: 1 },
    textShadowRadius: 4,
  },
  author: {
    fontFamily: 'System',
    fontSize: 14,
    fontWeight: '500',
    color: mangiaColors.cream,
    opacity: 0.8,
  },
});
