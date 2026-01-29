/**
 * OnboardingScreen
 *
 * Three-step onboarding flow with editorial design:
 * 1. Problem/Solution - Screenshot chaos messaging
 * 2. Features - Import, Plan, Cook benefits
 * 3. Get Started - Social auth entry point
 */

import React, { useState, useRef, useCallback } from 'react';
import {
  View,
  Text,
  StyleSheet,
  Dimensions,
  TouchableOpacity,
  Platform,
} from 'react-native';
import { Image } from 'expo-image';
import { FlashList, ViewToken } from '@shopify/flash-list';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { LinearGradient } from 'expo-linear-gradient';
import { Feather } from '@expo/vector-icons';
import Animated, {
  FadeIn,
  FadeInDown,
  FadeInUp,
} from 'react-native-reanimated';
import AsyncStorage from '@react-native-async-storage/async-storage';
import { mangiaColors } from '../theme/tokens/colors';
import { PaginationDots, FeatureCard, SocialProofPill } from '../components/onboarding';

const { width: SCREEN_WIDTH, height: SCREEN_HEIGHT } = Dimensions.get('window');

const ONBOARDING_COMPLETE_KEY = '@mangia_onboarding_complete';

interface OnboardingScreenProps {
  onComplete: () => void;
}

export function OnboardingScreen({ onComplete }: OnboardingScreenProps) {
  const insets = useSafeAreaInsets();
  const [currentPage, setCurrentPage] = useState(0);
  const flashListRef = useRef<any>(null);

  const handleSkip = useCallback(async () => {
    await AsyncStorage.setItem(ONBOARDING_COMPLETE_KEY, 'true');
    onComplete();
  }, [onComplete]);

  const handleNext = useCallback(() => {
    if (currentPage < 2) {
      flashListRef.current?.scrollToIndex({ index: currentPage + 1, animated: true });
    }
  }, [currentPage]);

  const handleBack = useCallback(() => {
    if (currentPage > 0) {
      flashListRef.current?.scrollToIndex({ index: currentPage - 1, animated: true });
    }
  }, [currentPage]);

  const onViewableItemsChanged = useRef(
    ({ viewableItems }: { viewableItems: ViewToken<number>[] }) => {
      if (viewableItems.length > 0 && viewableItems[0].index !== null) {
        setCurrentPage(viewableItems[0].index);
      }
    }
  ).current;

  const renderPage = ({ item, index }: { item: number; index: number }) => {
    switch (index) {
      case 0:
        return <ProblemSolutionPage onSkip={handleSkip} onNext={handleNext} currentPage={currentPage} />;
      case 1:
        return <FeaturesPage onSkip={handleSkip} onBack={handleBack} onNext={handleNext} currentPage={currentPage} />;
      case 2:
        return <GetStartedPage onComplete={handleSkip} currentPage={currentPage} />;
      default:
        return null;
    }
  };

  return (
    <View style={styles.container}>
      <FlashList
        ref={flashListRef}
        data={[0, 1, 2]}
        renderItem={renderPage}
        horizontal
        pagingEnabled
        showsHorizontalScrollIndicator={false}
        onViewableItemsChanged={onViewableItemsChanged}
        viewabilityConfig={{ viewAreaCoveragePercentThreshold: 50 }}
        scrollEnabled={true}
      />
    </View>
  );
}

