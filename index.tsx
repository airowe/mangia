import { registerRootComponent } from 'expo';
import { Text, View, StyleSheet, Alert } from 'react-native';
import { SafeAreaProvider } from 'react-native-safe-area-context';
import React from 'react';

// Error boundary to catch rendering errors
class ErrorBoundary extends React.Component<{children: React.ReactNode}, {hasError: boolean}> {
  state = { hasError: false };

  static getDerivedStateFromError() {
    return { hasError: true };
  }

  componentDidCatch(error: Error) {
    console.error('Error caught by boundary:', error);
    Alert.alert('Error', 'An error occurred. Check console for details.');
  }

  render() {
    if (this.state.hasError) {
      return (
        <View style={styles.container}>
          <Text style={styles.errorText}>Something went wrong. Please restart the app.</Text>
        </View>
      );
    }
    return this.props.children;
  }
}

// Simple loading component
function Loading() {
  return (
    <View style={styles.container}>
      <Text>Loading...</Text>
    </View>
  );
}

// Main app wrapper
function AppWrapper() {
  const [isReady, setIsReady] = React.useState(false);

  React.useEffect(() => {
    console.log('App initializing...');
    Alert.alert('App initializing...');
    setIsReady(true);
  }, []);

  if (!isReady) {
    return <Loading />;
  }

  try {
    const App = require('./App').default;
    return (
      <SafeAreaProvider>
        <ErrorBoundary>
          <App />
        </ErrorBoundary>
      </SafeAreaProvider>
    );
  } catch (error) {
    Alert.alert('Failed to load App component:' + error);
    return (
      <SafeAreaProvider>
        <View style={styles.container}>
          <Text style={styles.errorText}>
            Failed to load the app. Check console for details.
            {'\n\n'}
            {error instanceof Error ? error.message : String(error)}
          </Text>
        </View>
      </SafeAreaProvider>
    );
  }
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
    backgroundColor: '#fff',
  },
  errorText: {
    color: 'red',
    padding: 20,
    textAlign: 'center',
  },
});

// Register the root component
registerRootComponent(AppWrapper);
