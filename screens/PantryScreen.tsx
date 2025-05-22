import React, { useEffect, useState, useCallback } from "react";
import {
  View,
  Text,
  StyleSheet,
  RefreshControl,
  SectionList,
  TouchableOpacity,
} from "react-native";
import { colors } from "../theme/colors";
import { Product } from "../models/Product";
import PantryGroup from "../components/PantryGroup";
import { fetchPantryItems } from "../lib/pantry";
import { Screen } from "../components/Screen";
import { useNavigation } from "@react-navigation/native";
import { StackNavigationProp } from "@react-navigation/stack";

type RootStackParamList = {
  AddProduct: { category: string };
  // Add other screens as needed
};

type PantryScreenNavigationProp = StackNavigationProp<RootStackParamList, 'AddProduct'>;

const CATEGORIES = [
  "Cooking & Baking Ingredients",
  "Grains, Rice & Cereal",
  "Pasta & Noodles",
  "Fruits & Vegetables",
  "Dips & Spreads",
  "Soups & Broths",
];

export default function PantryScreen() {
  const [products, setProducts] = useState<Product[]>([]);
  const [refreshing, setRefreshing] = useState(false);

  const loadItems = useCallback(async () => {
    const items = await fetchPantryItems();
    setProducts(items);
  }, []);

  const onRefresh = async () => {
    setRefreshing(true);
    await loadItems();
    setRefreshing(false);
  };

  const handleDelete = async (id: string) => {
    await loadItems();
  };

  useEffect(() => {
    loadItems();
  }, [loadItems]);

  // Prepare sections for SectionList
  const sections = CATEGORIES.map((category) => ({
    title: category,
    data: [products.filter((p) => p.category === category)],
  }));

  const navigation = useNavigation<PantryScreenNavigationProp>();

  return (
    <Screen noPadding>
      <View style={styles.container}>
        {products.length === 0 ? (
          <View style={styles.emptyState}>
            <Text style={styles.emptyText}>Your pantry is empty</Text>
            <Text style={styles.emptySubtext}>Add items to get started</Text>
          </View>
        ) : (
          <SectionList
            sections={sections}
            keyExtractor={(_, index) => index.toString()}
            refreshControl={
              <RefreshControl
                refreshing={refreshing}
                onRefresh={onRefresh}
                colors={[colors.primary]}
              />
            }
            renderSectionHeader={({ section: { title } }) => (
              <View style={styles.sectionHeader}>
                <Text style={styles.sectionTitle}>{title}</Text>
                <TouchableOpacity
                  style={styles.addButton}
                  onPress={() =>
                    navigation?.navigate?.("AddProduct", { category: title })
                  }
                >
                  <Text style={styles.addButtonText}>+</Text>
                </TouchableOpacity>
              </View>
            )}
            renderItem={({ item }) => (
              <PantryGroup items={item} onDelete={handleDelete} />
            )}
            stickySectionHeadersEnabled={false}
            contentContainerStyle={{ paddingBottom: 24 }}
          />
        )}
      </View>
    </Screen>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: colors.background,
    paddingTop: 16,
    paddingBottom: 16,
  },
  emptyState: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
    padding: 20,
  },
  emptyText: {
    fontSize: 18,
    fontWeight: '600',
    color: colors.text,
    marginBottom: 8,
  },
  emptySubtext: {
    fontSize: 14,
    color: colors.secondary,
  },
  sectionHeader: {
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "space-between",
    marginBottom: 4,
    marginTop: 24,
  },
  sectionTitle: {
    fontSize: 14,
    fontWeight: "600",
    flex: 1,
    color: "#000",
  },
  addButton: {
    backgroundColor: colors.primary,
    borderRadius: 24,
    paddingVertical: 6,
    paddingHorizontal: 14,
    marginLeft: 12,
  },
  addButtonText: {
    color: "#fff",
    fontWeight: "600",
    fontSize: 16,
  },
});
