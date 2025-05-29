import React, { useState } from "react";
import { View, StyleSheet, ScrollView, Alert } from "react-native";
import {
  TextInput,
  Button,
  Text,
  useTheme,
  Portal,
  Modal,
  IconButton,
} from "react-native-paper";
import { Product } from "../models/Product";
import { addToPantry } from "../lib/pantry";

interface ManualEntryScreenProps {
  navigation: any;
  route: any;
}

export const ManualEntryScreen = ({
  navigation,
  route,
}: ManualEntryScreenProps) => {
  const { colors } = useTheme();
  const [product, setProduct] = useState<Partial<Product>>({
    title: "",
    category: "Other",
    quantity: 1,
    unit: "unit",
    location: "Pantry",
    description: "",
  });
  const [isLoading, setIsLoading] = useState(false);
  const [showCategoryModal, setShowCategoryModal] = useState(false);
  const [showUnitModal, setShowUnitModal] = useState(false);
  const [showLocationModal, setShowLocationModal] = useState(false);

  const categories = [
    "Fruits",
    "Vegetables",
    "Dairy",
    "Meat",
    "Bakery",
    "Beverages",
    "Snacks",
    "Canned Goods",
    "Frozen",
    "Other",
  ];
  const units = [
    "unit",
    "g",
    "kg",
    "ml",
    "L",
    "oz",
    "lb",
    "box",
    "pack",
    "bottle",
    "can",
    "bag",
  ];
  const locations = [
    "Pantry",
    "Refrigerator",
    "Freezer",
    "Spice Rack",
    "Other",
  ];

  const handleSave = async () => {
    if (!product.title) {
      Alert.alert("Error", "Please enter a product name");
      return;
    }

    setIsLoading(true);
    try {
      const newProduct: Product = {
        id: Date.now().toString(),
        title: product.title || "",
        category: product.category || "Other",
        quantity: product.quantity || 1,
        unit: product.unit || "unit",
        location: product.location || "Pantry",
        description: product.description || "",
        image: product.image,
        created_at: new Date().toISOString(),
      };

      const { data, error } = await addToPantry(newProduct);

      if (error) {
        throw error;
      }

      navigation.goBack();
    } catch (error) {
      console.error("Error saving product:", error);
      Alert.alert("Error", "Failed to save product. Please try again.");
    } finally {
      setIsLoading(false);
    }
  };

  return (
    <View style={[styles.container, { backgroundColor: colors.background }]}>
      <ScrollView contentContainerStyle={styles.scrollContent}>
        <TextInput
          label="Product Name *"
          value={product.title}
          onChangeText={(text) => setProduct({ ...product, title: text })}
          style={styles.input}
          mode="outlined"
        />

        <TextInput
          label="Category"
          value={product.category}
          onPressIn={() => setShowCategoryModal(true)}
          style={styles.input}
          mode="outlined"
          right={<TextInput.Icon icon="menu-down" />}
        />

        <View style={styles.row}>
          <View style={[styles.input, { flex: 1, marginRight: 8 }]}>
            <Text style={styles.label}>Quantity</Text>
            <View style={styles.quantityContainer}>
              <IconButton
                icon="minus"
                size={20}
                onPress={() =>
                  setProduct((prev) => ({
                    ...prev,
                    quantity: Math.max(1, (prev.quantity || 1) - 1),
                  }))
                }
              />
              <Text style={styles.quantityText}>{product.quantity}</Text>
              <IconButton
                icon="plus"
                size={20}
                onPress={() =>
                  setProduct((prev) => ({
                    ...prev,
                    quantity: (prev.quantity || 1) + 1,
                  }))
                }
              />
            </View>
          </View>

          <View style={[styles.input, { flex: 1 }]}>
            <Text style={styles.label}>Unit</Text>
            <Button
              mode="outlined"
              onPress={() => setShowUnitModal(true)}
              style={styles.unitButton}
            >
              {product.unit}
            </Button>
          </View>
        </View>

        <View style={[styles.input, { marginBottom: 16 }]}>
          <Text style={styles.label}>Location</Text>
          <Button
            mode="outlined"
            onPress={() => setShowLocationModal(true)}
            style={styles.locationButton}
            contentStyle={{ justifyContent: "space-between" }}
            icon="map-marker"
          >
            {product.location}
          </Button>
        </View>

        <TextInput
          label="Description (Optional)"
          value={product.description}
          onChangeText={(text) => setProduct({ ...product, description: text })}
          style={[styles.input, { minHeight: 100 }]}
          mode="outlined"
          multiline
          numberOfLines={4}
        />

        <Button
          mode="contained"
          onPress={handleSave}
          style={styles.saveButton}
          loading={isLoading}
          disabled={isLoading}
        >
          Save to Pantry
        </Button>
      </ScrollView>

      {/* Category Picker Modal */}
      <Portal>
        <Modal
          visible={showCategoryModal}
          onDismiss={() => setShowCategoryModal(false)}
          contentContainerStyle={[
            styles.modalContainer,
            { backgroundColor: colors.surface },
          ]}
        >
          <Text style={[styles.modalTitle, { color: colors.onSurface }]}>
            Select Category
          </Text>
          {categories.map((category) => (
            <Button
              key={category}
              onPress={() => {
                setProduct({ ...product, category });
                setShowCategoryModal(false);
              }}
              style={styles.modalItem}
            >
              {category}
            </Button>
          ))}
        </Modal>

        {/* Unit Picker Modal */}
        <Modal
          visible={showUnitModal}
          onDismiss={() => setShowUnitModal(false)}
          contentContainerStyle={[
            styles.modalContainer,
            { backgroundColor: colors.surface },
          ]}
        >
          <Text style={[styles.modalTitle, { color: colors.onSurface }]}>
            Select Unit
          </Text>
          {units.map((unit) => (
            <Button
              key={unit}
              onPress={() => {
                setProduct({ ...product, unit });
                setShowUnitModal(false);
              }}
              style={styles.modalItem}
            >
              {unit}
            </Button>
          ))}
        </Modal>

        {/* Location Picker Modal */}
        <Modal
          visible={showLocationModal}
          onDismiss={() => setShowLocationModal(false)}
          contentContainerStyle={[
            styles.modalContainer,
            { backgroundColor: colors.surface },
          ]}
        >
          <Text style={[styles.modalTitle, { color: colors.onSurface }]}>
            Select Location
          </Text>
          {locations.map((location) => (
            <Button
              key={location}
              onPress={() => {
                setProduct({ ...product, location });
                setShowLocationModal(false);
              }}
              style={styles.modalItem}
              icon={
                location === "Refrigerator"
                  ? "fridge"
                  : location === "Freezer"
                  ? "snowflake"
                  : location === "Spice Rack"
                  ? "bottle-tonic"
                  : "shopping"
              }
            >
              {location}
            </Button>
          ))}
        </Modal>
      </Portal>
    </View>
  );
};

