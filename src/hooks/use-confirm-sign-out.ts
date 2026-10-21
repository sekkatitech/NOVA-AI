import { router } from 'expo-router';
import { Alert } from 'react-native';

import { useAuth } from '../providers/auth-provider';

// Asks first, then signs out and returns to the landing screen from wherever the user is.
export function useConfirmSignOut() {
  const { user, signOut } = useAuth();

  return () => {
    Alert.alert('Sign out', `You're signed in as ${user?.email ?? 'unknown'}.`, [
      { text: 'Cancel', style: 'cancel' },
      {
        text: 'Sign out',
        style: 'destructive',
        onPress: async () => {
          await signOut();
          if (router.canDismiss()) router.dismissAll();
          router.replace('/');
        },
      },
    ]);
  };
}
