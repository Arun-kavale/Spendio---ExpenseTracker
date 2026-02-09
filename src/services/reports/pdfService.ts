/**
 * PDF Generation Service
 *
 * Generates professional PDF reports for expenses, income, budgets, and combined statements.
 * Uses react-native-html-to-pdf for generation and react-native-share for sharing.
 */

import {generatePDF} from 'react-native-html-to-pdf';
import Share from 'react-native-share';
import RNFS from 'react-native-fs';
import {format} from 'date-fns';
import {Expense, Income, Transfer, Budget, UserAccount, Category} from '@/types';
import {PDF_LOGO_DATA_URL} from './pdfLogoBase64';

interface PDFOptions {
  html: string;
  fileName?: string;
  directory?: string;
  base64?: boolean;
}

interface PDFResult {
  filePath: string;
  base64?: string;
}

const createPDF = async (options: PDFOptions): Promise<PDFResult> => {
  return generatePDF(options);
};

// App branding
const APP_NAME = 'Spendio';
const PRIMARY_COLOR = '#6D28D9';
const SECONDARY_COLOR = '#8B5CF6';
const INCOME_COLOR = '#10B981';
const EXPENSE_COLOR = '#EF4444';
const TRANSFER_COLOR = '#3B82F6';
// Light header for PDF reports (lighter gradient + dark text)
const HEADER_GRADIENT_START = '#E9E3F5';
const HEADER_GRADIENT_END = '#F3EFF9';
const HEADER_TEXT_COLOR = '#4C1D95';

export interface ReportOptions {
  title: string;
  startDate: Date;
  endDate: Date;
  currency: {symbol: string; code: string};
}

export interface ExpenseReportData {
  expenses: Expense[];
  categories: Category[];
  accounts?: UserAccount[];
}

export interface IncomeReportData {
  incomes: Income[];
  categories: {id: string; name: string; icon: string; color: string}[];
  accounts?: UserAccount[];
}

export interface BudgetReportData {
  budgets: Budget[];
  expenses: Expense[];
  categories: Category[];
}

export interface CombinedReportData {
  expenses: Expense[];
  incomes: Income[];
  transfers: Transfer[];
  accounts: UserAccount[];
  categories: Category[];
}

// Helper function to format currency
const formatCurrency = (amount: number, symbol: string): string => {
  return `${symbol}${amount.toLocaleString('en-IN', {
    minimumFractionDigits: 2,
    maximumFractionDigits: 2,
  })}`;
};

// Helper function to format date
const formatReportDate = (date: string | Date): string => {
  return format(new Date(date), 'dd MMM yyyy');
};

