import { Ionicons } from '@expo/vector-icons';
import React from 'react';
import { Pressable, StyleSheet, Text, View } from 'react-native';

import { Card, colors, EmptyState, LoadState, SectionHeader } from '../components/ui';
import { useMarkAllNotificationsRead, useMarkNotificationRead, useNotifications } from '../hooks/use-workspace';
import { formatDate, type Notification } from '../lib/tenderpilot';
import type { Navigate } from './types';

const TYPE_ICONS: Record<string, keyof typeof Ionicons.glyphMap> = {
  closing_date_reminder: 'alarm-outline',
  briefing_reminder: 'people-outline',
  task_due: 'checkbox-outline',
  tender_status_change: 'swap-horizontal-outline',
  document_uploaded: 'document-attach-outline',
  general: 'notifications-outline',
};

export function AlertsTab({ navigate }: { navigate: Navigate }) {
  const notifications = useNotifications();
  const markRead = useMarkNotificationRead();
  const markAllRead = useMarkAllNotificationsRead();
  const items = notifications.data ?? [];
  const unread = items.filter((item) => !item.is_read).length;

  if (notifications.isLoading || notifications.error) {
    return <LoadState isLoading={notifications.isLoading} error={notifications.error} onRetry={notifications.refetch} />;
  }

  const open = (item: Notification) => {
    if (!item.is_read) markRead.mutate(item.id);
    if (item.related_tender_id) navigate.openTender(item.related_tender_id);
  };

  return (
    <>
      <SectionHeader
        title={unread > 0 ? `${unread} unread` : 'Alerts'}
        action={unread > 0 ? 'Mark all read' : undefined}
        onAction={() => markAllRead.mutate()}
      />
      {items.length === 0 ? (
        <EmptyState
          icon="notifications-off-outline"
          title="No alerts yet"
          body="Closing-date, briefing and task reminders from TenderPilot AI will appear here."
        />
      ) : (
        <View style={styles.list}>
          {items.map((item) => (
            <Pressable key={item.id} onPress={() => open(item)}>
              <Card style={[styles.item, !item.is_read && styles.itemUnread]}>
                <Ionicons name={TYPE_ICONS[item.type] ?? 'notifications-outline'} size={20} color={item.is_read ? colors.muted : colors.accent} />
                <View style={styles.copy}>
                  <Text style={[styles.title, item.is_read && styles.titleRead]}>{item.title}</Text>
                  {item.body && <Text style={styles.body}>{item.body}</Text>}
                  <Text style={styles.date}>{formatDate(item.created_at)}</Text>
                </View>
                {!item.is_read && <View style={styles.unreadDot} />}
              </Card>
            </Pressable>
          ))}
        </View>
      )}
    </>
  );
}

const styles = StyleSheet.create({
  list: {
    gap: 10,
  },
  item: {
    flexDirection: 'row',
    gap: 12,
    alignItems: 'flex-start',
    padding: 14,
  },
  itemUnread: {
    borderColor: 'rgba(0, 214, 255, 0.35)',
    backgroundColor: 'rgba(0, 214, 255, 0.07)',
  },
  copy: {
    flex: 1,
  },
  title: {
    color: colors.text,
    fontSize: 14,
    fontWeight: '700',
    lineHeight: 20,
  },
  titleRead: {
    fontWeight: '500',
    color: '#c9d9e6',
  },
  body: {
    color: colors.muted,
    fontSize: 13,
    marginTop: 3,
    lineHeight: 18,
  },
  date: {
    color: colors.muted,
    fontSize: 11,
    marginTop: 6,
  },
  unreadDot: {
    width: 9,
    height: 9,
    borderRadius: 5,
    backgroundColor: colors.accent,
    marginTop: 5,
  },
});
