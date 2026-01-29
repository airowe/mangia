// components/ServingAdjuster.tsx
// Adjustable serving size control with +/- buttons

import React, { useCallback } from 'react';
import { View, Text, StyleSheet, TouchableOpacity } from 'react-native';
import { MaterialCommunityIcons } from '@expo/vector-icons';
import { colors } from '../theme/colors';

interface ServingAdjusterProps {
  originalServings: number;
  currentServings: number;
  onServingsChange: (servings: number) => void;
  minServings?: number;
  maxServings?: number;
}

export function ServingAdjuster({
  originalServings,
  currentServings,
  onServingsChange,
  minServings = 1,
  maxServings = 24,
}: ServingAdjusterProps) {
  const increment = useCallback(() => {
    if (currentServings < maxServings) {
      onServingsChange(currentServings + 1);
    }
  }, [currentServings, maxServings, onServingsChange]);

  const decrement = useCallback(() => {
    if (currentServings > minServings) {
      onServingsChange(currentServings - 1);
    }
  }, [currentServings, minServings, onServingsChange]);

  const resetToOriginal = useCallback(() => {
    onServingsChange(originalServings);
  }, [originalServings, onServingsChange]);

  const isScaled = currentServings !== originalServings;
  const scaleFactor = originalServings > 0 ? currentServings / originalServings : 1;

  return (
    <View style={styles.container}>
      <View style={styles.row}>
        <Text style={styles.label}>Servings</Text>

        <View style={styles.controls}>
          <TouchableOpacity
            style={[styles.button, currentServings <= minServings && styles.buttonDisabled]}
            onPress={decrement}
            disabled={currentServings <= minServings}
            activeOpacity={0.7}
          >
            <MaterialCommunityIcons
              name="minus"
              size={20}
              color={currentServings <= minServings ? colors.textTertiary : colors.primary}
            />
          </TouchableOpacity>

          <View style={styles.valueContainer}>
            <Text style={styles.value}>{currentServings}</Text>
          </View>

          <TouchableOpacity
            style={[styles.button, currentServings >= maxServings && styles.buttonDisabled]}
            onPress={increment}
            disabled={currentServings >= maxServings}
            activeOpacity={0.7}
          >
            <MaterialCommunityIcons
              name="plus"
              size={20}
              color={currentServings >= maxServings ? colors.textTertiary : colors.primary}
            />
          </TouchableOpacity>
        </View>
      </View>

      {isScaled && (
        <View style={styles.scaleInfo}>
          <View style={styles.scaleIndicator}>
            <MaterialCommunityIcons
              name="scale"
              size={14}
              color={colors.info}
            />
            <Text style={styles.scaleText}>
              {scaleFactor < 1
                ? `Scaled down to ${Math.round(scaleFactor * 100)}%`
                : `Scaled up ${Math.round(scaleFactor * 100)}%`}
            </Text>
          </View>
          <TouchableOpacity onPress={resetToOriginal} style={styles.resetButton}>
            <Text style={styles.resetText}>Reset to {originalServings}</Text>
          </TouchableOpacity>
        </View>
      )}
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    backgroundColor: colors.card,
    borderRadius: 12,
    padding: 16,
    marginBottom: 16,
  },
  row: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
  },
  label: {
    fontSize: 16,
    fontWeight: '600',
    color: colors.text,
  },
  controls: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 4,
  },
  button: {
    width: 40,
    height: 40,
    borderRadius: 20,
    backgroundColor: colors.background,
    alignItems: 'center',
    justifyContent: 'center',
    borderWidth: 1,
    borderColor: colors.border,
  },
  buttonDisabled: {
    backgroundColor: colors.lightGray,
    borderColor: colors.lightGray,
  },
  valueContainer: {
    width: 48,
    alignItems: 'center',
  },
  value: {
    fontSize: 22,
    fontWeight: '700',
    color: colors.text,
  },
  scaleInfo: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    marginTop: 12,
    paddingTop: 12,
    borderTopWidth: 1,
    borderTopColor: colors.border,
  },
  scaleIndicator: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 6,
  },
  scaleText: {
    fontSize: 13,
    color: colors.info,
  },
  resetButton: {
    paddingHorizontal: 12,
    paddingVertical: 6,
    backgroundColor: colors.primaryLight,
    borderRadius: 16,
  },
  resetText: {
    fontSize: 13,
    color: colors.primary,
    fontWeight: '500',
  },
});
