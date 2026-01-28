import React, { useState, useEffect, useCallback, useMemo } from "react";
import {
  View,
  Text,
  TouchableOpacity,
  ActivityIndicator,
  SafeAreaView,
  ScrollView,
  Modal,
  FlatList,
  Image,
  Alert,
} from "react-native";
import { WeekCalendar } from "react-native-calendars";
import { MaterialCommunityIcons } from "@expo/vector-icons";
import { useNavigation } from "@react-navigation/native";
import { StackNavigationProp } from "@react-navigation/stack";
import { Button } from "react-native-paper";
import Animated, { FadeIn, FadeInDown } from "react-native-reanimated";

import { useTheme } from "../theme";
import { Recipe } from "../models/Recipe";
import {
  MealPlan,
  MealTypeDB,
  fetchMealPlans,
  fetchRecipesForMealPlan,
  addMealToPlan,
  updateMealPlan,
  removeMealFromPlan,
} from "../lib/mealPlanService";

type RootStackParamList = {
  MealPlannerScreen: undefined;
  GroceryListScreen: { recipeIds: string[] };
};

type NavigationProp = StackNavigationProp<RootStackParamList>;

const getToday = () => new Date().toISOString().split("T")[0];

type MealTypeKey = "breakfast" | "lunch" | "dinner";

type DayMeals = {
  [key in MealTypeKey]?: MealPlan;
};

