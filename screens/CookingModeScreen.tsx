// screens/CookingModeScreen.tsx
// Step-by-step cooking mode with large text and swipe navigation

import React, { useState, useCallback, useEffect, useRef } from 'react';
import {
  View,
  Text,
  StyleSheet,
  Dimensions,
  TouchableOpacity,
  FlatList,
  Alert,
  Platform,
} from 'react-native';
import { useRoute, useNavigation, RouteProp } from '@react-navigation/native';
import { StackNavigationProp } from '@react-navigation/stack';
import { MaterialCommunityIcons } from '@expo/vector-icons';
import { Button, IconButton, ProgressBar } from 'react-native-paper';
import { StatusBar } from 'expo-status-bar';
// Note: Install expo-keep-awake and add useKeepAwake() to keep screen on during cooking

import { Screen } from '../components/Screen';
import { colors } from '../theme/colors';
import { fetchRecipeById, RecipeWithIngredients } from '../lib/recipeService';

const { width: SCREEN_WIDTH, height: SCREEN_HEIGHT } = Dimensions.get('window');

type RouteParams = {
  params: { recipeId: string };
};

type RootStackParamList = {
  RecipeDetail: { id: string };
};

type NavigationProp = StackNavigationProp<RootStackParamList>;

interface TimerState {
  isRunning: boolean;
  seconds: number;
  initialSeconds: number;
}

