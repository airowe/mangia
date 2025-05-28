import React, { useState } from 'react';
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
import { signIn, signInAnonymously, signUp } from '../lib/auth';
import { Screen } from '../components/Screen';

export const AuthScreen = ({ navigation }: any) => {
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [isLoading, setIsLoading] = useState(false);
  const [isSignUp, setIsSignUp] = useState(false);
  const [isPasswordVisible, setIsPasswordVisible] = useState(false);
  const [error, setError] = useState('');

  const handleSignIn = async () => {
    try {
      setIsLoading(true);
      setError('');
      const { data, error: signInError } = await signIn(email, password);
      if (signInError) throw signInError;
      // navigation.replace('HomeStack');
    } catch (error) {
      let errorMessage = error instanceof Error ? error.message : 'Failed to sign in';
      errorMessage = errorMessage + process.env.EXPO_PUBLIC_SUPABASE_ANON_KEY;
      setError(errorMessage);
    } finally {
      setIsLoading(false);
    }
  };

  const handleSignUp = async () => {
    try {
      setIsLoading(true);
      setError('');
      let signUpError;
      
      if (!email || !password) {
        const { error: anonError } = await signInAnonymously();
        signUpError = anonError;
      } else {
        const { error: signUpError } = await signUp(email, password);
        if (signUpError) throw signUpError;
        Alert.alert('Success', 'Check your email to confirm your account.');
      }
    } catch (error) {
      const errorMessage = error instanceof Error ? error.message : 'Failed to sign up';
      setError(errorMessage);
    } finally {
      setIsLoading(false);
    }
  };

  const handleSubmit = () => {
    Keyboard.dismiss();
    if (isSignUp) {
      handleSignUp();
    } else {
      handleSignIn();
    }
  };

  return (
    <Screen noPadding>
      <TouchableWithoutFeedback onPress={Keyboard.dismiss} accessible={false}>
        <KeyboardAvoidingView
          style={styles.container}
          behavior={Platform.OS === 'ios' ? 'padding' : 'height'}
          keyboardVerticalOffset={Platform.OS === 'ios' ? 64 : 0}
        >
          <View style={styles.innerContainer}>
            <View style={styles.logoContainer}>
              <Ionicons name="cart" size={60} color="#007AFF" />
              <Text style={styles.title}>{isSignUp ? 'Create Account' : 'Welcome Back'}</Text>
              <Text style={styles.subtitle}>
                {isSignUp ? 'Sign up to get started' : 'Sign in to continue'}
              </Text>
            </View>

            {error ? (
              <View style={styles.errorContainer}>
                <Text style={styles.errorText}>{error}</Text>
              </View>
            ) : null}

            <View style={styles.formContainer}>
              <View style={styles.inputContainer}>
                <Text style={styles.label}>Email</Text>
                <View style={styles.inputWrapper}>
                  <TextInput
                    style={styles.input}
                    placeholder="Enter your email"
                    placeholderTextColor="#999"
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
                <Text style={styles.label}>Password</Text>
                <View style={styles.inputWrapper}>
                  <TextInput
                    style={styles.input}
                    placeholder="Enter your password"
                    placeholderTextColor="#999"
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
                      color="#999"
                    />
                  </TouchableOpacity>
                </View>
              </View>

              {!isSignUp && (
                <TouchableOpacity
                  style={styles.forgotPassword}
                  onPress={() => {/* Add forgot password logic */}}
                  disabled={isLoading}
                >
                  <Text style={styles.forgotPasswordText}>Forgot Password?</Text>
                </TouchableOpacity>
              )}

              <TouchableOpacity
                style={[styles.button, isLoading && styles.buttonDisabled]}
                onPress={handleSubmit}
                disabled={isLoading}
              >
                {isLoading ? (
                  <ActivityIndicator color="#fff" />
                ) : (
                  <Text style={styles.buttonText}>
                    {isSignUp ? 'Sign Up' : 'Sign In'}
                  </Text>
                )}
              </TouchableOpacity>

              <View style={styles.footer}>
                <Text style={styles.footerText}>
                  {isSignUp ? 'Already have an account? ' : "Don't have an account? "}
                </Text>
                <TouchableOpacity 
                  onPress={() => {
                    setError('');
                    setIsSignUp(!isSignUp);
                  }}
                  disabled={isLoading}
                >
                  <Text style={styles.footerLink}>
                    {isSignUp ? 'Sign In' : 'Sign Up'}
                  </Text>
                </TouchableOpacity>
              </View>
            </View>
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
  title: {
    fontSize: 28,
    fontWeight: 'bold',
    marginTop: 16,
    color: '#000',
  },
  subtitle: {
    fontSize: 16,
    color: '#666',
    marginTop: 8,
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
    color: '#333',
  },
  inputWrapper: {
    flexDirection: 'row',
    alignItems: 'center',
    borderWidth: 1,
    borderColor: '#E0E0E0',
    borderRadius: 8,
    paddingHorizontal: 12,
    backgroundColor: '#fff',
  },
  input: {
    flex: 1,
    height: 50,
    fontSize: 16,
    color: '#000',
  },
  visibilityBtn: {
    padding: 8,
  },
  button: {
    width: '100%',
    height: 50,
    borderRadius: 8,
    justifyContent: 'center',
    alignItems: 'center',
    marginTop: 8,
    backgroundColor: '#007AFF',
  },
  buttonDisabled: {
    backgroundColor: '#A0C8FF',
  },
  buttonText: {
    color: 'white',
    fontSize: 16,
    fontWeight: '600',
  },
  forgotPassword: {
    marginTop: -8,
    marginBottom: 16,
    alignSelf: 'flex-end',
  },
  forgotPasswordText: {
    color: '#007AFF',
    fontSize: 14,
  },
  footer: {
    flexDirection: 'row',
    justifyContent: 'center',
    marginTop: 24,
  },
  footerText: {
    color: '#666',
    fontSize: 14,
  },
  footerLink: {
    color: '#007AFF',
    fontSize: 14,
    fontWeight: '600',
  },
  errorContainer: {
    backgroundColor: '#FFEBEE',
    padding: 12,
    borderRadius: 8,
    marginBottom: 20,
  },
  errorText: {
    color: '#D32F2F',
    fontSize: 14,
  },
});