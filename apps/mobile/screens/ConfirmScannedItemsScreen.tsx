// screens/ConfirmScannedItemsScreen.tsx
// Confirm scanned pantry items before adding
// Design reference: confirm_scanned_items/code.html

import React, { useState, useCallback } from "react";
import {
  View,
  Text,
  StyleSheet,
  TouchableOpacity,
  ScrollView,
  TextInput,
  Alert,
  ActivityIndicator,
} from "react-native";
import { Image } from "expo-image";
import { MaterialCommunityIcons } from "@expo/vector-icons";
import { useNavigation } from "@react-navigation/native";
import ReanimatedAnimated, { FadeIn, FadeInDown, FadeInUp } from "react-native-reanimated";
import { useSafeAreaInsets } from "react-native-safe-area-context";
import { LinearGradient } from "expo-linear-gradient";

import { Screen } from "../components/Screen";
import { mangiaColors } from "../theme/tokens/colors";
import { fontFamily } from "../theme/tokens/typography";

// Scanned item status types
type ItemStatus = "confirmed" | "review" | "excluded";

interface ScannedItem {
  id: string;
  name: string;
  category: string;
  quantity: string;
  imageUrl?: string;
  status: ItemStatus;
  isSelected: boolean;
}

// Mock scanned items for demo
const MOCK_SCANNED_ITEMS: ScannedItem[] = [
  {
    id: "1",
    name: "Extra Virgin Olive Oil",
    category: "Pantry",
    quantity: "1 bottle",
    status: "confirmed",
    isSelected: true,
  },
  {
    id: "2",
    name: "Arborio Rice",
    category: "Pantry",
    quantity: "1 kg",
    status: "confirmed",
    isSelected: true,
  },
  {
    id: "3",
    name: "Unknown Spice",
    category: "Review",
    quantity: "",
    status: "review",
    isSelected: false,
  },
  {
    id: "4",
    name: "San Marzano Tomatoes",
    category: "Pantry",
    quantity: "2 cans",
    status: "confirmed",
    isSelected: true,
  },
  {
    id: "5",
    name: "Sparkling Water",
    category: "Excluded",
    quantity: "1 bottle",
    status: "excluded",
    isSelected: false,
  },
];

