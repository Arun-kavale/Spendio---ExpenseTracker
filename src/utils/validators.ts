/**
 * Validation Utilities
 */

/**
 * Validate expense amount
 */
export const validateAmount = (amount: string): {isValid: boolean; value: number; error?: string} => {
  const trimmed = amount.trim();
  
  if (!trimmed) {
    return {isValid: false, value: 0, error: 'Amount is required'};
  }
  
  // Remove currency symbols and commas for parsing
  const cleaned = trimmed.replace(/[,$€£¥₹]/g, '');
  const value = parseFloat(cleaned);
  
  if (isNaN(value)) {
    return {isValid: false, value: 0, error: 'Invalid amount'};
  }
  
  if (value <= 0) {
    return {isValid: false, value: 0, error: 'Amount must be greater than 0'};
  }
  
  if (value > 999999999) {
    return {isValid: false, value: 0, error: 'Amount is too large'};
  }
  
  return {isValid: true, value};
};

/**
 * Validate category name
 */
export const validateCategoryName = (name: string): {isValid: boolean; error?: string} => {
  const trimmed = name.trim();
  
  if (!trimmed) {
    return {isValid: false, error: 'Category name is required'};
  }
  
  if (trimmed.length < 2) {
    return {isValid: false, error: 'Name must be at least 2 characters'};
  }
  
  if (trimmed.length > 30) {
    return {isValid: false, error: 'Name must be less than 30 characters'};
  }
  
  return {isValid: true};
};

/**
 * Validate date string
 */
export const validateDate = (dateString: string): {isValid: boolean; error?: string} => {
  if (!dateString) {
    return {isValid: false, error: 'Date is required'};
  }
  
  const date = new Date(dateString);
  if (isNaN(date.getTime())) {
    return {isValid: false, error: 'Invalid date'};
  }
  
  const now = new Date();
  if (date > now) {
    return {isValid: false, error: 'Date cannot be in the future'};
  }
  
  return {isValid: true};
};
