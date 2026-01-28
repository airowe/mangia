import React from 'react';
import { View, StyleSheet, Image, Animated } from 'react-native';
import { ActivityIndicator } from 'react-native-paper';
import { colors } from '../theme/colors';

const SplashScreen = () => {
  return (
    <View style={styles.container}>
      <View style={styles.logoContainer}>
        <Animated.View style={styles.logoBackground}>
          <Image
            source={require('../../assets/icon.png')}
            style={styles.logo}
            resizeMode="contain"
          />
        </Animated.View>
      </View>
      <View style={styles.loadingContainer}>
        <ActivityIndicator size="large" color={colors.primary} />
      </View>
    </View>
  );
};

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: colors.background,
    justifyContent: 'center',
    alignItems: 'center',
  },
  logoContainer: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
  },
  logoBackground: {
    backgroundColor: 'white',
    borderRadius: 30,
    padding: 20,
    elevation: 5,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.25,
    shadowRadius: 3.84,
  },
  logo: {
    width: 150,
    height: 150,
  },
  loadingContainer: {
    position: 'absolute',
    bottom: 80,
  },
});

export default SplashScreen;
