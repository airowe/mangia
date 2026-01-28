// screens/KitchenAlertsScreen.tsx
// Kitchen alerts showing expired and expiring items
// Design reference: expired_items_alerts/code.html

import React, { useState, useCallback } from "react";
import {
  View,
  Text,
  StyleSheet,
  TouchableOpacity,
  ScrollView,
  Image,
  Alert,
} from "react-native";
import { MaterialCommunityIcons } from "@expo/vector-icons";
import { useNavigation } from "@react-navigation/native";
import ReanimatedAnimated, { FadeIn, FadeInDown, FadeInRight } from "react-native-reanimated";
import { useSafeAreaInsets } from "react-native-safe-area-context";

import { Screen } from "../components/Screen";
import { mangiaColors } from "../theme/tokens/colors";
import { fontFamily } from "../theme/tokens/typography";

// Alert item types
interface AlertItem {
  id: string;
  name: string;
  imageUrl?: string;
  expiryText: string;
  category: string;
  type: "expired" | "expiring";
}

// Filter categories
const FILTER_CATEGORIES = ["All", "Dairy", "Produce", "Pantry", "Proteins"];

// Mock data for alerts
const MOCK_EXPIRED: AlertItem[] = [
  {
    id: "1",
    name: "Greek Yogurt",
    expiryText: "Yesterday",
    category: "Dairy",
    type: "expired",
  },
  {
    id: "2",
    name: "Heavy Cream",
    expiryText: "2 days ago",
    category: "Dairy",
    type: "expired",
  },
];

const MOCK_EXPIRING: AlertItem[] = [
  {
    id: "3",
    name: "Parmesan Cheese",
    expiryText: "In 3 Days",
    category: "Dairy",
    type: "expiring",
  },
  {
    id: "4",
    name: "Basil Bundle",
    expiryText: "Tomorrow",
    category: "Produce",
    type: "expiring",
  },
  {
    id: "5",
    name: "Ground Beef",
    expiryText: "In 2 Days",
    category: "Proteins",
    type: "expiring",
  },
];

export default function KitchenAlertsScreen() {
  const navigation = useNavigation();
  const insets = useSafeAreaInsets();

  const [activeFilter, setActiveFilter] = useState("All");
  const [expiredItems, setExpiredItems] = useState<AlertItem[]>(MOCK_EXPIRED);
  const [expiringItems, setExpiringItems] = useState<AlertItem[]>(MOCK_EXPIRING);

  const handleBack = useCallback(() => {
    navigation.goBack();
  }, [navigation]);

  const handleClearAll = useCallback(() => {
    Alert.alert(
      "Clear All Alerts",
      "Are you sure you want to clear all alerts?",
      [
        { text: "Cancel", style: "cancel" },
        {
          text: "Clear All",
          style: "destructive",
          onPress: () => {
            setExpiredItems([]);
            setExpiringItems([]);
          },
        },
      ]
    );
  }, []);

  const handleDeleteItem = useCallback((itemId: string, type: "expired" | "expiring") => {
    if (type === "expired") {
      setExpiredItems((prev) => prev.filter((i) => i.id !== itemId));
    } else {
      setExpiringItems((prev) => prev.filter((i) => i.id !== itemId));
    }
  }, []);

  const handleAddToList = useCallback((item: AlertItem) => {
    Alert.alert("Added to List", `${item.name} added to shopping list`);
  }, []);

  const handleFindRecipes = useCallback((item: AlertItem) => {
    // TODO: Navigate to recipes using this ingredient
    Alert.alert("Find Recipes", `Finding recipes for ${item.name}...`);
  }, []);

  const filteredExpired = activeFilter === "All"
    ? expiredItems
    : expiredItems.filter((i) => i.category === activeFilter);

  const filteredExpiring = activeFilter === "All"
    ? expiringItems
    : expiringItems.filter((i) => i.category === activeFilter);

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
            onPress={() => handleDeleteItem(item.id, "expired")}
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
          {FILTER_CATEGORIES.map((category, index) => (
            <ReanimatedAnimated.View
              key={category}
              entering={FadeInRight.delay(index * 50).duration(200)}
            >
              <TouchableOpacity
                style={[
                  styles.filterPill,
                  activeFilter === category && styles.filterPillActive,
                ]}
                onPress={() => setActiveFilter(category)}
              >
                <Text
                  style={[
                    styles.filterPillText,
                    activeFilter === category && styles.filterPillTextActive,
                  ]}
                >
                  {category}
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
      >
        {/* Expired Section */}
        {filteredExpired.length > 0 && (
          <ReanimatedAnimated.View
            entering={FadeInDown.delay(100).duration(400)}
            style={styles.section}
          >
            <View style={styles.sectionHeader}>
              <Text style={styles.sectionTitleExpired}>Expired</Text>
              <Text style={styles.sectionSubtitleExpired}>Action required</Text>
            </View>
            <View style={styles.cardList}>
              {filteredExpired.map(renderExpiredCard)}
            </View>
          </ReanimatedAnimated.View>
        )}

        {/* Expiring Soon Section */}
        {filteredExpiring.length > 0 && (
          <ReanimatedAnimated.View
            entering={FadeInDown.delay(200).duration(400)}
            style={styles.section}
          >
            <View style={styles.sectionHeader}>
              <Text style={styles.sectionTitleExpiring}>Expiring Soon</Text>
              <Text style={styles.sectionSubtitleExpiring}>Plan ahead</Text>
            </View>
            <View style={styles.cardList}>
              {filteredExpiring.map(renderExpiringCard)}
            </View>
          </ReanimatedAnimated.View>
        )}

        {/* Empty State */}
        {filteredExpired.length === 0 && filteredExpiring.length === 0 && (
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
