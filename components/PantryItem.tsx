import React from 'react';
import { View, Text, StyleSheet, TouchableOpacity, Image } from 'react-native';
import { MaterialIcons } from '@expo/vector-icons';
import { Product } from '../models/Product';
import { colors } from '../theme/colors';

interface PantryItemProps {
  product: Product;
  isInPantry: boolean;
  onAddToPantry: (product: Product) => void;
  onQuantityChange: (productId: string, change: number) => void;
}

const PantryItem: React.FC<PantryItemProps> = ({
  product,
  isInPantry,
  onAddToPantry,
  onQuantityChange,
}) => {
  return (
    <View style={styles.container}>
      <View style={styles.imageContainer}>
        <View style={[styles.imageContainer, styles.imageFallback]}>
          <Image
            source={{ 
              uri: product.imageUrl || 'https://via.placeholder.com/150',
              cache: 'force-cache' as const
            }}
            style={styles.image}
            resizeMode="cover"
            onError={() => {
              // The fallback is handled by the parent View's style
            }}
          />
        </View>
        
        {/* Add to pantry button */}
        <TouchableOpacity 
          style={styles.addButton}
          onPress={() => onAddToPantry(product)}
        >
          <MaterialIcons
            name={isInPantry ? 'shopping-basket' : 'add-shopping-cart'}
            size={24}
            color={isInPantry ? colors.primary : colors.text}
          />
        </TouchableOpacity>
        
        {/* Quantity controls */}
        <View style={styles.quantityContainer}>
          <TouchableOpacity 
            style={styles.quantityButton}
            onPress={() => onQuantityChange(product.id, -1)}
          >
            <Text style={styles.quantityButtonText}>-</Text>
          </TouchableOpacity>
          <Text style={styles.quantityText}>{product.quantity || 1}</Text>
          <TouchableOpacity 
            style={styles.quantityButton}
            onPress={() => onQuantityChange(product.id, 1)}
          >
            <Text style={styles.quantityButtonText}>+</Text>
          </TouchableOpacity>
        </View>
      </View>
      
      <Text style={styles.name} numberOfLines={1}>
        {product.title || 'Product Name'}
      </Text>
      {product.price !== undefined && (
        <Text style={styles.price}>
          ${product.price.toFixed(2)}
        </Text>
      )}
    </View>
  );
};

const styles = StyleSheet.create({
  container: {
    width: 160,
    margin: 8,
    backgroundColor: '#fff',
    borderRadius: 8,
    overflow: 'hidden',
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.1,
    shadowRadius: 4,
    elevation: 3,
  },
  imageContainer: {
    position: 'relative',
    width: '100%',
    aspectRatio: 1,
  },
  image: {
    width: '100%',
    height: '100%',
  },
  imageFallback: {
    backgroundColor: '#f0f0f0',
  },
  addButton: {
    position: 'absolute',
    top: 8,
    right: 8,
    backgroundColor: 'rgba(255, 255, 255, 0.9)',
    borderRadius: 20,
    width: 32,
    height: 32,
    justifyContent: 'center',
    alignItems: 'center',
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 1 },
    shadowOpacity: 0.2,
    shadowRadius: 2,
    elevation: 2,
  },
  quantityContainer: {
    position: 'absolute',
    bottom: 8,
    left: 8,
    right: 8,
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    backgroundColor: 'rgba(255, 255, 255, 0.9)',
    borderRadius: 16,
    paddingHorizontal: 8,
    height: 32,
  },
  quantityButton: {
    width: 24,
    height: 24,
    borderRadius: 12,
    backgroundColor: colors.primary,
    justifyContent: 'center',
    alignItems: 'center',
  },
  quantityButtonText: {
    color: '#fff',
    fontSize: 16,
    fontWeight: 'bold',
    lineHeight: 20,
  },
  quantityText: {
    fontSize: 14,
    fontWeight: '600',
    color: colors.text,
  },
  name: {
    fontSize: 14,
    fontWeight: '500',
    marginTop: 8,
    marginHorizontal: 8,
    marginBottom: 2,
    color: colors.text,
  },
  price: {
    fontSize: 16,
    fontWeight: 'bold',
    marginHorizontal: 8,
    marginBottom: 8,
    color: colors.primary,
  },
});

export default PantryItem;