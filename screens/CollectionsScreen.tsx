// screens/CollectionsScreen.tsx
// View and manage recipe collections/folders

import React, { useState, useCallback, useMemo } from 'react';
import {
  View,
  FlatList,
  RefreshControl,
  Alert,
  TouchableOpacity,
} from 'react-native';
import { Text, FAB, Portal, Modal, TextInput, Button } from 'react-native-paper';
import { useNavigation, useFocusEffect } from '@react-navigation/native';
import { NativeStackNavigationProp } from '@react-navigation/native-stack';
import { MaterialCommunityIcons } from '@expo/vector-icons';
import Animated, { FadeIn, FadeInDown } from 'react-native-reanimated';

import { Screen } from '../components/Screen';
import { useTheme } from '../theme';
import {
  CollectionWithCount,
  COLLECTION_ICONS,
  COLLECTION_COLORS,
  CollectionIcon,
  CollectionColor,
} from '../models/Collection';
import {
  fetchCollections,
  createCollection,
  deleteCollection,
} from '../lib/collectionService';

type RootStackParamList = {
  CollectionDetail: { id: string; name: string };
};

type NavigationProp = NativeStackNavigationProp<RootStackParamList>;

export default function CollectionsScreen() {
  const navigation = useNavigation<NavigationProp>();
  const { theme } = useTheme();
  const { colors, spacing, borderRadius, typography } = theme;

  const [collections, setCollections] = useState<CollectionWithCount[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [isRefreshing, setIsRefreshing] = useState(false);
  const [modalVisible, setModalVisible] = useState(false);
  const [newCollectionName, setNewCollectionName] = useState('');
  const [newCollectionDescription, setNewCollectionDescription] = useState('');
  const [selectedIcon, setSelectedIcon] = useState<CollectionIcon>('folder');
  const [selectedColor, setSelectedColor] = useState<CollectionColor>('#CC5500');
  const [isCreating, setIsCreating] = useState(false);

  const loadCollections = useCallback(async () => {
    try {
      const data = await fetchCollections();
      setCollections(data);
    } catch (error) {
      console.error('Error loading collections:', error);
      Alert.alert('Error', 'Failed to load collections');
    } finally {
      setIsLoading(false);
      setIsRefreshing(false);
    }
  }, []);

  // Refresh on screen focus
  useFocusEffect(
    useCallback(() => {
      loadCollections();
    }, [loadCollections])
  );

  const handleRefresh = useCallback(() => {
    setIsRefreshing(true);
    loadCollections();
  }, [loadCollections]);

  const handleCreateCollection = useCallback(async () => {
    if (!newCollectionName.trim()) {
      Alert.alert('Error', 'Please enter a collection name');
      return;
    }

    setIsCreating(true);
    try {
      await createCollection({
        name: newCollectionName.trim(),
        description: newCollectionDescription.trim() || undefined,
        icon: selectedIcon,
        color: selectedColor,
      });

      setModalVisible(false);
      setNewCollectionName('');
      setNewCollectionDescription('');
      setSelectedIcon('folder');
      setSelectedColor('#CC5500');
      loadCollections();
    } catch (error) {
      console.error('Error creating collection:', error);
      Alert.alert('Error', 'Failed to create collection');
    } finally {
      setIsCreating(false);
    }
  }, [newCollectionName, newCollectionDescription, selectedIcon, selectedColor, loadCollections]);

  const handleDeleteCollection = useCallback(
    (collection: CollectionWithCount) => {
      Alert.alert(
        'Delete Collection',
        `Are you sure you want to delete "${collection.name}"? The recipes inside will not be deleted.`,
        [
          { text: 'Cancel', style: 'cancel' },
          {
            text: 'Delete',
            style: 'destructive',
            onPress: async () => {
              try {
                await deleteCollection(collection.id);
                loadCollections();
              } catch (error) {
                console.error('Error deleting collection:', error);
                Alert.alert('Error', 'Failed to delete collection');
              }
            },
          },
        ]
      );
    },
    [loadCollections]
  );

  const styles = useMemo(
    () => ({
      container: {
        flex: 1,
        backgroundColor: colors.background,
      },
      listContent: {
        padding: spacing.md,
        paddingBottom: 100,
      },
      emptyListContent: {
        flex: 1,
      },
      collectionCard: {
        flexDirection: 'row' as const,
        alignItems: 'center' as const,
        backgroundColor: colors.card,
        borderRadius: borderRadius.md,
        padding: spacing.md,
        marginBottom: spacing.md,
        shadowColor: '#000',
        shadowOffset: { width: 0, height: 1 },
        shadowOpacity: 0.1,
        shadowRadius: 2,
        elevation: 2,
      },
      collectionIcon: {
        width: 56,
        height: 56,
        borderRadius: borderRadius.md,
        alignItems: 'center' as const,
        justifyContent: 'center' as const,
      },
      collectionInfo: {
        flex: 1,
        marginLeft: spacing.md,
      },
      collectionName: {
        ...typography.styles.headline,
        color: colors.text,
      },
      collectionDescription: {
        ...typography.styles.caption1,
        color: colors.textSecondary,
        marginTop: spacing.xs,
      },
      recipeCount: {
        ...typography.styles.caption1,
        color: colors.textTertiary,
        marginTop: spacing.xs,
      },
      emptyContainer: {
        flex: 1,
        justifyContent: 'center' as const,
        alignItems: 'center' as const,
        padding: spacing.xxl,
      },
      emptyTitle: {
        ...typography.styles.title2,
        color: colors.text,
        marginTop: spacing.md,
        marginBottom: spacing.sm,
      },
      emptySubtitle: {
        ...typography.styles.body,
        color: colors.textSecondary,
        textAlign: 'center' as const,
        marginBottom: spacing.xl,
      },
      emptyButton: {
        paddingHorizontal: spacing.md,
      },
      fab: {
        position: 'absolute' as const,
        right: spacing.md,
        bottom: spacing.md,
        backgroundColor: colors.primary,
      },
      modalContent: {
        backgroundColor: colors.card,
        margin: spacing.lg,
        padding: spacing.lg,
        borderRadius: borderRadius.md,
      },
      modalTitle: {
        ...typography.styles.title3,
        color: colors.text,
        marginBottom: spacing.md,
      },
      input: {
        marginBottom: spacing.md,
        backgroundColor: colors.background,
      },
      pickerLabel: {
        ...typography.styles.subheadline,
        fontWeight: '500' as const,
        color: colors.text,
        marginTop: spacing.sm,
        marginBottom: spacing.sm,
      },
      iconPicker: {
        flexDirection: 'row' as const,
        flexWrap: 'wrap' as const,
        gap: spacing.sm,
        marginBottom: spacing.md,
      },
      iconOption: {
        width: 44,
        height: 44,
        borderRadius: borderRadius.sm,
        borderWidth: 2,
        borderColor: colors.border,
        alignItems: 'center' as const,
        justifyContent: 'center' as const,
      },
      iconOptionSelected: {
        borderWidth: 2,
      },
      colorPicker: {
        flexDirection: 'row' as const,
        flexWrap: 'wrap' as const,
        gap: spacing.sm,
        marginBottom: spacing.md,
      },
      colorOption: {
        width: 36,
        height: 36,
        borderRadius: borderRadius.full,
        alignItems: 'center' as const,
        justifyContent: 'center' as const,
      },
      colorOptionSelected: {
        borderWidth: 3,
        borderColor: colors.textOnPrimary,
        shadowColor: '#000',
        shadowOffset: { width: 0, height: 2 },
        shadowOpacity: 0.3,
        shadowRadius: 3,
        elevation: 4,
      },
      modalActions: {
        flexDirection: 'row' as const,
        justifyContent: 'flex-end' as const,
        gap: spacing.md,
        marginTop: spacing.sm,
      },
      modalButton: {
        minWidth: 100,
      },
    }),
    [colors, spacing, borderRadius, typography]
  );

  const renderCollection = useCallback(
    ({ item, index }: { item: CollectionWithCount; index: number }) => (
      <Animated.View entering={FadeInDown.delay(index * 50).duration(300)}>
        <TouchableOpacity
          style={styles.collectionCard}
          onPress={() =>
            navigation.navigate('CollectionDetail', { id: item.id, name: item.name })
          }
          onLongPress={() => handleDeleteCollection(item)}
          activeOpacity={0.7}
        >
          <View style={[styles.collectionIcon, { backgroundColor: item.color + '20' }]}>
            <MaterialCommunityIcons
              name={item.icon as any}
              size={28}
              color={item.color}
            />
          </View>
          <View style={styles.collectionInfo}>
            <Text style={styles.collectionName}>{item.name}</Text>
            {item.description && (
              <Text style={styles.collectionDescription} numberOfLines={1}>
                {item.description}
              </Text>
            )}
            <Text style={styles.recipeCount}>
              {item.recipe_count} recipe{item.recipe_count !== 1 ? 's' : ''}
            </Text>
          </View>
          <MaterialCommunityIcons
            name="chevron-right"
            size={24}
            color={colors.textTertiary}
          />
        </TouchableOpacity>
      </Animated.View>
    ),
    [navigation, handleDeleteCollection, styles, colors]
  );

  const renderEmpty = () => (
    <Animated.View entering={FadeIn.duration(400)} style={styles.emptyContainer}>
      <MaterialCommunityIcons
        name="folder-multiple"
        size={80}
        color={colors.textTertiary}
      />
      <Text style={styles.emptyTitle}>No Collections Yet</Text>
      <Text style={styles.emptySubtitle}>
        Create collections to organize your recipes
      </Text>
      <Button
        mode="contained"
        onPress={() => setModalVisible(true)}
        style={styles.emptyButton}
        icon="plus"
      >
        Create Collection
      </Button>
    </Animated.View>
  );

  return (
    <Screen style={styles.container}>
      <FlatList
        data={collections}
        keyExtractor={(item) => item.id}
        renderItem={renderCollection}
        contentContainerStyle={[
          styles.listContent,
          collections.length === 0 && styles.emptyListContent,
        ]}
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

      <FAB
        icon="plus"
        style={styles.fab}
        onPress={() => setModalVisible(true)}
        color={colors.textOnPrimary}
      />

      {/* Create Collection Modal */}
      <Portal>
        <Modal
          visible={modalVisible}
          onDismiss={() => setModalVisible(false)}
          contentContainerStyle={styles.modalContent}
        >
          <Text style={styles.modalTitle}>New Collection</Text>

          <TextInput
            label="Name"
            value={newCollectionName}
            onChangeText={setNewCollectionName}
            mode="outlined"
            style={styles.input}
            autoFocus
          />

          <TextInput
            label="Description (optional)"
            value={newCollectionDescription}
            onChangeText={setNewCollectionDescription}
            mode="outlined"
            style={styles.input}
            multiline
          />

          {/* Icon Picker */}
          <Text style={styles.pickerLabel}>Icon</Text>
          <View style={styles.iconPicker}>
            {COLLECTION_ICONS.slice(0, 8).map((icon) => (
              <TouchableOpacity
                key={icon}
                style={[
                  styles.iconOption,
                  selectedIcon === icon && styles.iconOptionSelected,
                  selectedIcon === icon && { borderColor: selectedColor },
                ]}
                onPress={() => setSelectedIcon(icon)}
              >
                <MaterialCommunityIcons
                  name={icon as any}
                  size={24}
                  color={selectedIcon === icon ? selectedColor : colors.textSecondary}
                />
              </TouchableOpacity>
            ))}
          </View>

          {/* Color Picker */}
          <Text style={styles.pickerLabel}>Color</Text>
          <View style={styles.colorPicker}>
            {COLLECTION_COLORS.map((color) => (
              <TouchableOpacity
                key={color}
                style={[
                  styles.colorOption,
                  { backgroundColor: color },
                  selectedColor === color && styles.colorOptionSelected,
                ]}
                onPress={() => setSelectedColor(color)}
              >
                {selectedColor === color && (
                  <MaterialCommunityIcons name="check" size={18} color={colors.textOnPrimary} />
                )}
              </TouchableOpacity>
            ))}
          </View>

          <View style={styles.modalActions}>
            <Button
              mode="outlined"
              onPress={() => setModalVisible(false)}
              style={styles.modalButton}
            >
              Cancel
            </Button>
            <Button
              mode="contained"
              onPress={handleCreateCollection}
              loading={isCreating}
              disabled={isCreating || !newCollectionName.trim()}
              style={styles.modalButton}
            >
              Create
            </Button>
          </View>
        </Modal>
      </Portal>
    </Screen>
  );
}
