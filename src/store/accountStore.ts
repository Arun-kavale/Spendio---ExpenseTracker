/**
 * Account Store
 *
 * Manages user accounts with CRUD operations, balance tracking, and analytics.
 * Accounts can be linked to expenses, income, and transfers.
 */

import {create} from 'zustand';
import {UserAccount, AccountWithStats, AccountCategory} from '@/types';
import {StorageService, STORAGE_KEYS} from '@/services/storage';
import {generateId} from '@/utils';

interface AccountState {
  accounts: UserAccount[];
  isLoading: boolean;

  // CRUD
  loadAccounts: () => void;
  addAccount: (
    account: Omit<UserAccount, 'id' | 'createdAt' | 'updatedAt' | 'sortOrder'>,
  ) => UserAccount;
  updateAccount: (
    id: string,
    updates: Partial<Omit<UserAccount, 'id' | 'createdAt'>>,
  ) => void;
  deleteAccount: (id: string) => void;
  getAccountById: (id: string) => UserAccount | undefined;

  // Account management
  setDefaultAccount: (id: string) => void;
  getDefaultAccount: () => UserAccount | undefined;
  toggleAccountActive: (id: string) => void;
  reorderAccounts: (orderedIds: string[]) => void;
  getActiveAccounts: () => UserAccount[];
  getAccountsByCategory: (category: AccountCategory) => UserAccount[];

  // Balance operations
  updateAccountBalance: (id: string, amount: number, type: 'add' | 'subtract') => void;
  recalculateBalance: (id: string) => void;
  getTotalBalance: () => number;
  getBalanceByCategory: (category: AccountCategory) => number;

  // Data management
  clearAllAccounts: () => void;
  importAccounts: (accounts: UserAccount[]) => void;
}

export const useAccountStore = create<AccountState>((set, get) => ({
  accounts: [],
  isLoading: true,

  loadAccounts: () => {
    const stored = StorageService.get<UserAccount[]>(STORAGE_KEYS.ACCOUNTS);
    set({accounts: stored || [], isLoading: false});
  },

  addAccount: accountData => {
    const now = Date.now();
    const accounts = get().accounts;

    // If this is set as default, unset others
    let updatedAccounts = accounts;
    if (accountData.isDefault) {
      updatedAccounts = accounts.map(acc => ({...acc, isDefault: false}));
    }

    const newAccount: UserAccount = {
      id: generateId(),
      ...accountData,
      sortOrder: accounts.length,
      createdAt: now,
      updatedAt: now,
    };

    const updated = [...updatedAccounts, newAccount];
    StorageService.set(STORAGE_KEYS.ACCOUNTS, updated);
    set({accounts: updated});
    return newAccount;
  },

  updateAccount: (id, updates) => {
    let accounts = get().accounts;

    // If setting as default, unset others first
    if (updates.isDefault === true) {
      accounts = accounts.map(acc => ({...acc, isDefault: false}));
    }

    accounts = accounts.map(acc => {
      if (acc.id === id) {
        return {...acc, ...updates, updatedAt: Date.now()};
      }
      return acc;
    });

    StorageService.set(STORAGE_KEYS.ACCOUNTS, accounts);
    set({accounts});
  },

  deleteAccount: id => {
    const updated = get().accounts.filter(a => a.id !== id);
    StorageService.set(STORAGE_KEYS.ACCOUNTS, updated);
    set({accounts: updated});
  },

  getAccountById: id => {
    return get().accounts.find(a => a.id === id);
  },

  setDefaultAccount: id => {
    const accounts = get().accounts.map(acc => ({
      ...acc,
      isDefault: acc.id === id,
      updatedAt: acc.id === id ? Date.now() : acc.updatedAt,
    }));
    StorageService.set(STORAGE_KEYS.ACCOUNTS, accounts);
    set({accounts});
  },

  getDefaultAccount: () => {
    return get().accounts.find(a => a.isDefault && a.isActive);
  },

  toggleAccountActive: id => {
    const accounts = get().accounts.map(acc => {
      if (acc.id === id) {
        return {...acc, isActive: !acc.isActive, updatedAt: Date.now()};
      }
      return acc;
    });
    StorageService.set(STORAGE_KEYS.ACCOUNTS, accounts);
    set({accounts});
  },

  reorderAccounts: orderedIds => {
    const accountMap = new Map(get().accounts.map(a => [a.id, a]));
    const reordered = orderedIds
      .map((id, index) => {
        const acc = accountMap.get(id);
        if (acc) {
          return {...acc, sortOrder: index, updatedAt: Date.now()};
        }
        return null;
      })
      .filter(Boolean) as UserAccount[];

    StorageService.set(STORAGE_KEYS.ACCOUNTS, reordered);
    set({accounts: reordered});
  },

  getActiveAccounts: () => {
    return get()
      .accounts.filter(a => a.isActive)
      .sort((a, b) => a.sortOrder - b.sortOrder);
  },

  getAccountsByCategory: category => {
    return get()
      .accounts.filter(a => a.category === category)
      .sort((a, b) => a.sortOrder - b.sortOrder);
  },

  updateAccountBalance: (id, amount, type) => {
    const accounts = get().accounts.map(acc => {
      if (acc.id === id) {
        const newBalance =
          type === 'add'
            ? acc.currentBalance + amount
            : acc.currentBalance - amount;
        return {
          ...acc,
          currentBalance: newBalance,
          updatedAt: Date.now(),
        };
      }
      return acc;
    });
    StorageService.set(STORAGE_KEYS.ACCOUNTS, accounts);
    set({accounts});
  },

  recalculateBalance: id => {
    // This will be called to recalculate balance from all transactions
    // Implementation depends on expense/income/transfer stores
    const account = get().getAccountById(id);
    if (!account) {
      return;
    }
    // Balance recalculation would need access to other stores
    // This is a placeholder - actual implementation would aggregate transactions
  },

  getTotalBalance: () => {
    return get()
      .accounts.filter(a => a.isActive)
      .reduce((sum, acc) => {
        // For credit cards, outstanding balance is negative
        if (acc.category === 'credit_card') {
          return sum - (acc.outstandingBalance || 0);
        }
        return sum + acc.currentBalance;
      }, 0);
  },

  getBalanceByCategory: category => {
    return get()
      .accounts.filter(a => a.category === category && a.isActive)
      .reduce((sum, acc) => sum + acc.currentBalance, 0);
  },

  clearAllAccounts: () => {
    StorageService.set(STORAGE_KEYS.ACCOUNTS, []);
    set({accounts: []});
  },

  importAccounts: accounts => {
    const existing = get().accounts;
    const existingIds = new Set(existing.map(a => a.id));
    const merged = [...existing];
    for (const acc of accounts) {
      if (!existingIds.has(acc.id)) {
        merged.push(acc);
      }
    }
    StorageService.set(STORAGE_KEYS.ACCOUNTS, merged);
    set({accounts: merged});
  },
}));
