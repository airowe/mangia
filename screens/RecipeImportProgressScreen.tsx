import React, { useEffect, useRef } from "react";
import {
  View,
  Text,
  StyleSheet,
  TouchableOpacity,
  Dimensions,
} from "react-native";
import { useNavigation, useRoute, RouteProp } from "@react-navigation/native";
import { StackNavigationProp } from "@react-navigation/stack";
import { MaterialCommunityIcons } from "@expo/vector-icons";
import Animated, {
  FadeIn,
  FadeInUp,
  useSharedValue,
  useAnimatedStyle,
  withTiming,
  withRepeat,
  withSequence,
  Easing,
} from "react-native-reanimated";
import { useSafeAreaInsets } from "react-native-safe-area-context";

import { mangiaColors } from "../theme/tokens/colors";
import { fontFamily } from "../theme/tokens/typography";

type RootStackParamList = {
  RecipeImportProgressScreen: {
    progress: number;
    statusText: string;
    onCancel?: () => void;
  };
  HomeScreen: undefined;
};

type NavigationProp = StackNavigationProp<RootStackParamList>;
type RouteProps = RouteProp<RootStackParamList, "RecipeImportProgressScreen">;

interface RecipeImportProgressScreenProps {
  progress?: number;
  statusText?: string;
  onCancel?: () => void;
}

const { width: SCREEN_WIDTH } = Dimensions.get("window");
const HERO_SIZE = 280;

export const RecipeImportProgressScreen: React.FC<
  RecipeImportProgressScreenProps
