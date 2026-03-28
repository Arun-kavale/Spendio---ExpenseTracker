/**
 * Cloud Backup Service — Unified Abstraction Layer
 *
 * Routes backup/restore operations to the correct platform provider:
 *   Android → Google Drive
 *   iOS     → iCloud Documents
 *
 * Also manages auto-backup scheduling, data-change detection,
 * and daily backup logic.
 */

import {Platform} from 'react-native';
import {BackupData, CloudProvider} from '@/types';
import {useSettingsStore} from '@/store';
import {
  backupToGoogleDrive,
  restoreFromGoogleDrive,
  applyBackupData,
  checkForConflict,
  generateDataHash,
  validateBackupData,
  deleteBackupFromGoogleDrive,
} from './googleDriveBackup';
import {
  backupToICloud,
  restoreFromICloud,
  hasICloudBackup,
  deleteICloudBackup,
} from './icloudBackup';

export interface CloudBackupResult {
  success: boolean;
  error?: string;
  timestamp?: number;
}

export interface CloudRestoreResult {
  success: boolean;
  error?: string;
  data?: BackupData;
}

let _lastBackupHash: string | null = null;

/**
 * Determine the active cloud provider for the current platform
 */
export const getCloudProvider = (): CloudProvider => {
  return Platform.OS === 'ios' ? 'icloud' : 'google_drive';
};

/**
 * Human-readable label for the cloud provider
 */
export const getCloudProviderLabel = (): string => {
  return Platform.OS === 'ios' ? 'iCloud' : 'Google Drive';
};

/**
 * Whether the user is authenticated for cloud backup
 */
export const isCloudAuthenticated = (): boolean => {
  const provider = getCloudProvider();
  if (provider === 'google_drive') {
    const {googleUserId} = useSettingsStore.getState().settings;
    return googleUserId !== null && googleUserId !== undefined;
  }
  // iCloud is available when the device is signed in to iCloud (OS-level).
  // We can't check from JS, so we assume available on iOS.
  return Platform.OS === 'ios';
};

/**
 * Perform cloud backup using the platform provider
 */
export const performCloudBackup = async (): Promise<CloudBackupResult> => {
  const provider = getCloudProvider();

  if (provider === 'google_drive') {
    const result = await backupToGoogleDrive();
    if (result.success) {
      _lastBackupHash = generateDataHash();
    }
    return result;
  }

  const result = await backupToICloud();
  if (result.success) {
    _lastBackupHash = generateDataHash();
  }
  return result;
};

/**
 * Restore from cloud backup using the platform provider
 */
export const performCloudRestore = async (): Promise<CloudRestoreResult> => {
  const provider = getCloudProvider();

  if (provider === 'google_drive') {
    return restoreFromGoogleDrive();
  }

  return restoreFromICloud();
};

/**
 * Delete cloud backup
 */
export const deleteCloudBackup = async (): Promise<boolean> => {
  const provider = getCloudProvider();

  if (provider === 'google_drive') {
    return deleteBackupFromGoogleDrive();
  }

  return deleteICloudBackup();
};

/**
 * Check if data has changed since the last successful backup
 */
export const hasDataChanged = (): boolean => {
  const currentHash = generateDataHash();
  if (_lastBackupHash === null) {
    return true;
  }
  return currentHash !== _lastBackupHash;
};

/**
 * Check whether a daily auto-backup is due.
 * Returns true if:
 *   1. Auto-backup is enabled
 *   2. User is authenticated (Android) or on iOS
 *   3. More than 24 hours since last backup
 *   4. Data has changed
 */
export const isDailyBackupDue = (): boolean => {
  const {autoBackupEnabled, lastBackupTime} = useSettingsStore.getState().settings;

  if (!autoBackupEnabled) {
    return false;
  }
  if (!isCloudAuthenticated()) {
    return false;
  }
  if (!hasDataChanged()) {
    return false;
  }

  const TWENTY_FOUR_HOURS = 24 * 60 * 60 * 1000;
  if (lastBackupTime === null) {
    return true;
  }

  return Date.now() - lastBackupTime >= TWENTY_FOUR_HOURS;
};

/**
 * Perform auto-backup if conditions are met (daily + data changed).
 * Safe to call on every app foreground — it is a no-op when not due.
 */
export const performAutoBackupIfDue = async (): Promise<CloudBackupResult | null> => {
  if (!isDailyBackupDue()) {
    return null;
  }

  return performCloudBackup();
};

export {applyBackupData, checkForConflict, validateBackupData, generateDataHash};
