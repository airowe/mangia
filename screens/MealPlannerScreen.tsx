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
  const [mealPlan, setMealPlan] = useState<MealPlanDay[]>(() => 
    DAYS_OF_WEEK.map(day => ({
      date: day,
      meals: {
        breakfast: null,
        lunch: null,
        dinner: null,
        snacks: []
      },
      snacks: []
    }))
  );
  const [shoppingList, setShoppingList] = useState<ShoppingListItem[]>([]);
  const [recipes, setRecipes] = useState<Recipe[]>([]);
  const [pantryItems, setPantryItems] = useState<Product[]>([]);
  const [selectedDays, setSelectedDays] = useState<Set<string>>(
    new Set(DAYS_OF_WEEK)
  );
  const [selectedMeals, setSelectedMeals] = useState<Set<string>>(
    new Set(MEAL_TYPES)
  );
  const [showRecipePicker, setShowRecipePicker] = useState<{day: string, mealType: string} | null>(null);

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
    const isDisabled = !selectedDays.has(day) || !selectedMeals.has(mealType);

    return (
      <TouchableOpacity
        style={[
          styles.mealCell,
          isDisabled && styles.disabledCell,
        ]}
        onPress={() => {
          if (meal) {
            navigation.navigate("RecipeDetails", { recipe: meal });
          } else if (!isDisabled) {
            openRecipePicker(day, mealType);
          }
        }}
      >
        {meal ? (
          <Text style={styles.mealTitle} numberOfLines={2}>
            {meal.title}
          </Text>
        ) : (
          <Text style={isDisabled ? styles.disabledText : styles.emptyMealText}>
            {isDisabled ? "Disabled" : "Tap to add meal"}
          </Text>
        )}
      </TouchableOpacity>
    );
  };

  const handleAddMeal = (day: string, mealType: string, recipe: Recipe) => {
    setMealPlan(prevPlan => 
      prevPlan.map(dayPlan => {
        if (dayPlan.date === day) {
          return {
            ...dayPlan,
            meals: {
              ...dayPlan.meals,
              [mealType.toLowerCase()]: {
                id: recipe.id,
                recipe,
                title: recipe.title,
                type: mealType.toLowerCase() as MealType
              }
            }
          };
        }
        return dayPlan;
      })
    );
    setShowRecipePicker(null);
  };

  const openRecipePicker = (day: string, mealType: string) => {
    setShowRecipePicker({ day, mealType });
  };

  const clearAllMeals = () => {
    setMealPlan(prevPlan => 
      prevPlan.map(day => ({
        ...day,
        meals: { 
          breakfast: null, 
          lunch: null, 
          dinner: null,
          snacks: []
        },
        snacks: []
      }))
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
  // Filter recipes for the picker
  const availableRecipes = recipes.filter((recipe) =>
    !mealPlan.some((day) =>
      Object.entries(day.meals).some(([key, meal]) =>
        key !== "snacks" && meal && "id" in meal && meal.id === recipe.id
      )
    )
  );

  return (
    <SafeAreaView style={styles.container}>
      <View style={styles.header}>
        <Text style={styles.title}>Meal Plan</Text>
        <View style={styles.headerActions}>
          <TouchableOpacity
            style={[styles.generateButton, { marginRight: 8 }]}
            onPress={handleGenerateMealPlan}
          >
            <Text style={styles.buttonText}>Generate Plan</Text>
          </TouchableOpacity>
          <TouchableOpacity
            style={styles.clearButton}
            onPress={clearAllMeals}
          >
            <Text style={styles.clearButtonText}>Clear All</Text>
          </TouchableOpacity>
        </View>
      </View>

      {showRecipePicker && (
        <View style={styles.recipePickerContainer}>
          <Text style={styles.pickerTitle}>
            Select a recipe for {showRecipePicker.day}'s {showRecipePicker.mealType}
          </Text>
          <ScrollView style={styles.recipeList}>
            {availableRecipes.length > 0 ? (
              availableRecipes.map((recipe) => (
                <TouchableOpacity
                  key={recipe.id}
                  style={styles.recipeItem}
                  onPress={() =>
                    handleAddMeal(
                      showRecipePicker.day,
                      showRecipePicker.mealType,
                      recipe
                    )
                  }
                >
                  <Text style={styles.recipeItemText}>{recipe.title}</Text>
                </TouchableOpacity>
              ))
            ) : (
              <Text style={styles.noRecipesText}>No recipes available</Text>
            )}
          </ScrollView>
          <TouchableOpacity
            style={styles.cancelButton}
            onPress={() => setShowRecipePicker(null)}
          >
            <Text style={styles.cancelButtonText}>Cancel</Text>
          </TouchableOpacity>
        </View>
      )}

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
    flexDirection: 'row' as const,
    justifyContent: 'space-between' as const,
    alignItems: 'center' as const,
  },
  title: {
    fontSize: 24,
    fontWeight: 'bold' as const,
    color: colors.text,
  },
  headerActions: {
    flexDirection: 'row' as const,
    alignItems: 'center' as const,
  },

  // Buttons
  generateButton: {
    backgroundColor: colors.primary,
    paddingVertical: 12,
    paddingHorizontal: 24,
    borderRadius: 8,
    alignSelf: 'center' as const,
    marginLeft: 8,
  },
  buttonText: {
    color: 'white',
    fontWeight: '600' as const,
    fontSize: 16,
  },
  clearButton: {
    padding: 10,
    borderRadius: 5,
    backgroundColor: colors.lightGray,
    marginLeft: 8,
  },
  clearButtonText: {
    color: colors.error || '#dc3545',
    fontWeight: '500' as const,
  },
  buttonDisabled: {
    backgroundColor: colors.mediumGray,
    opacity: 0.7,
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

  // Selection container
  selectionContainer: {
    padding: 16,
    backgroundColor: colors.white,
    borderBottomWidth: 1,
    borderBottomColor: colors.lightGray,
  },
  sectionTitle: {
    fontSize: 16,
    fontWeight: '600' as const,
    marginBottom: 12,
    color: colors.text,
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
    backgroundColor: colors.lightGray,
  },
  dayButtonActive: {
    backgroundColor: colors.primary,
  },
  dayButtonText: {
    color: colors.text,
  },
  dayButtonTextActive: {
    color: 'white',
  },
  
  // Meal selection
  mealButton: {
    paddingHorizontal: 16,
    paddingVertical: 8,
    borderRadius: 20,
    marginRight: 8,
    backgroundColor: colors.lightGray,
  },
  mealButtonText: {
    color: colors.text,
  },
  selectedButton: {
    backgroundColor: colors.primary,
  },
  selectedButtonText: {
    color: 'white',
  },

  // Grid styles
  gridContainer: {
    flex: 1,
    padding: 16,
  },
  gridHeader: {
    flexDirection: 'row' as const,
    borderBottomWidth: 1,
    borderBottomColor: colors.lightGray,
    marginBottom: 8,
  },
  headerCell: {
    flex: 1,
    padding: 8,
    minWidth: 100,
  },
  headerText: {
    fontWeight: '600' as const,
    textAlign: 'center' as const,
    color: colors.text,
  },
  gridRow: {
    flexDirection: 'row' as const,
    minHeight: 80,
    borderBottomWidth: 1,
    borderBottomColor: colors.lightGray,
  },
  mealTypeCell: {
    width: 100,
    padding: 8,
    justifyContent: 'center' as const,
    backgroundColor: colors.lightGray,
  },
  mealTypeText: {
    fontWeight: '600' as const,
    textAlign: 'center' as const,
    color: colors.text,
  },
  mealCellContainer: {
    flex: 1,
    padding: 4,
  },
  mealCell: {
    flex: 1,
    padding: 8,
    justifyContent: 'center' as const,
    backgroundColor: colors.white,
    borderRadius: 4,
    borderWidth: 1,
    borderColor: colors.lightGray,
  },
  mealTitle: {
    textAlign: 'center' as const,
    color: colors.text,
  },
  emptyMealText: {
    textAlign: 'center' as const,
    color: colors.mediumGray,
    fontStyle: 'italic' as const,
  },
  disabledCell: {
    opacity: 0.5,
  },
  disabledText: {
    color: colors.lightGray,
    fontStyle: 'italic' as const,
  },

  // Recipe picker styles
  recipePickerContainer: {
    position: 'absolute' as const,
    top: 0,
    left: 0,
    right: 0,
    bottom: 0,
    backgroundColor: 'rgba(0,0,0,0.8)',
    zIndex: 1000,
    justifyContent: 'center' as const,
    padding: 20,
  },
  pickerTitle: {
    color: 'white',
    fontSize: 18,
    fontWeight: 'bold' as const,
    marginBottom: 15,
    textAlign: 'center' as const,
  },
  recipeList: {
    maxHeight: 300,
    backgroundColor: 'white',
    borderRadius: 8,
    marginBottom: 10,
  },
  recipeItem: {
    padding: 15,
    borderBottomWidth: 1,
    borderBottomColor: colors.lightGray,
  },
  recipeItemText: {
    fontSize: 16,
  },
  noRecipesText: {
    padding: 20,
    textAlign: 'center' as const,
    color: colors.text,
  },
  cancelButton: {
    backgroundColor: colors.error || '#dc3545',
    padding: 15,
    borderRadius: 8,
    alignItems: 'center' as const,
    marginTop: 10,
  },
  cancelButtonText: {
    color: 'white',
    fontWeight: 'bold' as const,
    fontSize: 16,
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
  mealCardTitle: {
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
    width: "100%",
    height: 150,
    borderRadius: 8,
    marginVertical: 8,
  },
  viewRecipeButton: {
    backgroundColor: colors.primaryLight,
    padding: 8,
    borderRadius: 8,
    alignItems: "center" as const,
    marginTop: 8,
  },
  viewRecipeText: {
    color: colors.primary,
    fontWeight: "600" as const,
  },
  shoppingListContainer: {
    marginTop: theme.spacing?.lg || 16,
    backgroundColor: colors.white,
    borderRadius: theme.borderRadius?.md || 8,
    padding: theme.spacing?.md || 16,
    shadowColor: "#000",
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.15,
    shadowRadius: 4,
    elevation: 3,
  },
  shoppingListTitle: {
    fontSize: theme.text?.lg || 18,
    fontWeight: 'bold' as const,
    marginBottom: theme.spacing?.md || 16,
    color: colors.darkGray,
  },
  shoppingItem: {
    flexDirection: 'row' as const,
    justifyContent: 'space-between' as const,
    paddingVertical: theme.spacing?.sm || 8,
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
    textDecorationLine: 'line-through' as const,
    color: colors.mediumGray,
  },
  inPantryText: {
    fontSize: 12,
    color: colors.success,
    fontStyle: 'italic' as const,
    marginLeft: 8,
  },
  emptyMessage: {
    color: colors.mediumGray,
    fontStyle: 'italic' as const,
    textAlign: 'center' as const,
    marginVertical: 16,
  },
  instructions: {
    marginTop: 8,
    color: colors.text,
    lineHeight: 22,
  },
});

export default MealPlannerScreen;
