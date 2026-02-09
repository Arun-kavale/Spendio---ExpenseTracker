/**
 * Account Types, Icons, and Colors for Full Account Management
 */

import {AccountCategory, AccountSubType, AccountTypeInfo} from '@/types';

/**
 * Main account category configurations
 */
export const ACCOUNT_CATEGORIES: AccountTypeInfo[] = [
  {
    id: 'cash',
    label: 'Cash',
    icon: 'cash',
    color: '#10B981',
  },
  {
    id: 'bank',
    label: 'Bank Account',
    icon: 'bank',
    color: '#3B82F6',
  },
  {
    id: 'credit_card',
    label: 'Credit Card',
    icon: 'credit-card',
    color: '#F59E0B',
  },
  {
    id: 'debit_card',
    label: 'Debit Card',
    icon: 'credit-card-outline',
    color: '#6366F1',
  },
  {
    id: 'upi',
    label: 'UPI App',
    icon: 'cellphone',
    color: '#8B5CF6',
    subTypes: [
      {id: 'gpay', label: 'Google Pay', icon: 'google'},
      {id: 'phonepe', label: 'PhonePe', icon: 'phone'},
      {id: 'paytm', label: 'Paytm', icon: 'wallet'},
      {id: 'amazon_pay', label: 'Amazon Pay', icon: 'amazon'},
    ],
  },
  {
    id: 'wallet',
    label: 'Digital Wallet',
    icon: 'wallet',
    color: '#EC4899',
    subTypes: [
      {id: 'mobikwik', label: 'MobiKwik', icon: 'wallet'},
      {id: 'freecharge', label: 'FreeCharge', icon: 'lightning-bolt'},
      {id: 'generic', label: 'Other Wallet', icon: 'wallet-outline'},
    ],
  },
  {
    id: 'other',
    label: 'Other',
    icon: 'dots-horizontal-circle',
    color: '#64748B',
  },
];

/**
 * Get account category info by ID
 */
export const getAccountCategoryInfo = (
  category: AccountCategory,
): AccountTypeInfo => {
  return (
    ACCOUNT_CATEGORIES.find(c => c.id === category) || ACCOUNT_CATEGORIES[6]
  );
};

/**
 * Get icon for a specific account (considering sub-type)
 */
export const getAccountIcon = (
  category: AccountCategory,
  subType?: AccountSubType,
): string => {
  const categoryInfo = getAccountCategoryInfo(category);

  if (subType && categoryInfo.subTypes) {
    const subTypeInfo = categoryInfo.subTypes.find(s => s.id === subType);
    if (subTypeInfo) {
      return subTypeInfo.icon;
    }
  }

  return categoryInfo.icon;
};

/**
 * Get display label for account sub-type
 */
export const getSubTypeLabel = (subType: AccountSubType): string => {
  const labels: Record<AccountSubType, string> = {
    gpay: 'Google Pay',
    phonepe: 'PhonePe',
    paytm: 'Paytm',
    amazon_pay: 'Amazon Pay',
    mobikwik: 'MobiKwik',
    freecharge: 'FreeCharge',
    generic: 'Other',
  };
  return labels[subType] || 'Other';
};

/**
 * Predefined account colors for customization
 */
export const ACCOUNT_COLORS = [
  '#10B981', // Green
  '#3B82F6', // Blue
  '#6366F1', // Indigo
  '#8B5CF6', // Purple
  '#EC4899', // Pink
  '#F59E0B', // Amber
  '#EF4444', // Red
  '#14B8A6', // Teal
  '#F97316', // Orange
  '#64748B', // Slate
  '#84CC16', // Lime
  '#06B6D4', // Cyan
];

/**
 * Account icons available for selection
 */
export const ACCOUNT_ICONS = [
  'cash',
  'cash-multiple',
  'bank',
  'bank-outline',
  'credit-card',
  'credit-card-outline',
  'wallet',
  'wallet-outline',
  'google',
  'phone',
  'cellphone',
  'currency-inr',
  'currency-usd',
  'piggy-bank',
  'piggy-bank-outline',
  'safe',
  'briefcase',
  'briefcase-outline',
  'chart-line',
  'trending-up',
  'gold',
  'diamond-stone',
  'home',
  'car',
  'gift',
  'shopping',
  'food',
  'lightning-bolt',
  'star',
  'heart',
];

// ============================================================================
// Legacy exports for backward compatibility
// ============================================================================

import {AccountType} from '@/types';

/** @deprecated Use ACCOUNT_CATEGORIES instead */
export interface AccountInfo {
  id: AccountType;
  label: string;
  icon: string;
  color: string;
}

/** @deprecated Use ACCOUNT_CATEGORIES instead */
export const ACCOUNT_TYPES: AccountInfo[] = [
  {id: 'cash', label: 'Cash', icon: 'cash', color: '#10B981'},
  {id: 'bank', label: 'Bank Account', icon: 'bank', color: '#3B82F6'},
  {id: 'wallet', label: 'Digital Wallet', icon: 'wallet', color: '#8B5CF6'},
  {id: 'credit_card', label: 'Credit Card', icon: 'credit-card', color: '#F59E0B'},
];

/** @deprecated Use getAccountCategoryInfo instead */
export const getAccountInfo = (accountType: AccountType): AccountInfo => {
  return ACCOUNT_TYPES.find(a => a.id === accountType) || ACCOUNT_TYPES[0];
};
