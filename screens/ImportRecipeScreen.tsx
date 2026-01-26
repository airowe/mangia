import React, { useState, useCallback, useMemo } from "react";
import {
  View,
  ScrollView,
  KeyboardAvoidingView,
  Platform,
  Alert,
  Image,
  TouchableOpacity,
} from "react-native";
import {
  TextInput,
  Button,
  Text,
  IconButton,
  ActivityIndicator,
  Divider,
  Chip,
  List,
  ProgressBar,
  SegmentedButtons,
} from "react-native-paper";
import * as Clipboard from "expo-clipboard";
import { useNavigation } from "@react-navigation/native";
import { StackNavigationProp } from "@react-navigation/stack";
import { MaterialCommunityIcons } from "@expo/vector-icons";
import Animated, { FadeIn, FadeInDown } from "react-native-reanimated";

import { useTheme } from "../theme";
import {
  parseRecipeFromUrl,
  parseRecipeFromText,
  detectUrlType,
  UrlType,
} from "../lib/recipeParser";
import { ParsedRecipe, RecipeIngredient } from "../models/Recipe";
import { createRecipe } from "../lib/recipeService";
import { useRecipeLimit } from "../hooks/useRecipeLimit";

type RootStackParamList = {
  HomeScreen: undefined;
  ImportRecipeScreen: undefined;
  ManualEntryScreen: undefined;
  SubscriptionScreen: undefined;
};

type NavigationProp = StackNavigationProp<RootStackParamList>;

const PLATFORM_ICONS: Record<
  UrlType,
  { icon: string; label: string; color: string }
> = {
  tiktok: { icon: "music-note", label: "TikTok", color: "#000000" },
  youtube: { icon: "youtube", label: "YouTube", color: "#FF0000" },
  instagram: { icon: "instagram", label: "Instagram", color: "#E4405F" },
  blog: { icon: "web", label: "Blog", color: "#4CAF50" },
};

type InputMode = "url" | "text";