export default function ConfirmScannedItemsScreen() {
  const navigation = useNavigation();
  const insets = useSafeAreaInsets();

  const [items, setItems] = useState<ScannedItem[]>(MOCK_SCANNED_ITEMS);
  const [isSubmitting, setIsSubmitting] = useState(false);

  const selectedCount = items.filter((i) => i.isSelected).length;

  const handleBack = useCallback(() => {
    navigation.goBack();
  }, [navigation]);

  const handleRetake = useCallback(() => {
    navigation.goBack();
  }, [navigation]);

  const toggleItemSelection = useCallback((itemId: string) => {
    setItems((prev) =>
      prev.map((item) =>
        item.id === itemId ? { ...item, isSelected: !item.isSelected } : item
      )
    );
  }, []);

  const updateItemName = useCallback((itemId: string, name: string) => {
    setItems((prev) =>
      prev.map((item) =>
        item.id === itemId ? { ...item, name } : item
      )
    );
  }, []);

  const handleConfirm = useCallback(async () => {
    const selectedItems = items.filter((i) => i.isSelected);
    if (selectedItems.length === 0) {
      Alert.alert("No Items Selected", "Please select at least one item to add.");
      return;
    }

    setIsSubmitting(true);
    try {
      // TODO: Add items to pantry
      await new Promise((resolve) => setTimeout(resolve, 1000));
      navigation.goBack();
    } catch (error) {
      console.error("Error adding items:", error);
      Alert.alert("Error", "Failed to add items to pantry");
    } finally {
      setIsSubmitting(false);
    }
  }, [items, navigation]);

  const handleAddManually = useCallback(() => {
    // Navigate to manual entry screen
    // navigation.navigate("ManualItemEntryScreen");
  }, []);

  const renderItem = useCallback((item: ScannedItem, index: number) => {
    const isReview = item.status === "review";
    const isExcluded = item.status === "excluded";

    return (
      <ReanimatedAnimated.View
        key={item.id}
        entering={FadeInDown.delay(index * 50).duration(300)}
      >
        <TouchableOpacity
          style={[
            styles.itemCard,
            isReview && styles.itemCardReview,
            isExcluded && styles.itemCardExcluded,
          ]}
          onPress={() => toggleItemSelection(item.id)}
          activeOpacity={0.9}
        >
          {/* Item Image */}
          <View style={styles.itemImageContainer}>
            <View style={styles.itemImagePlaceholder}>
              <MaterialCommunityIcons
                name="food"
                size={24}
                color={mangiaColors.taupe}
              />
            </View>
            {isReview && (
              <View style={styles.reviewBadge}>
                <MaterialCommunityIcons
                  name="exclamation"
                  size={12}
                  color="#EA580C"
                />
              </View>
            )}
          </View>

          {/* Item Details */}
          <View style={styles.itemContent}>
            <TextInput
              style={[
                styles.itemNameInput,
                isReview && styles.itemNameInputReview,
                isExcluded && styles.itemNameInputExcluded,
              ]}
              value={item.name}
              onChangeText={(text) => updateItemName(item.id, text)}
              placeholder="Enter item name"
              placeholderTextColor={mangiaColors.taupe}
            />
            <View style={styles.itemMeta}>
              <View style={[
                styles.categoryBadge,
                isReview && styles.categoryBadgeReview,
                isExcluded && styles.categoryBadgeExcluded,
              ]}>
                <Text style={[
                  styles.categoryBadgeText,
                  isReview && styles.categoryBadgeTextReview,
                  isExcluded && styles.categoryBadgeTextExcluded,
                ]}>
                  {item.category}
                </Text>
              </View>
              {item.quantity && (
                <Text style={styles.quantityText}>• {item.quantity}</Text>
              )}
            </View>
          </View>

          {/* Checkbox */}
          <View style={styles.checkboxContainer}>
            <View style={[
              styles.checkbox,
              item.isSelected && styles.checkboxSelected,
            ]}>
              {item.isSelected && (
                <MaterialCommunityIcons
                  name="check"
                  size={16}
                  color={mangiaColors.white}
                />
              )}
            </View>
          </View>
        </TouchableOpacity>
      </ReanimatedAnimated.View>
    );
  }, [toggleItemSelection, updateItemName]);

  return (
    <Screen style={styles.container} noPadding>
      {/* Header */}
      <ReanimatedAnimated.View
        entering={FadeIn.duration(300)}
        style={[styles.header, { paddingTop: insets.top + 8 }]}
      >
        <TouchableOpacity onPress={handleBack} style={styles.headerButton}>
          <MaterialCommunityIcons
            name="arrow-left"
            size={24}
            color={mangiaColors.dark}
          />
        </TouchableOpacity>
        <Text style={styles.headerTitle}>Scan Result</Text>
        <TouchableOpacity style={styles.headerButton}>
          <MaterialCommunityIcons
            name="dots-horizontal"
            size={24}
            color={mangiaColors.dark}
          />
        </TouchableOpacity>
      </ReanimatedAnimated.View>

      <ScrollView
        style={styles.scrollView}
        contentContainerStyle={[
          styles.scrollContent,
          { paddingBottom: 100 + insets.bottom },
        ]}
        showsVerticalScrollIndicator={false}
      >
        {/* Hero Image */}
        <ReanimatedAnimated.View
          entering={FadeInDown.delay(100).duration(400)}
          style={styles.heroContainer}
        >
          <View style={styles.heroImage}>
            <View style={styles.heroImagePlaceholder}>
              <MaterialCommunityIcons
                name="image-multiple"
                size={48}
                color={`${mangiaColors.white}40`}
              />
            </View>
            <LinearGradient
              colors={['transparent', 'rgba(0,0,0,0.6)']}
              style={styles.heroGradient}
            />
            <View style={styles.heroContent}>
              <View style={styles.originalScanBadge}>
                <MaterialCommunityIcons
                  name="camera"
                  size={14}
                  color={mangiaColors.white}
                />
                <Text style={styles.originalScanText}>Original Scan</Text>
              </View>
              <TouchableOpacity onPress={handleRetake}>
                <Text style={styles.retakeText}>Retake</Text>
              </TouchableOpacity>
            </View>
          </View>
        </ReanimatedAnimated.View>

        {/* Headline */}
        <ReanimatedAnimated.View
          entering={FadeInDown.delay(200).duration(400)}
          style={styles.headlineContainer}
        >
          <Text style={styles.headline}>Review Scan</Text>
          <Text style={styles.subheadline}>
            We identified <Text style={styles.itemCountHighlight}>{items.length} items</Text> from your photo.
          </Text>
        </ReanimatedAnimated.View>

        {/* Items List */}
        <View style={styles.itemsList}>
          {items.map(renderItem)}
        </View>

        {/* Add Manually Button */}
        <ReanimatedAnimated.View
          entering={FadeInDown.delay(400).duration(400)}
        >
          <TouchableOpacity
            style={styles.addManuallyButton}
            onPress={handleAddManually}
          >
            <MaterialCommunityIcons
              name="plus-circle"
              size={20}
              color={mangiaColors.sage}
            />
            <Text style={styles.addManuallyText}>Add Item Manually</Text>
          </TouchableOpacity>
        </ReanimatedAnimated.View>
      </ScrollView>

      {/* Footer CTA */}
      <View style={[styles.footer, { paddingBottom: insets.bottom + 16 }]}>
        <LinearGradient
          colors={[`${mangiaColors.cream}00`, mangiaColors.cream, mangiaColors.cream]}
          style={styles.footerGradient}
        />
        <TouchableOpacity
          style={[
            styles.confirmButton,
            (selectedCount === 0 || isSubmitting) && styles.confirmButtonDisabled,
          ]}
          onPress={handleConfirm}
          disabled={selectedCount === 0 || isSubmitting}
          activeOpacity={0.9}
        >
          {isSubmitting ? (
            <ActivityIndicator size="small" color={mangiaColors.white} />
          ) : (
            <>
              <Text style={styles.confirmButtonText}>Confirm & Add Items</Text>
              <View style={styles.confirmCount}>
                <Text style={styles.confirmCountText}>{selectedCount}</Text>
              </View>
            </>
          )}
        </TouchableOpacity>
      </View>
    </Screen>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: "#FAFAF8",
  },

  // Header
  header: {
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "space-between",
    paddingHorizontal: 16,
    paddingBottom: 8,
    backgroundColor: `#FAFAF8F5`,
  },
  headerButton: {
    width: 48,
    height: 48,
    justifyContent: "center",
    alignItems: "center",
    borderRadius: 24,
  },
  headerTitle: {
    fontFamily: fontFamily.medium,
    fontSize: 11,
    color: mangiaColors.brown,
    letterSpacing: 2,
    textTransform: "uppercase",
  },

  // Scroll
  scrollView: {
    flex: 1,
  },
  scrollContent: {
    paddingBottom: 100,
  },

  // Hero
  heroContainer: {
    paddingHorizontal: 16,
    paddingVertical: 8,
  },
  heroImage: {
    height: 240,
    borderTopLeftRadius: 4,
    borderTopRightRadius: 24,
    borderBottomLeftRadius: 4,
    borderBottomRightRadius: 24,
    overflow: "hidden",
    position: "relative",
  },
  heroImagePlaceholder: {
    flex: 1,
    backgroundColor: "#4a4a4a",
    justifyContent: "center",
    alignItems: "center",
  },
  heroGradient: {
    ...StyleSheet.absoluteFillObject,
  },
  heroContent: {
    position: "absolute",
    bottom: 24,
    left: 24,
    right: 24,
    flexDirection: "row",
    justifyContent: "space-between",
    alignItems: "center",
  },
  originalScanBadge: {
    flexDirection: "row",
    alignItems: "center",
    gap: 6,
    paddingHorizontal: 12,
    paddingVertical: 6,
    borderRadius: 16,
    backgroundColor: "rgba(255, 255, 255, 0.2)",
    borderWidth: 1,
    borderColor: "rgba(255, 255, 255, 0.3)",
  },
  originalScanText: {
    fontFamily: fontFamily.medium,
    fontSize: 12,
    color: mangiaColors.white,
  },
  retakeText: {
    fontFamily: fontFamily.bold,
    fontSize: 12,
    color: mangiaColors.white,
    letterSpacing: 1,
    textTransform: "uppercase",
  },

  // Headline
  headlineContainer: {
    paddingHorizontal: 24,
    paddingTop: 24,
    paddingBottom: 8,
  },
  headline: {
    fontFamily: fontFamily.serif,
    fontSize: 40,
    fontStyle: "italic",
    fontWeight: "500",
    color: mangiaColors.dark,
    letterSpacing: -0.5,
  },
  subheadline: {
    fontFamily: fontFamily.regular,
    fontSize: 18,
    color: mangiaColors.brown,
    marginTop: 8,
    lineHeight: 26,
  },
  itemCountHighlight: {
    fontFamily: fontFamily.bold,
    color: mangiaColors.sage,
  },

  // Items List
  itemsList: {
    paddingHorizontal: 16,
    paddingVertical: 16,
    gap: 16,
  },
  itemCard: {
    flexDirection: "row",
    alignItems: "center",
    gap: 16,
    padding: 16,
    backgroundColor: mangiaColors.white,
    borderTopLeftRadius: 2,
    borderTopRightRadius: 16,
    borderBottomLeftRadius: 2,
    borderBottomRightRadius: 16,
    borderWidth: 1,
    borderColor: "#F0F0F0",
    shadowColor: "#000",
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.04,
    shadowRadius: 8,
    elevation: 2,
  },
  itemCardReview: {
    backgroundColor: "#FFF7ED",
    borderColor: "#FED7AA",
  },
  itemCardExcluded: {
    opacity: 0.6,
  },

  // Item Image
  itemImageContainer: {
    width: 64,
    height: 64,
    borderRadius: 8,
    overflow: "hidden",
    position: "relative",
  },
  itemImagePlaceholder: {
    flex: 1,
    backgroundColor: "#F5F0EC",
    justifyContent: "center",
    alignItems: "center",
  },
  reviewBadge: {
    position: "absolute",
    top: -6,
    right: -6,
    width: 20,
    height: 20,
    borderRadius: 10,
    backgroundColor: "#FFEDD5",
    borderWidth: 1,
    borderColor: "#FED7AA",
    justifyContent: "center",
    alignItems: "center",
  },

  // Item Content
  itemContent: {
    flex: 1,
  },
  itemNameInput: {
    fontFamily: fontFamily.serif,
    fontSize: 18,
    fontWeight: "500",
    color: mangiaColors.dark,
    padding: 0,
  },
  itemNameInputReview: {
    fontStyle: "italic",
    borderBottomWidth: 1,
    borderBottomColor: "#FED7AA",
    borderStyle: "dashed",
  },
  itemNameInputExcluded: {
    textDecorationLine: "line-through",
    color: mangiaColors.taupe,
  },
  itemMeta: {
    flexDirection: "row",
    alignItems: "center",
    gap: 8,
    marginTop: 6,
  },
  categoryBadge: {
    paddingHorizontal: 8,
    paddingVertical: 3,
    borderRadius: 12,
    backgroundColor: `${mangiaColors.sage}15`,
    borderWidth: 1,
    borderColor: `${mangiaColors.sage}30`,
  },
  categoryBadgeReview: {
    backgroundColor: "#FFEDD5",
    borderColor: "#FB923C30",
  },
  categoryBadgeExcluded: {
    backgroundColor: "#F3F4F6",
    borderColor: "#E5E7EB",
  },
  categoryBadgeText: {
    fontFamily: fontFamily.medium,
    fontSize: 11,
    color: mangiaColors.sage,
  },
  categoryBadgeTextReview: {
    color: "#EA580C",
  },
  categoryBadgeTextExcluded: {
    color: mangiaColors.brown,
  },
  quantityText: {
    fontFamily: fontFamily.regular,
    fontSize: 12,
    color: mangiaColors.brown,
  },

  // Checkbox
  checkboxContainer: {
    padding: 4,
  },
  checkbox: {
    width: 24,
    height: 24,
    borderRadius: 6,
    borderWidth: 2,
    borderColor: "#D1D5DB",
    justifyContent: "center",
    alignItems: "center",
  },
  checkboxSelected: {
    backgroundColor: mangiaColors.sage,
    borderColor: mangiaColors.sage,
  },

  // Add Manually
  addManuallyButton: {
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "center",
    gap: 8,
    paddingVertical: 16,
    marginHorizontal: 16,
    marginTop: 8,
    borderTopWidth: 1,
    borderTopColor: "#E5E7EB",
    borderStyle: "dashed",
  },
  addManuallyText: {
    fontFamily: fontFamily.medium,
    fontSize: 14,
    color: mangiaColors.sage,
    letterSpacing: 1,
    textTransform: "uppercase",
  },

  // Footer
  footer: {
    position: "absolute",
    bottom: 0,
    left: 0,
    right: 0,
    paddingHorizontal: 16,
    paddingTop: 32,
  },
  footerGradient: {
    ...StyleSheet.absoluteFillObject,
  },
  confirmButton: {
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "center",
    gap: 12,
    height: 56,
    backgroundColor: mangiaColors.sage,
    borderRadius: 16,
    shadowColor: mangiaColors.sage,
    shadowOffset: { width: 0, height: 8 },
    shadowOpacity: 0.2,
    shadowRadius: 16,
    elevation: 8,
  },
  confirmButtonDisabled: {
    opacity: 0.5,
  },
  confirmButtonText: {
    fontFamily: fontFamily.bold,
    fontSize: 18,
    color: mangiaColors.white,
  },
  confirmCount: {
    paddingHorizontal: 10,
    paddingVertical: 4,
    borderRadius: 12,
    backgroundColor: "rgba(255, 255, 255, 0.2)",
  },
  confirmCountText: {
    fontFamily: fontFamily.semibold,
    fontSize: 14,
    color: mangiaColors.white,
  },
});
