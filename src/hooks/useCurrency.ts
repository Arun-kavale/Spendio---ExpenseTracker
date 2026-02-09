/**
 * Currency Hook
 * 
 * Provides currency formatting utilities based on user settings.
 */

import {useMemo, useCallback} from 'react';
import {useSettingsStore} from '@/store';

export const useCurrency = () => {
  const {settings} = useSettingsStore();
  const {currency} = settings;
  
  const formatAmount = useCallback(
    (amount: number, showSymbol = true): string => {
      const formattedNumber = amount.toLocaleString('en-US', {
        minimumFractionDigits: currency.decimalPlaces,
        maximumFractionDigits: currency.decimalPlaces,
      });
      
      if (!showSymbol) {
        return formattedNumber;
      }
      
      if (currency.symbolPosition === 'before') {
        return `${currency.symbol}${formattedNumber}`;
      }
      return `${formattedNumber} ${currency.symbol}`;
    },
    [currency]
  );
  
  const formatCompact = useCallback(
    (amount: number): string => {
      if (amount >= 1000000) {
        return `${currency.symbol}${(amount / 1000000).toFixed(1)}M`;
      }
      if (amount >= 1000) {
        return `${currency.symbol}${(amount / 1000).toFixed(1)}K`;
      }
      return formatAmount(amount);
    },
    [currency, formatAmount]
  );
  
  return useMemo(
    () => ({
      currency,
      formatAmount,
      formatCompact,
      symbol: currency.symbol,
    }),
    [currency, formatAmount, formatCompact]
  );
};

export default useCurrency;
