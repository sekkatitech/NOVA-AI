import { Stack } from 'expo-router';
import React from 'react';

import { AuthProvider } from '../src/providers/auth-provider';
import { CurrencyProvider } from '../src/providers/currency-provider';
import { QueryProvider } from '../src/providers/query-provider';

export default function RootLayout() {
  return (
    <AuthProvider>
      <QueryProvider>
        <CurrencyProvider>
          <Stack screenOptions={{ headerShown: false, animation: 'slide_from_right' }} />
        </CurrencyProvider>
      </QueryProvider>
    </AuthProvider>
  );
}
