/**
 * Backup Screen
 * 
 * Restore data from Google Drive backup.
 */

import React, {memo, useState, useCallback, useEffect} from 'react';
import {View, Text, StyleSheet, Alert} from 'react-native';
import {useSafeAreaInsets} from 'react-native-safe-area-context';
import Animated, {FadeInDown} from 'react-native-reanimated';
import Icon from 'react-native-vector-icons/MaterialCommunityIcons';
import {useNavigation} from '@react-navigation/native';
import {useTheme} from '@/hooks';
import {useSettingsStore} from '@/store';
import {Card, Button, AdvancedHeader} from '@/components/common';
import {GradientButton} from '@/components/gradient';
import {
  restoreFromGoogleDrive,
  applyBackupData,
  checkForConflict,
} from '@/services/backup/googleDriveBackup';
import {BackupData} from '@/types';
import {formatTimeAgo} from '@/utils';

export const BackupScreen = memo(() => {
  const theme = useTheme();
  const insets = useSafeAreaInsets();
  const navigation = useNavigation();
  
  const {settings} = useSettingsStore();
  
  const [isLoading, setIsLoading] = useState(false);
  const [cloudData, setCloudData] = useState<BackupData | null>(null);
  const [hasConflict, setHasConflict] = useState(false);
  
  // Check for backup on mount
  useEffect(() => {
    const checkBackup = async () => {
      if (!settings.googleUserId) return;
      
      setIsLoading(true);
      try {
        const conflict = await checkForConflict();
        setHasConflict(conflict.hasConflict);
        if (conflict.cloudData) {
          setCloudData(conflict.cloudData);
        }
      } catch {
        // Silently fail
      } finally {
        setIsLoading(false);
      }
    };
    
    checkBackup();
  }, [settings.googleUserId]);
  
  const handleRestore = useCallback(async (mode: 'replace' | 'merge') => {
    setIsLoading(true);
    try {
      const result = await restoreFromGoogleDrive();
      
      if (!result.success || !result.data) {
        Alert.alert('Restore Failed', result.error || 'Unknown error');
        return;
      }
      
      const actionLabel = mode === 'replace' ? 'Replace' : 'Merge';
      
      Alert.alert(
        `${actionLabel} Local Data?`,
        mode === 'replace'
          ? 'This will replace all your local data with the cloud backup. This cannot be undone.'
          : 'This will merge the cloud backup with your local data, keeping both.',
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
                  ? 'Your data has been restored from the backup.'
                  : 'Your data has been merged with the backup.',
                [{text: 'OK', onPress: () => navigation.goBack()}]
              );
            },
          },
        ]
      );
    } catch {
      Alert.alert('Error', 'Failed to restore data');
    } finally {
      setIsLoading(false);
    }
  }, [navigation]);
  
  if (!settings.googleUserId) {
    return (
      <View style={[styles.container, {backgroundColor: theme.colors.background}]}>
        <AdvancedHeader
          title="Restore Backup"
          showBack
          onBack={() => navigation.goBack()}
          variant="elevated"
        />
        <View style={styles.emptyContainer}>
          <Icon
            name="cloud-off-outline"
            size={64}
            color={theme.colors.textMuted}
          />
          <Text style={[styles.emptyTitle, {color: theme.colors.text}]}>
            Not Signed In
          </Text>
          <Text style={[styles.emptyText, {color: theme.colors.textSecondary}]}>
            Please sign in with Google in Settings to access cloud backup.
          </Text>
        </View>
      </View>
    );
  }
  
  return (
    <View style={[styles.container, {backgroundColor: theme.colors.background}]}>
      <AdvancedHeader
        title="Restore Backup"
        showBack
        onBack={() => navigation.goBack()}
        variant="elevated"
      />
      
      <View style={[styles.content, {paddingBottom: insets.bottom + 24}]}>
        {/* Backup Info Card */}
        <Animated.View entering={FadeInDown.delay(100).duration(400)}>
          <Card padding="large" style={styles.infoCard}>
            <Icon
              name="cloud-check"
              size={48}
              color={cloudData ? theme.colors.success : theme.colors.textMuted}
            />
            
            {cloudData ? (
              <>
                <Text style={[styles.infoTitle, {color: theme.colors.text}]}>
                  Backup Found
                </Text>
                <Text style={[styles.infoText, {color: theme.colors.textSecondary}]}>
                  Last synced: {formatTimeAgo(cloudData.lastSync)}
                </Text>
                <View style={styles.statsRow}>
                  <View style={styles.statItem}>
                    <Text style={[styles.statValue, {color: theme.colors.text}]}>
                      {cloudData.expenses.length}
                    </Text>
                    <Text style={[styles.statLabel, {color: theme.colors.textMuted}]}>
                      Expenses
                    </Text>
                  </View>
                  <View style={styles.statItem}>
                    <Text style={[styles.statValue, {color: theme.colors.text}]}>
                      {cloudData.categories.length}
                    </Text>
                    <Text style={[styles.statLabel, {color: theme.colors.textMuted}]}>
                      Categories
                    </Text>
                  </View>
                </View>
              </>
            ) : (
              <>
                <Text style={[styles.infoTitle, {color: theme.colors.text}]}>
                  {isLoading ? 'Checking...' : 'No Backup Found'}
                </Text>
                <Text style={[styles.infoText, {color: theme.colors.textSecondary}]}>
                  {isLoading
                    ? 'Looking for backup in Google Drive...'
                    : 'No backup data found in your Google Drive.'}
                </Text>
              </>
            )}
          </Card>
        </Animated.View>
        
        {/* Conflict Warning */}
        {hasConflict && (
          <Animated.View entering={FadeInDown.delay(150).duration(400)}>
            <Card padding="medium" style={styles.warningCard}>
              <View style={styles.warningRow}>
                <Icon name="alert-circle" size={24} color={theme.colors.warning} />
                <Text style={[styles.warningText, {color: theme.colors.text}]}>
                  Your local data differs from the backup. Choose how to proceed below.
                </Text>
              </View>
            </Card>
          </Animated.View>
        )}
        
        {/* Actions */}
        {cloudData && (
          <Animated.View entering={FadeInDown.delay(200).duration(400)}>
            <View style={styles.actions}>
              <GradientButton
                title="Replace Local Data"
                onPress={() => handleRestore('replace')}
                loading={isLoading}
                fullWidth
                icon="cloud-download"
                size="large"
              />
              
              <View style={{height: 12}} />
              
              <GradientButton
                title="Merge with Local Data"
                onPress={() => handleRestore('merge')}
                variant="outline"
                loading={isLoading}
                fullWidth
                icon="merge"
                size="large"
              />
            </View>
            
            <Text style={[styles.helpText, {color: theme.colors.textMuted}]}>
              Replace: Deletes local data and uses backup.{'\n'}
              Merge: Keeps both local and backup data.
            </Text>
          </Animated.View>
        )}
      </View>
    </View>
  );
});

