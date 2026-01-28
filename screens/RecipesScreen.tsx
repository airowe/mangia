import React, { useEffect, useState, useCallback, useMemo } from "react";
import {
  View,
  ScrollView,
  RefreshControl,
  ActivityIndicator,
  Text,
  TextInput,
  TouchableOpacity,
  Image,
  StyleSheet,
  Dimensions,
} from "react-native";
import { useNavigation } from "@react-navigation/native";
import { NativeStackNavigationProp } from "@react-navigation/native-stack";
import { MaterialCommunityIcons } from "@expo/vector-icons";
import Animated, { FadeIn, FadeInDown } from "react-native-reanimated";
import { useSafeAreaInsets } from "react-native-safe-area-context";

import { fetchRecipesByStatus } from "../lib/recipeService";
import { Recipe } from "../models/Recipe";
import { mangiaColors } from "../theme/tokens/colors";
import { fontFamily } from "../theme/tokens/typography";
import { RecipeLibraryStackParamList } from "../navigation/RecipeLibraryStack";
import { RecipeWithIngredients } from "../lib/recipeService";

type RecipesScreenNavigationProp = NativeStackNavigationProp<
  RecipeLibraryStackParamList,
  "RecipesScreen"
>;

const { width: SCREEN_WIDTH } = Dimensions.get("window");
const CARD_GAP = 16;
const CARD_WIDTH = (SCREEN_WIDTH - 24 * 2 - CARD_GAP) / 2;
const CARD_HEIGHT = (CARD_WIDTH * 4) / 3;

type FilterType = "all" | "favorites" | "quick" | "dinner" | "dessert";

interface FilterPill {
  id: FilterType;
  label: string;
}

const FILTERS: FilterPill[] = [
  { id: "all", label: "All" },
  { id: "favorites", label: "Favorites" },
  { id: "quick", label: "Quick & Easy" },
  { id: "dinner", label: "Dinner Party" },
  { id: "dessert", label: "Dessert" },
];

// Get difficulty label based on cook time
const getDifficulty = (recipe: Recipe): string => {
  const totalTime = (recipe.prep_time || 0) + (recipe.cook_time || 0);
  if (totalTime <= 30) return "Easy";
  if (totalTime <= 60) return "Medium";
  return "Hard";
};

// Format time display
const formatTime = (recipe: Recipe): string => {
  const totalTime = (recipe.prep_time || 0) + (recipe.cook_time || 0);
  if (totalTime === 0) return "";
  if (totalTime < 60) return `${totalTime} min`;
  const hours = Math.floor(totalTime / 60);
  const mins = totalTime % 60;
  return mins > 0 ? `${hours} hr ${mins} min` : `${hours} hr`;
};

