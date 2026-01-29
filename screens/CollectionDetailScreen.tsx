// screens/CollectionDetailScreen.tsx
// View recipes in a specific collection

import React, { useState, useEffect, useCallback, useMemo } from 'react';
import {
  View,
  RefreshControl,
  Alert,
  TouchableOpacity,
} from 'react-native';
import { Image } from 'expo-image';
import { FlashList } from '@shopify/flash-list';
import { Text, IconButton, Menu, Divider } from 'react-native-paper';
import { useNavigation, useRoute, RouteProp, useFocusEffect } from '@react-navigation/native';
import { NativeStackNavigationProp } from '@react-navigation/native-stack';
import { MaterialCommunityIcons } from '@expo/vector-icons';
import Animated, { FadeIn, FadeInDown } from 'react-native-reanimated';

import { Screen } from '../components/Screen';
import { useTheme } from '../theme';
import { CollectionWithRecipes } from '../models/Collection';
import {
  fetchCollectionById,
  deleteCollection,
  removeRecipeFromCollection,
} from '../lib/collectionService';

type RouteParams = {
  params: { id: string; name: string };
};

type RootStackParamList = {
  RecipeDetail: { id: string };
  Collections: undefined;
};

type NavigationProp = NativeStackNavigationProp<RootStackParamList>;

