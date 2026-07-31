export type CrmAccessLevel = 'admin' | 'manager' | 'staff' | null;

export type ContactSource =
  | 'manual' | 'imported' | 'pos_sale'
  | 'website' | 'referral' | 'cold_outreach' | 'event' | 'social_media' | 'walk_in' | 'other';
export type ActivityType = 'call' | 'email' | 'meeting' | 'note' | 'task' | 'stage_change' | 'deal_created' | 'deal_won' | 'deal_lost' | 'feedback_logged';
export type DealStatus = 'open' | 'won' | 'lost';
export type CustomFieldAppliesTo = 'contact' | 'company' | 'deal';
export type CustomFieldType = 'text' | 'number' | 'date' | 'select';

export interface CustomFieldDef {
  _id: string;
  name: string;
  fieldType: CustomFieldType;
  appliesTo: CustomFieldAppliesTo;
  options: string[];
  isActive?: boolean;
}

export interface Company {
  _id: string;
  name: string;
  industry: string;
  customFieldValues: Record<string, string | number>;
  contacts?: { _id: string; firstName: string; lastName: string; email: string }[];
  deals?: { _id: string; title: string; value: number; status: DealStatus; stageId: string }[];
}

export interface Contact {
  _id: string;
  firstName: string;
  lastName: string;
  email: string;
  phone: string;
  companyId: string | null;
  company?: { name: string } | null;
  tags: string[];
  source: ContactSource;
  sourceWebsite?: string | null;
  sourceEventName?: string | null;
  sourceEventVenue?: string | null;
  sourceEventDate?: string | null;
  assignedTo: string;
  customFieldValues: Record<string, string | number>;
  createdAt: string;
  deals?: Deal[];
}

export interface PipelineStage {
  id: string;
  name: string;
  order: number;
  isWon: boolean;
  isLost: boolean;
  color?: string;
}

export interface Pipeline {
  _id: string;
  name: string;
  stages: PipelineStage[];
  isDefault: boolean;
}

export interface NextAction {
  description: string;
  dueDate: string | null;
}

export interface Deal {
  _id: string;
  title: string;
  contactId: string;
  contact?: { firstName: string; lastName: string } | null;
  companyId: string | null;
  pipelineId: string;
  pipeline?: Pipeline | null;
  stageId: string;
  value: number;
  currency: string;
  expectedCloseDate: string | null;
  nextAction: NextAction | null;
  assignedTo: string;
  status: DealStatus;
  wonAt: string | null;
  lostAt: string | null;
  confirmedSaleId: string | null;
  customFieldValues: Record<string, string | number>;
  createdAt: string;
  updatedAt: string;
}

export interface Subtask {
  _id: string;
  title: string;
  isCompleted: boolean;
  completedAt: string | null;
}

export type TaskPriority = 'high' | 'medium' | 'low';

export interface Activity {
  _id: string;
  type: ActivityType;
  contactId: string;
  dealId: string | null;
  subject: string;
  notes: string | null;
  dueDate: string | null;
  completed: boolean | null;
  completedAt: string | null;
  assignedTo: string | null;
  priority?: TaskPriority;
  subtasks?: Subtask[];
  performedBy: string;
  performedByName: string;
  createdAt: string;
  contact?: { firstName: string; lastName: string } | null;
}

export interface PosSaleSummary {
  _id: string;
  saleNumber: string;
  total: number;
  status: string;
  createdAt: string;
  items: { name: string; quantity: number; lineTotal: number }[];
}

export type TimelineEntry = (({ kind: 'activity' } & Activity) | ({ kind: 'pos_sale' } & PosSaleSummary)) & { at: string };

export interface Feedback {
  _id: string;
  contactId: string;
  dealId: string | null;
  rating: number;
  comment: string | null;
  loggedBy: string;
  loggedByName: string;
  createdAt: string;
}

export interface FeedbackListResponse {
  feedback: Feedback[];
  avgRating: number | null;
  count: number;
}

export interface FeedbackSummary {
  count: number;
  avgRating: number;
  distribution: { rating: number; count: number }[];
}

export interface SourceEffectiveness {
  source: string;
  contactCount: number;
  wonContactCount: number;
  wonValue: number;
  conversionRate: number;
}

export interface StockSearchResult {
  _id: string;
  sku: string;
  name: string;
  salePrice: number;
  unitOfMeasure: string;
  isTracked: boolean;
  stock: number | null;
}

export interface PipelineReport {
  byStage: { stageId: string; stageName: string; dealCount: number; value: number }[];
  openValue: number;
  openCount: number;
  winRate: number;
  avgDealSize: number;
  avgTimeToCloseDays: number;
  wonCount: number;
  lostCount: number;
}

export interface ActivityReportRow {
  staffId: string;
  staffName: string;
  calls: number;
  emails: number;
  meetings: number;
  notes: number;
  tasksCompleted: number;
}