export default function CookingModeScreen() {
  const route = useRoute<RouteProp<RouteParams, 'params'>>();
  const navigation = useNavigation<NavigationProp>();
  const { recipeId } = route.params;
  const flatListRef = useRef<FlatList>(null);

  // TODO: Add useKeepAwake() from expo-keep-awake to keep screen on during cooking

  const [recipe, setRecipe] = useState<RecipeWithIngredients | null>(null);
  const [currentStep, setCurrentStep] = useState(0);
  const [showIngredients, setShowIngredients] = useState(false);
  const [timer, setTimer] = useState<TimerState>({
    isRunning: false,
    seconds: 0,
    initialSeconds: 0,
  });
  const [loading, setLoading] = useState(true);

  // Load recipe
  useEffect(() => {
    const load = async () => {
      try {
        const data = await fetchRecipeById(recipeId);
        setRecipe(data);
      } catch (error) {
        console.error('Error loading recipe:', error);
        Alert.alert('Error', 'Failed to load recipe');
        navigation.goBack();
      } finally {
        setLoading(false);
      }
    };
    load();
  }, [recipeId, navigation]);

  // Timer countdown
  useEffect(() => {
    let interval: NodeJS.Timeout | null = null;

    if (timer.isRunning && timer.seconds > 0) {
      interval = setInterval(() => {
        setTimer((prev) => {
          if (prev.seconds <= 1) {
            // Timer finished
            Alert.alert('Timer Done!', 'Your timer has finished.', [
              { text: 'OK', onPress: () => {} },
            ]);
            return { ...prev, isRunning: false, seconds: 0 };
          }
          return { ...prev, seconds: prev.seconds - 1 };
        });
      }, 1000);
    }

    return () => {
      if (interval) clearInterval(interval);
    };
  }, [timer.isRunning, timer.seconds]);

  const totalSteps = recipe?.instructions?.length || 0;
  const progress = totalSteps > 0 ? (currentStep + 1) / totalSteps : 0;

  // Navigate to next step
  const goToNextStep = useCallback(() => {
    if (currentStep < totalSteps - 1) {
      const nextStep = currentStep + 1;
      setCurrentStep(nextStep);
      flatListRef.current?.scrollToIndex({ index: nextStep, animated: true });
    }
  }, [currentStep, totalSteps]);

  // Navigate to previous step
  const goToPrevStep = useCallback(() => {
    if (currentStep > 0) {
      const prevStep = currentStep - 1;
      setCurrentStep(prevStep);
      flatListRef.current?.scrollToIndex({ index: prevStep, animated: true });
    }
  }, [currentStep]);

  // Handle swipe to change step
  const handleScrollEnd = useCallback(
    (event: { nativeEvent: { contentOffset: { x: number } } }) => {
      const offsetX = event.nativeEvent.contentOffset.x;
      const newIndex = Math.round(offsetX / SCREEN_WIDTH);
      if (newIndex !== currentStep && newIndex >= 0 && newIndex < totalSteps) {
        setCurrentStep(newIndex);
      }
    },
    [currentStep, totalSteps]
  );

  // Start a quick timer (in minutes)
  const startTimer = useCallback((minutes: number) => {
    const seconds = minutes * 60;
    setTimer({
      isRunning: true,
      seconds,
      initialSeconds: seconds,
    });
  }, []);

  // Pause/resume timer
  const toggleTimer = useCallback(() => {
    setTimer((prev) => ({ ...prev, isRunning: !prev.isRunning }));
  }, []);

  // Reset timer
  const resetTimer = useCallback(() => {
    setTimer({
      isRunning: false,
      seconds: 0,
      initialSeconds: 0,
    });
  }, []);

  // Format timer display
  const formatTime = (seconds: number): string => {
    const mins = Math.floor(seconds / 60);
    const secs = seconds % 60;
    return `${mins.toString().padStart(2, '0')}:${secs.toString().padStart(2, '0')}`;
  };

  // Exit cooking mode
  const handleExit = useCallback(() => {
    Alert.alert(
      'Exit Cooking Mode',
      'Are you sure you want to exit? Your progress will not be saved.',
      [
        { text: 'Stay', style: 'cancel' },
        { text: 'Exit', onPress: () => navigation.goBack() },
      ]
    );
  }, [navigation]);

  // Complete cooking
  const handleComplete = useCallback(() => {
    Alert.alert(
      'Cooking Complete!',
      'Great job! Would you like to mark this recipe as cooked?',
      [
        { text: 'Not Now', style: 'cancel', onPress: () => navigation.goBack() },
        {
          text: 'Mark as Cooked',
          onPress: () => {
            // Navigate back to recipe detail which can handle marking as cooked
            navigation.goBack();
          },
        },
      ]
    );
  }, [navigation]);

  // Render a single step
  const renderStep = useCallback(
    ({ item, index }: { item: string; index: number }) => (
      <View style={styles.stepContainer}>
        <View style={styles.stepContent}>
          <View style={styles.stepNumberBadge}>
            <Text style={styles.stepNumberText}>Step {index + 1}</Text>
          </View>
          <Text style={styles.stepText}>{item}</Text>
        </View>

        {/* Navigation hints */}
        <View style={styles.swipeHints}>
          {index > 0 && (
            <TouchableOpacity style={styles.swipeHint} onPress={goToPrevStep}>
              <MaterialCommunityIcons
                name="chevron-left"
                size={32}
                color={colors.textTertiary}
              />
              <Text style={styles.swipeHintText}>Previous</Text>
            </TouchableOpacity>
          )}
          {index < totalSteps - 1 ? (
            <TouchableOpacity
              style={[styles.swipeHint, styles.swipeHintRight]}
              onPress={goToNextStep}
            >
              <Text style={styles.swipeHintText}>Next</Text>
              <MaterialCommunityIcons
                name="chevron-right"
                size={32}
                color={colors.textTertiary}
              />
            </TouchableOpacity>
          ) : (
            <TouchableOpacity
              style={[styles.swipeHint, styles.swipeHintRight]}
              onPress={handleComplete}
            >
              <Text style={[styles.swipeHintText, { color: colors.success }]}>
                Done
              </Text>
              <MaterialCommunityIcons
                name="check-circle"
                size={32}
                color={colors.success}
              />
            </TouchableOpacity>
          )}
        </View>
      </View>
    ),
    [totalSteps, goToPrevStep, goToNextStep, handleComplete]
  );

  if (loading || !recipe) {
    return (
      <Screen style={styles.loadingContainer}>
        <Text style={styles.loadingText}>Loading recipe...</Text>
      </Screen>
    );
  }

  return (
    <View style={styles.container}>
      <StatusBar style="light" />

      {/* Header */}
      <View style={styles.header}>
        <IconButton
          icon="close"
          iconColor={colors.white}
          size={24}
          onPress={handleExit}
        />
        <View style={styles.headerCenter}>
          <Text style={styles.headerTitle} numberOfLines={1}>
            {recipe.title}
          </Text>
          <Text style={styles.headerProgress}>
            Step {currentStep + 1} of {totalSteps}
          </Text>
        </View>
        <IconButton
          icon={showIngredients ? 'format-list-bulleted' : 'food-variant'}
          iconColor={colors.white}
          size={24}
          onPress={() => setShowIngredients(!showIngredients)}
        />
      </View>

      {/* Progress Bar */}
      <ProgressBar progress={progress} color={colors.primary} style={styles.progressBar} />

      {/* Main Content - Steps or Ingredients */}
      {showIngredients ? (
        <View style={styles.ingredientsContainer}>
          <Text style={styles.ingredientsTitle}>Ingredients</Text>
          {recipe.ingredients?.map((ing, idx) => (
            <View key={idx} style={styles.ingredientRow}>
              <MaterialCommunityIcons
                name="circle-small"
                size={24}
                color={colors.white}
              />
              <Text style={styles.ingredientText}>
                {ing.quantity ? `${ing.quantity} ` : ''}
                {ing.unit ? `${ing.unit} ` : ''}
                {ing.name}
              </Text>
            </View>
          ))}
        </View>
      ) : (
        <FlatList
          ref={flatListRef}
          data={recipe.instructions || []}
          renderItem={renderStep}
          keyExtractor={(_, index) => index.toString()}
          horizontal
          pagingEnabled
          showsHorizontalScrollIndicator={false}
          onMomentumScrollEnd={handleScrollEnd}
          initialScrollIndex={currentStep}
          getItemLayout={(_, index) => ({
            length: SCREEN_WIDTH,
            offset: SCREEN_WIDTH * index,
            index,
          })}
        />
      )}

      {/* Timer Section */}
      <View style={styles.timerSection}>
        {timer.seconds > 0 ? (
          <View style={styles.timerActive}>
            <Text style={styles.timerDisplay}>{formatTime(timer.seconds)}</Text>
            <View style={styles.timerControls}>
              <IconButton
                icon={timer.isRunning ? 'pause' : 'play'}
                iconColor={colors.white}
                size={28}
                onPress={toggleTimer}
                style={styles.timerButton}
              />
              <IconButton
                icon="stop"
                iconColor={colors.white}
                size={28}
                onPress={resetTimer}
                style={styles.timerButton}
              />
            </View>
          </View>
        ) : (
          <View style={styles.quickTimers}>
            <Text style={styles.quickTimerLabel}>Quick Timer:</Text>
            {[1, 3, 5, 10, 15, 30].map((mins) => (
              <TouchableOpacity
                key={mins}
                style={styles.quickTimerButton}
                onPress={() => startTimer(mins)}
              >
                <Text style={styles.quickTimerText}>{mins}m</Text>
              </TouchableOpacity>
            ))}
          </View>
        )}
      </View>

      {/* Step Dots */}
      <View style={styles.dotsContainer}>
        {recipe.instructions?.map((_, idx) => (
          <View
            key={idx}
            style={[styles.dot, idx === currentStep && styles.dotActive]}
          />
        ))}
      </View>
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#1a1a2e',
  },
  loadingContainer: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
    backgroundColor: '#1a1a2e',
  },
  loadingText: {
    color: colors.white,
    fontSize: 18,
  },
  header: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingTop: Platform.OS === 'ios' ? 50 : 20,
    paddingHorizontal: 8,
    paddingBottom: 8,
    backgroundColor: '#1a1a2e',
  },
  headerCenter: {
    flex: 1,
    alignItems: 'center',
  },
  headerTitle: {
    color: colors.white,
    fontSize: 18,
    fontWeight: '600',
  },
  headerProgress: {
    color: colors.textTertiary,
    fontSize: 14,
    marginTop: 2,
  },
  progressBar: {
    height: 4,
    backgroundColor: '#2a2a4e',
  },
  stepContainer: {
    width: SCREEN_WIDTH,
    flex: 1,
    justifyContent: 'center',
    padding: 24,
  },
  stepContent: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
  },
  stepNumberBadge: {
    backgroundColor: colors.primary,
    paddingHorizontal: 16,
    paddingVertical: 8,
    borderRadius: 20,
    marginBottom: 24,
  },
  stepNumberText: {
    color: colors.white,
    fontSize: 16,
    fontWeight: '600',
  },
  stepText: {
    color: colors.white,
    fontSize: 28,
    lineHeight: 40,
    textAlign: 'center',
    fontWeight: '400',
  },
  swipeHints: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    paddingHorizontal: 16,
    paddingBottom: 16,
  },
  swipeHint: {
    flexDirection: 'row',
    alignItems: 'center',
  },
  swipeHintRight: {
    marginLeft: 'auto',
  },
  swipeHintText: {
    color: colors.textTertiary,
    fontSize: 16,
  },
  ingredientsContainer: {
    flex: 1,
    padding: 24,
  },
  ingredientsTitle: {
    color: colors.white,
    fontSize: 24,
    fontWeight: '600',
    marginBottom: 20,
    textAlign: 'center',
  },
  ingredientRow: {
    flexDirection: 'row',
    alignItems: 'center',
    marginBottom: 12,
  },
  ingredientText: {
    color: colors.white,
    fontSize: 20,
    flex: 1,
  },
  timerSection: {
    backgroundColor: '#2a2a4e',
    padding: 16,
    marginHorizontal: 16,
    borderRadius: 12,
    marginBottom: 16,
  },
  timerActive: {
    alignItems: 'center',
  },
  timerDisplay: {
    color: colors.white,
    fontSize: 48,
    fontWeight: '300',
    fontVariant: ['tabular-nums'],
  },
  timerControls: {
    flexDirection: 'row',
    marginTop: 8,
  },
  timerButton: {
    backgroundColor: 'rgba(255,255,255,0.1)',
    marginHorizontal: 8,
  },
  quickTimers: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    flexWrap: 'wrap',
    gap: 8,
  },
  quickTimerLabel: {
    color: colors.textTertiary,
    fontSize: 14,
    marginRight: 8,
  },
  quickTimerButton: {
    backgroundColor: 'rgba(255,255,255,0.1)',
    paddingHorizontal: 16,
    paddingVertical: 8,
    borderRadius: 20,
  },
  quickTimerText: {
    color: colors.white,
    fontSize: 14,
    fontWeight: '500',
  },
  dotsContainer: {
    flexDirection: 'row',
    justifyContent: 'center',
    paddingBottom: Platform.OS === 'ios' ? 40 : 24,
    gap: 8,
  },
  dot: {
    width: 8,
    height: 8,
    borderRadius: 4,
    backgroundColor: 'rgba(255,255,255,0.3)',
  },
  dotActive: {
    backgroundColor: colors.primary,
    width: 24,
  },
});
