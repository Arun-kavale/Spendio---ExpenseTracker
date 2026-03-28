/**
 * iCloud Backup Service
 * 
 * Handles backup and restore operations using iCloud Documents directory.
 * Uses react-native-fs to write to the iCloud ubiquity container.
 * iOS only — on Android this module is a no-op that returns clear errors.
 */

import {Platform} from 'react-native';
import RNFS from 'react-native-fs';
import {BackupData} from '@/types';
import {
  useExpenseStore,
  useCategoryStore,
  useSettingsStore,
  useIncomeStore,
  useBudgetStore,
  useTransferStore,
  useAccountStore,
} from '@/store';
import {validateBackupData, applyBackupData} from './googleDriveBackup';

const BACKUP_FILE_NAME = 'SpendioBackup.json';
const BACKUP_VERSION = '2.0.0';

export interface ICloudBackupResult {
  success: boolean;
  error?: string;
  timestamp?: number;
}

export interface ICloudRestoreResult {
  success: boolean;
  error?: string;
  data?: BackupData;
}

/**
 * Get the iCloud Documents path.
 * RNFS provides `LibraryDirectoryPath` on iOS; we use a subdirectory
 * that maps into the iCloud ubiquity container when iCloud Drive
 * is enabled for the app in the entitlements.
 *
 * For iCloud Documents (visible in Files app) the path is typically
 * obtained via the iCloud container URL. react-native-fs does not
 * expose this directly, so we fall back to writing into the app's
 * Documents directory, which syncs to iCloud when the
 * "iCloud Documents" capability + ubiquity container is configured
 * in Xcode (NSUbiquitousContainers in Info.plist).
 */
const getICloudBackupPath = (): string | null => {
  if (Platform.OS !== 'ios') {
    return null;
  }
  return `${RNFS.DocumentDirectoryPath}/${BACKUP_FILE_NAME}`;
};

/**
 * Create backup data from current app state
 */
const createBackupData = (): BackupData => {
  const expenses = useExpenseStore.getState().expenses;
  const categories = useCategoryStore.getState().categories;
  const incomes = useIncomeStore.getState().incomes;
  const budgets = useBudgetStore.getState().budgets;
  const transfers = useTransferStore.getState().transfers;
  const accounts = useAccountStore.getState().accounts;
  const settings = useSettingsStore.getState().settings;

  const {googleUserId, googleUserEmail, googleUserName, ...settingsToBackup} = settings;

  return {
    version: BACKUP_VERSION,
    lastSync: Date.now(),
    expenses,
    categories,
    incomes,
    budgets,
    transfers,
    accounts,
    settings: settingsToBackup,
  };
};

/**
 * Backup to iCloud Documents directory
 */
export const backupToICloud = async (): Promise<ICloudBackupResult> => {
  if (Platform.OS !== 'ios') {
    return {success: false, error: 'iCloud backup is only available on iOS.'};
  }

  try {
    const filePath = getICloudBackupPath();
    if (!filePath) {
      return {success: false, error: 'Could not determine iCloud backup path.'};
    }

    const backupData = createBackupData();
    const backupJson = JSON.stringify(backupData);

    await RNFS.writeFile(filePath, backupJson, 'utf8');

    const timestamp = Date.now();
    useSettingsStore.getState().setLastBackupTime(timestamp);

    return {success: true, timestamp};
  } catch (error) {
    const message = error instanceof Error ? error.message : 'Unknown error occurred';
    return {success: false, error: message};
  }
};

/**
 * Restore from iCloud Documents directory
 */
export const restoreFromICloud = async (): Promise<ICloudRestoreResult> => {
  if (Platform.OS !== 'ios') {
    return {success: false, error: 'iCloud restore is only available on iOS.'};
  }

  try {
    const filePath = getICloudBackupPath();
    if (!filePath) {
      return {success: false, error: 'Could not determine iCloud backup path.'};
    }

    const exists = await RNFS.exists(filePath);
    if (!exists) {
      return {success: false, error: 'No backup found in iCloud.'};
    }

    const content = await RNFS.readFile(filePath, 'utf8');
    let rawData: unknown;
    try {
      rawData = JSON.parse(content);
    } catch {
      return {success: false, error: 'Backup file is corrupted.'};
    }

    if (!validateBackupData(rawData)) {
      return {success: false, error: 'Invalid backup file format.'};
    }

    return {success: true, data: rawData as BackupData};
  } catch (error) {
    const message = error instanceof Error ? error.message : 'Unknown error occurred';
    return {success: false, error: message};
  }
};

/**
 * Check if an iCloud backup exists
 */
export const hasICloudBackup = async (): Promise<boolean> => {
  if (Platform.OS !== 'ios') {
    return false;
  }

  try {
    const filePath = getICloudBackupPath();
    if (!filePath) {
      return false;
    }
    return await RNFS.exists(filePath);
  } catch {
    return false;
  }
};

/**
 * Delete iCloud backup
 */
export const deleteICloudBackup = async (): Promise<boolean> => {
  if (Platform.OS !== 'ios') {
    return false;
  }

  try {
    const filePath = getICloudBackupPath();
    if (!filePath) {
      return false;
    }

    const exists = await RNFS.exists(filePath);
    if (!exists) {
      return true;
    }

    await RNFS.unlink(filePath);
    return true;
  } catch {
    return false;
  }
};

export {applyBackupData};
