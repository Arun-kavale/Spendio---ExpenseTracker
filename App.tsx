/**
 * Spendio
 * 
 * A production-quality React Native personal finance app
 * with local-first data architecture and optional Google Drive backup.
 */

import React, {useEffect, useState, useMemo} from 'react';
import {StatusBar, LogBox, AppState, AppStateStatus} from 'react-native';
import {NavigationContainer} from '@react-navigation/native';
import {SafeAreaProvider} from 'react-native-safe-area-context';
import {GestureHandlerRootView} from 'react-native-gesture-handler';
import {PaperProvider, MD3LightTheme, MD3DarkTheme} from 'react-native-paper';
import {RootNavigator} from '@/navigation';
import {IntroFlow} from '@/screens/Intro';
import {useTheme} from '@/hooks';
import {useSettingsStore, useExpenseStore, useCategoryStore, useIncomeStore, useBudgetStore, useTransferStore, useAccountStore} from '@/store';
import {configureGoogleSignIn} from '@/services/auth/googleAuth';
import {backupToGoogleDrive} from '@/services/backup/googleDriveBackup';
import {StorageService, STORAGE_KEYS} from '@/services/storage/mmkv';
import {lightColors, darkColors} from '@/theme';
import {ToastProvider} from '@/components/common';

// Ignore specific warnings in development
LogBox.ignoreLogs([
  'Non-serializable values were found in the navigation state',
  'RNGoogleSignin', // Ignore Google Sign-In warnings when not configured
]);

// Configure Google Sign-In on app start (optional - for cloud backup)
try {
  configureGoogleSignIn();
} catch {
  // Google Sign-In not configured - app will work in local-only mode
}

/**
 * App Content with theme-aware components
 */
const AppContent: React.FC = () => {
  const theme = useTheme();
  const {settings} = useSettingsStore();
  
  // Handle auto-backup on app background
  useEffect(() => {
    const handleAppStateChange = async (nextAppState: AppStateStatus) => {
      if (nextAppState === 'background' && settings.autoBackupEnabled && settings.googleUserId) {
        // Perform auto-backup when app goes to background
        try {
          await backupToGoogleDrive();
        } catch {
          // Silently fail for auto-backup
        }
      }
    };
    
    const subscription = AppState.addEventListener('change', handleAppStateChange);
    
    return () => {
      subscription.remove();
    };
  }, [settings.autoBackupEnabled, settings.googleUserId]);
  
  // Create Paper theme based on current theme
  const paperTheme = theme.mode === 'dark'
    ? {
        ...MD3DarkTheme,
        colors: {
          ...MD3DarkTheme.colors,
          primary: theme.colors.primary,
          secondary: theme.colors.secondary,
          background: theme.colors.background,
          surface: theme.colors.surface,
          error: theme.colors.error,
        },
      }
    : {
        ...MD3LightTheme,
        colors: {
          ...MD3LightTheme.colors,
          primary: theme.colors.primary,
          secondary: theme.colors.secondary,
          background: theme.colors.background,
          surface: theme.colors.surface,
          error: theme.colors.error,
        },
      };
  
  // Navigation theme
  const navigationTheme = {
    dark: theme.mode === 'dark',
    colors: {
      primary: theme.colors.primary,
      background: theme.colors.background,
      card: theme.colors.card,
      text: theme.colors.text,
      border: theme.colors.border,
      notification: theme.colors.error,
    },
    fonts: {
      regular: {fontFamily: 'System', fontWeight: '400' as const},
      medium: {fontFamily: 'System', fontWeight: '500' as const},
      bold: {fontFamily: 'System', fontWeight: '700' as const},
      heavy: {fontFamily: 'System', fontWeight: '800' as const},
    },
  };
  
  return (
    <PaperProvider theme={paperTheme}>
      <ToastProvider>
        <StatusBar
          barStyle={theme.mode === 'dark' ? 'light-content' : 'dark-content'}
          backgroundColor={theme.colors.background}
        />
        <NavigationContainer theme={navigationTheme}>
          <RootNavigator />
        </NavigationContainer>
      </ToastProvider>
    </PaperProvider>
  );
};

/**
 * Main App Component
 *
 * Initializes app state and provides global context.
 * Shows intro/onboarding flow on first launch, then main app.
 */
const App: React.FC = () => {
  const loadSettings = useSettingsStore(state => state.loadSettings);
  const loadCategories = useCategoryStore(state => state.loadCategories);
  const loadExpenses = useExpenseStore(state => state.loadExpenses);
  const loadIncomes = useIncomeStore(state => state.loadIncomes);
  const loadBudgets = useBudgetStore(state => state.loadBudgets);
  const loadTransfers = useTransferStore(state => state.loadTransfers);
  const loadAccounts = useAccountStore(state => state.loadAccounts);

  const [onboardingComplete, setOnboardingComplete] = useState(() => {
    const value = StorageService.get<boolean>(STORAGE_KEYS.ONBOARDING_COMPLETE);
    return value === true;
  });

  // Initialize app data on mount
  useEffect(() => {
    loadSettings();
    loadCategories();
    loadExpenses();
    loadIncomes();
    loadBudgets();
    loadTransfers();
    loadAccounts();
  }, [loadSettings, loadCategories, loadExpenses, loadIncomes, loadBudgets, loadTransfers, loadAccounts]);

  const handleOnboardingComplete = useMemo(
    () => () => {
      StorageService.set(STORAGE_KEYS.ONBOARDING_COMPLETE, true);
      setOnboardingComplete(true);
    },
    [],
  );

  return (
    <GestureHandlerRootView style={{flex: 1}}>
      <SafeAreaProvider>
        {!onboardingComplete ? (
          <IntroFlow onComplete={handleOnboardingComplete} />
        ) : (
          <AppContent />
        )}
      </SafeAreaProvider>
    </GestureHandlerRootView>
  );
};

export default App;