export default function CollectionDetailScreen() {
  const navigation = useNavigation<NavigationProp>();
  const route = useRoute<RouteProp<RouteParams, 'params'>>();
  const { id, name } = route.params;
  const { theme } = useTheme();
  const { colors, spacing, borderRadius, typography } = theme;

  const [collection, setCollection] = useState<CollectionWithRecipes | null>(null);
  const [isLoading, setIsLoading] = useState(true);
  const [isRefreshing, setIsRefreshing] = useState(false);
  const [menuVisible, setMenuVisible] = useState(false);
  const [editMode, setEditMode] = useState(false);

  const loadCollection = useCallback(async () => {
    try {
      const data = await fetchCollectionById(id);
      setCollection(data);
    } catch (error) {
      console.error('Error loading collection:', error);
      Alert.alert('Error', 'Failed to load collection');
    } finally {
      setIsLoading(false);
      setIsRefreshing(false);
    }
  }, [id]);

  // Refresh on focus
  useFocusEffect(
    useCallback(() => {
      loadCollection();
    }, [loadCollection])
  );

  const handleDeleteCollection = useCallback(() => {
    Alert.alert(
      'Delete Collection',
      'Are you sure you want to delete this collection? The recipes inside will not be deleted.',
      [
        { text: 'Cancel', style: 'cancel' },
        {
          text: 'Delete',
          style: 'destructive',
          onPress: async () => {
            try {
              await deleteCollection(id);
              navigation.goBack();
            } catch (error) {
              console.error('Error deleting collection:', error);
              Alert.alert('Error', 'Failed to delete collection');
            }
          },
        },
      ]
    );
  }, [id, navigation]);

  // Set header options
  useEffect(() => {
    navigation.setOptions({
      title: collection?.name || name,
      headerRight: () => (
        <Menu
          visible={menuVisible}
          onDismiss={() => setMenuVisible(false)}
          anchor={
            <IconButton
              icon="dots-vertical"
              onPress={() => setMenuVisible(true)}
            />
          }
        >
          <Menu.Item
            onPress={() => {
              setMenuVisible(false);
              setEditMode(!editMode);
            }}
            title={editMode ? 'Done Editing' : 'Edit Collection'}
            leadingIcon={editMode ? 'check' : 'pencil'}
          />
          <Divider />
          <Menu.Item
            onPress={() => {
              setMenuVisible(false);
              handleDeleteCollection();
            }}
            title="Delete Collection"
            leadingIcon="delete"
            titleStyle={{ color: colors.error }}
          />
        </Menu>
      ),
    });
  }, [navigation, collection, name, menuVisible, editMode, colors.error, handleDeleteCollection]);

  const handleRefresh = useCallback(() => {
    setIsRefreshing(true);
    loadCollection();
  }, [loadCollection]);

  const handleRemoveRecipe = useCallback(
    (recipeId: string, recipeTitle: string) => {
      Alert.alert(
        'Remove Recipe',
        `Remove "${recipeTitle}" from this collection?`,
        [
          { text: 'Cancel', style: 'cancel' },
          {
            text: 'Remove',
            style: 'destructive',
            onPress: async () => {
              try {
                await removeRecipeFromCollection(id, recipeId);
                loadCollection();
              } catch (error) {
                console.error('Error removing recipe:', error);
                Alert.alert('Error', 'Failed to remove recipe');
              }
            },
          },
        ]
      );
    },
    [id, loadCollection]
  );

  const styles = useMemo(
    () => ({
      container: {
        flex: 1,
        backgroundColor: colors.background,
      },
      listContent: {
        padding: spacing.md,
      },
      emptyListContent: {
        flex: 1,
      },
      header: {
        alignItems: 'center' as const,
        marginBottom: spacing.xl,
      },
      headerIcon: {
        width: 80,
        height: 80,
        borderRadius: borderRadius.lg,
        alignItems: 'center' as const,
        justifyContent: 'center' as const,
        marginBottom: spacing.md,
      },
      description: {
        ...typography.styles.body,
        color: colors.textSecondary,
        textAlign: 'center' as const,
        marginBottom: spacing.sm,
      },
      recipeCount: {
        ...typography.styles.caption1,
        color: colors.textTertiary,
      },
      editModeBanner: {
        flexDirection: 'row' as const,
        alignItems: 'center' as const,
        backgroundColor: `${colors.info}15`,
        paddingHorizontal: spacing.md,
        paddingVertical: spacing.sm,
        borderRadius: borderRadius.sm,
        marginTop: spacing.md,
        gap: spacing.sm,
      },
      editModeText: {
        ...typography.styles.caption1,
        color: colors.info,
      },
      recipeCard: {
        flexDirection: 'row' as const,
        alignItems: 'center' as const,
        backgroundColor: colors.card,
        borderRadius: borderRadius.md,
        marginBottom: spacing.md,
        overflow: 'hidden' as const,
        shadowColor: '#000',
        shadowOffset: { width: 0, height: 1 },
        shadowOpacity: 0.1,
        shadowRadius: 2,
        elevation: 2,
      },
      recipeImage: {
        width: 80,
        height: 80,
      },
      recipePlaceholder: {
        width: 80,
        height: 80,
        backgroundColor: colors.surfaceElevated,
        alignItems: 'center' as const,
        justifyContent: 'center' as const,
      },
      recipeInfo: {
        flex: 1,
        padding: spacing.md,
      },
      recipeTitle: {
        ...typography.styles.body,
        fontWeight: '600' as const,
        color: colors.text,
      },
      timeBadge: {
        flexDirection: 'row' as const,
        alignItems: 'center' as const,
        gap: spacing.xs,
        marginTop: spacing.sm,
      },
      timeText: {
        ...typography.styles.caption1,
        color: colors.textSecondary,
      },
      emptyContainer: {
        flex: 1,
        justifyContent: 'center' as const,
        alignItems: 'center' as const,
        padding: spacing.xxl,
      },
      emptyTitle: {
        ...typography.styles.title3,
        color: colors.text,
        marginTop: spacing.md,
        marginBottom: spacing.sm,
      },
      emptySubtitle: {
        ...typography.styles.body,
        color: colors.textSecondary,
        textAlign: 'center' as const,
      },
    }),
    [colors, spacing, borderRadius, typography]
  );

  const renderRecipe = useCallback(
    ({ item, index }: { item: CollectionWithRecipes['recipes'][0]; index: number }) => (
      <Animated.View entering={FadeInDown.delay(index * 50).duration(300)}>
        <TouchableOpacity
          style={styles.recipeCard}
          onPress={() => navigation.navigate('RecipeDetail', { id: item.id })}
          activeOpacity={0.7}
        >
          {item.image_url ? (
            <Image source={{ uri: item.image_url }} style={styles.recipeImage} />
          ) : (
            <View style={styles.recipePlaceholder}>
              <MaterialCommunityIcons
                name="food"
                size={32}
                color={colors.textTertiary}
              />
            </View>
          )}
          <View style={styles.recipeInfo}>
            <Text style={styles.recipeTitle} numberOfLines={2}>
              {item.title}
            </Text>
            {(item.prep_time || item.cook_time) && (
              <View style={styles.timeBadge}>
                <MaterialCommunityIcons
                  name="clock-outline"
                  size={14}
                  color={colors.textSecondary}
                />
                <Text style={styles.timeText}>
                  {(item.prep_time || 0) + (item.cook_time || 0)} min
                </Text>
              </View>
            )}
          </View>
          {editMode && (
            <IconButton
              icon="close-circle"
              iconColor={colors.error}
              size={24}
              onPress={() => handleRemoveRecipe(item.id, item.title)}
            />
          )}
        </TouchableOpacity>
      </Animated.View>
    ),
    [navigation, editMode, handleRemoveRecipe, styles, colors]
  );

  const renderEmpty = () => (
    <Animated.View entering={FadeIn.duration(400)} style={styles.emptyContainer}>
      <MaterialCommunityIcons
        name="food-off"
        size={64}
        color={colors.textTertiary}
      />
      <Text style={styles.emptyTitle}>No Recipes Yet</Text>
      <Text style={styles.emptySubtitle}>
        Add recipes to this collection from the recipe detail page
      </Text>
    </Animated.View>
  );

  const renderHeader = () => {
    if (!collection) return null;

    return (
      <Animated.View entering={FadeIn.duration(400)} style={styles.header}>
        <View style={[styles.headerIcon, { backgroundColor: collection.color + '20' }]}>
          <MaterialCommunityIcons
            name={collection.icon as any}
            size={40}
            color={collection.color}
          />
        </View>
        {collection.description && (
          <Text style={styles.description}>{collection.description}</Text>
        )}
        <Text style={styles.recipeCount}>
          {collection.recipes.length} recipe{collection.recipes.length !== 1 ? 's' : ''}
        </Text>
        {editMode && (
          <View style={styles.editModeBanner}>
            <MaterialCommunityIcons
              name="information"
              size={16}
              color={colors.info}
            />
            <Text style={styles.editModeText}>
              Tap the × to remove recipes from this collection
            </Text>
          </View>
        )}
      </Animated.View>
    );
  };

  return (
    <Screen style={styles.container}>
      <FlashList
        data={collection?.recipes || []}
        keyExtractor={(item) => item.id}
        renderItem={renderRecipe}
        contentContainerStyle={styles.listContent}
        ListHeaderComponent={renderHeader}
        ListEmptyComponent={!isLoading ? renderEmpty : null}
        refreshing={isRefreshing}
        onRefresh={handleRefresh}
      />
    </Screen>
  );
}