// Base HTML styles
const getBaseStyles = () => `
  <style>
    * {
      margin: 0;
      padding: 0;
      box-sizing: border-box;
    }
    body {
      font-family: 'Helvetica Neue', Helvetica, Arial, sans-serif;
      font-size: 12px;
      line-height: 1.5;
      color: #1a1a1a;
      padding: 20px;
    }
    .header {
      background: linear-gradient(135deg, ${HEADER_GRADIENT_START}, ${HEADER_GRADIENT_END});
      color: ${HEADER_TEXT_COLOR};
      padding: 24px;
      border-radius: 12px;
      margin-bottom: 24px;
    }
    .header .header-top {
      display: flex;
      align-items: center;
      justify-content: space-between;
      margin-bottom: 12px;
    }
    .header .header-logo {
      height: 32px;
      width: auto;
      max-width: 140px;
      object-fit: contain;
    }
    .header h1 {
      font-size: 24px;
      font-weight: 700;
      margin-bottom: 4px;
    }
    .header .app-name {
      font-size: 14px;
      opacity: 0.9;
    }
    .header .date-range {
      font-size: 12px;
      opacity: 0.8;
      margin-top: 8px;
    }
    .header .generated {
      font-size: 10px;
      opacity: 0.7;
      margin-top: 4px;
    }
    .summary-cards {
      display: flex;
      gap: 16px;
      margin-bottom: 24px;
    }
    .summary-card {
      flex: 1;
      background: #f8f9fa;
      border-radius: 10px;
      padding: 16px;
      text-align: center;
    }
    .summary-card.income {
      background: ${INCOME_COLOR}15;
      border-left: 4px solid ${INCOME_COLOR};
    }
    .summary-card.expense {
      background: ${EXPENSE_COLOR}15;
      border-left: 4px solid ${EXPENSE_COLOR};
    }
    .summary-card.balance {
      background: ${PRIMARY_COLOR}15;
      border-left: 4px solid ${PRIMARY_COLOR};
    }
    .summary-card h3 {
      font-size: 11px;
      text-transform: uppercase;
      color: #666;
      margin-bottom: 8px;
    }
    .summary-card .value {
      font-size: 20px;
      font-weight: 700;
    }
    .summary-card .value.income { color: ${INCOME_COLOR}; }
    .summary-card .value.expense { color: ${EXPENSE_COLOR}; }
    .summary-card .value.balance { color: ${PRIMARY_COLOR}; }
    .section {
      margin-bottom: 24px;
    }
    .section h2 {
      font-size: 16px;
      font-weight: 600;
      color: #333;
      margin-bottom: 12px;
      padding-bottom: 8px;
      border-bottom: 2px solid ${PRIMARY_COLOR};
    }
    .section table {
      width: 100%;
      border-collapse: collapse;
      margin-bottom: 20px;
      border: 1px solid #e5e7eb;
      border-radius: 10px;
      overflow: hidden;
      box-shadow: 0 1px 3px rgba(0,0,0,0.06);
    }
    .section thead {
      background: linear-gradient(180deg, ${HEADER_GRADIENT_START}, ${HEADER_GRADIENT_END});
    }
    .section thead th {
      padding: 14px 16px;
      text-align: left;
      font-weight: 700;
      font-size: 11px;
      text-transform: uppercase;
      letter-spacing: 0.6px;
      color: ${HEADER_TEXT_COLOR};
      border-bottom: 2px solid #C4B5FD;
    }
    .section thead th:first-child {
      padding-left: 20px;
    }
    .section thead th:last-child {
      padding-right: 20px;
    }
    .section tbody td {
      padding: 12px 16px;
      border-bottom: 1px solid #f3f4f6;
      font-size: 12px;
      color: #374151;
    }
    .section tbody td:first-child {
      padding-left: 20px;
    }
    .section tbody td:last-child {
      padding-right: 20px;
    }
    .section tbody tr:last-child td {
      border-bottom: none;
    }
    .section tbody tr:nth-child(even) td {
      background: #fafafa;
    }
    .section tbody tr:nth-child(odd) td {
      background: #ffffff;
    }
    .amount {
      font-weight: 600;
      text-align: right;
    }
    .amount.income { color: ${INCOME_COLOR}; }
    .amount.expense { color: ${EXPENSE_COLOR}; }
    .amount.transfer { color: ${TRANSFER_COLOR}; }
    .category-badge {
      display: inline-block;
      padding: 4px 8px;
      border-radius: 4px;
      font-size: 11px;
      font-weight: 500;
    }
    .progress-bar {
      background: #e9ecef;
      border-radius: 4px;
      height: 8px;
      overflow: hidden;
    }
    .progress-fill {
      height: 100%;
      border-radius: 4px;
    }
    .footer {
      margin-top: 32px;
      padding-top: 16px;
      border-top: 1px solid #dee2e6;
      text-align: center;
      font-size: 10px;
      color: #868e96;
    }
    .category-summary {
      display: flex;
      flex-wrap: wrap;
      gap: 12px;
    }
    .category-item {
      background: #f8f9fa;
      padding: 12px 16px;
      border-radius: 8px;
      min-width: 150px;
      flex: 1;
    }
    .category-item .name {
      font-weight: 600;
      margin-bottom: 4px;
    }
    .category-item .amount {
      font-size: 16px;
    }
    .category-item .count {
      font-size: 10px;
      color: #868e96;
    }
  </style>
`;

