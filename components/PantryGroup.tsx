import React, { useState } from 'react';
import {
  View,
  Text,
  StyleSheet,
  TouchableOpacity,
  LayoutAnimation,
  Platform,
  UIManager,
} from 'react-native';
import { SwipeListView } from 'react-native-swipe-list-view';
import { Product } from '../models/Product';
import { colors } from '../theme/colors';

if (Platform.OS === 'android' && UIManager.setLayoutAnimationEnabledExperimental) {
  UIManager.setLayoutAnimationEnabledExperimental(true);
}

type PantryGroupProps = {
  title: string;
  items: Product[];
  color: string;
  onDelete: (id: string) => void;
};

export default function PantryGroup({ title, items, color, onDelete }: PantryGroupProps) {
  const [expanded, setExpanded] = useState(false);

  const toggleExpand = () => {
    LayoutAnimation.configureNext(LayoutAnimation.Presets.easeInEaseOut);
    setExpanded(!expanded);
  };

  const renderItem = ({ item }: { item: Product }) => (
    <View style={styles.row}>
      <Text style={styles.itemText}>{item.name}</Text>
      <Text style={styles.itemText}>{item.quantity}</Text>
    </View>
  );

  const renderHiddenItem = ({ item }: { item: Product }) => (
    <View style={styles.rowBack}>
      <TouchableOpacity
        style={styles.deleteButton}
        onPress={() => onDelete(item.id)}
      >
        <Text style={styles.deleteText}>Delete</Text>
      </TouchableOpacity>
    </View>
  );

  if (!items.length) return null;

  return (
    <View style={styles.groupContainer}>
      <TouchableOpacity onPress={toggleExpand} style={[styles.header, { backgroundColor: color }]}>
        <Text style={styles.headerText}>{title}</Text>
      </TouchableOpacity>

      {expanded && (
        <SwipeListView
          data={items}
          keyExtractor={(item) => item.id}
          renderItem={renderItem}
          renderHiddenItem={renderHiddenItem}
          rightOpenValue={-75}
          disableRightSwipe
          style={styles.swipeList}
        />
      )}
    </View>
  );
}

const styles = StyleSheet.create({
  groupContainer: {
    marginBottom: 16,
    borderRadius: 8,
    overflow: 'hidden',
  },
  header: {
    padding: 12,
  },
  headerText: {
    color: 'white',
    fontWeight: 'bold',
    fontSize: 16,
  },
  row: {
    backgroundColor: '#fff',
    flexDirection: 'row',
    justifyContent: 'space-between',
    paddingVertical: 12,
    paddingHorizontal: 16,
    borderBottomWidth: 1,
    borderColor: '#eee',
  },
  itemText: {
    fontSize: 15,
  },
  rowBack: {
    alignItems: 'center',
    backgroundColor: '#ff4d4f',
    flex: 1,
    justifyContent: 'flex-end',
    paddingRight: 20,
  },
  deleteButton: {
    width: 75,
    height: '100%',
    backgroundColor: '#ff4d4f',
    justifyContent: 'center',
    alignItems: 'center',
  },
  deleteText: {
    color: 'white',
    fontWeight: 'bold',
  },
  swipeList: {
    backgroundColor: colors.background,
  },
});