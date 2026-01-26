/**
 * AuthScreen
 *
 * Sign in and sign up screen with modernized UI using the theme system.
 */

import React, { useState, useCallback } from 'react';
import {
  View,
  TextInput,
  Text,
  StyleSheet,
  KeyboardAvoidingView,
  Platform,
  TouchableOpacity,
  ActivityIndicator,
  Keyboard,
  TouchableWithoutFeedback,
  Alert,
} from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { useSignIn, useSignUp } from '@clerk/clerk-expo';
import Animated, {
  FadeIn,
  FadeInDown,
  FadeInUp,
} from 'react-native-reanimated';
import { Screen } from '../components/Screen';
import { useTheme } from '../theme';

export const AuthScreen = ({ navigation }: any) => {
  const { signIn, setActive: setSignInActive, isLoaded: signInLoaded } = useSignIn();
  const { signUp, setActive: setSignUpActive, isLoaded: signUpLoaded } = useSignUp();
  const { theme } = useTheme();
  const { colors, spacing, borderRadius } = theme;

  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [isLoading, setIsLoading] = useState(false);
  const [isSignUp, setIsSignUp] = useState(false);
  const [isPasswordVisible, setIsPasswordVisible] = useState(false);
  const [error, setError] = useState('');
  const [pendingVerification, setPendingVerification] = useState(false);
  const [code, setCode] = useState('');

  const handleSignIn = useCallback(async () => {
    if (!signInLoaded || !signIn) return;

    try {
      setIsLoading(true);
      setError('');

      const result = await signIn.create({
        identifier: email,
        password,
      });

      if (result.status === 'complete') {
        await setSignInActive({ session: result.createdSessionId });
      } else {
        console.log('Sign in result:', result);
        setError('Sign in incomplete. Please try again.');
      }
    } catch (err: any) {
      console.error('Sign in error:', err);
      const errorMessage = err.errors?.[0]?.longMessage || err.errors?.[0]?.message || 'Failed to sign in';
      setError(errorMessage);
    } finally {
      setIsLoading(false);
    }
  }, [signIn, signInLoaded, setSignInActive, email, password]);

  const handleSignUp = useCallback(async () => {
    if (!signUpLoaded || !signUp) return;

    try {
      setIsLoading(true);
      setError('');

      await signUp.create({
        emailAddress: email,
        password,
      });

      // Send email verification code
      await signUp.prepareEmailAddressVerification({ strategy: 'email_code' });

      setPendingVerification(true);
      Alert.alert('Verification Required', 'Check your email for a verification code.');
    } catch (err: any) {
      console.error('Sign up error:', err);
      const errorMessage = err.errors?.[0]?.longMessage || err.errors?.[0]?.message || 'Failed to sign up';
      setError(errorMessage);
    } finally {
      setIsLoading(false);
    }
  }, [signUp, signUpLoaded, email, password]);

  const handleVerification = useCallback(async () => {
    if (!signUpLoaded || !signUp) return;

    try {
      setIsLoading(true);
      setError('');

      const result = await signUp.attemptEmailAddressVerification({
        code,
      });

      if (result.status === 'complete') {
        await setSignUpActive({ session: result.createdSessionId });
      } else {
        console.log('Verification result:', result);
        setError('Verification incomplete. Please try again.');
      }
    } catch (err: any) {
      console.error('Verification error:', err);
      const errorMessage = err.errors?.[0]?.longMessage || err.errors?.[0]?.message || 'Invalid verification code';
      setError(errorMessage);
    } finally {
      setIsLoading(false);
    }
  }, [signUp, signUpLoaded, setSignUpActive, code]);

  const handleSubmit = () => {
    Keyboard.dismiss();
    if (pendingVerification) {
      handleVerification();
    } else if (isSignUp) {
      handleSignUp();
    } else {
      handleSignIn();
    }
  };

  // Verification code screen
  if (pendingVerification) {
    return (
      <Screen noPadding style={{ backgroundColor: colors.background }}>
        <TouchableWithoutFeedback onPress={Keyboard.dismiss} accessible={false}>
          <KeyboardAvoidingView
            style={styles.container}
            behavior={Platform.OS === 'ios' ? 'padding' : 'height'}
            keyboardVerticalOffset={Platform.OS === 'ios' ? 64 : 0}
          >
            <View style={styles.innerContainer}>
              <Animated.View
                entering={FadeInDown.duration(400)}
                style={styles.logoContainer}
              >
                <View
                  style={[
                    styles.iconContainer,
                    {
                      backgroundColor: colors.primaryLight,
                      borderRadius: borderRadius.xl,
                    },
                  ]}
                >
                  <Ionicons name="mail" size={40} color={colors.primary} />
                </View>
                <Text style={[styles.title, { color: colors.text }]}>
                  Verify Email
                </Text>
                <Text style={[styles.subtitle, { color: colors.textSecondary }]}>
                  Enter the code sent to {email}
                </Text>
              </Animated.View>

              {error ? (
                <Animated.View
                  entering={FadeIn.duration(200)}
                  style={[
                    styles.errorContainer,
                    { backgroundColor: colors.errorBackground },
                  ]}
                >
                  <Text style={[styles.errorText, { color: colors.error }]}>
                    {error}
                  </Text>
                </Animated.View>
              ) : null}

              <Animated.View
                entering={FadeInUp.delay(100).duration(400)}
                style={styles.formContainer}
              >
                <View style={styles.inputContainer}>
                  <Text style={[styles.label, { color: colors.text }]}>
                    Verification Code
                  </Text>
                  <View
                    style={[
                      styles.inputWrapper,
                      {
                        backgroundColor: colors.surface,
                        borderColor: colors.border,
                        borderRadius: borderRadius.md,
                      },
                    ]}
                  >
                    <TextInput
                      style={[styles.input, { color: colors.text }]}
                      placeholder="Enter 6-digit code"
                      placeholderTextColor={colors.textTertiary}
                      value={code}
                      onChangeText={setCode}
                      keyboardType="number-pad"
                      autoCapitalize="none"
                      autoCorrect={false}
                      editable={!isLoading}
                      maxLength={6}
                    />
                  </View>
                </View>

                <TouchableOpacity
                  style={[
                    styles.button,
                    {
                      backgroundColor: colors.primary,
                      borderRadius: borderRadius.md,
                    },
                    isLoading && styles.buttonDisabled,
                  ]}
                  onPress={handleSubmit}
                  disabled={isLoading}
                  activeOpacity={0.8}
                >
                  {isLoading ? (
                    <ActivityIndicator color={colors.textOnPrimary} />
                  ) : (
                    <Text
                      style={[styles.buttonText, { color: colors.textOnPrimary }]}
                    >
                      Verify
                    </Text>
                  )}
                </TouchableOpacity>

                <View style={styles.footer}>
                  <TouchableOpacity
                    onPress={() => {
                      setPendingVerification(false);
                      setCode('');
                      setError('');
                    }}
                    disabled={isLoading}
                  >
                    <Text style={[styles.footerLink, { color: colors.primary }]}>
                      Back to Sign Up
                    </Text>
                  </TouchableOpacity>
                </View>
              </Animated.View>
            </View>
          </KeyboardAvoidingView>
        </TouchableWithoutFeedback>
      </Screen>
    );
  }

  return (
    <Screen noPadding style={{ backgroundColor: colors.background }}>
      <TouchableWithoutFeedback onPress={Keyboard.dismiss} accessible={false}>
        <KeyboardAvoidingView
          style={styles.container}
          behavior={Platform.OS === 'ios' ? 'padding' : 'height'}
          keyboardVerticalOffset={Platform.OS === 'ios' ? 64 : 0}
        >
          <View style={styles.innerContainer}>
            <Animated.View
              entering={FadeInDown.duration(400)}
              style={styles.logoContainer}
            >
              <View
                style={[
                  styles.iconContainer,
                  {
                    backgroundColor: colors.primaryLight,
                    borderRadius: borderRadius.xl,
                  },
                ]}
              >
                <Ionicons name="restaurant" size={40} color={colors.primary} />
              </View>
              <Text style={[styles.title, { color: colors.text }]}>
                {isSignUp ? 'Create Account' : 'Welcome Back'}
              </Text>
              <Text style={[styles.subtitle, { color: colors.textSecondary }]}>
                {isSignUp ? 'Sign up to get started' : 'Sign in to continue'}
              </Text>
            </Animated.View>

            {error ? (
              <Animated.View
                entering={FadeIn.duration(200)}
                style={[
                  styles.errorContainer,
                  { backgroundColor: colors.errorBackground },
                ]}
              >
                <Text style={[styles.errorText, { color: colors.error }]}>
                  {error}
                </Text>
              </Animated.View>
            ) : null}

            <Animated.View
              entering={FadeInUp.delay(100).duration(400)}
              style={styles.formContainer}
            >
              <View style={styles.inputContainer}>
                <Text style={[styles.label, { color: colors.text }]}>Email</Text>
                <View
                  style={[
                    styles.inputWrapper,
                    {
                      backgroundColor: colors.surface,
                      borderColor: colors.border,
                      borderRadius: borderRadius.md,
                    },
                  ]}
                >
                  <TextInput
                    style={[styles.input, { color: colors.text }]}
                    placeholder="Enter your email"
                    placeholderTextColor={colors.textTertiary}
                    value={email}
                    onChangeText={setEmail}
                    keyboardType="email-address"
                    autoCapitalize="none"
                    autoCorrect={false}
                    editable={!isLoading}
                  />
                </View>
              </View>

              <View style={styles.inputContainer}>
                <Text style={[styles.label, { color: colors.text }]}>
                  Password
                </Text>
                <View
                  style={[
                    styles.inputWrapper,
                    {
                      backgroundColor: colors.surface,
                      borderColor: colors.border,
                      borderRadius: borderRadius.md,
                    },
                  ]}
                >
                  <TextInput
                    style={[styles.input, { color: colors.text }]}
                    placeholder="Enter your password"
                    placeholderTextColor={colors.textTertiary}
                    secureTextEntry={!isPasswordVisible}
                    value={password}
                    onChangeText={setPassword}
                    onSubmitEditing={handleSubmit}
                    editable={!isLoading}
                  />
                  <TouchableOpacity
                    style={styles.visibilityBtn}
                    onPress={() => setIsPasswordVisible(!isPasswordVisible)}
                    disabled={isLoading}
                  >
                    <Ionicons
                      name={isPasswordVisible ? 'eye-off' : 'eye'}
                      size={20}
                      color={colors.textTertiary}
                    />
                  </TouchableOpacity>
                </View>
              </View>

              {!isSignUp && (
                <TouchableOpacity
                  style={styles.forgotPassword}
                  onPress={() => {
                    /* TODO: Add forgot password with Clerk */
                  }}
                  disabled={isLoading}
                >
                  <Text
                    style={[styles.forgotPasswordText, { color: colors.primary }]}
                  >
                    Forgot Password?
                  </Text>
                </TouchableOpacity>
              )}

              <TouchableOpacity
                style={[
                  styles.button,
                  {
                    backgroundColor: colors.primary,
                    borderRadius: borderRadius.md,
                  },
                  isLoading && styles.buttonDisabled,
                ]}
                onPress={handleSubmit}
                disabled={isLoading}
                activeOpacity={0.8}
              >
                {isLoading ? (
                  <ActivityIndicator color={colors.textOnPrimary} />
                ) : (
                  <Text
                    style={[styles.buttonText, { color: colors.textOnPrimary }]}
                  >
                    {isSignUp ? 'Sign Up' : 'Sign In'}
                  </Text>
                )}
              </TouchableOpacity>

              <View style={styles.footer}>
                <Text style={[styles.footerText, { color: colors.textSecondary }]}>
                  {isSignUp
                    ? 'Already have an account? '
                    : "Don't have an account? "}
                </Text>
                <TouchableOpacity
                  onPress={() => {
                    setError('');
                    setIsSignUp(!isSignUp);
                  }}
                  disabled={isLoading}
                >
                  <Text style={[styles.footerLink, { color: colors.primary }]}>
                    {isSignUp ? 'Sign In' : 'Sign Up'}
                  </Text>
                </TouchableOpacity>
              </View>
            </Animated.View>
          </View>
        </KeyboardAvoidingView>
      </TouchableWithoutFeedback>
    </Screen>
  );
};

