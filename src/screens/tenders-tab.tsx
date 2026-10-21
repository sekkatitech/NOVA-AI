import { Ionicons } from '@expo/vector-icons';
import React, { useMemo, useState } from 'react';
import { Pressable, ScrollView, StyleSheet, Text, TextInput, View } from 'react-native';

import { glass } from '../components/glass';
import { Card, CheckRow, colors, EmptyState, LoadState, ProgressBar, SectionHeader, StatusPill } from '../components/ui';
import {
  useChecklistByTender,
  useCompleteTask,
  useOpenTasks,
  useTenders,
  useTenderValues,
  useToggleChecklistItem,
} from '../hooks/use-workspace';
import {
  ACTIVE_STATUSES,
  CLOSED_STATUSES,
  closingLabel,
  compliancePercent,
  daysUntil,
  formatDate,
  type Tender,
} from '../lib/tenderpilot';
import { useCurrency } from '../providers/currency-provider';
import type { TenderFilter } from './types';

const FILTERS: Array<{ key: TenderFilter; label: string }> = [
  { key: 'active', label: 'Active' },
  { key: 'closing', label: 'Closing soon' },
  { key: 'submitted', label: 'Submitted' },
  { key: 'decided', label: 'Won / lost' },
  { key: 'all', label: 'All' },
];

function matchesFilter(tender: Tender, filter: TenderFilter) {
  switch (filter) {
    case 'active':
      return ACTIVE_STATUSES.has(tender.status);
    case 'closing': {
      if (!tender.closing_date || CLOSED_STATUSES.has(tender.status)) return false;
      const days = daysUntil(tender.closing_date);
      return days >= 0 && days <= 7;
    }
    case 'submitted':
      return tender.status === 'submitted';
    case 'decided':
      return tender.status === 'won' || tender.status === 'lost';
    default:
      return true;
  }
}

type Props = {
  filter: TenderFilter;
  onFilterChange: (filter: TenderFilter) => void;
  selectedId: string | null;
  onSelect: (id: string | null) => void;
};

export function TendersTab({ filter, onFilterChange, selectedId, onSelect }: Props) {
  const tenders = useTenders();
  const [search, setSearch] = useState('');

  const visible = useMemo(() => {
    const query = search.trim().toLowerCase();
    return (tenders.data ?? []).filter(
      (t) =>
        matchesFilter(t, filter) &&
        (!query ||
          [t.title, t.client, t.department, t.tender_number].some((field) => field?.toLowerCase().includes(query))),
    );
  }, [tenders.data, filter, search]);

  const selected = tenders.data?.find((t) => t.id === selectedId);
  if (selected) {
    return <TenderDetail tender={selected} onBack={() => onSelect(null)} />;
  }

  return (
    <>
      <View style={styles.search}>
        <Ionicons name="search" size={18} color={colors.muted} />
        <TextInput
          style={styles.searchInput}
          placeholder="Search title, client or tender number"
          placeholderTextColor={colors.muted}
          value={search}
          onChangeText={setSearch}
          autoCorrect={false}
        />
      </View>

      <ScrollView horizontal showsHorizontalScrollIndicator={false} contentContainerStyle={styles.filters}>
        {FILTERS.map((item) => (
          <Pressable
            key={item.key}
            onPress={() => onFilterChange(item.key)}
            style={[styles.filter, filter === item.key && styles.filterActive]}
          >
            <Text style={[styles.filterText, filter === item.key && styles.filterTextActive]}>{item.label}</Text>
          </Pressable>
        ))}
      </ScrollView>

      {tenders.isLoading || tenders.error ? (
        <LoadState isLoading={tenders.isLoading} error={tenders.error} onRetry={tenders.refetch} />
      ) : visible.length === 0 ? (
        <EmptyState
          icon="document-text-outline"
          title={search ? 'No matching tenders' : 'Nothing here yet'}
          body={search ? 'Try a different search.' : 'Tenders added on TenderPilot AI on the web appear here automatically.'}
        />
      ) : (
        <View style={styles.list}>
          {visible.map((tender) => (
            <TenderCard key={tender.id} tender={tender} onPress={() => onSelect(tender.id)} />
          ))}
        </View>
      )}
    </>
  );
}

function TenderCard({ tender, onPress }: { tender: Tender; onPress: () => void }) {
  const { format } = useCurrency();
  const values = useTenderValues();
  const checklistByTender = useChecklistByTender();
  const value = values.data?.[tender.id];

  return (
    <Pressable onPress={onPress}>
      <Card style={styles.tenderCard}>
        <View style={styles.cardTop}>
          <Text style={styles.cardNumber}>{tender.tender_number ?? 'No tender number'}</Text>
          <StatusPill status={tender.status} />
        </View>
        <Text style={styles.cardTitle}>{tender.title}</Text>
        <Text style={styles.cardMeta}>
          {[tender.client ?? tender.department, value ? format(value) : null].filter(Boolean).join(' · ') || 'No client set'}
        </Text>
        <Text style={styles.cardWhen}>{closingLabel(tender.closing_date)}</Text>
        <ProgressBar percent={compliancePercent(checklistByTender[tender.id] ?? [])} />
      </Card>
    </Pressable>
  );
}

