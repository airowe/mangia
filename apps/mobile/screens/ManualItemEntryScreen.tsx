// screens/ManualItemEntryScreen.tsx
// Manual item entry form for adding pantry items
// Design reference: manual_item_entry/code.html

import React, { useState, useCallback } from "react";
import {
  View,
  Text,
  StyleSheet,
  TextInput,
  TouchableOpacity,
  ScrollView,
  Alert,
  ActivityIndicator,
  Switch,
  Platform,
} from "react-native";
import { MaterialCommunityIcons } from "@expo/vector-icons";
import { useNavigation } from "@react-navigation/native";
import ReanimatedAnimated, { FadeIn, FadeInDown, FadeInRight } from "react-native-reanimated";
import { useSafeAreaInsets } from "react-native-safe-area-context";

import { Screen } from "../components/Screen";
import { mangiaColors } from "../theme/tokens/colors";
import { fontFamily } from "../theme/tokens/typography";
import { addToPantry } from "../lib/pantry";
import { PantryItem } from "../models/Product";

// Categories with icons
const CATEGORIES = [
  { id: "spices", label: "Spices", icon: "leaf" as const },
  { id: "dairy", label: "Dairy", icon: "cheese" as const },
  { id: "produce", label: "Produce", icon: "food-apple" as const },
  { id: "baking", label: "Baking", icon: "bread-slice" as const },
  { id: "pantry", label: "Pantry", icon: "cupboard" as const },
  { id: "fridge", label: "Fridge", icon: "fridge" as const },
  { id: "freezer", label: "Freezer", icon: "snowflake" as const },
] as const;

type CategoryId = typeof CATEGORIES[number]["id"];

// Units for quantity
const UNITS = ["grams", "oz", "lbs", "kg", "pcs", "cups", "ml", "L"] as const;
type Unit = typeof UNITS[number];

