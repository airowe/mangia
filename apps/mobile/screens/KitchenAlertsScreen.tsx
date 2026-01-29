// screens/KitchenAlertsScreen.tsx
// Kitchen alerts showing expired and expiring items
// Design reference: expired_items_alerts/code.html

import React, { useState, useCallback, useEffect } from "react";
import {
  View,
  Text,
  StyleSheet,
  TouchableOpacity,
  ScrollView,
  RefreshControl,
  ActivityIndicator,
  Alert,
} from "react-native";
import { MaterialCommunityIcons } from "@expo/vector-icons";
import { useNavigation } from "@react-navigation/native";
import ReanimatedAnimated, { FadeIn, FadeInDown, FadeInRight } from "react-native-reanimated";
import { useSafeAreaInsets } from "react-native-safe-area-context";

import { Screen } from "../components/Screen";
import { mangiaColors } from "../theme/tokens/colors";
import { fontFamily } from "../theme/tokens/typography";
import { fetchPantryAlerts, type AlertItem } from "../lib/kitchenAlerts";
import { removeFromPantry } from "../lib/pantry";
import { isAbortError } from "../hooks/useAbortableEffect";

// Filter categories: display label → DB category value
const FILTER_CATEGORIES: { label: string; value: string | null }[] = [
  { label: "All", value: null },
  { label: "Dairy", value: "dairy_eggs" },
  { label: "Produce", value: "produce" },
  { label: "Pantry", value: "pantry" },
  { label: "Proteins", value: "meat_seafood" },
];

