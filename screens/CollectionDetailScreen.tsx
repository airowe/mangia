// screens/CollectionDetailScreen.tsx
// View recipes in a specific collection

import React, { useState, useEffect, useCallback } from 'react';
import {
  View,
  StyleSheet,
  FlatList,
  RefreshControl,
  Alert,
  TouchableOpacity,
  Image,
} from 'react-native';
import { Text, IconButton, Menu, Divider, Button } from 'react-native-paper';
import { useNavigation, useRoute, RouteProp, useFocusEffect } from '@react-navigation/native';
import { NativeStackNavigationProp } from '@react-navigation/native-stack';
import { MaterialCommunityIcons } from '@expo/vector-icons';

import { Screen } from '../components/Screen';
import { colors } from '../theme/colors';
import { CollectionWithRecipes } from '../models/Collection';
import {
  fetchCollectionById,
  updateCollection,
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
  }, [navigation, collection, name, menuVisible, editMode]);

  const handleRefresh = useCallback(() => {
    setIsRefreshing(true);
    loadCollection();
  }, [loadCollection]);

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

  const renderRecipe = useCallback(
    ({ item }: { item: CollectionWithRecipes['recipes'][0] }) => (
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
    ),
    [navigation, editMode, handleRemoveRecipe]
  );

  const renderEmpty = () => (
    <View style={styles.emptyContainer}>
      <MaterialCommunityIcons
        name="food-off"
        size={64}
        color={colors.textTertiary}
      />
      <Text style={styles.emptyTitle}>No Recipes Yet</Text>
      <Text style={styles.emptySubtitle}>
        Add recipes to this collection from the recipe detail page
      </Text>
    </View>
  );

  const renderHeader = () => {
    if (!collection) return null;

    return (
      <View style={styles.header}>
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
      </View>
    );
  };

  return (
    <Screen style={styles.container}>
      <FlatList
        data={collection?.recipes || []}
        keyExtractor={(item) => item.id}
        renderItem={renderRecipe}
        contentContainerStyle={[
          styles.listContent,
          (!collection || collection.recipes.length === 0) && styles.emptyListContent,
        ]}
        ListHeaderComponent={renderHeader}
        ListEmptyComponent={!isLoading ? renderEmpty : null}
        refreshControl={
          <RefreshControl
            refreshing={isRefreshing}
            onRefresh={handleRefresh}
            colors={[colors.primary]}
            tintColor={colors.primary}
          />
        }
      />
    </Screen>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: colors.background,
  },
  listContent: {
    padding: 16,
  },
  emptyListContent: {
    flex: 1,
  },
  header: {
    alignItems: 'center',
    marginBottom: 24,
  },
  headerIcon: {
    width: 80,
    height: 80,
    borderRadius: 20,
    alignItems: 'center',
    justifyContent: 'center',
    marginBottom: 12,
  },
  description: {
    fontSize: 16,
    color: colors.textSecondary,
    textAlign: 'center',
    marginBottom: 8,
  },
  recipeCount: {
    fontSize: 14,
    color: colors.textTertiary,
  },
  editModeBanner: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: colors.info + '15',
    paddingHorizontal: 12,
    paddingVertical: 8,
    borderRadius: 8,
    marginTop: 16,
    gap: 8,
  },
  editModeText: {
    fontSize: 13,
    color: colors.info,
  },
  recipeCard: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: colors.card,
    borderRadius: 12,
    marginBottom: 12,
    overflow: 'hidden',
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
    backgroundColor: colors.lightGray,
    alignItems: 'center',
    justifyContent: 'center',
  },
  recipeInfo: {
    flex: 1,
    padding: 12,
  },
  recipeTitle: {
    fontSize: 16,
    fontWeight: '600',
    color: colors.text,
  },
  timeBadge: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 4,
    marginTop: 6,
  },
  timeText: {
    fontSize: 13,
    color: colors.textSecondary,
  },
  emptyContainer: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
    padding: 32,
  },
  emptyTitle: {
    fontSize: 20,
    fontWeight: '600',
    color: colors.text,
    marginTop: 16,
    marginBottom: 8,
  },
  emptySubtitle: {
    fontSize: 15,
    color: colors.textSecondary,
    textAlign: 'center',
  },
});
