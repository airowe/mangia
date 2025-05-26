import React, { useState } from "react";
import {
  View,
  Text,
  StyleSheet,
  Image,
  ScrollView,
  TouchableOpacity,
  ActivityIndicator,
  Alert,
  SafeAreaView,
  useWindowDimensions,
} from "react-native";
import { MaterialIcons } from "@expo/vector-icons";
import { useNavigation, useRoute, RouteProp } from "@react-navigation/native";
import { StackNavigationProp } from "@react-navigation/stack";
import { Product } from "../models/Product";
import { colors } from "../theme/colors";
import { updatePantryItemQuantity, removeFromPantry } from "../lib/pantry";

type RootStackParamList = {
  ProductDetail: { product: Product };
  HomeScreen: undefined;
};

type ProductDetailScreenNavigationProp = StackNavigationProp<
  RootStackParamList,
  'ProductDetail'
>;

type ProductDetailRouteProp = RouteProp<RootStackParamList, 'ProductDetail'>;

export default function ProductDetailScreen() {
  const navigation = useNavigation<ProductDetailScreenNavigationProp>();
  const route = useRoute<ProductDetailRouteProp>();
  const { width } = useWindowDimensions();
  
  const [product, setProduct] = useState<Product>(route.params.product);
  const [updating, setUpdating] = useState(false);
  const [deleting, setDeleting] = useState(false);

  const handleQuantityChange = async (change: number) => {
    const newQuantity = Math.max(1, (product.quantity || 1) + change);
    
    // Optimistic update
    setProduct(prev => ({
      ...prev,
      quantity: newQuantity,
    }));
    
    try {
      setUpdating(true);
      await updatePantryItemQuantity(product.id, newQuantity);
    } catch (error) {
      console.error('Error updating quantity:', error);
      // Revert on error
      setProduct(prev => ({
        ...prev,
        quantity: product.quantity || 1,
      }));
      Alert.alert('Error', 'Failed to update quantity');
    } finally {
      setUpdating(false);
    }
  };

  const handleDelete = async () => {
    Alert.alert(
      'Remove Item',
      `Are you sure you want to remove ${product.title} from your pantry?`,
      [
        {
          text: 'Cancel',
          style: 'cancel',
        },
        {
          text: 'Remove',
          style: 'destructive',
          onPress: async () => {
            try {
              setDeleting(true);
              await removeFromPantry(product.id);
              navigation.navigate('HomeScreen');
            } catch (error) {
              console.error('Error removing item:', error);
              Alert.alert('Error', 'Failed to remove item from pantry');
            } finally {
              setDeleting(false);
            }
          },
        },
      ]
    );
  };

  const imageSize = width - 40; // Full width with some padding

  return (
    <SafeAreaView style={styles.container}>
      <ScrollView contentContainerStyle={styles.scrollContainer}>
        <View style={styles.header}>
          <Text style={styles.title} numberOfLines={2}>
            {product.title}
          </Text>
          {product.brand && (
            <Text style={styles.brand}>{product.brand}</Text>
          )}
        </View>

        <View style={[styles.imageContainer, { width: imageSize, height: imageSize }]}>
          {product.imageUrl ? (
            <Image
              source={{ uri: product.imageUrl }}
              style={styles.productImage}
              resizeMode="contain"
            />
          ) : (
            <View style={styles.noImage}>
              <MaterialIcons
                name="no-photography"
                size={48}
                color="#999"
              />
              <Text style={styles.noImageText}>No image available</Text>
            </View>
          )}
        </View>


        <View style={styles.detailsContainer}>
          <View style={styles.detailRow}>
            <Text style={styles.detailLabel}>Category:</Text>
            <Text style={styles.detailValue}>
              {product.category || 'Not specified'}
            </Text>
          </View>

          {product.location && (
            <View style={styles.detailRow}>
              <Text style={styles.detailLabel}>Location:</Text>
              <Text style={styles.detailValue}>{product.location}</Text>
            </View>
          )}

          {product.expiryDate && (
            <View style={styles.detailRow}>
              <Text style={styles.detailLabel}>Expires:</Text>
              <Text style={styles.detailValue}>
                {new Date(product.expiryDate).toLocaleDateString()}
              </Text>
            </View>
          )}

          <View style={styles.quantityContainer}>
            <Text style={styles.detailLabel}>Quantity:</Text>
            <View style={styles.quantityControls}>
              <TouchableOpacity
                style={styles.quantityButton}
                onPress={() => handleQuantityChange(-1)}
                disabled={updating}
              >
                <Text style={styles.quantityButtonText}>-</Text>
              </TouchableOpacity>
              <Text style={styles.quantityText}>
                {product.quantity || 1}
              </Text>
              <TouchableOpacity
                style={styles.quantityButton}
                onPress={() => handleQuantityChange(1)}
                disabled={updating}
              >
                <Text style={styles.quantityButtonText}>+</Text>
              </TouchableOpacity>
            </View>
          </View>


          {product.description && (
            <View style={styles.descriptionContainer}>
              <Text style={styles.detailLabel}>Description:</Text>
              <Text style={styles.descriptionText}>{product.description}</Text>
            </View>
          )}

          <View style={styles.buttonContainer}>
            <TouchableOpacity
              style={[styles.button, styles.secondaryButton]}
              onPress={() => navigation.goBack()}
            >
              <Text style={[styles.buttonText, { color: colors.primary }]}>
                Back to Pantry
              </Text>
            </TouchableOpacity>

            <TouchableOpacity
              style={[styles.button, styles.deleteButton]}
              onPress={handleDelete}
              disabled={deleting}
            >
              {deleting ? (
                <ActivityIndicator color="white" />
              ) : (
                <Text style={styles.buttonText}>Remove from Pantry</Text>
              )}
            </TouchableOpacity>
          </View>
        </View>
      </ScrollView>
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#fff',
  },
  scrollContainer: {
    paddingBottom: 40,
  },
  header: {
    padding: 20,
    paddingBottom: 10,
  },
  title: {
    fontSize: 24,
    fontWeight: 'bold',
    color: colors.text,
    marginBottom: 4,
  },
  brand: {
    fontSize: 16,
    color: colors.textSecondary,
    marginBottom: 8,
  },
  imageContainer: {
    alignSelf: 'center',
    backgroundColor: colors.background,
    borderRadius: 12,
    margin: 20,
    justifyContent: 'center',
    alignItems: 'center',
    overflow: 'hidden',
  },
  productImage: {
    width: '100%',
    height: '100%',
  },
  noImage: {
    padding: 20,
    alignItems: 'center',
    justifyContent: 'center',
  },
  noImageText: {
    marginTop: 8,
    color: colors.textSecondary,
  },
  detailsContainer: {
    padding: 20,
    paddingTop: 0,
  },
  detailRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    paddingVertical: 12,
    borderBottomWidth: 1,
    borderBottomColor: colors.border,
  },
  detailLabel: {
    fontSize: 16,
    color: colors.textSecondary,
    flex: 1,
  },
  detailValue: {
    fontSize: 16,
    color: colors.text,
    flex: 2,
    textAlign: 'right',
  },
  quantityContainer: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    paddingVertical: 12,
    borderBottomWidth: 1,
    borderBottomColor: colors.border,
  },
  quantityControls: {
    flexDirection: 'row',
    alignItems: 'center',
  },
  quantityButton: {
    width: 36,
    height: 36,
    borderRadius: 18,
    backgroundColor: colors.primary,
    justifyContent: 'center',
    alignItems: 'center',
  },
  quantityButtonText: {
    color: '#fff',
    fontSize: 18,
    fontWeight: 'bold',
  },
  quantityText: {
    fontSize: 18,
    fontWeight: '600',
    marginHorizontal: 16,
    color: colors.text,
    minWidth: 24,
    textAlign: 'center',
  },
  descriptionContainer: {
    marginTop: 20,
    paddingBottom: 20,
    borderBottomWidth: 1,
    borderBottomColor: colors.border,
  },
  descriptionText: {
    fontSize: 16,
    color: colors.text,
    marginTop: 8,
    lineHeight: 24,
  },
  buttonContainer: {
    marginTop: 24,
    gap: 12,
  },
  button: {
    borderRadius: 8,
    padding: 16,
    alignItems: 'center',
    justifyContent: 'center',
  },
  secondaryButton: {
    backgroundColor: '#f5f5f5',
    borderWidth: 1,
    borderColor: colors.primary,
  },
  deleteButton: {
    backgroundColor: '#ff3b30',
  },
  buttonText: {
    fontSize: 16,
    fontWeight: '600',
    color: '#fff',
  },
});