// Page 1: Problem/Solution
function ProblemSolutionPage({
  onSkip,
  onNext,
  currentPage,
}: {
  onSkip: () => void;
  onNext: () => void;
  currentPage: number;
}) {
  const insets = useSafeAreaInsets();

  return (
    <View style={[styles.page, { backgroundColor: mangiaColors.cream }]}>
      {/* Header with Skip */}
      <View style={[styles.header, { paddingTop: insets.top + 16 }]}>
        <View style={{ width: 40 }} />
        <TouchableOpacity onPress={onSkip}>
          <Text style={styles.skipText}>Skip</Text>
        </TouchableOpacity>
      </View>

      {/* Content */}
      <View style={styles.problemContent}>
        {/* Decorative Background Shapes */}
        <View style={styles.decorCircle1} />
        <View style={styles.decorShape2} />

        {/* Hero Image with Poster Frame */}
        <Animated.View
          entering={FadeInDown.delay(100).duration(500)}
          style={styles.posterFrame}
        >
          <Image
            source={{ uri: 'https://media.screensdesign.com/gasset/c03e7860-f9b6-4826-b435-601e0ca84c9f.png' }}
            style={styles.posterImage}
            contentFit="cover"
          />
          {/* Sticker Badge */}
          <View style={styles.stickerBadge}>
            <Text style={styles.stickerText}>No More{'\n'}Mess</Text>
          </View>
        </Animated.View>

        {/* Text Content */}
        <Animated.View
          entering={FadeInUp.delay(300).duration(500)}
          style={styles.textContent}
        >
          <Text style={styles.headline}>
            Stop the <Text style={styles.headlineAccent}>screenshot</Text> chaos.
          </Text>
          <Text style={styles.bodyText}>
            Your recipes are scattered everywhere. We bring them home to one beautiful kitchen.
          </Text>
        </Animated.View>
      </View>

      {/* Footer */}
      <View style={[styles.footer, { paddingBottom: insets.bottom + 24 }]}>
        <PaginationDots totalPages={3} currentPage={currentPage} />
        <TouchableOpacity style={styles.primaryButton} onPress={onNext} activeOpacity={0.9}>
          <Text style={styles.primaryButtonText}>Organize My Kitchen</Text>
        </TouchableOpacity>
      </View>
    </View>
  );
}

// Page 2: Features
function FeaturesPage({
  onSkip,
  onBack,
  onNext,
  currentPage,
}: {
  onSkip: () => void;
  onBack: () => void;
  onNext: () => void;
  currentPage: number;
}) {
  const insets = useSafeAreaInsets();

  return (
    <View style={[styles.page, { backgroundColor: mangiaColors.cream }]}>
      {/* Header */}
      <View style={[styles.header, { paddingTop: insets.top + 16 }]}>
        <TouchableOpacity
          style={styles.backButton}
          onPress={onBack}
          activeOpacity={0.7}
        >
          <Feather name="arrow-left" size={20} color={mangiaColors.dark} />
        </TouchableOpacity>
        <TouchableOpacity onPress={onSkip}>
          <Text style={styles.skipText}>Skip</Text>
        </TouchableOpacity>
      </View>

      {/* Content */}
      <View style={styles.featuresContent}>
        {/* Headline */}
        <Animated.View
          entering={FadeInDown.delay(100).duration(400)}
          style={styles.featuresHeadline}
        >
          <Text style={styles.featuresTitle}>
            Import, Plan,{'\n'}
            <Text style={styles.featuresTitleAccent}>Cook.</Text>
          </Text>
          <Text style={styles.featuresSubtitle}>
            Everything you need to master your meals.
          </Text>
        </Animated.View>

        {/* Feature Cards */}
        <Animated.View
          entering={FadeInUp.delay(200).duration(400)}
          style={styles.featureCards}
        >
          <FeatureCard
            icon="link"
            iconBackground={mangiaColors.cream}
            iconColor={mangiaColors.terracotta}
            iconBorderColor={mangiaColors.terracotta}
            title="Save from URLs"
            description="Paste any link from TikTok or blogs. We'll strip the clutter instantly."
            smallCorner="tl"
          />
          <FeatureCard
            icon="award"
            iconBackground={mangiaColors.sage}
            iconColor="white"
            iconBorderColor={mangiaColors.dark}
            title="Hands-Free Mode"
            description="Big text and voice controls so you don't smudge your screen."
            smallCorner="tr"
          />
          <FeatureCard
            icon="calendar"
            iconBackground={mangiaColors.dark}
            iconColor={mangiaColors.cream}
            iconBorderColor={mangiaColors.sage}
            title="Smart Planning"
            description="Drag & drop recipes into your week and auto-generate grocery lists."
            smallCorner="bl"
          />
        </Animated.View>

        {/* Bottom Illustration */}
        <View style={styles.bottomIllustration}>
          <Image
            source={{ uri: 'https://media.screensdesign.com/gasset/372908e5-d724-4ad4-9306-ff82eec26ffe.png' }}
            style={styles.bottomImage}
            contentFit="cover"
          />
        </View>
      </View>

      {/* Footer */}
      <View style={[styles.footer, { paddingBottom: insets.bottom + 24 }]}>
        <PaginationDots totalPages={3} currentPage={currentPage} />
        <TouchableOpacity style={styles.primaryButton} onPress={onNext} activeOpacity={0.9}>
          <Text style={styles.primaryButtonText}>Continue</Text>
        </TouchableOpacity>
      </View>
    </View>
  );
}