const MealPlannerScreen: React.FC = () => {
  const navigation = useNavigation<NavigationProp>();
  const { theme } = useTheme();
  const { colors, spacing, borderRadius, typography } = theme;

  const [mealPlans, setMealPlans] = useState<MealPlan[]>([]);
  const [selectedDate, setSelectedDate] = useState(getToday());
  const [loading, setLoading] = useState(true);
  const [recipes, setRecipes] = useState<Recipe[]>([]);
  const [showRecipePicker, setShowRecipePicker] = useState(false);
  const [selectedMealType, setSelectedMealType] = useState<MealTypeKey | null>(
    null,
  );
  const [saving, setSaving] = useState(false);

  // Get unique recipe IDs from current week's meal plans
  const weekRecipeIds = useMemo(() => {
    const ids = mealPlans
      .filter((mp) => mp.recipe_id !== null)
      .map((mp) => mp.recipe_id as string);
    return [...new Set(ids)]; // Remove duplicates
  }, [mealPlans]);

  // Navigate to grocery list with meal plan recipes
  const handleGenerateGroceryList = useCallback(() => {
    if (weekRecipeIds.length === 0) {
      Alert.alert(
        "No Recipes Planned",
        "Add some recipes to your meal plan first to generate a grocery list.",
      );
      return;
    }
    navigation.navigate("GroceryListScreen", { recipeIds: weekRecipeIds });
  }, [weekRecipeIds, navigation]);

  // Fetch meal plans for the week
  const loadMealPlans = useCallback(async () => {
    try {
      // Get meal plans for the current week
      const startOfWeek = new Date(selectedDate);
      startOfWeek.setDate(
        startOfWeek.getDate() - ((startOfWeek.getDay() + 6) % 7),
      );
      const endOfWeek = new Date(startOfWeek);
      endOfWeek.setDate(endOfWeek.getDate() + 6);

      const data = await fetchMealPlans(
        startOfWeek.toISOString().split("T")[0],
        endOfWeek.toISOString().split("T")[0],
      );
      setMealPlans(data || []);
    } catch (err) {
      console.error("Error fetching meal plans:", err);
    } finally {
      setLoading(false);
    }
  }, [selectedDate]);

  // Fetch user's recipes for the picker
  const loadRecipes = useCallback(async () => {
    try {
      const data = await fetchRecipesForMealPlan();
      setRecipes(data || []);
    } catch (err) {
      console.error("Error fetching recipes:", err);
    }
  }, []);

  useEffect(() => {
    loadMealPlans();
    loadRecipes();
  }, [loadMealPlans, loadRecipes]);

  // Get meals for selected date
  const getDayMeals = (): DayMeals => {
    const dayPlans = mealPlans.filter((mp) => mp.date === selectedDate);
    const meals: DayMeals = {};

    dayPlans.forEach((plan) => {
      if (
        plan.meal_type !== "snack" &&
        (plan.meal_type === "breakfast" ||
          plan.meal_type === "lunch" ||
          plan.meal_type === "dinner")
      ) {
        meals[plan.meal_type] = plan;
      }
    });

    return meals;
  };

  // Get marked dates for calendar
  const getMarkedDates = () => {
    const marks: { [date: string]: any } = {};

    // Mark dates with meal plans
    mealPlans.forEach((mp) => {
      if (!marks[mp.date]) {
        marks[mp.date] = { marked: true, dotColor: colors.primary };
      }
    });

    // Mark selected date
    marks[selectedDate] = {
      ...marks[selectedDate],
      selected: true,
      selectedColor: colors.primary,
      selectedTextColor: colors.textOnPrimary,
    };

    return marks;
  };

  // Add meal to plan
  const handleAddMealToPlan = async (recipe: Recipe) => {
    if (!selectedMealType) return;

    setSaving(true);
    try {
      // Check if a meal already exists for this slot
      const existingMeal = mealPlans.find(
        (mp) => mp.date === selectedDate && mp.meal_type === selectedMealType,
      );

      if (existingMeal) {
        // Update existing meal
        await updateMealPlan(existingMeal.id, {
          recipe_id: recipe.id,
          title: recipe.title,
        });
      } else {
        // Insert new meal plan
        await addMealToPlan(
          selectedDate,
          selectedMealType,
          recipe.id,
          recipe.title,
        );
      }

      setShowRecipePicker(false);
      setSelectedMealType(null);
      await loadMealPlans();
    } catch (err) {
      console.error("Error adding meal:", err);
      Alert.alert("Error", "Failed to add meal to plan");
    } finally {
      setSaving(false);
    }
  };

  // Remove meal from plan
  const removeMeal = async (mealPlan: MealPlan) => {
    Alert.alert("Remove Meal", "Remove this recipe from your meal plan?", [
      { text: "Cancel", style: "cancel" },
      {
        text: "Remove",
        style: "destructive",
        onPress: async () => {
          try {
            await removeMealFromPlan(mealPlan.id);
            await loadMealPlans();
          } catch (err) {
            console.error("Error removing meal:", err);
            Alert.alert("Error", "Failed to remove meal");
          }
        },
      },
    ]);
  };

  const dayMeals = getDayMeals();
  const mealTypes: MealTypeKey[] = ["breakfast", "lunch", "dinner"];

  const styles = useMemo(
    () => ({
      container: {
        flex: 1,
        backgroundColor: colors.background,
      },
      content: {
        flex: 1,
        padding: spacing.md,
      },
      calendar: {
        marginBottom: spacing.sm,
      },
      loadingContainer: {
        flex: 1,
        justifyContent: "center" as const,
        alignItems: "center" as const,
        backgroundColor: colors.background,
      },
      dateHeader: {
        ...typography.styles.headline,
        color: colors.text,
        marginBottom: spacing.md,
      },
      mealBlocksContainer: {
        paddingBottom: spacing.md,
      },
      groceryButton: {
        marginBottom: spacing.xl,
        marginTop: spacing.sm,
      },
      mealBlock: {
        backgroundColor: colors.card,
        borderRadius: borderRadius.md,
        padding: spacing.md,
        marginBottom: spacing.sm,
        shadowColor: "#000",
        shadowOffset: { width: 0, height: 1 },
        shadowOpacity: 0.1,
        shadowRadius: 2,
        elevation: 2,
      },
      mealHeader: {
        flexDirection: "row" as const,
        alignItems: "center" as const,
        marginBottom: spacing.sm,
        gap: spacing.sm,
      },
      mealType: {
        ...typography.styles.body,
        fontWeight: "600" as const,
        color: colors.primary,
      },
      mealContent: {
        flexDirection: "row" as const,
        alignItems: "center" as const,
      },
      mealImage: {
        width: 60,
        height: 60,
        borderRadius: borderRadius.sm,
        marginRight: spacing.sm,
      },
      mealInfo: {
        flex: 1,
      },
      mealName: {
        ...typography.styles.body,
        color: colors.text,
        marginBottom: spacing.xs,
      },
      mealMeta: {
        ...typography.styles.caption2,
        color: colors.textSecondary,
      },
      removeIcon: {
        padding: spacing.xs,
      },
      emptyMeal: {
        alignItems: "center" as const,
        padding: spacing.md,
      },
      addMealText: {
        color: colors.primary,
        ...typography.styles.body,
        marginTop: spacing.sm,
      },
      // Modal styles
      modalContainer: {
        flex: 1,
        backgroundColor: colors.background,
      },
      modalHeader: {
        flexDirection: "row" as const,
        justifyContent: "space-between" as const,
        alignItems: "center" as const,
        padding: spacing.md,
        borderBottomWidth: 1,
        borderBottomColor: colors.border,
      },
      modalTitle: {
        ...typography.styles.title2,
        color: colors.text,
      },
      closeButton: {
        padding: spacing.xs,
      },
      recipeList: {
        padding: spacing.md,
      },
      recipeItem: {
        flexDirection: "row" as const,
        backgroundColor: colors.card,
        borderRadius: borderRadius.md,
        padding: spacing.sm,
        marginBottom: spacing.sm,
        shadowColor: "#000",
        shadowOffset: { width: 0, height: 1 },
        shadowOpacity: 0.1,
        shadowRadius: 2,
        elevation: 2,
      },
      recipeImage: {
        width: 70,
        height: 70,
        borderRadius: borderRadius.sm,
        marginRight: spacing.sm,
      },
      recipePlaceholder: {
        backgroundColor: colors.surface,
        justifyContent: "center" as const,
        alignItems: "center" as const,
      },
      recipeInfo: {
        flex: 1,
        justifyContent: "center" as const,
      },
      recipeTitle: {
        ...typography.styles.body,
        fontWeight: "500" as const,
        color: colors.text,
        marginBottom: spacing.xs,
      },
      recipeMeta: {
        flexDirection: "row" as const,
        gap: spacing.sm,
      },
      recipeMetaText: {
        ...typography.styles.caption2,
        color: colors.textSecondary,
      },
      emptyRecipes: {
        flex: 1,
        justifyContent: "center" as const,
        alignItems: "center" as const,
        padding: spacing.xxl,
      },
      emptyRecipesText: {
        ...typography.styles.body,
        color: colors.textSecondary,
        textAlign: "center" as const,
        marginTop: spacing.md,
      },
      savingOverlay: {
        position: "absolute" as const,
        top: 0,
        left: 0,
        right: 0,
        bottom: 0,
        backgroundColor: "rgba(255, 255, 255, 0.8)",
        justifyContent: "center" as const,
        alignItems: "center" as const,
      },
    }),
    [colors, spacing, borderRadius, typography]
  );

  const renderMealBlock = (mealType: MealTypeKey, index: number) => {
    const meal = dayMeals[mealType];
    const recipe = meal?.recipe as Recipe | undefined;

    return (
      <Animated.View
        key={mealType}
        entering={FadeInDown.delay(index * 100).duration(300)}
      >
        <TouchableOpacity
          style={styles.mealBlock}
          onPress={() => {
            if (meal) {
              removeMeal(meal);
            } else {
              setSelectedMealType(mealType);
              setShowRecipePicker(true);
            }
          }}
        >
          <View style={styles.mealHeader}>
            <MaterialCommunityIcons
              name={
                mealType === "breakfast"
                  ? "coffee"
                  : mealType === "lunch"
                    ? "food"
                    : "silverware-fork-knife"
              }
              size={20}
              color={colors.primary}
            />
            <Text style={styles.mealType}>
              {mealType.charAt(0).toUpperCase() + mealType.slice(1)}
            </Text>
          </View>

          {meal ? (
            <View style={styles.mealContent}>
              {recipe?.image_url && (
                <Image
                  source={{ uri: recipe.image_url }}
                  style={styles.mealImage}
                />
              )}
              <View style={styles.mealInfo}>
                <Text style={styles.mealName} numberOfLines={2}>
                  {meal.title || recipe?.title}
                </Text>
                {recipe?.cook_time && (
                  <Text style={styles.mealMeta}>
                    <MaterialCommunityIcons
                      name="clock-outline"
                      size={12}
                      color={colors.textSecondary}
                    />{" "}
                    {recipe.cook_time} min
                  </Text>
                )}
              </View>
              <MaterialCommunityIcons
                name="close-circle"
                size={20}
                color={colors.error}
                style={styles.removeIcon}
              />
            </View>
          ) : (
            <View style={styles.emptyMeal}>
              <MaterialCommunityIcons
                name="plus-circle-outline"
                size={32}
                color={colors.primary}
              />
              <Text style={styles.addMealText}>Add {mealType}</Text>
            </View>
          )}
        </TouchableOpacity>
      </Animated.View>
    );
  };

  const renderRecipeItem = ({ item, index }: { item: Recipe; index: number }) => (
    <Animated.View entering={FadeInDown.delay(index * 50).duration(300)}>
      <TouchableOpacity
        style={styles.recipeItem}
        onPress={() => handleAddMealToPlan(item)}
        disabled={saving}
      >
        {item.image_url ? (
          <Image source={{ uri: item.image_url }} style={styles.recipeImage} />
        ) : (
          <View style={[styles.recipeImage, styles.recipePlaceholder]}>
            <MaterialCommunityIcons
              name="food"
              size={24}
              color={colors.textSecondary}
            />
          </View>
        )}
        <View style={styles.recipeInfo}>
          <Text style={styles.recipeTitle} numberOfLines={2}>
            {item.title}
          </Text>
          <View style={styles.recipeMeta}>
            {item.cook_time && (
              <Text style={styles.recipeMetaText}>
                <MaterialCommunityIcons
                  name="clock-outline"
                  size={12}
                  color={colors.textSecondary}
                />{" "}
                {item.cook_time} min
              </Text>
            )}
            {item.servings && (
              <Text style={styles.recipeMetaText}>
                <MaterialCommunityIcons
                  name="account-group"
                  size={12}
                  color={colors.textSecondary}
                />{" "}
                {item.servings}
              </Text>
            )}
          </View>
        </View>
      </TouchableOpacity>
    </Animated.View>
  );

  if (loading) {
    return (
      <View style={styles.loadingContainer}>
        <ActivityIndicator size="large" color={colors.primary} />
      </View>
    );
  }

  return (
    <SafeAreaView style={styles.container}>
      <WeekCalendar
        style={styles.calendar}
        current={selectedDate}
        onDayPress={(day) => {
          setSelectedDate(day.dateString);
        }}
        markedDates={getMarkedDates()}
        theme={{
          selectedDayBackgroundColor: colors.primary,
          todayTextColor: colors.primary,
          dotColor: colors.primary,
          arrowColor: colors.primary,
          textDayFontWeight: "500",
          textMonthFontWeight: "600",
          textDayHeaderFontWeight: "500",
          textDayFontSize: 14,
          textMonthFontSize: 16,
          textDayHeaderFontSize: 12,
        }}
        firstDay={1}
        allowSelectionOutOfRange={false}
        hideDayNames={false}
        enableSwipeMonths={true}
      />

      <ScrollView style={styles.content}>
        <Animated.View entering={FadeIn.duration(400)}>
          <Text style={styles.dateHeader}>
            {new Date(selectedDate).toLocaleDateString("en-US", {
              weekday: "long",
              month: "long",
              day: "numeric",
            })}
          </Text>
        </Animated.View>

        <View style={styles.mealBlocksContainer}>
          {mealTypes.map((mealType, index) => renderMealBlock(mealType, index))}
        </View>

        {/* Generate Grocery List Button */}
        {weekRecipeIds.length > 0 && (
          <Animated.View entering={FadeIn.delay(300).duration(400)}>
            <Button
              mode="contained"
              onPress={handleGenerateGroceryList}
              style={styles.groceryButton}
              icon="cart"
            >
              Generate Grocery List ({weekRecipeIds.length} recipes)
            </Button>
          </Animated.View>
        )}
      </ScrollView>

      {/* Recipe Picker Modal */}
      <Modal
        visible={showRecipePicker}
        animationType="slide"
        presentationStyle="pageSheet"
        onRequestClose={() => {
          setShowRecipePicker(false);
          setSelectedMealType(null);
        }}
      >
        <SafeAreaView style={styles.modalContainer}>
          <View style={styles.modalHeader}>
            <Text style={styles.modalTitle}>
              Add{" "}
              {selectedMealType &&
                selectedMealType.charAt(0).toUpperCase() +
                  selectedMealType.slice(1)}
            </Text>
            <TouchableOpacity
              onPress={() => {
                setShowRecipePicker(false);
                setSelectedMealType(null);
              }}
              style={styles.closeButton}
            >
              <MaterialCommunityIcons
                name="close"
                size={24}
                color={colors.text}
              />
            </TouchableOpacity>
          </View>

          {recipes.length === 0 ? (
            <Animated.View entering={FadeIn.duration(400)} style={styles.emptyRecipes}>
              <MaterialCommunityIcons
                name="book-open-variant"
                size={48}
                color={colors.textSecondary}
              />
              <Text style={styles.emptyRecipesText}>
                No recipes yet. Import some recipes to start meal planning!
              </Text>
            </Animated.View>
          ) : (
            <FlatList
              data={recipes}
              renderItem={renderRecipeItem}
              keyExtractor={(item) => item.id}
              contentContainerStyle={styles.recipeList}
            />
          )}

          {saving && (
            <View style={styles.savingOverlay}>
              <ActivityIndicator size="large" color={colors.primary} />
            </View>
          )}
        </SafeAreaView>
      </Modal>
    </SafeAreaView>
  );
};

export default MealPlannerScreen;
