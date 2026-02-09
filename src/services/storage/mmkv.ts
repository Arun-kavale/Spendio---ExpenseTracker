/**
 * MMKV Storage Service
 * 
 * Provides a type-safe wrapper around react-native-mmkv
 * for persistent local storage operations.
 */

import {MMKV} from 'react-native-mmkv';

// Initialize MMKV instance
export const storage = new MMKV({
  id: 'expense-tracker-storage',
  encryptionKey: 'expense-tracker-secure-key',
});

// Storage Keys
export const STORAGE_KEYS = {
  EXPENSES: 'expenses',
  CATEGORIES: 'categories',
  SETTINGS: 'app_settings',
  ONBOARDING_COMPLETE: 'onboarding_complete',
  INCOMES: 'incomes',
  BUDGETS: 'budgets',
  TRANSFERS: 'transfers',
  ACCOUNTS: 'accounts',
} as const;

type StorageKey = (typeof STORAGE_KEYS)[keyof typeof STORAGE_KEYS];

/**
 * Type-safe storage operations
 */
export const StorageService = {
  /**
   * Get a value from storage
   */
  get<T>(key: StorageKey): T | null {
    const value = storage.getString(key);
    if (value === undefined) {
      return null;
    }
    try {
      return JSON.parse(value) as T;
    } catch {
      return null;
    }
  },

  /**
   * Set a value in storage
   */
  set<T>(key: StorageKey, value: T): void {
    storage.set(key, JSON.stringify(value));
  },

  /**
   * Remove a value from storage
   */
  remove(key: StorageKey): void {
    storage.delete(key);
  },

  /**
   * Check if a key exists
   */
  has(key: StorageKey): boolean {
    return storage.contains(key);
  },

  /**
   * Clear all storage
   */
  clearAll(): void {
    storage.clearAll();
  },

  /**
   * Get all keys
   */
  getAllKeys(): string[] {
    return storage.getAllKeys();
  },
};

export default StorageService;
