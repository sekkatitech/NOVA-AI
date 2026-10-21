import { Ionicons } from '@expo/vector-icons';
import { Image } from 'expo-image';
import { router } from 'expo-router';
import React from 'react';
import { Pressable, StyleSheet, Text, View } from 'react-native';

import { Card, CheckRow, colors, EmptyState, LoadState, ProgressBar, SectionHeader } from '../components/ui';
import { useChecklistByTender, useCompleteTask, useDashboardStats, useOpenTasks } from '../hooks/use-workspace';
import { closingLabel, compliancePercent, formatDate } from '../lib/tenderpilot';
import { useCurrency } from '../providers/currency-provider';
import type { Navigate } from './types';

export function DashboardTab({ navigate }: { navigate: Navigate }) {
  const { format } = useCurrency();
  const { stats, isLoading, error, refetch } = useDashboardStats();
  const checklistByTender = useChecklistByTender();
  const openTasks = useOpenTasks();
  const completeTask = useCompleteTask();

  if (isLoading || error) {
    return <LoadState isLoading={isLoading} error={error} onRetry={refetch} />;
  }

  const metrics = [
    { label: 'Active', value: String(stats.active), tone: colors.green, onPress: () => navigate.showTenders('active') },
    { label: 'Closing in 7 days', value: String(stats.closingSoon), tone: colors.amber, onPress: () => navigate.showTenders('closing') },
    { label: 'Win rate', value: stats.winRate, tone: colors.accent, onPress: () => navigate.showTenders('decided') },
  ];

  return (
    <>
      <View style={styles.heroCard}>
        {/* NOVA sits on the top edge of the card. */}
        <Image
          source={require('../../assets/nova-mascot.png')}
          style={styles.mascot}
          contentFit="contain"
          accessibilityLabel="NOVA"
        />
        <Text style={styles.heroLabel}>Open pipeline</Text>
        <Text style={styles.heroValue}>{format(stats.pipelineValue)}</Text>
        <Text style={styles.heroMeta}>
          {stats.pipelineValue === 0 ? 'Add BOQ pricing on the web to see tender values' : 'Total BOQ selling price of open tenders'}
        </Text>
        <Pressable style={styles.heroButton} onPress={() => navigate.showTenders('active')}>
          <Text style={styles.heroButtonText}>Review tenders</Text>
        </Pressable>
      </View>

      <View style={styles.metricsRow}>
        {metrics.map((metric) => (
          <Pressable key={metric.label} style={styles.metricCard} onPress={metric.onPress}>
            <View style={[styles.dot, { backgroundColor: metric.tone }]} />
            <Text style={styles.metricValue}>{metric.value}</Text>
            <Text style={styles.metricLabel}>{metric.label}</Text>
          </Pressable>
        ))}
      </View>

      <View style={styles.actions}>
        <Pressable accessibilityRole="button" onPress={() => router.push('/scan')} style={[styles.action, styles.actionPrimary]}>
          <Ionicons name="scan-outline" size={20} color="#071521" />
          <Text style={styles.actionPrimaryText}>Scan document</Text>
        </Pressable>
        <Pressable accessibilityRole="button" onPress={() => router.push('/documents')} style={styles.action}>
          <Ionicons name="folder-open-outline" size={20} color={colors.accent} />
          <Text style={styles.actionText}>Documents</Text>
        </Pressable>
      </View>

      <SectionHeader title="Upcoming deadlines" action="View all" onAction={() => navigate.showTenders('active')} />
      {stats.upcoming.length === 0 ? (
        <EmptyState
          icon="calendar-outline"
          title="No upcoming closing dates"
          body="Tenders you add on TenderPilot AI with a closing date will show up here."
        />
      ) : (
        <Card style={styles.list}>
          {stats.upcoming.map((tender, index) => (
            <Pressable
              key={tender.id}
              onPress={() => navigate.openTender(tender.id)}
              style={[styles.deadline, index < stats.upcoming.length - 1 && styles.divider]}
            >
              <View style={styles.deadlineHeader}>
                <View style={styles.deadlineCopy}>
                  <Text style={styles.deadlineTitle} numberOfLines={2}>{tender.title}</Text>
                  <Text style={styles.deadlineMeta}>{tender.client ?? tender.department ?? 'No client set'}</Text>
                </View>
                <Text style={styles.deadlineWhen}>{closingLabel(tender.closing_date)}</Text>
              </View>
              <ProgressBar percent={compliancePercent(checklistByTender[tender.id] ?? [])} />
            </Pressable>
          ))}
        </Card>
      )}

      <SectionHeader title="Open tasks" />
      {(openTasks.data ?? []).length === 0 ? (
        <EmptyState icon="checkmark-done-outline" title="No open tasks" body="You're all caught up." />
      ) : (
        <Card style={styles.list}>
          {(openTasks.data ?? []).slice(0, 6).map((task) => (
            <CheckRow
              key={task.id}
              label={task.title}
              checked={false}
              detail={`${task.tenders?.title ?? 'Tender'}${task.due_date ? ` · due ${formatDate(task.due_date)}` : ''}`}
              onPress={() => completeTask.mutate(task.id)}
            />
          ))}
        </Card>
      )}
    </>
  );
}