function TenderDetail({ tender, onBack }: { tender: Tender; onBack: () => void }) {
  const { format } = useCurrency();
  const values = useTenderValues();
  const checklist = useChecklistByTender()[tender.id] ?? [];
  const tasks = (useOpenTasks().data ?? []).filter((task) => task.tender_id === tender.id);
  const toggleItem = useToggleChecklistItem();
  const completeTask = useCompleteTask();
  const value = values.data?.[tender.id];

  const facts = [
    { label: 'Closing', value: tender.closing_date ? `${formatDate(tender.closing_date)} · ${closingLabel(tender.closing_date)}` : 'Not set' },
    {
      label: 'Briefing',
      value: tender.briefing_date
        ? `${formatDate(tender.briefing_date)}${tender.is_briefing_compulsory ? ' · compulsory' : ''}`
        : 'None',
    },
    { label: 'Client', value: tender.client ?? '—' },
    { label: 'Department', value: tender.department ?? '—' },
    { label: 'Submission', value: tender.submission_method ?? '—' },
    { label: 'Value', value: value ? format(value, { compact: false }) : 'No BOQ pricing yet' },
  ];

  return (
    <>
      <Pressable onPress={onBack} style={styles.back} hitSlop={8}>
        <Ionicons name="chevron-back" size={20} color={colors.accent} />
        <Text style={styles.backText}>All tenders</Text>
      </Pressable>

      <Card>
        <View style={styles.cardTop}>
          <Text style={styles.cardNumber}>{tender.tender_number ?? 'No tender number'}</Text>
          <StatusPill status={tender.status} />
        </View>
        <Text style={styles.detailTitle}>{tender.title}</Text>
        <View style={styles.facts}>
          {facts.map((fact) => (
            <View key={fact.label} style={styles.fact}>
              <Text style={styles.factLabel}>{fact.label}</Text>
              <Text style={styles.factValue}>{fact.value}</Text>
            </View>
          ))}
        </View>
      </Card>

      <SectionHeader title="Compliance checklist" />
      {checklist.length === 0 ? (
        <EmptyState icon="shield-outline" title="No checklist yet" body="Add checklist items to this tender on the web." />
      ) : (
        <Card style={styles.listCard}>
          <ProgressBar percent={compliancePercent(checklist)} label="Mandatory items complete" />
          {checklist.map((item) => (
            <CheckRow
              key={item.id}
              label={item.label}
              checked={item.is_complete}
              detail={item.is_mandatory ? 'Mandatory' : 'Optional'}
              onPress={() => toggleItem.mutate({ id: item.id, isComplete: !item.is_complete })}
            />
          ))}
        </Card>
      )}

      <SectionHeader title="Open tasks" />
      {tasks.length === 0 ? (
        <EmptyState icon="checkmark-done-outline" title="No open tasks" body="Nothing outstanding on this tender." />
      ) : (
        <Card style={styles.listCard}>
          {tasks.map((task) => (
            <CheckRow
              key={task.id}
              label={task.title}
              checked={false}
              detail={task.due_date ? `Due ${formatDate(task.due_date)}` : undefined}
              onPress={() => completeTask.mutate(task.id)}
            />
          ))}
        </Card>
      )}

      {(tender.risks || tender.recommendations) && (
        <>
          <SectionHeader title="Notes from TenderPilot" />
          <Card style={styles.notes}>
            {tender.risks && (
              <View>
                <Text style={styles.factLabel}>Risks</Text>
                <Text style={styles.noteText}>{tender.risks}</Text>
              </View>
            )}
            {tender.recommendations && (
              <View>
                <Text style={styles.factLabel}>Recommendations</Text>
                <Text style={styles.noteText}>{tender.recommendations}</Text>
              </View>
            )}
          </Card>
        </>
      )}
    </>
  );
}

const styles = StyleSheet.create({
  search: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 10,
    height: 48,
    paddingHorizontal: 14,
    borderRadius: 16,
    borderWidth: 1,
    borderColor: glass.border,
    backgroundColor: glass.fill,
  },
  searchInput: {
    flex: 1,
    height: '100%',
    color: colors.text,
    fontSize: 14,
  },
  filters: {
    gap: 8,
    paddingVertical: 14,
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
    gap: 12,
  },
  tenderCard: {
    gap: 6,
  },
  cardTop: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    gap: 10,
  },
  cardNumber: {
    color: colors.accent,
    fontSize: 12,
    fontWeight: '600',
    flexShrink: 1,
  },
  cardTitle: {
    color: colors.text,
    fontSize: 17,
    fontWeight: '800',
    marginTop: 2,
  },
  cardMeta: {
    color: colors.muted,
    fontSize: 12,
  },
  cardWhen: {
    color: colors.amber,
    fontSize: 12,
    fontWeight: '700',
    marginBottom: 4,
  },
  back: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 4,
    marginBottom: 12,
  },
  backText: {
    color: colors.accent,
    fontWeight: '600',
  },
  detailTitle: {
    color: colors.text,
    fontSize: 22,
    fontWeight: '800',
    marginTop: 8,
  },
  facts: {
    marginTop: 14,
    gap: 10,
  },
  fact: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    gap: 16,
  },
  factLabel: {
    color: colors.muted,
    fontSize: 12,
    textTransform: 'uppercase',
    letterSpacing: 0.5,
  },
  factValue: {
    color: colors.text,
    fontSize: 13,
    fontWeight: '600',
    flexShrink: 1,
    textAlign: 'right',
  },
  listCard: {
    gap: 4,
  },
  notes: {
    gap: 14,
  },
  noteText: {
    color: '#cfe5f4',
    fontSize: 14,
    lineHeight: 20,
    marginTop: 4,
  },
});
