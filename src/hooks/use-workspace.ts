import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query';
import { useMemo } from 'react';

import * as api from '../lib/tenderpilot';
import { useAuth } from '../providers/auth-provider';

export function useProfile() {
  const { user } = useAuth();
  return useQuery({
    queryKey: ['profile', user?.id],
    queryFn: () => api.fetchProfile(user!.id),
    enabled: Boolean(user),
    refetchInterval: false,
  });
}

export function useTenders() {
  return useQuery({ queryKey: ['tenders'], queryFn: api.fetchTenders });
}

export function useChecklist() {
  return useQuery({ queryKey: ['checklist'], queryFn: api.fetchChecklist });
}

export function useOpenTasks() {
  return useQuery({ queryKey: ['open-tasks'], queryFn: api.fetchOpenTasks });
}

export function useTenderValues() {
  return useQuery({ queryKey: ['tender-values'], queryFn: api.fetchTenderValues });
}

export function useNotifications() {
  return useQuery({ queryKey: ['notifications'], queryFn: api.fetchNotifications });
}

export function useChecklistByTender() {
  const { data } = useChecklist();
  return useMemo(() => {
    const byTender: Record<string, api.ChecklistItem[]> = {};
    for (const item of data ?? []) {
      (byTender[item.tender_id] ??= []).push(item);
    }
    return byTender;
  }, [data]);
}

// The same figures as the web dashboard, plus the open pipeline value.
export function useDashboardStats() {
  const tenders = useTenders();
  const values = useTenderValues();

  const stats = useMemo(() => {
    const list = tenders.data ?? [];
    const open = list.filter((t) => !api.CLOSED_STATUSES.has(t.status));
    const won = list.filter((t) => t.status === 'won').length;
    const lost = list.filter((t) => t.status === 'lost').length;

    return {
      active: list.filter((t) => api.ACTIVE_STATUSES.has(t.status)).length,
      closingSoon: open.filter((t) => {
        if (!t.closing_date) return false;
        const days = api.daysUntil(t.closing_date);
        return days >= 0 && days <= 7;
      }).length,
      winRate: won + lost > 0 ? `${Math.round((won / (won + lost)) * 100)}%` : '—',
      pipelineValue: open.reduce((sum, t) => sum + (values.data?.[t.id] ?? 0), 0),
      upcoming: open
        .filter((t) => t.closing_date && api.daysUntil(t.closing_date) >= 0)
        .slice(0, 6),
    };
  }, [tenders.data, values.data]);

  return { stats, isLoading: tenders.isLoading, error: tenders.error, refetch: tenders.refetch };
}

export function useRefreshAll() {
  const queryClient = useQueryClient();
  return () => queryClient.invalidateQueries();
}

export function useToggleChecklistItem() {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: ({ id, isComplete }: { id: string; isComplete: boolean }) =>
      api.setChecklistItemComplete(id, isComplete),
    // Tick immediately, and roll back if the save fails.
    onMutate: async ({ id, isComplete }) => {
      await queryClient.cancelQueries({ queryKey: ['checklist'] });
      const previous = queryClient.getQueryData<api.ChecklistItem[]>(['checklist']);
      queryClient.setQueryData<api.ChecklistItem[]>(['checklist'], (items) =>
        items?.map((item) => (item.id === id ? { ...item, is_complete: isComplete } : item)),
      );
      return { previous };
    },
    onError: (_error, _variables, context) => queryClient.setQueryData(['checklist'], context?.previous),
    onSettled: () => queryClient.invalidateQueries({ queryKey: ['checklist'] }),
  });
}

export function useCompleteTask() {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: api.completeTask,
    onMutate: async (id: string) => {
      await queryClient.cancelQueries({ queryKey: ['open-tasks'] });
      const previous = queryClient.getQueryData<api.OpenTask[]>(['open-tasks']);
      queryClient.setQueryData<api.OpenTask[]>(['open-tasks'], (tasks) => tasks?.filter((task) => task.id !== id));
      return { previous };
    },
    onError: (_error, _id, context) => queryClient.setQueryData(['open-tasks'], context?.previous),
    onSettled: () => queryClient.invalidateQueries({ queryKey: ['open-tasks'] }),
  });
}

export function useMarkNotificationRead() {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: api.markNotificationRead,
    onMutate: async (id: string) => {
      queryClient.setQueryData<api.Notification[]>(['notifications'], (items) =>
        items?.map((item) => (item.id === id ? { ...item, is_read: true } : item)),
      );
    },
    onSettled: () => queryClient.invalidateQueries({ queryKey: ['notifications'] }),
  });
}

export function useMarkAllNotificationsRead() {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: api.markAllNotificationsRead,
    onMutate: async () => {
      queryClient.setQueryData<api.Notification[]>(['notifications'], (items) =>
        items?.map((item) => ({ ...item, is_read: true })),
      );
    },
    onSettled: () => queryClient.invalidateQueries({ queryKey: ['notifications'] }),
  });
}
