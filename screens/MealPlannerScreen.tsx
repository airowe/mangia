import React, { useState, useEffect, useCallback } from "react";
import {
  View,
  Text,
  StyleSheet,
  ScrollView,
  TouchableOpacity,
  ActivityIndicator,
  Image,
  SafeAreaView,
  TextInput,
  Switch,
} from "react-native";
import { Picker } from "@react-native-picker/picker";
import { Product } from "../models/Product";
import { Recipe } from "../models/Recipe";
import { MealType, Meal, MealPlanDay, MealPlanFilters, MealPlanResponse } from "../models/Meal";
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
  getSavedMealPlan 
} from "../lib/mealPlanner";
import { fetchPantryItems } from "../lib/pantry";

// ===== Main Component =====

const MealPlannerScreen: React.FC<NavigationProps> = ({ navigation }) => {
  // State management
  const [loading, setLoading] = useState<boolean>(false);
  const [mealPlan, setMealPlan] = useState<MealPlanDay[]>([]);
  const [shoppingList, setShoppingList] = useState<ShoppingListItem[]>([]);
  const [recipes, setRecipes] = useState<Recipe[]>([]);
  const [pantryItems, setPantryItems] = useState<Product[]>([]);
  const [selectedDay, setSelectedDay] = useState<string>("");

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
        const processedRecipes = recipesData.map(recipe => processRecipe(recipe));
        
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

  // Handle meal plan generation
  const handleGenerateMealPlan = useCallback(async () => {
    try {
      setLoading(true);
      const response = await generateMealPlan(filters);
      setMealPlan(response.days);
      setShoppingList(response.shoppingList);
      
      // Save the generated meal plan
      await saveMealPlan(response);
      
      // Set the first day as selected
      if (response.days.length > 0) {
        setSelectedDay(response.days[0].date);
      }
    } catch (error) {
      console.error("Error generating meal plan:", error);
    } finally {
      setLoading(false);
    }
  }, [filters]);

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
      <ScrollView>
        <View style={styles.header}>
          <Text style={styles.title}>Meal Plan</Text>
          <TouchableOpacity
            style={styles.generateButton}
            onPress={handleGenerateMealPlan}
          >
            <Text style={styles.buttonText}>Regenerate</Text>
          </TouchableOpacity>
        </View>

        {/* Add day selector and meal plan rendering here */}
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
    flexDirection: 'row' as const,
    justifyContent: 'space-between' as const,
    alignItems: 'center' as const,
  },
  title: {
    fontSize: 24,
    fontWeight: 'bold' as const,
    color: colors.text,
  },

  // Loading State
  loadingContainer: {
    flex: 1,
    justifyContent: 'center' as const,
    alignItems: 'center' as const,
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
    justifyContent: 'center' as const,
    alignItems: 'center' as const,
    padding: 20,
    backgroundColor: colors.background,
  },
  emptyText: {
    fontSize: 16,
    color: colors.mediumGray,
    marginBottom: 20,
    textAlign: 'center' as const,
  },

  // Buttons
  generateButton: {
    backgroundColor: colors.primary,
    paddingVertical: 12,
    paddingHorizontal: 24,
    borderRadius: 8,
    alignSelf: 'center' as const,
  },
  buttonText: {
    color: colors.white,
    fontWeight: '600' as const,
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
    fontWeight: 'bold' as const,
    marginBottom: 16,
    color: colors.darkGray,
  },

  // Meal Card
  mealCard: {
    backgroundColor: colors.white,
    borderRadius: 8,
    padding: 16,
    marginBottom: 16,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.15,
    shadowRadius: 4,
    elevation: 3,
  },
  mealType: {
    fontSize: 16,
    fontWeight: '600' as const,
    color: colors.primary,
    marginBottom: 8,
  },
  mealTitle: {
    fontSize: 18,
    fontWeight: 'bold' as const,
    marginBottom: 8,
    color: colors.darkGray,
  },
  mealTime: {
    fontSize: 14,
    color: colors.mediumGray,
    marginBottom: 8,
  },
  mealImage: {
    width: '100%',
    height: 150,
    borderRadius: 8,
    marginVertical: 8,
  },
  viewRecipeButton: {
    backgroundColor: colors.primaryLight,
    padding: 8,
    borderRadius: 8,
    alignItems: 'center',
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
});

export default MealPlannerScreen;