export const RecipesScreen = () => {
  const navigation = useNavigation<RecipesScreenNavigationProp>();
  const insets = useSafeAreaInsets();

  const [recipes, setRecipes] = useState<RecipeWithIngredients[]>([]);
  const [loading, setLoading] = useState(true);
  const [refreshing, setRefreshing] = useState(false);
  const [searchQuery, setSearchQuery] = useState("");
  const [activeFilter, setActiveFilter] = useState<FilterType>("all");
  const [searchFocused, setSearchFocused] = useState(false);

  const loadRecipes = useCallback(async () => {
    try {
      // Load all recipes (not filtered by status for the library view)
      const allRecipes = await fetchRecipesByStatus("want_to_cook");
      const cookedRecipes = await fetchRecipesByStatus("cooked");
      setRecipes([...allRecipes, ...cookedRecipes]);
    } catch (err) {
      console.error("Failed to load recipes:", err);
    } finally {
      setLoading(false);
      setRefreshing(false);
    }
  }, []);

  useEffect(() => {
    loadRecipes();
  }, [loadRecipes]);

  const handleRefresh = () => {
    setRefreshing(true);
    loadRecipes();
  };

  const handlePressRecipe = useCallback(
    (recipe: Recipe) => {
      if (!recipe.id) return;
      navigation.navigate("RecipeDetail", { id: recipe.id });
    },
    [navigation]
  );

  // Filter recipes based on search and active filter
  const filteredRecipes = useMemo(() => {
    let result = recipes;

    // Apply search filter
    if (searchQuery.trim()) {
      const query = searchQuery.toLowerCase();
      result = result.filter((r) => r.title.toLowerCase().includes(query));
    }

    // Apply category filter
    switch (activeFilter) {
      case "favorites":
        // Assuming we have a favorites field or high rating
        result = result.filter((r) => (r.rating || 0) >= 4);
        break;
      case "quick":
        result = result.filter((r) => {
          const totalTime = (r.prep_time || 0) + (r.cook_time || 0);
          return totalTime > 0 && totalTime <= 30;
        });
        break;
      case "dinner":
        // Filter by meal type if available
        result = result.filter(
          (r) =>
            r.meal_type?.toLowerCase().includes("dinner") ||
            r.servings && r.servings >= 4
        );
        break;
      case "dessert":
        result = result.filter(
          (r) =>
            r.meal_type?.toLowerCase().includes("dessert") ||
            r.title.toLowerCase().includes("dessert") ||
            r.title.toLowerCase().includes("cake") ||
            r.title.toLowerCase().includes("cookie")
        );
        break;
      default:
        // "all" - no additional filtering
        break;
    }

    return result;
  }, [recipes, searchQuery, activeFilter]);

  const handleAccountPress = () => {
    // Navigate to account/profile screen
  };

  return (
    <View style={styles.container}>
      {/* Header */}
      <View style={[styles.header, { paddingTop: insets.top + 8 }]}>
        <Text style={styles.headline}>Your Library</Text>
        <TouchableOpacity
          style={styles.accountButton}
          onPress={handleAccountPress}
        >
          <MaterialCommunityIcons
            name="account"
            size={24}
            color={mangiaColors.brown}
          />
        </TouchableOpacity>
      </View>

      {/* Sticky Search Section */}
      <View style={styles.searchSection}>
        <View
          style={[
            styles.searchContainer,
            searchFocused && styles.searchContainerFocused,
          ]}
        >
          <MaterialCommunityIcons
            name="magnify"
            size={20}
            color={mangiaColors.taupe}
            style={styles.searchIcon}
          />
          <TextInput
            style={styles.searchInput}
            placeholder="Search for pasta, risotto..."
            placeholderTextColor={mangiaColors.taupe}
            value={searchQuery}
            onChangeText={setSearchQuery}
            onFocus={() => setSearchFocused(true)}
            onBlur={() => setSearchFocused(false)}
          />
        </View>
      </View>

      {/* Filter Pills */}
      <ScrollView
        horizontal
        showsHorizontalScrollIndicator={false}
        contentContainerStyle={styles.filterContainer}
        style={styles.filterScroll}
      >
        {FILTERS.map((filter) => (
          <TouchableOpacity
            key={filter.id}
            style={[
              styles.filterPill,
              activeFilter === filter.id && styles.filterPillActive,
            ]}
            onPress={() => setActiveFilter(filter.id)}
          >
            <Text
              style={[
                styles.filterText,
                activeFilter === filter.id && styles.filterTextActive,
              ]}
            >
              {filter.label}
            </Text>
          </TouchableOpacity>
        ))}
      </ScrollView>

      {/* Recipe Grid */}
      <ScrollView
        style={styles.scrollView}
        contentContainerStyle={styles.gridContainer}
        refreshControl={
          <RefreshControl
            refreshing={refreshing}
            onRefresh={handleRefresh}
            tintColor={mangiaColors.terracotta}
          />
        }
        showsVerticalScrollIndicator={false}
      >
        {loading ? (
          <View style={styles.loadingContainer}>
            <ActivityIndicator size="large" color={mangiaColors.terracotta} />
          </View>
        ) : filteredRecipes.length === 0 ? (
          <View style={styles.emptyContainer}>
            <MaterialCommunityIcons
              name="book-open-variant"
              size={64}
              color={mangiaColors.taupe}
            />
            <Text style={styles.emptyText}>
              {searchQuery
                ? "No recipes found"
                : "Your library is empty"}
            </Text>
            <Text style={styles.emptySubtext}>
              {searchQuery
                ? "Try a different search term"
                : "Import or add recipes to get started"}
            </Text>
          </View>
        ) : (
          <View style={styles.grid}>
            {filteredRecipes.map((recipe, index) => (
              <Animated.View
                key={recipe.id}
                entering={FadeInDown.delay(index * 50).duration(300)}
                style={[
                  styles.cardWrapper,
                  // Staggered layout: odd columns offset
                  index % 2 === 1 && styles.cardWrapperOffset,
                ]}
              >
                <TouchableOpacity
                  style={styles.card}
                  onPress={() => handlePressRecipe(recipe)}
                  activeOpacity={0.85}
                >
                  <View style={styles.imageContainer}>
                    {recipe.image_url ? (
                      <Image
                        source={{ uri: recipe.image_url }}
                        style={styles.image}
                        resizeMode="cover"
                      />
                    ) : (
                      <View style={styles.placeholderImage}>
                        <MaterialCommunityIcons
                          name="food"
                          size={48}
                          color={mangiaColors.taupe}
                        />
                      </View>
                    )}
                    {/* Favorite button */}
                    <TouchableOpacity style={styles.favoriteButton}>
                      <MaterialCommunityIcons
                        name={
                          (recipe.rating || 0) >= 4
                            ? "heart"
                            : "heart-outline"
                        }
                        size={20}
                        color={mangiaColors.white}
                      />
                    </TouchableOpacity>
                  </View>
                  <View style={styles.cardContent}>
                    <Text style={styles.cardTitle} numberOfLines={2}>
                      {recipe.title}
                    </Text>
                    <View style={styles.cardMeta}>
                      {formatTime(recipe) && (
                        <>
                          <Text style={styles.cardMetaText}>
                            {formatTime(recipe)}
                          </Text>
                          <View style={styles.metaDot} />
                        </>
                      )}
                      <Text style={styles.cardMetaText}>
                        {getDifficulty(recipe)}
                      </Text>
                    </View>
                  </View>
                </TouchableOpacity>
              </Animated.View>
            ))}
          </View>
        )}
      </ScrollView>
    </View>
  );
};

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: mangiaColors.cream,
  },
  header: {
    flexDirection: "row",
    justifyContent: "space-between",
    alignItems: "center",
    paddingHorizontal: 24,
    paddingBottom: 8,
  },
  headline: {
    fontFamily: fontFamily.serif,
    fontSize: 36,
    fontWeight: "600",
    color: mangiaColors.dark,
    letterSpacing: -0.5,
  },
  accountButton: {
    width: 40,
    height: 40,
    borderRadius: 20,
    backgroundColor: mangiaColors.creamDark,
    justifyContent: "center",
    alignItems: "center",
  },
  searchSection: {
    paddingHorizontal: 24,
    paddingVertical: 16,
    backgroundColor: mangiaColors.cream,
  },
  searchContainer: {
    flexDirection: "row",
    alignItems: "center",
    backgroundColor: mangiaColors.white,
    borderRadius: 12,
    height: 48,
    paddingHorizontal: 16,
    borderWidth: 1,
    borderColor: `${mangiaColors.taupe}30`,
    shadowColor: "#000",
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.05,
    shadowRadius: 4,
    elevation: 1,
  },
  searchContainerFocused: {
    borderColor: mangiaColors.terracotta,
    borderWidth: 2,
  },
  searchIcon: {
    marginRight: 8,
  },
  searchInput: {
    flex: 1,
    fontFamily: fontFamily.regular,
    fontSize: 16,
    color: mangiaColors.dark,
  },
  filterScroll: {
    flexGrow: 0,
    paddingBottom: 8,
  },
  filterContainer: {
    paddingHorizontal: 24,
    gap: 12,
  },
  filterPill: {
    height: 36,
    paddingHorizontal: 20,
    borderRadius: 18,
    backgroundColor: mangiaColors.white,
    borderWidth: 1,
    borderColor: `${mangiaColors.taupe}40`,
    justifyContent: "center",
    alignItems: "center",
  },
  filterPillActive: {
    backgroundColor: mangiaColors.dark,
    borderColor: mangiaColors.dark,
  },
  filterText: {
    fontFamily: fontFamily.medium,
    fontSize: 14,
    fontWeight: "500",
    color: mangiaColors.brown,
  },
  filterTextActive: {
    color: mangiaColors.white,
  },
  scrollView: {
    flex: 1,
  },
  gridContainer: {
    padding: 24,
    paddingBottom: 120,
  },
  grid: {
    flexDirection: "row",
    flexWrap: "wrap",
    justifyContent: "space-between",
  },
  cardWrapper: {
    width: CARD_WIDTH,
    marginBottom: 32,
  },
  cardWrapperOffset: {
    marginTop: 32,
  },
  card: {
    width: "100%",
  },
  imageContainer: {
    width: "100%",
    height: CARD_HEIGHT,
    borderTopLeftRadius: 0,
    borderTopRightRadius: 16,
    borderBottomLeftRadius: 16,
    borderBottomRightRadius: 0,
    overflow: "hidden",
    backgroundColor: mangiaColors.creamDark,
    marginBottom: 12,
  },
  image: {
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
  favoriteButton: {
    position: "absolute",
    top: 8,
    right: 8,
    width: 32,
    height: 32,
    borderRadius: 16,
    backgroundColor: "rgba(255,255,255,0.2)",
    justifyContent: "center",
    alignItems: "center",
  },
  cardContent: {
    paddingRight: 4,
  },
  cardTitle: {
    fontFamily: fontFamily.serif,
    fontSize: 18,
    fontWeight: "500",
    color: mangiaColors.dark,
    lineHeight: 22,
    marginBottom: 6,
  },
  cardMeta: {
    flexDirection: "row",
    alignItems: "center",
  },
  cardMetaText: {
    fontFamily: fontFamily.regular,
    fontSize: 12,
    color: mangiaColors.taupe,
    letterSpacing: 0.5,
    textTransform: "uppercase",
  },
  metaDot: {
    width: 4,
    height: 4,
    borderRadius: 2,
    backgroundColor: mangiaColors.taupe,
    marginHorizontal: 8,
  },
  loadingContainer: {
    flex: 1,
    justifyContent: "center",
    alignItems: "center",
    paddingVertical: 64,
  },
  emptyContainer: {
    flex: 1,
    justifyContent: "center",
    alignItems: "center",
    paddingVertical: 64,
  },
  emptyText: {
    fontFamily: fontFamily.serif,
    fontSize: 24,
    fontWeight: "500",
    color: mangiaColors.dark,
    marginTop: 16,
    marginBottom: 8,
  },
  emptySubtext: {
    fontFamily: fontFamily.regular,
    fontSize: 16,
    color: mangiaColors.brown,
    textAlign: "center",
  },
});

export default RecipesScreen;
