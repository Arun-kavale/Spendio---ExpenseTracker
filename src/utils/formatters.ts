/**
 * Formatting Utilities
 */

import {format, formatDistanceToNow, parseISO, isToday, isYesterday, isThisWeek} from 'date-fns';

/**
 * Format a date string to a human-readable format
 */
export const formatDate = (dateString: string, formatStr = 'MMM d, yyyy'): string => {
  return format(parseISO(dateString), formatStr);
};

/**
 * Format a date with relative text for recent dates
 */
export const formatRelativeDate = (dateString: string): string => {
  const date = parseISO(dateString);
  
  if (isToday(date)) {
    return 'Today';
  }
  if (isYesterday(date)) {
    return 'Yesterday';
  }
  if (isThisWeek(date)) {
    return format(date, 'EEEE'); // Day name
  }
  return format(date, 'MMM d, yyyy');
};

/**
 * Format a timestamp to relative time
 */
export const formatTimeAgo = (timestamp: number): string => {
  return formatDistanceToNow(timestamp, {addSuffix: true});
};

/**
 * Format a month string (YYYY-MM) to display format
 */
export const formatMonth = (monthString: string): string => {
  const [year, month] = monthString.split('-').map(Number);
  return format(new Date(year, month - 1), 'MMMM yyyy');
};

/**
 * Format percentage with sign
 */
export const formatPercentage = (value: number, decimals = 1): string => {
  const sign = value >= 0 ? '+' : '';
  return `${sign}${value.toFixed(decimals)}%`;
};

/**
 * Format a number with thousand separators
 */
export const formatNumber = (value: number, decimals = 0): string => {
  return value.toLocaleString('en-US', {
    minimumFractionDigits: decimals,
    maximumFractionDigits: decimals,
  });
};

/**
 * Truncate text with ellipsis
 */
export const truncateText = (text: string, maxLength: number): string => {
  if (text.length <= maxLength) {
    return text;
  }
  return `${text.substring(0, maxLength - 3)}...`;
};
