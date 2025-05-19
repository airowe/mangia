import React from 'react';
import { View, Text, StyleSheet } from 'react-native';

export const RecipeItem = ({ recipe }: { recipe: any }) => (
  <View style={styles.card}>
    <Text style={styles.title}>{recipe.title}</Text>
    {recipe.recipe_ingredients?.map((ing: any) => (
      <Text key={ing.id}>
        - {ing.quantity} {ing.unit} {ing.name}
      </Text>
    ))}
  </View>
);

const styles = StyleSheet.create({
  card: { padding: 12, marginBottom: 12, backgroundColor: '#fff', borderRadius: 8, elevation: 2 },
  title: { fontWeight: 'bold', fontSize: 18, marginBottom: 4 },
});