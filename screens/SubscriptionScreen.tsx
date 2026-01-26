/**
 * SubscriptionScreen
 *
 * Editorial-style paywall screen for Mangia Pro subscription.
 * Matches the HTML prototype with hero image, benefits list, and plan selector.
 */

import React, { useState, useCallback } from 'react';
import {
  View,
  Text,
  StyleSheet,
  ScrollView,
  TouchableOpacity,
  Image,
  Alert,
  ActivityIndicator,
  Platform,
  Dimensions,
} from 'react-native';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { useNavigation } from '@react-navigation/native';
import { BlurView } from 'expo-blur';
import { Feather } from '@expo/vector-icons';
import { PurchasesPackage } from 'react-native-purchases';
import Animated, { FadeIn, FadeInDown, FadeInUp } from 'react-native-reanimated';
import { mangiaColors } from '../theme/tokens/colors';
import { useSubscription } from '../contexts/SubscriptionContext';
import { formatPrice, getSubscriptionPeriod } from '../lib/revenuecat';

const { width: SCREEN_WIDTH } = Dimensions.get('window');

// Paywall benefits
const BENEFITS = [
  {
    id: 'unlimited',
    icon: 'layers' as const,
    iconBg: `${mangiaColors.sage}33`,
    iconColor: mangiaColors.sage,
    title: 'Unlimited Recipes',
    description: 'Save as many as you can cook.',
  },
  {
    id: 'family',
    icon: 'users' as const,
    iconBg: `${mangiaColors.terracotta}33`,
    iconColor: mangiaColors.terracotta,
    title: 'Family Sharing',
    description: 'Sync grocery lists with your partner.',
  },
  {
    id: 'scan',
    icon: 'search' as const,
    iconBg: `${mangiaColors.deepBrown}1A`,
    iconColor: mangiaColors.deepBrown,
    title: 'Scan Cookbooks',
    description: 'Digitize your physical books instantly.',
  },
];

