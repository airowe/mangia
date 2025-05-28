import React, { useState } from 'react';
import { 
  View, 
  Text, 
  TextInput, 
  StyleSheet, 
  TouchableOpacity, 
  ScrollView,
  KeyboardAvoidingView,
  Platform
} from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { addRecipe } from '../lib/recipes';
import { RecipeIngredient } from '../models/Recipe';
import { Screen } from '../components/Screen';
import { colors } from '../theme/colors';

export default function RecipeCreateScreen({ navigation }: any) {
  const [title, setTitle] = useState('');
  const [instructions, setInstructions] = useState<string[]>([]);
  const [ingredients, setIngredients] = useState<RecipeIngredient[]>([]);
  const [currentName, setCurrentName] = useState('');
  const [currentQuantity, setCurrentQuantity] = useState('');
  const [currentUnit, setCurrentUnit] = useState('');

  const addIngredient = () => {
    if (!currentName) return;
    setIngredients([
      ...ingredients,
      {
        id: Math.random().toString(),
        name: currentName,
        quantity: parseFloat(currentQuantity || '1'),
        unit: currentUnit,
        recipe_id: '', // will be filled in backend
      },
    ]);
    setCurrentName('');
    setCurrentQuantity('');
    setCurrentUnit('');
  };

  const submit = async () => {
    try {
      await addRecipe({
        title,
        instructions,
        ingredients,
        description: '',
        image_url: ''
      });
      navigation.goBack();
    } catch (e) {
      console.error('Failed to save recipe:', e);
    }
  };

  return (
    <Screen>
      <KeyboardAvoidingView 
        style={styles.container}
        behavior={Platform.OS === 'ios' ? 'padding' : 'height'}
        keyboardVerticalOffset={100}
      >
        <ScrollView contentContainerStyle={styles.scrollContent}>
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
              value={instructions.join('\n')}
              onChangeText={(text) => setInstructions(text.split('\n'))}
              style={[styles.input, styles.textArea]}
              multiline
              numberOfLines={4}
              placeholder="Enter step-by-step instructions"
              placeholderTextColor={colors.textSecondary}
            />
          </View>


          <View style={styles.inputGroup}>
            <View style={styles.sectionHeader}>
              <Text style={styles.sectionTitle}>Ingredients</Text>
              <Text style={styles.ingredientsCount}>{ingredients.length} added</Text>
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
                  style={[styles.addButton, !currentName && styles.addButtonDisabled]}
                  onPress={addIngredient}
                  disabled={!currentName}
                >
                  <Ionicons name="add" size={24} color="#fff" />
                </TouchableOpacity>
              </View>
            </View>

            {ingredients.length > 0 ? (
              <View style={styles.ingredientsList}>
                {ingredients.map((item, index) => (
                  <View key={item.id} style={styles.ingredientItem}>
                    <View style={styles.ingredientInfo}>
                      <Text style={styles.ingredientName}>{item.name}</Text>
                      <Text style={styles.ingredientQuantity}>
                        {item.quantity} {item.unit}
                      </Text>
                    </View>
                    <TouchableOpacity 
                      onPress={() => setIngredients(ingredients.filter((_, i) => i !== index))}
                      style={styles.removeButton}
                    >
                      <Ionicons name="close" size={20} color={colors.error} />
                    </TouchableOpacity>
                  </View>
                ))}
              </View>
            ) : (
              <View style={styles.emptyIngredients}>
                <Ionicons name="pizza-outline" size={48} color={colors.border} />
                <Text style={styles.emptyText}>No ingredients added yet</Text>
                <Text style={styles.emptySubtext}>Add your first ingredient above</Text>
              </View>
            )}
          </View>


          <View style={styles.buttonContainer}>
            <TouchableOpacity 
              style={[styles.saveButton, (!title || ingredients.length === 0) && styles.saveButtonDisabled]}
              onPress={submit}
              disabled={!title || ingredients.length === 0}
            >
              <Text style={styles.saveButtonText}>Save Recipe</Text>
              <Ionicons name="checkmark-circle" size={20} color="#fff" style={styles.saveButtonIcon} />
            </TouchableOpacity>
            
            <TouchableOpacity 
              style={styles.cancelButton}
              onPress={() => navigation.goBack()}
            >
              <Text style={styles.cancelButtonText}>Cancel</Text>
            </TouchableOpacity>
          </View>
        </ScrollView>
      </KeyboardAvoidingView>
    </Screen>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: colors.background,
  },
  scrollContent: {
    padding: 16,
    paddingBottom: 32,
  },
  sectionTitle: {
    fontSize: 18,
    fontWeight: '600',
    color: colors.text,
    marginBottom: 16,
  },
  inputGroup: {
    marginBottom: 24,
  },
  label: {
    fontSize: 14,
    fontWeight: '600',
    color: colors.text,
    marginBottom: 8,
  },
  input: {
    backgroundColor: colors.card,
    borderWidth: 1,
    borderColor: colors.border,
    borderRadius: 8,
    padding: 12,
    fontSize: 16,
    color: colors.text,
  },
  textArea: {
    minHeight: 120,
    textAlignVertical: 'top',
    paddingTop: 12,
  },
  sectionHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: 12,
  },
  ingredientsCount: {
    fontSize: 14,
    color: colors.textSecondary,
  },
  ingredientInputRow: {
    marginBottom: 12,
  },
  ingredientInput: {
    marginBottom: 8,
  },
  quantityContainer: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 8,
  },
  quantityInput: {
    flex: 1,
    textAlign: 'center',
  },
  unitInput: {
    flex: 2,
  },
  addButton: {
    backgroundColor: colors.primary,
    width: 48,
    height: 48,
    borderRadius: 8,
    justifyContent: 'center',
    alignItems: 'center',
  },
  addButtonDisabled: {
    opacity: 0.5,
  },
  ingredientsList: {
    backgroundColor: colors.card,
    borderRadius: 8,
    borderWidth: 1,
    borderColor: colors.border,
    overflow: 'hidden',
  },
  ingredientItem: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    padding: 12,
    borderBottomWidth: 1,
    borderBottomColor: colors.border,
  },
  ingredientInfo: {
    flex: 1,
  },
  ingredientName: {
    fontSize: 16,
    color: colors.text,
    marginBottom: 4,
  },
  ingredientQuantity: {
    fontSize: 14,
    color: colors.textSecondary,
  },
  removeButton: {
    padding: 4,
    marginLeft: 8,
  },
  emptyIngredients: {
    backgroundColor: colors.card,
    borderRadius: 8,
    borderWidth: 1,
    borderColor: colors.border,
    borderStyle: 'dashed',
    padding: 24,
    alignItems: 'center',
    justifyContent: 'center',
  },
  emptyText: {
    fontSize: 16,
    fontWeight: '500',
    color: colors.text,
    marginTop: 12,
    marginBottom: 4,
  },
  emptySubtext: {
    fontSize: 14,
    color: colors.textSecondary,
    textAlign: 'center',
  },
  buttonContainer: {
    marginTop: 8,
  },
  saveButton: {
    backgroundColor: colors.primary,
    borderRadius: 8,
    padding: 16,
    flexDirection: 'row',
    justifyContent: 'center',
    alignItems: 'center',
    marginBottom: 12,
  },
  saveButtonDisabled: {
    opacity: 0.5,
  },
  saveButtonText: {
    color: '#fff',
    fontSize: 16,
    fontWeight: '600',
    marginRight: 8,
  },
  saveButtonIcon: {
    marginLeft: 4,
  },
  cancelButton: {
    padding: 16,
    alignItems: 'center',
  },
  cancelButtonText: {
    color: colors.primary,
    fontSize: 16,
    fontWeight: '600',
  },
});
