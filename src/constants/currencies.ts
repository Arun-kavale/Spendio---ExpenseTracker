import {Currency} from '@/types';

export const CURRENCIES: Currency[] = [
  {code: 'USD', symbol: '$', name: 'US Dollar', decimalPlaces: 2, symbolPosition: 'before'},
  {code: 'EUR', symbol: '€', name: 'Euro', decimalPlaces: 2, symbolPosition: 'before'},
  {code: 'GBP', symbol: '£', name: 'British Pound', decimalPlaces: 2, symbolPosition: 'before'},
  {code: 'JPY', symbol: '¥', name: 'Japanese Yen', decimalPlaces: 0, symbolPosition: 'before'},
  {code: 'CNY', symbol: '¥', name: 'Chinese Yuan', decimalPlaces: 2, symbolPosition: 'before'},
  {code: 'INR', symbol: '₹', name: 'Indian Rupee', decimalPlaces: 2, symbolPosition: 'before'},
  {code: 'AUD', symbol: 'A$', name: 'Australian Dollar', decimalPlaces: 2, symbolPosition: 'before'},
  {code: 'CAD', symbol: 'C$', name: 'Canadian Dollar', decimalPlaces: 2, symbolPosition: 'before'},
  {code: 'CHF', symbol: 'CHF', name: 'Swiss Franc', decimalPlaces: 2, symbolPosition: 'before'},
  {code: 'KRW', symbol: '₩', name: 'South Korean Won', decimalPlaces: 0, symbolPosition: 'before'},
  {code: 'SGD', symbol: 'S$', name: 'Singapore Dollar', decimalPlaces: 2, symbolPosition: 'before'},
  {code: 'HKD', symbol: 'HK$', name: 'Hong Kong Dollar', decimalPlaces: 2, symbolPosition: 'before'},
  {code: 'SEK', symbol: 'kr', name: 'Swedish Krona', decimalPlaces: 2, symbolPosition: 'after'},
  {code: 'NOK', symbol: 'kr', name: 'Norwegian Krone', decimalPlaces: 2, symbolPosition: 'after'},
  {code: 'DKK', symbol: 'kr', name: 'Danish Krone', decimalPlaces: 2, symbolPosition: 'after'},
  {code: 'NZD', symbol: 'NZ$', name: 'New Zealand Dollar', decimalPlaces: 2, symbolPosition: 'before'},
  {code: 'MXN', symbol: 'MX$', name: 'Mexican Peso', decimalPlaces: 2, symbolPosition: 'before'},
  {code: 'BRL', symbol: 'R$', name: 'Brazilian Real', decimalPlaces: 2, symbolPosition: 'before'},
  {code: 'ZAR', symbol: 'R', name: 'South African Rand', decimalPlaces: 2, symbolPosition: 'before'},
  {code: 'RUB', symbol: '₽', name: 'Russian Ruble', decimalPlaces: 2, symbolPosition: 'after'},
  {code: 'TRY', symbol: '₺', name: 'Turkish Lira', decimalPlaces: 2, symbolPosition: 'before'},
  {code: 'PLN', symbol: 'zł', name: 'Polish Zloty', decimalPlaces: 2, symbolPosition: 'after'},
  {code: 'THB', symbol: '฿', name: 'Thai Baht', decimalPlaces: 2, symbolPosition: 'before'},
  {code: 'IDR', symbol: 'Rp', name: 'Indonesian Rupiah', decimalPlaces: 0, symbolPosition: 'before'},
  {code: 'MYR', symbol: 'RM', name: 'Malaysian Ringgit', decimalPlaces: 2, symbolPosition: 'before'},
  {code: 'PHP', symbol: '₱', name: 'Philippine Peso', decimalPlaces: 2, symbolPosition: 'before'},
  {code: 'VND', symbol: '₫', name: 'Vietnamese Dong', decimalPlaces: 0, symbolPosition: 'after'},
  {code: 'AED', symbol: 'د.إ', name: 'UAE Dirham', decimalPlaces: 2, symbolPosition: 'before'},
  {code: 'SAR', symbol: '﷼', name: 'Saudi Riyal', decimalPlaces: 2, symbolPosition: 'before'},
  {code: 'TWD', symbol: 'NT$', name: 'Taiwan Dollar', decimalPlaces: 0, symbolPosition: 'before'},
];

export const DEFAULT_CURRENCY: Currency = CURRENCIES[0]; // USD

export const getCurrencyByCode = (code: string): Currency => {
  return CURRENCIES.find(c => c.code === code) || DEFAULT_CURRENCY;
};
