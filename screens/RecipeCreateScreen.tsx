import React, { useState } from 'react';
import { View, Text, TextInput, Button, FlatList, StyleSheet } from 'react-native';
import { addRecipe } from '../lib/recipes';
import { RecipeIngredient } from '../models/Recipe';

export default function RecipeCreateScreen({ navigation }: any) {
  const [title, setTitle] = useState('');
  const [instructions, setInstructions] = useState('');
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
        main_ingredient: '',
        meal_type: '',
        description: '',
        image_url: ''
      });
      navigation.goBack();
    } catch (e) {
      console.error(e);
    }
  };

  return (
    <View style={styles.container}>
      <Text style={styles.label}>Title</Text>
      <TextInput value={title} onChangeText={setTitle} style={styles.input} />

      <Text style={styles.label}>Instructions</Text>
      <TextInput
        value={instructions}
        onChangeText={setInstructions}
        style={[styles.input, { height: 80 }]}
        multiline
      />

      <Text style={styles.label}>Add Ingredient</Text>
      <View style={styles.row}>
        <TextInput placeholder="Name" value={currentName} onChangeText={setCurrentName} style={styles.inputSmall} />
        <TextInput placeholder="Qty" value={currentQuantity} onChangeText={setCurrentQuantity} style={styles.inputTiny} />
        <TextInput placeholder="Unit" value={currentUnit} onChangeText={setCurrentUnit} style={styles.inputTiny} />
        <Button title="+" onPress={addIngredient} />
      </View>

      <FlatList
        data={ingredients}
        keyExtractor={(item) => item.id}
        renderItem={({ item }) => (
          <Text style={styles.ingredient}>
            - {item.quantity} {item.unit} {item.name}
          </Text>
        )}
      />

      <Button title="Save Recipe" onPress={submit} />
    </View>
  );
}

const styles = StyleSheet.create({
  container: { padding: 16 },
  label: { fontWeight: 'bold', marginTop: 12 },
  input: { borderWidth: 1, borderColor: '#ccc', padding: 8, marginBottom: 8, borderRadius: 4 },
  row: { flexDirection: 'row', alignItems: 'center', gap: 6 },
  inputSmall: { flex: 1, borderWidth: 1, borderColor: '#ccc', padding: 8, borderRadius: 4 },
  inputTiny: { width: 60, borderWidth: 1, borderColor: '#ccc', padding: 8, borderRadius: 4 },
  ingredient: { marginVertical: 4 },
});
