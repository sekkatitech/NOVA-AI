import { Ionicons } from '@expo/vector-icons';
import { LinearGradient } from 'expo-linear-gradient';
import { Redirect, router } from 'expo-router';
import { StatusBar } from 'expo-status-bar';
import React, { useState } from 'react';
import { Image } from 'expo-image';
import {
  ActivityIndicator,
  Alert,
  KeyboardAvoidingView,
  Platform,
  Pressable,
  ScrollView,
  StyleSheet,
  Text,
  TextInput,
  useWindowDimensions,
  View,
} from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';

import { isSupabaseConfigured } from '../src/lib/supabase';
import { openWebSignup } from '../src/lib/web-app';
import { useAuth } from '../src/providers/auth-provider';

const PAGE_BACKGROUND = '#f3f8fe';
const BACKGROUND_ASPECT = 1536 / 1024;

export default function LoginScreen() {
  const { session, signIn, resetPassword } = useAuth();
  const { width, height } = useWindowDimensions();

  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [showPassword, setShowPassword] = useState(false);
  const [rememberMe, setRememberMe] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [isSubmitting, setIsSubmitting] = useState(false);

  if (session) {
    return <Redirect href="/home" />;
  }

  async function handleSignIn() {
    if (!isSupabaseConfigured) {
      setError('The app is not connected to TenderPilot AI yet. Add the Supabase settings to .env.local.');
      return;
    }
    if (!email.trim() || !password) {
      setError('Enter your email address and password.');
      return;
    }

    setError(null);
    setIsSubmitting(true);
    const { error: signInError } = await signIn(email, password, rememberMe);
    setIsSubmitting(false);

    if (signInError) {
      setError(signInError);
      return;
    }
    router.replace('/home');
  }

  async function handleForgotPassword() {
    if (!email.trim()) {
      setError('Enter your email address above, then tap "Forgot password?" again.');
      return;
    }

    setError(null);
    const { error: resetError } = await resetPassword(email);
    if (resetError) {
      setError(resetError);
      return;
    }
    Alert.alert('Check your email', `We sent a password reset link to ${email.trim()}.`);
  }

  // The form starts where the background's white wave begins, about half way down the picture.
  const backgroundHeight = width * BACKGROUND_ASPECT;
  const formTop = Math.min(backgroundHeight * 0.5, height * 0.42);

  return (
    <View style={styles.page}>
      <StatusBar style="dark" />
      <SafeAreaView style={styles.page} edges={['left', 'right', 'bottom']}>
        <KeyboardAvoidingView style={styles.page} behavior={Platform.OS === 'ios' ? 'padding' : undefined}>
          <ScrollView
            contentContainerStyle={[styles.content, { paddingTop: formTop }]}
            keyboardShouldPersistTaps="handled"
            showsVerticalScrollIndicator={false}
          >
            <View style={[styles.background, { height: backgroundHeight }]} pointerEvents="none">
              <Image
                accessibilityLabel="TenderPilot AI"
                source={require('../assets/login-background.jpg')}
                style={StyleSheet.absoluteFill}
                contentFit="cover"
                contentPosition="top"
              />
              <LinearGradient
                colors={['transparent', PAGE_BACKGROUND]}
                locations={[0.7, 1]}
                style={StyleSheet.absoluteFill}
              />
            </View>

            <Text style={styles.title}>Welcome Back</Text>
            <Text style={styles.subtitle}>
              Sign in to your TenderPilot AI account to access NOVA, your procurement companion.
            </Text>

            <View style={styles.inputWrap}>
              <Ionicons name="mail-outline" size={20} color="#1e2b45" />
              <TextInput
                style={styles.input}
                placeholder="Email address"
                placeholderTextColor="#7b8798"
                value={email}
                onChangeText={setEmail}
                autoCapitalize="none"
                autoComplete="email"
                autoCorrect={false}
                keyboardType="email-address"
                textContentType="emailAddress"
                returnKeyType="next"
              />
            </View>

            <View style={styles.inputWrap}>
              <Ionicons name="lock-closed-outline" size={20} color="#1e2b45" />
              <TextInput
                style={styles.input}
                placeholder="Password"
                placeholderTextColor="#7b8798"
                value={password}
                onChangeText={setPassword}
                secureTextEntry={!showPassword}
                autoCapitalize="none"
                autoComplete="current-password"
                textContentType="password"
                returnKeyType="go"
                onSubmitEditing={handleSignIn}
              />
              <Pressable
                accessibilityLabel={showPassword ? 'Hide password' : 'Show password'}
                hitSlop={10}
                onPress={() => setShowPassword((value) => !value)}
              >
                <Ionicons name={showPassword ? 'eye-off-outline' : 'eye-outline'} size={20} color="#5b6779" />
              </Pressable>
            </View>

            <View style={styles.optionsRow}>
              <Pressable
                accessibilityRole="checkbox"
                accessibilityState={{ checked: rememberMe }}
                onPress={() => setRememberMe((value) => !value)}
                style={styles.remember}
              >
                <View style={[styles.checkbox, rememberMe && styles.checkboxChecked]}>
                  {rememberMe && <Ionicons name="checkmark" size={16} color="#ffffff" />}
                </View>
                <Text style={styles.rememberText}>Remember me</Text>
              </Pressable>
              <Pressable hitSlop={8} onPress={handleForgotPassword}>
                <Text style={styles.link}>Forgot password?</Text>
              </Pressable>
            </View>

            {error && <Text style={styles.error}>{error}</Text>}

            <Pressable
              accessibilityRole="button"
              disabled={isSubmitting}
              onPress={handleSignIn}
              style={({ pressed }) => [styles.signInShadow, (pressed || isSubmitting) && styles.pressed]}
            >
              <LinearGradient
                colors={['#00c8ff', '#0a6cff']}
                start={{ x: 0, y: 0.5 }}
                end={{ x: 1, y: 0.5 }}
                style={styles.signInButton}
              >
                {isSubmitting ? (
                  <ActivityIndicator color="#ffffff" />
                ) : (
                  <Text style={styles.signInText}>Sign In</Text>
                )}
              </LinearGradient>
            </Pressable>

            <View style={styles.footer}>
              <Text style={styles.footerText}>Don't have an account? </Text>
              <Pressable hitSlop={8} onPress={openWebSignup}>
                <Text style={styles.link}>Sign up</Text>
              </Pressable>
            </View>
          </ScrollView>
        </KeyboardAvoidingView>
      </SafeAreaView>
    </View>
  );
}

