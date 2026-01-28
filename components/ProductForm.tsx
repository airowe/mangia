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
import { addToPantry } from "../lib/pantry";
import { PantryItem } from "../models/Product";
import { STORAGE_CATEGORIES } from "../models/constants";

export const ProductForm = ({ onAdded }: { onAdded: () => void }) => {
  const [title, setTitle] = useState("");
  const [location, setLocation] = useState("Pantry");
  const [quantity, setQuantity] = useState("");
  const [unit, setUnit] = useState("");
  const [showPicker, setShowPicker] = useState(false);

  const handleSubmit = async () => {
    if (!title || !quantity || !unit) return;
    const newProduct: PantryItem = {
      id: generateId(),
      location,
      quantity: parseFloat(quantity),
      unit,
      title,
    };
    await addToPantry(newProduct);
    onAdded();
    setTitle("");
    setQuantity("");
    setUnit("");
    setLocation("Pantry");
    setShowPicker(false);
  };

  return (
    <View>
      <TextInput
        placeholder="Name"
        value={title}
        onChangeText={setTitle}
        style={styles.input}
      />
      <TouchableOpacity
        onPress={() => setShowPicker(!showPicker)}
        style={styles.pickerToggle}
      >
        <Text style={styles.pickerToggleText}>Location: {location} ▼</Text>
      </TouchableOpacity>
      {showPicker && (
        <Picker
          selectedValue={location}
          onValueChange={(value) => setLocation(value)}
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
