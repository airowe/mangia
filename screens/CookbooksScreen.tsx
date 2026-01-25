import React, { useState, useEffect, useCallback } from "react";
import {
  View,
  StyleSheet,
  FlatList,
  TouchableOpacity,
  RefreshControl,
  Image,
  Alert,
} from "react-native";
import {
  Text,
  Searchbar,
  FAB,
  ActivityIndicator,
  Portal,
  Modal,
  TextInput,
  Button,
  IconButton,
  Surface,
} from "react-native-paper";
import { MaterialCommunityIcons } from "@expo/vector-icons";
import { useNavigation } from "@react-navigation/native";
import { StackNavigationProp } from "@react-navigation/stack";
import debounce from "lodash/debounce";

import { Screen } from "../components/Screen";
import { colors } from "../theme/colors";
import { Cookbook } from "../models/Cookbook";
import {
  fetchCookbooks,
  searchCookbooks,
  createCookbook,
  deleteCookbook,
} from "../lib/cookbookService";
import { usePremiumFeature } from "../hooks/usePremiumFeature";

type RootStackParamList = {
  SubscriptionScreen: undefined;
};

type NavigationProp = StackNavigationProp<RootStackParamList>;

export default function CookbooksScreen() {
  const navigation = useNavigation<NavigationProp>();
  const { isPremium, requirePremium } = usePremiumFeature();

  const [cookbooks, setCookbooks] = useState<Cookbook[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [isRefreshing, setIsRefreshing] = useState(false);
  const [searchQuery, setSearchQuery] = useState("");
  const [showAddModal, setShowAddModal] = useState(false);
  const [isAdding, setIsAdding] = useState(false);

  // New cookbook form state
  const [newCookbook, setNewCookbook] = useState({
    title: "",
    author: "",
    isbn: "",
  });

  // Check premium access on mount
  useEffect(() => {
    if (!isPremium) {
      requirePremium("cookbook_collection");
    }
  }, [isPremium, requirePremium]);

  // Load cookbooks
  const loadCookbooks = useCallback(async () => {
    if (!isPremium) return;

    try {
      const data = await fetchCookbooks();
      setCookbooks(data);
    } catch (error) {
      console.error("Error loading cookbooks:", error);
      Alert.alert("Error", "Failed to load cookbooks");
    } finally {
      setIsLoading(false);
      setIsRefreshing(false);
    }
  }, [isPremium]);

  useEffect(() => {
    loadCookbooks();
  }, [loadCookbooks]);

  // Search handler with debounce
  const handleSearch = useCallback(
    debounce(async (query: string) => {
      if (!isPremium) return;

      if (!query.trim()) {
        loadCookbooks();
        return;
      }

      try {
        setIsLoading(true);
        const results = await searchCookbooks(query);
        setCookbooks(results);
      } catch (error) {
        console.error("Error searching cookbooks:", error);
      } finally {
        setIsLoading(false);
      }
    }, 300),
    [isPremium, loadCookbooks]
  );

  // Handle search input change
  const onSearchChange = (query: string) => {
    setSearchQuery(query);
    handleSearch(query);
  };

  // Pull to refresh
  const handleRefresh = useCallback(() => {
    setIsRefreshing(true);
    setSearchQuery("");
    loadCookbooks();
  }, [loadCookbooks]);

  // Add new cookbook
  const handleAddCookbook = useCallback(async () => {
    if (!newCookbook.title.trim()) {
      Alert.alert("Error", "Please enter a cookbook title");
      return;
    }

    setIsAdding(true);
    try {
      const created = await createCookbook({
        title: newCookbook.title.trim(),
        author: newCookbook.author.trim() || undefined,
        isbn: newCookbook.isbn.trim() || undefined,
      });

      setCookbooks((prev) =>
        [...prev, created].sort((a, b) => a.title.localeCompare(b.title))
      );
      setShowAddModal(false);
      setNewCookbook({ title: "", author: "", isbn: "" });
      Alert.alert("Added!", `"${created.title}" has been added to your collection.`);
    } catch (error) {
      console.error("Error adding cookbook:", error);
      Alert.alert("Error", "Failed to add cookbook");
    } finally {
      setIsAdding(false);
    }
  }, [newCookbook]);

  // Delete cookbook
  const handleDelete = useCallback((cookbook: Cookbook) => {
    Alert.alert(
      "Delete Cookbook",
      `Are you sure you want to remove "${cookbook.title}" from your collection?`,
      [
        { text: "Cancel", style: "cancel" },
        {
          text: "Delete",
          style: "destructive",
          onPress: async () => {
            try {
              await deleteCookbook(cookbook.id);
              setCookbooks((prev) => prev.filter((c) => c.id !== cookbook.id));
            } catch (error) {
              console.error("Error deleting cookbook:", error);
              Alert.alert("Error", "Failed to delete cookbook");
            }
          },
        },
      ]
    );
  }, []);

  // Render cookbook card
  const renderCookbook = ({ item }: { item: Cookbook }) => (
    <Surface style={styles.cookbookCard} elevation={1}>
      <View style={styles.cookbookContent}>
        {/* Cover image or placeholder */}
        {item.cover_image_url ? (
          <Image
            source={{ uri: item.cover_image_url }}
            style={styles.coverImage}
          />
        ) : (
          <View style={[styles.coverImage, styles.coverPlaceholder]}>
            <MaterialCommunityIcons
              name="book-open-page-variant"
              size={32}
              color={colors.textTertiary}
            />
          </View>
        )}

        {/* Cookbook info */}
        <View style={styles.cookbookInfo}>
          <Text style={styles.cookbookTitle} numberOfLines={2}>
            {item.title}
          </Text>
          {item.author && (
            <Text style={styles.cookbookAuthor} numberOfLines={1}>
              by {item.author}
            </Text>
          )}
          {item.isbn && (
            <Text style={styles.cookbookIsbn}>ISBN: {item.isbn}</Text>
          )}
        </View>

        {/* Delete button */}
        <IconButton
          icon="delete-outline"
          size={20}
          iconColor={colors.textSecondary}
          onPress={() => handleDelete(item)}
        />
      </View>
    </Surface>
  );

  // Empty state
  const renderEmptyState = () => {
    if (isLoading) return null;

    if (searchQuery) {
      return (
        <View style={styles.emptyContainer}>
          <MaterialCommunityIcons
            name="magnify"
            size={64}
            color={colors.textTertiary}
          />
          <Text style={styles.emptyTitle}>No Results</Text>
          <Text style={styles.emptySubtitle}>
            No cookbooks found matching "{searchQuery}"
          </Text>
        </View>
      );
    }

    return (
      <View style={styles.emptyContainer}>
        <MaterialCommunityIcons
          name="bookshelf"
          size={64}
          color={colors.textTertiary}
        />
        <Text style={styles.emptyTitle}>Your Cookbook Shelf</Text>
        <Text style={styles.emptySubtitle}>
          Track your physical cookbook collection here. Tap + to add your first
          cookbook!
        </Text>
      </View>
    );
  };

  // Premium gate
  if (!isPremium) {
    return (
      <Screen style={styles.container}>
        <View style={styles.premiumGate}>
          <MaterialCommunityIcons
            name="lock"
            size={64}
            color={colors.textSecondary}
          />
          <Text style={styles.premiumTitle}>Premium Feature</Text>
          <Text style={styles.premiumSubtitle}>
            Upgrade to Premium to track your physical cookbook collection and
            discover recipes you own!
          </Text>
          <Button
            mode="contained"
            onPress={() => navigation.navigate("SubscriptionScreen")}
            style={styles.upgradeButton}
            icon="crown"
          >
            Upgrade to Premium
          </Button>
        </View>
      </Screen>
    );
  }

  return (
    <Screen style={styles.container}>
      {/* Search bar */}
      <View style={styles.searchContainer}>
        <Searchbar
          placeholder="Search cookbooks..."
          onChangeText={onSearchChange}
          value={searchQuery}
          style={styles.searchBar}
          inputStyle={styles.searchInput}
        />
      </View>

      {/* Cookbook count */}
      {!isLoading && cookbooks.length > 0 && (
        <View style={styles.countContainer}>
          <MaterialCommunityIcons
            name="bookshelf"
            size={20}
            color={colors.textSecondary}
          />
          <Text style={styles.countText}>
            {cookbooks.length} cookbook{cookbooks.length !== 1 ? "s" : ""} in
            your collection
          </Text>
        </View>
      )}

      {/* Loading */}
      {isLoading ? (
        <View style={styles.loadingContainer}>
          <ActivityIndicator size="large" color={colors.primary} />
        </View>
      ) : (
        <FlatList
          data={cookbooks}
          renderItem={renderCookbook}
          keyExtractor={(item) => item.id}
          contentContainerStyle={styles.listContent}
          ListEmptyComponent={renderEmptyState}
          refreshControl={
            <RefreshControl
              refreshing={isRefreshing}
              onRefresh={handleRefresh}
              colors={[colors.primary]}
            />
          }
        />
      )}

      {/* FAB to add cookbook */}
      <FAB
        icon="plus"
        style={styles.fab}
        onPress={() => setShowAddModal(true)}
        color="#fff"
      />

      {/* Add Cookbook Modal */}
      <Portal>
        <Modal
          visible={showAddModal}
          onDismiss={() => setShowAddModal(false)}
          contentContainerStyle={styles.modal}
        >
          <Text style={styles.modalTitle}>Add Cookbook</Text>

          <TextInput
            mode="outlined"
            label="Title *"
            value={newCookbook.title}
            onChangeText={(text) =>
              setNewCookbook((prev) => ({ ...prev, title: text }))
            }
            style={styles.input}
            autoFocus
          />

          <TextInput
            mode="outlined"
            label="Author"
            value={newCookbook.author}
            onChangeText={(text) =>
              setNewCookbook((prev) => ({ ...prev, author: text }))
            }
            style={styles.input}
          />

          <TextInput
            mode="outlined"
            label="ISBN (optional)"
            value={newCookbook.isbn}
            onChangeText={(text) =>
              setNewCookbook((prev) => ({ ...prev, isbn: text }))
            }
            style={styles.input}
            keyboardType="numeric"
          />

          <View style={styles.modalActions}>
            <Button
              mode="outlined"
              onPress={() => {
                setShowAddModal(false);
                setNewCookbook({ title: "", author: "", isbn: "" });
              }}
              style={styles.modalButton}
            >
              Cancel
            </Button>
            <Button
              mode="contained"
              onPress={handleAddCookbook}
              loading={isAdding}
              disabled={isAdding || !newCookbook.title.trim()}
              style={styles.modalButton}
            >
              Add
            </Button>
          </View>
        </Modal>
      </Portal>
    </Screen>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: colors.background,
  },
  searchContainer: {
    padding: 16,
    paddingBottom: 8,
  },
  searchBar: {
    backgroundColor: colors.surface,
    elevation: 0,
  },
  searchInput: {
    fontSize: 15,
  },
  countContainer: {
    flexDirection: "row",
    alignItems: "center",
    paddingHorizontal: 16,
    paddingBottom: 8,
    gap: 8,
  },
  countText: {
    fontSize: 14,
    color: colors.textSecondary,
  },
  loadingContainer: {
    flex: 1,
    justifyContent: "center",
    alignItems: "center",
  },
  listContent: {
    padding: 16,
    paddingBottom: 100,
  },
  cookbookCard: {
    borderRadius: 12,
    marginBottom: 12,
    backgroundColor: colors.surface,
    overflow: "hidden",
  },
  cookbookContent: {
    flexDirection: "row",
    alignItems: "center",
    padding: 12,
  },
  coverImage: {
    width: 60,
    height: 80,
    borderRadius: 4,
    backgroundColor: colors.border,
  },
  coverPlaceholder: {
    justifyContent: "center",
    alignItems: "center",
  },
  cookbookInfo: {
    flex: 1,
    marginLeft: 12,
  },
  cookbookTitle: {
    fontSize: 16,
    fontWeight: "600",
    color: colors.text,
    marginBottom: 4,
  },
  cookbookAuthor: {
    fontSize: 14,
    color: colors.textSecondary,
    marginBottom: 2,
  },
  cookbookIsbn: {
    fontSize: 12,
    color: colors.textTertiary,
  },
  emptyContainer: {
    flex: 1,
    justifyContent: "center",
    alignItems: "center",
    paddingVertical: 64,
    paddingHorizontal: 32,
  },
  emptyTitle: {
    fontSize: 20,
    fontWeight: "600",
    color: colors.text,
    marginTop: 16,
  },
  emptySubtitle: {
    fontSize: 14,
    color: colors.textSecondary,
    textAlign: "center",
    marginTop: 8,
    lineHeight: 20,
  },
  fab: {
    position: "absolute",
    right: 16,
    bottom: 16,
    backgroundColor: colors.primary,
  },
  modal: {
    backgroundColor: colors.surface,
    padding: 24,
    margin: 20,
    borderRadius: 16,
  },
  modalTitle: {
    fontSize: 20,
    fontWeight: "600",
    color: colors.text,
    marginBottom: 16,
  },
  input: {
    marginBottom: 12,
    backgroundColor: colors.surface,
  },
  modalActions: {
    flexDirection: "row",
    justifyContent: "flex-end",
    gap: 12,
    marginTop: 8,
  },
  modalButton: {
    minWidth: 80,
  },
  premiumGate: {
    flex: 1,
    justifyContent: "center",
    alignItems: "center",
    padding: 32,
  },
  premiumTitle: {
    fontSize: 24,
    fontWeight: "bold",
    color: colors.text,
    marginTop: 16,
  },
  premiumSubtitle: {
    fontSize: 16,
    color: colors.textSecondary,
    textAlign: "center",
    marginTop: 8,
    marginBottom: 24,
    lineHeight: 24,
  },
  upgradeButton: {
    paddingHorizontal: 24,
  },
});
