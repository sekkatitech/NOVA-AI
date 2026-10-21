import { Alert, Linking } from 'react-native';

const webAppUrl = process.env.EXPO_PUBLIC_WEB_APP_URL?.replace(/\/+$/, '');

export const hasWebSignup = Boolean(webAppUrl);

// Accounts and company workspaces are created on the TenderPilot AI web app.
export function openWebSignup() {
  if (!webAppUrl) {
    Alert.alert(
      'Create your account on the web',
      'Sign up on the TenderPilot AI web app first, then come back here and sign in with the same email and password.',
    );
    return;
  }
  Linking.openURL(`${webAppUrl}/signup`);
}
