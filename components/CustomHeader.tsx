import React, { useEffect, useRef } from "react";
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
import { useUser } from "../hooks/useUser";
import { NativeStackNavigationProp } from "@react-navigation/native-stack";
import { colors } from "../theme/colors";
import { AnimatedHeader } from "./AnimatedHeader";

type RootStackParamList = {
  HomeScreen: undefined;
  Pantry: undefined;
  BarcodeScreen: undefined;
  Account: undefined;
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

  // Header animation values
  const headerHeight =
    scrollY?.interpolate({
      inputRange: [0, 60],
      outputRange: [120, 60],
      extrapolate: "clamp",
    }) || new Animated.Value(120);

  const headerTranslateY = scrollY || new Animated.Value(0);

  // Opacity for the title and other elements
  const headerOpacity =
    scrollY?.interpolate({
      inputRange: [0, 30, 60],
      outputRange: [1, 0.5, 0],
      extrapolate: "clamp",
    }) || new Animated.Value(1);

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
              onPress={() => navigation.navigate('HomeScreen' as never)}
              style={styles.basketButton}
            >
              <Ionicons name="basket" size={24} color={colors.primary} />
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
        <View style={[
          styles.headerContainer,
          { paddingTop: Platform.OS === "ios" ? 40 : 10 }
        ]}>
          {headerContent}
        </View>
      </View>
    );
  }

  return (
    <View style={styles.staticHeader}>
      <AnimatedHeader
        scrollY={scrollY}
        headerMaxHeight={60}
        headerMinHeight={44}
        style={{
          backgroundColor: 'transparent',
          ...Platform.select({
            android: {
              elevation: 4,
            },
            ios: {
              shadowColor: "#000",
              shadowOffset: { width: 0, height: 2 },
              shadowOpacity: 0.1,
              shadowRadius: 4,
            },
          }),
        }}
      >
        {headerContent}
      </AnimatedHeader>
    </View>
  );
};

const styles = StyleSheet.create({
  // Header container styles
  staticHeader: {
    width: "100%",
    backgroundColor: colors.background,
    borderBottomWidth: 2,
    borderBottomColor: colors.primary,
  },
  
  // Inner header container
  headerContainer: {
    width: '100%',
    paddingHorizontal: 16,
    paddingBottom: 8,
    display: 'flex',
    flexDirection: 'row',
    alignItems: 'baseline',
    justifyContent: 'space-between',
  },

  // Header content styles
  headerContent: {
    width: "100%",
  },

  // Avatar styles
  avatarContainer: {
    width: 32,
    height: 32,
    borderRadius: 16,
    backgroundColor: colors.primary,
    justifyContent: 'center',
    alignItems: 'center',
    marginLeft: 16,
  },

  avatarText: {
    color: colors.background,
    fontWeight: '600',
    fontSize: 12,
  },

  // Title styles
  titleContainer: {
    paddingHorizontal: 16,
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
    paddingBottom: 8,
  },
  
  leftContainer: {
    flexDirection: 'row',
    alignItems: 'center',
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
    padding: 5,
    marginRight: 10,
  },
  
  basketButton: {
    padding: 5,
  },

  // User account button
  accountButton: {
    flexDirection: "row",
    alignItems: "center",
    gap: 8,
  },

  userInitialsContainer: {
    width: 36,
    height: 36,
    borderRadius: 18,
    backgroundColor: colors.primaryLight,
    justifyContent: "center",
    alignItems: "center",
  },

  userInitials: {
    color: colors.background,
    fontWeight: "600",
    fontSize: 14,
  },
});
