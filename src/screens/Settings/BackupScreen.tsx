/**
 * Backup Screen
 *
 * Full-featured backup & restore management (WhatsApp-style).
 * - Backup Now
 * - Restore from Cloud
 * - Auto Backup toggle
 * - Last Backup Time
 * - Platform-aware (Google Drive on Android, iCloud on iOS)
 */

import React, {memo, useState, useCallback, useEffect} from 'react';
import {
  View,
  Text,
  StyleSheet,
  ScrollView,
  Alert,
  Switch,
  Platform,
  Pressable,
  ActivityIndicator,
} from 'react-native';
import {useSafeAreaInsets} from 'react-native-safe-area-context';
import Animated, {FadeInDown} from 'react-native-reanimated';
import Icon from 'react-native-vector-icons/MaterialCommunityIcons';
import {useNavigation} from '@react-navigation/native';
import {useTheme} from '@/hooks';
import {useSettingsStore} from '@/store';
import {Card, AdvancedHeader} from '@/components/common';
import {GradientButton} from '@/components/gradient';
import {
  performCloudBackup,
  performCloudRestore,
  applyBackupData,
  getCloudProviderLabel,
  isCloudAuthenticated,
} from '@/services/backup/cloudBackupService';
import {
  signInWithGoogle,
  signOutFromGoogle,
} from '@/services/auth/googleAuth';
import {BackupData} from '@/types';
import {formatTimeAgo} from '@/utils';

