import React, { useState } from "react";
import {
  View,
  Text,
  StyleSheet,
  TouchableOpacity,
  ActivityIndicator,
  SafeAreaView,
  ScrollView,
} from "react-native";
import { WeekCalendar } from "react-native-calendars";
import { colors } from "../theme/colors";
import { Recipe } from "../models/Recipe";

const getToday = () => new Date().toISOString().split('T')[0];

type MealTypeKey = 'breakfast' | 'lunch' | 'dinner';

type Meal = {
  id: string;
  recipe: Recipe | null;
  title: string;
  type: MealTypeKey;
};

type MealPlanDay = {
  date: string;
  meals: {
    [key in MealTypeKey]?: Meal;
  };
};

const MealPlannerScreen: React.FC = () => {
  const [mealPlan] = useState<MealPlanDay[]>([]);
  const [selectedDate, setSelectedDate] = useState(getToday());
  const [loading] = useState(false);
  
  // Find the plan for the selected date
  const dayPlan = mealPlan.find((d) => d.date === selectedDate);
  const mealTypes: MealTypeKey[] = ['breakfast', 'lunch', 'dinner'];
  
  const renderMealBlock = (mealType: MealTypeKey) => {
    const meal = dayPlan?.meals[mealType];
    
    return (
      <TouchableOpacity 
        style={styles.mealBlock}
        onPress={() => {
          if (meal) {
            // Navigate to recipe details
          } else {
            // Open recipe picker
          }
        }}
      >
        <Text style={styles.mealType}>
          {mealType.charAt(0).toUpperCase() + mealType.slice(1)}
        </Text>
        {meal ? (
          <View style={styles.mealContent}>
            <Text style={styles.mealName}>{meal.title}</Text>
            {meal.recipe?.ingredients && meal.recipe.ingredients.length > 0 && (
              <Text style={styles.ingredientsText}>
                {meal.recipe.ingredients.length} ingredients
              </Text>
            )}
          </View>
        ) : (
          <Text style={styles.addMealText}>+ Add {mealType}</Text>
        )}
      </TouchableOpacity>
    );
  };
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
        markedDates={{
          [selectedDate]: { 
            selected: true, 
            selectedColor: colors.primary,
            selectedTextColor: 'white'
          },
        }}
        theme={{
          selectedDayBackgroundColor: colors.primary,
          todayTextColor: colors.primary,
          dotColor: colors.primary,
          arrowColor: colors.primary,
          textDayFontWeight: '500',
          textMonthFontWeight: '600',
          textDayHeaderFontWeight: '500',
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
        <View style={styles.mealBlocksContainer}>
          {mealTypes.map((mealType) => (
            <View key={mealType} style={styles.mealBlock}>
              {renderMealBlock(mealType)}
            </View>
          ))}
        </View>
      </ScrollView>
      {loading && (
        <ActivityIndicator size="large" color={colors.primary} style={styles.loadingContainer} />
      )}
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
    marginBottom: 16,
  },
  loadingContainer: {
    position: 'absolute',
    top: 0,
    left: 0,
    right: 0,
    bottom: 0,
    justifyContent: 'center',
    alignItems: 'center',
    backgroundColor: 'rgba(255, 255, 255, 0.7)',
  },
  mealBlocksContainer: {
    paddingBottom: 16,
  },
  mealBlock: {
    backgroundColor: 'white',
    borderRadius: 8,
    padding: 16,
    marginBottom: 12,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 1 },
    shadowOpacity: 0.1,
    shadowRadius: 2,
    elevation: 2,
  },
  mealType: {
    fontSize: 16,
    fontWeight: '600',
    color: colors.primary,
    marginBottom: 8,
  },
  mealContent: {
    marginTop: 8,
  },
  mealName: {
    fontSize: 16,
    color: colors.text,
    marginBottom: 4,
  },
  ingredientsText: {
    fontSize: 14,
    color: colors.mediumGray,
  },
  addMealText: {
    color: colors.primary,
    fontSize: 16,
    fontStyle: 'italic',
    marginTop: 8,
  },
  emptyMeal: {
    color: colors.mediumGray,
    fontStyle: 'italic',
  },
});

export default MealPlannerScreen;
