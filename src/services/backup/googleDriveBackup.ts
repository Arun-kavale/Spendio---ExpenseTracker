/**
 * Google Drive Backup Service
 * 
 * Handles backup and restore operations using Google Drive App Data folder.
 * This folder is private to the app and not visible to users in their Drive.
 * Backs up ALL app data: expenses, categories, incomes, budgets, transfers, accounts, and settings.
 */

import {getAccessToken} from '@/services/auth/googleAuth';
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

const BACKUP_FILE_NAME = 'spendio_backup.json';
const BACKUP_VERSION = '2.0.0';
const DRIVE_API_BASE = 'https://www.googleapis.com/drive/v3';
const DRIVE_UPLOAD_BASE = 'https://www.googleapis.com/upload/drive/v3';

export interface BackupResult {
  success: boolean;
  error?: string;
  timestamp?: number;
}

export interface RestoreResult {
  success: boolean;
  error?: string;
  data?: BackupData;
}

/**
 * Generate a simple hash of the current data state to detect changes.
 * Uses record counts and latest updatedAt timestamps for efficiency.
 */
export const generateDataHash = (): string => {
  const expenses = useExpenseStore.getState().expenses;
  const categories = useCategoryStore.getState().categories;
  const incomes = useIncomeStore.getState().incomes;
  const budgets = useBudgetStore.getState().budgets;
  const transfers = useTransferStore.getState().transfers;
  const accounts = useAccountStore.getState().accounts;

  const latestTimestamp = (items: {updatedAt: number}[]): number =>
    items.reduce((max, item) => Math.max(max, item.updatedAt), 0);

  const parts = [
    `e:${expenses.length}:${latestTimestamp(expenses)}`,
    `c:${categories.length}:${latestTimestamp(categories)}`,
    `i:${incomes.length}:${latestTimestamp(incomes)}`,
    `b:${budgets.length}:${latestTimestamp(budgets)}`,
    `t:${transfers.length}:${latestTimestamp(transfers)}`,
    `a:${accounts.length}:${latestTimestamp(accounts)}`,
  ];

  return parts.join('|');
};

/**
 * Create backup data from current app state — includes ALL data modules
 */
