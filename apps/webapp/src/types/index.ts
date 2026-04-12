export type UserRole = 'admin' | 'operador' | 'auditor';
export type UserTheme = 'dark' | 'light' | 'industrial';

export interface User {
  id: number;
  username: string;
  name?: string;
  contact_email?: string;
  profile_icon?: string;
  role?: UserRole;
  theme?: UserTheme;
}

export interface AdminUser {
  id: number;
  username: string;
  name: string;
  contact_email: string;
  role: UserRole;
}

export interface UserProfile {
  name: string;
  contact_email: string;
  theme?: UserTheme;
  address?: {
    street?: string;
    city?: string;
    state?: string;
    zip_code?: string;
    country?: string;
  };
}

export interface Tag {
  ID: number;
  name: string;
  description: string;
  unit: string;
}

export interface TagDraft {
  name: string;
  description: string;
  unit: string;
}

export interface HistoryItem {
  ID: number | string;
  CreatedAt?: string;
  consistency_status: string;
  Measurements?: number[];
  ReconciledValues?: number[];
}

export interface HistoryFilters {
  endDate: string;
  page?: number;
  startDate: string;
  status: string;
}

export interface HistoryResponse {
  data?: HistoryItem[];
  total?: number;
}

export interface ReconciliationEntry {
  id: number;
  user: string;
  time: string;
  tagname: string[];
  tagmeasured?: string[];
  tagreconciled: string[];
  tagcorrection: string[];
  tagmatrix: number[][];
  status: string;
}

export interface ReconcilePayload {
  constraints: number[][];
  measurements: number[];
  tolerances: number[];
  workspace_id?: number;
}

export interface ReconcileResult {
  reconciled_values: number[];
  corrections: number[];
  consistency_status: string;
  chi_square?: number;
  critical_value?: number;
  statistical_validity?: boolean;
  confidence_score?: number;
  outlier_index?: number;
  outlier_tag?: string;
  outlier_contribution?: number;
}

export interface DashboardStats {
  total_reconciliations: number;
  consistent_percentage: number;
  total_tags: number;
}

export interface LiveValues {
  value1: number;
  value2: number;
}

export interface LoginCredentials {
  password: string;
  username: string;
}

export interface LoginResponse {
  token?: string;
}

export interface WorkspaceFlowData {
  nodes?: unknown[];
  edges?: unknown[];
  viewport?: {
    x: number;
    y: number;
    zoom: number;
  };
}

export interface Workspace {
  ID: number;
  CreatedAt?: string;
  UpdatedAt?: string;
  name: string;
  description: string;
  owner_id: number;
  data: WorkspaceFlowData;
}

export interface WorkspacePayload {
  id?: number;
  name: string;
  description: string;
  data: WorkspaceFlowData;
}
