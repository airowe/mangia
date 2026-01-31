import React, { useState, useCallback, useMemo, useEffect } from "react";
import {
  View,
  ScrollView,
  KeyboardAvoidingView,
  Platform,
  Alert,
  TouchableOpacity,
  TextInput,
  Dimensions,
  StyleSheet,
  Text,
} from "react-native";
import { Image } from "expo-image";
import * as Clipboard from "expo-clipboard";
import { useNavigation, useRoute, RouteProp } from "@react-navigation/native";
import { StackNavigationProp } from "@react-navigation/stack";
import { MaterialCommunityIcons } from "@expo/vector-icons";
import Animated, {
  FadeIn,
  FadeInDown,
  FadeInRight,
} from "react-native-reanimated";
import { useSafeAreaInsets } from "react-native-safe-area-context";

import { useTheme } from "../theme";
import { mangiaColors } from "../theme/tokens/colors";
import { fontFamily, editorialTextStyles } from "../theme/tokens/typography";
import { Recipe } from "../models/Recipe";
import { importRecipeFromUrl, getRecentRecipes } from "../lib/recipeService";
import { useRecipeLimit } from "../hooks/useRecipeLimit";

type RootStackParamList = {
  HomeScreen: undefined;
  ImportRecipeScreen: { sharedUrl?: string } | undefined;
  ManualEntryScreen: undefined;
  SubscriptionScreen: undefined;
  RecipeDetailScreen: { recipeId: string };
};

type NavigationProp = StackNavigationProp<RootStackParamList>;

const { width: SCREEN_WIDTH } = Dimensions.get("window");
const CARD_WIDTH = 160;
const CARD_HEIGHT = (CARD_WIDTH * 4) / 3; // 3:4 aspect ratio

