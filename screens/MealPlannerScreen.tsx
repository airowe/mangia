import React, { useState, useEffect, useCallback } from "react";
import {
  View,
  Text,
  StyleSheet,
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
import { colors } from "../theme/colors";
import { Recipe } from "../models/Recipe";
import { supabase } from "../lib/supabase";

const getToday = () => new Date().toISOString().split("T")[0];

type MealTypeKey = "breakfast" | "lunch" | "dinner";
type MealTypeDB = "breakfast" | "lunch" | "dinner" | "snack";

type MealPlan = {
  id: string;
  date: string;
  meal_type: MealTypeDB;
  recipe_id: string | null;
  title: string | null;
  notes: string | null;
  recipe?: Recipe;
};

type DayMeals = {
  [key in MealTypeKey]?: MealPlan;
};

const MealPlannerScreen: React.FC = () => {
  const [mealPlans, setMealPlans] = useState<MealPlan[]>([]);
  const [selectedDate, setSelectedDate] = useState(getToday());
  const [loading, setLoading] = useState(true);
  const [recipes, setRecipes] = useState<Recipe[]>([]);
  const [showRecipePicker, setShowRecipePicker] = useState(false);
  const [selectedMealType, setSelectedMealType] = useState<MealTypeKey | null>(
    null,
  );
  const [saving, setSaving] = useState(false);

  // Fetch meal plans for the week
  const fetchMealPlans = useCallback(async () => {
    try {
      const {
        data: { user },
      } = await supabase.auth.getUser();
      if (!user) return;

      // Get meal plans for the current week
      const startOfWeek = new Date(selectedDate);
      startOfWeek.setDate(
        startOfWeek.getDate() - ((startOfWeek.getDay() + 6) % 7),
      );
      const endOfWeek = new Date(startOfWeek);
      endOfWeek.setDate(endOfWeek.getDate() + 6);

      const { data, error } = await supabase
        .from("meal_plans")
        .select(
          `
          *,
          recipe:recipes(*)
        `,
        )
        .eq("user_id", user.id)
        .gte("date", startOfWeek.toISOString().split("T")[0])
        .lte("date", endOfWeek.toISOString().split("T")[0]);

      if (error) throw error;
      setMealPlans(data || []);
    } catch (err) {
      console.error("Error fetching meal plans:", err);
    } finally {
      setLoading(false);
    }
  }, [selectedDate]);

  // Fetch user's recipes for the picker
  const fetchRecipes = useCallback(async () => {
    try {
      const {
        data: { user },
      } = await supabase.auth.getUser();
      if (!user) return;

      const { data, error } = await supabase
        .from("recipes")
        .select("*")
        .eq("user_id", user.id)
        .order("created_at", { ascending: false });

      if (error) throw error;
      setRecipes(data || []);
    } catch (err) {
      console.error("Error fetching recipes:", err);
    }
  }, []);

  useEffect(() => {
    fetchMealPlans();
    fetchRecipes();
  }, [fetchMealPlans, fetchRecipes]);

  // Get meals for selected date
  const getDayMeals = (): DayMeals => {
    const dayPlans = mealPlans.filter((mp) => mp.date === selectedDate);
    const meals: DayMeals = {};

    dayPlans.forEach((plan) => {
      if (plan.meal_type !== "snack" && (plan.meal_type === "breakfast" || plan.meal_type === "lunch" || plan.meal_type === "dinner")) {
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
      selectedTextColor: "white",
    };

    return marks;
  };

  // Add meal to plan
  const addMealToPlan = async (recipe: Recipe) => {
    if (!selectedMealType) return;

    setSaving(true);
    try {
      const {
        data: { user },
      } = await supabase.auth.getUser();
      if (!user) {
        Alert.alert("Error", "Please sign in to plan meals");
        return;
      }

      // Check if a meal already exists for this slot
      const existingMeal = mealPlans.find(
        (mp) => mp.date === selectedDate && mp.meal_type === selectedMealType,
      );

      if (existingMeal) {
        // Update existing meal
        const { error } = await supabase
          .from("meal_plans")
          .update({
            recipe_id: recipe.id,
            title: recipe.title,
          })
          .eq("id", existingMeal.id);

        if (error) throw error;
      } else {
        // Insert new meal plan
        const { error } = await supabase.from("meal_plans").insert({
          user_id: user.id,
          date: selectedDate,
          meal_type: selectedMealType,
          recipe_id: recipe.id,
          title: recipe.title,
        });

        if (error) throw error;
      }

      setShowRecipePicker(false);
      setSelectedMealType(null);
      await fetchMealPlans();
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
            const { error } = await supabase
              .from("meal_plans")
              .delete()
              .eq("id", mealPlan.id);

            if (error) throw error;
            await fetchMealPlans();
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

  const renderMealBlock = (mealType: MealTypeKey) => {
    const meal = dayMeals[mealType];
    const recipe = meal?.recipe as Recipe | undefined;

    return (
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
    );
  };

  const renderRecipeItem = ({ item }: { item: Recipe }) => (
    <TouchableOpacity
      style={styles.recipeItem}
      onPress={() => addMealToPlan(item)}
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
        <Text style={styles.dateHeader}>
          {new Date(selectedDate).toLocaleDateString("en-US", {
            weekday: "long",
            month: "long",
            day: "numeric",
          })}
        </Text>

        <View style={styles.mealBlocksContainer}>
          {mealTypes.map((mealType) => (
            <View key={mealType}>{renderMealBlock(mealType)}</View>
          ))}
        </View>
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
            <View style={styles.emptyRecipes}>
              <MaterialCommunityIcons
                name="book-open-variant"
                size={48}
                color={colors.textSecondary}
              />
              <Text style={styles.emptyRecipesText}>
                No recipes yet. Import some recipes to start meal planning!
              </Text>
            </View>
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

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: colors.background,
  },
  content: {
    flex: 1,
    padding: 16,
  },
  calendar: {
    marginBottom: 8,
  },
  loadingContainer: {
    flex: 1,
    justifyContent: "center",
    alignItems: "center",
    backgroundColor: colors.background,
  },
  dateHeader: {
    fontSize: 18,
    fontWeight: "600",
    color: colors.text,
    marginBottom: 16,
  },
  mealBlocksContainer: {
    paddingBottom: 16,
  },
  mealBlock: {
    backgroundColor: "white",
    borderRadius: 12,
    padding: 16,
    marginBottom: 12,
    shadowColor: "#000",
    shadowOffset: { width: 0, height: 1 },
    shadowOpacity: 0.1,
    shadowRadius: 2,
    elevation: 2,
  },
  mealHeader: {
    flexDirection: "row",
    alignItems: "center",
    marginBottom: 12,
    gap: 8,
  },
  mealType: {
    fontSize: 16,
    fontWeight: "600",
    color: colors.primary,
  },
  mealContent: {
    flexDirection: "row",
    alignItems: "center",
  },
  mealImage: {
    width: 60,
    height: 60,
    borderRadius: 8,
    marginRight: 12,
  },
  mealInfo: {
    flex: 1,
  },
  mealName: {
    fontSize: 16,
    color: colors.text,
    marginBottom: 4,
  },
  mealMeta: {
    fontSize: 12,
    color: colors.textSecondary,
  },
  removeIcon: {
    padding: 4,
  },
  emptyMeal: {
    alignItems: "center",
    padding: 16,
  },
  addMealText: {
    color: colors.primary,
    fontSize: 14,
    marginTop: 8,
  },
  // Modal styles
  modalContainer: {
    flex: 1,
    backgroundColor: colors.background,
  },
  modalHeader: {
    flexDirection: "row",
    justifyContent: "space-between",
    alignItems: "center",
    padding: 16,
    borderBottomWidth: 1,
    borderBottomColor: colors.border,
  },
  modalTitle: {
    fontSize: 20,
    fontWeight: "600",
    color: colors.text,
  },
  closeButton: {
    padding: 4,
  },
  recipeList: {
    padding: 16,
  },
  recipeItem: {
    flexDirection: "row",
    backgroundColor: "white",
    borderRadius: 12,
    padding: 12,
    marginBottom: 12,
    shadowColor: "#000",
    shadowOffset: { width: 0, height: 1 },
    shadowOpacity: 0.1,
    shadowRadius: 2,
    elevation: 2,
  },
  recipeImage: {
    width: 70,
    height: 70,
    borderRadius: 8,
    marginRight: 12,
  },
  recipePlaceholder: {
    backgroundColor: colors.surface,
    justifyContent: "center",
    alignItems: "center",
  },
  recipeInfo: {
    flex: 1,
    justifyContent: "center",
  },
  recipeTitle: {
    fontSize: 16,
    fontWeight: "500",
    color: colors.text,
    marginBottom: 4,
  },
  recipeMeta: {
    flexDirection: "row",
    gap: 12,
  },
  recipeMetaText: {
    fontSize: 12,
    color: colors.textSecondary,
  },
  emptyRecipes: {
    flex: 1,
    justifyContent: "center",
    alignItems: "center",
    padding: 32,
  },
  emptyRecipesText: {
    fontSize: 16,
    color: colors.textSecondary,
    textAlign: "center",
    marginTop: 16,
  },
  savingOverlay: {
    ...StyleSheet.absoluteFillObject,
    backgroundColor: "rgba(255, 255, 255, 0.8)",
    justifyContent: "center",
    alignItems: "center",
  },
});

export default MealPlannerScreen;