// Page 3: Get Started
function GetStartedPage({
  onComplete,
  currentPage,
}: {
  onComplete: () => void;
  currentPage: number;
}) {
  const insets = useSafeAreaInsets();

  return (
    <View style={[styles.page, { backgroundColor: mangiaColors.terracotta }]}>
      {/* Hero Background Image */}
      <View style={styles.getStartedHero}>
        <Image
          source={{ uri: 'https://media.screensdesign.com/gasset/52b78b4b-80a2-4886-90ed-2b9b46a257f5.png' }}
          style={styles.heroImage}
          contentFit="cover"
        />
        <LinearGradient
          colors={['rgba(0,0,0,0.1)', mangiaColors.terracotta]}
          style={StyleSheet.absoluteFillObject}
        />
      </View>

      {/* Logo */}
      <View style={[styles.logoContainer, { paddingTop: insets.top + 32 }]}>
        <Text style={styles.logo}>Mangia.</Text>
      </View>

      {/* Bottom Sheet */}
      <View style={[styles.bottomSheet, { paddingBottom: insets.bottom + 24 }]}>
        {/* Social Proof Pill */}
        <View style={styles.socialProofContainer}>
          <SocialProofPill />
        </View>

        {/* Text */}
        <Animated.View
          entering={FadeInUp.delay(100).duration(400)}
          style={styles.getStartedText}
        >
          <Text style={styles.getStartedTitle}>
            Start Cooking{'\n'}Better Today.
          </Text>
          <Text style={styles.getStartedSubtitle}>
            Join Mangia to collect, organize, and cook your favorite recipes with ease.
          </Text>
        </Animated.View>

        {/* Auth Buttons */}
        <Animated.View
          entering={FadeInUp.delay(200).duration(400)}
          style={styles.authButtons}
        >
          <TouchableOpacity
            style={styles.appleButton}
            onPress={onComplete}
            activeOpacity={0.9}
          >
            <Feather name="command" size={24} color="white" />
            <Text style={styles.appleButtonText}>Continue with Apple</Text>
          </TouchableOpacity>

          <TouchableOpacity
            style={styles.googleButton}
            onPress={onComplete}
            activeOpacity={0.9}
          >
            <View style={styles.googleIcon}>
              <Text style={{ fontSize: 18 }}>G</Text>
            </View>
            <Text style={styles.googleButtonText}>Continue with Google</Text>
          </TouchableOpacity>
        </Animated.View>

        {/* Terms */}
        <Text style={styles.termsText}>
          By continuing, you agree to our Terms of Service{'\n'}and Privacy Policy.
        </Text>
      </View>
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
  },
  page: {
    width: SCREEN_WIDTH,
    flex: 1,
  },

  // Header
  header: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    paddingHorizontal: 24,
    zIndex: 20,
  },
  skipText: {
    fontSize: 14,
    fontWeight: '600',
    color: mangiaColors.terracotta,
    textTransform: 'uppercase',
    letterSpacing: 1,
  },
  backButton: {
    width: 40,
    height: 40,
    borderRadius: 20,
    backgroundColor: mangiaColors.creamDark,
    alignItems: 'center',
    justifyContent: 'center',
  },

  // Problem/Solution Page
  problemContent: {
    flex: 1,
    alignItems: 'center',
    justifyContent: 'center',
    paddingHorizontal: 24,
    position: 'relative',
  },
  decorCircle1: {
    position: 'absolute',
    top: 80,
    left: -40,
    width: 160,
    height: 160,
    borderRadius: 80,
    backgroundColor: mangiaColors.creamDark,
    opacity: 0.6,
  },
  decorShape2: {
    position: 'absolute',
    top: '25%',
    right: -20,
    width: 128,
    height: 128,
    borderBottomLeftRadius: 60,
    borderTopLeftRadius: 20,
    borderTopRightRadius: 10,
    borderBottomRightRadius: 10,
    backgroundColor: mangiaColors.sage,
    opacity: 0.2,
  },
  posterFrame: {
    width: '100%',
    aspectRatio: 4 / 5,
    maxHeight: SCREEN_HEIGHT * 0.45,
    borderWidth: 4,
    borderColor: mangiaColors.dark,
    borderTopLeftRadius: 140,
    borderTopRightRadius: 140,
    borderBottomLeftRadius: 40,
    borderBottomRightRadius: 40,
    overflow: 'hidden',
    transform: [{ rotate: '-2deg' }],
    backgroundColor: 'white',
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 10 },
    shadowOpacity: 0.2,
    shadowRadius: 20,
    elevation: 10,
    marginBottom: 32,
  },
  posterImage: {
    width: '100%',
    height: '100%',
  },
  stickerBadge: {
    position: 'absolute',
    bottom: -24,
    right: -8,
    width: 96,
    height: 96,
    borderRadius: 48,
    backgroundColor: mangiaColors.terracotta,
    alignItems: 'center',
    justifyContent: 'center',
    transform: [{ rotate: '12deg' }],
    borderWidth: 2,
    borderColor: 'white',
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.2,
    shadowRadius: 8,
    elevation: 4,
  },
  stickerText: {
    color: 'white',
    fontSize: 12,
    fontWeight: '700',
    textTransform: 'uppercase',
    letterSpacing: 1,
    textAlign: 'center',
    lineHeight: 16,
  },
  textContent: {
    alignItems: 'center',
    maxWidth: 320,
  },
  headline: {
    fontFamily: 'Georgia',
    fontSize: 32,
    lineHeight: 36,
    color: mangiaColors.dark,
    textAlign: 'center',
    marginBottom: 16,
  },
  headlineAccent: {
    fontStyle: 'italic',
    color: mangiaColors.terracotta,
  },
  bodyText: {
    fontSize: 18,
    lineHeight: 26,
    color: mangiaColors.brown,
    textAlign: 'center',
  },

  // Features Page
  featuresContent: {
    flex: 1,
    paddingHorizontal: 24,
    paddingTop: 16,
  },
  featuresHeadline: {
    alignItems: 'center',
    marginBottom: 24,
  },
  featuresTitle: {
    fontFamily: 'Georgia',
    fontSize: 36,
    lineHeight: 40,
    color: mangiaColors.dark,
    textAlign: 'center',
  },
  featuresTitleAccent: {
    color: mangiaColors.sage,
    fontStyle: 'italic',
  },
  featuresSubtitle: {
    fontSize: 16,
    color: mangiaColors.brown,
    textAlign: 'center',
    marginTop: 8,
  },
  featureCards: {
    gap: 20,
  },
  bottomIllustration: {
    marginTop: 'auto',
    height: 128,
    backgroundColor: mangiaColors.creamDark,
    borderTopLeftRadius: 40,
    borderTopRightRadius: 40,
    overflow: 'hidden',
  },
  bottomImage: {
    width: '100%',
    height: '100%',
    opacity: 0.9,
  },

  // Get Started Page
  getStartedHero: {
    position: 'absolute',
    top: 0,
    left: 0,
    right: 0,
    height: '60%',
  },
  heroImage: {
    width: '100%',
    height: '100%',
  },
  logoContainer: {
    alignItems: 'center',
    zIndex: 10,
  },
  logo: {
    fontFamily: 'Georgia',
    fontSize: 30,
    color: 'white',
    letterSpacing: 1,
  },
  bottomSheet: {
    position: 'absolute',
    bottom: 0,
    left: 0,
    right: 0,
    backgroundColor: mangiaColors.cream,
    borderTopLeftRadius: 40,
    borderTopRightRadius: 40,
    paddingHorizontal: 32,
    paddingTop: 40,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: -10 },
    shadowOpacity: 0.2,
    shadowRadius: 20,
    elevation: 10,
  },
  socialProofContainer: {
    position: 'absolute',
    top: -24,
    left: 0,
    right: 0,
    alignItems: 'center',
  },
  getStartedText: {
    alignItems: 'center',
    marginBottom: 32,
  },
  getStartedTitle: {
    fontFamily: 'Georgia',
    fontSize: 34,
    lineHeight: 40,
    color: mangiaColors.dark,
    textAlign: 'center',
    marginBottom: 12,
  },
  getStartedSubtitle: {
    fontSize: 18,
    lineHeight: 26,
    color: mangiaColors.brown,
    textAlign: 'center',
  },
  authButtons: {
    gap: 16,
    marginBottom: 24,
  },
  appleButton: {
    height: 56,
    backgroundColor: mangiaColors.dark,
    borderRadius: 999,
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    gap: 12,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.2,
    shadowRadius: 8,
    elevation: 4,
  },
  appleButtonText: {
    fontSize: 18,
    fontWeight: '600',
    color: 'white',
  },
  googleButton: {
    height: 56,
    backgroundColor: 'white',
    borderRadius: 999,
    borderWidth: 1,
    borderColor: mangiaColors.creamDark,
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    gap: 12,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.05,
    shadowRadius: 4,
    elevation: 2,
  },
  googleIcon: {
    width: 20,
    height: 20,
    alignItems: 'center',
    justifyContent: 'center',
  },
  googleButtonText: {
    fontSize: 18,
    fontWeight: '600',
    color: mangiaColors.dark,
  },
  termsText: {
    fontSize: 12,
    lineHeight: 18,
    color: mangiaColors.brown,
    opacity: 0.6,
    textAlign: 'center',
  },

  // Footer
  footer: {
    paddingHorizontal: 32,
    paddingTop: 24,
    alignItems: 'center',
    gap: 24,
    backgroundColor: mangiaColors.cream,
  },
  primaryButton: {
    width: '100%',
    height: 56,
    backgroundColor: mangiaColors.terracotta,
    borderRadius: 999,
    alignItems: 'center',
    justifyContent: 'center',
    borderWidth: 2,
    borderColor: mangiaColors.terracotta,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.2,
    shadowRadius: 8,
    elevation: 4,
  },
  primaryButtonText: {
    fontSize: 18,
    fontWeight: '600',
    color: 'white',
  },
});

// Export helper for checking onboarding status
export async function hasCompletedOnboarding(): Promise<boolean> {
  try {
    const value = await AsyncStorage.getItem(ONBOARDING_COMPLETE_KEY);
    return value === 'true';
  } catch {
    return false;
  }
}

export async function resetOnboarding(): Promise<void> {
  await AsyncStorage.removeItem(ONBOARDING_COMPLETE_KEY);
}
