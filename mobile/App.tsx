// Spend & Send - Main App Entry Point

import React, { useEffect, useState } from 'react';
import { StatusBar } from 'expo-status-bar';
import { View, Text, StyleSheet, ActivityIndicator } from 'react-native';
import { NavigationContainer, DarkTheme, DefaultTheme } from '@react-navigation/native';
import { TabNavigator } from './src/navigation';
import { OnboardingNavigator } from './src/navigation/OnboardingNavigator';
import { ThemeProvider, useTheme } from './src/theme/index';
import { database } from './src/database/database';
import { budgetService } from './src/services/budgetService';
import DataService from './src/database/dataService';

// Inner app component that uses the theme
const AppContent: React.FC = () => {
  const { colors, isDark } = useTheme();
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [showOnboarding, setShowOnboarding] = useState(false);

  useEffect(() => {
    initializeApp();
  }, []);

  const initializeApp = async () => {
    try {
      // Initialize database
      console.log('Initializing database...');
      await database.initialize();
      
      // Check if user has completed onboarding
      const user = await DataService.User.getCurrentUser();
      if (user) {
        const onboardingComplete = await DataService.Settings.getSetting(user.id, 'onboarding_complete');
        if (onboardingComplete === 'true') {
          // User has completed onboarding, initialize budget service
          console.log('Initializing budget service...');
          await budgetService.initialize();
          setShowOnboarding(false);
        } else {
          // User exists but hasn't completed onboarding
          setShowOnboarding(true);
        }
      } else {
        // No user exists, show onboarding
        setShowOnboarding(true);
      }
      
      console.log('App initialized successfully');
      setIsLoading(false);
    } catch (err) {
      console.error('Failed to initialize app:', err);
      setError('Failed to initialize app. Please restart.');
      setIsLoading(false);
    }
  };

  const handleOnboardingComplete = async () => {
    // Reinitialize budget service after onboarding
    try {
      await budgetService.initialize();
      setShowOnboarding(false);
    } catch (err) {
      console.error('Error initializing after onboarding:', err);
      setShowOnboarding(false); // Still hide onboarding
    }
  };

  // Custom navigation theme
  const navigationTheme = {
    ...(isDark ? DarkTheme : DefaultTheme),
    colors: {
      ...(isDark ? DarkTheme.colors : DefaultTheme.colors),
      background: colors.background,
      card: colors.surface,
      text: colors.textPrimary,
      border: colors.border,
      primary: colors.primary,
    },
  };

  // Loading screen
  if (isLoading) {
    return (
      <View style={[styles.loadingContainer, { backgroundColor: colors.background }]}>
        <StatusBar style={isDark ? 'light' : 'dark'} />
        <Text style={[styles.logo, { color: colors.primary }]}>Spend & Send</Text>
        <ActivityIndicator size="large" color={colors.primary} />
        <Text style={[styles.loadingText, { color: colors.textMuted }]}>Getting ready...</Text>
      </View>
    );
  }

  // Error screen
  if (error) {
    return (
      <View style={[styles.errorContainer, { backgroundColor: colors.background }]}>
        <StatusBar style={isDark ? 'light' : 'dark'} />
        <Text style={[styles.errorText, { color: colors.warning }]}>{error}</Text>
      </View>
    );
  }

  // Main app with navigation
  return (
    <NavigationContainer theme={navigationTheme}>
      <StatusBar style={isDark ? 'light' : 'dark'} />
      {showOnboarding ? (
        <OnboardingNavigator onComplete={handleOnboardingComplete} />
      ) : (
        <TabNavigator />
      )}
    </NavigationContainer>
  );
};

// Root component with ThemeProvider
export default function App() {
  return (
    <ThemeProvider>
      <AppContent />
    </ThemeProvider>
  );
}

const styles = StyleSheet.create({
  loadingContainer: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
    gap: 20,
  },
  logo: {
    fontSize: 32,
    fontWeight: '700',
    marginBottom: 20,
  },
  loadingText: {
    fontSize: 16,
  },
  errorContainer: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
    padding: 20,
  },
  errorText: {
    fontSize: 16,
    textAlign: 'center',
  },
});
