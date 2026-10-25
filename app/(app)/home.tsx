import { Ionicons } from '@expo/vector-icons';
import { LinearGradient } from 'expo-linear-gradient';
import { router } from 'expo-router';
import { StatusBar } from 'expo-status-bar';
import React, { useMemo, useRef, useState } from 'react';
import { Pressable, RefreshControl, ScrollView, StyleSheet, Text, View } from 'react-native';
import { SafeAreaView, useSafeAreaInsets } from 'react-native-safe-area-context';

import { colors } from '../../src/components/ui';
import { useConfirmSignOut } from '../../src/hooks/use-confirm-sign-out';
import { useNotifications, useProfile, useRefreshAll } from '../../src/hooks/use-workspace';
import { useAuth } from '../../src/providers/auth-provider';
import { AlertsTab } from '../../src/screens/alerts-tab';
import { DashboardTab } from '../../src/screens/dashboard-tab';
import { NovaTab } from '../../src/screens/nova-tab';
import { TendersTab } from '../../src/screens/tenders-tab';
import type { Navigate, TabKey, TenderFilter } from '../../src/screens/types';

type IconName = keyof typeof Ionicons.glyphMap;

const tabs: Array<{ key: TabKey; label: string; icon: IconName; activeIcon: IconName }> = [
  { key: 'home', label: 'Home', icon: 'home-outline', activeIcon: 'home' },
  { key: 'tenders', label: 'Tenders', icon: 'document-text-outline', activeIcon: 'document-text' },
  { key: 'nova', label: 'NOVA', icon: 'sparkles-outline', activeIcon: 'sparkles' },
  { key: 'alerts', label: 'Alerts', icon: 'notifications-outline', activeIcon: 'notifications' },
];

export default function HomeScreen() {
  const { user } = useAuth();
  const profile = useProfile();
  const notifications = useNotifications();
  const refreshAll = useRefreshAll();
  const confirmSignOut = useConfirmSignOut();
  const scrollRef = useRef<ScrollView>(null);
  const insets = useSafeAreaInsets();

  const [activeTab, setActiveTab] = useState<TabKey>('home');
  const [tenderFilter, setTenderFilter] = useState<TenderFilter>('active');
  const [selectedTenderId, setSelectedTenderId] = useState<string | null>(null);
  const [isRefreshing, setIsRefreshing] = useState(false);

  const displayName: string =
    profile.data?.full_name || user?.user_metadata?.full_name || user?.email?.split('@')[0] || 'there';
  const firstName = displayName.split(' ')[0];
  const companyName = profile.data?.companies?.name;
  const unread = (notifications.data ?? []).filter((item) => !item.is_read).length;

  const navigate = useMemo<Navigate>(() => {
    const go = (tab: TabKey) => {
      setActiveTab(tab);
      scrollRef.current?.scrollTo({ y: 0, animated: false });
    };
    return {
      openTab: go,
      openTender: (id) => {
        setSelectedTenderId(id);
        go('tenders');
      },
      showTenders: (filter) => {
        setTenderFilter(filter);
        setSelectedTenderId(null);
        go('tenders');
      },
    };
  }, []);

  const onRefresh = async () => {
    setIsRefreshing(true);
    await refreshAll();
    setIsRefreshing(false);
  };

  const renderContent = () => {
    switch (activeTab) {
      case 'tenders':
        return (
          <TendersTab
            filter={tenderFilter}
            onFilterChange={setTenderFilter}
            selectedId={selectedTenderId}
            onSelect={setSelectedTenderId}
          />
        );
      case 'nova':
        return <NovaTab navigate={navigate} firstName={firstName} />;
      case 'alerts':
        return <AlertsTab navigate={navigate} />;
      default:
        return <DashboardTab navigate={navigate} />;
    }
  };

  return (
    <LinearGradient colors={['#04192f', '#071521', '#050e1a']} style={styles.screen}>
      <StatusBar style="light" />
      <View style={[styles.glow, styles.glowTop]} pointerEvents="none" />
      <View style={[styles.glow, styles.glowBottom]} pointerEvents="none" />

      {/* No bottom edge: the menu bar runs to the bottom of the screen and pads itself. */}
      <SafeAreaView style={styles.screen} edges={['top', 'left', 'right']}>
        <View style={styles.appShell}>
          <View style={styles.topBar}>
            <View style={styles.topCopy}>
              <Text style={styles.eyebrow} numberOfLines={1}>
                {greetingForHour(new Date().getHours())}
                {companyName ? ` · ${companyName}` : ''}
              </Text>
              <Text style={styles.title} numberOfLines={1}>{displayName}</Text>
            </View>

            <Pressable
              accessibilityRole="button"
              accessibilityLabel="Sign out"
              hitSlop={6}
              onPress={confirmSignOut}
              style={styles.signOutButton}
            >
              <Ionicons name="log-out-outline" size={20} color={colors.red} />
            </Pressable>

            <Pressable
              accessibilityLabel="Account and settings"
              onPress={() => router.push('/account')}
              style={styles.avatarWrap}
            >
              <Text style={styles.avatarText}>{displayName.charAt(0).toUpperCase()}</Text>
            </Pressable>
          </View>

          <ScrollView
            ref={scrollRef}
            showsVerticalScrollIndicator={false}
            contentContainerStyle={styles.scrollContent}
            keyboardShouldPersistTaps="handled"
            refreshControl={
              <RefreshControl refreshing={isRefreshing} onRefresh={onRefresh} tintColor={colors.accent} colors={[colors.accent]} />
            }
          >
            {renderContent()}
          </ScrollView>
        </View>

        {/* Android-style bottom navigation: solid bar, icon in a pill above each label. */}
        <View style={[styles.bottomNav, { paddingBottom: 10 + insets.bottom }]}>
          {tabs.map((tab) => {
            const isActive = tab.key === activeTab;

            return (
              <Pressable
                key={tab.key}
                accessibilityRole="tab"
                accessibilityState={{ selected: isActive }}
                accessibilityLabel={tab.key === 'alerts' && unread > 0 ? `Alerts, ${unread} unread` : tab.label}
                onPress={() => (tab.key === 'tenders' ? navigate.showTenders(tenderFilter) : navigate.openTab(tab.key))}
                style={styles.navItem}
              >
                <View style={[styles.iconPill, isActive && styles.iconPillActive]}>
                  <Ionicons name={isActive ? tab.activeIcon : tab.icon} size={22} color={isActive ? colors.accent : '#9db4c4'} />
                  {tab.key === 'alerts' && unread > 0 && (
                    <View style={styles.badge}>
                      <Text style={styles.badgeText}>{unread > 9 ? '9+' : unread}</Text>
                    </View>
                  )}
                </View>
                <Text style={[styles.navLabel, isActive && styles.navLabelActive]}>{tab.label}</Text>
              </Pressable>
            );
          })}
        </View>
      </SafeAreaView>
    </LinearGradient>
  );
}

