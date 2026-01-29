/**
 * EditorialCard
 *
 * Versatile card component with multiple variants for editorial layouts.
 * Supports featured (overlay text), standard (text below), and compact (horizontal) variants.
 */

import React, { useMemo } from 'react';
import { View, TouchableOpacity, ViewStyle, ImageStyle, TextStyle } from 'react-native';
import { Image } from 'expo-image';
import Animated, { FadeIn } from 'react-native-reanimated';
import { LinearGradient } from 'expo-linear-gradient';
import { useTheme } from '../../theme';
import { CardTitle, Byline } from './EditorialText';

interface EditorialCardProps {
  variant: 'featured' | 'standard' | 'compact';
  imageUrl?: string;
  title: string;
  subtitle?: string;
  category?: string;
  onPress?: () => void;
  style?: ViewStyle;
}

export function EditorialCard({
  variant,
  imageUrl,
  title,
  subtitle,
  category,
  onPress,
  style,
}: EditorialCardProps) {
  const { theme, isDark } = useTheme();
  const { colors, spacing, borderRadius } = theme;

  const styles = useMemo(() => {
    const base = {
      container: {
        backgroundColor: colors.card,
        borderRadius: borderRadius.lg,
        overflow: 'hidden' as const,
        shadowColor: '#000',
        shadowOffset: { width: 0, height: 4 },
        shadowOpacity: isDark ? 0.3 : 0.1,
        shadowRadius: 12,
        elevation: 4,
      } as ViewStyle,
      imageContainer: {
        position: 'relative' as const,
      } as ViewStyle,
      image: {} as ImageStyle,
      gradient: {
        position: 'absolute' as const,
        bottom: 0,
        left: 0,
        right: 0,
        height: 120,
      } as ViewStyle,
      content: {
        padding: spacing.lg,
      } as ViewStyle,
      category: {
        marginBottom: spacing.xs,
        color: colors.primary,
      } as TextStyle,
      title: {} as TextStyle,
      subtitle: {
        marginTop: spacing.xs,
      } as TextStyle,
    };

    switch (variant) {
      case 'featured':
        return {
          ...base,
          container: { ...base.container, minHeight: 280 } as ViewStyle,
          image: { width: '100%' as const, height: 200 } as ImageStyle,
          content: {
            ...base.content,
            position: 'absolute' as const,
            bottom: 0,
            left: 0,
            right: 0,
          } as ViewStyle,
          title: { color: '#FFFFFF' } as TextStyle,
          category: { color: colors.accent } as TextStyle,
          subtitle: { ...base.subtitle, color: 'rgba(255,255,255,0.8)' } as TextStyle,
        };
      case 'standard':
        return {
          ...base,
          container: { ...base.container, width: 200 } as ViewStyle,
          image: { width: '100%' as const, height: 140 } as ImageStyle,
        };
      case 'compact':
        return {
          ...base,
          container: {
            ...base.container,
            flexDirection: 'row' as const,
            height: 80,
          } as ViewStyle,
          imageContainer: { width: 80, height: 80 } as ViewStyle,
          image: { width: 80, height: 80 } as ImageStyle,
          content: { flex: 1, justifyContent: 'center' as const, padding: spacing.md } as ViewStyle,
        };
      default:
        return base;
    }
  }, [colors, spacing, borderRadius, isDark, variant]);

  const content = (
    <Animated.View entering={FadeIn.duration(300)} style={[styles.container, style]}>
      {imageUrl && (
        <View style={styles.imageContainer}>
          <Image
            source={{ uri: imageUrl }}
            style={styles.image}
            contentFit="cover"
            transition={200}
            cachePolicy="memory-disk"
          />
          {variant === 'featured' && (
            <LinearGradient
              colors={['transparent', 'rgba(0,0,0,0.7)']}
              style={styles.gradient}
            />
          )}
        </View>
      )}

      <View style={styles.content}>
        {category && <Byline style={styles.category}>{category}</Byline>}
        <CardTitle style={styles.title} numberOfLines={variant === 'compact' ? 1 : 2}>
          {title}
        </CardTitle>
        {subtitle && variant !== 'compact' && (
          <Byline style={styles.subtitle}>{subtitle}</Byline>
        )}
      </View>
    </Animated.View>
  );

  if (onPress) {
    return (
      <TouchableOpacity activeOpacity={0.9} onPress={onPress}>
        {content}
      </TouchableOpacity>
    );
  }

  return content;
}
