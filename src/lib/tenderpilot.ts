import { supabase } from './supabase';

// Mirrors the TenderPilot AI web app's tables. Row-level security limits every query to the
// signed-in user's company, so no company filter is needed here.

export type TenderStatus = 'discovered' | 'in_progress' | 'submitted' | 'won' | 'lost' | 'archived';

export type Tender = {
  id: string;
  title: string;
  tender_number: string | null;
  client: string | null;
  department: string | null;
  closing_date: string | null;
  briefing_date: string | null;
  is_briefing_compulsory: boolean;
  submission_method: string | null;
  status: TenderStatus;
  risks: string | null;
  recommendations: string | null;
  updated_at: string;
};

export type ChecklistItem = {
  id: string;
  tender_id: string;
  label: string;
  is_mandatory: boolean;
  is_complete: boolean;
};

export type OpenTask = {
  id: string;
  tender_id: string;
  title: string;
  due_date: string | null;
  status: string;
  tenders: { id: string; title: string } | null;
};

export type Notification = {
  id: string;
  type: string;
  title: string;
  body: string | null;
  related_tender_id: string | null;
  is_read: boolean;
  created_at: string;
};

export type Profile = {
  id: string;
  full_name: string | null;
  role: string;
  companies: { name: string } | null;
};

export const STATUS_LABELS: Record<TenderStatus, string> = {
  discovered: 'Discovered',
  in_progress: 'In progress',
  submitted: 'Submitted',
  won: 'Won',
  lost: 'Lost',
  archived: 'Archived',
};

// Same groupings the web dashboard uses.
export const CLOSED_STATUSES = new Set<TenderStatus>(['won', 'lost', 'archived']);
export const ACTIVE_STATUSES = new Set<TenderStatus>(['discovered', 'in_progress']);

const TENDER_COLUMNS =
  'id, title, tender_number, client, department, closing_date, briefing_date, is_briefing_compulsory, submission_method, status, risks, recommendations, updated_at';

export async function fetchProfile(userId: string): Promise<Profile | null> {
  const { data, error } = await supabase
    .from('profiles')
    .select('id, full_name, role, companies(name)')
    .eq('id', userId)
    .maybeSingle();
  if (error) throw error;
  return data as Profile | null;
}

export async function fetchTenders(): Promise<Tender[]> {
  const { data, error } = await supabase
    .from('tenders')
    .select(TENDER_COLUMNS)
    .order('closing_date', { ascending: true, nullsFirst: false });
  if (error) throw error;
  return data as Tender[];
}

export async function fetchChecklist(): Promise<ChecklistItem[]> {
  const { data, error } = await supabase
    .from('tender_checklist_items')
    .select('id, tender_id, label, is_mandatory, is_complete')
    .order('created_at', { ascending: true });
  if (error) throw error;
  return data as ChecklistItem[];
}

export async function fetchOpenTasks(): Promise<OpenTask[]> {
  const { data, error } = await supabase
    .from('tender_tasks')
    .select('id, tender_id, title, due_date, status, tenders(id, title)')
    .neq('status', 'done')
    .order('due_date', { ascending: true, nullsFirst: false });
  if (error) throw error;
  return data as unknown as OpenTask[];
}

// A tender's value is the sum of its BOQ selling prices, as on the web pricing tab.
export async function fetchTenderValues(): Promise<Record<string, number>> {
  const { data, error } = await supabase.from('boq_items').select('tender_id, selling_price');
  if (error) throw error;
  const totals: Record<string, number> = {};
  for (const row of data as Array<{ tender_id: string; selling_price: number | string }>) {
    totals[row.tender_id] = (totals[row.tender_id] ?? 0) + Number(row.selling_price);
  }
  return totals;
}

export async function fetchNotifications(): Promise<Notification[]> {
  const { data, error } = await supabase
    .from('notifications')
    .select('id, type, title, body, related_tender_id, is_read, created_at')
    .order('created_at', { ascending: false })
    .limit(50);
  if (error) throw error;
  return data as Notification[];
}

export async function setChecklistItemComplete(id: string, isComplete: boolean) {
  const { error } = await supabase.from('tender_checklist_items').update({ is_complete: isComplete }).eq('id', id);
  if (error) throw error;
}

export async function completeTask(id: string) {
  const { error } = await supabase.from('tender_tasks').update({ status: 'done' }).eq('id', id);
  if (error) throw error;
}

export async function markNotificationRead(id: string) {
  const { error } = await supabase.from('notifications').update({ is_read: true }).eq('id', id);
  if (error) throw error;
}

export async function markAllNotificationsRead() {
  const { error } = await supabase.from('notifications').update({ is_read: true }).eq('is_read', false);
  if (error) throw error;
}

const MS_PER_DAY = 1000 * 60 * 60 * 24;

export function daysUntil(date: string) {
  return (new Date(date).getTime() - Date.now()) / MS_PER_DAY;
}

const MONTHS = ['Jan', 'Feb', 'Mar', 'Apr', 'May', 'Jun', 'Jul', 'Aug', 'Sep', 'Oct', 'Nov', 'Dec'];

export function formatDate(date: string | null) {
  if (!date) return 'No date';
  const d = new Date(date);
  return `${d.getDate()} ${MONTHS[d.getMonth()]} ${d.getFullYear()}`;
}

export function closingLabel(date: string | null) {
  if (!date) return 'No closing date';
  const days = daysUntil(date);
  if (days < 0) return `Closed ${formatDate(date)}`;
  if (days < 1) return 'Closes today';
  if (days < 2) return 'Closes tomorrow';
  return `Closes in ${Math.floor(days)} days`;
}

// Share of mandatory checklist items done, or null when the tender has no mandatory items.
export function compliancePercent(items: ChecklistItem[]) {
  const mandatory = items.filter((item) => item.is_mandatory);
  if (mandatory.length === 0) return null;
  return Math.round((mandatory.filter((item) => item.is_complete).length / mandatory.length) * 100);
}