const styles = StyleSheet.create({
  container: {
    flex: 1,
  },
  innerContainer: {
    flex: 1,
    padding: 24,
    justifyContent: 'center',
  },
  logoContainer: {
    alignItems: 'center',
    marginBottom: 40,
  },
  iconContainer: {
    width: 80,
    height: 80,
    alignItems: 'center',
    justifyContent: 'center',
    marginBottom: 16,
  },
  title: {
    fontSize: 28,
    fontWeight: 'bold',
  },
  subtitle: {
    fontSize: 16,
    marginTop: 8,
    textAlign: 'center',
  },
  formContainer: {
    width: '100%',
  },
  inputContainer: {
    marginBottom: 20,
  },
  label: {
    fontSize: 14,
    marginBottom: 8,
    fontWeight: '500',
  },
  inputWrapper: {
    flexDirection: 'row',
    alignItems: 'center',
    borderWidth: 1,
    paddingHorizontal: 12,
  },
  input: {
    flex: 1,
    height: 50,
    fontSize: 16,
  },
  visibilityBtn: {
    padding: 8,
  },
  button: {
    width: '100%',
    height: 50,
    justifyContent: 'center',
    alignItems: 'center',
    marginTop: 8,
  },
  buttonDisabled: {
    opacity: 0.7,
  },
  buttonText: {
    fontSize: 16,
    fontWeight: '600',
  },
  forgotPassword: {
    marginTop: -8,
    marginBottom: 16,
    alignSelf: 'flex-end',
  },
  forgotPasswordText: {
    fontSize: 14,
  },
  footer: {
    flexDirection: 'row',
    justifyContent: 'center',
    marginTop: 24,
  },
  footerText: {
    fontSize: 14,
  },
  footerLink: {
    fontSize: 14,
    fontWeight: '600',
  },
  errorContainer: {
    padding: 12,
    borderRadius: 8,
    marginBottom: 20,
  },
  errorText: {
    fontSize: 14,
  },
});
