/**
 * CookingModeScreen
 *
 * Hands-free cooking mode with warm dark background, large serif text,
 * integrated timer, voice control, and mise en place preparation view.
 *
 * Features:
 * - Keep screen awake during cooking
 * - Mise en place view to gather ingredients before cooking
 * - Inline ingredient quantities highlighted in step text
 * - Text-to-speech for step announcements
 * - Voice commands (next, back, repeat, timer)
 * - Vertical scrolling for long steps
 *
 * Reference: /ui-redesign/screens/cooking_mode.html
 */

import React, { useState, useCallback, useEffect, useRef } from 'react';
import {
  View,
  Text,
  Dimensions,
  FlatList,
  Alert,
  StyleSheet,
  ScrollView,
} from 'react-native';
import { useRoute, useNavigation, RouteProp } from '@react-navigation/native';
import { StackNavigationProp } from '@react-navigation/stack';
import { StatusBar } from 'expo-status-bar';
import { useKeepAwake } from 'expo-keep-awake';
import Animated, { FadeIn, FadeInDown, FadeOut } from 'react-native-reanimated';
import { Feather } from '@expo/vector-icons';

import { mangiaColors } from '../theme/tokens/colors';
import { fetchRecipeById, RecipeWithIngredients, markAsCooked } from '../lib/recipeService';

// Cooking components
import {
  CookingHeader,
  CookingStepContent,
  CookingTimer,
  CookingControls,
  MiseEnPlaceView,
} from '../components/cooking';

// Voice hooks
import { useSpeech } from '../hooks/useSpeech';
import { useVoiceControl, VoiceCommand } from '../hooks/useVoiceControl';

const { width: SCREEN_WIDTH } = Dimensions.get('window');

type RouteParams = {
  params: { recipeId: string };
};

type RootStackParamList = {
  RecipeDetail: { id: string };
};

type NavigationProp = StackNavigationProp<RootStackParamList>;

