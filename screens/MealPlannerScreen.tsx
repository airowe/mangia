import React, { useState, useEffect, useCallback } from "react";
import {
  View,
  Text,
  StyleSheet,
  ScrollView,
  TouchableOpacity,
  ActivityIndicator,
  SafeAreaView,
} from "react-native";
import { Product } from "../models/Product";
import { Recipe } from "../models/Recipe";
import {
  MealType,
  MealPlanDay,
  MealPlanFilters,
} from "../models/Meal";
import { ShoppingListItem } from "../models/ShoppingList";
import { theme } from "../theme/theme";

const { colors } = theme; // Destructure colors for backward compatibility

// ===== Type Definitions =====

interface NavigationProps {
  navigation: any;
}

// ===== API Imports =====
import {
  getUserRecipes,
  generateMealPlan,
  saveMealPlan,
} from "../lib/mealPlanner";
import { fetchPantryItems } from "../lib/pantry";

// ===== Main Component =====

const DAYS_OF_WEEK = [
  "Monday",
  "Tuesday",
  "Wednesday",
  "Thursday",
  "Friday",
  "Saturday",
  "Sunday",
];
const MEAL_TYPES = ["Breakfast", "Lunch", "Dinner"];

const MealPlannerScreen: React.FC<NavigationProps> = ({ navigation }) => {
  // State management
  const [loading, setLoading] = useState<boolean>(false);
  const [mealPlan, setMealPlan] = useState<MealPlanDay[]>([]);
  const [shoppingList, setShoppingList] = useState<ShoppingListItem[]>([]);
  const [recipes, setRecipes] = useState<Recipe[]>([]);
  const [pantryItems, setPantryItems] = useState<Product[]>([]);
  const [selectedDays, setSelectedDays] = useState<Set<string>>(
    new Set(DAYS_OF_WEEK)
  );
  const [selectedMeals, setSelectedMeals] = useState<Set<string>>(
    new Set(MEAL_TYPES)
  );

  // Filter state
  const [filters, setFilters] = useState<MealPlanFilters>({
    days: 7,
    servings: 4,
    usePantry: true,
    quickMeals: false,
    includeBreakfast: true,
    includeLunch: true,
    includeDinner: true,
    includeSnacks: false,
    dietaryRestrictions: [],
  });

  // Process recipe to ensure it has all required fields
  const processRecipe = useCallback((recipe: Recipe): Recipe => {
    return {
      ...recipe,
      instructions: Array.isArray(recipe.instructions)
        ? recipe.instructions
        : recipe.instructions
        ? [recipe.instructions]
        : [],
      ingredients: (recipe.ingredients || []).map((ing) => ({
        ...ing,
        amount: (ing as any).amount || 0,
        unit: (ing as any).unit || "",
        name: (ing as any).name || "Unknown Ingredient",
      })),
    };
  }, []);

  // Load initial data
  useEffect(() => {
    const loadData = async () => {
      try {
        setLoading(true);
        const [recipesData, pantryData] = await Promise.all([
          getUserRecipes(),
          fetchPantryItems(),
        ]);

        // Process recipes to ensure they have all required fields
        const processedRecipes = recipesData.map((recipe) =>
          processRecipe(recipe)
        );

        setRecipes(processedRecipes);
        setPantryItems(pantryData);
      } catch (error) {
        console.error("Error loading data:", error);
      } finally {
        setLoading(false);
      }
    };

    loadData();
  }, [processRecipe]);

  // Generate shopping list from recipes
  const generateShoppingList = useCallback(
    (recipesToProcess: Recipe[]): ShoppingListItem[] => {
      const ingredientMap = new Map<string, ShoppingListItem>();

      recipesToProcess.forEach((recipe) => {
        (recipe.ingredients || []).forEach((ingredient) => {
          const ing = ingredient as any;
          const key = `${ing.name?.toLowerCase() || "unknown"}_${
            ing.unit || "unit"
          }`;
          const existing = ingredientMap.get(key);

          if (existing) {
            existing.amount += Number(ing.amount) || 0;
            if (!existing.recipeIds.includes(recipe.id)) {
              existing.recipeIds.push(recipe.id);
            }
          } else {
            ingredientMap.set(key, {
              id: ing.id || Math.random().toString(36).substr(2, 9),
              name: ing.name || "Unknown Ingredient",
              amount: Number(ing.amount) || 0,
              unit: ing.unit || "unit",
              checked: false,
              recipeIds: [recipe.id],
            });
          }
        });
      });

      return Array.from(ingredientMap.values());
    },
    []
  );

  const toggleDaySelection = (day: string) => {
    const newSelectedDays = new Set(selectedDays);
    if (newSelectedDays.has(day)) {
      newSelectedDays.delete(day);
    } else {
      newSelectedDays.add(day);
    }
    setSelectedDays(newSelectedDays);
  };

  const toggleMealSelection = (meal: string) => {
    const newSelectedMeals = new Set(selectedMeals);
    if (newSelectedMeals.has(meal)) {
      newSelectedMeals.delete(meal);
    } else {
      newSelectedMeals.add(meal);
    }
    setSelectedMeals(newSelectedMeals);
  };

  const handleGenerateMealPlan = useCallback(async () => {
    try {
      setLoading(true);
      const updatedFilters = {
        ...filters,
        includeBreakfast: selectedMeals.has("Breakfast"),
        includeLunch: selectedMeals.has("Lunch"),
        includeDinner: selectedMeals.has("Dinner"),
        days: selectedDays.size,
      };

      const response = await generateMealPlan(updatedFilters);
      setMealPlan(response.days);
      setShoppingList(response.shoppingList);
      await saveMealPlan(response);
    } catch (error) {
      console.error("Error generating meal plan:", error);
    } finally {
      setLoading(false);
    }
  }, [filters, selectedDays, selectedMeals]);

  const renderMealCell = (day: string, mealType: string) => {
    const dayPlan = mealPlan.find((plan) => plan.date === day);
    const meal = dayPlan?.meals[mealType.toLowerCase() as MealType];

    return (
      <TouchableOpacity
        style={[
          styles.mealCell,
          !selectedDays.has(day) && styles.disabledCell,
          !selectedMeals.has(mealType) && styles.disabledCell,
        ]}
        onPress={() => {
          if (meal) {
            navigation.navigate("RecipeDetails", { recipe: meal });
          }
        }}
      >
        {meal ? (
          <Text style={styles.mealTitle} numberOfLines={2}>
            {meal.title}
          </Text>
        ) : (
          <Text style={styles.emptyMealText}>No meal planned</Text>
        )}
      </TouchableOpacity>
    );
  };

  // Render loading state
  if (loading) {
    return (
      <View style={styles.loadingContainer}>
        <ActivityIndicator size="large" color={colors.primary} />
        <Text style={styles.loadingText}>Loading...</Text>
      </View>
    );
  }

  // Render empty state
  if (mealPlan.length === 0) {
    return (
      <View style={styles.emptyContainer}>
        <Text style={styles.emptyText}>No meal plan generated yet.</Text>
        <TouchableOpacity
          style={styles.generateButton}
          onPress={handleGenerateMealPlan}
        >
          <Text style={styles.buttonText}>Generate Meal Plan</Text>
        </TouchableOpacity>
      </View>
    );
  }

  // Render the main content
  return (
    <SafeAreaView style={styles.container}>
      <View style={styles.header}>
        <Text style={styles.title}>Meal Plan</Text>
        <TouchableOpacity
          style={styles.generateButton}
          onPress={handleGenerateMealPlan}
        >
          <Text style={styles.buttonText}>Generate Plan</Text>
        </TouchableOpacity>
      </View>

      <View style={styles.selectionContainer}>
        <Text style={styles.sectionTitle}>Select Days</Text>
        <ScrollView horizontal showsHorizontalScrollIndicator={false}>
          {DAYS_OF_WEEK.map((day) => (
            <TouchableOpacity
              key={day}
              style={[
                styles.dayButton,
                selectedDays.has(day) && styles.selectedButton,
              ]}
              onPress={() => toggleDaySelection(day)}
            >
              <Text
                style={[
                  styles.dayButtonText,
                  selectedDays.has(day) && styles.selectedButtonText,
                ]}
              >
                {day}
              </Text>
            </TouchableOpacity>
          ))}
        </ScrollView>

        <Text style={styles.sectionTitle}>Select Meals</Text>
        <ScrollView horizontal showsHorizontalScrollIndicator={false}>
          {MEAL_TYPES.map((meal) => (
            <TouchableOpacity
              key={meal}
              style={[
                styles.mealButton,
                selectedMeals.has(meal) && styles.selectedButton,
              ]}
              onPress={() => toggleMealSelection(meal)}
            >
              <Text
                style={[
                  styles.mealButtonText,
                  selectedMeals.has(meal) && styles.selectedButtonText,
                ]}
              >
                {meal}
              </Text>
            </TouchableOpacity>
          ))}
        </ScrollView>
      </View>

      <ScrollView style={styles.gridContainer}>
        <View style={styles.gridHeader}>
          <View style={styles.headerCell} />
          {DAYS_OF_WEEK.map((day) => (
            <TouchableOpacity
              key={day}
              style={[
                styles.headerCell,
                !selectedDays.has(day) && styles.disabledCell,
              ]}
              onPress={() => toggleDaySelection(day)}
            >
              <Text style={styles.headerText}>{day}</Text>
            </TouchableOpacity>
          ))}
        </View>

        {MEAL_TYPES.map((mealType) => (
          <View key={mealType} style={styles.gridRow}>
            <TouchableOpacity
              style={[
                styles.mealTypeCell,
                !selectedMeals.has(mealType) && styles.disabledCell,
              ]}
              onPress={() => toggleMealSelection(mealType)}
            >
              <Text style={styles.mealTypeText}>{mealType}</Text>
            </TouchableOpacity>
            {DAYS_OF_WEEK.map((day) => (
              <View key={`${day}-${mealType}`} style={styles.mealCellContainer}>
                {renderMealCell(day, mealType)}
              </View>
            ))}
          </View>
        ))}
      </ScrollView>
    </SafeAreaView>
  );
};

