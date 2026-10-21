import AsyncStorage from '@react-native-async-storage/async-storage';
import type { Session, User } from '@supabase/supabase-js';
import React, { createContext, useContext, useEffect, useState, type ReactNode } from 'react';

import { supabase } from '../lib/supabase';

const REMEMBER_ME_KEY = 'nova.rememberMe';

type AuthContextValue = {
  user: User | null;
  session: Session | null;
  isLoading: boolean;
  signIn: (email: string, password: string, rememberMe: boolean) => Promise<{ error: string | null }>;
  signOut: () => Promise<void>;
  resetPassword: (email: string) => Promise<{ error: string | null }>;
};

const AuthContext = createContext<AuthContextValue | null>(null);

function friendlyError(message: string) {
  if (/network request failed|failed to fetch/i.test(message)) {
    return 'Could not reach TenderPilot AI. Check your internet connection and try again.';
  }
  if (/invalid login credentials/i.test(message)) {
    return 'That email and password do not match a TenderPilot AI account.';
  }
  if (/email not confirmed/i.test(message)) {
    return 'Please confirm your email address first. Check your inbox for the link.';
  }
  return message;
}

export function AuthProvider({ children }: { children: ReactNode }) {
  const [session, setSession] = useState<Session | null>(null);
  const [isLoading, setIsLoading] = useState(true);

  useEffect(() => {
    let isMounted = true;

    async function restoreSession() {
      const { data } = await supabase.auth.getSession();
      const rememberMe = await AsyncStorage.getItem(REMEMBER_ME_KEY);

      // "Remember me" was off last time, so a fresh app start begins signed out.
      if (data.session && rememberMe === 'false') {
        await supabase.auth.signOut({ scope: 'local' });
        if (isMounted) setSession(null);
      } else if (isMounted) {
        setSession(data.session);
      }
      if (isMounted) setIsLoading(false);
    }

    restoreSession();

    const { data: listener } = supabase.auth.onAuthStateChange((_event, nextSession) => {
      setSession(nextSession);
    });

    return () => {
      isMounted = false;
      listener.subscription.unsubscribe();
    };
  }, []);

  const value: AuthContextValue = {
    user: session?.user ?? null,
    session,
    isLoading,
    signIn: async (email, password, rememberMe) => {
      await AsyncStorage.setItem(REMEMBER_ME_KEY, String(rememberMe));
      const { error } = await supabase.auth.signInWithPassword({ email: email.trim(), password });
      return { error: error ? friendlyError(error.message) : null };
    },
    signOut: async () => {
      await supabase.auth.signOut();
    },
    resetPassword: async (email) => {
      const { error } = await supabase.auth.resetPasswordForEmail(email.trim());
      return { error: error ? friendlyError(error.message) : null };
    },
  };

  return <AuthContext.Provider value={value}>{children}</AuthContext.Provider>;
}

export function useAuth() {
  const context = useContext(AuthContext);
  if (!context) {
    throw new Error('useAuth must be used within an AuthProvider');
  }
  return context;
}
