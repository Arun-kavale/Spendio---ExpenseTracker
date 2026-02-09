/**
 * Core type definitions for the Spendio app
 */

// ============================================================================
// Entity Types
// ============================================================================

export interface Expense {
  id: string;
  amount: number;
  categoryId: string;
  note: string;
  date: string; // ISO date string (YYYY-MM-DD)
  accountId?: string; // NEW: Optional link to UserAccount.id
  createdAt: number; // Unix timestamp
  updatedAt: number; // Unix timestamp
}

export interface Category {
  id: string;
  name: string;
  icon: string;
  color: string;
  isSystem: boolean; // System categories cannot be deleted
  createdAt: number;
  updatedAt: number;
}

export interface AppSettings {
  theme: ThemeMode;
  currency: Currency;
  lastBackupTime: number | null;
  isFirstLaunch: boolean;
  googleUserId: string | null;
  googleUserEmail: string | null;
  googleUserName: string | null;
  autoBackupEnabled: boolean;
}

// ============================================================================
// Theme Types
// ============================================================================

export type ThemeMode = 'light' | 'dark' | 'system';

export interface ThemeColors {
  // Primary colors
  primary: string;
  primaryLight: string;
  primaryDark: string;
  secondary: string;
  
  // Gradient colors
  gradientStart: string;
  gradientEnd: string;
  
  // Backgrounds
  background: string;
  surface: string;
  surfaceVariant: string;
  card: string;
  
  // Glassmorphism
  glass: string;
  glassBorder: string;
  glassBackground: string;
  
  // Typography
  text: string;
  textSecondary: string;
  textMuted: string;
  
  // UI Elements
  border: string;
  divider: string;
  
  // Status colors
  error: string;
  success: string;
  warning: string;
  info: string;
  
  // Financial semantics
  income: string;
  expense: string;
  transfer: string;
  
  // Overlay and shadows
  overlay: string;
  shadow: string;
  shadowMedium: string;
  shadowLarge: string;
  
  // Chart colors
  chartPrimary: string;
  chartSecondary: string;
  chartTertiary: string;
  chartGradientStart: string;
  chartGradientEnd: string;
}

export interface ThemeSpacing {
  xs: number;
  sm: number;
  md: number;
  lg: number;
  xl: number;
  xxl: number;
}

export interface ThemeTypography {
  h1: TextStyle;
  h2: TextStyle;
  h3: TextStyle;
  h4: TextStyle;
  body: TextStyle;
  bodySmall: TextStyle;
  caption: TextStyle;
  button: TextStyle;
  label: TextStyle;
}

export interface TextStyle {
  fontSize: number;
  fontWeight: '400' | '500' | '600' | '700' | '800';
  lineHeight: number;
  letterSpacing?: number;
}

export interface ThemeBorderRadius {
  xs: number;
  sm: number;
  md: number;
  lg: number;
  xl: number;
  full: number;
}

export interface Theme {
  mode: 'light' | 'dark';
  colors: ThemeColors;
  spacing: ThemeSpacing;
  typography: ThemeTypography;
  borderRadius: ThemeBorderRadius;
}

// ============================================================================
// Currency Types
// ============================================================================

export interface Currency {
  code: string;
  symbol: string;
  name: string;
  decimalPlaces: number;
  symbolPosition: 'before' | 'after';
}

// ============================================================================
// Income Types
// ============================================================================

export interface Income {
  id: string;
  amount: number;
  categoryId: string; // Income category ID
  note: string;
  date: string; // ISO date string (YYYY-MM-DD)
  paymentMethod: PaymentMethod;
  accountId?: string; // NEW: Optional link to UserAccount.id
  isRecurring: boolean;
  recurringFrequency?: RecurringFrequency;
  createdAt: number;
  updatedAt: number;
}

export type PaymentMethod = 'cash' | 'bank' | 'wallet' | 'upi' | 'cheque' | 'other';

export type RecurringFrequency = 'daily' | 'weekly' | 'monthly' | 'yearly';

export interface IncomeCategory {
  id: string;
  name: string;
  icon: string;
  color: string;
}

// ============================================================================
// Budget Types
// ============================================================================

export interface Budget {
  id: string;
  month: string; // YYYY-MM
  categoryId: string; // Expense category ID
  amount: number; // Budget limit
  rollover: boolean; // Carry over unused budget
  createdAt: number;
  updatedAt: number;
}

export interface BudgetWithProgress extends Budget {
  spent: number;
  remaining: number;
  percentage: number;
  isOverBudget: boolean;
  categoryName: string;
  categoryIcon: string;
  categoryColor: string;
}

// ============================================================================
// Account Types (NEW - Full Account Management System)
// ============================================================================

/**
 * Account category types - defines the broad category of an account
 */
export type AccountCategory =
  | 'cash'
  | 'bank'
  | 'credit_card'
  | 'debit_card'
  | 'upi'
  | 'wallet'
  | 'other';

/**
 * Specific account sub-types for UPI apps and wallets
 */
export type AccountSubType =
  | 'gpay'
  | 'phonepe'
  | 'paytm'
  | 'amazon_pay'
  | 'mobikwik'
  | 'freecharge'
  | 'generic';

/**
 * Full User Account - represents a user's financial account
 */
export interface UserAccount {
  id: string;
  name: string;
  category: AccountCategory;
  subType?: AccountSubType;
  
