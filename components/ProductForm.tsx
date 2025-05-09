import React, { useState } from "react";
import {
  View,
  TextInput,
  Button,
  StyleSheet,
  Text,
  TouchableOpacity,
} from "react-native";
import { Picker } from "@react-native-picker/picker";
import { generateId } from "../utils/id";
import { addProduct } from "../storage/pantryStorage";
import { Product } from "../models/Product";
import { STORAGE_CATEGORIES, StorageCategory } from "../models/constants";

export const ProductForm = ({ onAdded }: { onAdded: () => void }) => {
  const [name, setName] = useState("");
  const [category, setCategory] = useState<StorageCategory>("Pantry");
  const [quantity, setQuantity] = useState("");
  const [unit, setUnit] = useState("");
  const [showPicker, setShowPicker] = useState(false);

  const handleSubmit = async () => {
    if (!name || !quantity || !unit) return;
    const newProduct: Product = {
      id: generateId(),
      name,
      category,
      quantity: parseFloat(quantity),
      unit,
    };
    await addProduct(newProduct);
    onAdded();
    setName("");
    setQuantity("");
    setUnit("");
    setCategory("Pantry");
    setShowPicker(false);
  };

  return (
    <View>
      <TextInput
        placeholder="Name"
        value={name}
        onChangeText={setName}
        style={styles.input}
      />
      <TouchableOpacity
        onPress={() => setShowPicker(!showPicker)}
        style={styles.pickerToggle}
      >
        <Text style={styles.pickerToggleText}>Category: {category} ▼</Text>
      </TouchableOpacity>
      {showPicker && (
        <Picker
          selectedValue={category}
          onValueChange={(value) => setCategory(value)}
          style={styles.picker}
        >
          {STORAGE_CATEGORIES.map((cat) => (
            <Picker.Item key={cat} label={cat} value={cat} />
          ))}
        </Picker>
      )}
      <TextInput
        placeholder="Quantity"
        value={quantity}
        onChangeText={setQuantity}
        keyboardType="numeric"
        style={styles.input}
      />
      <TextInput
        placeholder="Unit"
        value={unit}
        onChangeText={setUnit}
        style={styles.input}
      />
      <Button title="Add Product" onPress={handleSubmit} />
    </View>
  );
};

const styles = StyleSheet.create({
  input: {
    backgroundColor: "#f0f2f5",
    padding: 10,
    borderRadius: 8,
    marginBottom: 10,
    borderWidth: 1,
    borderColor: "#ccc",
  },
  pickerToggle: {
    backgroundColor: "#f0f2f5",
    padding: 10,
    borderRadius: 8,
    marginBottom: 10,
    borderWidth: 1,
    borderColor: "#ccc",
  },
  pickerToggleText: {
    fontSize: 16,
    color: "#333",
  },
  picker: {
    backgroundColor: "#f0f2f5",
    borderRadius: 8,
    marginBottom: 10,
  },
});
