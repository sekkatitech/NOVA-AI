import { Ionicons } from '@expo/vector-icons';
import { LinearGradient } from 'expo-linear-gradient';
import { router } from 'expo-router';
import { StatusBar } from 'expo-status-bar';
import React, { useMemo, useState } from 'react';
import { Pressable, RefreshControl, ScrollView, StyleSheet, Text, View } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';

import { DocumentRow } from '../../src/components/document-row';
import { glass } from '../../src/components/glass';
import { Card, colors, EmptyState, LoadState } from '../../src/components/ui';
import { useDocuments } from '../../src/hooks/use-workspace';

type Filter = 'all' | 'company' | 'tender';

const FILTERS: Array<{ key: Filter; label: string }> = [
  { key: 'all', label: 'All' },
  { key: 'company', label: 'Company' },
  { key: 'tender', label: 'Tender documents' },
];

export default function DocumentsScreen() {
  const documents = useDocuments();
  const [filter, setFilter] = useState<Filter>('all');

  const visible = useMemo(
    () =>
      (documents.data ?? []).filter((doc) =>
        filter === 'all' ? true : filter === 'company' ? doc.tender_id === null : doc.tender_id !== null,
      ),
    [documents.data, filter],
  );

  return (
    <LinearGradient colors={['#04192f', '#071521', '#050e1a']} style={styles.fill}>
      <StatusBar style="light" />
      <SafeAreaView style={styles.fill}>
        <View style={styles.header}>
          <Pressable accessibilityLabel="Back" hitSlop={12} onPress={() => router.back()} style={styles.iconButton}>
            <Ionicons name="chevron-back" size={22} color={colors.text} />
          </Pressable>
          <Text style={styles.headerTitle}>Documents</Text>
          <Pressable accessibilityLabel="Scan a document" onPress={() => router.push('/scan')} style={styles.scanButton}>
            <Ionicons name="scan-outline" size={18} color="#071521" />
            <Text style={styles.scanText}>Scan</Text>
          </Pressable>
        </View>

        <ScrollView
          contentContainerStyle={styles.content}
          refreshControl={
            <RefreshControl
              refreshing={documents.isRefetching}
              onRefresh={documents.refetch}
              tintColor={colors.accent}
              colors={[colors.accent]}
            />
          }
        >
          <ScrollView horizontal showsHorizontalScrollIndicator={false} contentContainerStyle={styles.filters}>
            {FILTERS.map((item) => (
              <Pressable
                key={item.key}
                onPress={() => setFilter(item.key)}
                style={[styles.filter, filter === item.key && styles.filterActive]}
              >
                <Text style={[styles.filterText, filter === item.key && styles.filterTextActive]}>{item.label}</Text>
              </Pressable>
            ))}
          </ScrollView>

          {documents.isLoading || documents.error ? (
            <LoadState isLoading={documents.isLoading} error={documents.error} onRetry={documents.refetch} />
          ) : visible.length === 0 ? (
            <EmptyState
              icon="folder-open-outline"
              title="No documents yet"
              body="Scan an ID, certificate or tender page, or upload files on TenderPilot AI on the web."
            />
          ) : (
            <Card style={styles.list}>
              {visible.map((doc) => (
                <DocumentRow key={doc.id} document={doc} />
              ))}
            </Card>
          )}
        </ScrollView>
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
    gap: 12,
    paddingHorizontal: 18,
    paddingVertical: 12,
  },
  headerTitle: {
    flex: 1,
    color: colors.text,
    fontSize: 24,
    fontWeight: '800',
  },
  iconButton: {
    width: 36,
    height: 36,
    borderRadius: 18,
    alignItems: 'center',
    justifyContent: 'center',
    backgroundColor: glass.fillStrong,
  },
  scanButton: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 6,
    paddingHorizontal: 14,
    height: 36,
    borderRadius: 18,
    backgroundColor: colors.accent,
  },
  scanText: {
    color: '#071521',
    fontWeight: '800',
  },
  content: {
    paddingHorizontal: 18,
    paddingBottom: 40,
  },
  filters: {
    gap: 8,
    paddingBottom: 14,
  },
  filter: {
    paddingHorizontal: 14,
    paddingVertical: 8,
    borderRadius: 999,
    borderWidth: 1,
    borderColor: glass.border,
    backgroundColor: glass.fill,
  },
  filterActive: {
    borderColor: glass.borderBright,
    backgroundColor: 'rgba(0, 214, 255, 0.14)',
  },
  filterText: {
    color: colors.muted,
    fontSize: 13,
    fontWeight: '600',
  },
  filterTextActive: {
    color: colors.accent,
  },
  list: {
    paddingVertical: 4,
  },
});