  // Balance tracking
  openingBalance: number;
  currentBalance: number;
  currency: string;
  
  // Optional details
  bankName?: string;
  lastFourDigits?: string;
  accountNumber?: string; // Masked
  ifscCode?: string;
  branchName?: string;
  
  // Credit card specific
  creditLimit?: number;
  outstandingBalance?: number;
  billDueDate?: number; // Day of month (1-31)
  statementDate?: number; // Day of month (1-31)
  
  // Display customization
  icon: string;
  color: string;
  
  // Status
  isActive: boolean;
  isDefault: boolean;
  sortOrder: number;
  
  // Timestamps
  createdAt: number;
  updatedAt: number;
}

/**
 * Account summary with calculated balances and stats
 */
export interface AccountWithStats extends UserAccount {
  totalIncome: number;
  totalExpenses: number;
  totalTransfersIn: number;
  totalTransfersOut: number;
  transactionCount: number;
}

/**
 * Account type info for display purposes
 */
export interface AccountTypeInfo {
  id: AccountCategory;
  label: string;
  icon: string;
  color: string;
  subTypes?: {id: AccountSubType; label: string; icon: string}[];
}

// ============================================================================
// Transfer Types
// ============================================================================

/** @deprecated Use AccountCategory for new code. Kept for backward compatibility. */
export type AccountType = 'cash' | 'bank' | 'wallet' | 'credit_card';

export interface Transfer {
  id: string;
  amount: number;
  fromAccount: AccountType; // Legacy field (kept for backward compatibility)
  toAccount: AccountType;   // Legacy field (kept for backward compatibility)
  fromAccountId?: string;   // NEW: Links to UserAccount.id
  toAccountId?: string;     // NEW: Links to UserAccount.id
  note: string;
  date: string; // ISO date string (YYYY-MM-DD)
  createdAt: number;
  updatedAt: number;
}

// ============================================================================
// Analytics Types
// ============================================================================

export interface DailyExpense {
  date: string;
  total: number;
}

export interface CategoryExpense {
  categoryId: string;
  categoryName: string;
  categoryColor: string;
  categoryIcon: string;
  total: number;
  percentage: number;
  count: number;
}

export interface MonthlyStats {
  month: string; // YYYY-MM
  total: number;
  count: number;
  averageDaily: number;
  highestCategory: CategoryExpense | null;
  dailyExpenses: DailyExpense[];
  categoryBreakdown: CategoryExpense[];
}

export interface ComparisonStats {
  currentMonth: MonthlyStats;
  previousMonth: MonthlyStats;
  percentageChange: number;
  trend: 'up' | 'down' | 'stable';
}

// ============================================================================
// Filter Types
// ============================================================================

export type DateFilterType = 'today' | 'week' | 'month' | 'year' | 'custom' | 'all';

export interface DateFilter {
  type: DateFilterType;
  startDate: string | null;
  endDate: string | null;
}

export type SortField = 'date' | 'amount';
export type SortOrder = 'asc' | 'desc';

export interface ExpenseFilters {
  dateFilter: DateFilter;
  categoryIds: string[];
  searchQuery: string;
  sortField: SortField;
  sortOrder: SortOrder;
  minAmount: number | null;
  maxAmount: number | null;
}

// ============================================================================
// Backup Types
// ============================================================================

export interface BackupData {
  version: string;
  lastSync: number;
  expenses: Expense[];
  categories: Category[];
  settings: Omit<AppSettings, 'googleUserId' | 'googleUserEmail' | 'googleUserName'>;
}

export interface SyncConflict {
  localData: BackupData;
  cloudData: BackupData;
}

export type ConflictResolution = 'keep_local' | 'use_cloud' | 'merge';

// ============================================================================
// Navigation Types
// ============================================================================

export type RootStackParamList = {
  MainTabs: undefined;
  // Expense screens
  AddExpense: {expenseId?: string} | undefined;
  ExpenseDetails: {expenseId: string};
  // Category screens
  Categories: undefined;
  CategoryDetails: {categoryId: string};
  AddCategory: {categoryId?: string} | undefined;
  // Income screens
  IncomeList: undefined;
  AddIncome: {incomeId?: string} | undefined;
  IncomeDetails: {incomeId: string};
  // Budget screens
  BudgetDashboard: undefined;
  AddBudget: {budgetId?: string; month?: string} | undefined;
  // Transfer screens
  TransferList: undefined;
  AddTransfer: {fromAccountId?: string; toAccountId?: string; transferId?: string} | undefined;
  // Account screens (NEW)
  AccountsList: undefined;
  AccountsDashboard: undefined;
  AddAccount: {accountId?: string} | undefined;
  AccountDetails: {accountId: string};
  // Reports screens
  Reports: undefined;
  // Settings screens
  Backup: undefined;
  ExportData: undefined;
  CurrencySelect: undefined;
  About: undefined;
  Statistics: undefined;
};

export type MainTabParamList = {
  Dashboard: undefined;
  Expenses: undefined;
  Analytics: undefined;
  Settings: undefined;
};

// ============================================================================
// Component Props Types
// ============================================================================

export interface ChartDataPoint {
  x: number | string;
  y: number;
  label?: string;
  color?: string;
}

export interface PieChartData {
  value: number;
  color: string;
  label: string;
  icon?: string;
}
