// screens/CookingModeScreen.tsx
// Step-by-step cooking mode with large text and swipe navigation
// Warm editorial design with serif typography for hands-free readability

import React, { useState, useCallback, useEffect, useRef, useMemo } from 'react';
import {
  View,
  Text,
  Dimensions,
  TouchableOpacity,
  FlatList,
  Alert,
  Platform,
} from 'react-native';
import { useRoute, useNavigation, RouteProp } from '@react-navigation/native';
import { StackNavigationProp } from '@react-navigation/stack';
import { MaterialCommunityIcons } from '@expo/vector-icons';
import { IconButton, ProgressBar } from 'react-native-paper';
import { StatusBar } from 'expo-status-bar';
import Animated, { FadeIn, FadeInDown, useSharedValue, useAnimatedStyle, withSpring } from 'react-native-reanimated';

import { Screen } from '../components/Screen';
import { useTheme } from '../theme';
import { fetchRecipeById, RecipeWithIngredients } from '../lib/recipeService';

const { width: SCREEN_WIDTH } = Dimensions.get('window');

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
  const { theme } = useTheme();
  const { colors, spacing, borderRadius, typography } = theme;

  // Warm cooking mode colors from theme
  const cookingBg = colors.cookingBackground;
  const cookingAccent = colors.cookingAccent;
  const cookingText = colors.cookingText;

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

  const goToNextStep = useCallback(() => {
    if (currentStep < totalSteps - 1) {
      const nextStep = currentStep + 1;
      setCurrentStep(nextStep);
      flatListRef.current?.scrollToIndex({ index: nextStep, animated: true });
    }
  }, [currentStep, totalSteps]);

  const goToPrevStep = useCallback(() => {
    if (currentStep > 0) {
      const prevStep = currentStep - 1;
      setCurrentStep(prevStep);
      flatListRef.current?.scrollToIndex({ index: prevStep, animated: true });
    }
  }, [currentStep]);

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

  const startTimer = useCallback((minutes: number) => {
    const seconds = minutes * 60;
    setTimer({
      isRunning: true,
      seconds,
      initialSeconds: seconds,
    });
  }, []);

  const toggleTimer = useCallback(() => {
    setTimer((prev) => ({ ...prev, isRunning: !prev.isRunning }));
  }, []);

  const resetTimer = useCallback(() => {
    setTimer({
      isRunning: false,
      seconds: 0,
      initialSeconds: 0,
    });
  }, []);

  const formatTime = (seconds: number): string => {
    const mins = Math.floor(seconds / 60);
    const secs = seconds % 60;
    return `${mins.toString().padStart(2, '0')}:${secs.toString().padStart(2, '0')}`;
  };

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

  const handleComplete = useCallback(() => {
    Alert.alert(
      'Cooking Complete!',
      'Great job! Would you like to mark this recipe as cooked?',
      [
        { text: 'Not Now', style: 'cancel', onPress: () => navigation.goBack() },
        {
          text: 'Mark as Cooked',
          onPress: () => {
            navigation.goBack();
          },
        },
      ]
    );
  }, [navigation]);

  const styles = useMemo(
    () => ({
      container: {
        flex: 1,
        backgroundColor: cookingBg,
      },
      loadingContainer: {
        flex: 1,
        justifyContent: 'center' as const,
        alignItems: 'center' as const,
        backgroundColor: cookingBg,
      },
      loadingText: {
        color: cookingText,
        ...typography.editorialStyles.sectionHeading,
      },
      header: {
        flexDirection: 'row' as const,
        alignItems: 'center' as const,
        paddingTop: Platform.OS === 'ios' ? 50 : 20,
        paddingHorizontal: spacing.sm,
        paddingBottom: spacing.sm,
        backgroundColor: cookingBg,
      },
      headerCenter: {
        flex: 1,
        alignItems: 'center' as const,
      },
      headerTitle: {
        color: cookingText,
        ...typography.editorialStyles.cardTitle,
      },
      headerProgress: {
        color: 'rgba(255,255,255,0.6)',
        ...typography.editorialStyles.byline,
        marginTop: 4,
      },
      progressBar: {
        height: 3,
        backgroundColor: 'rgba(255,255,255,0.15)',
        borderRadius: 2,
      },
      stepContainer: {
        width: SCREEN_WIDTH,
        flex: 1,
        justifyContent: 'center' as const,
        padding: spacing.xl,
      },
      stepContent: {
        flex: 1,
        justifyContent: 'center' as const,
        alignItems: 'center' as const,
      },
      // Editorial-style step badge: "STEP 1 OF 8"
      stepNumberBadge: {
        backgroundColor: cookingAccent,
        paddingHorizontal: spacing.lg,
        paddingVertical: spacing.sm,
        borderRadius: borderRadius.full,
        marginBottom: spacing.xl,
      },
      stepNumberText: {
        ...typography.editorialStyles.cookingStepLabel,
        color: cookingBg,
      },
      // Large serif text for hands-free reading
      stepText: {
        ...typography.editorialStyles.cookingStep,
        color: cookingText,
        textAlign: 'center' as const,
        paddingHorizontal: spacing.md,
      },
      swipeHints: {
        flexDirection: 'row' as const,
        justifyContent: 'space-between' as const,
        paddingHorizontal: spacing.md,
        paddingBottom: spacing.md,
      },
      swipeHint: {
        flexDirection: 'row' as const,
        alignItems: 'center' as const,
        opacity: 0.7,
      },
      swipeHintRight: {
        marginLeft: 'auto' as const,
      },
      swipeHintText: {
        color: cookingText,
        ...typography.editorialStyles.byline,
        textTransform: 'uppercase' as const,
      },
      ingredientsContainer: {
        flex: 1,
        padding: spacing.lg,
      },
      ingredientsTitle: {
        color: cookingText,
        ...typography.editorialStyles.sectionHeading,
        marginBottom: spacing.xl,
        textAlign: 'center' as const,
      },
      ingredientRow: {
        flexDirection: 'row' as const,
        alignItems: 'center' as const,
        marginBottom: spacing.md,
        paddingVertical: spacing.xs,
      },
      ingredientText: {
        ...typography.editorialStyles.ingredient,
        color: cookingText,
        flex: 1,
      },
      // Timer section with warm styling
      timerSection: {
        backgroundColor: 'rgba(255,255,255,0.08)',
        padding: spacing.lg,
        marginHorizontal: spacing.lg,
        borderRadius: borderRadius.lg,
        marginBottom: spacing.md,
        borderWidth: 1,
        borderColor: 'rgba(255,255,255,0.1)',
      },
      timerActive: {
        alignItems: 'center' as const,
      },
      timerDisplay: {
        color: cookingAccent,
        fontSize: 56,
        fontWeight: '300' as const,
        fontVariant: ['tabular-nums'] as ['tabular-nums'],
        letterSpacing: 2,
      },
      timerControls: {
        flexDirection: 'row' as const,
        marginTop: spacing.md,
        gap: spacing.sm,
      },
      timerButton: {
        backgroundColor: 'rgba(255,255,255,0.12)',
        marginHorizontal: spacing.xs,
      },
      quickTimers: {
        flexDirection: 'row' as const,
        alignItems: 'center' as const,
        justifyContent: 'center' as const,
        flexWrap: 'wrap' as const,
        gap: spacing.sm,
      },
      quickTimerLabel: {
        color: 'rgba(255,255,255,0.6)',
        ...typography.editorialStyles.byline,
        marginRight: spacing.sm,
      },
      quickTimerButton: {
        backgroundColor: 'rgba(255,255,255,0.12)',
        paddingHorizontal: spacing.md,
        paddingVertical: spacing.sm,
        borderRadius: borderRadius.full,
        borderWidth: 1,
        borderColor: 'rgba(255,255,255,0.15)',
      },
      quickTimerText: {
        color: cookingText,
        ...typography.editorialStyles.byline,
        fontWeight: '600' as const,
      },
      // Progress dots with spring animation on active
      dotsContainer: {
        flexDirection: 'row' as const,
        justifyContent: 'center' as const,
        alignItems: 'center' as const,
        paddingBottom: Platform.OS === 'ios' ? 40 : 24,
        gap: spacing.sm,
      },
      dot: {
        width: 8,
        height: 8,
        borderRadius: 4,
        backgroundColor: 'rgba(255,255,255,0.25)',
      },
      dotActive: {
        backgroundColor: cookingAccent,
        width: 24,
      },
      dotCompleted: {
        backgroundColor: 'rgba(255,255,255,0.5)',
      },
    }),
    [cookingBg, cookingAccent, cookingText, spacing, borderRadius, typography]
  );

  const renderStep = useCallback(
    ({ item, index }: { item: string; index: number }) => (
      <View style={styles.stepContainer}>
        <View style={styles.stepContent}>
          {/* Editorial-style badge: "STEP 1 OF 8" */}
          <Animated.View
            entering={FadeIn.delay(100).duration(300)}
            style={styles.stepNumberBadge}
          >
            <Text style={styles.stepNumberText}>
              STEP {index + 1} OF {totalSteps}
            </Text>
          </Animated.View>

          {/* Large serif text for hands-free reading */}
          <Animated.Text
            entering={FadeIn.delay(200).duration(400)}
            style={styles.stepText}
          >
            {item}
          </Animated.Text>
        </View>

        <View style={styles.swipeHints}>
          {index > 0 && (
            <TouchableOpacity style={styles.swipeHint} onPress={goToPrevStep}>
              <MaterialCommunityIcons
                name="chevron-left"
                size={28}
                color={cookingText}
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
                size={28}
                color={cookingText}
              />
            </TouchableOpacity>
          ) : (
            <TouchableOpacity
              style={[styles.swipeHint, styles.swipeHintRight]}
              onPress={handleComplete}
            >
              <Text style={[styles.swipeHintText, { color: cookingAccent }]}>
                Done
              </Text>
              <MaterialCommunityIcons
                name="check-circle"
                size={28}
                color={cookingAccent}
              />
            </TouchableOpacity>
          )}
        </View>
      </View>
    ),
    [styles, totalSteps, goToPrevStep, goToNextStep, handleComplete, cookingText, cookingAccent]
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
      <Animated.View entering={FadeIn.duration(400)} style={styles.header}>
        <IconButton
          icon="close"
          iconColor={cookingText}
          size={24}
          onPress={handleExit}
        />
        <View style={styles.headerCenter}>
          <Text style={styles.headerTitle} numberOfLines={1}>
            {recipe.title}
          </Text>
          <Text style={styles.headerProgress}>
            {currentStep + 1} of {totalSteps} steps
          </Text>
        </View>
        <IconButton
          icon={showIngredients ? 'format-list-bulleted' : 'food-variant'}
          iconColor={cookingAccent}
          size={24}
          onPress={() => setShowIngredients(!showIngredients)}
        />
      </Animated.View>

      {/* Progress Bar */}
      <ProgressBar progress={progress} color={cookingAccent} style={styles.progressBar} />

      {/* Main Content - Steps or Ingredients */}
      {showIngredients ? (
        <Animated.View entering={FadeInDown.duration(300)} style={styles.ingredientsContainer}>
          <Text style={styles.ingredientsTitle}>Ingredients</Text>
          {recipe.ingredients?.map((ing, idx) => (
            <Animated.View
              key={idx}
              entering={FadeInDown.delay(idx * 50).duration(300)}
              style={styles.ingredientRow}
            >
              <MaterialCommunityIcons
                name="circle-small"
                size={24}
                color={cookingAccent}
              />
              <Text style={styles.ingredientText}>
                {ing.quantity ? `${ing.quantity} ` : ''}
                {ing.unit ? `${ing.unit} ` : ''}
                {ing.name}
              </Text>
            </Animated.View>
          ))}
        </Animated.View>
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
      <Animated.View entering={FadeInDown.delay(200).duration(400)} style={styles.timerSection}>
        {timer.seconds > 0 ? (
          <View style={styles.timerActive}>
            <Text style={styles.timerDisplay}>{formatTime(timer.seconds)}</Text>
            <View style={styles.timerControls}>
              <IconButton
                icon={timer.isRunning ? 'pause' : 'play'}
                iconColor={cookingText}
                size={32}
                onPress={toggleTimer}
                style={styles.timerButton}
              />
              <IconButton
                icon="stop"
                iconColor={cookingText}
                size={32}
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
      </Animated.View>

      {/* Step Dots - show progress with completed states */}
      <View style={styles.dotsContainer}>
        {recipe.instructions?.map((_, idx) => (
          <View
            key={idx}
            style={[
              styles.dot,
              idx === currentStep && styles.dotActive,
              idx < currentStep && styles.dotCompleted,
            ]}
          />
        ))}
      </View>
    </View>
  );
}
