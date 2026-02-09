/**
 * Budget Store
 * 
 * Manages monthly category-wise budgets with progress tracking.
 */

import {create} from 'zustand';
import {Budget, BudgetWithProgress} from '@/types';
import {StorageService, STORAGE_KEYS} from '@/services/storage';
import {useExpenseStore} from './expenseStore';
import {useCategoryStore} from './categoryStore';
import {generateId} from '@/utils';
import {format, startOfMonth, endOfMonth, subMonths, parseISO, isWithinInterval} from 'date-fns';

interface BudgetState {
  budgets: Budget[];
  isLoading: boolean;

  // CRUD
  loadBudgets: () => void;
  addBudget: (budget: Omit<Budget, 'id' | 'createdAt' | 'updatedAt'>) => Budget;
  updateBudget: (id: string, updates: Partial<Omit<Budget, 'id' | 'createdAt'>>) => void;
  deleteBudget: (id: string) => void;
  getBudgetById: (id: string) => Budget | undefined;

  // Analytics
  getBudgetsForMonth: (month?: string) => BudgetWithProgress[];
  getTotalBudget: (month?: string) => number;
  getTotalSpentAgainstBudget: (month?: string) => number;
  getOverBudgetCategories: (month?: string) => BudgetWithProgress[];

  // Data management
  clearAllBudgets: () => void;
}

export const useBudgetStore = create<BudgetState>((set, get) => ({
  budgets: [],
  isLoading: true,

  loadBudgets: () => {
    const stored = StorageService.get<Budget[]>(STORAGE_KEYS.BUDGETS);
    set({budgets: stored || [], isLoading: false});
  },

  addBudget: (budgetData) => {
    const now = Date.now();
    // Check if budget already exists for this category+month
    const existing = get().budgets.find(
      b => b.categoryId === budgetData.categoryId && b.month === budgetData.month,
    );
    if (existing) {
      // Update existing instead
      get().updateBudget(existing.id, {amount: budgetData.amount, rollover: budgetData.rollover});
      return existing;
    }

    const newBudget: Budget = {
      id: generateId(),
      ...budgetData,
      createdAt: now,
      updatedAt: now,
    };
    const updated = [...get().budgets, newBudget];
    StorageService.set(STORAGE_KEYS.BUDGETS, updated);
    set({budgets: updated});
    return newBudget;
  },

  updateBudget: (id, updates) => {
    const budgets = get().budgets.map(b => {
      if (b.id === id) {
        return {...b, ...updates, updatedAt: Date.now()};
      }
      return b;
    });
    StorageService.set(STORAGE_KEYS.BUDGETS, budgets);
    set({budgets});
  },

  deleteBudget: (id) => {
    const updated = get().budgets.filter(b => b.id !== id);
    StorageService.set(STORAGE_KEYS.BUDGETS, updated);
    set({budgets: updated});
  },

  getBudgetById: (id) => {
    return get().budgets.find(b => b.id === id);
  },

  getBudgetsForMonth: (month?) => {
    const targetMonth = month || format(new Date(), 'yyyy-MM');
    const [year, monthNum] = targetMonth.split('-').map(Number);
    const monthStart = new Date(year, monthNum - 1, 1);
    const monthEnd = endOfMonth(monthStart);

    const monthBudgets = get().budgets.filter(b => b.month === targetMonth);
    const expenses = useExpenseStore.getState().expenses;
    const categories = useCategoryStore.getState().categories;

    // Calculate spending per category for this month
    const categorySpending = new Map<string, number>();
    expenses.forEach(exp => {
      const expDate = parseISO(exp.date);
      if (isWithinInterval(expDate, {start: monthStart, end: monthEnd})) {
        categorySpending.set(
          exp.categoryId,
          (categorySpending.get(exp.categoryId) || 0) + exp.amount,
        );
      }
    });

    // Handle rollover from previous month
    const prevMonth = format(subMonths(monthStart, 1), 'yyyy-MM');
    const prevBudgets = get().budgets.filter(b => b.month === prevMonth);

    return monthBudgets.map(budget => {
      const category = categories.find(c => c.id === budget.categoryId);
      const spent = categorySpending.get(budget.categoryId) || 0;

      // Calculate rollover
      let effectiveAmount = budget.amount;
      if (budget.rollover) {
        const prevBudget = prevBudgets.find(b => b.categoryId === budget.categoryId);
        if (prevBudget) {
          const [pYear, pMonth] = prevMonth.split('-').map(Number);
          const pStart = new Date(pYear, pMonth - 1, 1);
          const pEnd = endOfMonth(pStart);
          const prevSpent = expenses
            .filter(e => {
              const d = parseISO(e.date);
              return e.categoryId === budget.categoryId && isWithinInterval(d, {start: pStart, end: pEnd});
            })
            .reduce((s, e) => s + e.amount, 0);
          const prevRemaining = Math.max(0, prevBudget.amount - prevSpent);
          effectiveAmount += prevRemaining;
        }
      }

      const remaining = effectiveAmount - spent;
      const percentage = effectiveAmount > 0 ? (spent / effectiveAmount) * 100 : 0;

      return {
        ...budget,
        amount: effectiveAmount,
        spent,
        remaining,
        percentage,
        isOverBudget: spent > effectiveAmount,
        categoryName: category?.name || 'Unknown',
        categoryIcon: category?.icon || 'help-circle',
        categoryColor: category?.color || '#94A3B8',
      };
    }).sort((a, b) => b.percentage - a.percentage);
  },

  getTotalBudget: (month?) => {
    const budgets = get().getBudgetsForMonth(month);
    return budgets.reduce((sum, b) => sum + b.amount, 0);
  },

  getTotalSpentAgainstBudget: (month?) => {
    const budgets = get().getBudgetsForMonth(month);
    return budgets.reduce((sum, b) => sum + b.spent, 0);
  },

  getOverBudgetCategories: (month?) => {
    return get().getBudgetsForMonth(month).filter(b => b.isOverBudget);
  },

  clearAllBudgets: () => {
    StorageService.set(STORAGE_KEYS.BUDGETS, []);
    set({budgets: []});
  },
}));
