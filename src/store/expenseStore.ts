/**
 * Expense Store
 * 
 * Manages expenses with CRUD operations, filtering, and analytics.
 */

import {create} from 'zustand';
import {
  Expense,
  ExpenseFilters,
  DateFilter,
  DailyExpense,
  CategoryExpense,
  MonthlyStats,
  ComparisonStats,
} from '@/types';
import {StorageService, STORAGE_KEYS} from '@/services/storage';
import {useCategoryStore} from './categoryStore';
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
  subMonths,
  format,
  parseISO,
  isWithinInterval,
  eachDayOfInterval,
  getDaysInMonth,
} from 'date-fns';

interface ExpenseState {
  expenses: Expense[];
  filters: ExpenseFilters;
  isLoading: boolean;
  
  // Actions
  loadExpenses: () => void;
  addExpense: (expense: Omit<Expense, 'id' | 'createdAt' | 'updatedAt'>) => Expense;
  updateExpense: (id: string, updates: Partial<Omit<Expense, 'id' | 'createdAt'>>) => void;
  deleteExpense: (id: string) => void;
  getExpenseById: (id: string) => Expense | undefined;
  
  // Filters
  setFilters: (filters: Partial<ExpenseFilters>) => void;
  resetFilters: () => void;
  getFilteredExpenses: () => Expense[];
  
  // Analytics
  getMonthlyStats: (month?: string) => MonthlyStats;
  getComparisonStats: () => ComparisonStats;
  getDailyExpenses: (startDate: Date, endDate: Date) => DailyExpense[];
  getCategoryBreakdown: (startDate?: Date, endDate?: Date) => CategoryExpense[];
  getTotalExpenses: (startDate?: Date, endDate?: Date) => number;
  
  // Data management
  clearAllExpenses: () => void;
  importExpenses: (expenses: Expense[]) => void;
}

const defaultFilters: ExpenseFilters = {
  dateFilter: {type: 'month', startDate: null, endDate: null},
  categoryIds: [],
  searchQuery: '',
  sortField: 'date',
  sortOrder: 'desc',
  minAmount: null,
  maxAmount: null,
};

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