// Generate header HTML (includes Spendio logo)
const generateHeader = (options: ReportOptions): string => `
  <div class="header">
    <div class="header-top">
      <img src="${PDF_LOGO_DATA_URL}" alt="${APP_NAME}" class="header-logo" />
    </div>
    <h1>${options.title}</h1>
    <div class="date-range">
      ${formatReportDate(options.startDate)} - ${formatReportDate(options.endDate)}
    </div>
    <div class="generated">Generated on ${format(new Date(), 'dd MMM yyyy, hh:mm a')}</div>
  </div>
`;

// Generate footer HTML
const generateFooter = (): string => `
  <div class="footer">
    Generated by ${APP_NAME}
  </div>
`;

/**
 * Generate Expense Report PDF
 */
export const generateExpenseReport = async (
  data: ExpenseReportData,
  options: ReportOptions,
): Promise<string> => {
  const {expenses, categories} = data;
  const {currency} = options;

  const total = expenses.reduce((sum, e) => sum + e.amount, 0);

  // Category summary
  const categoryMap = new Map<string, {name: string; color: string; total: number; count: number}>();
  expenses.forEach(expense => {
    const cat = categories.find(c => c.id === expense.categoryId);
    if (cat) {
      const existing = categoryMap.get(cat.id) || {name: cat.name, color: cat.color, total: 0, count: 0};
      existing.total += expense.amount;
      existing.count += 1;
      categoryMap.set(cat.id, existing);
    }
  });

  const categorySummary = Array.from(categoryMap.values())
    .sort((a, b) => b.total - a.total);

  const html = `
    <!DOCTYPE html>
    <html>
    <head>
      <meta charset="utf-8">
      ${getBaseStyles()}
    </head>
    <body>
      ${generateHeader(options)}

      <div class="summary-cards">
        <div class="summary-card expense">
          <h3>Total Expenses</h3>
          <div class="value expense">${formatCurrency(total, currency.symbol)}</div>
        </div>
        <div class="summary-card">
          <h3>Transactions</h3>
          <div class="value">${expenses.length}</div>
        </div>
        <div class="summary-card">
          <h3>Categories</h3>
          <div class="value">${categorySummary.length}</div>
        </div>
      </div>

      <div class="section">
        <h2>Category Breakdown</h2>
        <div class="category-summary">
          ${categorySummary.map(cat => `
            <div class="category-item">
              <div class="name" style="color: ${cat.color}">${cat.name}</div>
              <div class="amount expense">${formatCurrency(cat.total, currency.symbol)}</div>
              <div class="count">${cat.count} transaction${cat.count !== 1 ? 's' : ''} • ${((cat.total / total) * 100).toFixed(1)}%</div>
            </div>
          `).join('')}
        </div>
      </div>

      <div class="section">
        <h2>Transaction Details</h2>
        <table>
          <thead>
            <tr>
              <th>Date</th>
              <th>Category</th>
              <th>Note</th>
              <th style="text-align: right">Amount</th>
            </tr>
          </thead>
          <tbody>
            ${expenses
              .sort((a, b) => new Date(b.date).getTime() - new Date(a.date).getTime())
              .map(expense => {
                const cat = categories.find(c => c.id === expense.categoryId);
                return `
                  <tr>
                    <td>${formatReportDate(expense.date)}</td>
                    <td><span class="category-badge" style="background: ${cat?.color}20; color: ${cat?.color}">${cat?.name || 'Unknown'}</span></td>
                    <td>${expense.note || '-'}</td>
                    <td class="amount expense">${formatCurrency(expense.amount, currency.symbol)}</td>
                  </tr>
                `;
              }).join('')}
          </tbody>
        </table>
      </div>

      ${generateFooter()}
    </body>
    </html>
  `;

  const file = await createPDF({
    html,
    fileName: `expense_report_${format(new Date(), 'yyyyMMdd_HHmmss')}`,
    directory: 'Documents',
  });

  return file.filePath || '';
};

/**
 * Generate Income Report PDF
 */
