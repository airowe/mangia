import React from "react";
import { View, StyleSheet, ViewStyle, Image } from "react-native";

// Keep these for future use
const getIconForCategory = (category: string = "") => {
  const lowerCategory = category.toLowerCase();

  if (lowerCategory.includes("fruit") || lowerCategory.includes("vegetable")) {
    return "food-apple";
  }
  if (
    lowerCategory.includes("meat") ||
    lowerCategory.includes("chicken") ||
    lowerCategory.includes("beef")
  ) {
    return "food-drumstick";
  }
  if (
    lowerCategory.includes("dairy") ||
    lowerCategory.includes("milk") ||
    lowerCategory.includes("cheese")
  ) {
    return "cheese";
  }
  if (
    lowerCategory.includes("grain") ||
    lowerCategory.includes("bread") ||
    lowerCategory.includes("pasta")
  ) {
    return "bread-slice";
  }
  if (lowerCategory.includes("spice") || lowerCategory.includes("herb")) {
    return "shaker";
  }
  if (lowerCategory.includes("beverage") || lowerCategory.includes("drink")) {
    return "cup";
  }
  return "food";
};

const getIconForLocation = (location: string = "") => {
  const lowerLocation = location.toLowerCase();

  if (
    lowerLocation.includes("fridge") ||
    lowerLocation.includes("refrigerator")
  ) {
    return "fridge";
  }
  if (lowerLocation.includes("freezer")) {
    return "snowflake";
  }
  if (lowerLocation.includes("pantry") || lowerLocation.includes("shelf")) {
    return "cupboard";
  }
  if (lowerLocation.includes("spice") || lowerLocation.includes("drawer")) {
    return "shaker";
  }
  return "shopping";
};

type ProductPlaceholderProps = {
  category?: string;
  location?: string;
  size?: number;
  style?: ViewStyle;
  imageUrl?: string | null;
};

export const ProductPlaceholder: React.FC<ProductPlaceholderProps> = ({
  category,
  location,
  size = 100,
  style,
  imageUrl,
}) => {
  // Use the provided image URL or fallback to loremflickr
  const imageSource = imageUrl || "https://loremflickr.com/320/240/food";

  return (
    <View style={[styles.container, { width: size, height: size }, style]}>
      <Image
        source={{ uri: imageSource }}
        style={styles.image}
        resizeMode="cover"
      />
    </View>
  );
};

const styles = StyleSheet.create({
  container: {
    backgroundColor: "rgba(0, 0, 0, 0.05)",
    borderRadius: 8,
    overflow: "hidden",
    borderWidth: 1,
    borderColor: "rgba(0, 0, 0, 0.1)",
  },
  image: {
    width: "100%",
    height: "100%",
  },
});
