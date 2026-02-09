/**
 * Transfer Store
 * 
 * Manages money transfers between accounts.
 * Transfers are NOT counted as income or expense - they only move money between accounts.
 * 
 * IMPORTANT: When editing or deleting transfers, account balances must be properly
 * reversed/restored to maintain data integrity.
 */

import {create} from 'zustand';
import {Transfer} from '@/types';
import {StorageService, STORAGE_KEYS} from '@/services/storage';
import {generateId} from '@/utils';
import {parseISO, isWithinInterval, startOfMonth, endOfMonth, format} from 'date-fns';

interface TransferState {
  transfers: Transfer[];
  isLoading: boolean;

  // CRUD
  loadTransfers: () => void;
  addTransfer: (transfer: Omit<Transfer, 'id' | 'createdAt' | 'updatedAt'>) => Transfer;
  updateTransfer: (id: string, updates: Partial<Omit<Transfer, 'id' | 'createdAt'>>) => Transfer | undefined;
  deleteTransfer: (id: string) => Transfer | undefined;
  getTransferById: (id: string) => Transfer | undefined;

  // Analytics
  getTotalTransfers: (startDate?: Date, endDate?: Date) => number;
  getMonthlyTransfers: (month?: string) => Transfer[];
  getTransferCount: () => number;
  getTransfersByAccount: (accountId: string) => Transfer[];

  // Data management
  clearAllTransfers: () => void;
}

export const useTransferStore = create<TransferState>((set, get) => ({
  transfers: [],
  isLoading: true,

  loadTransfers: () => {
    const stored = StorageService.get<Transfer[]>(STORAGE_KEYS.TRANSFERS);
    set({transfers: stored || [], isLoading: false});
  },

  addTransfer: (transferData) => {
    const now = Date.now();
    const newTransfer: Transfer = {
      id: generateId(),
      ...transferData,
      createdAt: now,
      updatedAt: now,
    };
    const updated = [...get().transfers, newTransfer];
    StorageService.set(STORAGE_KEYS.TRANSFERS, updated);
    set({transfers: updated});
    return newTransfer;
  },

  updateTransfer: (id, updates) => {
    const transfers = get().transfers;
    const existingIndex = transfers.findIndex(t => t.id === id);
    
    if (existingIndex === -1) {
      return undefined;
    }

    const existingTransfer = transfers[existingIndex];
    const updatedTransfer: Transfer = {
      ...existingTransfer,
      ...updates,
      updatedAt: Date.now(),
    };

    const updatedTransfers = [...transfers];
    updatedTransfers[existingIndex] = updatedTransfer;
    
    StorageService.set(STORAGE_KEYS.TRANSFERS, updatedTransfers);
    set({transfers: updatedTransfers});
    
    return updatedTransfer;
  },

  deleteTransfer: (id) => {
    const transfers = get().transfers;
    const transferToDelete = transfers.find(t => t.id === id);
    
    if (!transferToDelete) {
      return undefined;
    }

    const updated = transfers.filter(t => t.id !== id);
    StorageService.set(STORAGE_KEYS.TRANSFERS, updated);
    set({transfers: updated});
    
    // Return the deleted transfer so caller can reverse account balances
    return transferToDelete;
  },

  getTransferById: (id) => {
    return get().transfers.find(t => t.id === id);
  },

  getTotalTransfers: (startDate?, endDate?) => {
    let transfers = get().transfers;
    if (startDate && endDate) {
      transfers = transfers.filter(t => {
        const d = parseISO(t.date);
        return isWithinInterval(d, {start: startDate, end: endDate});
      });
    }
    return transfers.reduce((sum, t) => sum + t.amount, 0);
  },

  getMonthlyTransfers: (month?) => {
    const targetMonth = month || format(new Date(), 'yyyy-MM');
    const [year, monthNum] = targetMonth.split('-').map(Number);
    const monthStart = new Date(year, monthNum - 1, 1);
    const monthEnd = endOfMonth(monthStart);

    return get().transfers
      .filter(t => {
        const d = parseISO(t.date);
        return isWithinInterval(d, {start: monthStart, end: monthEnd});
      })
      .sort((a, b) => new Date(b.date).getTime() - new Date(a.date).getTime());
  },

  getTransferCount: () => get().transfers.length,

  getTransfersByAccount: (accountId) => {
    return get().transfers.filter(
      t => t.fromAccountId === accountId || t.toAccountId === accountId
    );
  },

  clearAllTransfers: () => {
    StorageService.set(STORAGE_KEYS.TRANSFERS, []);
    set({transfers: []});
  },
}));