export const generateIncomeReport = async (
  data: IncomeReportData,
  options: ReportOptions,
): Promise<string> => {
  const {incomes, categories} = data;
  const {currency} = options;

  const total = incomes.reduce((sum, i) => sum + i.amount, 0);

  // Category summary
  const categoryMap = new Map<string, {name: string; color: string; total: number; count: number}>();
  incomes.forEach(income => {
    const cat = categories.find(c => c.id === income.categoryId);
    if (cat) {
      const existing = categoryMap.get(cat.id) || {name: cat.name, color: cat.color, total: 0, count: 0};
      existing.total += income.amount;
      existing.count += 1;
      categoryMap.set(cat.id, existing);
    }
  });

  const categorySummary = Array.from(categoryMap.values())
    .sort((a, b) => b.total - a.total);

  const html = `
    <!DOCTYPE html>
    <html>
    <head>
      <meta charset="utf-8">
      ${getBaseStyles()}
    </head>
    <body>
      ${generateHeader(options)}

      <div class="summary-cards">
        <div class="summary-card income">
          <h3>Total Income</h3>
          <div class="value income">${formatCurrency(total, currency.symbol)}</div>
        </div>
        <div class="summary-card">
          <h3>Transactions</h3>
          <div class="value">${incomes.length}</div>
        </div>
        <div class="summary-card">
          <h3>Sources</h3>
          <div class="value">${categorySummary.length}</div>
        </div>
      </div>

      <div class="section">
        <h2>Income Sources</h2>
        <div class="category-summary">
          ${categorySummary.map(cat => `
            <div class="category-item">
              <div class="name" style="color: ${cat.color}">${cat.name}</div>
              <div class="amount income">${formatCurrency(cat.total, currency.symbol)}</div>
              <div class="count">${cat.count} transaction${cat.count !== 1 ? 's' : ''} • ${((cat.total / total) * 100).toFixed(1)}%</div>
            </div>
          `).join('')}
        </div>
      </div>

      <div class="section">
        <h2>Transaction Details</h2>
        <table>
          <thead>
            <tr>
              <th>Date</th>
              <th>Source</th>
              <th>Note</th>
              <th style="text-align: right">Amount</th>
            </tr>
          </thead>
          <tbody>
            ${incomes
              .sort((a, b) => new Date(b.date).getTime() - new Date(a.date).getTime())
              .map(income => {
                const cat = categories.find(c => c.id === income.categoryId);
                return `
                  <tr>
                    <td>${formatReportDate(income.date)}</td>
                    <td><span class="category-badge" style="background: ${cat?.color}20; color: ${cat?.color}">${cat?.name || 'Unknown'}</span></td>
                    <td>${income.note || '-'}</td>
                    <td class="amount income">${formatCurrency(income.amount, currency.symbol)}</td>
                  </tr>
                `;
              }).join('')}
          </tbody>
        </table>
      </div>

      ${generateFooter()}
    </body>
    </html>
  `;

  const file = await createPDF({
    html,
    fileName: `income_report_${format(new Date(), 'yyyyMMdd_HHmmss')}`,
    directory: 'Documents',
  });

  return file.filePath || '';
};

/**
 * Generate Budget Report PDF
 */
