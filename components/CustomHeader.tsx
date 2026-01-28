import React from "react";
import {
  View,
  Text,
  StyleSheet,
  TouchableOpacity,
  Animated,
  Platform,
  StyleProp,
  ViewStyle,
} from "react-native";
import { useNavigation } from "@react-navigation/native";
import { Ionicons } from "@expo/vector-icons";
import { NativeStackNavigationProp } from "@react-navigation/native-stack";
import { colors } from "../theme/colors";
import { useSafeAreaInsets } from "react-native-safe-area-context";
import { AnimatedHeader } from "./AnimatedHeader";
import { useUser } from "../hooks/useUser";

type RootStackParamList = {
  HomeScreen: undefined;
  Pantry: undefined;
  Account: undefined;
  [key: string]: undefined;
};

interface CustomHeaderProps {
  showBackButton?: boolean;
  title?: string;
  scrollY?: Animated.Value;
}

export function CustomHeader({
  title,
  showBackButton = false,
  scrollY,
}: CustomHeaderProps) {
  const navigation =
    useNavigation<NativeStackNavigationProp<RootStackParamList>>();
  const { user } = useUser();
  const insets = useSafeAreaInsets();

  const headerTranslateY = scrollY || new Animated.Value(0);

  // Opacity for the title and other elements
  const headerOpacity =
    scrollY?.interpolate({
      inputRange: [0, 30, 60],
      outputRange: [1, 0.5, 0],
      extrapolate: "clamp",
    }) || new Animated.Value(1);

  // Get user initials from full name or 'G.G.' if not available
  const getUserInitials = () => {
    if (!user) return "G.G.";
    const fullName = user.user_metadata?.full_name || "";

    if (!fullName) return "G.G.";

    const nameParts = fullName.trim().split(' ');
    const firstName = nameParts[0] || "";
    const lastName = nameParts[nameParts.length - 1] || "";

    if (!firstName && !lastName) return "G.G.";
    return (
      `${firstName.charAt(0)}${lastName.charAt(0)}`.toUpperCase() || "G.G."
    );
  };

  const headerContent = (
    <Animated.View style={[styles.headerContent, { opacity: headerOpacity }]}>
      <View style={styles.headerTop}>
        <View style={styles.leftContainer}>
          {showBackButton ? (
            <TouchableOpacity
              onPress={() => navigation.goBack()}
              style={styles.backButton}
            >
              <Ionicons name="arrow-back" size={24} color={colors.text} />
            </TouchableOpacity>
          ) : (
            <TouchableOpacity
              onPress={() => navigation.navigate("HomeScreen" as never)}
              style={styles.basketButton}
            >
              <Ionicons name="basket" size={36} color={colors.primary} />
            </TouchableOpacity>
          )}
        </View>

        <View style={styles.rightContainer}>
          <TouchableOpacity
            onPress={() => navigation.navigate("Account" as never)}
            style={styles.avatarContainer}
          >
            <Text style={styles.avatarText}>{getUserInitials()}</Text>
          </TouchableOpacity>
        </View>
      </View>

      {title && (
        <View style={styles.titleContainer}>
          <Text style={styles.title} numberOfLines={1}>
            {title}
          </Text>
        </View>
      )}
    </Animated.View>
  );

  if (!scrollY) {
    return (
      <View style={styles.staticHeader}>
        <View style={[styles.headerContainer, { paddingTop: insets.top / 2 }]}>
          {headerContent}
        </View>
      </View>
    );
  }

  return (
    <View style={[styles.staticHeader, { paddingTop: insets.top / 2 }]}>
      <AnimatedHeader
        scrollY={scrollY}
        style={{
          ...styles.headerContainer,
          transform: [{ translateY: headerTranslateY }],
          ...(Platform.OS === "ios" && {
            shadowColor: "#000",
            shadowOffset: { width: 0, height: 2 },
            shadowOpacity: 0.1,
            shadowRadius: 4,
          }),
        }}
      >
        {headerContent}
      </AnimatedHeader>
    </View>
  );
}

const styles = StyleSheet.create({
  // Header container styles
  staticHeader: {
    width: "100%",
    backgroundColor: colors.background,
  },

  // Inner header container
  headerContainer: {
    width: "100%",
    backgroundColor: colors.background,
    paddingHorizontal: 16,
    paddingBottom: 12,
    minHeight: 44, // Increased from 44 to provide more vertical space
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "space-between",
    borderBottomWidth: 1,
    borderBottomColor: colors.border,
    shadowColor: "#000",
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.1,
    shadowRadius: 4,
    elevation: 3,
    zIndex: 1000,
  },

  // Header content styles
  headerContent: {
    width: "100%",
    paddingBottom: 12,
  },

  // Avatar styles
  avatarContainer: {
    width: 36,
    height: 36,
    borderRadius: 18,
    backgroundColor: colors.primary,
    justifyContent: "center",
    alignItems: "center",
    marginLeft: 16,
    marginVertical: 4, // Added vertical margin for better spacing
  },

  avatarText: {
    color: colors.background,
    fontWeight: "600",
    fontSize: 14, // Slightly larger text for better visibility
    lineHeight: 20, // Ensure proper vertical centering
  },

  // Title styles
  titleContainer: {
    paddingHorizontal: 8,
  },

  title: {
    fontSize: 24,
    fontWeight: "700",
    color: colors.text,
  },

  // Header layout
  headerTop: {
    flexDirection: "row",
    justifyContent: "space-between",
    alignItems: "center",
    paddingHorizontal: 16,
    paddingBottom: 16,
  },

  leftContainer: {
    flexDirection: "row",
    alignItems: "center",
  },

  // Logo styles
  logoContainer: {
    width: 100,
    height: 30,
  },

  logo: {
    fontSize: 18,
    fontWeight: "600",
    color: colors.text,
  },

  // Navigation elements
  rightContainer: {
    flexDirection: "row",
    alignItems: "center",
    gap: 10,
  },

  backButton: {
    padding: 8,
    width: 40,
    height: 40,
    justifyContent: "center",
    alignItems: "center",
  },

  basketButton: {
    width: 48,
    height: 48,
    borderRadius: 24,
    justifyContent: "center",
    alignItems: "center",
    backgroundColor: "transparent",
  },

  userInitials: {
    color: colors.background,
    fontWeight: "600",
    fontSize: 14,
  },
});