const styles = StyleSheet.create({
  container: {
    flex: 1,
    padding: 16,
  },
  scrollContent: {
    paddingBottom: 24,
  },
  input: {
    marginBottom: 16,
  },
  row: {
    flexDirection: "row",
    justifyContent: "space-between",
  },
  quantityContainer: {
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "space-between",
    borderWidth: 1,
    borderColor: "#ccc",
    borderRadius: 4,
    paddingHorizontal: 8,
    marginTop: 8,
  },
  quantityText: {
    fontSize: 16,
    fontWeight: "bold",
  },
  unitButton: {
    marginTop: 8,
    borderColor: "#ccc",
  },
  locationButton: {
    marginTop: 8,
    borderColor: "#ccc",
    justifyContent: "space-between",
  },
  saveButton: {
    marginTop: 16,
    paddingVertical: 6,
  },
  label: {
    fontSize: 12,
    marginBottom: 4,
    color: "rgba(0, 0, 0, 0.54)",
  },
  modalContainer: {
    backgroundColor: "white",
    padding: 20,
    margin: 20,
    borderRadius: 8,
  },
  modalTitle: {
    fontSize: 18,
    fontWeight: "bold",
    marginBottom: 16,
    textAlign: "center",
  },
  modalItem: {
    marginVertical: 4,
  },
});