export default function SubscriptionScreen() {
  const navigation = useNavigation();
  const insets = useSafeAreaInsets();
  const { isPremium, isLoading, packages, purchase, restore } = useSubscription();

  const [selectedPlan, setSelectedPlan] = useState<'annual' | 'monthly'>('annual');
  const [isPurchasing, setIsPurchasing] = useState(false);
  const [isRestoring, setIsRestoring] = useState(false);

  const annualPackage = packages.find(p => p.identifier.includes('yearly') || p.identifier.includes('annual'));
  const monthlyPackage = packages.find(p => p.identifier.includes('monthly'));

  const handlePurchase = useCallback(async () => {
    const pkg = selectedPlan === 'annual' ? annualPackage : monthlyPackage;
    if (!pkg) {
      Alert.alert('Plan Unavailable', 'Selected plan is not available.');
      return;
    }

    setIsPurchasing(true);
    try {
      const success = await purchase(pkg);
      if (success) {
        Alert.alert(
          'Welcome to Mangia Pro!',
          'You now have access to all premium features.',
          [{ text: "Let's Cook!", onPress: () => navigation.goBack() }]
        );
      }
    } catch (error: any) {
      Alert.alert(
        'Purchase Failed',
        error.message || 'There was an error processing your purchase.'
      );
    } finally {
      setIsPurchasing(false);
    }
  }, [selectedPlan, annualPackage, monthlyPackage, purchase, navigation]);

  const handleRestore = useCallback(async () => {
    setIsRestoring(true);
    try {
      const restored = await restore();
      if (restored) {
        Alert.alert(
          'Purchases Restored',
          'Your premium subscription has been restored.',
          [{ text: 'Great!', onPress: () => navigation.goBack() }]
        );
      } else {
        Alert.alert(
          'No Purchases Found',
          "We couldn't find any previous purchases to restore."
        );
      }
    } catch (error: any) {
      Alert.alert(
        'Restore Failed',
        error.message || 'There was an error restoring your purchases.'
      );
    } finally {
      setIsRestoring(false);
    }
  }, [restore, navigation]);

  const handleClose = () => {
    navigation.goBack();
  };

  // Already premium - show success state
  if (isPremium) {
    return (
      <View style={[styles.container, { paddingTop: insets.top }]}>
        <Animated.View entering={FadeIn.duration(400)} style={styles.successContainer}>
          <View style={styles.successIcon}>
            <Feather name="award" size={48} color={mangiaColors.terracotta} />
          </View>
          <Text style={styles.successTitle}>You're Premium!</Text>
          <Text style={styles.successText}>
            You have access to all Mangia Pro features.
          </Text>
          <TouchableOpacity style={styles.doneButton} onPress={handleClose}>
            <Text style={styles.doneButtonText}>Done</Text>
          </TouchableOpacity>
        </Animated.View>
      </View>
    );
  }

  // Loading state
  if (isLoading) {
    return (
      <View style={[styles.container, styles.loadingContainer]}>
        <ActivityIndicator size="large" color={mangiaColors.terracotta} />
        <Text style={styles.loadingText}>Loading plans...</Text>
      </View>
    );
  }

  return (
    <View style={styles.container}>
      <ScrollView
        style={styles.scrollView}
        contentContainerStyle={styles.scrollContent}
        showsVerticalScrollIndicator={false}
        bounces={false}
      >
        {/* Hero Image Area */}
        <View style={styles.heroArea}>
          <Image
            source={{ uri: 'https://media.screensdesign.com/gasset/ddf8db0d-e34a-434d-a794-5db488564e1b.png' }}
            style={styles.heroImage}
            resizeMode="cover"
          />
          <View style={styles.heroOverlay} />

          {/* Close Button */}
          <TouchableOpacity
            style={[styles.closeButton, { top: insets.top + 8 }]}
            onPress={handleClose}
            activeOpacity={0.8}
          >
            <BlurView intensity={40} tint="light" style={styles.closeButtonBlur}>
              <Feather name="x" size={18} color="white" />
            </BlurView>
          </TouchableOpacity>

          {/* Mangia Pro Badge */}
          <View style={styles.proBadge}>
            <Text style={styles.proBadgeText}>Mangia Pro</Text>
          </View>
        </View>

        {/* Content */}
        <View style={styles.content}>
          {/* Headline */}
          <Animated.View
            entering={FadeInDown.delay(100).duration(400)}
            style={styles.headline}
          >
            <Text style={styles.headlineText}>
              Become the Head Chef{'\n'}of Your Kitchen
            </Text>
          </Animated.View>

          {/* Benefits List */}
          <Animated.View
            entering={FadeInDown.delay(200).duration(400)}
            style={styles.benefits}
          >
            {BENEFITS.map((benefit, index) => (
              <View key={benefit.id} style={styles.benefitItem}>
                <View style={[styles.benefitIcon, { backgroundColor: benefit.iconBg }]}>
                  <Feather name={benefit.icon} size={20} color={benefit.iconColor} />
                </View>
                <View style={styles.benefitText}>
                  <Text style={styles.benefitTitle}>{benefit.title}</Text>
                  <Text style={styles.benefitDescription}>{benefit.description}</Text>
                </View>
              </View>
            ))}
          </Animated.View>
        </View>
      </ScrollView>

      {/* Sticky Footer */}
      <Animated.View
        entering={FadeInUp.delay(300).duration(400)}
        style={[styles.footer, { paddingBottom: insets.bottom + 16 }]}
      >
        {/* Plan Selector */}
        <View style={styles.planSelector}>
          {/* Annual Plan */}
          <TouchableOpacity
            style={[
              styles.planCard,
              selectedPlan === 'annual' && styles.planCardSelected,
            ]}
            onPress={() => setSelectedPlan('annual')}
            activeOpacity={0.9}
          >
            <View style={styles.bestValueBadge}>
              <Text style={styles.bestValueText}>Best Value</Text>
            </View>
            <Text style={[
              styles.planLabel,
              selectedPlan === 'annual' && styles.planLabelSelected,
            ]}>
              Annual
            </Text>
            <View style={styles.planPriceRow}>
              <Text style={[
                styles.planPrice,
                selectedPlan === 'annual' && styles.planPriceSelected,
              ]}>
                {annualPackage ? formatPrice(annualPackage) : '$29.99'}
              </Text>
              <Text style={[
                styles.planPeriod,
                selectedPlan === 'annual' && styles.planPeriodSelected,
              ]}>
                /year
              </Text>
            </View>
            <View style={[
              styles.trialBadge,
              selectedPlan === 'annual' && styles.trialBadgeSelected,
            ]}>
              <Text style={styles.trialText}>7 days free</Text>
            </View>
          </TouchableOpacity>

          {/* Monthly Plan */}
          <TouchableOpacity
            style={[
              styles.planCard,
              styles.planCardOutlined,
              selectedPlan === 'monthly' && styles.planCardSelected,
            ]}
            onPress={() => setSelectedPlan('monthly')}
            activeOpacity={0.9}
          >
            <Text style={[
              styles.planLabel,
              styles.planLabelOutlined,
              selectedPlan === 'monthly' && styles.planLabelSelected,
            ]}>
              Monthly
            </Text>
            <View style={styles.planPriceRow}>
              <Text style={[
                styles.planPrice,
                styles.planPriceOutlined,
                selectedPlan === 'monthly' && styles.planPriceSelected,
              ]}>
                {monthlyPackage ? formatPrice(monthlyPackage) : '$4.99'}
              </Text>
              <Text style={[
                styles.planPeriod,
                styles.planPeriodOutlined,
                selectedPlan === 'monthly' && styles.planPeriodSelected,
              ]}>
                /mo
              </Text>
            </View>
          </TouchableOpacity>
        </View>

        {/* Subscribe Button */}
        <TouchableOpacity
          style={[styles.subscribeButton, (isPurchasing || isRestoring) && styles.buttonDisabled]}
          onPress={handlePurchase}
          disabled={isPurchasing || isRestoring}
          activeOpacity={0.9}
        >
          {isPurchasing ? (
            <ActivityIndicator color={mangiaColors.cream} />
          ) : (
            <Text style={styles.subscribeButtonText}>Start 7-Day Free Trial</Text>
          )}
        </TouchableOpacity>

        {/* Restore Purchases */}
        <TouchableOpacity
          style={styles.restoreButton}
          onPress={handleRestore}
          disabled={isPurchasing || isRestoring}
        >
          <Text style={styles.restoreText}>
            {isRestoring ? 'Restoring...' : 'Restore Purchases'}
          </Text>
        </TouchableOpacity>

        {/* Legal Text */}
        <Text style={styles.legalText}>
          Auto-renews. Cancel anytime in Settings.
        </Text>
      </Animated.View>
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: mangiaColors.cream,
  },
  scrollView: {
    flex: 1,
  },
  scrollContent: {
    paddingBottom: 300, // Space for sticky footer
  },
  loadingContainer: {
    justifyContent: 'center',
    alignItems: 'center',
  },
  loadingText: {
    marginTop: 16,
    fontSize: 16,
    color: mangiaColors.brown,
  },

  // Hero
  heroArea: {
    height: 280,
    position: 'relative',
  },
  heroImage: {
    width: '100%',
    height: '100%',
    borderBottomLeftRadius: 60,
    borderBottomRightRadius: 60,
  },
  heroOverlay: {
    ...StyleSheet.absoluteFillObject,
    backgroundColor: 'rgba(0,0,0,0.2)',
    borderBottomLeftRadius: 60,
    borderBottomRightRadius: 60,
  },
  closeButton: {
    position: 'absolute',
    right: 24,
    zIndex: 10,
  },
  closeButtonBlur: {
    width: 32,
    height: 32,
    borderRadius: 16,
    alignItems: 'center',
    justifyContent: 'center',
    overflow: 'hidden',
  },
  proBadge: {
    position: 'absolute',
    bottom: -16,
    alignSelf: 'center',
    backgroundColor: mangiaColors.dark,
    paddingHorizontal: 24,
    paddingVertical: 8,
    borderRadius: 999,
    borderWidth: 2,
    borderColor: mangiaColors.cream,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.2,
    shadowRadius: 8,
    elevation: 4,
  },
  proBadgeText: {
    fontFamily: 'Georgia',
    fontSize: 18,
    fontWeight: '700',
    color: mangiaColors.cream,
    letterSpacing: 1,
  },

  // Content
  content: {
    paddingHorizontal: 24,
    paddingTop: 40,
  },
  headline: {
    alignItems: 'center',
    marginBottom: 32,
  },
  headlineText: {
    fontFamily: 'Georgia',
    fontSize: 28,
    lineHeight: 34,
    color: mangiaColors.dark,
    textAlign: 'center',
  },

  // Benefits
  benefits: {
    gap: 16,
  },
  benefitItem: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: 'white',
    padding: 16,
    borderRadius: 16,
    borderWidth: 1,
    borderColor: mangiaColors.creamDark,
    gap: 16,
  },
  benefitIcon: {
    width: 40,
    height: 40,
    borderRadius: 20,
    alignItems: 'center',
    justifyContent: 'center',
  },
  benefitText: {
    flex: 1,
  },
  benefitTitle: {
    fontSize: 14,
    fontWeight: '700',
    color: mangiaColors.dark,
    marginBottom: 2,
  },
  benefitDescription: {
    fontSize: 12,
    color: mangiaColors.brown,
  },

  // Footer
  footer: {
    position: 'absolute',
    bottom: 0,
    left: 0,
    right: 0,
    backgroundColor: 'white',
    borderTopLeftRadius: 32,
    borderTopRightRadius: 32,
    paddingHorizontal: 24,
    paddingTop: 24,
    borderTopWidth: 1,
    borderTopColor: mangiaColors.creamDark,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: -8 },
    shadowOpacity: 0.1,
    shadowRadius: 16,
    elevation: 8,
  },

  // Plan Selector
  planSelector: {
    flexDirection: 'row',
    gap: 16,
    marginBottom: 24,
  },
  planCard: {
    flex: 1,
    backgroundColor: mangiaColors.terracotta,
    padding: 16,
    borderRadius: 16,
    borderWidth: 2,
    borderColor: mangiaColors.terracotta,
    position: 'relative',
  },
  planCardOutlined: {
    backgroundColor: 'white',
    borderColor: mangiaColors.creamDark,
  },
  planCardSelected: {
    borderColor: mangiaColors.terracotta,
  },
  bestValueBadge: {
    position: 'absolute',
    top: -12,
    right: 8,
    backgroundColor: mangiaColors.creamDark,
    paddingHorizontal: 8,
    paddingVertical: 4,
    borderRadius: 999,
  },
  bestValueText: {
    fontSize: 10,
    fontWeight: '700',
    color: mangiaColors.dark,
    textTransform: 'uppercase',
    letterSpacing: 1,
  },
  planLabel: {
    fontSize: 14,
    fontWeight: '700',
    color: 'rgba(255,255,255,0.9)',
    marginBottom: 4,
  },
  planLabelOutlined: {
    color: mangiaColors.brown,
  },
  planLabelSelected: {
    color: 'white',
  },
  planPriceRow: {
    flexDirection: 'row',
    alignItems: 'baseline',
  },
  planPrice: {
    fontFamily: 'Georgia',
    fontSize: 24,
    color: 'white',
  },
  planPriceOutlined: {
    color: mangiaColors.dark,
  },
  planPriceSelected: {
    color: 'white',
  },
  planPeriod: {
    fontSize: 12,
    color: 'rgba(255,255,255,0.8)',
    marginLeft: 4,
  },
  planPeriodOutlined: {
    color: mangiaColors.brown,
  },
  planPeriodSelected: {
    color: 'rgba(255,255,255,0.8)',
  },
  trialBadge: {
    marginTop: 8,
    backgroundColor: 'rgba(0,0,0,0.2)',
    paddingHorizontal: 8,
    paddingVertical: 4,
    borderRadius: 8,
    alignSelf: 'flex-start',
  },
  trialBadgeSelected: {
    backgroundColor: 'rgba(0,0,0,0.2)',
  },
  trialText: {
    fontSize: 10,
    color: 'white',
  },

  // Subscribe Button
  subscribeButton: {
    height: 56,
    backgroundColor: mangiaColors.dark,
    borderRadius: 999,
    alignItems: 'center',
    justifyContent: 'center',
    marginBottom: 12,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.2,
    shadowRadius: 8,
    elevation: 4,
  },
  buttonDisabled: {
    opacity: 0.7,
  },
  subscribeButtonText: {
    fontSize: 18,
    fontWeight: '600',
    color: mangiaColors.cream,
  },

  // Restore
  restoreButton: {
    alignItems: 'center',
    paddingVertical: 8,
    marginBottom: 8,
  },
  restoreText: {
    fontSize: 14,
    color: mangiaColors.terracotta,
    fontWeight: '500',
  },

  // Legal
  legalText: {
    fontSize: 10,
    color: mangiaColors.brown,
    opacity: 0.6,
    textAlign: 'center',
  },

  // Success State
  successContainer: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
    padding: 32,
  },
  successIcon: {
    width: 96,
    height: 96,
    borderRadius: 48,
    backgroundColor: `${mangiaColors.terracotta}20`,
    alignItems: 'center',
    justifyContent: 'center',
    marginBottom: 24,
  },
  successTitle: {
    fontFamily: 'Georgia',
    fontSize: 28,
    color: mangiaColors.dark,
    marginBottom: 12,
  },
  successText: {
    fontSize: 16,
    color: mangiaColors.brown,
    textAlign: 'center',
    marginBottom: 32,
  },
  doneButton: {
    backgroundColor: mangiaColors.terracotta,
    paddingHorizontal: 48,
    paddingVertical: 16,
    borderRadius: 999,
  },
  doneButtonText: {
    fontSize: 16,
    fontWeight: '600',
    color: 'white',
  },
});