function greetingForHour(hour: number) {
  if (hour < 12) return 'Good morning';
  if (hour < 18) return 'Good afternoon';
  return 'Good evening';
}

const styles = StyleSheet.create({
  screen: {
    flex: 1,
  },
  appShell: {
    flex: 1,
    paddingHorizontal: 18,
    paddingTop: 18,
  },
  glow: {
    position: 'absolute',
    width: 320,
    height: 320,
    borderRadius: 160,
    backgroundColor: 'rgba(0, 214, 255, 0.10)',
  },
  glowTop: {
    top: -120,
    right: -110,
  },
  glowBottom: {
    bottom: 80,
    left: -160,
    backgroundColor: 'rgba(42, 127, 255, 0.10)',
  },
  topBar: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    gap: 12,
    marginBottom: 16,
  },
  topCopy: {
    flex: 1,
  },
  eyebrow: {
    color: colors.muted,
    fontSize: 12,
    letterSpacing: 0.5,
    textTransform: 'uppercase',
  },
  title: {
    color: colors.text,
    fontSize: 26,
    fontWeight: '700',
    marginTop: 4,
  },
  signOutButton: {
    width: 40,
    height: 40,
    borderRadius: 20,
    alignItems: 'center',
    justifyContent: 'center',
    borderWidth: 1,
    borderColor: 'rgba(255, 122, 122, 0.35)',
    backgroundColor: 'rgba(255, 91, 91, 0.1)',
  },
  avatarWrap: {
    width: 40,
    height: 40,
    borderRadius: 20,
    backgroundColor: colors.accent,
    alignItems: 'center',
    justifyContent: 'center',
  },
  avatarText: {
    color: '#071521',
    fontWeight: '800',
    fontSize: 18,
  },
  scrollContent: {
    paddingBottom: 120,
  },
  bottomNav: {
    position: 'absolute',
    left: 0,
    right: 0,
    bottom: 0,
    flexDirection: 'row',
    paddingTop: 10,
    paddingHorizontal: 8,
    backgroundColor: '#0b1c2e',
    borderTopWidth: 1,
    borderTopColor: 'rgba(0, 214, 255, 0.18)',
    shadowColor: '#000000',
    shadowOpacity: 0.35,
    shadowRadius: 12,
    shadowOffset: { width: 0, height: -4 },
    elevation: 12,
  },
  navItem: {
    flex: 1,
    alignItems: 'center',
    justifyContent: 'center',
    gap: 4,
  },
  iconPill: {
    width: 64,
    height: 32,
    borderRadius: 16,
    alignItems: 'center',
    justifyContent: 'center',
  },
  iconPillActive: {
    backgroundColor: 'rgba(0, 214, 255, 0.18)',
  },
  navLabel: {
    color: '#9db4c4',
    fontWeight: '600',
    fontSize: 12,
  },
  navLabelActive: {
    color: colors.accent,
  },
  badge: {
    position: 'absolute',
    top: -2,
    right: 10,
    minWidth: 18,
    height: 18,
    borderRadius: 9,
    paddingHorizontal: 4,
    backgroundColor: colors.red,
    alignItems: 'center',
    justifyContent: 'center',
  },
  badgeText: {
    color: '#ffffff',
    fontSize: 10,
    fontWeight: '800',
  },
});