export const createBackupData = (): BackupData => {
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
 * Validate backup data structure to prevent corrupt restores
 */
export const validateBackupData = (data: unknown): data is BackupData => {
  if (typeof data !== 'object' || data === null) {
    return false;
  }

  const backup = data as Record<string, unknown>;

  if (typeof backup.version !== 'string' || typeof backup.lastSync !== 'number') {
    return false;
  }

  if (!Array.isArray(backup.expenses) || !Array.isArray(backup.categories)) {
    return false;
  }

  if (!Array.isArray(backup.incomes)) {
    (backup as Record<string, unknown>).incomes = [];
  }
  if (!Array.isArray(backup.budgets)) {
    (backup as Record<string, unknown>).budgets = [];
  }
  if (!Array.isArray(backup.transfers)) {
    (backup as Record<string, unknown>).transfers = [];
  }
  if (!Array.isArray(backup.accounts)) {
    (backup as Record<string, unknown>).accounts = [];
  }

  if (typeof backup.settings !== 'object' || backup.settings === null) {
    return false;
  }

  return true;
};

/**
 * Find existing backup file in Drive App Data folder
 */
const findBackupFile = async (accessToken: string): Promise<string | null> => {
  try {
    const response = await fetch(
      `${DRIVE_API_BASE}/files?spaces=appDataFolder&q=name='${BACKUP_FILE_NAME}'&fields=files(id,name,modifiedTime)`,
      {
        headers: {
          Authorization: `Bearer ${accessToken}`,
        },
      }
    );
    
    if (!response.ok) {
      return null;
    }
    
    const data = await response.json();
    if (data.files && data.files.length > 0) {
      return data.files[0].id;
    }
    
    return null;
  } catch {
    return null;
  }
};

/**
 * Upload backup to Google Drive
 */
export const backupToGoogleDrive = async (): Promise<BackupResult> => {
  try {
    const accessToken = await getAccessToken();
    if (!accessToken) {
      return {success: false, error: 'Not authenticated. Please sign in with Google.'};
    }
    
    const backupData = createBackupData();
    const backupJson = JSON.stringify(backupData);
    
    const existingFileId = await findBackupFile(accessToken);
    
    const boundary = '-------314159265358979323846';
    const delimiter = `\r\n--${boundary}\r\n`;
    const closeDelimiter = `\r\n--${boundary}--`;
    
    const metadata = {
      name: BACKUP_FILE_NAME,
      mimeType: 'application/json',
      parents: existingFileId ? undefined : ['appDataFolder'],
    };
    
    const multipartBody =
      delimiter +
      'Content-Type: application/json; charset=UTF-8\r\n\r\n' +
      JSON.stringify(metadata) +
      delimiter +
      'Content-Type: application/json\r\n\r\n' +
      backupJson +
      closeDelimiter;
    
    const url = existingFileId
      ? `${DRIVE_UPLOAD_BASE}/files/${existingFileId}?uploadType=multipart`
      : `${DRIVE_UPLOAD_BASE}/files?uploadType=multipart`;
    
    const method = existingFileId ? 'PATCH' : 'POST';
    
    const response = await fetch(url, {
      method,
      headers: {
        Authorization: `Bearer ${accessToken}`,
        'Content-Type': `multipart/related; boundary=${boundary}`,
      },
      body: multipartBody,
    });
    
    if (!response.ok) {
      const error = await response.text();
      return {success: false, error: `Failed to backup: ${error}`};
    }
    
    const timestamp = Date.now();
    useSettingsStore.getState().setLastBackupTime(timestamp);
    
    return {success: true, timestamp};
  } catch (error) {
    const message = error instanceof Error ? error.message : 'Unknown error occurred';
    return {success: false, error: message};
  }
};

/**
 * Restore backup from Google Drive
 */
export const restoreFromGoogleDrive = async (): Promise<RestoreResult> => {
  try {
    const accessToken = await getAccessToken();
    if (!accessToken) {
      return {success: false, error: 'Not authenticated. Please sign in with Google.'};
    }
    
    const fileId = await findBackupFile(accessToken);
    if (!fileId) {
      return {success: false, error: 'No backup found in your Google Drive.'};
    }
    
    const response = await fetch(
      `${DRIVE_API_BASE}/files/${fileId}?alt=media`,
      {
        headers: {
          Authorization: `Bearer ${accessToken}`,
        },
      }
    );
    
    if (!response.ok) {
      return {success: false, error: 'Failed to download backup'};
    }
    
    const rawData = await response.json();
    
    if (!validateBackupData(rawData)) {
      return {success: false, error: 'Invalid or corrupted backup file'};
    }
    
    return {success: true, data: rawData as BackupData};
  } catch (error) {
    const message = error instanceof Error ? error.message : 'Unknown error occurred';
    return {success: false, error: message};
  }
};

/**
 * Apply restored backup data to ALL app stores
 */
export const applyBackupData = (
  data: BackupData,
  mode: 'replace' | 'merge'
): void => {
  const expenseStore = useExpenseStore.getState();
  const categoryStore = useCategoryStore.getState();
  const incomeStore = useIncomeStore.getState();
  const budgetStore = useBudgetStore.getState();
  const transferStore = useTransferStore.getState();
  const accountStore = useAccountStore.getState();
  const settingsStore = useSettingsStore.getState();
  
  if (mode === 'replace') {
    expenseStore.clearAllExpenses();
    categoryStore.resetToDefaults();
    incomeStore.clearAllIncomes();
    budgetStore.clearAllBudgets();
    transferStore.clearAllTransfers();
    accountStore.clearAllAccounts();

    expenseStore.importExpenses(data.expenses);
    categoryStore.importCategories(data.categories);
    incomeStore.importIncomes(data.incomes || []);
    budgetStore.importBudgets(data.budgets || []);
    transferStore.importTransfers(data.transfers || []);
    accountStore.importAccounts(data.accounts || []);
  } else {
    expenseStore.importExpenses(data.expenses);
    categoryStore.importCategories(data.categories);
    incomeStore.importIncomes(data.incomes || []);
    budgetStore.importBudgets(data.budgets || []);
    transferStore.importTransfers(data.transfers || []);
    accountStore.importAccounts(data.accounts || []);
  }
  
  if (data.settings) {
    settingsStore.setTheme(data.settings.theme);
    settingsStore.setCurrency(data.settings.currency);
    settingsStore.setAutoBackup(data.settings.autoBackupEnabled);
  }
};

/**
 * Check if there's a conflict between local and cloud data
 */
export const checkForConflict = async (): Promise<{
  hasConflict: boolean;
  cloudData?: BackupData;
}> => {
  const restoreResult = await restoreFromGoogleDrive();
  
  if (!restoreResult.success || !restoreResult.data) {
    return {hasConflict: false};
  }
  
  const localExpenses = useExpenseStore.getState().expenses;
  const cloudData = restoreResult.data;
  
  if (localExpenses.length > 0 && cloudData.expenses.length > 0) {
    const localIds = new Set(localExpenses.map(e => e.id));
    const cloudIds = new Set(cloudData.expenses.map(e => e.id));
    
    const hasNewLocal = localExpenses.some(e => !cloudIds.has(e.id));
    const hasNewCloud = cloudData.expenses.some(e => !localIds.has(e.id));
    
    if (hasNewLocal && hasNewCloud) {
      return {hasConflict: true, cloudData};
    }
  }
  
  return {hasConflict: false, cloudData};
};

/**
 * Delete backup from Google Drive
 */
export const deleteBackupFromGoogleDrive = async (): Promise<boolean> => {
  try {
    const accessToken = await getAccessToken();
    if (!accessToken) {
      return false;
    }
    
    const fileId = await findBackupFile(accessToken);
    if (!fileId) {
      return true;
    }
    
    const response = await fetch(`${DRIVE_API_BASE}/files/${fileId}`, {
      method: 'DELETE',
      headers: {
        Authorization: `Bearer ${accessToken}`,
      },
    });
    
    return response.ok;
  } catch {
    return false;
  }
};