export const generateBudgetReport = async (
  data: BudgetReportData,
  options: ReportOptions,
): Promise<string> => {
  const {budgets, expenses, categories} = data;
  const {currency} = options;

  // Calculate budget utilization
  const budgetData = budgets.map(budget => {
    const cat = categories.find(c => c.id === budget.categoryId);
    const spent = expenses
      .filter(e => e.categoryId === budget.categoryId)
      .reduce((sum, e) => sum + e.amount, 0);
    const percentage = budget.amount > 0 ? (spent / budget.amount) * 100 : 0;
    const remaining = budget.amount - spent;

    return {
      category: cat?.name || 'Unknown',
      color: cat?.color || '#666',
      budgeted: budget.amount,
      spent,
      remaining,
      percentage: Math.min(percentage, 100),
      isOver: spent > budget.amount,
    };
  });

  const totalBudget = budgetData.reduce((sum, b) => sum + b.budgeted, 0);
  const totalSpent = budgetData.reduce((sum, b) => sum + b.spent, 0);
  const totalRemaining = totalBudget - totalSpent;

  const html = `
    <!DOCTYPE html>
    <html>
    <head>
      <meta charset="utf-8">
      ${getBaseStyles()}
    </head>
    <body>
      ${generateHeader(options)}

      <div class="summary-cards">
        <div class="summary-card">
          <h3>Total Budget</h3>
          <div class="value">${formatCurrency(totalBudget, currency.symbol)}</div>
        </div>
        <div class="summary-card expense">
          <h3>Total Spent</h3>
          <div class="value expense">${formatCurrency(totalSpent, currency.symbol)}</div>
        </div>
        <div class="summary-card ${totalRemaining >= 0 ? 'income' : 'expense'}">
          <h3>Remaining</h3>
          <div class="value ${totalRemaining >= 0 ? 'income' : 'expense'}">${formatCurrency(Math.abs(totalRemaining), currency.symbol)}</div>
        </div>
      </div>

      <div class="section">
        <h2>Budget Utilization</h2>
        <table>
          <thead>
            <tr>
              <th>Category</th>
              <th style="text-align: right">Budgeted</th>
              <th style="text-align: right">Spent</th>
              <th style="text-align: right">Remaining</th>
              <th>Progress</th>
            </tr>
          </thead>
          <tbody>
            ${budgetData.map(b => `
              <tr>
                <td><span class="category-badge" style="background: ${b.color}20; color: ${b.color}">${b.category}</span></td>
                <td class="amount">${formatCurrency(b.budgeted, currency.symbol)}</td>
                <td class="amount expense">${formatCurrency(b.spent, currency.symbol)}</td>
                <td class="amount ${b.remaining >= 0 ? 'income' : 'expense'}">${b.remaining >= 0 ? '' : '-'}${formatCurrency(Math.abs(b.remaining), currency.symbol)}</td>
                <td style="width: 120px">
                  <div class="progress-bar">
                    <div class="progress-fill" style="width: ${b.percentage}%; background: ${b.isOver ? EXPENSE_COLOR : b.percentage > 80 ? '#F59E0B' : INCOME_COLOR}"></div>
                  </div>
                  <div style="font-size: 10px; text-align: center; margin-top: 2px; color: ${b.isOver ? EXPENSE_COLOR : '#666'}">${b.percentage.toFixed(0)}%</div>
                </td>
              </tr>
            `).join('')}
          </tbody>
        </table>
      </div>

      ${generateFooter()}
    </body>
    </html>
  `;

  const file = await createPDF({
    html,
    fileName: `budget_report_${format(new Date(), 'yyyyMMdd_HHmmss')}`,
    directory: 'Documents',
  });

  return file.filePath || '';
};

/**
 * Generate Combined Financial Report (Profit/Loss Statement)
 */
