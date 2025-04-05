import { useState, useEffect, useCallback } from 'react';
import { useQueryClient } from '@tanstack/react-query';
import { apiRequest } from '@/lib/queryClient';

interface CurrencySettings {
  value: string;
  key: string;
  description: string | null;
  id: number;
  updatedAt: string;
}

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

export function useCurrency() {
  const [currencySymbol, setCurrencySymbol] = useState<string>('$');
  const [currencyCode, setCurrencyCode] = useState<string>('USD');
  const [isLoading, setIsLoading] = useState<boolean>(true);
  const queryClient = useQueryClient();
  
  // Function to fetch the current currency directly without caching
  const fetchCurrencySettings = useCallback(async () => {
    try {
      setIsLoading(true);
      const data = await apiRequest<CurrencySettings>("GET", "/api/settings/currency");
      if (data && data.value) {
        setCurrencyCode(data.value);
        setCurrencySymbol(symbolMap[data.value] || '$');
      }
    } catch (error) {
      console.error("Error fetching currency settings:", error);
      // Default to USD if there's an error
      setCurrencyCode('USD');
      setCurrencySymbol('$');
    } finally {
      setIsLoading(false);
    }
  }, []);
  
  // Fetch on mount and whenever the route changes
  useEffect(() => {
    fetchCurrencySettings();
    
    // Also invalidate the query cache if it exists
    queryClient.invalidateQueries({ queryKey: ["/api/settings/currency"] });
    
    // Set up an interval to check for updates every 5 seconds
    const intervalId = setInterval(fetchCurrencySettings, 5000);
    
    return () => {
      clearInterval(intervalId);
    };
  }, [fetchCurrencySettings, queryClient]);

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
    currencyCode,
    isLoading
  };
}