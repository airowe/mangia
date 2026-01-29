import React from 'react';
import { View, Text, TouchableOpacity, StyleSheet } from 'react-native';
import { MaterialIcons } from "@expo/vector-icons";
import { BottomSheetView } from "@gorhom/bottom-sheet";

type AddToPantrySheetProps = {
  onManualPress: () => void;
};

export const AddToPantrySheet = ({
  onManualPress,
}: AddToPantrySheetProps) => {
  return (
    <BottomSheetView style={styles.container}>
      <View style={styles.sheetContainer}>
        <Text style={styles.sheetTitle}>Add to Pantry</Text>
        <Text style={styles.sheetSubtitle}>Add items you have at home</Text>

        <View style={styles.buttonsContainer}>
          <View style={styles.buttonRow}>
            <TouchableOpacity
              style={[styles.optionButton, styles.manualButton]}
              onPress={onManualPress}
            >
              <MaterialIcons name="edit" size={32} color="#FF9500" />
              <Text style={styles.optionButtonText}>Add Item</Text>
            </TouchableOpacity>
          </View>
        </View>
      </View>
    </BottomSheetView>
  );
};

const styles = StyleSheet.create({
  container: {
    flex: 1,
    padding: 16,
  },
  sheetContainer: {
    flex: 1,
    padding: 20,
  },
  sheetTitle: {
    fontSize: 22,
    fontWeight: 'bold',
    marginBottom: 8,
    textAlign: 'center',
  },
  sheetSubtitle: {
    fontSize: 16,
    color: '#666',
    marginBottom: 24,
    textAlign: 'center',
  },
  buttonsContainer: {
    paddingHorizontal: 16,
  },
  buttonRow: {
    flexDirection: 'row',
    justifyContent: 'center',
    marginBottom: 16,
  },
  optionButton: {
    width: '100%',
    padding: 20,
    borderRadius: 12,
    alignItems: 'center',
    justifyContent: 'center',
    backgroundColor: '#f8f8f8',
    borderWidth: 1,
  },
  manualButton: {
    borderColor: '#FF9500',
  },
  optionButtonText: {
    marginTop: 12,
    fontSize: 14,
    fontWeight: '500',
    textAlign: 'center',
  },
});
