// components/PantryList.tsx
import React from 'react';
import { SectionList, View, Text, StyleSheet } from 'react-native';
import { Product } from '../models/Product';
import { StorageCategory } from '../models/constants';

type Section = {
  title: StorageCategory;
  data: Product[];
};

type Props = {
  sections: Section[];
};

const CATEGORY_COLORS: Record<StorageCategory, string> = {
  Fridge: '#E0F7FA',
  Freezer: '#E8EAF6',
  Pantry: '#FFF3E0',
  'Spice Drawer': '#F3E5F5',
};

export const PantryList: React.FC<Props> = ({ sections }) => {
  return (
    <SectionList
      sections={sections}
      keyExtractor={(item) => item.id}
      renderSectionHeader={({ section: { title } }) => (
        <View style={[styles.sectionHeader, { backgroundColor: CATEGORY_COLORS[title] }]}>
          <Text style={styles.sectionHeaderText}>{title}</Text>
        </View>
      )}
      renderItem={({ item }) => (
        <View style={[styles.item, { backgroundColor: CATEGORY_COLORS[item.category] }]}>
          <View style={styles.row}>
            <Text style={styles.name}>{item.name}</Text>
            <Text style={styles.quantity}>{item.quantity} {item.unit}</Text>
          </View>
        </View>
      )}
      contentContainerStyle={{ paddingBottom: 20 }}
      ListEmptyComponent={<Text style={styles.empty}>No items yet.</Text>}
    />
  );
};

const styles = StyleSheet.create({
  sectionHeader: {
    paddingVertical: 8,
    paddingHorizontal: 12,
    borderRadius: 6,
    marginTop: 10,
  },
  sectionHeaderText: {
    fontSize: 16,
    fontWeight: '700',
  },
  item: {
    padding: 12,
    marginTop: 6,
    borderRadius: 8,
    borderWidth: 1,
    borderColor: '#ccc',
  },
  row: {
    flexDirection: 'row',
    justifyContent: 'space-between',
  },
  name: {
    fontWeight: '500',
  },
  quantity: {
    color: '#555',
  },
  empty: {
    textAlign: 'center',
    fontStyle: 'italic',
    marginTop: 20,
    color: '#777',
  },
});
