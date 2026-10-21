import { Ionicons } from '@expo/vector-icons';
import { Image } from 'expo-image';
import { LinearGradient } from 'expo-linear-gradient';
import { router } from 'expo-router';
import { StatusBar } from 'expo-status-bar';
import React, { useMemo, useState } from 'react';
import { FlatList, Pressable, StyleSheet, Text, TextInput, View } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';

import { glass } from '../../src/components/glass';
import { useConfirmSignOut } from '../../src/hooks/use-confirm-sign-out';
import { BASE_CURRENCY, currencies } from '../../src/lib/currency';
import { useAuth } from '../../src/providers/auth-provider';
import { useCurrency } from '../../src/providers/currency-provider';

const SAMPLE_AMOUNT_IN_RAND = 1_000_000;

export default function AccountScreen() {
  const { user } = useAuth();
  const confirmSignOut = useConfirmSignOut();
  const { currency, setCurrency, rates, ratesError, format } = useCurrency();
  const [search, setSearch] = useState('');

  const displayName: string = user?.user_metadata?.full_name || user?.email?.split('@')[0] || 'Your account';

  const filtered = useMemo(() => {
    const query = search.trim().toLowerCase();
    if (!query) return currencies;
    return currencies.filter(
      (item) => item.code.toLowerCase().includes(query) || item.name.toLowerCase().includes(query),
    );
  }, [search]);

  const ratesNote = ratesError && !rates
    ? 'Exchange rates could not be loaded, so amounts are shown in rand for now.'
    : rates
      ? `Amounts are kept in rand and converted with exchange rates from ${new Date(rates.updatedAt).toLocaleDateString()}. Rates by ExchangeRate-API.`
      : 'Loading exchange rates…';

  return (
    <LinearGradient colors={['#04192f', '#071521', '#050e1a']} style={styles.fill}>
      <StatusBar style="light" />
      <SafeAreaView style={styles.fill} edges={['top', 'left', 'right']}>
        <View style={styles.header}>
          <View style={styles.headerBrand}>
            <Image source={require('../../assets/tenderpilot-logo.png')} style={styles.headerLogo} contentFit="contain" />
            <Text style={styles.headerTitle}>Account</Text>
          </View>
          <Pressable accessibilityLabel="Close" hitSlop={12} onPress={() => router.back()} style={styles.close}>
            <Ionicons name="close" size={22} color="#edf5ff" />
          </Pressable>
        </View>

        <FlatList
          data={filtered}
          keyExtractor={(item) => item.code}
          keyboardShouldPersistTaps="handled"
          contentContainerStyle={styles.content}
          ListHeaderComponent={
            <>
              <View style={styles.card}>
                <View style={styles.avatar}>
                  <Text style={styles.avatarText}>{displayName.charAt(0).toUpperCase()}</Text>
                </View>
                <View style={styles.identity}>
                  <Text style={styles.name}>{displayName}</Text>
                  <Text style={styles.email}>{user?.email}</Text>
                </View>
              </View>

              <Pressable accessibilityRole="button" onPress={confirmSignOut} style={styles.signOut}>
                <Ionicons name="log-out-outline" size={20} color="#ff7a7a" />
                <Text style={styles.signOutText}>Sign out</Text>
              </Pressable>

              <Text style={styles.sectionTitle}>Currency</Text>
              <Text style={styles.note}>{ratesNote}</Text>

              <View style={styles.search}>
                <Ionicons name="search" size={18} color="#7d9ab0" />
                <TextInput
                  style={styles.searchInput}
                  placeholder="Search currencies"
                  placeholderTextColor="#7d9ab0"
                  value={search}
                  onChangeText={setSearch}
                  autoCorrect={false}
                />
              </View>
            </>
          }
          renderItem={({ item }) => {
            const isSelected = item.code === currency;
            const isAvailable = item.code === BASE_CURRENCY || Boolean(rates?.rates[item.code]);

            return (
              <Pressable
                accessibilityRole="radio"
                accessibilityState={{ selected: isSelected, disabled: !isAvailable }}
                disabled={!isAvailable}
                onPress={() => setCurrency(item.code)}
                style={[styles.currencyRow, isSelected && styles.currencyRowSelected, !isAvailable && styles.unavailable]}
              >
                <View style={styles.currencyCode}>
                  <Text style={styles.currencyCodeText}>{item.code}</Text>
                </View>
                <View style={styles.identity}>
                  <Text style={styles.currencyName}>{item.name}</Text>
                  <Text style={styles.currencyExample}>
                    {isSelected ? `R1M shows as ${format(SAMPLE_AMOUNT_IN_RAND)}` : isAvailable ? item.symbol.trim() : 'Rate unavailable'}
                  </Text>
                </View>
                {isSelected && <Ionicons name="checkmark-circle" size={22} color="#00d6ff" />}
              </Pressable>
            );
          }}
        />
      </SafeAreaView>
    </LinearGradient>
  );
}

