import { Stack } from 'expo-router';
import React from 'react';
import { Platform } from 'react-native';

import { AuthProvider } from '../src/providers/auth-provider';
import { CurrencyProvider } from '../src/providers/currency-provider';
import { QueryProvider } from '../src/providers/query-provider';

// Browser build: fill the visible screen (dvh, not the page behind a phone's address bar) so the
// bottom menu stays on screen.
if (Platform.OS === 'web' && typeof document !== 'undefined') {
  const style = document.createElement('style');
  style.textContent = 'html, body, #root { height: 100dvh; background-color: #071521; }';
  document.head.appendChild(style);
}

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
