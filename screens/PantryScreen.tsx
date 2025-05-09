// screens/PantryScreen.tsx
import React, { useEffect, useState } from 'react';
import { View, Text, TextInput, Button, TouchableOpacity, ScrollView, StyleSheet } from 'react-native';
import { Product } from '../models/Product';
import { getPantry, addProduct } from '../storage/pantryStorage';
import { generateId } from '../utils/id';
import { STORAGE_CATEGORIES, StorageCategory } from '../models/constants';
import { PantryList } from '../components/PantryList';

type Section = {
  title: StorageCategory;
  data: Product[];
};

export const PantryScreen = () => {
  const [pantrySections, setPantrySections] = useState<Section[]>([]);
  const [name, setName] = useState('');
  const [category, setCategory] = useState<StorageCategory>('Pantry');
  const [quantity, setQuantity] = useState('');
  const [unit, setUnit] = useState('');
  const [showPicker, setShowPicker] = useState(false);

  const loadPantry = async () => {
    const pantry = await getPantry();
    const grouped: Section[] = STORAGE_CATEGORIES.map((cat) => ({
      title: cat,
      data: pantry.filter((item) => item.category === cat),
    }));
    setPantrySections(grouped);
  };

  const handleSubmit = async () => {
    if (!name || !quantity || !unit) return;
    const newProduct: Product = {
      id: generateId(),
      name,
      quantity: parseFloat(quantity),
      unit,
      category,
    };
    await addProduct(newProduct);
    setName('');
    setQuantity('');
    setUnit('');
    setCategory('Pantry');
    setShowPicker(false);
    await loadPantry();
  };

  useEffect(() => {
    loadPantry();
  }, []);

  return (
    <View style={{ flex: 1 }}>
      <ScrollView contentContainerStyle={styles.formContainer}>
        <View style={styles.formCard}>
          <TextInput placeholder="Name" value={name} onChangeText={setName} style={styles.input} />
          <TouchableOpacity onPress={() => setShowPicker((s) => !s)} style={styles.pickerToggle}>
            <Text>Category: {category} ▼</Text>
          </TouchableOpacity>
          {showPicker &&
            STORAGE_CATEGORIES.map((cat) => (
              <TouchableOpacity key={cat} onPress={() => { setCategory(cat); setShowPicker(false); }} style={styles.pickerOption}>
                <Text>{cat}</Text>
              </TouchableOpacity>
            ))}
          <TextInput placeholder="Quantity" value={quantity} onChangeText={setQuantity} keyboardType="numeric" style={styles.input} />
          <TextInput placeholder="Unit" value={unit} onChangeText={setUnit} style={styles.input} />
          <Button title="Add Product" onPress={handleSubmit} />
        </View>
      </ScrollView>

      <View style={{ flex: 1 }}>
        <PantryList sections={pantrySections} />
      </View>
    </View>
  );
};

const styles = StyleSheet.create({
  formContainer: {
    padding: 16,
  },
  formCard: {
    backgroundColor: '#fff',
    borderRadius: 12,
    padding: 16,
    shadowColor: '#000',
    shadowOpacity: 0.05,
    shadowOffset: { width: 0, height: 2 },
    shadowRadius: 4,
    elevation: 2,
    marginBottom: 10,
  },
  input: {
    backgroundColor: '#f0f2f5',
    padding: 10,
    borderRadius: 8,
    marginBottom: 10,
    borderWidth: 1,
    borderColor: '#ccc',
  },
  pickerToggle: {
    backgroundColor: '#f0f2f5',
    padding: 10,
    borderRadius: 8,
    marginBottom: 10,
    borderWidth: 1,
    borderColor: '#ccc',
  },
  pickerOption: {
    backgroundColor: '#eee',
    padding: 10,
    borderRadius: 6,
    marginBottom: 6,
  },
});
