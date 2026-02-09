/**
 * Export Service
 * 
 * Handles exporting expense data to CSV and JSON formats.
 */

import RNFS from 'react-native-fs';
import Share from 'react-native-share';
import {useExpenseStore, useCategoryStore, useSettingsStore} from '@/store';
import {Expense} from '@/types';
import {format} from 'date-fns';

export type ExportFormat = 'csv' | 'json';

export interface ExportResult {
  success: boolean;
  error?: string;
  filePath?: string;
}

/**
 * Generate CSV content from expenses
 */
const generateCSV = (expenses: Expense[]): string => {
  const categories = useCategoryStore.getState().categories;
  const {currency} = useSettingsStore.getState().settings;
  
  const headers = ['Date', 'Amount', 'Currency', 'Category', 'Note', 'Created At'];
  
  const rows = expenses.map(exp => {
    const category = categories.find(c => c.id === exp.categoryId);
    return [
      exp.date,
      exp.amount.toString(),
      currency.code,
      category?.name || 'Unknown',
      `"${exp.note.replace(/"/g, '""')}"`, // Escape quotes
      format(exp.createdAt, 'yyyy-MM-dd HH:mm:ss'),
    ].join(',');
  });
  
  return [headers.join(','), ...rows].join('\n');
};

/**
 * Generate JSON content from expenses
 */
const generateJSON = (expenses: Expense[]): string => {
  const categories = useCategoryStore.getState().categories;
  const {currency} = useSettingsStore.getState().settings;
  
  const enrichedExpenses = expenses.map(exp => {
    const category = categories.find(c => c.id === exp.categoryId);
    return {
      ...exp,
      categoryName: category?.name || 'Unknown',
      currency: currency.code,
    };
  });
  
  return JSON.stringify(
    {
      exportedAt: new Date().toISOString(),
      currency: currency.code,
      totalExpenses: expenses.length,
      expenses: enrichedExpenses,
    },
    null,
    2
  );
};

/**
 * Export expenses to file
 */
export const exportExpenses = async (
  formatType: ExportFormat,
  startDate?: string,
  endDate?: string
): Promise<ExportResult> => {
  try {
    let expenses = useExpenseStore.getState().expenses;
    
    // Filter by date range if provided
    if (startDate && endDate) {
      expenses = expenses.filter(
        exp => exp.date >= startDate && exp.date <= endDate
      );
    }
    
    if (expenses.length === 0) {
      return {success: false, error: 'No expenses to export'};
    }
    
    // Sort by date
    expenses = [...expenses].sort(
      (a, b) => new Date(a.date).getTime() - new Date(b.date).getTime()
    );
    
    const content = formatType === 'csv' ? generateCSV(expenses) : generateJSON(expenses);
    const extension = formatType === 'csv' ? 'csv' : 'json';
    const mimeType = formatType === 'csv' ? 'text/csv' : 'application/json';
    
    const timestamp = format(new Date(), 'yyyy-MM-dd_HHmmss');
    const fileName = `expenses_${timestamp}.${extension}`;
    const filePath = `${RNFS.CachesDirectoryPath}/${fileName}`;
    
    await RNFS.writeFile(filePath, content, 'utf8');
    
    // Share the file
    await Share.open({
      url: `file://${filePath}`,
      type: mimeType,
      filename: fileName,
      title: 'Export Expenses',
    });
    
    return {success: true, filePath};
  } catch (error) {
    if (error instanceof Error && error.message.includes('User did not share')) {
      return {success: true}; // User cancelled share but file was created
    }
    const message = error instanceof Error ? error.message : 'Unknown error occurred';
    return {success: false, error: message};
  }
};

/**
 * Export full backup (for manual backup)
 */
export const exportFullBackup = async (): Promise<ExportResult> => {
  try {
    const expenses = useExpenseStore.getState().expenses;
    const categories = useCategoryStore.getState().categories;
    const settings = useSettingsStore.getState().settings;
    
    const {googleUserId, googleUserEmail, googleUserName, ...settingsToExport} = settings;
    
    const backupData = {
      version: '1.0.0',
      exportedAt: new Date().toISOString(),
      expenses,
      categories,
      settings: settingsToExport,
    };
    
    const content = JSON.stringify(backupData, null, 2);
    const timestamp = format(new Date(), 'yyyy-MM-dd_HHmmss');
    const fileName = `expense_tracker_backup_${timestamp}.json`;
    const filePath = `${RNFS.CachesDirectoryPath}/${fileName}`;
    
    await RNFS.writeFile(filePath, content, 'utf8');
    
    await Share.open({
      url: `file://${filePath}`,
      type: 'application/json',
      filename: fileName,
      title: 'Export Backup',
    });
    
    return {success: true, filePath};
  } catch (error) {
    if (error instanceof Error && error.message.includes('User did not share')) {
      return {success: true};
    }
    const message = error instanceof Error ? error.message : 'Unknown error occurred';
    return {success: false, error: message};
  }
};
