import AsyncStorage from '@react-native-async-storage/async-storage';
import React, { createContext, useCallback, useContext, useEffect, useState, type ReactNode } from 'react';

import { BASE_CURRENCY, formatAmount } from '../lib/currency';

const CURRENCY_KEY = 'nova.currency';
const RATES_KEY = 'nova.exchangeRates';
const RATES_URL = `https://open.er-api.com/v6/latest/${BASE_CURRENCY}`;
const RATES_MAX_AGE_MS = 12 * 60 * 60 * 1000;

type Rates = { rates: Record<string, number>; updatedAt: number };

type CurrencyContextValue = {
  currency: string;
  setCurrency: (code: string) => void;
  rates: Rates | null;
  ratesError: boolean;
  // Formats an amount stored in rand in the chosen currency, falling back to rand when no rate is available.
  format: (amountInRand: number, options?: { compact?: boolean }) => string;
};

const CurrencyContext = createContext<CurrencyContextValue | null>(null);

export function CurrencyProvider({ children }: { children: ReactNode }) {
  const [currency, setCurrencyState] = useState(BASE_CURRENCY);
  const [rates, setRates] = useState<Rates | null>(null);
  const [ratesError, setRatesError] = useState(false);

  useEffect(() => {
    async function load() {
      const [savedCurrency, savedRates] = await Promise.all([
        AsyncStorage.getItem(CURRENCY_KEY),
        AsyncStorage.getItem(RATES_KEY),
      ]);
      if (savedCurrency) setCurrencyState(savedCurrency);

      const cached: Rates | null = savedRates ? JSON.parse(savedRates) : null;
      if (cached) setRates(cached);
      if (cached && Date.now() - cached.updatedAt < RATES_MAX_AGE_MS) return;

      try {
        const response = await fetch(RATES_URL);
        const body = await response.json();
        if (body.result !== 'success') throw new Error(body['error-type'] ?? 'rates unavailable');

        const fresh: Rates = { rates: body.rates, updatedAt: body.time_last_update_unix * 1000 };
        setRates(fresh);
        setRatesError(false);
        await AsyncStorage.setItem(RATES_KEY, JSON.stringify(fresh));
      } catch {
        setRatesError(true);
      }
    }

    load();
  }, []);

  const setCurrency = useCallback((code: string) => {
    setCurrencyState(code);
    AsyncStorage.setItem(CURRENCY_KEY, code);
  }, []);

  const format = useCallback(
    (amountInRand: number, options?: { compact?: boolean }) => {
      const compact = options?.compact ?? true;
      const rate = rates?.rates[currency];
      if (currency === BASE_CURRENCY || !rate) {
        return formatAmount(amountInRand, BASE_CURRENCY, compact);
      }
      return formatAmount(amountInRand * rate, currency, compact);
    },
    [currency, rates],
  );

  return (
    <CurrencyContext.Provider value={{ currency, setCurrency, rates, ratesError, format }}>
      {children}
    </CurrencyContext.Provider>
  );
}

export function useCurrency() {
  const context = useContext(CurrencyContext);
  if (!context) {
    throw new Error('useCurrency must be used within a CurrencyProvider');
  }
  return context;
}
