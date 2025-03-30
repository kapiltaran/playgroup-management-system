import { useState, useEffect, useCallback } from 'react';
import { useQuery } from '@tanstack/react-query';
import { apiRequest } from '@/lib/queryClient';

interface CurrencySettings {
  value: string;
  key: string;
  description: string | null;
  id: number;
  updatedAt: string;
}

export function useCurrency() {
  const [currencySymbol, setCurrencySymbol] = useState<string>('$');

  // Query to fetch the current currency setting
  const { data: currencySetting, isLoading } = useQuery<CurrencySettings>({
    queryKey: ["/api/settings/currency"],
    queryFn: () => apiRequest<CurrencySettings>("GET", "/api/settings/currency", undefined),
    staleTime: 1000 * 60 * 15, // Cache for 15 minutes
  });

  useEffect(() => {
    if (currencySetting) {
      const currency = currencySetting.value;
      
      // Map currency code to symbol
      const symbolMap: Record<string, string> = {
        'USD': '$',
        'EUR': '€',
        'GBP': '£',
        'JPY': '¥',
        'CAD': 'C$',
        'AUD': 'A$',
        'INR': '₹',
        'CNY': '¥',
        'MXN': 'Mex$',
        'BRL': 'R$',
      };
      
      setCurrencySymbol(symbolMap[currency] || '$');
    }
  }, [currencySetting]);

  // Format amount with the currency symbol
  const formatCurrency = useCallback((amount: number | string): string => {
    // Ensure amount is a number
    const numAmount = typeof amount === 'string' ? parseFloat(amount) : amount;
    
    if (isNaN(numAmount)) {
      return `${currencySymbol}0.00`;
    }
    
    // Format with 2 decimal places and add currency symbol
    return `${currencySymbol}${numAmount.toFixed(2)}`;
  }, [currencySymbol]);

  return {
    currencySymbol,
    formatCurrency,
    currencyCode: currencySetting?.value || 'USD',
    isLoading
  };
}