export const generateCombinedReport = async (
  data: CombinedReportData,
  options: ReportOptions,
): Promise<string> => {
  const {expenses, incomes, transfers, accounts} = data;
  const {currency} = options;

  const totalIncome = incomes.reduce((sum, i) => sum + i.amount, 0);
  const totalExpense = expenses.reduce((sum, e) => sum + e.amount, 0);
  const totalTransfers = transfers.reduce((sum, t) => sum + t.amount, 0);
  const netBalance = totalIncome - totalExpense;

  // Account balances
  const accountBalances = accounts.filter(a => a.isActive).map(acc => ({
    name: acc.name,
    color: acc.color,
    balance: acc.category === 'credit_card' ? -(acc.outstandingBalance || 0) : acc.currentBalance,
  }));

  const totalAccountBalance = accountBalances.reduce((sum, a) => sum + a.balance, 0);

  const html = `
    <!DOCTYPE html>
    <html>
    <head>
      <meta charset="utf-8">
      ${getBaseStyles()}
    </head>
    <body>
      ${generateHeader(options)}

      <div class="summary-cards">
        <div class="summary-card income">
          <h3>Total Income</h3>
          <div class="value income">${formatCurrency(totalIncome, currency.symbol)}</div>
        </div>
        <div class="summary-card expense">
          <h3>Total Expenses</h3>
          <div class="value expense">${formatCurrency(totalExpense, currency.symbol)}</div>
        </div>
        <div class="summary-card ${netBalance >= 0 ? 'income' : 'expense'}">
          <h3>Net ${netBalance >= 0 ? 'Profit' : 'Loss'}</h3>
          <div class="value ${netBalance >= 0 ? 'income' : 'expense'}">${formatCurrency(Math.abs(netBalance), currency.symbol)}</div>
        </div>
      </div>

      <div class="section">
        <h2>Profit & Loss Summary</h2>
        <table>
          <tbody>
            <tr style="background: ${INCOME_COLOR}10">
              <td style="font-weight: 600">Total Income</td>
              <td class="amount income">${formatCurrency(totalIncome, currency.symbol)}</td>
            </tr>
            <tr style="background: ${EXPENSE_COLOR}10">
              <td style="font-weight: 600">Total Expenses</td>
              <td class="amount expense">-${formatCurrency(totalExpense, currency.symbol)}</td>
            </tr>
            <tr style="background: ${netBalance >= 0 ? INCOME_COLOR : EXPENSE_COLOR}15; font-weight: bold">
              <td style="font-weight: 700; font-size: 14px">Net ${netBalance >= 0 ? 'Profit' : 'Loss'}</td>
              <td class="amount ${netBalance >= 0 ? 'income' : 'expense'}" style="font-size: 16px">${netBalance >= 0 ? '' : '-'}${formatCurrency(Math.abs(netBalance), currency.symbol)}</td>
            </tr>
          </tbody>
        </table>
      </div>

      <div class="section">
        <h2>Account Balances</h2>
        <table>
          <thead>
            <tr>
              <th>Account</th>
              <th style="text-align: right">Balance</th>
            </tr>
          </thead>
          <tbody>
            ${accountBalances.map(acc => `
              <tr>
                <td><span class="category-badge" style="background: ${acc.color}20; color: ${acc.color}">${acc.name}</span></td>
                <td class="amount ${acc.balance >= 0 ? 'income' : 'expense'}">${acc.balance >= 0 ? '' : '-'}${formatCurrency(Math.abs(acc.balance), currency.symbol)}</td>
              </tr>
            `).join('')}
            <tr style="background: ${PRIMARY_COLOR}10; font-weight: bold">
              <td style="font-weight: 700">Total Balance</td>
              <td class="amount balance" style="font-size: 14px">${formatCurrency(totalAccountBalance, currency.symbol)}</td>
            </tr>
          </tbody>
        </table>
      </div>

      <div class="section">
        <h2>Transfer Activity</h2>
        <div class="summary-card" style="text-align: center">
          <h3>Total Transferred</h3>
          <div class="value" style="color: ${TRANSFER_COLOR}">${formatCurrency(totalTransfers, currency.symbol)}</div>
          <div style="font-size: 11px; color: #666; margin-top: 4px">${transfers.length} transfer${transfers.length !== 1 ? 's' : ''}</div>
        </div>
      </div>

      ${generateFooter()}
    </body>
    </html>
  `;

  const file = await createPDF({
    html,
    fileName: `financial_report_${format(new Date(), 'yyyyMMdd_HHmmss')}`,
    directory: 'Documents',
  });

  return file.filePath || '';
};

/**
 * Share PDF file
 */
export const sharePDF = async (filePath: string, title: string): Promise<void> => {
  try {
    await Share.open({
      title,
      url: `file://${filePath}`,
      type: 'application/pdf',
    });
  } catch (error) {
    // User cancelled or error
    console.log('Share cancelled or failed:', error);
  }
};

/**
 * Delete PDF file
 */
export const deletePDF = async (filePath: string): Promise<void> => {
  try {
    const exists = await RNFS.exists(filePath);
    if (exists) {
      await RNFS.unlink(filePath);
    }
  } catch (error) {
    console.log('Failed to delete PDF:', error);
  }
};
