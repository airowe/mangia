import React, { useState } from 'react';
import { View, TextInput, Button, Text, StyleSheet, Alert } from 'react-native';
import { signIn, signUp } from '../lib/auth';

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
    const { data, error } = await signUp(email, password);
    if (error) {
      Alert.alert('Sign Up Error', error.message);
    } else {
      Alert.alert('Check your email to confirm your account.');
    }
  };

  return (
    <View style={styles.container}>
      <Text style={styles.heading}>Welcome!</Text>
      <TextInput
        placeholder="Email"
        value={email}
        onChangeText={setEmail}
        autoCapitalize="none"
        style={styles.input}
      />
      <TextInput
        placeholder="Password"
        value={password}
        secureTextEntry
        onChangeText={setPassword}
        style={styles.input}
      />
      <Button title="Sign In" onPress={handleSignIn} />
      <Text style={styles.or}>OR</Text>
      <Button title="Sign Up" onPress={handleSignUp} />
    </View>
  );
};

const styles = StyleSheet.create({
  container: {
    flex: 1, padding: 24, justifyContent: 'center',
  },
  heading: {
    fontSize: 24, fontWeight: 'bold', marginBottom: 20, textAlign: 'center',
  },
  input: {
    borderWidth: 1, borderColor: '#ccc', padding: 10, marginBottom: 12, borderRadius: 8,
  },
  or: {
    textAlign: 'center', marginVertical: 12, fontWeight: '500',
  },
});
