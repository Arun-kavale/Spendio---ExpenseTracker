/**
 * Income Store
 * 
 * Manages income entries with CRUD operations, filtering, and analytics.
 * Follows the same pattern as expenseStore for consistency.
 */

import {create} from 'zustand';
import {Income, DateFilter} from '@/types';
import {StorageService, STORAGE_KEYS} from '@/services/storage';
import {generateId} from '@/utils';
import {
  startOfDay,
  endOfDay,
  startOfWeek,
  endOfWeek,
  startOfMonth,
  endOfMonth,
  startOfYear,
  endOfYear,
  parseISO,
  isWithinInterval,
  format,
} from 'date-fns';

interface IncomeState {
  incomes: Income[];
  isLoading: boolean;

  // CRUD
  loadIncomes: () => void;
  addIncome: (income: Omit<Income, 'id' | 'createdAt' | 'updatedAt'>) => Income;
  updateIncome: (id: string, updates: Partial<Omit<Income, 'id' | 'createdAt'>>) => void;
  deleteIncome: (id: string) => void;
  getIncomeById: (id: string) => Income | undefined;

  // Analytics
  getTotalIncome: (startDate?: Date, endDate?: Date) => number;
  getMonthlyIncome: (month?: string) => number;
  getIncomeByCategory: (startDate?: Date, endDate?: Date) => {categoryId: string; total: number}[];

  // Data management
  clearAllIncomes: () => void;
  importIncomes: (incomes: Income[]) => void;
}

const getDateRange = (filter: DateFilter): {start: Date; end: Date} | null => {
  const now = new Date();
  switch (filter.type) {
    case 'today':
      return {start: startOfDay(now), end: endOfDay(now)};
    case 'week':
      return {start: startOfWeek(now, {weekStartsOn: 1}), end: endOfWeek(now, {weekStartsOn: 1})};
    case 'month':
      return {start: startOfMonth(now), end: endOfMonth(now)};
    case 'year':
      return {start: startOfYear(now), end: endOfYear(now)};
    case 'custom':
      if (filter.startDate && filter.endDate) {
        return {
          start: startOfDay(parseISO(filter.startDate)),
          end: endOfDay(parseISO(filter.endDate)),
        };
      }
      return null;
    case 'all':
    default:
      return null;
  }
};

export const useIncomeStore = create<IncomeState>((set, get) => ({
  incomes: [],
  isLoading: true,

  loadIncomes: () => {
    const stored = StorageService.get<Income[]>(STORAGE_KEYS.INCOMES);
    set({incomes: stored || [], isLoading: false});
  },

  addIncome: (incomeData) => {
    const now = Date.now();
    const newIncome: Income = {
      id: generateId(),
      ...incomeData,
      createdAt: now,
      updatedAt: now,
    };

    const updated = [...get().incomes, newIncome];
    StorageService.set(STORAGE_KEYS.INCOMES, updated);
    set({incomes: updated});
    return newIncome;
  },

  updateIncome: (id, updates) => {
    const incomes = get().incomes.map(inc => {
      if (inc.id === id) {
        return {...inc, ...updates, updatedAt: Date.now()};
      }
      return inc;
    });
    StorageService.set(STORAGE_KEYS.INCOMES, incomes);
    set({incomes});
  },

  deleteIncome: (id) => {
    const updated = get().incomes.filter(i => i.id !== id);
    StorageService.set(STORAGE_KEYS.INCOMES, updated);
    set({incomes: updated});
  },

  getIncomeById: (id) => {
    return get().incomes.find(i => i.id === id);
  },

  getTotalIncome: (startDate?, endDate?) => {
    let incomes = get().incomes;
    if (startDate && endDate) {
      incomes = incomes.filter(inc => {
        const d = parseISO(inc.date);
        return isWithinInterval(d, {start: startDate, end: endDate});
      });
    }
    return incomes.reduce((sum, inc) => sum + inc.amount, 0);
  },

  getMonthlyIncome: (month?) => {
    const targetMonth = month || format(new Date(), 'yyyy-MM');
    const [year, monthNum] = targetMonth.split('-').map(Number);
    const monthStart = new Date(year, monthNum - 1, 1);
    const monthEnd = endOfMonth(monthStart);

    return get().incomes
      .filter(inc => {
        const d = parseISO(inc.date);
        return isWithinInterval(d, {start: monthStart, end: monthEnd});
      })
      .reduce((sum, inc) => sum + inc.amount, 0);
  },

  getIncomeByCategory: (startDate?, endDate?) => {
    let incomes = get().incomes;
    if (startDate && endDate) {
      incomes = incomes.filter(inc => {
        const d = parseISO(inc.date);
        return isWithinInterval(d, {start: startDate, end: endDate});
      });
    }

    const map = new Map<string, number>();
    incomes.forEach(inc => {
      map.set(inc.categoryId, (map.get(inc.categoryId) || 0) + inc.amount);
    });

    return Array.from(map.entries())
      .map(([categoryId, total]) => ({categoryId, total}))
      .sort((a, b) => b.total - a.total);
  },

  clearAllIncomes: () => {
    StorageService.set(STORAGE_KEYS.INCOMES, []);
    set({incomes: []});
  },

  importIncomes: (incomes) => {
    const existing = get().incomes;
    const existingIds = new Set(existing.map(i => i.id));
    const merged = [...existing];
    for (const inc of incomes) {
      if (!existingIds.has(inc.id)) {
        merged.push(inc);
      }
    }
    StorageService.set(STORAGE_KEYS.INCOMES, merged);
    set({incomes: merged});
  },
}));
