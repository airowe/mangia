import React, { useEffect, useState } from 'react';
import {
  View, Text, TextInput, FlatList, TouchableOpacity, Image, StyleSheet,
} from 'react-native';
import DropDownPicker from 'react-native-dropdown-picker';
import { fetchRecipes, fetchRecipeById } from '../lib/recipes';
import { useNavigation } from '@react-navigation/native';
import { NativeStackNavigationProp } from '@react-navigation/native-stack';
import { RootStackParamList } from '../navigation/RootNavigator';
import { Recipe } from '../models/Recipe';

export default function RecipeCatalogScreen() {
  const [recipes, setRecipes] = useState<Recipe[]>([]);
  const navigation = useNavigation<NativeStackNavigationProp<RootStackParamList, 'RecipeCatalog'>>();
  const [mealFilter, setMealFilter] = useState('');
  const [search, setSearch] = useState('');
  const [open, setOpen] = useState(false);

  const load = async () => {
    const data = await fetchRecipes({ search, meal_type: mealFilter });
    setRecipes(data);
  };

  useEffect(() => {
    load();
  }, [search, mealFilter]);

  const grouped = recipes.reduce<Record<string, Recipe[]>>((acc, recipe) => {
    const category = recipe.meal_type || 'Other';
    if (!acc[category]) {
      acc[category] = [];
    }
    acc[category].push(recipe);
    return acc;
  }, {});

  return (
    <View style={{ flex: 1, padding: 12 }}>
      <TextInput
        style={styles.input}
        placeholder="Search recipes..."
        value={search}
        onChangeText={setSearch}
      />
      <DropDownPicker
        items={[
          { label: 'Breakfast', value: 'breakfast' },
          { label: 'Lunch', value: 'lunch' },
          { label: 'Dinner', value: 'dinner' },
        ]}
        open={open}
        setOpen={setOpen}
        value={mealFilter}
        setValue={setMealFilter}
        multiple={false}
      />
      {Object.entries(grouped).map(([category, items]) => (
        <View key={category}>
          <Text style={styles.categoryTitle}>{category}</Text>
          <FlatList
            data={items}
            numColumns={2}
            keyExtractor={(item) => item.id}
            renderItem={({ item }) => (
              <TouchableOpacity
                style={styles.card}
                onPress={() => navigation.navigate('RecipeDetail', { id: item.id })}
              >
                <Image source={{ uri: item.image_url }} style={styles.image} />
                <Text style={styles.title}>{item.title}</Text>
                <Text style={styles.subtitle}>{item.description}</Text>
              </TouchableOpacity>
            )}
          />
        </View>
      ))}
    </View>
  );
}

const styles = StyleSheet.create({
  input: {
    padding: 8,
    marginBottom: 10,
    borderWidth: 1,
    borderColor: '#ccc',
  },
  categoryTitle: {
    fontSize: 18,
    fontWeight: 'bold',
    marginVertical: 8,
  },
  card: {
    flex: 1,
    margin: 5,
    backgroundColor: '#fff',
    borderRadius: 8,
    elevation: 3,
    padding: 8,
  },
  image: {
    width: '100%',
    height: 100,
    borderRadius: 8,
  },
  title: {
    fontWeight: 'bold',
    marginTop: 5,
  },
  subtitle: {
    fontSize: 12,
    color: '#666',
  },
});
