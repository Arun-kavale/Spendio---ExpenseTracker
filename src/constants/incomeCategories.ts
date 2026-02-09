/**
 * Income Categories
 * 
 * Predefined categories for income tracking.
 */

import {IncomeCategory} from '@/types';

export const INCOME_CATEGORIES: IncomeCategory[] = [
  {
    id: 'inc-salary',
    name: 'Salary',
    icon: 'briefcase',
    color: '#10B981',
  },
  {
    id: 'inc-freelance',
    name: 'Freelance',
    icon: 'laptop',
    color: '#6366F1',
  },
  {
    id: 'inc-business',
    name: 'Business',
    icon: 'store',
    color: '#F59E0B',
  },
  {
    id: 'inc-investment',
    name: 'Investment',
    icon: 'chart-line',
    color: '#3B82F6',
  },
  {
    id: 'inc-refund',
    name: 'Refund',
    icon: 'cash-refund',
    color: '#8B5CF6',
  },
  {
    id: 'inc-other',
    name: 'Other',
    icon: 'dots-horizontal-circle',
    color: '#64748B',
  },
];

export const PAYMENT_METHODS = [
  {id: 'cash', label: 'Cash', icon: 'cash'},
  {id: 'bank', label: 'Bank Transfer', icon: 'bank'},
  {id: 'wallet', label: 'Digital Wallet', icon: 'wallet'},
  {id: 'upi', label: 'UPI', icon: 'cellphone'},
  {id: 'cheque', label: 'Cheque', icon: 'checkbook'},
  {id: 'other', label: 'Other', icon: 'dots-horizontal'},
] as const;