export default function CookingModeScreen() {
  // Keep screen awake during cooking
  useKeepAwake();

  const route = useRoute<RouteProp<RouteParams, 'params'>>();
  const navigation = useNavigation<NavigationProp>();
  const { recipeId } = route.params;
  const flatListRef = useRef<FlatList>(null);

  // Core state
  const [recipe, setRecipe] = useState<RecipeWithIngredients | null>(null);
  const [currentStep, setCurrentStep] = useState(0);
  const [showIngredients, setShowIngredients] = useState(false);
  const [showMiseEnPlace, setShowMiseEnPlace] = useState(true);
  const [loading, setLoading] = useState(true);

  // Voice state
  const [voiceEnabled, setVoiceEnabled] = useState(false);
  const [timerSeconds, setTimerSeconds] = useState(120);

  // Speech hook for TTS
  const { speak, stop: stopSpeaking, isSpeaking, isAvailable: ttsAvailable } = useSpeech({
    rate: 0.85,
  });

  // Voice control hook
  const handleVoiceCommand = useCallback((command: VoiceCommand) => {
    switch (command.type) {
      case 'next':
        goToNextStep();
        break;
      case 'previous':
        goToPrevStep();
        break;
      case 'repeat':
        if (recipe?.instructions?.[currentStep]) {
          speak(recipe.instructions[currentStep]);
        }
        break;
      case 'timer':
        setTimerSeconds(command.minutes * 60);
        break;
      case 'ingredients':
        setShowIngredients(prev => !prev);
        break;
      case 'stop':
        stopSpeaking();
        break;
    }
  }, [currentStep, recipe, speak, stopSpeaking]);

  const {
    isListening,
    isAvailable: voiceAvailable,
    startListening,
    stopListening,
  } = useVoiceControl({
    onCommand: handleVoiceCommand,
    autoRestart: true,
    enabled: voiceEnabled,
  });

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

  const totalSteps = recipe?.instructions?.length || 0;

  // Speak step when navigating (if voice enabled)
  useEffect(() => {
    if (voiceEnabled && ttsAvailable && recipe?.instructions?.[currentStep] && !showMiseEnPlace) {
      // Stop any current speech before starting new
      stopSpeaking();
      // Small delay to let the UI update first
      const timer = setTimeout(() => {
        speak(recipe.instructions[currentStep]);
      }, 300);
      return () => clearTimeout(timer);
    }
  }, [currentStep, voiceEnabled, ttsAvailable, showMiseEnPlace]);

  // Start/stop voice recognition when enabled/disabled
  useEffect(() => {
    if (voiceEnabled && voiceAvailable && !showMiseEnPlace) {
      startListening();
    } else {
      stopListening();
    }
  }, [voiceEnabled, voiceAvailable, showMiseEnPlace]);

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

  const handleExit = useCallback(() => {
    // Stop voice before exiting
    stopSpeaking();
    stopListening();

    Alert.alert(
      'Exit Cooking Mode',
      'Are you sure you want to exit? Your progress will not be saved.',
      [
        { text: 'Stay', style: 'cancel' },
        { text: 'Exit', onPress: () => navigation.goBack() },
      ]
    );
  }, [navigation, stopSpeaking, stopListening]);

  const handleComplete = useCallback(async () => {
    // Stop voice
    stopSpeaking();
    stopListening();

    Alert.alert(
      'Cooking Complete!',
      'Great job! Would you like to mark this recipe as cooked?',
      [
        { text: 'Not Now', style: 'cancel', onPress: () => navigation.goBack() },
        {
          text: 'Mark as Cooked',
          onPress: async () => {
            try {
              if (recipe) {
                await markAsCooked(recipe.id);
              }
            } catch (error) {
              console.error('Error marking as cooked:', error);
            }
            navigation.goBack();
          },
        },
      ]
    );
  }, [navigation, recipe, stopSpeaking, stopListening]);

  const handleTimerComplete = useCallback(() => {
    if (voiceEnabled && ttsAvailable) {
      speak('Your timer is done!');
    }
    Alert.alert('Timer Done!', 'Your timer has finished.');
  }, [voiceEnabled, ttsAvailable, speak]);

  const toggleIngredients = useCallback(() => {
    setShowIngredients(!showIngredients);
  }, [showIngredients]);

  const toggleVoice = useCallback(() => {
    const newValue = !voiceEnabled;
    setVoiceEnabled(newValue);
    if (!newValue) {
      stopSpeaking();
      stopListening();
    }
  }, [voiceEnabled, stopSpeaking, stopListening]);

  const handleStartCooking = useCallback(() => {
    setShowMiseEnPlace(false);
    // Start voice if enabled
    if (voiceEnabled && voiceAvailable) {
      startListening();
    }
  }, [voiceEnabled, voiceAvailable, startListening]);

  // Get step category based on content
  const getStepCategory = (stepIndex: number): string => {
    // Simple logic: first quarter is prep, middle half is cooking, last quarter is finishing
    const quarter = totalSteps / 4;
    if (stepIndex < quarter) return 'Preparation';
    if (stepIndex < quarter * 3) return 'Cooking';
    if (stepIndex < quarter * 4 - 1) return 'Finishing';
    return 'Plating';
  };

  // Render step item
  const renderStep = useCallback(
    ({ item, index }: { item: string; index: number }) => (
      <View style={styles.stepContainer}>
        <CookingStepContent
          stepText={item}
          stepCategory={getStepCategory(index)}
          ingredients={recipe?.ingredients}
        />

        {/* Timer Card */}
        <View style={styles.timerContainer}>
          <CookingTimer
            initialSeconds={timerSeconds}
            onTimerComplete={handleTimerComplete}
          />
        </View>
      </View>
    ),
    [handleTimerComplete, totalSteps, timerSeconds, recipe?.ingredients]
  );

  // Loading state
  if (loading || !recipe) {
    return (
      <View style={styles.container}>
        <StatusBar style="light" />
        <View style={styles.loadingContainer}>
          <Feather name="loader" size={32} color={mangiaColors.cream} />
          <Text style={styles.loadingText}>Loading recipe...</Text>
        </View>
      </View>
    );
  }

  // Mise en Place View
  if (showMiseEnPlace) {
    return (
      <View style={styles.container}>
        <StatusBar style="light" />
        <MiseEnPlaceView
          recipeName={recipe.title}
          ingredients={recipe.ingredients || []}
          totalSteps={totalSteps}
          prepTime={recipe.prep_time}
          cookTime={recipe.cook_time}
          onStartCooking={handleStartCooking}
          onClose={() => navigation.goBack()}
        />
      </View>
    );
  }

  return (
    <View style={styles.container}>
      <StatusBar style="light" />

      {/* Header */}
      <CookingHeader
        currentStep={currentStep}
        totalSteps={totalSteps}
        onClose={handleExit}
        onToggleIngredients={toggleIngredients}
        onToggleVoice={toggleVoice}
        isVoiceEnabled={voiceEnabled}
        isListening={isListening}
      />

      {/* Main Content - Steps or Ingredients */}
      {showIngredients ? (
        <Animated.View
          entering={FadeInDown.duration(300)}
          exiting={FadeOut.duration(200)}
          style={styles.ingredientsContainer}
        >
          <ScrollView showsVerticalScrollIndicator={false}>
            <Text style={styles.ingredientsTitle}>Ingredients</Text>
            {recipe.ingredients?.map((ing, idx) => (
              <Animated.View
                key={idx}
                entering={FadeInDown.delay(idx * 50).duration(300)}
                style={styles.ingredientRow}
              >
                <View style={styles.ingredientBullet} />
                <Text style={styles.ingredientText}>
                  <Text style={styles.ingredientQuantity}>
                    {ing.quantity ? `${ing.quantity} ` : ''}
                    {ing.unit ? `${ing.unit} ` : ''}
                  </Text>
                  {ing.name}
                </Text>
              </Animated.View>
            ))}
          </ScrollView>
        </Animated.View>
      ) : (
        <Animated.View
          entering={FadeIn.duration(300)}
          style={styles.stepsContainer}
        >
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
        </Animated.View>
      )}

      {/* Bottom Controls */}
      {!showIngredients && (
        <CookingControls
          onPrevious={goToPrevStep}
          onNext={goToNextStep}
          canGoPrevious={currentStep > 0}
          canGoNext={currentStep < totalSteps - 1}
          isLastStep={currentStep === totalSteps - 1}
          onComplete={handleComplete}
          isVoiceEnabled={voiceEnabled}
          isListening={isListening}
          isSpeaking={isSpeaking}
        />
      )}
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: mangiaColors.deepBrown,
  },
  loadingContainer: {
    flex: 1,
    alignItems: 'center',
    justifyContent: 'center',
    gap: 16,
  },
  loadingText: {
    fontFamily: 'Georgia',
    fontSize: 18,
    color: mangiaColors.cream,
  },
  stepsContainer: {
    flex: 1,
  },
  stepContainer: {
    width: SCREEN_WIDTH,
    flex: 1,
    paddingHorizontal: 0,
  },
  timerContainer: {
    paddingHorizontal: 32,
    marginBottom: 16,
  },
  ingredientsContainer: {
    flex: 1,
    paddingHorizontal: 32,
    paddingTop: 16,
  },
  ingredientsTitle: {
    fontFamily: 'Georgia',
    fontSize: 28,
    fontWeight: '400',
    color: mangiaColors.cream,
    marginBottom: 24,
  },
  ingredientRow: {
    flexDirection: 'row',
    alignItems: 'flex-start',
    marginBottom: 16,
    gap: 12,
  },
  ingredientBullet: {
    width: 8,
    height: 8,
    borderRadius: 4,
    backgroundColor: mangiaColors.terracotta,
    marginTop: 8,
  },
  ingredientText: {
    flex: 1,
    fontFamily: 'System',
    fontSize: 18,
    color: mangiaColors.cream,
    lineHeight: 26,
  },
  ingredientQuantity: {
    fontWeight: '700',
  },
});
