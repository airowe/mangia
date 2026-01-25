import React, { useState, useCallback } from "react";
import {
  View,
  StyleSheet,
  ScrollView,
  KeyboardAvoidingView,
  Platform,
  Alert,
  Image,
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
} from "react-native-paper";
import * as Clipboard from "expo-clipboard";
import { useNavigation } from "@react-navigation/native";
import { StackNavigationProp } from "@react-navigation/stack";

import { colors } from "../theme/colors";
import {
  parseRecipeFromUrl,
  parseRecipeFromText,
  detectUrlType,
  UrlType,
} from "../lib/recipeParser";
import { ParsedRecipe, RecipeIngredient } from "../models/Recipe";
import { supabase } from "../lib/supabase";

type RootStackParamList = {
  HomeScreen: undefined;
  ImportRecipeScreen: undefined;
  ManualEntryScreen: undefined;
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

export const ImportRecipeScreen: React.FC = () => {
  const navigation = useNavigation<NavigationProp>();

  const [url, setUrl] = useState("");
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

  // Paste from clipboard
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

  // Import recipe from URL
  const handleImport = useCallback(async () => {
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
      setError(err instanceof Error ? err.message : "Failed to import recipe");
    } finally {
      setIsLoading(false);
    }
  }, [url]);

  // Save recipe to database
  const handleSave = useCallback(async () => {
    if (!parsedRecipe) return;

    setIsSaving(true);

    try {
      const {
        data: { user },
      } = await supabase.auth.getUser();
      if (!user) {
        Alert.alert("Error", "Please sign in to save recipes");
        return;
      }

      // Create recipe with ingredients
      const { data: recipe, error: recipeError } = await supabase
        .from("recipes")
        .insert({
          user_id: user.id,
          title: editedTitle || parsedRecipe.title,
          description: parsedRecipe.description,
          instructions: parsedRecipe.instructions,
          prep_time: parsedRecipe.prep_time,
          cook_time: parsedRecipe.cook_time,
          servings: parsedRecipe.servings,
          image_url: parsedRecipe.image_url,
          source_url: url,
          source_type: detectedPlatform || "blog",
          status: "want_to_cook",
        })
        .select()
        .single();

      if (recipeError) throw recipeError;

      // Add ingredients
      if (editedIngredients.length > 0) {
        const ingredientRows = editedIngredients.map((ing, index) => ({
          recipe_id: recipe.id,
          name: ing.name,
          quantity: parseFloat(ing.quantity) || null,
          unit: ing.unit || null,
          display_order: index,
        }));

        const { error: ingredientError } = await supabase
          .from("recipe_ingredients")
          .insert(ingredientRows);

        if (ingredientError) throw ingredientError;
      }

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
    detectedPlatform,
    navigation,
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
        {/* URL Input Section */}
        {!parsedRecipe && (
          <View style={styles.inputSection}>
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
                  <TextInput.Icon icon="content-paste" onPress={handlePaste} />
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

            {error && <Text style={styles.error}>{error}</Text>}

            <Button
              mode="contained"
              onPress={handleImport}
              loading={isLoading}
              disabled={isLoading || !url.trim()}
              style={styles.importButton}
              icon="download"
            >
              Import Recipe
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
          </View>
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
          <View style={styles.previewSection}>
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
                <View key={index} style={styles.ingredientRow}>
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
                </View>
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
          </View>
        )}
      </ScrollView>
    </KeyboardAvoidingView>
  );
};

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: colors.background,
  },
  scrollView: {
    flex: 1,
  },
  content: {
    padding: 16,
    paddingBottom: 32,
  },
  inputSection: {
    marginBottom: 16,
  },
  label: {
    fontSize: 16,
    fontWeight: "600",
    marginBottom: 8,
    color: colors.text,
  },
  urlInputContainer: {
    marginBottom: 8,
  },
  urlInput: {
    backgroundColor: colors.surface,
  },
  platformChip: {
    flexDirection: "row",
    marginBottom: 8,
  },
  hint: {
    fontSize: 14,
    color: colors.textSecondary,
    marginBottom: 16,
    textAlign: "center",
  },
  error: {
    color: colors.error,
    marginBottom: 16,
    textAlign: "center",
  },
  importButton: {
    marginBottom: 16,
    paddingVertical: 4,
  },
  divider: {
    marginVertical: 16,
  },
  manualButton: {
    borderColor: colors.primary,
  },
  loadingContainer: {
    alignItems: "center",
    paddingVertical: 32,
  },
  loadingText: {
    marginTop: 16,
    color: colors.textSecondary,
  },
  previewSection: {
    marginTop: 8,
  },
  recipeImage: {
    width: "100%",
    height: 200,
    borderRadius: 12,
    marginBottom: 16,
    backgroundColor: colors.surface,
  },
  titleInput: {
    marginBottom: 12,
    backgroundColor: colors.surface,
  },
  metadataRow: {
    flexDirection: "row",
    flexWrap: "wrap",
    gap: 8,
    marginBottom: 16,
  },
  metaChip: {
    backgroundColor: colors.surface,
  },
  ingredientsSection: {
    marginBottom: 16,
  },
  sectionHeader: {
    flexDirection: "row",
    justifyContent: "space-between",
    alignItems: "center",
    marginBottom: 8,
  },
  sectionTitle: {
    fontSize: 18,
    fontWeight: "600",
    color: colors.text,
  },
  ingredientRow: {
    flexDirection: "row",
    alignItems: "center",
    marginBottom: 8,
    gap: 4,
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
    marginBottom: 24,
  },
  instructionItem: {
    paddingVertical: 4,
  },
  stepNumber: {
    width: 24,
    height: 24,
    borderRadius: 12,
    backgroundColor: colors.primary,
    justifyContent: "center",
    alignItems: "center",
    marginRight: 8,
  },
  stepNumberText: {
    color: "#fff",
    fontWeight: "600",
    fontSize: 12,
  },
  actionButtons: {
    flexDirection: "row",
    gap: 12,
  },
  cancelButton: {
    flex: 1,
  },
  saveButton: {
    flex: 2,
  },
});

export default ImportRecipeScreen;
