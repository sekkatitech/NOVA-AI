import { Ionicons } from '@expo/vector-icons';
import React, { type ReactNode } from 'react';
import { ActivityIndicator, Pressable, StyleSheet, Text, View, type StyleProp, type ViewStyle } from 'react-native';

import { STATUS_LABELS, type TenderStatus } from '../lib/tenderpilot';
import { glass } from './glass';

export const colors = {
  text: '#ecf7ff',
  muted: '#87a6bd',
  accent: '#44d4ff',
  green: '#4dd7a3',
  amber: '#ffb454',
  red: '#ff7a7a',
};

export function Card({ children, style }: { children: ReactNode; style?: StyleProp<ViewStyle> }) {
  return <View style={[styles.card, style]}>{children}</View>;
}

export function SectionHeader({ title, action, onAction }: { title: string; action?: string; onAction?: () => void }) {
  return (
    <View style={styles.sectionHeader}>
      <Text style={styles.sectionTitle}>{title}</Text>
      {action && (
        <Pressable hitSlop={8} onPress={onAction}>
          <Text style={styles.sectionAction}>{action}</Text>
        </Pressable>
      )}
    </View>
  );
}

const STATUS_COLORS: Record<TenderStatus, string> = {
  discovered: colors.accent,
  in_progress: colors.amber,
  submitted: '#a78bfa',
  won: colors.green,
  lost: colors.red,
  archived: colors.muted,
};

export function StatusPill({ status }: { status: TenderStatus }) {
  const color = STATUS_COLORS[status];
  return (
    <View style={[styles.pill, { borderColor: color }]}>
      <Text style={[styles.pillText, { color }]}>{STATUS_LABELS[status]}</Text>
    </View>
  );
}

export function ProgressBar({ percent, label }: { percent: number | null; label?: string }) {
  if (percent === null) {
    return <Text style={styles.progressEmpty}>No mandatory checklist yet</Text>;
  }
  const color = percent >= 80 ? colors.green : percent >= 50 ? colors.amber : colors.red;
  return (
    <View>
      <View style={styles.progressRow}>
        <Text style={styles.progressLabel}>{label ?? 'Compliance'}</Text>
        <Text style={styles.progressLabel}>{percent}%</Text>
      </View>
      <View style={styles.progressTrack}>
        <View style={[styles.progressFill, { width: `${percent}%`, backgroundColor: color }]} />
      </View>
    </View>
  );
}

export function CheckRow({ label, checked, onPress, detail }: { label: string; checked: boolean; onPress: () => void; detail?: string }) {
  return (
    <Pressable
      accessibilityRole="checkbox"
      accessibilityState={{ checked }}
      onPress={onPress}
      style={styles.checkRow}
    >
      <View style={[styles.checkbox, checked && styles.checkboxChecked]}>
        {checked && <Ionicons name="checkmark" size={14} color="#071521" />}
      </View>
      <View style={styles.checkCopy}>
        <Text style={[styles.checkLabel, checked && styles.checkLabelDone]}>{label}</Text>
        {detail && <Text style={styles.checkDetail}>{detail}</Text>}
      </View>
    </Pressable>
  );
}

export function EmptyState({ icon, title, body }: { icon: keyof typeof Ionicons.glyphMap; title: string; body: string }) {
  return (
    <Card style={styles.empty}>
      <Ionicons name={icon} size={30} color={colors.accent} />
      <Text style={styles.emptyTitle}>{title}</Text>
      <Text style={styles.emptyBody}>{body}</Text>
    </Card>
  );
}

export function LoadState({ isLoading, error, onRetry }: { isLoading: boolean; error: unknown; onRetry: () => void }) {
  if (isLoading) {
    return (
      <View style={styles.loading}>
        <ActivityIndicator color={colors.accent} />
        <Text style={styles.emptyBody}>Loading your TenderPilot workspace…</Text>
      </View>
    );
  }
  if (error) {
    const message = error instanceof Error ? error.message : String(error);
    return (
      <Card style={styles.empty}>
        <Ionicons name="cloud-offline-outline" size={30} color={colors.red} />
        <Text style={styles.emptyTitle}>Couldn't load your workspace</Text>
        <Text style={styles.emptyBody}>{message}</Text>
        <Pressable onPress={onRetry} style={styles.retry}>
          <Text style={styles.retryText}>Try again</Text>
        </Pressable>
      </Card>
    );
  }
  return null;
}

const styles = StyleSheet.create({
  card: {
    backgroundColor: glass.fill,
    borderRadius: 20,
    padding: 16,
    borderWidth: 1,
    borderColor: glass.border,
  },
  sectionHeader: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    marginTop: 22,
    marginBottom: 12,
  },
  sectionTitle: {
    color: colors.text,
    fontSize: 18,
    fontWeight: '700',
  },
  sectionAction: {
    color: colors.accent,
    fontWeight: '600',
    fontSize: 13,
  },
  pill: {
    borderWidth: 1,
    borderRadius: 999,
    paddingHorizontal: 10,
    paddingVertical: 3,
    alignSelf: 'flex-start',
  },
  pillText: {
    fontSize: 11,
    fontWeight: '700',
  },
  progressRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    marginBottom: 6,
  },
  progressLabel: {
    color: colors.muted,
    fontSize: 12,
  },
  progressTrack: {
    height: 7,
    borderRadius: 999,
    backgroundColor: glass.fillStrong,
    overflow: 'hidden',
  },
  progressFill: {
    height: '100%',
    borderRadius: 999,
  },
  progressEmpty: {
    color: colors.muted,
    fontSize: 12,
    fontStyle: 'italic',
  },
  checkRow: {
    flexDirection: 'row',
    alignItems: 'flex-start',
    gap: 12,
    paddingVertical: 10,
  },
  checkbox: {
    width: 22,
    height: 22,
    borderRadius: 7,
    borderWidth: 1.5,
    borderColor: colors.muted,
    alignItems: 'center',
    justifyContent: 'center',
    marginTop: 1,
  },
  checkboxChecked: {
    backgroundColor: colors.green,
    borderColor: colors.green,
  },
  checkCopy: {
    flex: 1,
  },
  checkLabel: {
    color: colors.text,
    fontSize: 14,
    lineHeight: 20,
  },
  checkLabelDone: {
    color: colors.muted,
    textDecorationLine: 'line-through',
  },
  checkDetail: {
    color: colors.muted,
    fontSize: 12,
    marginTop: 2,
  },
  empty: {
    alignItems: 'center',
    gap: 8,
    paddingVertical: 26,
  },
  emptyTitle: {
    color: colors.text,
    fontSize: 16,
    fontWeight: '700',
    textAlign: 'center',
  },
  emptyBody: {
    color: colors.muted,
    fontSize: 13,
    lineHeight: 19,
    textAlign: 'center',
  },
  loading: {
    alignItems: 'center',
    gap: 12,
    paddingVertical: 60,
  },
  retry: {
    marginTop: 6,
    paddingHorizontal: 18,
    paddingVertical: 10,
    borderRadius: 12,
    backgroundColor: colors.accent,
  },
  retryText: {
    color: '#071521',
    fontWeight: '700',
  },
});
