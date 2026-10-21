import { focusManager, QueryClient, QueryClientProvider } from '@tanstack/react-query';
import React, { useEffect, useState, type ReactNode } from 'react';
import { AppState } from 'react-native';

import { useAuth } from './auth-provider';

// React Native has no window focus event, so tell TanStack Query when the app returns to the foreground.
// That refetch is what brings in changes made on the TenderPilot AI web app.
function useAppStateFocus() {
  useEffect(() => {
    const subscription = AppState.addEventListener('change', (state) => {
      focusManager.setFocused(state === 'active');
    });
    return () => subscription.remove();
  }, []);
}

export function QueryProvider({ children }: { children: ReactNode }) {
  const [client] = useState(
    () =>
      new QueryClient({
        defaultOptions: {
          queries: {
            staleTime: 10_000,
            refetchInterval: 30_000,
            refetchIntervalInBackground: false,
            retry: 1,
          },
        },
      }),
  );
  useAppStateFocus();

  // Drop one company's cached data the moment its user signs out.
  const { session } = useAuth();
  useEffect(() => {
    if (!session) client.clear();
  }, [session, client]);

  return <QueryClientProvider client={client}>{children}</QueryClientProvider>;
}
