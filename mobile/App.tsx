// Spend & Send - Main App Entry Point

import React, { useEffect, useState } from 'react';
import { StatusBar } from 'expo-status-bar';
import { View, Text, StyleSheet, ActivityIndicator } from 'react-native';
import { HomeScreen } from './src/screens/HomeScreen';
import { colors, typography } from './src/theme/colors';

// TODO: Initialize database on app start
// import { database } from './src/database';
// import { budgetService } from './src/services';

export default function App() {
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    initializeApp();
  }, []);

  const initializeApp = async () => {
    try {
      // TODO: Uncomment when ready to use real database
      // await database.initialize();
      // await budgetService.initialize();
      
      // Simulate initialization for now
      await new Promise((resolve) => setTimeout(resolve, 500));
      
      setIsLoading(false);
    } catch (err) {
      console.error('Failed to initialize app:', err);
      setError('Failed to initialize app. Please restart.');
      setIsLoading(false);
    }
  };

  // Loading screen
  if (isLoading) {
    return (
      <View style={styles.loadingContainer}>
        <StatusBar style="dark" />
        <Text style={styles.logo}>Spend & Send</Text>
        <ActivityIndicator size="large" color={colors.primary} />
        <Text style={styles.loadingText}>Getting ready...</Text>
      </View>
    );
  }

  // Error screen
  if (error) {
    return (
      <View style={styles.errorContainer}>
        <StatusBar style="dark" />
        <Text style={styles.errorText}>{error}</Text>
      </View>
    );
  }

  // Main app
  return (
    <>
      <StatusBar style="light" />
      <HomeScreen />
    </>
  );
}

const styles = StyleSheet.create({
  loadingContainer: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
    backgroundColor: colors.background,
    gap: 20,
  },
  logo: {
    fontSize: typography.xxl,
    fontWeight: typography.bold,
    color: colors.primary,
    marginBottom: 20,
  },
  loadingText: {
    fontSize: typography.md,
    color: colors.textMuted,
  },
  errorContainer: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
    backgroundColor: colors.background,
    padding: 20,
  },
  errorText: {
    fontSize: typography.md,
    color: colors.warning,
    textAlign: 'center',
  },
});