const styles = StyleSheet.create({
  page: {
    flex: 1,
    backgroundColor: PAGE_BACKGROUND,
  },
  content: {
    paddingHorizontal: 24,
    paddingBottom: 32,
  },
  background: {
    position: 'absolute',
    top: 0,
    left: 0,
    right: 0,
  },
  title: {
    color: '#0b1a3a',
    fontSize: 34,
    fontWeight: '800',
    letterSpacing: -0.5,
  },
  subtitle: {
    color: '#55607a',
    fontSize: 16,
    lineHeight: 23,
    marginTop: 8,
    marginBottom: 24,
  },
  inputWrap: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 12,
    height: 56,
    paddingHorizontal: 18,
    marginBottom: 12,
    borderRadius: 18,
    borderWidth: 1,
    borderColor: 'rgba(255, 255, 255, 0.95)',
    backgroundColor: 'rgba(255, 255, 255, 0.72)',
    shadowColor: '#2a6fd6',
    shadowOpacity: 0.08,
    shadowRadius: 12,
    shadowOffset: { width: 0, height: 4 },
    elevation: 2,
  },
  input: {
    flex: 1,
    height: '100%',
    backgroundColor: 'transparent',
    color: '#0b1a3a',
    fontSize: 16,
  },
  optionsRow: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    marginTop: 4,
    marginBottom: 18,
  },
  remember: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 10,
  },
  checkbox: {
    width: 22,
    height: 22,
    borderRadius: 6,
    borderWidth: 1.5,
    borderColor: '#9fb0c6',
    alignItems: 'center',
    justifyContent: 'center',
    backgroundColor: '#ffffff',
  },
  checkboxChecked: {
    borderColor: '#0a7cff',
    backgroundColor: '#0a7cff',
  },
  rememberText: {
    color: '#2a3550',
    fontSize: 15,
  },
  link: {
    color: '#0a7cff',
    fontSize: 15,
    fontWeight: '600',
  },
  error: {
    color: '#d92d3a',
    fontSize: 14,
    lineHeight: 20,
    marginBottom: 14,
  },
  signInShadow: {
    borderRadius: 28,
    shadowColor: '#0a7cff',
    shadowOpacity: 0.3,
    shadowRadius: 14,
    shadowOffset: { width: 0, height: 8 },
    elevation: 6,
  },
  signInButton: {
    height: 56,
    borderRadius: 28,
    alignItems: 'center',
    justifyContent: 'center',
  },
  signInText: {
    color: '#ffffff',
    fontSize: 18,
    fontWeight: '700',
  },
  pressed: {
    opacity: 0.85,
  },
  footer: {
    flexDirection: 'row',
    justifyContent: 'center',
    alignItems: 'center',
    marginTop: 28,
  },
  footerText: {
    color: '#55607a',
    fontSize: 15,
  },
});