export const BackupScreen = memo(() => {
  const theme = useTheme();
  const insets = useSafeAreaInsets();
  const navigation = useNavigation();

  const {settings, setAutoBackup, setGoogleUser} = useSettingsStore();

  const [isBackingUp, setIsBackingUp] = useState(false);
  const [isRestoring, setIsRestoring] = useState(false);
  const [isSigningIn, setIsSigningIn] = useState(false);
  const [cloudData, setCloudData] = useState<BackupData | null>(null);
  const [isCheckingBackup, setIsCheckingBackup] = useState(false);

  const providerLabel = getCloudProviderLabel();
  const isAndroid = Platform.OS === 'android';
  const isAuthenticated = isAndroid
    ? settings.googleUserId !== null
    : true; // iOS uses iCloud implicitly

  useEffect(() => {
    const fetchCloudData = async () => {
      if (!isAuthenticated) {
        return;
      }
      setIsCheckingBackup(true);
      try {
        const result = await performCloudRestore();
        if (result.success && result.data) {
          setCloudData(result.data);
        }
      } catch {
        // Silently handle
      } finally {
        setIsCheckingBackup(false);
      }
    };

    fetchCloudData();
  }, [isAuthenticated]);

  const handleGoogleSignIn = useCallback(async () => {
    setIsSigningIn(true);
    try {
      const result = await signInWithGoogle();
      if (result.success && result.user) {
        const {user} = result;
        setGoogleUser(user.user.id, user.user.email, user.user.name);
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
      'Are you sure? Auto-backup will be disabled and you will need to sign in again to backup.',
      [
        {text: 'Cancel', style: 'cancel'},
        {
          text: 'Sign Out',
          onPress: async () => {
            await signOutFromGoogle();
            setGoogleUser(null, null, null);
            setAutoBackup(false);
            setCloudData(null);
          },
        },
      ]
    );
  }, [setGoogleUser, setAutoBackup]);

  const handleBackupNow = useCallback(async () => {
    setIsBackingUp(true);
    try {
      const result = await performCloudBackup();
      if (result.success) {
        Alert.alert(
          'Backup Complete',
          `Your data has been backed up to ${providerLabel}.`
        );
        // Refresh cloud data preview
        const restoreResult = await performCloudRestore();
        if (restoreResult.success && restoreResult.data) {
          setCloudData(restoreResult.data);
        }
      } else {
        Alert.alert('Backup Failed', result.error || 'Unknown error');
      }
    } catch {
      Alert.alert('Error', 'Failed to backup data');
    } finally {
      setIsBackingUp(false);
    }
  }, [providerLabel]);

  const handleRestore = useCallback(
    async (mode: 'replace' | 'merge') => {
      setIsRestoring(true);
      try {
        const result = await performCloudRestore();
        if (!result.success || !result.data) {
          Alert.alert('Restore Failed', result.error || 'Unknown error');
          return;
        }

        const actionLabel = mode === 'replace' ? 'Replace' : 'Merge';

        Alert.alert(
          `${actionLabel} Local Data?`,
          mode === 'replace'
            ? 'This will replace ALL your local data with the cloud backup. This action cannot be undone.'
            : 'This will merge the cloud backup with your local data. Existing records will be kept.',
          [
            {text: 'Cancel', style: 'cancel'},
            {
              text: actionLabel,
              style: mode === 'replace' ? 'destructive' : 'default',
              onPress: () => {
                applyBackupData(result.data!, mode);
                Alert.alert(
                  'Restore Complete',
                  mode === 'replace'
                    ? 'All data has been restored from the backup.'
                    : 'Backup data has been merged with your local data.',
                  [{text: 'OK', onPress: () => navigation.goBack()}]
                );
              },
            },
          ]
        );
      } catch {
        Alert.alert('Error', 'Failed to restore data');
      } finally {
        setIsRestoring(false);
      }
    },
    [navigation]
  );

  const isLoading = isBackingUp || isRestoring;

  // Android: needs Google sign-in
  if (isAndroid && !settings.googleUserId) {
    return (
      <View
        style={[styles.container, {backgroundColor: theme.colors.background}]}>
        <AdvancedHeader
          title="Backup & Restore"
          showBack
          onBack={() => navigation.goBack()}
          variant="elevated"
        />
        <View style={styles.centeredContent}>
          <Animated.View
            entering={FadeInDown.delay(100).duration(400)}
            style={styles.signInContainer}>
            <View
              style={[
                styles.iconCircle,
                {backgroundColor: theme.colors.primary + '15'},
              ]}>
              <Icon
                name="google"
                size={48}
                color={theme.colors.primary}
              />
            </View>
            <Text style={[styles.signInTitle, {color: theme.colors.text}]}>
              Sign in to Backup
            </Text>
            <Text
              style={[
                styles.signInSubtitle,
                {color: theme.colors.textSecondary},
              ]}>
              Sign in with your Google account to backup your data to Google
              Drive. Your data is stored privately and only accessible by this
              app.
            </Text>
            <GradientButton
              title={isSigningIn ? 'Signing in...' : 'Sign in with Google'}
              onPress={handleGoogleSignIn}
              loading={isSigningIn}
              fullWidth
              icon="google"
              size="large"
            />
          </Animated.View>
        </View>
      </View>
    );
  }

  return (
    <View
      style={[styles.container, {backgroundColor: theme.colors.background}]}>
      <AdvancedHeader
        title="Backup & Restore"
        showBack
        onBack={() => navigation.goBack()}
        variant="elevated"
      />

      <ScrollView
        style={styles.scrollContent}
        contentContainerStyle={[
          styles.scrollInner,
          {paddingBottom: insets.bottom + 32},
        ]}
        showsVerticalScrollIndicator={false}>
        {/* Account Card (Android only) */}
        {isAndroid && settings.googleUserId && (
          <Animated.View entering={FadeInDown.delay(50).duration(400)}>
            <Card padding="medium" style={styles.card}>
              <View style={styles.accountRow}>
                <View
                  style={[
                    styles.avatarCircle,
                    {backgroundColor: theme.colors.success + '20'},
                  ]}>
                  <Icon
                    name="account-check"
                    size={24}
                    color={theme.colors.success}
                  />
                </View>
                <View style={styles.accountInfo}>
                  <Text
                    style={[styles.accountName, {color: theme.colors.text}]}>
                    {settings.googleUserName || 'Google Account'}
                  </Text>
                  <Text
                    style={[
                      styles.accountEmail,
                      {color: theme.colors.textMuted},
                    ]}>
                    {settings.googleUserEmail || 'Connected'}
                  </Text>
                </View>
                <Pressable onPress={handleGoogleSignOut}>
                  <Icon
                    name="logout"
                    size={20}
                    color={theme.colors.error}
                  />
                </Pressable>
              </View>
            </Card>
          </Animated.View>
        )}

        {/* Cloud Provider Info */}
        <Animated.View entering={FadeInDown.delay(100).duration(400)}>
          <Card padding="medium" style={styles.card}>
            <View style={styles.providerRow}>
              <Icon
                name={isAndroid ? 'google-drive' : 'apple-icloud'}
                size={32}
                color={theme.colors.primary}
              />
              <View style={styles.providerInfo}>
                <Text
                  style={[styles.providerTitle, {color: theme.colors.text}]}>
                  {providerLabel}
                </Text>
                <Text
                  style={[
                    styles.providerSubtitle,
                    {color: theme.colors.textSecondary},
                  ]}>
                  Your data is encrypted and stored privately
                </Text>
              </View>
            </View>
          </Card>
        </Animated.View>

        {/* Last Backup Info */}
        <Animated.View entering={FadeInDown.delay(150).duration(400)}>
          <Card padding="medium" style={styles.card}>
            <View style={styles.lastBackupRow}>
              <Icon
                name="clock-outline"
                size={24}
                color={
                  settings.lastBackupTime
                    ? theme.colors.success
                    : theme.colors.textMuted
                }
              />
              <View style={styles.lastBackupInfo}>
                <Text
                  style={[
                    styles.lastBackupTitle,
                    {color: theme.colors.text},
                  ]}>
                  Last Backup
                </Text>
                <Text
                  style={[
                    styles.lastBackupTime,
                    {color: theme.colors.textSecondary},
                  ]}>
                  {settings.lastBackupTime
                    ? formatTimeAgo(settings.lastBackupTime)
                    : 'Never'}
                </Text>
              </View>
            </View>

            {/* Cloud backup stats */}
            {isCheckingBackup ? (
              <View style={styles.statsLoading}>
                <ActivityIndicator
                  size="small"
                  color={theme.colors.primary}
                />
                <Text
                  style={[
                    styles.statsLoadingText,
                    {color: theme.colors.textMuted},
                  ]}>
                  Checking cloud backup...
                </Text>
              </View>
            ) : cloudData ? (
              <View style={styles.statsGrid}>
                <StatItem
                  label="Expenses"
                  value={cloudData.expenses.length}
                  theme={theme}
                />
                <StatItem
                  label="Categories"
                  value={cloudData.categories.length}
                  theme={theme}
                />
                <StatItem
                  label="Income"
                  value={(cloudData.incomes || []).length}
                  theme={theme}
                />
                <StatItem
                  label="Budgets"
                  value={(cloudData.budgets || []).length}
                  theme={theme}
                />
                <StatItem
                  label="Transfers"
                  value={(cloudData.transfers || []).length}
                  theme={theme}
                />
                <StatItem
                  label="Accounts"
                  value={(cloudData.accounts || []).length}
                  theme={theme}
                />
              </View>
            ) : (
              <Text
                style={[
                  styles.noBackupText,
                  {color: theme.colors.textMuted},
                ]}>
                No backup found in {providerLabel}
              </Text>
            )}
          </Card>
        </Animated.View>

        {/* Auto Backup Toggle */}
        <Animated.View entering={FadeInDown.delay(200).duration(400)}>
          <Card padding="none" style={styles.card}>
            <View style={styles.toggleRow}>
              <View
                style={[
                  styles.toggleIcon,
                  {backgroundColor: theme.colors.primary + '15'},
                ]}>
                <Icon
                  name="cloud-sync"
                  size={20}
                  color={theme.colors.primary}
                />
              </View>
              <View style={styles.toggleContent}>
                <Text
                  style={[styles.toggleTitle, {color: theme.colors.text}]}>
                  Daily Auto Backup
                </Text>
                <Text
                  style={[
                    styles.toggleSubtitle,
                    {color: theme.colors.textMuted},
                  ]}>
                  Automatically backup daily when data changes
                </Text>
              </View>
              <Switch
                value={settings.autoBackupEnabled}
                onValueChange={setAutoBackup}
                trackColor={{
                  false: theme.colors.border,
                  true: theme.colors.primary,
                }}
              />
            </View>
          </Card>
        </Animated.View>

        {/* Actions */}
        <Animated.View entering={FadeInDown.delay(250).duration(400)}>
          <Text
            style={[
              styles.sectionTitle,
              {color: theme.colors.textSecondary},
            ]}>
            Backup
          </Text>
          <GradientButton
            title={isBackingUp ? 'Backing up...' : 'Backup Now'}
            onPress={handleBackupNow}
            loading={isBackingUp}
            fullWidth
            icon="cloud-upload"
            size="large"
            disabled={isLoading}
          />
        </Animated.View>

        <Animated.View entering={FadeInDown.delay(300).duration(400)}>
          <Text
            style={[
              styles.sectionTitle,
              {color: theme.colors.textSecondary},
            ]}>
            Restore
          </Text>
          <GradientButton
            title="Replace Local Data"
            onPress={() => handleRestore('replace')}
            loading={isRestoring}
            fullWidth
            icon="cloud-download"
            size="large"
            disabled={isLoading || !cloudData}
          />
          <View style={{height: 12}} />
          <GradientButton
            title="Merge with Local Data"
            onPress={() => handleRestore('merge')}
            variant="outline"
            loading={isRestoring}
            fullWidth
            icon="merge"
            size="large"
            disabled={isLoading || !cloudData}
          />
          <Text style={[styles.helpText, {color: theme.colors.textMuted}]}>
            Replace: Clears local data and restores from backup.{'\n'}
            Merge: Keeps existing records and adds missing ones from backup.
          </Text>
        </Animated.View>
      </ScrollView>
    </View>
  );
});

BackupScreen.displayName = 'BackupScreen';

const StatItem = memo(
  ({label, value, theme}: {label: string; value: number; theme: any}) => (
    <View style={styles.statItem}>
      <Text style={[styles.statValue, {color: theme.colors.text}]}>
        {value}
      </Text>
      <Text style={[styles.statLabel, {color: theme.colors.textMuted}]}>
        {label}
      </Text>
    </View>
  )
);

StatItem.displayName = 'StatItem';

const styles = StyleSheet.create({
  container: {
    flex: 1,
  },
  centeredContent: {
    flex: 1,
    justifyContent: 'center',
    paddingHorizontal: 24,
  },
  signInContainer: {
    alignItems: 'center',
  },
  iconCircle: {
    width: 96,
    height: 96,
    borderRadius: 48,
    alignItems: 'center',
    justifyContent: 'center',
    marginBottom: 24,
  },
  signInTitle: {
    fontSize: 22,
    fontWeight: '700',
    marginBottom: 12,
  },
  signInSubtitle: {
    fontSize: 14,
    textAlign: 'center',
    lineHeight: 20,
    marginBottom: 32,
    paddingHorizontal: 16,
  },
  scrollContent: {
    flex: 1,
  },
  scrollInner: {
    padding: 16,
  },
  card: {
    marginBottom: 12,
  },
  accountRow: {
    flexDirection: 'row',
    alignItems: 'center',
  },
  avatarCircle: {
    width: 44,
    height: 44,
    borderRadius: 22,
    alignItems: 'center',
    justifyContent: 'center',
    marginRight: 12,
  },
  accountInfo: {
    flex: 1,
  },
  accountName: {
    fontSize: 16,
    fontWeight: '600',
  },
  accountEmail: {
    fontSize: 13,
    marginTop: 2,
  },
  providerRow: {
    flexDirection: 'row',
    alignItems: 'center',
  },
  providerInfo: {
    flex: 1,
    marginLeft: 12,
  },
  providerTitle: {
    fontSize: 16,
    fontWeight: '600',
  },
  providerSubtitle: {
    fontSize: 13,
    marginTop: 2,
  },
  lastBackupRow: {
    flexDirection: 'row',
    alignItems: 'center',
    marginBottom: 16,
  },
  lastBackupInfo: {
    flex: 1,
    marginLeft: 12,
  },
  lastBackupTitle: {
    fontSize: 15,
    fontWeight: '600',
  },
  lastBackupTime: {
    fontSize: 13,
    marginTop: 2,
  },
  statsLoading: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    paddingVertical: 12,
  },
  statsLoadingText: {
    fontSize: 13,
    marginLeft: 8,
  },
  statsGrid: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    gap: 4,
  },
  statItem: {
    width: '30%',
    alignItems: 'center',
    paddingVertical: 8,
  },
  statValue: {
    fontSize: 20,
    fontWeight: '700',
  },
  statLabel: {
    fontSize: 11,
    marginTop: 2,
  },
  noBackupText: {
    fontSize: 13,
    textAlign: 'center',
    paddingVertical: 8,
  },
  toggleRow: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingVertical: 14,
    paddingHorizontal: 16,
  },
  toggleIcon: {
    width: 36,
    height: 36,
    borderRadius: 10,
    alignItems: 'center',
    justifyContent: 'center',
    marginRight: 12,
  },
  toggleContent: {
    flex: 1,
  },
  toggleTitle: {
    fontSize: 16,
    fontWeight: '500',
  },
  toggleSubtitle: {
    fontSize: 12,
    marginTop: 2,
  },
  sectionTitle: {
    fontSize: 13,
    fontWeight: '600',
    textTransform: 'uppercase',
    letterSpacing: 0.5,
    marginTop: 16,
    marginBottom: 8,
    marginLeft: 4,
  },
  helpText: {
    fontSize: 12,
    textAlign: 'center',
    marginTop: 16,
    lineHeight: 18,
  },
});

export default BackupScreen;
