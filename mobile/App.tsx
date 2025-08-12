/**
 * Goshuin Helper App
 * React Native app for finding shrines and temples with Goshuin
 *
 * @format
 */

import React from 'react';
import { StatusBar, StyleSheet, useColorScheme, View, Text } from 'react-native';
import { HomeScreen } from './src/screens/HomeScreen';

// エラーバウンダリーコンポーネント
class ErrorBoundary extends React.Component<
  { children: React.ReactNode },
  { hasError: boolean; error: Error | null }
> {
  constructor(props: { children: React.ReactNode }) {
    super(props);
    this.state = { hasError: false, error: null };
  }

  static getDerivedStateFromError(error: Error) {
    console.error('ErrorBoundary caught an error:', error);
    return { hasError: true, error };
  }

  componentDidCatch(error: Error, errorInfo: React.ErrorInfo) {
    console.error('ErrorBoundary componentDidCatch:', error, errorInfo);
  }

  render() {
    if (this.state.hasError) {
      return (
        <View style={[styles.container, styles.errorContainer]}>
          <Text style={styles.errorTitle}>アプリでエラーが発生しました</Text>
          <Text style={styles.errorMessage}>
            {this.state.error?.message || '不明なエラー'}
          </Text>
          <Text style={styles.errorMessage}>
            アプリを再起動してください
          </Text>
        </View>
      );
    }

    return this.props.children;
  }
}

function App() {
  const isDarkMode = useColorScheme() === 'dark';

  console.log('App: Starting render');

  try {
    return (
      <ErrorBoundary>
        <View style={styles.container}>
          <StatusBar barStyle={isDarkMode ? 'light-content' : 'dark-content'} />
          <HomeScreen />
        </View>
      </ErrorBoundary>
    );
  } catch (error) {
    console.error('App render error:', error);
    return (
      <View style={[styles.container, styles.errorContainer]}>
        <Text style={styles.errorTitle}>初期化エラー</Text>
        <Text style={styles.errorMessage}>
          アプリの初期化に失敗しました
        </Text>
      </View>
    );
  }
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
  },
  errorContainer: {
    justifyContent: 'center',
    alignItems: 'center',
    padding: 20,
    backgroundColor: '#f8f8f8',
  },
  errorTitle: {
    fontSize: 18,
    fontWeight: 'bold',
    color: '#d32f2f',
    marginBottom: 10,
    textAlign: 'center',
  },
  errorMessage: {
    fontSize: 14,
    color: '#666',
    textAlign: 'center',
    lineHeight: 20,
  },
  loadingContainer: {
    justifyContent: 'center',
    alignItems: 'center',
    backgroundColor: '#f5f5f5',
  },
});

export default App;