> = ({ progress: propProgress, statusText: propStatusText, onCancel: propOnCancel }) => {
  const navigation = useNavigation<NavigationProp>();
  const route = useRoute<RouteProps>();
  const insets = useSafeAreaInsets();

  // Get values from either props or route params
  const progress = propProgress ?? route.params?.progress ?? 65;
  const statusText = propStatusText ?? route.params?.statusText ?? "Extracting ingredients...";
  const onCancel = propOnCancel ?? route.params?.onCancel;

  // Animated values
  const progressWidth = useSharedValue(0);
  const pulseOpacity = useSharedValue(1);
  const floatY = useSharedValue(0);

  useEffect(() => {
    // Animate progress bar
    progressWidth.value = withTiming(progress, {
      duration: 1000,
      easing: Easing.out(Easing.cubic),
    });

    // Pulsing animation for status text
    pulseOpacity.value = withRepeat(
      withSequence(
        withTiming(0.4, { duration: 1000 }),
        withTiming(1, { duration: 1000 })
      ),
      -1,
      true
    );

    // Floating animation for hero illustration
    floatY.value = withRepeat(
      withSequence(
        withTiming(-10, { duration: 2000, easing: Easing.inOut(Easing.ease) }),
        withTiming(0, { duration: 2000, easing: Easing.inOut(Easing.ease) })
      ),
      -1,
      true
    );
  }, [progress]);

  const progressBarStyle = useAnimatedStyle(() => ({
    width: `${progressWidth.value}%`,
  }));

  const statusTextStyle = useAnimatedStyle(() => ({
    opacity: pulseOpacity.value,
  }));

  const floatingStyle = useAnimatedStyle(() => ({
    transform: [{ translateY: floatY.value }],
  }));

  const handleCancel = () => {
    if (onCancel) {
      onCancel();
    } else {
      navigation.goBack();
    }
  };

  return (
    <View style={styles.container}>
      {/* Main Content */}
      <View style={[styles.content, { paddingTop: insets.top + 40 }]}>
        {/* Header */}
        <Animated.View
          entering={FadeInUp.delay(100).duration(600)}
          style={styles.header}
        >
          <Text style={styles.headline}>Importing...</Text>
        </Animated.View>

        {/* Hero Illustration Area */}
        <Animated.View
          entering={FadeIn.delay(300).duration(600)}
          style={styles.heroContainer}
        >
          {/* Decorative blurred circle */}
          <View style={styles.decorativeCircle} />

          {/* Floating illustration placeholder */}
          <Animated.View style={[styles.heroContent, floatingStyle]}>
            {/* Placeholder illustration - ingredients floating into bowl */}
            <View style={styles.illustrationContainer}>
              <MaterialCommunityIcons
                name="bowl-mix-outline"
                size={80}
                color={mangiaColors.terracotta}
                style={styles.bowlIcon}
              />
              <Animated.View style={[styles.floatingIngredient, { top: 20, left: 40 }]}>
                <MaterialCommunityIcons
                  name="leaf"
                  size={28}
                  color={mangiaColors.sage}
                />
              </Animated.View>
              <Animated.View style={[styles.floatingIngredient, { top: 10, right: 50 }]}>
                <MaterialCommunityIcons
                  name="food-apple"
                  size={24}
                  color={mangiaColors.terracotta}
                />
              </Animated.View>
              <Animated.View style={[styles.floatingIngredient, { top: 50, left: 20 }]}>
                <MaterialCommunityIcons
                  name="egg-outline"
                  size={22}
                  color={mangiaColors.brown}
                />
              </Animated.View>
              <Animated.View style={[styles.floatingIngredient, { top: 40, right: 30 }]}>
                <MaterialCommunityIcons
                  name="bread-slice-outline"
                  size={26}
                  color={mangiaColors.creamDark}
                />
              </Animated.View>
            </View>
          </Animated.View>
        </Animated.View>

        {/* Progress Section */}
        <Animated.View
          entering={FadeInUp.delay(500).duration(600)}
          style={styles.progressSection}
        >
          <View style={styles.progressHeader}>
            <Animated.Text style={[styles.statusText, statusTextStyle]}>
              {statusText}
            </Animated.Text>
            <Text style={styles.percentageText}>{Math.round(progress)}%</Text>
          </View>

          {/* Progress Bar */}
          <View style={styles.progressTrack}>
            <Animated.View style={[styles.progressFill, progressBarStyle]} />
          </View>
        </Animated.View>
      </View>

      {/* Footer */}
      <View style={[styles.footer, { paddingBottom: insets.bottom + 24 }]}>
        <TouchableOpacity
          style={styles.cancelButton}
          onPress={handleCancel}
          activeOpacity={0.7}
        >
          <Text style={styles.cancelText}>Cancel Import</Text>
        </TouchableOpacity>
      </View>
    </View>
  );
};

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: mangiaColors.cream,
  },
  content: {
    flex: 1,
    alignItems: "center",
    justifyContent: "center",
    paddingHorizontal: 24,
  },
  header: {
    width: "100%",
    alignItems: "center",
    marginBottom: 40,
  },
  headline: {
    fontFamily: fontFamily.serif,
    fontSize: 40,
    fontWeight: "500",
    fontStyle: "italic",
    color: mangiaColors.dark,
    letterSpacing: -0.5,
    textAlign: "center",
  },
  heroContainer: {
    width: HERO_SIZE,
    height: HERO_SIZE,
    alignItems: "center",
    justifyContent: "center",
    marginBottom: 48,
  },
  decorativeCircle: {
    position: "absolute",
    width: HERO_SIZE * 1.1,
    height: HERO_SIZE * 1.1,
    borderRadius: HERO_SIZE * 0.55,
    backgroundColor: `${mangiaColors.terracotta}08`,
  },
  heroContent: {
    width: "100%",
    height: "100%",
    alignItems: "center",
    justifyContent: "center",
  },
  illustrationContainer: {
    width: 200,
    height: 200,
    alignItems: "center",
    justifyContent: "center",
    position: "relative",
  },
  bowlIcon: {
    position: "absolute",
    bottom: 40,
  },
  floatingIngredient: {
    position: "absolute",
  },
  progressSection: {
    width: "100%",
    maxWidth: 280,
    gap: 12,
  },
  progressHeader: {
    flexDirection: "row",
    justifyContent: "space-between",
    alignItems: "flex-end",
    paddingHorizontal: 4,
  },
  statusText: {
    fontFamily: fontFamily.serif,
    fontSize: 18,
    fontStyle: "italic",
    color: mangiaColors.brown,
  },
  percentageText: {
    fontFamily: fontFamily.bold,
    fontSize: 20,
    fontWeight: "700",
    color: mangiaColors.terracotta,
  },
  progressTrack: {
    width: "100%",
    height: 6,
    borderRadius: 3,
    backgroundColor: `${mangiaColors.taupe}40`,
    overflow: "hidden",
  },
  progressFill: {
    height: "100%",
    borderRadius: 3,
    backgroundColor: mangiaColors.terracotta,
  },
  footer: {
    width: "100%",
    alignItems: "center",
    paddingVertical: 8,
  },
  cancelButton: {
    paddingHorizontal: 24,
    paddingVertical: 12,
    borderRadius: 24,
  },
  cancelText: {
    fontFamily: fontFamily.semibold,
    fontSize: 14,
    fontWeight: "600",
    color: mangiaColors.taupe,
    letterSpacing: 1,
    textTransform: "uppercase",
  },
});

export default RecipeImportProgressScreen;
