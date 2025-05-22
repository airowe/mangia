import React from 'react';
import { View, StyleSheet, ViewStyle } from 'react-native';
import { MaterialCommunityIcons } from '@expo/vector-icons';
import { colors } from '../theme/colors';

type ProductPlaceholderProps = {
  category?: string;
  location?: string;
  size?: number;
  style?: ViewStyle;
};

const getIconForCategory = (category: string = '') => {
  const lowerCategory = category.toLowerCase();
  
  if (lowerCategory.includes('fruit') || lowerCategory.includes('vegetable')) {
    return 'food-apple';
  }
  if (lowerCategory.includes('meat') || lowerCategory.includes('chicken') || lowerCategory.includes('beef')) {
    return 'food-drumstick';
  }
  if (lowerCategory.includes('dairy') || lowerCategory.includes('milk') || lowerCategory.includes('cheese')) {
    return 'cheese';
  }
  if (lowerCategory.includes('grain') || lowerCategory.includes('bread') || lowerCategory.includes('pasta')) {
    return 'bread-slice';
  }
  if (lowerCategory.includes('spice') || lowerCategory.includes('herb')) {
    return 'shaker';
  }
  if (lowerCategory.includes('beverage') || lowerCategory.includes('drink')) {
    return 'cup';
  }
  return 'food';
};

const getIconForLocation = (location: string = '') => {
  const lowerLocation = location.toLowerCase();
  
  if (lowerLocation.includes('fridge') || lowerLocation.includes('refrigerator')) {
    return 'fridge';
  }
  if (lowerLocation.includes('freezer')) {
    return 'snowflake';
  }
  if (lowerLocation.includes('pantry') || lowerLocation.includes('shelf')) {
    return 'cupboard';
  }
  if (lowerLocation.includes('spice') || lowerLocation.includes('drawer')) {
    return 'shaker';
  }
  return 'shopping';
};

export const ProductPlaceholder: React.FC<ProductPlaceholderProps> = ({
  category,
  location,
  size = 40,
  style,
}) => {
  const iconName = category 
    ? getIconForCategory(category)
    : location
    ? getIconForLocation(location)
    : 'shopping';

  return (
    <View style={[styles.container, { width: size, height: size }, style]}>
      <View style={styles.iconContainer}>
        <MaterialCommunityIcons 
          name={iconName as any} 
          size={size * 0.4} 
          color="rgba(0, 0, 0, 0.4)" 
        />
      </View>
    </View>
  );
};

const styles = StyleSheet.create({
  container: {
    backgroundColor: 'rgba(0, 0, 0, 0.05)',
    borderRadius: 8,
    justifyContent: 'center',
    alignItems: 'center',
    borderWidth: 1,
    borderColor: 'rgba(0, 0, 0, 0.1)',
  },
  iconContainer: {
    justifyContent: 'center',
    alignItems: 'center',
    width: '100%',
    height: '100%',
  },
});
