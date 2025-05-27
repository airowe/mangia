import React from "react";
import {
  View,
  Text,
  StyleSheet,
  TouchableOpacity,
  Animated,
} from "react-native";
import { useNavigation } from "@react-navigation/native";
import { Ionicons } from "@expo/vector-icons";
import { useUser } from "../hooks/useUser";
import { NativeStackNavigationProp } from "@react-navigation/native-stack";
import { colors } from "../theme/colors";

type RootStackParamList = {
  HomeScreen: undefined;
  Pantry: undefined;
  BarcodeScreen: undefined;
  [key: string]: undefined;
};

type NavigationProp = NativeStackNavigationProp<RootStackParamList>;

interface CustomHeaderProps {
  showBackButton?: boolean;
  title?: string;
  scrollY?: Animated.Value;
}

export const CustomHeader: React.FC<CustomHeaderProps> = ({
  showBackButton = false,
  title,
  scrollY,
}) => {
  const navigation = useNavigation<NavigationProp>();
  const { user } = useUser();

  const headerTranslateY =
    scrollY?.interpolate({
      inputRange: [0, 100],
      outputRange: [0, -100],
      extrapolate: "clamp",
    }) || new Animated.Value(0);

  // Get user initials (first letter of first name + first letter of last name, or 'G.G.' if not available)
  const getUserInitials = () => {
    if (!user) return "G.G.";
    const firstName = user.user_metadata?.first_name || "";
    const lastName = user.user_metadata?.last_name || "";

    if (!firstName && !lastName) return "G.G.";
    return (
      `${firstName.charAt(0)}${lastName.charAt(0)}`.toUpperCase() || "G.G."
    );
  };

  return (
    <Animated.View
      style={[
        styles.container,
        { transform: [{ translateY: headerTranslateY }] },
      ]}
    >
      <View style={styles.leftContainer}>
        {showBackButton ? (
          <TouchableOpacity
            onPress={() => navigation.goBack()}
            style={styles.backButton}
          >
            <Ionicons name="arrow-back" size={24} color="#000" />
          </TouchableOpacity>
        ) : (
          <TouchableOpacity
            onPress={() => navigation.navigate("HomeScreen")}
            style={styles.homeButton}
          >
            <Ionicons name="basket-outline" size={24} color="#000" />
          </TouchableOpacity>
        )}
        {title && <Text style={styles.title}>{title}</Text>}
      </View>
      <View style={styles.rightContainer}>
        <View style={styles.userInitialsContainer}>
          <Text style={styles.userInitials}>{getUserInitials()}</Text>
        </View>
        <Ionicons name="person-circle" size={28} color="#000" />
      </View>
    </Animated.View>
  );
};

const styles = StyleSheet.create({
  container: {
    flexDirection: "row",
    justifyContent: "space-between",
    alignItems: "center",
    padding: 15,
    borderBottomWidth: 1,
    borderBottomColor: colors.secondary,
    backgroundColor: colors.background,
    position: "absolute",
    top: 0,
    left: 0,
    right: 0,
    zIndex: 1000,
  },
  leftContainer: {
    flexDirection: "row",
    alignItems: "center",
  },
  rightContainer: {
    flexDirection: "row",
    alignItems: "center",
    gap: 10,
  },
  backButton: {
    padding: 5,
    marginRight: 10,
  },
  homeButton: {
    padding: 5,
    marginRight: 10,
  },
  title: {
    fontSize: 18,
    fontWeight: "600",
  },
  userInitialsContainer: {
    width: 32,
    height: 32,
    borderRadius: 16,
    backgroundColor: "#f0f0f0",
    justifyContent: "center",
    alignItems: "center",
  },
  userInitials: {
    fontSize: 14,
    fontWeight: "600",
  },
});