BackupScreen.displayName = 'BackupScreen';

const styles = StyleSheet.create({
  container: {
    flex: 1,
  },
  content: {
    flex: 1,
    padding: 16,
  },
  emptyContainer: {
    flex: 1,
    alignItems: 'center',
    justifyContent: 'center',
    paddingHorizontal: 32,
  },
  emptyTitle: {
    fontSize: 20,
    fontWeight: '600',
    marginTop: 16,
    marginBottom: 8,
  },
  emptyText: {
    fontSize: 14,
    textAlign: 'center',
    lineHeight: 20,
  },
  infoCard: {
    alignItems: 'center',
    marginBottom: 16,
  },
  infoTitle: {
    fontSize: 20,
    fontWeight: '600',
    marginTop: 16,
    marginBottom: 4,
  },
  infoText: {
    fontSize: 14,
    textAlign: 'center',
  },
  statsRow: {
    flexDirection: 'row',
    marginTop: 20,
    gap: 32,
  },
  statItem: {
    alignItems: 'center',
  },
  statValue: {
    fontSize: 24,
    fontWeight: '700',
  },
  statLabel: {
    fontSize: 12,
    marginTop: 4,
  },
  warningCard: {
    backgroundColor: 'rgba(245, 158, 11, 0.1)',
    marginBottom: 16,
  },
  warningRow: {
    flexDirection: 'row',
    alignItems: 'flex-start',
  },
  warningText: {
    flex: 1,
    marginLeft: 12,
    fontSize: 14,
    lineHeight: 20,
  },
  actions: {
    marginTop: 8,
  },
  helpText: {
    fontSize: 12,
    textAlign: 'center',
    marginTop: 16,
    lineHeight: 18,
  },
});

export default BackupScreen;