export default function KitchenAlertsScreen() {
  const navigation = useNavigation();
  const insets = useSafeAreaInsets();

  const [activeFilter, setActiveFilter] = useState<string | null>(null);
  const [expiredItems, setExpiredItems] = useState<AlertItem[]>([]);
  const [expiringItems, setExpiringItems] = useState<AlertItem[]>([]);
  const [loading, setLoading] = useState(true);
  const [refreshing, setRefreshing] = useState(false);

  const loadAlerts = useCallback(
    async (category: string | null, signal?: AbortSignal) => {
      try {
        const params = category ? { category } : {};
        const result = await fetchPantryAlerts(params, { signal });
        if (!signal?.aborted) {
          setExpiredItems(result.expired);
          setExpiringItems(result.expiring);
        }
      } catch (err) {
        if (isAbortError(err)) return;
        console.error("Failed to load alerts:", err);
      } finally {
        if (!signal?.aborted) {
          setLoading(false);
          setRefreshing(false);
        }
      }
    },
    []
  );

  // Fetch on mount and when filter changes
  useEffect(() => {
    setLoading(true);
    const abortController = new AbortController();
    loadAlerts(activeFilter, abortController.signal);
    return () => { abortController.abort(); };
  }, [activeFilter, loadAlerts]);

  const handleRefresh = useCallback(() => {
    setRefreshing(true);
    loadAlerts(activeFilter);
  }, [activeFilter, loadAlerts]);

  const handleBack = useCallback(() => {
    navigation.goBack();
  }, [navigation]);

  const handleClearAll = useCallback(() => {
    if (expiredItems.length === 0) return;
    Alert.alert(
      "Remove Expired Items",
      `Remove ${expiredItems.length} expired item${expiredItems.length > 1 ? "s" : ""} from your pantry?`,
      [
        { text: "Cancel", style: "cancel" },
        {
          text: "Remove All",
          style: "destructive",
          onPress: async () => {
            setLoading(true);
            // Delete sequentially to avoid overwhelming the server
            let failures = 0;
            for (const item of expiredItems) {
              try {
                await removeFromPantry(item.id);
              } catch {
                failures++;
              }
            }
            if (failures > 0) {
              Alert.alert("Error", `Failed to remove ${failures} item${failures > 1 ? "s" : ""}`);
            }
            loadAlerts(activeFilter);
          },
        },
      ]
    );
  }, [expiredItems, activeFilter, loadAlerts]);

  const handleDeleteItem = useCallback(async (itemId: string) => {
    try {
      await removeFromPantry(itemId);
      // Optimistic removal from local state
      setExpiredItems((prev) => prev.filter((i) => i.id !== itemId));
      setExpiringItems((prev) => prev.filter((i) => i.id !== itemId));
    } catch (err) {
      console.error("Failed to delete item:", err);
      Alert.alert("Error", "Failed to remove item from pantry");
    }
  }, []);

  const handleAddToList = useCallback((item: AlertItem) => {
    Alert.alert("Added to List", `${item.name} added to shopping list`);
  }, []);

  const handleFindRecipes = useCallback((item: AlertItem) => {
    // TODO: Navigate to recipes using this ingredient
    Alert.alert("Find Recipes", `Finding recipes for ${item.name}...`);
  }, []);

  const renderExpiredCard = useCallback((item: AlertItem, index: number) => (
    <ReanimatedAnimated.View
      key={item.id}
      entering={FadeInDown.delay(index * 80).duration(300)}
    >
      <View style={styles.expiredCard}>
        {/* Left accent bar */}
        <View style={styles.expiredAccent} />

        {/* Content */}
        <View style={styles.cardContent}>
          {/* Thumbnail */}
          <View style={styles.thumbnailContainer}>
            <View style={styles.thumbnailPlaceholder}>
              <MaterialCommunityIcons
                name="food-variant"
                size={24}
                color={mangiaColors.terracotta}
              />
            </View>
            <View style={styles.thumbnailOverlay} />
          </View>

          {/* Details */}
          <View style={styles.cardDetails}>
            <Text style={styles.cardTitle}>{item.name}</Text>
            <View style={styles.expiryRow}>
              <MaterialCommunityIcons
                name="alert-circle"
                size={14}
                color={mangiaColors.terracotta}
              />
              <Text style={styles.expiredText}>EXPIRED: {item.expiryText}</Text>
            </View>
          </View>
        </View>

        {/* Actions */}
        <View style={styles.cardActions}>
          <TouchableOpacity
            style={styles.deleteButton}
            onPress={() => handleDeleteItem(item.id)}
          >
            <MaterialCommunityIcons
              name="delete-outline"
              size={20}
              color={mangiaColors.terracotta}
            />
          </TouchableOpacity>
          <TouchableOpacity
            style={styles.addToListButton}
            onPress={() => handleAddToList(item)}
          >
            <MaterialCommunityIcons
              name="plus"
              size={14}
              color={mangiaColors.white}
            />
            <Text style={styles.addToListText}>List</Text>
          </TouchableOpacity>
        </View>
      </View>
    </ReanimatedAnimated.View>
  ), [handleDeleteItem, handleAddToList]);

  const renderExpiringCard = useCallback((item: AlertItem, index: number) => (
    <ReanimatedAnimated.View
      key={item.id}
      entering={FadeInDown.delay(index * 80 + 200).duration(300)}
    >
      <View style={styles.expiringCard}>
        {/* Left accent bar */}
        <View style={styles.expiringAccent} />

        {/* Content */}
        <View style={styles.cardContent}>
          {/* Thumbnail */}
          <View style={styles.thumbnailContainer}>
            <View style={[styles.thumbnailPlaceholder, styles.thumbnailPlaceholderSage]}>
              <MaterialCommunityIcons
                name="food-apple"
                size={24}
                color={mangiaColors.sage}
              />
            </View>
          </View>

          {/* Details */}
          <View style={styles.cardDetails}>
            <Text style={styles.cardTitle}>{item.name}</Text>
            <View style={styles.expiryRow}>
              <MaterialCommunityIcons
                name="clock-outline"
                size={14}
                color="#7A8F72"
              />
              <Text style={styles.expiringText}>{item.expiryText}</Text>
            </View>
          </View>
        </View>

        {/* Actions */}
        <TouchableOpacity
          style={styles.findRecipesButton}
          onPress={() => handleFindRecipes(item)}
        >
          <Text style={styles.findRecipesText}>Find Recipes</Text>
        </TouchableOpacity>
      </View>
    </ReanimatedAnimated.View>
  ), [handleFindRecipes]);

  return (
    <Screen style={styles.container} noPadding>
      {/* Header */}
      <ReanimatedAnimated.View
        entering={FadeIn.duration(300)}
        style={[styles.header, { paddingTop: insets.top + 8 }]}
      >
        <View style={styles.headerRow}>
          <TouchableOpacity onPress={handleBack} style={styles.headerButton}>
            <MaterialCommunityIcons
              name="chevron-left"
              size={32}
              color={mangiaColors.dark}
            />
          </TouchableOpacity>

          <View style={styles.headerCenter}>
            <Text style={styles.headerTitle}>Kitchen Alerts</Text>
            <Text style={styles.headerSubtitle}>Inventory Status</Text>
          </View>

          <TouchableOpacity onPress={handleClearAll} style={styles.clearAllButton}>
            <Text style={styles.clearAllText}>Clear All</Text>
          </TouchableOpacity>
        </View>

        {/* Category Filter Pills */}
        <ScrollView
          horizontal
          showsHorizontalScrollIndicator={false}
          contentContainerStyle={styles.filterContainer}
        >
          {FILTER_CATEGORIES.map((filter, index) => (
            <ReanimatedAnimated.View
              key={filter.label}
              entering={FadeInRight.delay(index * 50).duration(200)}
            >
              <TouchableOpacity
                style={[
                  styles.filterPill,
                  activeFilter === filter.value && styles.filterPillActive,
                ]}
                onPress={() => setActiveFilter(filter.value)}
              >
                <Text
                  style={[
                    styles.filterPillText,
                    activeFilter === filter.value && styles.filterPillTextActive,
                  ]}
                >
                  {filter.label}
                </Text>
              </TouchableOpacity>
            </ReanimatedAnimated.View>
          ))}
        </ScrollView>
      </ReanimatedAnimated.View>

      {/* Content */}
      <ScrollView
        style={styles.scrollView}
        contentContainerStyle={[
          styles.scrollContent,
          { paddingBottom: insets.bottom + 100 },
        ]}
        showsVerticalScrollIndicator={false}
        refreshControl={
          <RefreshControl
            refreshing={refreshing}
            onRefresh={handleRefresh}
            tintColor={mangiaColors.terracotta}
          />
        }
      >
        {loading ? (
          <View style={styles.loadingContainer}>
            <ActivityIndicator size="large" color={mangiaColors.terracotta} />
          </View>
        ) : (
        <>
        {/* Expired Section */}
        {expiredItems.length > 0 && (
          <ReanimatedAnimated.View
            entering={FadeInDown.delay(100).duration(400)}
            style={styles.section}
          >
            <View style={styles.sectionHeader}>
              <Text style={styles.sectionTitleExpired}>Expired</Text>
              <Text style={styles.sectionSubtitleExpired}>Action required</Text>
            </View>
            <View style={styles.cardList}>
              {expiredItems.map(renderExpiredCard)}
            </View>
          </ReanimatedAnimated.View>
        )}

        {/* Expiring Soon Section */}
        {expiringItems.length > 0 && (
          <ReanimatedAnimated.View
            entering={FadeInDown.delay(200).duration(400)}
            style={styles.section}
          >
            <View style={styles.sectionHeader}>
              <Text style={styles.sectionTitleExpiring}>Expiring Soon</Text>
              <Text style={styles.sectionSubtitleExpiring}>Plan ahead</Text>
            </View>
            <View style={styles.cardList}>
              {expiringItems.map(renderExpiringCard)}
            </View>
          </ReanimatedAnimated.View>
        )}

        {/* Empty State */}
        {expiredItems.length === 0 && expiringItems.length === 0 && (
          <ReanimatedAnimated.View
            entering={FadeIn.delay(300).duration(400)}
            style={styles.emptyState}
          >
            <MaterialCommunityIcons
              name="check-circle-outline"
              size={64}
              color={mangiaColors.sage}
            />
            <Text style={styles.emptyStateTitle}>All Clear!</Text>
            <Text style={styles.emptyStateText}>
              No expired or expiring items in your pantry.
            </Text>
          </ReanimatedAnimated.View>
        )}

        </>
        )}

        {/* Bottom spacer illustration */}
        <View style={styles.bottomSpacer}>
          <MaterialCommunityIcons
            name="stove"
            size={32}
            color={mangiaColors.taupe}
          />
          <Text style={styles.bottomSpacerText}>Scroll for more inventory</Text>
        </View>
      </ScrollView>
    </Screen>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: "#FAF9F6",
  },

  // Header
  header: {
    backgroundColor: "rgba(250, 249, 246, 0.9)",
    borderBottomWidth: 1,
    borderBottomColor: "#E5E0DC",
  },
  headerRow: {
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "space-between",
    paddingHorizontal: 16,
    paddingBottom: 12,
  },
  headerButton: {
    width: 40,
    height: 40,
    justifyContent: "center",
    alignItems: "center",
    borderRadius: 20,
  },
  headerCenter: {
    alignItems: "center",
  },
  headerTitle: {
    fontFamily: fontFamily.serif,
    fontSize: 24,
    fontWeight: "700",
    color: mangiaColors.dark,
    letterSpacing: -0.3,
  },
  headerSubtitle: {
    fontFamily: fontFamily.serif,
    fontSize: 14,
    fontStyle: "italic",
    color: mangiaColors.terracotta,
    marginTop: 2,
  },
  clearAllButton: {
    paddingHorizontal: 8,
  },
  clearAllText: {
    fontFamily: fontFamily.bold,
    fontSize: 12,
    color: mangiaColors.brown,
    textTransform: "uppercase",
    letterSpacing: 1,
  },

  // Filters
  filterContainer: {
    paddingHorizontal: 16,
    paddingBottom: 16,
    gap: 12,
  },
  filterPill: {
    paddingHorizontal: 20,
    paddingVertical: 8,
    borderRadius: 24,
    borderWidth: 1,
    borderColor: "#E5E0DC",
    backgroundColor: "transparent",
  },
  filterPillActive: {
    backgroundColor: mangiaColors.dark,
    borderColor: mangiaColors.dark,
  },
  filterPillText: {
    fontFamily: fontFamily.medium,
    fontSize: 14,
    color: mangiaColors.brown,
  },
  filterPillTextActive: {
    color: mangiaColors.white,
  },

  // Scroll
  scrollView: {
    flex: 1,
  },
  scrollContent: {
    paddingHorizontal: 16,
    paddingTop: 16,
  },

  // Loading
  loadingContainer: {
    flex: 1,
    justifyContent: "center",
    alignItems: "center",
    paddingVertical: 64,
  },

  // Sections
  section: {
    marginBottom: 32,
  },
  sectionHeader: {
    flexDirection: "row",
    alignItems: "baseline",
    justifyContent: "space-between",
    marginBottom: 12,
    paddingHorizontal: 4,
  },
  sectionTitleExpired: {
    fontFamily: fontFamily.serif,
    fontSize: 30,
    fontWeight: "700",
    color: mangiaColors.terracotta,
    letterSpacing: -0.5,
  },
  sectionSubtitleExpired: {
    fontFamily: fontFamily.serif,
    fontSize: 14,
    fontStyle: "italic",
    color: `${mangiaColors.terracotta}CC`,
  },
  sectionTitleExpiring: {
    fontFamily: fontFamily.serif,
    fontSize: 24,
    fontWeight: "700",
    color: "#7A8F72",
    letterSpacing: -0.3,
  },
  sectionSubtitleExpiring: {
    fontFamily: fontFamily.serif,
    fontSize: 14,
    fontStyle: "italic",
    color: "#7A8F72CC",
  },

  // Card List
  cardList: {
    gap: 12,
  },

  // Expired Card
  expiredCard: {
    flexDirection: "row",
    alignItems: "center",
    backgroundColor: `${mangiaColors.terracotta}15`,
    borderRadius: 12,
    borderWidth: 1,
    borderColor: `${mangiaColors.terracotta}30`,
    padding: 12,
    paddingRight: 16,
    overflow: "hidden",
  },
  expiredAccent: {
    position: "absolute",
    left: 0,
    top: 0,
    bottom: 0,
    width: 4,
    backgroundColor: mangiaColors.terracotta,
  },
  cardContent: {
    flex: 1,
    flexDirection: "row",
    alignItems: "center",
    gap: 16,
    paddingLeft: 8,
  },
  thumbnailContainer: {
    width: 64,
    height: 64,
    borderRadius: 8,
    overflow: "hidden",
    position: "relative",
  },
  thumbnailPlaceholder: {
    flex: 1,
    backgroundColor: `${mangiaColors.terracotta}20`,
    justifyContent: "center",
    alignItems: "center",
  },
  thumbnailPlaceholderSage: {
    backgroundColor: `${mangiaColors.sage}30`,
  },
  thumbnailOverlay: {
    ...StyleSheet.absoluteFillObject,
    backgroundColor: `${mangiaColors.terracotta}10`,
  },
  cardDetails: {
    flex: 1,
  },
  cardTitle: {
    fontFamily: fontFamily.serif,
    fontSize: 18,
    fontWeight: "700",
    color: mangiaColors.dark,
    marginBottom: 4,
  },
  expiryRow: {
    flexDirection: "row",
    alignItems: "center",
    gap: 6,
  },
  expiredText: {
    fontFamily: fontFamily.bold,
    fontSize: 12,
    color: mangiaColors.terracotta,
    textTransform: "uppercase",
    letterSpacing: 0.5,
  },
  expiringText: {
    fontFamily: fontFamily.medium,
    fontSize: 14,
    color: "#7A8F72",
  },
  cardActions: {
    gap: 8,
    alignItems: "flex-end",
  },
  deleteButton: {
    width: 32,
    height: 32,
    borderRadius: 16,
    backgroundColor: "rgba(255, 255, 255, 0.5)",
    justifyContent: "center",
    alignItems: "center",
  },
  addToListButton: {
    flexDirection: "row",
    alignItems: "center",
    gap: 4,
    paddingHorizontal: 12,
    paddingVertical: 8,
    borderRadius: 8,
    backgroundColor: mangiaColors.terracotta,
  },
  addToListText: {
    fontFamily: fontFamily.bold,
    fontSize: 11,
    color: mangiaColors.white,
    textTransform: "uppercase",
    letterSpacing: 0.5,
  },

  // Expiring Card
  expiringCard: {
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "space-between",
    backgroundColor: `${mangiaColors.sage}25`,
    borderRadius: 12,
    borderWidth: 1,
    borderColor: `${mangiaColors.sage}40`,
    padding: 12,
    paddingRight: 16,
    overflow: "hidden",
  },
  expiringAccent: {
    position: "absolute",
    left: 0,
    top: 0,
    bottom: 0,
    width: 4,
    backgroundColor: mangiaColors.sage,
  },
  findRecipesButton: {
    paddingHorizontal: 16,
    paddingVertical: 10,
    borderRadius: 8,
    backgroundColor: mangiaColors.white,
    borderWidth: 1,
    borderColor: `${mangiaColors.sage}40`,
  },
  findRecipesText: {
    fontFamily: fontFamily.bold,
    fontSize: 11,
    color: "#7A8F72",
    textTransform: "uppercase",
    letterSpacing: 0.5,
  },

  // Empty State
  emptyState: {
    flex: 1,
    alignItems: "center",
    justifyContent: "center",
    paddingVertical: 80,
  },
  emptyStateTitle: {
    fontFamily: fontFamily.serif,
    fontSize: 28,
    fontWeight: "600",
    color: mangiaColors.dark,
    marginTop: 16,
    marginBottom: 8,
  },
  emptyStateText: {
    fontFamily: fontFamily.regular,
    fontSize: 16,
    color: mangiaColors.brown,
    textAlign: "center",
  },

  // Bottom Spacer
  bottomSpacer: {
    alignItems: "center",
    paddingVertical: 32,
    opacity: 0.4,
  },
  bottomSpacerText: {
    fontFamily: fontFamily.serif,
    fontSize: 14,
    fontStyle: "italic",
    color: mangiaColors.brown,
    marginTop: 8,
  },
});
