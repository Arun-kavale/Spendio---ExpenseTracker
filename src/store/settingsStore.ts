/**
 * Settings Store
 * 
 * Manages app settings including theme, currency, and backup preferences.
 */

import {create} from 'zustand';
import {AppSettings, ThemeMode, Currency} from '@/types';
import {StorageService, STORAGE_KEYS} from '@/services/storage';
import {DEFAULT_CURRENCY} from '@/constants/currencies';

interface SettingsState {
  settings: AppSettings;
  isLoading: boolean;
  
  // Actions
  loadSettings: () => void;
  setTheme: (theme: ThemeMode) => void;
  setCurrency: (currency: Currency) => void;
  setAutoBackup: (enabled: boolean) => void;
  setLastBackupTime: (time: number) => void;
  setGoogleUser: (userId: string | null, email: string | null, name: string | null) => void;
  resetSettings: () => void;
}

const defaultSettings: AppSettings = {
  theme: 'system',
  currency: DEFAULT_CURRENCY,
  lastBackupTime: null,
  isFirstLaunch: true,
  googleUserId: null,
  googleUserEmail: null,
  googleUserName: null,
  autoBackupEnabled: false,
};

export const useSettingsStore = create<SettingsState>((set, get) => ({
  settings: defaultSettings,
  isLoading: true,
  
  loadSettings: () => {
    const stored = StorageService.get<AppSettings>(STORAGE_KEYS.SETTINGS);
    if (stored) {
      set({settings: {...defaultSettings, ...stored}, isLoading: false});
    } else {
      StorageService.set(STORAGE_KEYS.SETTINGS, defaultSettings);
      set({isLoading: false});
    }
  },
  
  setTheme: (theme: ThemeMode) => {
    const current = get().settings;
    const updated = {...current, theme};
    StorageService.set(STORAGE_KEYS.SETTINGS, updated);
    set({settings: updated});
  },
  
  setCurrency: (currency: Currency) => {
    const current = get().settings;
    const updated = {...current, currency};
    StorageService.set(STORAGE_KEYS.SETTINGS, updated);
    set({settings: updated});
  },
  
  setAutoBackup: (enabled: boolean) => {
    const current = get().settings;
    const updated = {...current, autoBackupEnabled: enabled};
    StorageService.set(STORAGE_KEYS.SETTINGS, updated);
    set({settings: updated});
  },
  
  setLastBackupTime: (time: number) => {
    const current = get().settings;
    const updated = {...current, lastBackupTime: time};
    StorageService.set(STORAGE_KEYS.SETTINGS, updated);
    set({settings: updated});
  },
  
  setGoogleUser: (userId: string | null, email: string | null, name: string | null) => {
    const current = get().settings;
    const updated = {
      ...current,
      googleUserId: userId,
      googleUserEmail: email,
      googleUserName: name,
      isFirstLaunch: false,
    };
    StorageService.set(STORAGE_KEYS.SETTINGS, updated);
    set({settings: updated});
  },
  
  resetSettings: () => {
    StorageService.set(STORAGE_KEYS.SETTINGS, defaultSettings);
    set({settings: defaultSettings});
  },
}));