export const useExpenseStore = create<ExpenseState>((set, get) => ({
  expenses: [],
  filters: defaultFilters,
  isLoading: true,
  
  loadExpenses: () => {
    const stored = StorageService.get<Expense[]>(STORAGE_KEYS.EXPENSES);
    set({expenses: stored || [], isLoading: false});
  },
  
  addExpense: (expenseData) => {
    const now = Date.now();
    const newExpense: Expense = {
      id: generateId(),
      ...expenseData,
      createdAt: now,
      updatedAt: now,
    };
    
    const updated = [...get().expenses, newExpense];
    StorageService.set(STORAGE_KEYS.EXPENSES, updated);
    set({expenses: updated});
    
    return newExpense;
  },
  
  updateExpense: (id, updates) => {
    const expenses = get().expenses.map(exp => {
      if (exp.id === id) {
        return {
          ...exp,
          ...updates,
          updatedAt: Date.now(),
        };
      }
      return exp;
    });
    
    StorageService.set(STORAGE_KEYS.EXPENSES, expenses);
    set({expenses});
  },
  
  deleteExpense: (id) => {
    const updated = get().expenses.filter(e => e.id !== id);
    StorageService.set(STORAGE_KEYS.EXPENSES, updated);
    set({expenses: updated});
  },
  
  getExpenseById: (id) => {
    return get().expenses.find(e => e.id === id);
  },
  
  setFilters: (newFilters) => {
    set({filters: {...get().filters, ...newFilters}});
  },
  
  resetFilters: () => {
    set({filters: defaultFilters});
  },
  
  getFilteredExpenses: () => {
    const {expenses, filters} = get();
    let filtered = [...expenses];
    
    // Date filter
    const dateRange = getDateRange(filters.dateFilter);
    if (dateRange) {
      filtered = filtered.filter(exp => {
        const expDate = parseISO(exp.date);
        return isWithinInterval(expDate, {start: dateRange.start, end: dateRange.end});
      });
    }
    
    // Category filter
    if (filters.categoryIds.length > 0) {
      filtered = filtered.filter(exp => filters.categoryIds.includes(exp.categoryId));
    }
    
    // Search filter
    if (filters.searchQuery.trim()) {
      const query = filters.searchQuery.toLowerCase();
      filtered = filtered.filter(exp => exp.note.toLowerCase().includes(query));
    }
    
    // Amount filters
    if (filters.minAmount !== null) {
      filtered = filtered.filter(exp => exp.amount >= filters.minAmount!);
    }
    if (filters.maxAmount !== null) {
      filtered = filtered.filter(exp => exp.amount <= filters.maxAmount!);
    }
    
    // Sorting
    filtered.sort((a, b) => {
      let comparison = 0;
      if (filters.sortField === 'date') {
        comparison = new Date(a.date).getTime() - new Date(b.date).getTime();
      } else {
        comparison = a.amount - b.amount;
      }
      return filters.sortOrder === 'desc' ? -comparison : comparison;
    });
    
    return filtered;
  },
  
  getMonthlyStats: (month?: string) => {
    const targetMonth = month || format(new Date(), 'yyyy-MM');
    const [year, monthNum] = targetMonth.split('-').map(Number);
    const monthStart = new Date(year, monthNum - 1, 1);
    const monthEnd = endOfMonth(monthStart);
    
    const expenses = get().expenses.filter(exp => {
      const expDate = parseISO(exp.date);
      return isWithinInterval(expDate, {start: monthStart, end: monthEnd});
    });
    
    const total = expenses.reduce((sum, exp) => sum + exp.amount, 0);
    const daysInMonth = getDaysInMonth(monthStart);
    const averageDaily = total / daysInMonth;
    
    // Daily expenses
    const dailyExpenses: DailyExpense[] = eachDayOfInterval({start: monthStart, end: monthEnd}).map(day => {
      const dayStr = format(day, 'yyyy-MM-dd');
      const dayTotal = expenses
        .filter(exp => exp.date === dayStr)
        .reduce((sum, exp) => sum + exp.amount, 0);
      return {date: dayStr, total: dayTotal};
    });
    
    // Category breakdown
    const categoryBreakdown = get().getCategoryBreakdown(monthStart, monthEnd);
    const highestCategory = categoryBreakdown.length > 0
      ? categoryBreakdown.reduce((prev, current) => (prev.total > current.total ? prev : current))
      : null;
    
    return {
      month: targetMonth,
      total,
      count: expenses.length,
      averageDaily,
      highestCategory,
      dailyExpenses,
      categoryBreakdown,
    };
  },
  
  getComparisonStats: () => {
    const now = new Date();
    const currentMonth = format(now, 'yyyy-MM');
    const previousMonth = format(subMonths(now, 1), 'yyyy-MM');
    
    const currentStats = get().getMonthlyStats(currentMonth);
    const previousStats = get().getMonthlyStats(previousMonth);
    
    const percentageChange = previousStats.total > 0
      ? ((currentStats.total - previousStats.total) / previousStats.total) * 100
      : currentStats.total > 0 ? 100 : 0;
    
    const trend: 'up' | 'down' | 'stable' = 
      Math.abs(percentageChange) < 5 ? 'stable' : percentageChange > 0 ? 'up' : 'down';
    
    return {
      currentMonth: currentStats,
      previousMonth: previousStats,
      percentageChange,
      trend,
    };
  },
  
  getDailyExpenses: (startDate, endDate) => {
    const expenses = get().expenses.filter(exp => {
      const expDate = parseISO(exp.date);
      return isWithinInterval(expDate, {start: startDate, end: endDate});
    });
    
    const dailyMap = new Map<string, number>();
    expenses.forEach(exp => {
      const current = dailyMap.get(exp.date) || 0;
      dailyMap.set(exp.date, current + exp.amount);
    });
    
    return eachDayOfInterval({start: startDate, end: endDate}).map(day => {
      const dateStr = format(day, 'yyyy-MM-dd');
      return {
        date: dateStr,
        total: dailyMap.get(dateStr) || 0,
      };
    });
  },
  
  getCategoryBreakdown: (startDate?, endDate?) => {
    let expenses = get().expenses;
    
    if (startDate && endDate) {
      expenses = expenses.filter(exp => {
        const expDate = parseISO(exp.date);
        return isWithinInterval(expDate, {start: startDate, end: endDate});
      });
    }
    
    const total = expenses.reduce((sum, exp) => sum + exp.amount, 0);
    const categoryMap = new Map<string, {total: number; count: number}>();
    
    expenses.forEach(exp => {
      const current = categoryMap.get(exp.categoryId) || {total: 0, count: 0};
      categoryMap.set(exp.categoryId, {
        total: current.total + exp.amount,
        count: current.count + 1,
      });
    });
    
    const categories = useCategoryStore.getState().categories;
    
    const breakdown: CategoryExpense[] = [];
    categoryMap.forEach((data, categoryId) => {
      const category = categories.find(c => c.id === categoryId);
      if (category) {
        breakdown.push({
          categoryId,
          categoryName: category.name,
          categoryColor: category.color,
          categoryIcon: category.icon,
          total: data.total,
          percentage: total > 0 ? (data.total / total) * 100 : 0,
          count: data.count,
        });
      }
    });
    
    // Sort by total descending
    breakdown.sort((a, b) => b.total - a.total);
    
    return breakdown;
  },
  
  getTotalExpenses: (startDate?, endDate?) => {
    let expenses = get().expenses;
    
    if (startDate && endDate) {
      expenses = expenses.filter(exp => {
        const expDate = parseISO(exp.date);
        return isWithinInterval(expDate, {start: startDate, end: endDate});
      });
    }
    
    return expenses.reduce((sum, exp) => sum + exp.amount, 0);
  },
  
  clearAllExpenses: () => {
    StorageService.set(STORAGE_KEYS.EXPENSES, []);
    set({expenses: []});
  },
  
  importExpenses: (expenses) => {
    const existing = get().expenses;
    const existingIds = new Set(existing.map(e => e.id));
    
    const merged = [...existing];
    for (const exp of expenses) {
      if (!existingIds.has(exp.id)) {
        merged.push(exp);
      }
    }
    
    StorageService.set(STORAGE_KEYS.EXPENSES, merged);
    set({expenses: merged});
  },
}));
