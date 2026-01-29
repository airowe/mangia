import React, { ReactNode } from 'react';
import { StyleSheet, View, ViewStyle } from 'react-native';
import { colors } from '../theme/colors';
import { useSafeAreaInsets } from 'react-native-safe-area-context';

type ScreenProps = {
  children: ReactNode;
  style?: ViewStyle;
  noPadding?: boolean;
  verticalPadding?: boolean;
};

export function Screen({ children, style, noPadding = false, verticalPadding = false }: ScreenProps) {
  const insets = useSafeAreaInsets();

  return (
    <View
      style={[
        styles.container,
        {
          paddingTop: insets.top,
          paddingBottom: insets.bottom,
          paddingLeft: insets.left,
          paddingRight: insets.right,
        },
        !noPadding && styles.padding,
        !verticalPadding && styles.verticalPadding,
        style,
      ]}
    >
      {children}
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: colors.background,
  },
  padding: {
    paddingHorizontal: 16,
  },
  verticalPadding: {
    paddingTop: 8,
    paddingBottom: 8,
  },
});
