import { Ionicons } from '@expo/vector-icons';
import { Image } from 'expo-image';
import React, { useMemo } from 'react';
import { Pressable, StyleSheet, Text, View } from 'react-native';

import { glass } from '../components/glass';
import { Card, colors, LoadState, SectionHeader } from '../components/ui';
import { useChecklist, useNotifications, useOpenTasks, useTenders } from '../hooks/use-workspace';
import { CLOSED_STATUSES, daysUntil, formatDate } from '../lib/tenderpilot';
import type { Navigate } from './types';

type BriefingItem = {
  icon: keyof typeof Ionicons.glyphMap;
  tone: string;
  text: string;
  onPress?: () => void;
};

// NOVA's briefing is worked out from the workspace data; conversational AI arrives with TenderPilot's AI assistant.
export function NovaTab({ navigate, firstName }: { navigate: Navigate; firstName: string }) {
  const tenders = useTenders();
  const checklist = useChecklist();
  const tasks = useOpenTasks();
  const notifications = useNotifications();

  const briefing = useMemo<BriefingItem[]>(() => {
    const open = (tenders.data ?? []).filter((t) => !CLOSED_STATUSES.has(t.status));
    const openIds = new Set(open.map((t) => t.id));
    const items: BriefingItem[] = [];

    const closingThisWeek = open.filter((t) => t.closing_date && daysUntil(t.closing_date) >= 0 && daysUntil(t.closing_date) <= 7);
    if (closingThisWeek.length > 0) {
      const next = closingThisWeek[0];
      items.push({
        icon: 'alarm-outline',
        tone: colors.amber,
        text: `${closingThisWeek.length} tender${closingThisWeek.length === 1 ? '' : 's'} close${closingThisWeek.length === 1 ? 's' : ''} this week. Next: ${next.title} on ${formatDate(next.closing_date)}.`,
        onPress: () => navigate.showTenders('closing'),
      });
    }

    const briefings = open.filter((t) => t.briefing_date && daysUntil(t.briefing_date) >= 0 && daysUntil(t.briefing_date) <= 3);
    for (const tender of briefings) {
      items.push({
        icon: 'people-outline',
        tone: colors.accent,
        text: `${tender.is_briefing_compulsory ? 'Compulsory briefing' : 'Briefing'} for ${tender.title} on ${formatDate(tender.briefing_date)}.`,
        onPress: () => navigate.openTender(tender.id),
      });
    }

    const missing = (checklist.data ?? []).filter((item) => item.is_mandatory && !item.is_complete && openIds.has(item.tender_id));
    if (missing.length > 0) {
      const tenderCount = new Set(missing.map((item) => item.tender_id)).size;
      items.push({
        icon: 'shield-half-outline',
        tone: colors.red,
        text: `${missing.length} mandatory checklist item${missing.length === 1 ? '' : 's'} still open across ${tenderCount} tender${tenderCount === 1 ? '' : 's'}.`,
        onPress: () => navigate.showTenders('active'),
      });
    }

    const overdue = (tasks.data ?? []).filter((task) => task.due_date && daysUntil(task.due_date) < -1);
    if (overdue.length > 0) {
      items.push({
        icon: 'time-outline',
        tone: colors.red,
        text: `${overdue.length} task${overdue.length === 1 ? ' is' : 's are'} overdue. Oldest: ${overdue[0].title}.`,
        onPress: () => navigate.openTab('home'),
      });
    }

    const unread = (notifications.data ?? []).filter((n) => !n.is_read).length;
    if (unread > 0) {
      items.push({
        icon: 'notifications-outline',
        tone: colors.accent,
        text: `You have ${unread} unread alert${unread === 1 ? '' : 's'}.`,
        onPress: () => navigate.openTab('alerts'),
      });
    }

    return items;
  }, [tenders.data, checklist.data, tasks.data, notifications.data, navigate]);

  if (tenders.isLoading || tenders.error) {
    return <LoadState isLoading={tenders.isLoading} error={tenders.error} onRetry={tenders.refetch} />;
  }

  return (
    <>
      <Card>
        <View style={styles.header}>
          <Image source={require('../../assets/nova-avatar.jpg')} style={styles.avatar} accessibilityLabel="NOVA" />
          <View>
            <Text style={styles.title}>NOVA AI</Text>
            <View style={styles.onlineRow}>
              <View style={styles.onlineDot} />
              <Text style={styles.onlineText}>Watching your workspace</Text>
            </View>
          </View>
        </View>
        <Text style={styles.greeting}>
          {briefing.length === 0
            ? `All clear, ${firstName}. Nothing needs your attention right now.`
            : `Here's what needs your attention today, ${firstName}.`}
        </Text>
      </Card>

      {briefing.length > 0 && (
        <>
          <SectionHeader title="Today's briefing" />
          <View style={styles.briefing}>
            {briefing.map((item) => (
              <Pressable key={item.text} onPress={item.onPress}>
                <Card style={styles.briefingItem}>
                  <View style={[styles.briefingIcon, { borderColor: item.tone }]}>
                    <Ionicons name={item.icon} size={18} color={item.tone} />
                  </View>
                  <Text style={styles.briefingText}>{item.text}</Text>
                  <Ionicons name="chevron-forward" size={18} color={colors.muted} />
                </Card>
              </Pressable>
            ))}
          </View>
        </>
      )}

      <SectionHeader title="Ask NOVA" />
      <Card style={styles.comingSoon}>
        <Ionicons name="chatbubbles-outline" size={22} color={colors.accent} />
        <Text style={styles.comingSoonText}>
          Chatting with NOVA arrives with the TenderPilot AI assistant. Until then, NOVA keeps an eye on your deadlines,
          checklists and tasks.
        </Text>
      </Card>
    </>
  );
}

const styles = StyleSheet.create({
  header: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 12,
  },
  avatar: {
    width: 52,
    height: 52,
    borderRadius: 16,
    borderWidth: 1,
    borderColor: glass.borderBright,
  },
  title: {
    color: colors.accent,
    fontSize: 20,
    fontWeight: '800',
    letterSpacing: 0.5,
  },
  onlineRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 6,
    marginTop: 3,
  },
  onlineDot: {
    width: 8,
    height: 8,
    borderRadius: 4,
    backgroundColor: '#22c55e',
  },
  onlineText: {
    color: '#9fd8b8',
    fontSize: 12,
    fontWeight: '600',
  },
  greeting: {
    color: '#cbe5f7',
    fontSize: 15,
    lineHeight: 22,
    marginTop: 14,
  },
  briefing: {
    gap: 10,
  },
  briefingItem: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 12,
    padding: 14,
  },
  briefingIcon: {
    width: 34,
    height: 34,
    borderRadius: 11,
    borderWidth: 1,
    alignItems: 'center',
    justifyContent: 'center',
  },
  briefingText: {
    flex: 1,
    color: colors.text,
    fontSize: 14,
    lineHeight: 20,
  },
  comingSoon: {
    flexDirection: 'row',
    gap: 12,
    alignItems: 'flex-start',
  },
  comingSoonText: {
    flex: 1,
    color: colors.muted,
    fontSize: 13,
    lineHeight: 19,
  },
});
