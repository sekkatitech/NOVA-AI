import { Stack } from 'expo-router';
import React from 'react';
import { Platform } from 'react-native';

import { AuthProvider } from '../src/providers/auth-provider';
import { CurrencyProvider } from '../src/providers/currency-provider';
import { QueryProvider } from '../src/providers/query-provider';

// Browser build: pin the page to the visible screen (dvh, not the page behind a phone's address
// bar). Fixed + overscroll-behavior stop a drag on the bottom menu from scrolling or bouncing the
// whole page; only the app's own ScrollViews scroll.
if (Platform.OS === 'web' && typeof document !== 'undefined') {
  const style = document.createElement('style');
  style.textContent = `
    html, body { position: fixed; inset: 0; overflow: hidden; overscroll-behavior: none; }
    html, body, #root { height: 100dvh; width: 100%; background-color: #071521; }
    #root { position: fixed; inset: 0; }
  `;
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
