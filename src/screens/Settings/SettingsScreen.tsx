/**
 * Settings Screen
 * 
 * App settings including theme, currency, backup, and data management.
 */

import React, {memo, useCallback, useState} from 'react';
import {
  View,
  Text,
  StyleSheet,
  ScrollView,
  Pressable,
  Switch,
  Alert,
} from 'react-native';
import {useSafeAreaInsets} from 'react-native-safe-area-context';
import Animated, {FadeInDown} from 'react-native-reanimated';
import Icon from 'react-native-vector-icons/MaterialCommunityIcons';
import {useNavigation} from '@react-navigation/native';
import {NativeStackNavigationProp} from '@react-navigation/native-stack';
import {useTheme, useCurrency} from '@/hooks';
import {useSettingsStore, useExpenseStore, useCategoryStore, useIncomeStore, useBudgetStore, useTransferStore, useAccountStore} from '@/store';
import {Card} from '@/components/common';
import {
  signInWithGoogle,
  signOutFromGoogle,
  isSignedIn,
} from '@/services/auth/googleAuth';
import {backupToGoogleDrive} from '@/services/backup/googleDriveBackup';
import {exportExpenses, exportFullBackup} from '@/services/backup/exportService';
import {RootStackParamList, ThemeMode} from '@/types';
import {formatTimeAgo} from '@/utils';

type NavigationProp = NativeStackNavigationProp<RootStackParamList>;

interface SettingItemProps {
  icon: string;
  iconColor?: string;
  title: string;
  subtitle?: string;
  onPress?: () => void;
  rightElement?: React.ReactNode;
  showArrow?: boolean;
}

const SettingItem = memo<SettingItemProps>(({
  icon,
  iconColor,
  title,
  subtitle,
  onPress,
  rightElement,
  showArrow = true,
}) => {
  const theme = useTheme();
  
  return (
    <Pressable
      onPress={onPress}
      style={[styles.settingItem, {borderBottomColor: theme.colors.border}]}
      disabled={!onPress}>
      <View
        style={[
          styles.settingIcon,
          {backgroundColor: (iconColor || theme.colors.primary) + '15'},
        ]}>
        <Icon
          name={icon}
          size={20}
          color={iconColor || theme.colors.primary}
        />
      </View>
      
      <View style={styles.settingContent}>
        <Text style={[styles.settingTitle, {color: theme.colors.text}]}>
          {title}
        </Text>
        {subtitle && (
          <Text style={[styles.settingSubtitle, {color: theme.colors.textMuted}]}>
            {subtitle}
          </Text>
        )}
      </View>
      
      {rightElement}
      
      {showArrow && onPress && (
        <Icon name="chevron-right" size={20} color={theme.colors.textMuted} />
      )}
    </Pressable>
  );
});

