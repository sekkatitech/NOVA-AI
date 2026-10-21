import { Ionicons } from '@expo/vector-icons';
import * as WebBrowser from 'expo-web-browser';
import React, { useState } from 'react';
import { ActivityIndicator, Alert, Pressable, StyleSheet, Text, View } from 'react-native';

import { DOCUMENT_CATEGORY_LABELS, formatDate, getDocumentUrl, type CompanyDocument } from '../lib/tenderpilot';
import { colors } from './ui';

function formatSize(bytes: number | null) {
  if (!bytes) return null;
  if (bytes < 1024 * 1024) return `${Math.max(1, Math.round(bytes / 1024))} KB`;
  return `${(bytes / (1024 * 1024)).toFixed(1)} MB`;
}

// Opens through a short-lived signed link, as the web app does; the bucket itself is private.
export function DocumentRow({ document, showTender = true }: { document: CompanyDocument; showTender?: boolean }) {
  const [isOpening, setIsOpening] = useState(false);

  const open = async () => {
    setIsOpening(true);
    try {
      await WebBrowser.openBrowserAsync(await getDocumentUrl(document.storage_path));
    } catch (e) {
      Alert.alert("Couldn't open document", e instanceof Error ? e.message : String(e));
    } finally {
      setIsOpening(false);
    }
  };

  const isPdf = document.mime_type === 'application/pdf' || document.name.toLowerCase().endsWith('.pdf');
  const meta = [
    DOCUMENT_CATEGORY_LABELS[document.category],
    showTender ? document.tenders?.title ?? 'Company' : null,
    formatSize(document.file_size),
    formatDate(document.created_at),
  ].filter(Boolean);

  return (
    <Pressable onPress={open} style={styles.row}>
      <View style={styles.icon}>
        <Ionicons name={isPdf ? 'document-text-outline' : 'document-outline'} size={20} color={colors.accent} />
      </View>
      <View style={styles.copy}>
        <Text style={styles.name} numberOfLines={1}>{document.name}</Text>
        <Text style={styles.meta} numberOfLines={1}>{meta.join(' · ')}</Text>
      </View>
      {isOpening ? <ActivityIndicator color={colors.accent} /> : <Ionicons name="open-outline" size={18} color={colors.muted} />}
    </Pressable>
  );
}

const styles = StyleSheet.create({
  row: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 12,
    paddingVertical: 10,
  },
  icon: {
    width: 38,
    height: 38,
    borderRadius: 11,
    alignItems: 'center',
    justifyContent: 'center',
    backgroundColor: 'rgba(0, 214, 255, 0.12)',
  },
  copy: {
    flex: 1,
  },
  name: {
    color: colors.text,
    fontSize: 14,
    fontWeight: '700',
  },
  meta: {
    color: colors.muted,
    fontSize: 12,
    marginTop: 2,
  },
});