export const ImportRecipeScreen: React.FC = () => {
  const navigation = useNavigation<NavigationProp>();
  const { theme } = useTheme();
  const { colors, spacing, borderRadius, typography } = theme;

  const {
    importsUsed,
    importsRemaining,
    monthlyLimit,
    isLimitReached,
    isPremium,
    canImport,
    incrementUsage,
  } = useRecipeLimit();

  const [inputMode, setInputMode] = useState<InputMode>("url");
  const [url, setUrl] = useState("");
  const [manualText, setManualText] = useState("");
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [parsedRecipe, setParsedRecipe] = useState<ParsedRecipe | null>(null);
  const [editedTitle, setEditedTitle] = useState("");
  const [editedIngredients, setEditedIngredients] = useState<
    ParsedRecipe["ingredients"]
  >([]);
  const [detectedPlatform, setDetectedPlatform] = useState<UrlType | null>(
    null,
  );
  const [isSaving, setIsSaving] = useState(false);

  // Paste URL from clipboard
  const handlePaste = useCallback(async () => {
    try {
      const text = await Clipboard.getStringAsync();
      if (text) {
        setUrl(text);
        setError(null);
        // Auto-detect platform
        const platform = detectUrlType(text);
        setDetectedPlatform(platform);
      }
    } catch (err) {
      console.error("Failed to paste:", err);
    }
  }, []);

  // Paste text from clipboard (for manual text mode)
  const handlePasteText = useCallback(async () => {
    try {
      const text = await Clipboard.getStringAsync();
      if (text) {
        setManualText(text);
        setError(null);
      }
    } catch (err) {
      console.error("Failed to paste:", err);
    }
  }, []);

  // Import recipe from URL or text
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
        ],
      );
      return;
    }

    if (inputMode === "url") {
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
      setParsedRecipe(null);

      try {
        const platform = detectUrlType(url);
        setDetectedPlatform(platform);

        const recipe = await parseRecipeFromUrl(url);

        setParsedRecipe(recipe);
        setEditedTitle(recipe.title);
        setEditedIngredients(recipe.ingredients);
      } catch (err) {
        console.error("Import error:", err);
        setError(
          err instanceof Error ? err.message : "Failed to import recipe",
        );
      } finally {
        setIsLoading(false);
      }
    } else {
      // Text mode - parse from pasted text
      if (!manualText.trim()) {
        setError("Please paste some recipe text");
        return;
      }

      if (manualText.trim().length < 20) {
        setError("Please provide more recipe content to extract from");
        return;
      }

      setIsLoading(true);
      setError(null);
      setParsedRecipe(null);
      setDetectedPlatform(null); // No platform for pasted text

      try {
        const recipe = await parseRecipeFromText(manualText);

        setParsedRecipe(recipe);
        setEditedTitle(recipe.title);
        setEditedIngredients(recipe.ingredients);
      } catch (err) {
        console.error("Parse error:", err);
        setError(err instanceof Error ? err.message : "Failed to parse recipe");
      } finally {
        setIsLoading(false);
      }
    }
  }, [inputMode, url, manualText, canImport, monthlyLimit, navigation]);

  // Save recipe to database
  const handleSave = useCallback(async () => {
    if (!parsedRecipe) return;

    setIsSaving(true);

    try {
      // Determine source type based on input mode
      const sourceType =
        inputMode === "text" ? "manual" : detectedPlatform || "blog";
      const sourceUrl = inputMode === "text" ? undefined : url;

      // Prepare ingredients for API
      const ingredientData = editedIngredients.map((ing, index) => ({
        name: ing.name,
        quantity: parseFloat(ing.quantity) || 0,
        unit: ing.unit || "",
        display_order: index,
      }));

      // Create recipe with ingredients via API
      await createRecipe(
        {
          title: editedTitle || parsedRecipe.title,
          description: parsedRecipe.description,
          instructions: parsedRecipe.instructions,
          prep_time: parsedRecipe.prep_time,
          cook_time: parsedRecipe.cook_time,
          servings: parsedRecipe.servings,
          image_url: parsedRecipe.image_url,
          source_url: sourceUrl,
          source_type: sourceType,
          status: "want_to_cook",
        },
        ingredientData,
      );

      // Increment usage count for free users
      await incrementUsage();

      Alert.alert("Recipe Saved!", 'Added to your "Want to Cook" list', [
        { text: "OK", onPress: () => navigation.goBack() },
      ]);
    } catch (err) {
      console.error("Save error:", err);
      Alert.alert("Error", "Failed to save recipe. Please try again.");
    } finally {
      setIsSaving(false);
    }
  }, [
    parsedRecipe,
    editedTitle,
    editedIngredients,
    url,
    inputMode,
    detectedPlatform,
    navigation,
    incrementUsage,
  ]);

  // Navigate to manual entry
  const handleManualEntry = useCallback(() => {
    navigation.navigate("ManualEntryScreen");
  }, [navigation]);

  // Update ingredient
  const updateIngredient = useCallback(
    (index: number, field: keyof RecipeIngredient, value: string) => {
      setEditedIngredients((prev) => {
        const updated = [...prev];
        updated[index] = { ...updated[index], [field]: value };
        return updated;
      });
    },
    [],
  );

  // Remove ingredient
  const removeIngredient = useCallback((index: number) => {
    setEditedIngredients((prev) => prev.filter((_, i) => i !== index));
  }, []);

  // Add ingredient
  const addIngredient = useCallback(() => {
    setEditedIngredients((prev) => [
      ...prev,
      { name: "", quantity: "", unit: "" },
    ]);
  }, []);

  const styles = useMemo(
    () => ({
      container: {
        flex: 1,
        backgroundColor: colors.background,
      },
      scrollView: {
        flex: 1,
      },
      content: {
        padding: spacing.md,
        paddingBottom: spacing.xxl,
      },
      limitBanner: {
        flexDirection: "row" as const,
        alignItems: "center" as const,
        justifyContent: "space-between" as const,
        backgroundColor: colors.primaryLight,
        borderRadius: borderRadius.md,
        padding: spacing.sm,
        marginBottom: spacing.md,
      },
      limitBannerWarning: {
        backgroundColor: `${colors.error}15`,
      },
      limitInfo: {
        flex: 1,
        flexDirection: "row" as const,
        alignItems: "center" as const,
        gap: 10,
      },
      limitTextContainer: {
        flex: 1,
      },
      limitText: {
        ...typography.styles.body,
        color: colors.text,
        marginBottom: spacing.xs,
      },
      limitTextWarning: {
        color: colors.error,
      },
      progressBar: {
        height: 4,
        borderRadius: 2,
      },
      upgradeLink: {
        flexDirection: "row" as const,
        alignItems: "center" as const,
        marginLeft: spacing.sm,
      },
      upgradeLinkText: {
        ...typography.styles.body,
        fontWeight: "600" as const,
        color: colors.primary,
      },
      inputSection: {
        marginBottom: spacing.md,
      },
      modeToggle: {
        marginBottom: spacing.md,
      },
      label: {
        ...typography.styles.body,
        fontWeight: "600" as const,
        marginBottom: spacing.sm,
        color: colors.text,
      },
      urlInputContainer: {
        marginBottom: spacing.sm,
      },
      urlInput: {
        backgroundColor: colors.surface,
      },
      textInputContainer: {
        marginBottom: spacing.sm,
      },
      textInput: {
        backgroundColor: colors.surface,
        minHeight: 120,
      },
      platformChip: {
        flexDirection: "row" as const,
        marginBottom: spacing.sm,
      },
      hint: {
        ...typography.styles.body,
        color: colors.textSecondary,
        marginBottom: spacing.md,
        textAlign: "center" as const,
      },
      error: {
        color: colors.error,
        marginBottom: spacing.md,
        textAlign: "center" as const,
      },
      importButton: {
        marginBottom: spacing.md,
        paddingVertical: spacing.xs,
      },
      divider: {
        marginVertical: spacing.md,
      },
      manualButton: {
        borderColor: colors.primary,
      },
      loadingContainer: {
        alignItems: "center" as const,
        paddingVertical: spacing.xxl,
      },
      loadingText: {
        marginTop: spacing.md,
        color: colors.textSecondary,
      },
      previewSection: {
        marginTop: spacing.sm,
      },
      recipeImage: {
        width: "100%" as const,
        height: 200,
        borderRadius: borderRadius.md,
        marginBottom: spacing.md,
        backgroundColor: colors.surface,
      },
      titleInput: {
        marginBottom: spacing.sm,
        backgroundColor: colors.surface,
      },
      metadataRow: {
        flexDirection: "row" as const,
        flexWrap: "wrap" as const,
        gap: spacing.sm,
        marginBottom: spacing.md,
      },
      metaChip: {
        backgroundColor: colors.surface,
      },
      ingredientsSection: {
        marginBottom: spacing.md,
      },
      sectionHeader: {
        flexDirection: "row" as const,
        justifyContent: "space-between" as const,
        alignItems: "center" as const,
        marginBottom: spacing.sm,
      },
      sectionTitle: {
        ...typography.styles.headline,
        color: colors.text,
      },
      ingredientRow: {
        flexDirection: "row" as const,
        alignItems: "center" as const,
        marginBottom: spacing.sm,
        gap: spacing.xs,
      },
      qtyInput: {
        width: 60,
        backgroundColor: colors.surface,
      },
      unitInput: {
        width: 70,
        backgroundColor: colors.surface,
      },
      nameInput: {
        flex: 1,
        backgroundColor: colors.surface,
      },
      instructionsSection: {
        marginBottom: spacing.xl,
      },
      instructionItem: {
        paddingVertical: spacing.xs,
      },
      stepNumber: {
        width: 24,
        height: 24,
        borderRadius: 12,
        backgroundColor: colors.primary,
        justifyContent: "center" as const,
        alignItems: "center" as const,
        marginRight: spacing.sm,
      },
      stepNumberText: {
        color: colors.textOnPrimary,
        fontWeight: "600" as const,
        fontSize: 12,
      },
      actionButtons: {
        flexDirection: "row" as const,
        gap: spacing.sm,
      },
      cancelButton: {
        flex: 1,
      },
      saveButton: {
        flex: 2,
      },
    }),
    [colors, spacing, borderRadius, typography]
  );

  return (
    <KeyboardAvoidingView
      style={styles.container}
      behavior={Platform.OS === "ios" ? "padding" : "height"}
    >
      <ScrollView
        style={styles.scrollView}
        contentContainerStyle={styles.content}
        keyboardShouldPersistTaps="handled"
      >
        {/* Import Limit Banner (for free users) */}
        {!isPremium && !parsedRecipe && (
          <Animated.View entering={FadeIn.duration(400)}>
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
                  color={isLimitReached ? colors.error : colors.primary}
                />
                <View style={styles.limitTextContainer}>
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
                  <ProgressBar
                    progress={importsUsed / monthlyLimit}
                    color={isLimitReached ? colors.error : colors.primary}
                    style={styles.progressBar}
                  />
                </View>
              </View>
              <View style={styles.upgradeLink}>
                <Text style={styles.upgradeLinkText}>Upgrade</Text>
                <MaterialCommunityIcons
                  name="chevron-right"
                  size={16}
                  color={colors.primary}
                />
              </View>
            </TouchableOpacity>
          </Animated.View>
        )}

        {/* Input Mode Toggle & Section */}
        {!parsedRecipe && (
          <Animated.View entering={FadeInDown.delay(100).duration(400)} style={styles.inputSection}>
            {/* Mode Selector */}
            <SegmentedButtons
              value={inputMode}
              onValueChange={(value) => {
                setInputMode(value as InputMode);
                setError(null);
              }}
              buttons={[
                {
                  value: "url",
                  label: "From URL",
                  icon: "link",
                },
                {
                  value: "text",
                  label: "Paste Text",
                  icon: "text-box",
                },
              ]}
              style={styles.modeToggle}
            />

            {/* URL Input Mode */}
            {inputMode === "url" && (
              <>
                <Text style={styles.label}>Paste recipe URL</Text>
                <View style={styles.urlInputContainer}>
                  <TextInput
                    mode="outlined"
                    value={url}
                    onChangeText={(text) => {
                      setUrl(text);
                      setError(null);
                      if (text) setDetectedPlatform(detectUrlType(text));
                    }}
                    placeholder="https://tiktok.com/..."
                    style={styles.urlInput}
                    autoCapitalize="none"
                    autoCorrect={false}
                    keyboardType="url"
                    right={
                      <TextInput.Icon
                        icon="content-paste"
                        onPress={handlePaste}
                      />
                    }
                  />
                </View>

                {/* Platform detection chip */}
                {detectedPlatform && url && (
                  <View style={styles.platformChip}>
                    <Chip
                      icon={PLATFORM_ICONS[detectedPlatform].icon}
                      style={{
                        backgroundColor:
                          PLATFORM_ICONS[detectedPlatform].color + "20",
                      }}
                    >
                      {PLATFORM_ICONS[detectedPlatform].label}
                    </Chip>
                  </View>
                )}

                <Text style={styles.hint}>
                  Works with TikTok, YouTube, Instagram, and recipe blogs
                </Text>
              </>
            )}

            {/* Text Paste Mode */}
            {inputMode === "text" && (
              <>
                <Text style={styles.label}>Paste recipe text</Text>
                <View style={styles.textInputContainer}>
                  <TextInput
                    mode="outlined"
                    value={manualText}
                    onChangeText={(text) => {
                      setManualText(text);
                      setError(null);
                    }}
                    placeholder="Paste video caption, recipe description, or ingredients list..."
                    style={styles.textInput}
                    multiline
                    numberOfLines={6}
                    right={
                      <TextInput.Icon
                        icon="content-paste"
                        onPress={handlePasteText}
                      />
                    }
                  />
                </View>

                <Text style={styles.hint}>
                  Paste video captions, descriptions, or any text containing a
                  recipe. Our AI will extract the ingredients and instructions.
                </Text>
              </>
            )}

            {error && <Text style={styles.error}>{error}</Text>}

            <Button
              mode="contained"
              onPress={handleImport}
              loading={isLoading}
              disabled={
                isLoading ||
                (inputMode === "url" ? !url.trim() : !manualText.trim())
              }
              style={styles.importButton}
              icon={inputMode === "url" ? "download" : "auto-fix"}
            >
              {inputMode === "url" ? "Import Recipe" : "Extract Recipe"}
            </Button>

            <Divider style={styles.divider} />

            <Button
              mode="outlined"
              onPress={handleManualEntry}
              style={styles.manualButton}
              icon="pencil"
            >
              Enter Recipe Manually
            </Button>
          </Animated.View>
        )}

        {/* Loading State */}
        {isLoading && (
          <View style={styles.loadingContainer}>
            <ActivityIndicator size="large" color={colors.primary} />
            <Text style={styles.loadingText}>
              Extracting recipe from {detectedPlatform || "URL"}...
            </Text>
          </View>
        )}

        {/* Recipe Preview */}
        {parsedRecipe && !isLoading && (
          <Animated.View entering={FadeIn.duration(400)} style={styles.previewSection}>
            <Text style={styles.sectionTitle}>Recipe Preview</Text>

            {/* Image */}
            {parsedRecipe.image_url && (
              <Image
                source={{ uri: parsedRecipe.image_url }}
                style={styles.recipeImage}
                resizeMode="cover"
              />
            )}

            {/* Title (editable) */}
            <TextInput
              mode="outlined"
              label="Recipe Title"
              value={editedTitle}
              onChangeText={setEditedTitle}
              style={styles.titleInput}
            />

            {/* Metadata */}
            <View style={styles.metadataRow}>
              {parsedRecipe.prep_time && (
                <Chip icon="clock-outline" style={styles.metaChip}>
                  Prep: {parsedRecipe.prep_time} min
                </Chip>
              )}
              {parsedRecipe.cook_time && (
                <Chip icon="fire" style={styles.metaChip}>
                  Cook: {parsedRecipe.cook_time} min
                </Chip>
              )}
              {parsedRecipe.servings && (
                <Chip icon="account-group" style={styles.metaChip}>
                  Serves {parsedRecipe.servings}
                </Chip>
              )}
            </View>

            {/* Ingredients (editable) */}
            <View style={styles.ingredientsSection}>
              <View style={styles.sectionHeader}>
                <Text style={styles.sectionTitle}>Ingredients</Text>
                <IconButton icon="plus" size={20} onPress={addIngredient} />
              </View>

              {editedIngredients.map((ingredient, index) => (
                <Animated.View
                  key={index}
                  entering={FadeInDown.delay(index * 30).duration(300)}
                  style={styles.ingredientRow}
                >
                  <TextInput
                    mode="outlined"
                    value={ingredient.quantity}
                    onChangeText={(v) => updateIngredient(index, "quantity", v)}
                    placeholder="Qty"
                    style={styles.qtyInput}
                    keyboardType="numeric"
                    dense
                  />
                  <TextInput
                    mode="outlined"
                    value={ingredient.unit}
                    onChangeText={(v) => updateIngredient(index, "unit", v)}
                    placeholder="Unit"
                    style={styles.unitInput}
                    dense
                  />
                  <TextInput
                    mode="outlined"
                    value={ingredient.name}
                    onChangeText={(v) => updateIngredient(index, "name", v)}
                    placeholder="Ingredient"
                    style={styles.nameInput}
                    dense
                  />
                  <IconButton
                    icon="close"
                    size={18}
                    onPress={() => removeIngredient(index)}
                  />
                </Animated.View>
              ))}
            </View>

            {/* Instructions preview */}
            {parsedRecipe.instructions.length > 0 && (
              <View style={styles.instructionsSection}>
                <Text style={styles.sectionTitle}>Instructions</Text>
                {parsedRecipe.instructions.map((step, index) => (
                  <List.Item
                    key={index}
                    title={step}
                    titleNumberOfLines={5}
                    left={() => (
                      <View style={styles.stepNumber}>
                        <Text style={styles.stepNumberText}>{index + 1}</Text>
                      </View>
                    )}
                    style={styles.instructionItem}
                  />
                ))}
              </View>
            )}

            {/* Action buttons */}
            <View style={styles.actionButtons}>
              <Button
                mode="outlined"
                onPress={() => {
                  setParsedRecipe(null);
                  setUrl("");
                  setError(null);
                }}
                style={styles.cancelButton}
              >
                Start Over
              </Button>
              <Button
                mode="contained"
                onPress={handleSave}
                loading={isSaving}
                disabled={isSaving}
                style={styles.saveButton}
                icon="check"
              >
                Save to Queue
              </Button>
            </View>
          </Animated.View>
        )}
      </ScrollView>
    </KeyboardAvoidingView>
  );
};

export default ImportRecipeScreen;
