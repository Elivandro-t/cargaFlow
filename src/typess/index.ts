// ── Enums ─────────────────────────────────────────────────────

export type TicketStatus   = 'OPEN' | 'IN_PROGRESS' | 'ESCALATED' | 'RESOLVED' | 'CLOSED';
export type TicketPriority = 'LOW' | 'NORMAL' | 'HIGH' | 'URGENT';
export type TicketType     = 'INCIDENT' | 'REQUEST' | 'PROBLEM' | 'CHANGE' | 'RETURN';
export type UserRole       = 'ADMIN' | 'SUPERVISOR' | 'ATTENDANT';
export type LocalizationType = 'IN_ROUTE' | 'IN_RETURN';
export type CftvAnalysis   = 'NONE' | 'FULL_RETURN' | 'PARTIAL_RETURN' | 'EXCHANGE_RETURN' | 'CHARGE_DRIVER';
export type FinalDecision  = 'CLIENT_WILL_RECEIVE' | 'RETURN_BY_SURPLUS' | 'DRIVER_CANCELLED_PROTOCOL' | 'RETURN_AUTHORIZED_CFTV';

// ── User ──────────────────────────────────────────────────────

export interface UserSummary {
  id: string;
  name: string;
  email: string;
  avatarUrl?: string;
}

export interface User extends UserSummary {
  role: UserRole;
  groupId?: string;
  groupName?: string;
  isActive: boolean;
  lastLoginAt?: string;
  createdAt: string;
}

export interface AuthResponse {
  accessToken: string;
  refreshToken: string;
  expiresIn: number;
  user: User;
}

// ── Subtask / Item ───────────────────────────────────────────

export interface SubtaskItem {
  id: string;
  ticketId?: string | null;
  title: string;
  description?: string;
  status: string;
  createdBy: UserSummary;
  assignedTo?: UserSummary | null;
  assignedToGroup?: { id: string; name: string } | null;
  filial?: { id: string; numeroFilial: number; nome: string } | null;
  cliente?: string;
  foneCliente?: string;
  cidade?: string;
  coordenadorVendas?: string | null;
  rca?: string;
  nfPedido?: string;
  faturamento?: string;
  valorTotal?: number | null;
  valorOcorrencia?: number | null;
  motivoDevolucao?: string;
  reclamante?: string | null;
  conferente?: string | null;
  doca?: string | null;
  entregaAuditada?: boolean | null;
  resolucao?: string | null;
  agregado?: boolean | null;
  slaBreached: boolean;
  slaDeadline?: string | null;
  resolvedAt?: string | null;
  closedAt?: string | null;
  createdAt: string;
  updatedAt: string;
}

export interface SubtaskSummary {
  total: number;
  pending: number;
  open: number;
  inProgress: number;
  done: number;
  items: SubtaskItem[];
}

// ── Ticket ────────────────────────────────────────────────────

export interface TicketListItem {
  id: string;
  ticketNumber: number;
  title: string;
  status: TicketStatus;
  priority: TicketPriority;
  type: TicketType;
  createdBy?: UserSummary;
  assignedTo?: UserSummary;
  group?: { id: string; name: string };
  filial?: { id: string; numeroFilial: number; nome: string };
  slaDeadline?: string;
  slaBreached: boolean;
  subtasks?: SubtaskSummary[];
  createdAt: string;
}

export interface TicketResponse {
  id: string;
  ticketNumber: number;
  type: TicketType;
  title: string;
  description?: string;
  status: TicketStatus;
  priority: TicketPriority;
  createdBy: UserSummary;
  assignedTo?: UserSummary;
  group?: { id: string; name: string };

  // Logistics

  // Customer
  cliente?: string;
  foneCliente?: string;
  cidade?: string;
  coordenadorVendas?: string;
  rca?: string;
  nfPedido?: string;
  valorTotal?: number;
  valorOcorrencia?: number;
  faturamento?: string;

  // Audit
  conferente?: string;
  doca?: string;
  entregaAuditada?: boolean;

  // Driver
  placa?: string;
  motorista?: string;
  foneMotorista?: string;
  agregado?: boolean;

  // Analysis
  analiseCftv?: CftvAnalysis;
  decisaoFinal?: FinalDecision;

  slaDeadline?: string;
  slaBreached: boolean;
  resolvedAt?: string;
  createdAt: string;
  updatedAt: string;