const styles = StyleSheet.create({
  // Layout
  container: {
    flex: 1,
    backgroundColor: colors.background,
  },
  scrollView: {
    flex: 1,
    padding: 16,
  },

  // Header
  header: {
    padding: 16,
    backgroundColor: colors.white,
    borderBottomWidth: 1,
    borderBottomColor: colors.lightGray,
    flexDirection: "row" as const,
    justifyContent: "space-between" as const,
    alignItems: "center" as const,
  },
  title: {
    fontSize: 24,
    fontWeight: "bold" as const,
    color: colors.text,
  },

  // Loading State
  loadingContainer: {
    flex: 1,
    justifyContent: "center" as const,
    alignItems: "center" as const,
    backgroundColor: colors.background,
  },
  loadingText: {
    marginTop: 16,
    color: colors.text,
    fontSize: 16,
  },

  // Empty State
  emptyContainer: {
    flex: 1,
    justifyContent: "center" as const,
    alignItems: "center" as const,
    padding: 20,
    backgroundColor: colors.background,
  },
  emptyText: {
    fontSize: 16,
    color: colors.mediumGray,
    marginBottom: 20,
    textAlign: "center" as const,
  },

  // Buttons
  generateButton: {
    backgroundColor: colors.primary,
    paddingVertical: 12,
    paddingHorizontal: 24,
    borderRadius: 8,
    alignSelf: "center" as const,
  },
  buttonText: {
    color: colors.white,
    fontWeight: "600" as const,
    fontSize: 16,
  },
  buttonDisabled: {
    backgroundColor: colors.mediumGray,
    opacity: 0.7,
  },

  // Days Selector
  daysSelector: {
    padding: 16,
    backgroundColor: colors.white,
    borderBottomWidth: 1,
    borderBottomColor: colors.lightGray,
  },
  dayButton: {
    padding: 8,
    marginRight: 8,
    borderRadius: 20,
    borderWidth: 1,
    borderColor: colors.primary,
  },
  dayButtonActive: {
    backgroundColor: colors.primary,
  },
  dayButtonText: {
    color: colors.primary,
  },
  dayButtonTextActive: {
    color: colors.white,
  },

  // Meal Plan
  dayContainer: {
    marginBottom: 24,
  },
  dayTitle: {
    fontSize: 20,
    fontWeight: "bold" as const,
    marginBottom: 16,
    color: colors.darkGray,
  },

  // Meal Card
  mealCard: {
    backgroundColor: colors.white,
    borderRadius: 8,
    padding: 16,
    marginBottom: 16,
    shadowColor: "#000",
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.15,
    shadowRadius: 4,
    elevation: 3,
  },
  mealType: {
    fontSize: 16,
    fontWeight: "600" as const,
    color: colors.primary,
    marginBottom: 8,
  },
  mealTitle: {
    fontSize: 18,
    fontWeight: "bold" as const,
    marginBottom: 8,
    color: colors.darkGray,
  },
  mealTime: {
    fontSize: 14,
    color: colors.mediumGray,
    marginBottom: 8,
  },
  mealImage: {
    width: "100%",
    height: 150,
    borderRadius: 8,
    marginVertical: 8,
  },
  viewRecipeButton: {
    backgroundColor: colors.primaryLight,
    padding: 8,
    borderRadius: 8,
    alignItems: "center",
    marginTop: 8,
  },
  viewRecipeText: {
    color: colors.primary,
    fontWeight: "600",
  },
  shoppingListContainer: {
    marginTop: theme.spacing.lg,
    backgroundColor: colors.white,
    borderRadius: theme.borderRadius.md,
    padding: theme.spacing.md,
    shadowColor: "#000",
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.15,
    shadowRadius: 4,
    elevation: 3,
  },
  sectionTitle: {
    fontSize: theme.text.lg,
    fontWeight: "bold",
    marginBottom: theme.spacing.md,
    color: colors.darkGray,
  },
  shoppingItem: {
    flexDirection: "row",
    justifyContent: "space-between",
    paddingVertical: theme.spacing.sm,
    borderBottomWidth: 1,
    borderBottomColor: colors.lightGray,
  },
  inPantryItem: {
    opacity: 0.7,
  },
  shoppingItemText: {
    fontSize: 16,
    color: colors.darkGray,
    flex: 1,
  },
  inPantryItemText: {
    textDecorationLine: "line-through",
    color: colors.mediumGray,
  },
  inPantryText: {
    fontSize: 12,
    color: colors.success,
    fontStyle: "italic",
    marginLeft: 8,
  },
  emptyMessage: {
    color: colors.mediumGray,
    fontStyle: "italic",
    textAlign: "center",
    marginVertical: 16,
  },
  instructions: {
    marginTop: 8,
    color: colors.text,
    lineHeight: 22,
  },
  selectionContainer: {
    padding: 16,
    backgroundColor: colors.white,
    borderBottomWidth: 1,
    borderBottomColor: colors.lightGray,
  },
  mealButton: {
    paddingHorizontal: 16,
    paddingVertical: 8,
    marginRight: 8,
    borderRadius: 20,
    borderWidth: 1,
    borderColor: colors.primary,
  },
  selectedButton: {
    backgroundColor: colors.primary,
  },
  mealButtonText: {
    color: colors.primary,
  },
  selectedButtonText: {
    color: colors.white,
  },
  gridContainer: {
    flex: 1,
  },
  gridHeader: {
    flexDirection: "row",
    backgroundColor: colors.white,
    borderBottomWidth: 1,
    borderBottomColor: colors.lightGray,
  },
  headerCell: {
    flex: 1,
    padding: 8,
    alignItems: "center",
    justifyContent: "center",
    minWidth: 100,
  },
  headerText: {
    fontWeight: "600",
    color: colors.text,
  },
  gridRow: {
    flexDirection: "row",
    borderBottomWidth: 1,
    borderBottomColor: colors.lightGray,
  },
  mealTypeCell: {
    width: 100,
    padding: 8,
    backgroundColor: colors.white,
    justifyContent: "center",
    alignItems: "center",
    borderRightWidth: 1,
    borderRightColor: colors.lightGray,
  },
  mealTypeText: {
    fontWeight: "600",
    color: colors.text,
  },
  mealCellContainer: {
    flex: 1,
    minWidth: 100,
  },
  mealCell: {
    padding: 8,
    height: 120,
    backgroundColor: colors.white,
    justifyContent: "center",
    alignItems: "center",
  },
  emptyMealText: {
    fontSize: 12,
    color: colors.mediumGray,
    textAlign: "center",
  },
  disabledCell: {
    opacity: 0.5,
  },
});

export default MealPlannerScreen;
