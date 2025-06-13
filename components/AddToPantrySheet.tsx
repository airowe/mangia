import React from 'react';
import { View, Text, TouchableOpacity, StyleSheet } from 'react-native';
import { MaterialIcons } from "@expo/vector-icons";
import { BottomSheetView } from "@gorhom/bottom-sheet";

type AddToPantrySheetProps = {
  onBarcodePress: () => void;
  onManualPress: () => void;
  onReceiptPress: () => void;
};

export const AddToPantrySheet = ({
  onBarcodePress,
  onManualPress,
  onReceiptPress,
}: AddToPantrySheetProps) => {
  return (
    <BottomSheetView style={styles.container}>
      <View style={styles.sheetContainer}>
        <Text style={styles.sheetTitle}>Add to Pantry</Text>
        <Text style={styles.sheetSubtitle}>Choose how you'd like to add items</Text>
        
        <View style={styles.buttonsContainer}>
          <View style={styles.buttonRow}>
            <TouchableOpacity 
              style={[styles.optionButton, styles.barcodeButton]}
              onPress={onBarcodePress}
            >
              <MaterialIcons name="qr-code-scanner" size={32} color="#007AFF" />
              <Text style={styles.optionButtonText}>Scan Barcode</Text>
            </TouchableOpacity>
            
            <TouchableOpacity 
              style={[styles.optionButton, styles.manualButton]}
              onPress={onManualPress}
            >
              <MaterialIcons name="edit" size={32} color="#FF9500" />
              <Text style={styles.optionButtonText}>Manual Entry</Text>
            </TouchableOpacity>
          </View>
          
          <View style={styles.buttonRow}>
            <TouchableOpacity 
              style={[styles.optionButton, styles.receiptButton]}
              onPress={onReceiptPress}
            >
              <MaterialIcons name="receipt" size={32} color="#34C759" />
              <Text style={styles.optionButtonText}>Scan Receipt</Text>
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
  sheetBackground: {
    backgroundColor: '#fff',
    borderTopLeftRadius: 20,
    borderTopRightRadius: 20,
  },
  sheetHandle: {
    backgroundColor: '#ccc',
    width: 40,
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
    justifyContent: 'space-between',
    marginBottom: 16,
  },
  optionButton: {
    width: '48%',
    padding: 20,
    borderRadius: 12,
    alignItems: 'center',
    justifyContent: 'center',
    backgroundColor: '#f8f8f8',
    borderWidth: 1,
  },
  barcodeButton: {
    borderColor: '#007AFF',
  },
  manualButton: {
    borderColor: '#FF9500',
  },
  receiptButton: {
    width: '100%',
    flexDirection: 'row',
    justifyContent: 'center',
    alignItems: 'center',
    gap: 8,
    borderColor: '#34C759',
  },
  optionButtonText: {
    marginTop: 12,
    fontSize: 14,
    fontWeight: '500',
    textAlign: 'center',
  },
});