const styles = StyleSheet.create({
  mascot: {
    position: 'absolute',
    right: 4,
    bottom: '100%',
    marginBottom: -14,
    width: 150,
    aspectRatio: 952 / 900,
  },
  heroCard: {
    marginTop: 120,
    backgroundColor: 'rgba(255, 255, 255, 0.06)',
    borderRadius: 24,
    padding: 18,
    borderWidth: 1,
    borderColor: 'rgba(255, 255, 255, 0.12)',
  },
  heroLabel: {
    color: colors.muted,
    fontSize: 12,
    textTransform: 'uppercase',
    letterSpacing: 0.8,
  },
  heroValue: {
    color: '#eefaff',
    fontSize: 34,
    fontWeight: '800',
    marginTop: 6,
  },
  heroMeta: {
    color: colors.muted,
    fontSize: 12,
    marginTop: 4,
  },
  heroButton: {
    alignSelf: 'flex-start',
    marginTop: 14,
    backgroundColor: colors.accent,
    paddingVertical: 10,
    paddingHorizontal: 16,
    borderRadius: 12,
  },
  heroButtonText: {
    color: '#071521',
    fontWeight: '700',
  },
  metricsRow: {
    flexDirection: 'row',
    gap: 8,
    marginTop: 14,
  },
  metricCard: {
    flex: 1,
    backgroundColor: 'rgba(255, 255, 255, 0.06)',
    borderRadius: 18,
    padding: 12,
    borderWidth: 1,
    borderColor: 'rgba(255, 255, 255, 0.12)',
  },
  dot: {
    width: 9,
    height: 9,
    borderRadius: 5,
  },
  metricValue: {
    color: '#edfaff',
    fontSize: 24,
    fontWeight: '700',
    marginTop: 10,
  },
  metricLabel: {
    color: colors.muted,
    fontSize: 11,
    marginTop: 2,
  },
  actions: {
    flexDirection: 'row',
    gap: 8,
    marginTop: 10,
  },
  action: {
    flex: 1,
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    gap: 8,
    height: 48,
    borderRadius: 16,
    borderWidth: 1,
    borderColor: 'rgba(0, 214, 255, 0.35)',
    backgroundColor: 'rgba(255, 255, 255, 0.06)',
  },
  actionPrimary: {
    backgroundColor: colors.accent,
    borderColor: colors.accent,
  },
  actionText: {
    color: colors.text,
    fontWeight: '700',
  },
  actionPrimaryText: {
    color: '#071521',
    fontWeight: '800',
  },
  list: {
    paddingVertical: 4,
  },
  deadline: {
    paddingVertical: 12,
    gap: 10,
  },
  divider: {
    borderBottomWidth: 1,
    borderBottomColor: 'rgba(255, 255, 255, 0.08)',
  },
  deadlineHeader: {
    flexDirection: 'row',
    gap: 10,
  },
  deadlineCopy: {
    flex: 1,
  },
  deadlineTitle: {
    color: colors.text,
    fontSize: 15,
    fontWeight: '700',
  },
  deadlineMeta: {
    color: colors.muted,
    fontSize: 12,
    marginTop: 3,
  },
  deadlineWhen: {
    color: colors.amber,
    fontSize: 12,
    fontWeight: '700',
  },
});