export const SettingsScreen = memo(() => {
  const theme = useTheme();
  const insets = useSafeAreaInsets();
  const navigation = useNavigation<NavigationProp>();
  const {currency} = useCurrency();
  
  const {settings, setTheme, setAutoBackup, setGoogleUser} = useSettingsStore();
  const {expenses, clearAllExpenses} = useExpenseStore();
  const {categories, resetToDefaults} = useCategoryStore();
  const {incomes, clearAllIncomes} = useIncomeStore();
  const {budgets, clearAllBudgets} = useBudgetStore();
  const {transfers, clearAllTransfers} = useTransferStore();
  const {accounts, clearAllAccounts, getTotalBalance} = useAccountStore();
  
  const [isSigningIn, setIsSigningIn] = useState(false);
  const [isBackingUp, setIsBackingUp] = useState(false);
  
  const themeLabel = {
    light: 'Light',
    dark: 'Dark',
    system: 'System',
  }[settings.theme];
  
  const handleThemePress = useCallback(() => {
    const modes: ThemeMode[] = ['system', 'light', 'dark'];
    const currentIndex = modes.indexOf(settings.theme);
    const nextMode = modes[(currentIndex + 1) % modes.length];
    setTheme(nextMode);
  }, [settings.theme, setTheme]);
  
  const handleGoogleSignIn = useCallback(async () => {
    setIsSigningIn(true);
    try {
      const result = await signInWithGoogle();
      if (result.success && result.user) {
        const {user} = result;
        setGoogleUser(
          user.user.id,
          user.user.email,
          user.user.name
        );
      } else if (result.error && result.errorCode !== 'CANCELLED') {
        Alert.alert('Sign In Failed', result.error);
      }
    } catch {
      Alert.alert('Error', 'Failed to sign in with Google');
    } finally {
      setIsSigningIn(false);
    }
  }, [setGoogleUser]);
  
  const handleGoogleSignOut = useCallback(async () => {
    Alert.alert(
      'Sign Out',
      'Are you sure you want to sign out? Auto-backup will be disabled.',
      [
        {text: 'Cancel', style: 'cancel'},
        {
          text: 'Sign Out',
          onPress: async () => {
            await signOutFromGoogle();
            setGoogleUser(null, null, null);
            setAutoBackup(false);
          },
        },
      ]
    );
  }, [setGoogleUser, setAutoBackup]);
  
  const handleBackupNow = useCallback(async () => {
    if (!settings.googleUserId) {
      Alert.alert('Sign In Required', 'Please sign in with Google to backup to Google Drive.');
      return;
    }
    
    setIsBackingUp(true);
    try {
      const result = await backupToGoogleDrive();
      if (result.success) {
        Alert.alert('Backup Complete', 'Your data has been backed up to Google Drive.');
      } else {
        Alert.alert('Backup Failed', result.error || 'Unknown error');
      }
    } catch {
      Alert.alert('Error', 'Failed to backup data');
    } finally {
      setIsBackingUp(false);
    }
  }, [settings.googleUserId]);
  
  const handleExportCSV = useCallback(async () => {
    const result = await exportExpenses('csv');
    if (!result.success && result.error) {
      Alert.alert('Export Failed', result.error);
    }
  }, []);
  
  const handleExportJSON = useCallback(async () => {
    const result = await exportExpenses('json');
    if (!result.success && result.error) {
      Alert.alert('Export Failed', result.error);
    }
  }, []);
  
  const handleExportBackup = useCallback(async () => {
    const result = await exportFullBackup();
    if (!result.success && result.error) {
      Alert.alert('Export Failed', result.error);
    }
  }, []);
  
  const handleClearData = useCallback(() => {
    Alert.alert(
      'Clear All Data',
      'This will permanently delete all your expenses, income, budgets, transfers, and accounts. Categories will be reset to defaults. This action cannot be undone.',
      [
        {text: 'Cancel', style: 'cancel'},
        {
          text: 'Clear All',
          style: 'destructive',
          onPress: () => {
            clearAllExpenses();
            clearAllIncomes();
            clearAllBudgets();
            clearAllTransfers();
            clearAllAccounts();
            resetToDefaults();
            Alert.alert('Data Cleared', 'All data has been deleted.');
          },
        },
      ]
    );
  }, [clearAllExpenses, clearAllIncomes, clearAllBudgets, clearAllTransfers, clearAllAccounts, resetToDefaults]);
  
  return (
    <ScrollView
      style={[styles.container, {backgroundColor: theme.colors.background}]}
      contentContainerStyle={[styles.content, {paddingTop: insets.top + 16}]}
      showsVerticalScrollIndicator={false}>
      {/* Header */}
      <Text style={[styles.title, {color: theme.colors.text}]}>Settings</Text>
      
      {/* Finance Modules */}
      <Animated.View entering={FadeInDown.delay(80).duration(400)}>
        <Text style={[styles.sectionTitle, {color: theme.colors.textSecondary}]}>
          Finance Modules
        </Text>
        <Card padding="none">
          <SettingItem
            icon="wallet"
            iconColor={theme.colors.info}
            title="Accounts"
            subtitle={`${accounts.length} accounts configured`}
            onPress={() => navigation.navigate('AccountsDashboard' as never)}
          />
          <SettingItem
            icon="cash-plus"
            iconColor={theme.colors.income}
            title="Income"
            subtitle={`${incomes.length} entries recorded`}
            onPress={() => navigation.navigate('IncomeList' as never)}
          />
          <SettingItem
            icon="chart-arc"
            iconColor={theme.colors.primary}
            title="Budgets"
            subtitle={`${budgets.length} budgets set`}
            onPress={() => navigation.navigate('BudgetDashboard' as never)}
          />
          <SettingItem
            icon="swap-horizontal"
            iconColor={theme.colors.transfer}
            title="Transfers"
            subtitle={`${transfers.length} transfers made`}
            onPress={() => navigation.navigate('TransferList' as never)}
          />
          <SettingItem
            icon="file-document-outline"
            iconColor="#8B5CF6"
            title="Reports"
            subtitle="Generate PDF reports"
            onPress={() => navigation.navigate('Reports' as never)}
          />
        </Card>
      </Animated.View>
      
      {/* Appearance */}
      <Animated.View entering={FadeInDown.delay(100).duration(400)}>
        <Text style={[styles.sectionTitle, {color: theme.colors.textSecondary}]}>
          Appearance
        </Text>
        <Card padding="none">
          <SettingItem
            icon="theme-light-dark"
            title="Theme"
            subtitle={themeLabel}
            onPress={handleThemePress}
          />
          <SettingItem
            icon="currency-usd"
            title="Currency"
            subtitle={`${currency.symbol} ${currency.name}`}
            onPress={() => navigation.navigate('CurrencySelect')}
          />
          <SettingItem
            icon="shape-outline"
            iconColor={theme.colors.secondary}
            title="Categories"
            subtitle="Manage expense categories"
            onPress={() => navigation.navigate('Categories')}
          />
        </Card>
      </Animated.View>
      
      {/* Account & Backup - Sign in with Google commented out for now */}
      {/* <Animated.View entering={FadeInDown.delay(150).duration(400)}>
        <Text style={[styles.sectionTitle, {color: theme.colors.textSecondary}]}>
          Account & Backup
        </Text>
        <Card padding="none">
          {settings.googleUserId ? (
            <>
              <SettingItem
                icon="account-circle"
                iconColor={theme.colors.success}
                title={settings.googleUserName || 'Google Account'}
                subtitle={settings.googleUserEmail || 'Connected'}
                showArrow={false}
              />
              <SettingItem
                icon="cloud-upload"
                title="Backup Now"
                subtitle={
                  settings.lastBackupTime
                    ? `Last backup: ${formatTimeAgo(settings.lastBackupTime)}`
                    : 'Never backed up'
                }
                onPress={handleBackupNow}
                rightElement={
                  isBackingUp ? (
                    <Text style={{color: theme.colors.textMuted, marginRight: 8}}>
                      Backing up...
                    </Text>
                  ) : null
                }
              />
              <SettingItem
                icon="cloud-sync"
                title="Auto Backup"
                subtitle="Backup when app goes to background"
                showArrow={false}
                rightElement={
                  <Switch
                    value={settings.autoBackupEnabled}
                    onValueChange={setAutoBackup}
                    trackColor={{
                      false: theme.colors.border,
                      true: theme.colors.primary,
                    }}
                  />
                }
              />
              <SettingItem
                icon="cloud-download"
                title="Restore from Backup"
                onPress={() => navigation.navigate('Backup')}
              />
              <SettingItem
                icon="logout"
                iconColor={theme.colors.error}
                title="Sign Out"
                onPress={handleGoogleSignOut}
              />
            </>
          ) : (
            <SettingItem
              icon="google"
              title="Sign in with Google"
              subtitle="Enable cloud backup to Google Drive"
              onPress={handleGoogleSignIn}
              rightElement={
                isSigningIn ? (
                  <Text style={{color: theme.colors.textMuted, marginRight: 8}}>
                    Signing in...
                  </Text>
                ) : null
              }
            />
          )}
        </Card>
      </Animated.View> */}
      
      {/* Export */}
      <Animated.View entering={FadeInDown.delay(200).duration(400)}>
        <Text style={[styles.sectionTitle, {color: theme.colors.textSecondary}]}>
          Export Data
        </Text>
        <Card padding="none">
          <SettingItem
            icon="file-delimited"
            title="Export as CSV"
            subtitle="Spreadsheet format"
            onPress={handleExportCSV}
          />
          <SettingItem
            icon="code-json"
            title="Export as JSON"
            subtitle="Developer format"
            onPress={handleExportJSON}
          />
          <SettingItem
            icon="database-export"
            title="Export Full Backup"
            subtitle="All data including categories & settings"
            onPress={handleExportBackup}
          />
        </Card>
      </Animated.View>
      
      {/* Data Management */}
      <Animated.View entering={FadeInDown.delay(250).duration(400)}>
        <Text style={[styles.sectionTitle, {color: theme.colors.textSecondary}]}>
          Data Management
        </Text>
        <Card padding="none">
          <SettingItem
            icon="chart-box"
            title="Statistics"
            subtitle={`${expenses.length} expenses • ${incomes.length} income • ${accounts.length} accounts • ${transfers.length} transfers`}
            onPress={() => navigation.navigate('Statistics')}
          />
          <SettingItem
            icon="trash-can"
            iconColor={theme.colors.error}
            title="Clear All Data"
            subtitle="Delete all expenses and reset categories"
            onPress={handleClearData}
          />
        </Card>
      </Animated.View>
      
      {/* About */}
      <Animated.View entering={FadeInDown.delay(300).duration(400)}>
        <Text style={[styles.sectionTitle, {color: theme.colors.textSecondary}]}>
          About
        </Text>
        <Card padding="none">
          <SettingItem
            icon="information"
            title="About Spendio"
            onPress={() => navigation.navigate('About')}
          />
          <SettingItem
            icon="shield-check"
            title="Privacy & Data"
            subtitle="Your data is stored locally on your device"
            showArrow={false}
          />
        </Card>
      </Animated.View>
      
      {/* Footer */}
      <View style={styles.footer}>
        <Text style={[styles.version, {color: theme.colors.textMuted}]}>
          Spendio v1.0.0
        </Text>
        <Text style={[styles.footerText, {color: theme.colors.textMuted}]}>
          Your complete personal finance companion
        </Text>
      </View>
      
      <View style={{height: 100}} />
    </ScrollView>
  );
});

