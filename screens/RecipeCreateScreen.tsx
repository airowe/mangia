import React, { useState, useMemo } from "react";
import {
  View,
  Text,
  TextInput,
  TouchableOpacity,
  ScrollView,
  KeyboardAvoidingView,
  Platform,
  Alert,
} from "react-native";
import { Ionicons } from "@expo/vector-icons";
import Animated, { FadeIn, FadeInDown } from "react-native-reanimated";
import { addRecipe } from "../lib/recipes";
import { RecipeIngredient } from "../models/Recipe";
import { Screen } from "../components/Screen";
import { useTheme } from "../theme";
import { extractRecipeFromUrl, mapToRecipeFormat } from "../lib/firecrawl";
import { Button } from "react-native-paper";

const apiKey = process.env.EXPO_PUBLIC_FIRECRAWL_API_KEY;

export default function RecipeCreateScreen({ navigation }: any) {
  const { theme } = useTheme();
  const { colors, spacing, borderRadius, typography } = theme;

  const [title, setTitle] = useState("");
  const [instructions, setInstructions] = useState<string[]>([]);
  const [ingredients, setIngredients] = useState<RecipeIngredient[]>([]);
  const [currentName, setCurrentName] = useState("");
  const [currentQuantity, setCurrentQuantity] = useState("");
  const [currentUnit, setCurrentUnit] = useState("");
  const [importUrl, setImportUrl] = useState("");
  const [isImporting, setIsImporting] = useState(false);

  if (!apiKey) {
    Alert.alert("Error", "No API key found");
    return;
  }

  const handleImportRecipe = async () => {
    if (!importUrl.trim()) {
      Alert.alert("Error", "Please enter a valid URL");
      return;
    }

    try {
      setIsImporting(true);
      const recipeData = await extractRecipeFromUrl(importUrl, apiKey);
      const mappedRecipe = mapToRecipeFormat(recipeData);

      setTitle(mappedRecipe.title);
      setInstructions(mappedRecipe.instructions);

      const formattedIngredients: RecipeIngredient[] =
        mappedRecipe.ingredients.map((ing) => ({
          id: Date.now().toString() + Math.random().toString(36).substr(2, 9),
          name: ing.name,
          quantity: 0,
          unit: "",
          recipe_id: "",
        }));

      setIngredients(formattedIngredients);

      Alert.alert("Success", "Recipe imported successfully!");
    } catch (error) {
      console.error("Error importing recipe:", error);
      Alert.alert(
        "Error",
        "Failed to import recipe. Please check the URL and try again."
      );
    } finally {
      setIsImporting(false);
    }
  };

  const addIngredient = () => {
    if (currentName.trim()) {
      setIngredients([
        ...ingredients,
        {
          id: Date.now().toString() + Math.random().toString(36).substr(2, 9),
          name: currentName,
          quantity: parseFloat(currentQuantity) || 0,
          unit: currentUnit,
          recipe_id: "",
        },
      ]);
      setCurrentName("");
      setCurrentQuantity("");
      setCurrentUnit("");
    }
  };

  const submit = async () => {
    try {
      await addRecipe({
        title,
        instructions,
        ingredients,
        description: "",
        image_url: "",
      });
      navigation.goBack();
    } catch (e) {
      console.error("Failed to save recipe:", e);
    }
  };

  const styles = useMemo(
    () => ({
      container: {
        flex: 1,
        backgroundColor: colors.background,
      },
      scrollContent: {
        padding: spacing.md,
        paddingBottom: spacing.xxl,
      },
      importContainer: {
        flexDirection: "row" as const,
        marginBottom: spacing.xl,
        alignItems: "center" as const,
      },
      urlInput: {
        flex: 1,
        marginRight: spacing.sm,
        backgroundColor: colors.surface,
        borderRadius: borderRadius.md,
        paddingHorizontal: spacing.md,
        paddingVertical: spacing.sm,
        borderWidth: 1,
        borderColor: colors.border,
        color: colors.text,
        ...typography.styles.body,
      },
      importButton: {
        height: 48,
        justifyContent: "center" as const,
      },
      sectionTitle: {
        ...typography.styles.headline,
        color: colors.text,
        marginBottom: spacing.md,
      },
      inputGroup: {
        marginBottom: spacing.lg,
      },
      label: {
        ...typography.styles.subheadline,
        fontWeight: "600" as const,
        color: colors.text,
        marginBottom: spacing.sm,
      },
      input: {
        backgroundColor: colors.card,
        borderWidth: 1,
        borderColor: colors.border,
        borderRadius: borderRadius.md,
        padding: spacing.md,
        ...typography.styles.body,
        color: colors.text,
      },
      textArea: {
        minHeight: 120,
        textAlignVertical: "top" as const,
        paddingTop: spacing.md,
      },
      sectionHeader: {
        flexDirection: "row" as const,
        justifyContent: "space-between" as const,
        alignItems: "center" as const,
        marginBottom: spacing.md,
      },
      ingredientsCount: {
        ...typography.styles.caption1,
        color: colors.textSecondary,
      },
      ingredientInputRow: {
        marginBottom: spacing.md,
      },
      ingredientInput: {
        marginBottom: spacing.sm,
      },
      quantityContainer: {
        flexDirection: "row" as const,
        alignItems: "center" as const,
        gap: spacing.sm,
      },
      quantityInput: {
        flex: 1,
        textAlign: "center" as const,
      },
      unitInput: {
        flex: 2,
      },
      addButton: {
        backgroundColor: colors.primary,
        width: 48,
        height: 48,
        borderRadius: borderRadius.md,
        justifyContent: "center" as const,
        alignItems: "center" as const,
      },
      addButtonDisabled: {
        opacity: 0.5,
      },
      ingredientsList: {
        backgroundColor: colors.card,
        borderRadius: borderRadius.md,
        borderWidth: 1,
        borderColor: colors.border,
        overflow: "hidden" as const,
      },
      ingredientItem: {
        flexDirection: "row" as const,
        justifyContent: "space-between" as const,
        alignItems: "center" as const,
        padding: spacing.md,
        borderBottomWidth: 1,
        borderBottomColor: colors.border,
      },
      ingredientInfo: {
        flex: 1,
      },
      ingredientName: {
        ...typography.styles.body,
        color: colors.text,
        marginBottom: spacing.xs,
      },
      ingredientQuantity: {
        ...typography.styles.caption1,
        color: colors.textSecondary,
      },
      removeButton: {
        padding: spacing.xs,
        marginLeft: spacing.sm,
      },
      emptyIngredients: {
        backgroundColor: colors.card,
        borderRadius: borderRadius.md,
        borderWidth: 1,
        borderColor: colors.border,
        borderStyle: "dashed" as const,
        padding: spacing.lg,
        alignItems: "center" as const,
        justifyContent: "center" as const,
      },
      emptyText: {
        ...typography.styles.body,
        fontWeight: "500" as const,
        color: colors.text,
        marginTop: spacing.md,
        marginBottom: spacing.xs,
      },
      emptySubtext: {
        ...typography.styles.caption1,
        color: colors.textSecondary,
        textAlign: "center" as const,
      },
      buttonContainer: {
        marginTop: spacing.sm,
      },
      saveButton: {
        backgroundColor: colors.primary,
        borderRadius: borderRadius.md,
        padding: spacing.md,
        flexDirection: "row" as const,
        justifyContent: "center" as const,
        alignItems: "center" as const,
        marginBottom: spacing.md,
      },
      saveButtonDisabled: {
        opacity: 0.5,
      },
      saveButtonText: {
        color: colors.textOnPrimary,
        ...typography.styles.body,
        fontWeight: "600" as const,
        marginRight: spacing.sm,
      },
      saveButtonIcon: {
        marginLeft: spacing.xs,
      },
      cancelButton: {
        padding: spacing.md,
        alignItems: "center" as const,
      },
      cancelButtonText: {
        color: colors.primary,
        ...typography.styles.body,
        fontWeight: "600" as const,
      },
    }),
    [colors, spacing, borderRadius, typography]
  );

  return (
    <Screen>
      <KeyboardAvoidingView
        style={styles.container}
        behavior={Platform.OS === "ios" ? "padding" : "height"}
        keyboardVerticalOffset={100}
      >
        <ScrollView contentContainerStyle={styles.scrollContent}>
          <Animated.View entering={FadeIn.duration(400)}>
            <Text style={styles.sectionTitle}>Import from URL</Text>
            <View style={styles.importContainer}>
              <TextInput
                style={[styles.input, styles.urlInput]}
                value={importUrl}
                onChangeText={setImportUrl}
                placeholder="Paste recipe URL"
                placeholderTextColor={colors.textSecondary}
                autoCapitalize="none"
                keyboardType="url"
                autoCorrect={false}
              />
              <Button
                mode="contained"
                onPress={handleImportRecipe}
                loading={isImporting}
                disabled={isImporting}
                style={styles.importButton}
              >
                Import
              </Button>
            </View>
          </Animated.View>

          <Animated.View entering={FadeInDown.delay(100).duration(400)}>
            <Text style={styles.sectionTitle}>Or create manually</Text>
            <Text style={styles.sectionTitle}>Recipe Details</Text>

            <View style={styles.inputGroup}>
              <Text style={styles.label}>Title</Text>
              <TextInput
                value={title}
                onChangeText={setTitle}
                style={styles.input}
                placeholder="Enter recipe title"
                placeholderTextColor={colors.textSecondary}
              />
            </View>

            <View style={styles.inputGroup}>
              <Text style={styles.label}>Instructions</Text>
              <TextInput
                value={instructions.join("\n")}
                onChangeText={(text) => setInstructions(text.split("\n"))}
                style={[styles.input, styles.textArea]}
                multiline
                numberOfLines={4}
                placeholder="Enter step-by-step instructions"
                placeholderTextColor={colors.textSecondary}
              />
            </View>
          </Animated.View>

          <Animated.View entering={FadeInDown.delay(200).duration(400)}>
            <View style={styles.inputGroup}>
              <View style={styles.sectionHeader}>
                <Text style={styles.sectionTitle}>Ingredients</Text>
                <Text style={styles.ingredientsCount}>
                  {ingredients.length} added
                </Text>
              </View>

              <View style={styles.ingredientInputRow}>
                <TextInput
                  placeholder="Ingredient name"
                  placeholderTextColor={colors.textSecondary}
                  value={currentName}
                  onChangeText={setCurrentName}
                  style={[styles.input, styles.ingredientInput]}
                  onSubmitEditing={addIngredient}
                  returnKeyType="done"
                />
                <View style={styles.quantityContainer}>
                  <TextInput
                    placeholder="Qty"
                    placeholderTextColor={colors.textSecondary}
                    value={currentQuantity}
                    onChangeText={setCurrentQuantity}
                    style={[styles.input, styles.quantityInput]}
                    keyboardType="numeric"
                  />
                  <TextInput
                    placeholder="Unit"
                    placeholderTextColor={colors.textSecondary}
                    value={currentUnit}
                    onChangeText={setCurrentUnit}
                    style={[styles.input, styles.unitInput]}
                  />
                  <TouchableOpacity
                    style={[
                      styles.addButton,
                      !currentName && styles.addButtonDisabled,
                    ]}
                    onPress={addIngredient}
                    disabled={!currentName}
                  >
                    <Ionicons name="add" size={24} color={colors.textOnPrimary} />
                  </TouchableOpacity>
                </View>
              </View>

              {ingredients.length > 0 ? (
                <View style={styles.ingredientsList}>
                  {ingredients.map((item, index) => (
                    <Animated.View
                      key={item.id}
                      entering={FadeInDown.delay(index * 50).duration(300)}
                      style={styles.ingredientItem}
                    >
                      <View style={styles.ingredientInfo}>
                        <Text style={styles.ingredientName}>{item.name}</Text>
                        <Text style={styles.ingredientQuantity}>
                          {item.quantity} {item.unit}
                        </Text>
                      </View>
                      <TouchableOpacity
                        onPress={() =>
                          setIngredients(
                            ingredients.filter((_, i) => i !== index)
                          )
                        }
                        style={styles.removeButton}
                      >
                        <Ionicons name="close" size={20} color={colors.error} />
                      </TouchableOpacity>
                    </Animated.View>
                  ))}
                </View>
              ) : (
                <View style={styles.emptyIngredients}>
                  <Ionicons
                    name="pizza-outline"
                    size={48}
                    color={colors.border}
                  />
                  <Text style={styles.emptyText}>No ingredients added yet</Text>
                  <Text style={styles.emptySubtext}>
                    Add your first ingredient above
                  </Text>
                </View>
              )}
            </View>
          </Animated.View>

          <Animated.View entering={FadeInDown.delay(300).duration(400)}>
            <View style={styles.buttonContainer}>
              <TouchableOpacity
                style={[
                  styles.saveButton,
                  (!title || ingredients.length === 0) &&
                    styles.saveButtonDisabled,
                ]}
                onPress={submit}
                disabled={!title || ingredients.length === 0}
              >
                <Text style={styles.saveButtonText}>Save Recipe</Text>
                <Ionicons
                  name="checkmark-circle"
                  size={20}
                  color={colors.textOnPrimary}
                  style={styles.saveButtonIcon}
                />
              </TouchableOpacity>

              <TouchableOpacity
                style={styles.cancelButton}
                onPress={() => navigation.goBack()}
              >
                <Text style={styles.cancelButtonText}>Cancel</Text>
              </TouchableOpacity>
            </View>
          </Animated.View>
        </ScrollView>
      </KeyboardAvoidingView>
    </Screen>
  );
}
