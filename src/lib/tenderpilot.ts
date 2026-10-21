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
  company_id: string;
  full_name: string | null;
  role: string;
  companies: { name: string } | null;
};

export type DocumentCategory =
  | 'tender_mandatory'
  | 'tender_technical'
  | 'tender_submission'
  | 'tender_other'
  | 'company_profile'
  | 'supplier_agreement'
  | 'pricing_policy'
  | 'proposal_template'
  | 'reference_letter'
  | 'technical_document'
  | 'past_winning_tender'
  | 'certificate'
  | 'supplier_price_list'
  | 'other';

export type CompanyDocument = {
  id: string;
  name: string;
  category: DocumentCategory;
  tender_id: string | null;
  storage_path: string;
  file_size: number | null;
  mime_type: string | null;
  created_at: string;
  tenders: { id: string; title: string } | null;
};

// Same labels as the web app's src/config/document-categories.ts.
export const DOCUMENT_CATEGORY_LABELS: Record<DocumentCategory, string> = {
  tender_mandatory: 'Mandatory',
  tender_technical: 'Technical',
  tender_submission: 'Submission',
  tender_other: 'Other',
  company_profile: 'Company Profile',
  supplier_agreement: 'Supplier Agreement',
  pricing_policy: 'Pricing Policy',
  proposal_template: 'Proposal Template',
  reference_letter: 'Reference Letter',
  technical_document: 'Technical Document',
  past_winning_tender: 'Past Winning Tender',
  certificate: 'Certificate',
  supplier_price_list: 'Supplier Price List',
  other: 'Other',
};

export const TENDER_DOCUMENT_CATEGORIES: DocumentCategory[] = [
  'tender_mandatory',
  'tender_technical',
  'tender_submission',
  'tender_other',
];

// Company-wide categories a phone scan is likely to be: IDs and registrations go under Certificate or Other.
export const COMPANY_SCAN_CATEGORIES: DocumentCategory[] = [
  'certificate',
  'company_profile',
  'reference_letter',
  'technical_document',
  'other',
];

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
    .select('id, company_id, full_name, role, companies(name)')
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

export async function fetchDocuments(): Promise<CompanyDocument[]> {
  const { data, error } = await supabase
    .from('documents')
    .select('id, name, category, tender_id, storage_path, file_size, mime_type, created_at, tenders(id, title)')
    .neq('category', 'supplier_price_list')
    .order('created_at', { ascending: false });
  if (error) throw error;
  return data as unknown as CompanyDocument[];
}

// Same storage layout as the web app: the private "documents" bucket, under the company's folder.
export async function uploadDocument(params: {
  companyId: string;
  uploadedBy: string;
  tenderId: string | null;
  category: DocumentCategory;
  name: string;
  file: ArrayBuffer;
  mimeType: string;
}) {
  const { companyId, uploadedBy, tenderId, category, name, file, mimeType } = params;
  const storagePath = `${companyId}/${tenderId ?? 'scans'}/${Date.now()}-${name}`;

  const { error: uploadError } = await supabase.storage
    .from('documents')
    .upload(storagePath, file, { contentType: mimeType });
  if (uploadError) throw uploadError;

  const { error } = await supabase.from('documents').insert({
    company_id: companyId,
    tender_id: tenderId,
    category,
    name,
    storage_path: storagePath,
    file_size: file.byteLength,
    mime_type: mimeType,
    uploaded_by: uploadedBy,
  });
  if (error) {
    // Don't leave an orphaned file behind if the record can't be saved.
    await supabase.storage.from('documents').remove([storagePath]);
    throw error;
  }
}

export async function getDocumentUrl(storagePath: string) {
  const { data, error } = await supabase.storage.from('documents').createSignedUrl(storagePath, 120);
  if (error) throw error;
  return data.signedUrl;
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