SettingsScreen.displayName = 'SettingsScreen';

const styles = StyleSheet.create({
  container: {
    flex: 1,
  },
  content: {
    paddingHorizontal: 16,
  },
  title: {
    fontSize: 28,
    fontWeight: '700',
    marginBottom: 24,
  },
  sectionTitle: {
    fontSize: 13,
    fontWeight: '600',
    textTransform: 'uppercase',
    letterSpacing: 0.5,
    marginTop: 24,
    marginBottom: 8,
    marginLeft: 4,
  },
  settingItem: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingVertical: 14,
    paddingHorizontal: 16,
    borderBottomWidth: 0.5,
  },
  settingIcon: {
    width: 36,
    height: 36,
    borderRadius: 10,
    alignItems: 'center',
    justifyContent: 'center',
    marginRight: 12,
  },
  settingContent: {
    flex: 1,
  },
  settingTitle: {
    fontSize: 16,
    fontWeight: '500',
  },
  settingSubtitle: {
    fontSize: 13,
    marginTop: 2,
  },
  footer: {
    alignItems: 'center',
    paddingVertical: 32,
  },
  version: {
    fontSize: 13,
    fontWeight: '500',
  },
  footerText: {
    fontSize: 12,
    marginTop: 4,
  },
});

export default SettingsScreen;
