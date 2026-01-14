export interface Message {
  id: number;
  source: string;
  sourceId: string;
  fromAddress?: string;
  fromName?: string;
  toAddresses?: string[];
  subject?: string;
  bodyPlain?: string;
  bodyHtml?: string;
  receivedAt: string;
  processedAt?: string;
  lifeDomain?: string;
  importance?: string;
  obligations?: Obligation[];
  deadlines?: Deadline[];
  aiAnalyses?: AiAnalysis[];
  attachments?: Attachment[];
}

export interface Attachment {
  id: number;
  messageId: number;
  filename: string;
  mimeType?: string;
  sizeBytes: number;
  localPath?: string;
  sourceId?: string;
  createdAt: string;
  message?: Message;
}

export interface AiAnalysis {
  id: number;
  messageId: number;
  summary?: string;
  obligationsAnalysis?: string;
  deadlinesAnalysis?: string;
  documentsAnalysis?: string;
  financialRecordsAnalysis?: string;
  lifeDomainAnalysis?: string;
  importanceAnalysis?: string;
  generalAnalysis?: string;
  contactsAnalysis?: string;
  eventsAnalysis?: string;
  rawResponse?: string;
  modelUsed?: string;
  costUsd?: number;
  analyzedAt: string;
  status: string;
}

// Parsed AI Analysis types
export interface ParsedAiAnalysis {
  summary?: AnalysisSummary;
  obligations?: AnalysisObligations;
  deadlines?: AnalysisDeadlines;
  documents?: AnalysisDocuments;
  financialRecords?: AnalysisFinancialRecords;
  lifeDomain?: AnalysisLifeDomain;
  importance?: AnalysisImportance;
  general?: AnalysisGeneral;
  contacts?: AnalysisContacts;
  events?: AnalysisEvents;
}

export interface AnalysisContacts {
  contacts?: Array<{
    name: string;
    email?: string;
    phone?: string;
    organization?: string;
    title?: string;
    notes?: string;
  }>;
}

export interface AnalysisEvents {
  events?: Array<{
    title: string;
    description?: string;
    startTime: string;
    endTime?: string;
    location?: string;
    isAllDay?: boolean;
  }>;
}

export interface AnalysisSummary {
  classification?: {
    type?: string[];
    importance?: string;
    reason?: string;
    confidence?: number;
  };
  entities?: {
    people?: string[];
    organizations?: string[];
    productsOrServices?: string[];
    identifiers?: Record<string, string>;
  };
  confidence?: number;
}

export interface AnalysisObligations {
  obligations?: Array<{
    action: string;
    trigger?: string;
    mandatory?: boolean;
    consequence?: string;
    confidence?: number;
  }>;
  confidence?: number;
}

export interface AnalysisDeadlines {
  deadlines?: Array<{
    description: string;
    date?: string;
    relativeTrigger?: string;
    critical?: boolean;
    confidence?: number;
  }>;
  confidence?: number;
}

export interface AnalysisDocuments {
  documents?: Array<{
    name: string;
    type?: string;
    requiredAction?: string;
    importance?: string;
    confidence?: number;
  }>;
  links?: Array<{
    description: string;
    url?: string;
    requiredAction?: string;
    reason?: string;
    confidence?: number;
  }>;
  confidence?: number;
}

export interface AnalysisFinancialRecords {
  coverage?: {
    amount?: string;
    currency?: string;
    conditions?: string[];
    exclusions?: string[];
  };
  risk?: {
    level?: string;
    explanation?: string;
  };
  confidence?: number;
}

export interface AnalysisLifeDomain {
  domain?: string;
  subcategory?: string;
  storageRecommendation?: {
    category?: string;
    subfolder?: string;
    retention?: string;
    indexFields?: string[];
  };
  confidence?: number;
}

export interface AnalysisImportance {
  level?: string;
  factors?: string[];
  urgency?: string;
  confidence?: number;
}

export interface AnalysisGeneral {
  missingItems?: string[];
  assumptions?: string[];
  followUpNeeded?: boolean;
  confidence?: number;
}

export interface Obligation {
  id: number;
  messageId: number;
  action: string;
  triggerType?: string;
  triggerValue?: string;
  mandatory: boolean;
  consequence?: string;
  estimatedTime?: string; // TimeSpan usually serializes as string ISO 8601 duration
  priority?: number;
  status: string;
  confidenceScore?: number;
  createdAt: string;
  completedAt?: string;
  message?: Message;
  deadlines?: Deadline[];
  task?: Task;
}

export interface Deadline {
  id: number;
  messageId: number;
  obligationId?: number;
  deadlineType: string;
  deadlineDate?: string;
  relativeTrigger?: string;
  relativeDuration?: string;
  description?: string;
  critical: boolean;
  status: string;
  message?: Message;
  obligation?: Obligation;
}

export interface Contact {
  id: number;
  name: string;
  email?: string;
  phone?: string;
  organization?: string;
  title?: string;
  notes?: string;
  createdAt: string;
  sourceMessageId?: number;
}

export interface CalendarEvent {
  id: number;
  title: string;
  description?: string;
  startTime: string;
  endTime?: string;
  location?: string;
  isAllDay: boolean;
  status: string;
  createdAt: string;
  sourceMessageId?: number;
}

export interface Task {
  id: number;
  obligationId?: number;
  title: string;
  description?: string;
  dueDate?: string;
  priority?: number;
  status: string;
  contextLink?: string;
  createdAt: string;
  completedAt?: string;
  obligation?: Obligation;
}