  comments: Comment[];
  attachments: Attachment[];
  subtasks?: SubtaskSummary[];
}

export interface OcorrenciaDto {
  title: string;
  description?: string;
  reclamante?: string;
  motivoDevolucao?: string;
  cliente?: string;
  foneCliente?: string;
  cidade?: string;
  coordenadorVendas?: string;
  rca?: string;
  nfPedido?: string;
  valorTotal?: number;
  valorOcorrencia?: number;
  faturamento?: string;
  conferente?: string;
  doca?: string;
  entregaAuditada?: boolean;
  agregado?: boolean;
  assingnedTo?: string;
  assignedToGroupId?: string;
  images?: File[];
}

export interface CreateTicketDto {
  type: TicketType;
  title: string;
  description?: string;
  priority: TicketPriority;
  createdBy?: string;
  assignedToId?: string;
  groupId?: string;
  filialCd?: string;
  localizacao?: LocalizationType;
  reclamante?: string;
  motivoDevolucao?: string;
  conhecimento?: string;
  cliente?: string;
  foneCliente?: string;
  cidade?: string;
  coordenadorVendas?: string;
  rca?: string;
  nfPedido?: string;
  valorTotal?: number;
  valorOcorrencia?: number;
  faturamento?: string;
  conferente?: string;
  doca?: string;
  entregaAuditada?: boolean;
  placa?: string;
  motorista?: string;
  foneMotorista?: string;
  agregado?: boolean;
  analiseCftv?: CftvAnalysis;
  decisaoFinal?: FinalDecision;
  ocorrencias?: OcorrenciaDto[];
}

export type UpdateTicketDto = Partial<CreateTicketDto & { status: TicketStatus }>;

export interface EscalateTicketDto {
  assignedToId?: string;
  groupId?: string;
  reason: string;
}

export interface TicketFilterDto {
  status?: TicketStatus;
  priority?: TicketPriority;
  type?: TicketType;
  assignedToId?: string;
  groupId?: string;
  search?: string;
  slaBreached?: boolean;
  createdFrom?: string;
  createdTo?: string;
  // Campos extras de busca
  conhecimento?: string;
  nfPedido?: string;
  cliente?: string;
  cidade?: string;
  motorista?: string;
  placa?: string;
  filialCd?: string;
  conferente?: string;
  coordenadorVendas?: string;
  rca?: string;
  reclamante?: string;
  analiseCftv?: CftvAnalysis;
  decisaoFinal?: FinalDecision;
}

// ── Comment / Attachment ──────────────────────────────────────

export interface Comment {
  id: string;
  content: string;
  isInternal: boolean;
  author: UserSummary;
  createdAt: string;
}

export type CommentResponseDto = Comment;

export interface CreateCommentDto {
  content: string;
  isInternal: boolean;
}

export interface Attachment {
  id: string;
  filename: string;
  url: string;
  sizeBytes?: number;
  createdAt: string;
}

export type AttachmentResponseDto = Attachment;

// ── History ───────────────────────────────────────────────────

export interface TicketHistory {
  id: string;
  fieldName: string;
  oldValue?: string;
  newValue?: string;
  changedBy: UserSummary;
  changedAt: string;
}

// ── Chat ──────────────────────────────────────────────────────

export interface ChatMessage {
  id: string;
  ticketId: string;
  content: string;
  mentions: string[];
  author: UserSummary;
  attachmentUrl?: string;
  createdAt: string;
}

// ── Dashboard ─────────────────────────────────────────────────

export interface DashboardSummary {
  totalOpen: number;
  totalInProgress: number;
  totalEscalated: number;
  totalResolved: number;
  totalClosed: number;
  totalSlaBreached: number;
  byPriority: Record<string, number>;
  byType: Record<string, number>;
  avgResolutionHours: number;
}

export interface UserProductivity {
  userId: string;
  userName: string;
  avatarUrl?: string;
  ticketsResolved: number;
  ticketsOpen: number;
  avgResolutionHours: number;
  slaComplianceRate: number;
}

// ── Pagination ────────────────────────────────────────────────

export interface PageResponse<T> {
  content: T[];
  totalElements: number;
  totalPages: number;
  number: number;
  size: number;
  first: boolean;
  last: boolean;
}