const styles = StyleSheet.create({
  fill: {
    flex: 1,
  },
  header: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    paddingHorizontal: 18,
    paddingVertical: 12,
  },
  headerBrand: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 10,
  },
  headerLogo: {
    width: 34,
    height: 34,
  },
  headerTitle: {
    color: '#edf5ff',
    fontSize: 24,
    fontWeight: '800',
  },
  close: {
    width: 36,
    height: 36,
    borderRadius: 18,
    alignItems: 'center',
    justifyContent: 'center',
    backgroundColor: glass.fillStrong,
  },
  content: {
    paddingHorizontal: 18,
    paddingBottom: 40,
  },
  card: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 14,
    padding: 16,
    borderRadius: 20,
    borderWidth: 1,
    borderColor: glass.border,
    backgroundColor: glass.fill,
  },
  avatar: {
    width: 48,
    height: 48,
    borderRadius: 24,
    alignItems: 'center',
    justifyContent: 'center',
    backgroundColor: '#44d4ff',
  },
  avatarText: {
    color: '#071521',
    fontSize: 20,
    fontWeight: '800',
  },
  identity: {
    flex: 1,
  },
  name: {
    color: '#edf5ff',
    fontSize: 18,
    fontWeight: '700',
  },
  email: {
    color: '#87a6bd',
    fontSize: 13,
    marginTop: 3,
  },
  sectionTitle: {
    color: '#edf5ff',
    fontSize: 18,
    fontWeight: '700',
    marginTop: 26,
  },
  note: {
    color: '#87a6bd',
    fontSize: 13,
    lineHeight: 19,
    marginTop: 6,
    marginBottom: 14,
  },
  search: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 10,
    height: 48,
    paddingHorizontal: 14,
    marginBottom: 10,
    borderRadius: 16,
    borderWidth: 1,
    borderColor: glass.border,
    backgroundColor: glass.fill,
  },
  searchInput: {
    flex: 1,
    height: '100%',
    color: '#edf5ff',
    fontSize: 15,
  },
  currencyRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 12,
    padding: 12,
    marginBottom: 8,
    borderRadius: 16,
    borderWidth: 1,
    borderColor: glass.border,
    backgroundColor: glass.fill,
  },
  currencyRowSelected: {
    borderColor: glass.borderBright,
    backgroundColor: 'rgba(0, 214, 255, 0.1)',
  },
  unavailable: {
    opacity: 0.45,
  },
  currencyCode: {
    width: 52,
    height: 36,
    borderRadius: 10,
    alignItems: 'center',
    justifyContent: 'center',
    backgroundColor: glass.fillStrong,
  },
  currencyCodeText: {
    color: '#44d4ff',
    fontWeight: '800',
    fontSize: 13,
  },
  currencyName: {
    color: '#edf5ff',
    fontSize: 15,
    fontWeight: '600',
  },
  currencyExample: {
    color: '#87a6bd',
    fontSize: 12,
    marginTop: 2,
  },
  signOut: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    gap: 8,
    height: 52,
    marginTop: 20,
    borderRadius: 16,
    borderWidth: 1,
    borderColor: 'rgba(255, 122, 122, 0.35)',
    backgroundColor: 'rgba(255, 91, 91, 0.08)',
  },
  signOutText: {
    color: '#ff7a7a',
    fontSize: 16,
    fontWeight: '700',
  },
});