export const ImportRecipeScreen: React.FC = () => {
  const navigation = useNavigation<NavigationProp>();
  const route = useRoute<RouteProp<RootStackParamList, "ImportRecipeScreen">>();
  const insets = useSafeAreaInsets();
  const { theme } = useTheme();
  const { colors, spacing } = theme;

  const {
    importsUsed,
    importsRemaining,
    monthlyLimit,
    isLimitReached,
    isPremium,
    canImport,
    incrementUsage,
  } = useRecipeLimit();

  const [url, setUrl] = useState("");
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [recentRecipes, setRecentRecipes] = useState<Recipe[]>([]);
  const [isFocused, setIsFocused] = useState(false);

  // Pre-fill URL from share extension
  const sharedUrl = route.params?.sharedUrl;
  useEffect(() => {
    if (sharedUrl) {
      setUrl(sharedUrl);
    }
  }, [sharedUrl]);

  // Load recently added recipes
  useEffect(() => {
    loadRecentRecipes();
  }, []);

  const loadRecentRecipes = async () => {
    try {
      const recipes = await getRecentRecipes(5);
      setRecentRecipes(recipes);
    } catch (err) {
      console.error("Failed to load recent recipes:", err);
    }
  };

  // Paste URL from clipboard
  const handlePaste = useCallback(async () => {
    try {
      const text = await Clipboard.getStringAsync();
      if (text) {
        setUrl(text);
        setError(null);
      }
    } catch (err) {
      console.error("Failed to paste:", err);
    }
  }, []);

  // Import recipe from URL
  const handleImport = useCallback(async () => {
    // Check import limit for free users
    if (!canImport()) {
      Alert.alert(
        "Import Limit Reached",
        `You've used all ${monthlyLimit} free imports this month. Upgrade to Premium for unlimited imports!`,
        [
          { text: "Maybe Later", style: "cancel" },
          {
            text: "Upgrade",
            onPress: () => navigation.navigate("SubscriptionScreen"),
          },
        ]
      );
      return;
    }

    if (!url.trim()) {
      setError("Please enter a URL");
      return;
    }

    // Basic URL validation
    if (!url.startsWith("http://") && !url.startsWith("https://")) {
      setError("Please enter a valid URL starting with http:// or https://");
      return;
    }

    setIsLoading(true);
    setError(null);

    try {
      // Server handles parsing, AI extraction, and DB insert in one call
      await importRecipeFromUrl(url);

      // Increment local usage count for free users
      await incrementUsage();

      Alert.alert("Recipe Saved!", 'Added to your "Want to Cook" list', [
        { text: "OK", onPress: () => navigation.goBack() },
      ]);
    } catch (err) {
      console.error("Import error:", err);
      setError(err instanceof Error ? err.message : "Failed to import recipe");
    } finally {
      setIsLoading(false);
    }
  }, [url, canImport, monthlyLimit, navigation, incrementUsage]);

  // Navigate to manual entry
  const handleManualEntry = useCallback(() => {
    navigation.navigate("ManualEntryScreen");
  }, [navigation]);

  // Navigate to recipe detail
  const handleRecipePress = useCallback(
    (recipe: Recipe) => {
      navigation.navigate("RecipeDetailScreen", { recipeId: recipe.id });
    },
    [navigation]
  );

  return (
    <View style={styles.container}>
      <KeyboardAvoidingView
        style={styles.flex}
        behavior={Platform.OS === "ios" ? "padding" : "height"}
      >
        {/* Header */}
        <View style={[styles.header, { paddingTop: insets.top + 8 }]}>
          <TouchableOpacity
            style={styles.backButton}
            onPress={() => navigation.goBack()}
          >
            <MaterialCommunityIcons
              name="arrow-left"
              size={28}
              color={mangiaColors.dark}
            />
          </TouchableOpacity>
          <TouchableOpacity onPress={() => navigation.goBack()}>
            <Text style={styles.cancelText}>Cancel</Text>
          </TouchableOpacity>
        </View>

        <ScrollView
          style={styles.flex}
          contentContainerStyle={styles.scrollContent}
          keyboardShouldPersistTaps="handled"
          showsVerticalScrollIndicator={false}
        >
          {/* Headline Section */}
          <Animated.View
            entering={FadeInDown.delay(100).duration(400)}
            style={styles.headlineSection}
          >
            <Text style={styles.headline}>Import a Recipe</Text>
            <Text style={styles.subtitle}>
              Save recipes instantly from your favorite creators on TikTok,
              YouTube, or food blogs.
            </Text>
          </Animated.View>

          {/* URL Input Section */}
          <Animated.View
            entering={FadeInDown.delay(200).duration(400)}
            style={styles.inputSection}
          >
            <View
              style={[
                styles.inputContainer,
                isFocused && styles.inputContainerFocused,
              ]}
            >
              <TextInput
                style={styles.urlInput}
                value={url}
                onChangeText={(text) => {
                  setUrl(text);
                  setError(null);
                }}
                placeholder="https://..."
                placeholderTextColor={mangiaColors.taupe}
                autoCapitalize="none"
                autoCorrect={false}
                keyboardType="url"
                onFocus={() => setIsFocused(true)}
                onBlur={() => setIsFocused(false)}
              />
              <MaterialCommunityIcons
                name="link"
                size={28}
                color={isFocused ? mangiaColors.terracotta : mangiaColors.taupe}
              />
            </View>

            {error && <Text style={styles.errorText}>{error}</Text>}
          </Animated.View>

          {/* Paste Button */}
          <Animated.View entering={FadeInDown.delay(300).duration(400)}>
            <TouchableOpacity
              style={styles.pasteButton}
              onPress={handlePaste}
              activeOpacity={0.85}
            >
              <MaterialCommunityIcons
                name="content-paste"
                size={24}
                color={mangiaColors.white}
              />
              <Text style={styles.pasteButtonText}>Paste from Clipboard</Text>
            </TouchableOpacity>
          </Animated.View>

          {/* Import Button (shown when URL is entered) */}
          {url.trim() && (
            <Animated.View entering={FadeIn.duration(300)}>
              <TouchableOpacity
                style={[
                  styles.importButton,
                  isLoading && styles.importButtonDisabled,
                ]}
                onPress={handleImport}
                disabled={isLoading}
                activeOpacity={0.85}
              >
                {isLoading ? (
                  <Text style={styles.importButtonText}>Importing...</Text>
                ) : (
                  <>
                    <MaterialCommunityIcons
                      name="download"
                      size={24}
                      color={mangiaColors.terracotta}
                    />
                    <Text style={styles.importButtonTextOutline}>
                      Import Recipe
                    </Text>
                  </>
                )}
              </TouchableOpacity>
            </Animated.View>
          )}

          {/* Recently Added Section */}
          {recentRecipes.length > 0 && (
            <Animated.View
              entering={FadeInDown.delay(400).duration(400)}
              style={styles.recentSection}
            >
              <View style={styles.recentHeader}>
                <Text style={styles.recentTitle}>Recently Added</Text>
                <TouchableOpacity>
                  <Text style={styles.viewAllText}>View all</Text>
                </TouchableOpacity>
              </View>

              <ScrollView
                horizontal
                showsHorizontalScrollIndicator={false}
                contentContainerStyle={styles.recentScroll}
              >
                {recentRecipes.map((recipe, index) => (
                  <Animated.View
                    key={recipe.id}
                    entering={FadeInRight.delay(500 + index * 100).duration(400)}
                  >
                    <TouchableOpacity
                      style={styles.recipeCard}
                      onPress={() => handleRecipePress(recipe)}
                      activeOpacity={0.85}
                    >
                      <View style={styles.recipeImageContainer}>
                        {recipe.imageUrl ? (
                          <Image
                            source={{ uri: recipe.imageUrl }}
                            style={styles.recipeImage}
                            contentFit="cover"
                          />
                        ) : (
                          <View style={styles.placeholderImage}>
                            <MaterialCommunityIcons
                              name="food"
                              size={40}
                              color={mangiaColors.taupe}
                            />
                          </View>
                        )}
                        <View style={styles.imageOverlay} />
                      </View>
                      <Text style={styles.recipeTitle} numberOfLines={2}>
                        {recipe.title}
                      </Text>
                    </TouchableOpacity>
                  </Animated.View>
                ))}

                {/* Browse Gallery Card */}
                <TouchableOpacity
                  style={styles.browseCard}
                  onPress={handleManualEntry}
                  activeOpacity={0.85}
                >
                  <View style={styles.browseContent}>
                    <MaterialCommunityIcons
                      name="image-plus"
                      size={40}
                      color={mangiaColors.brown}
                    />
                    <Text style={styles.browseText}>Browse Gallery</Text>
                  </View>
                  <Text style={styles.browseSubtext}>Upload Image</Text>
                </TouchableOpacity>
              </ScrollView>
            </Animated.View>
          )}

          {/* Import Limit Info for free users */}
          {!isPremium && (
            <Animated.View
              entering={FadeInDown.delay(600).duration(400)}
              style={styles.limitSection}
            >
              <TouchableOpacity
                style={[
                  styles.limitBanner,
                  isLimitReached && styles.limitBannerWarning,
                ]}
                onPress={() => navigation.navigate("SubscriptionScreen")}
              >
                <View style={styles.limitInfo}>
                  <MaterialCommunityIcons
                    name={isLimitReached ? "alert-circle" : "information"}
                    size={20}
                    color={
                      isLimitReached
                        ? mangiaColors.terracotta
                        : mangiaColors.brown
                    }
                  />
                  <Text
                    style={[
                      styles.limitText,
                      isLimitReached && styles.limitTextWarning,
                    ]}
                  >
                    {isLimitReached
                      ? "Monthly limit reached"
                      : `${importsRemaining} of ${monthlyLimit} free imports left`}
                  </Text>
                </View>
                <View style={styles.upgradeLink}>
                  <Text style={styles.upgradeLinkText}>Upgrade</Text>
                  <MaterialCommunityIcons
                    name="chevron-right"
                    size={16}
                    color={mangiaColors.terracotta}
                  />
                </View>
              </TouchableOpacity>
            </Animated.View>
          )}
        </ScrollView>
      </KeyboardAvoidingView>
    </View>
  );
};

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: mangiaColors.cream,
  },
  flex: {
    flex: 1,
  },
  header: {
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "space-between",
    paddingHorizontal: 16,
    paddingBottom: 8,
  },
  backButton: {
    width: 48,
    height: 48,
    borderRadius: 24,
    justifyContent: "center",
    alignItems: "center",
  },
  cancelText: {
    fontFamily: fontFamily.semibold,
    fontSize: 17,
    fontWeight: "600",
    color: mangiaColors.brown,
    letterSpacing: 0.5,
  },
  scrollContent: {
    paddingHorizontal: 24,
    paddingBottom: 120,
  },
  headlineSection: {
    marginBottom: 32,
  },
  headline: {
    fontFamily: fontFamily.serif,
    fontSize: 48,
    fontWeight: "300",
    fontStyle: "italic",
    color: mangiaColors.dark,
    letterSpacing: -0.5,
    marginBottom: 12,
  },
  subtitle: {
    fontFamily: fontFamily.regular,
    fontSize: 18,
    lineHeight: 26,
    color: mangiaColors.brown,
    maxWidth: 320,
  },
  inputSection: {
    marginBottom: 24,
  },
  inputContainer: {
    flexDirection: "row",
    alignItems: "center",
    borderBottomWidth: 2,
    borderBottomColor: mangiaColors.taupe,
    paddingBottom: 12,
  },
  inputContainerFocused: {
    borderBottomColor: mangiaColors.terracotta,
  },
  urlInput: {
    flex: 1,
    fontFamily: fontFamily.regular,
    fontSize: 28,
    color: mangiaColors.dark,
    padding: 0,
  },
  errorText: {
    fontFamily: fontFamily.regular,
    fontSize: 14,
    color: "#D32F2F",
    marginTop: 8,
  },
  pasteButton: {
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "center",
    backgroundColor: mangiaColors.terracotta,
    borderRadius: 28,
    height: 56,
    gap: 8,
    shadowColor: mangiaColors.terracotta,
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.3,
    shadowRadius: 8,
    elevation: 4,
    marginBottom: 16,
  },
  pasteButtonText: {
    fontFamily: fontFamily.bold,
    fontSize: 17,
    fontWeight: "700",
    color: mangiaColors.white,
    letterSpacing: 0.5,
  },
  importButton: {
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "center",
    backgroundColor: "transparent",
    borderWidth: 2,
    borderColor: mangiaColors.terracotta,
    borderRadius: 28,
    height: 56,
    gap: 8,
    marginBottom: 16,
  },
  importButtonDisabled: {
    opacity: 0.6,
  },
  importButtonText: {
    fontFamily: fontFamily.bold,
    fontSize: 17,
    fontWeight: "700",
    color: mangiaColors.white,
    letterSpacing: 0.5,
  },
  importButtonTextOutline: {
    fontFamily: fontFamily.bold,
    fontSize: 17,
    fontWeight: "700",
    color: mangiaColors.terracotta,
    letterSpacing: 0.5,
  },
  recentSection: {
    marginTop: 24,
  },
  recentHeader: {
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "space-between",
    marginBottom: 16,
  },
  recentTitle: {
    fontFamily: fontFamily.bold,
    fontSize: 12,
    fontWeight: "700",
    color: mangiaColors.brown,
    letterSpacing: 2,
    textTransform: "uppercase",
  },
  viewAllText: {
    fontFamily: fontFamily.medium,
    fontSize: 14,
    fontWeight: "500",
    color: mangiaColors.terracotta,
  },
  recentScroll: {
    paddingRight: 24,
    gap: 20,
  },
  recipeCard: {
    width: CARD_WIDTH,
  },
  recipeImageContainer: {
    width: CARD_WIDTH,
    height: CARD_HEIGHT,
    borderRadius: 16,
    overflow: "hidden",
    backgroundColor: mangiaColors.creamDark,
    marginBottom: 12,
  },
  recipeImage: {
    width: "100%",
    height: "100%",
  },
  placeholderImage: {
    width: "100%",
    height: "100%",
    justifyContent: "center",
    alignItems: "center",
    backgroundColor: mangiaColors.creamDark,
  },
  imageOverlay: {
    ...StyleSheet.absoluteFillObject,
    backgroundColor: "rgba(0,0,0,0.15)",
  },
  recipeTitle: {
    fontFamily: fontFamily.serif,
    fontSize: 18,
    fontWeight: "500",
    fontStyle: "italic",
    color: mangiaColors.dark,
    lineHeight: 22,
  },
  browseCard: {
    width: CARD_WIDTH,
  },
  browseContent: {
    width: CARD_WIDTH,
    height: CARD_HEIGHT,
    borderRadius: 16,
    borderWidth: 2,
    borderStyle: "dashed",
    borderColor: mangiaColors.taupe,
    backgroundColor: mangiaColors.white,
    justifyContent: "center",
    alignItems: "center",
    marginBottom: 12,
    gap: 8,
  },
  browseText: {
    fontFamily: fontFamily.bold,
    fontSize: 12,
    fontWeight: "700",
    color: mangiaColors.brown,
    letterSpacing: 1,
    textTransform: "uppercase",
  },
  browseSubtext: {
    fontFamily: fontFamily.serif,
    fontSize: 18,
    fontWeight: "500",
    fontStyle: "italic",
    color: mangiaColors.dark,
    opacity: 0.5,
    lineHeight: 22,
  },
  limitSection: {
    marginTop: 32,
  },
  limitBanner: {
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "space-between",
    backgroundColor: mangiaColors.creamDark,
    borderRadius: 12,
    padding: 16,
  },
  limitBannerWarning: {
    backgroundColor: `${mangiaColors.terracotta}15`,
  },
  limitInfo: {
    flexDirection: "row",
    alignItems: "center",
    gap: 10,
    flex: 1,
  },
  limitText: {
    fontFamily: fontFamily.regular,
    fontSize: 14,
    color: mangiaColors.dark,
  },
  limitTextWarning: {
    color: mangiaColors.terracotta,
  },
  upgradeLink: {
    flexDirection: "row",
    alignItems: "center",
    marginLeft: 12,
  },
  upgradeLinkText: {
    fontFamily: fontFamily.semibold,
    fontSize: 14,
    fontWeight: "600",
    color: mangiaColors.terracotta,
  },
});

export default ImportRecipeScreen;