export default function ManualItemEntryScreen() {
  const navigation = useNavigation();
  const insets = useSafeAreaInsets();

  const [itemName, setItemName] = useState("");
  const [selectedCategory, setSelectedCategory] = useState<CategoryId>("spices");
  const [quantity, setQuantity] = useState("");
  const [unit, setUnit] = useState<Unit>("grams");
  const [showUnitPicker, setShowUnitPicker] = useState(false);
  const [isEssential, setIsEssential] = useState(false);
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [nameFocused, setNameFocused] = useState(false);
  const [quantityFocused, setQuantityFocused] = useState(false);

  const handleCancel = useCallback(() => {
    navigation.goBack();
  }, [navigation]);

  const handleAddItem = useCallback(async () => {
    if (!itemName.trim()) {
      Alert.alert("Missing Name", "Please enter an item name");
      return;
    }

    setIsSubmitting(true);
    try {
      const pantryItem: PantryItem = {
        id: "",
        title: itemName.trim(),
        quantity: parseFloat(quantity) || 1,
        unit: unit,
        location: selectedCategory,
      };

      const { data, error } = await addToPantry(pantryItem);

      if (error) {
        throw error;
      }

      // Success - go back
      navigation.goBack();
    } catch (error) {
      console.error("Error adding item:", error);
      Alert.alert("Error", "Failed to add item to pantry");
    } finally {
      setIsSubmitting(false);
    }
  }, [itemName, quantity, unit, selectedCategory, navigation]);

  const renderCategoryPill = useCallback((category: typeof CATEGORIES[number], index: number) => {
    const isSelected = selectedCategory === category.id;
    return (
      <ReanimatedAnimated.View
        key={category.id}
        entering={FadeInRight.delay(index * 50).duration(300)}
      >
        <TouchableOpacity
          onPress={() => setSelectedCategory(category.id)}
          style={[
            styles.categoryPill,
            isSelected && styles.categoryPillSelected,
          ]}
          activeOpacity={0.7}
        >
          <MaterialCommunityIcons
            name={category.icon}
            size={18}
            color={isSelected ? mangiaColors.white : mangiaColors.brown}
          />
          <Text style={[
            styles.categoryPillText,
            isSelected && styles.categoryPillTextSelected,
          ]}>
            {category.label}
          </Text>
        </TouchableOpacity>
      </ReanimatedAnimated.View>
    );
  }, [selectedCategory]);

  return (
    <Screen style={styles.container} noPadding>
      {/* Navigation Header */}
      <ReanimatedAnimated.View
        entering={FadeIn.duration(300)}
        style={[styles.header, { paddingTop: insets.top + 8 }]}
      >
        <TouchableOpacity onPress={handleCancel} style={styles.cancelButton}>
          <Text style={styles.cancelText}>Cancel</Text>
        </TouchableOpacity>
        <Text style={styles.headerTitle}>New Pantry Item</Text>
        <View style={styles.headerSpacer} />
      </ReanimatedAnimated.View>

      {/* Form Content */}
      <ScrollView
        style={styles.scrollView}
        contentContainerStyle={[
          styles.scrollContent,
          { paddingBottom: 100 + insets.bottom },
        ]}
        showsVerticalScrollIndicator={false}
        keyboardShouldPersistTaps="handled"
      >
        {/* Item Name Section */}
        <ReanimatedAnimated.View
          entering={FadeInDown.delay(100).duration(400)}
          style={styles.section}
        >
          <Text style={styles.sectionLabel}>What are you adding?</Text>
          <TextInput
            style={[
              styles.nameInput,
              nameFocused && styles.inputFocused,
            ]}
            placeholder="e.g. Maldon Sea Salt"
            placeholderTextColor={`${mangiaColors.brown}50`}
            value={itemName}
            onChangeText={setItemName}
            onFocus={() => setNameFocused(true)}
            onBlur={() => setNameFocused(false)}
            autoFocus
          />
        </ReanimatedAnimated.View>

        {/* Category Section */}
        <ReanimatedAnimated.View
          entering={FadeInDown.delay(200).duration(400)}
          style={styles.section}
        >
          <Text style={styles.sectionLabelMuted}>Category</Text>
          <ScrollView
            horizontal
            showsHorizontalScrollIndicator={false}
            contentContainerStyle={styles.categoriesContainer}
          >
            {CATEGORIES.map(renderCategoryPill)}
          </ScrollView>
        </ReanimatedAnimated.View>

        {/* Quantity & Unit Row */}
        <ReanimatedAnimated.View
          entering={FadeInDown.delay(300).duration(400)}
          style={styles.quantityRow}
        >
          <View style={styles.quantityColumn}>
            <Text style={styles.sectionLabelMuted}>Quantity</Text>
            <TextInput
              style={[
                styles.quantityInput,
                quantityFocused && styles.inputFocused,
              ]}
              placeholder="500"
              placeholderTextColor={`${mangiaColors.brown}50`}
              value={quantity}
              onChangeText={setQuantity}
              keyboardType="numeric"
              onFocus={() => setQuantityFocused(true)}
              onBlur={() => setQuantityFocused(false)}
            />
          </View>
          <View style={styles.unitColumn}>
            <Text style={styles.sectionLabelMuted}>Unit</Text>
            <TouchableOpacity
              style={styles.unitSelector}
              onPress={() => setShowUnitPicker(!showUnitPicker)}
            >
              <Text style={styles.unitText}>{unit}</Text>
              <MaterialCommunityIcons
                name="chevron-down"
                size={24}
                color={mangiaColors.brown}
              />
            </TouchableOpacity>
          </View>
        </ReanimatedAnimated.View>

        {/* Unit Picker (if open) */}
        {showUnitPicker && (
          <ReanimatedAnimated.View
            entering={FadeIn.duration(200)}
            style={styles.unitPicker}
          >
            {UNITS.map((u) => (
              <TouchableOpacity
                key={u}
                style={[
                  styles.unitOption,
                  unit === u && styles.unitOptionSelected,
                ]}
                onPress={() => {
                  setUnit(u);
                  setShowUnitPicker(false);
                }}
              >
                <Text style={[
                  styles.unitOptionText,
                  unit === u && styles.unitOptionTextSelected,
                ]}>
                  {u}
                </Text>
              </TouchableOpacity>
            ))}
          </ReanimatedAnimated.View>
        )}

        {/* Essential Item Toggle */}
        <ReanimatedAnimated.View
          entering={FadeInDown.delay(400).duration(400)}
          style={styles.essentialCard}
        >
          <View style={styles.essentialContent}>
            <Text style={styles.essentialTitle}>Essential Item</Text>
            <Text style={styles.essentialDescription}>
              Automatically add to your shopping list when stock is low.
            </Text>
          </View>
          <Switch
            value={isEssential}
            onValueChange={setIsEssential}
            trackColor={{
              false: '#E8E6E3',
              true: mangiaColors.terracotta,
            }}
            thumbColor={mangiaColors.white}
            ios_backgroundColor="#E8E6E3"
          />
        </ReanimatedAnimated.View>
      </ScrollView>

      {/* Fixed Bottom Action */}
      <View style={[styles.footer, { paddingBottom: insets.bottom + 16 }]}>
        <TouchableOpacity
          style={[
            styles.submitButton,
            (!itemName.trim() || isSubmitting) && styles.submitButtonDisabled,
          ]}
          onPress={handleAddItem}
          disabled={!itemName.trim() || isSubmitting}
          activeOpacity={0.9}
        >
          {isSubmitting ? (
            <ActivityIndicator size="small" color={mangiaColors.white} />
          ) : (
            <>
              <MaterialCommunityIcons
                name="plus"
                size={24}
                color={mangiaColors.white}
              />
              <Text style={styles.submitButtonText}>Add to Pantry</Text>
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
    backgroundColor: mangiaColors.cream,
  },

  // Header
  header: {
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "space-between",
    paddingHorizontal: 16,
    paddingBottom: 16,
    borderBottomWidth: 1,
    borderBottomColor: '#E8E6E3',
    backgroundColor: `${mangiaColors.cream}F5`,
  },
  cancelButton: {
    paddingVertical: 8,
    paddingHorizontal: 4,
  },
  cancelText: {
    fontFamily: fontFamily.medium,
    fontSize: 16,
    color: mangiaColors.dark,
  },
  headerTitle: {
    fontFamily: fontFamily.serifBold,
    fontSize: 20,
    fontStyle: 'italic',
    color: mangiaColors.dark,
    letterSpacing: -0.3,
  },
  headerSpacer: {
    width: 60,
  },

  // Scroll View
  scrollView: {
    flex: 1,
  },
  scrollContent: {
    paddingHorizontal: 20,
    paddingTop: 24,
  },

  // Sections
  section: {
    marginBottom: 32,
  },
  sectionLabel: {
    fontFamily: fontFamily.serifBold,
    fontSize: 18,
    fontStyle: 'italic',
    color: mangiaColors.dark,
    marginBottom: 12,
  },
  sectionLabelMuted: {
    fontFamily: fontFamily.medium,
    fontSize: 14,
    color: mangiaColors.brown,
    marginBottom: 12,
  },

  // Name Input
  nameInput: {
    backgroundColor: mangiaColors.white,
    borderWidth: 1,
    borderColor: '#E8E6E3',
    borderTopLeftRadius: 12,
    borderTopRightRadius: 4,
    borderBottomLeftRadius: 4,
    borderBottomRightRadius: 12,
    paddingHorizontal: 16,
    paddingVertical: 16,
    fontFamily: fontFamily.medium,
    fontSize: 24,
    color: mangiaColors.dark,
  },
  inputFocused: {
    borderColor: mangiaColors.terracotta,
    borderWidth: 2,
  },

  // Categories
  categoriesContainer: {
    gap: 12,
    paddingRight: 20,
  },
  categoryPill: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 8,
    paddingHorizontal: 16,
    paddingVertical: 10,
    borderRadius: 24,
    backgroundColor: mangiaColors.white,
    borderWidth: 1,
    borderColor: '#E8E6E3',
  },
  categoryPillSelected: {
    backgroundColor: mangiaColors.sage,
    borderColor: mangiaColors.sage,
    shadowColor: mangiaColors.sage,
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.2,
    shadowRadius: 8,
    elevation: 4,
  },
  categoryPillText: {
    fontFamily: fontFamily.medium,
    fontSize: 14,
    color: mangiaColors.brown,
  },
  categoryPillTextSelected: {
    color: mangiaColors.white,
  },

  // Quantity Row
  quantityRow: {
    flexDirection: 'row',
    gap: 16,
    marginBottom: 32,
  },
  quantityColumn: {
    flex: 1,
  },
  quantityInput: {
    backgroundColor: mangiaColors.white,
    borderWidth: 1,
    borderColor: '#E8E6E3',
    borderTopLeftRadius: 12,
    borderTopRightRadius: 4,
    borderBottomLeftRadius: 4,
    borderBottomRightRadius: 12,
    height: 56,
    paddingHorizontal: 16,
    fontFamily: fontFamily.medium,
    fontSize: 18,
    color: mangiaColors.dark,
  },
  unitColumn: {
    width: 120,
  },
  unitSelector: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    backgroundColor: mangiaColors.white,
    borderWidth: 1,
    borderColor: '#E8E6E3',
    borderTopLeftRadius: 12,
    borderTopRightRadius: 4,
    borderBottomLeftRadius: 4,
    borderBottomRightRadius: 12,
    height: 56,
    paddingHorizontal: 16,
  },
  unitText: {
    fontFamily: fontFamily.medium,
    fontSize: 18,
    color: mangiaColors.dark,
  },

  // Unit Picker
  unitPicker: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    gap: 8,
    marginBottom: 32,
    marginTop: -16,
  },
  unitOption: {
    paddingHorizontal: 16,
    paddingVertical: 10,
    borderRadius: 20,
    backgroundColor: mangiaColors.white,
    borderWidth: 1,
    borderColor: '#E8E6E3',
  },
  unitOptionSelected: {
    backgroundColor: mangiaColors.terracotta,
    borderColor: mangiaColors.terracotta,
  },
  unitOptionText: {
    fontFamily: fontFamily.medium,
    fontSize: 14,
    color: mangiaColors.brown,
  },
  unitOptionTextSelected: {
    color: mangiaColors.white,
  },

  // Essential Card
  essentialCard: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    backgroundColor: mangiaColors.white,
    borderWidth: 1,
    borderColor: '#E8E6E3',
    borderRadius: 16,
    padding: 20,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.04,
    shadowRadius: 8,
    elevation: 2,
  },
  essentialContent: {
    flex: 1,
    marginRight: 16,
  },
  essentialTitle: {
    fontFamily: fontFamily.bold,
    fontSize: 18,
    color: mangiaColors.dark,
    marginBottom: 4,
  },
  essentialDescription: {
    fontFamily: fontFamily.regular,
    fontSize: 14,
    color: mangiaColors.brown,
    lineHeight: 20,
  },

  // Footer
  footer: {
    position: 'absolute',
    bottom: 0,
    left: 0,
    right: 0,
    paddingHorizontal: 16,
    paddingTop: 16,
    backgroundColor: `${mangiaColors.cream}E6`,
    borderTopWidth: 1,
    borderTopColor: '#E8E6E350',
  },
  submitButton: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    gap: 8,
    height: 56,
    backgroundColor: mangiaColors.terracotta,
    borderRadius: 12,
    shadowColor: mangiaColors.terracotta,
    shadowOffset: { width: 0, height: 8 },
    shadowOpacity: 0.2,
    shadowRadius: 16,
    elevation: 8,
  },
  submitButtonDisabled: {
    opacity: 0.5,
  },
  submitButtonText: {
    fontFamily: fontFamily.bold,
    fontSize: 18,
    color: mangiaColors.white,
  },
});
