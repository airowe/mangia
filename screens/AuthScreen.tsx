import React, { useState } from 'react';
import { View, TextInput, Button, Text, StyleSheet, Alert, KeyboardAvoidingView, Platform } from 'react-native';
import { signIn, signInAnonymously, signUp } from '../lib/auth';
import { Screen } from '../components/Screen';

export const AuthScreen = ({ navigation }: any) => {
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');

  const handleSignIn = async () => {
    const { data, error } = await signIn(email, password);
    if (error) {
      Alert.alert('Sign In Error', error.message);
    } else {
      navigation.replace('Home');
    }
  };

  const handleSignUp = async () => {
    let signUpError;
    if (!email || !password) {
      const {data, error} = await signInAnonymously();
      signUpError = error;
    } else {
      const { data, error } = await signUp(email, password);
      signUpError = error;
    }
    if (signUpError) {
      Alert.alert('Sign Up Error', signUpError.message);
    } else {
      Alert.alert('Check your email to confirm your account.');
    }
  };

  return (
    <Screen noPadding>
      <KeyboardAvoidingView 
        style={styles.container}
        behavior={Platform.OS === 'ios' ? 'padding' : 'height'}
        keyboardVerticalOffset={Platform.OS === 'ios' ? 64 : 0}
      >
        <Text style={styles.title}>Welcome!</Text>
        <TextInput
          style={styles.input}
          placeholder="Email"
          value={email}
          onChangeText={setEmail}
          autoCapitalize="none"
          keyboardType="email-address"
        />
        <TextInput
          style={styles.input}
          placeholder="Password"
          value={password}
          onChangeText={setPassword}
          secureTextEntry
        />
        <View style={styles.buttonContainer}>
          <View style={styles.button}>
            <Button title="Sign In" onPress={handleSignIn} />
          </View>
          <View style={styles.button}>
            <Button title="Sign Up" onPress={handleSignUp} />
          </View>
        </View>
      </KeyboardAvoidingView>
    </Screen>
  );
};

const styles = StyleSheet.create({
  container: {
    flex: 1,
    padding: 24,
    justifyContent: 'center',
  },
  title: {
    fontSize: 24,
    fontWeight: 'bold',
    marginBottom: 24,
    textAlign: 'center',
  },
  input: {
    borderWidth: 1,
    borderColor: '#ddd',
    padding: 12,
    marginBottom: 16,
    borderRadius: 8,
    fontSize: 16,
  },
  buttonContainer: {
    marginTop: 8,
  },
  button: {
    marginVertical: 8,
  },
});
