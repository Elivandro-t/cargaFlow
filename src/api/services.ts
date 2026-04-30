import api from '../api/client';
import type {
  CreateTicketDto, UpdateTicketDto, EscalateTicketDto,
  CommentResponseDto, CreateCommentDto, AttachmentResponseDto,
  TicketHistory, PageResponse,
} from '../typess';

// ── Dashboard API ─────────────────────────────────────────────
const version = "/api/v1"
export const dashboardApi = {
  getSummary:      () => api.get(version+'/dashboard/summary').then(r => r.data),
  getSlaMetrics:   (days = 30) => api.get(version+'/dashboard/sla', { params: { days } }).then(r => r.data),
  getProductivity: (days = 30) => api.get(version+'/dashboard/productivity', { params: { days } }).then(r => r.data),
  getTicketsByDay: (from: string, to: string) =>
    api.get(version+'/dashboard/tickets-by-day', { params: { from, to } }).then(r => r.data),
  getActiveAgents: () => api.get(version+'/dashboard/active-agents').then(r => r.data),
};

// ── Auth API ──────────────────────────────────────────────────

export const authApi = {
  login:   (email: string, password: string) =>
    api.post(version+'/auth/login', { email, password }).then(r => r.data),
  register: (name: string, email: string, password: string) =>
    api.post(version+'/auth/register', { name, email, password }).then(r => r.data),
  refresh: (refreshToken: string) =>
    api.post(version+'/auth/refresh', { refreshToken }).then(r => r.data),
  logout:  () => api.post(version+'/auth/logout'),
};

// ── Users API ─────────────────────────────────────────────────

export const usersApi = {
  list:       () => api.get(version+'/users').then(r => r.data),
  getById:    (id: string) => api.get(version+`/users/${id}`).then(r => r.data),
  create:     (dto: unknown) => api.post(version+'/users', dto).then(r => r.data),
  update:     (id: string, dto: unknown) => api.put(version+`/users/${id}`, dto).then(r => r.data),
  delete:     (id: string) => api.delete(version+`/users/${id}`),
  activate:   (id: string) => api.patch(version+`/users/${id}/activate`).then(r => r.data),
  deactivate: (id: string) => api.patch(version+`/users/${id}/deactivate`).then(r => r.data),
  block:      (id: string) => api.patch(version+`/users/${id}/block`).then(r => r.data),
  unblock:    (id: string) => api.patch(version+`/users/${id}/unblock`).then(r => r.data),
  resetPassword: (id: string, newPassword: string) =>
    api.patch(version+`/users/${id}/reset-password`, { newPassword }).then(r => r.data),
  changePassword: (id: string, dto: { currentPassword: string; newPassword: string }) =>
    api.patch(version+`/users/${id}/change-password`, dto).then(r => r.data),
  uploadAvatar: (id: string, file: File) => {
    const form = new FormData();
    form.append('file', file);
    return api.patch<any>(`/users/${id}/avatar`, form, {
      headers: { 'Content-Type': 'multipart/form-data' },
    }).then(r => r.data);
  },
  removeAvatar: (id: string) =>
    api.delete(version+`/users/${id}/avatar`).then(r => r.data),
  approve: (id: string) =>
    api.patch(version+`/users/${id}/approve`).then(r => r.data),
};

// ── Groups API ────────────────────────────────────────────────


// ── Filiais API ───────────────────────────────────────────────
export const ConhecimentoApi = {
  list: (filial: any, placa?: any) => {
    const params = new URLSearchParams();

    if (placa) {
      params.append('placa', placa);
    }
    console.log('Listando conhecimentos para filial', filial, 'com placa', placa);

    const query = params.toString();

    const url = `/relatorios/conhecimentos/todos?filial=${encodeURIComponent(filial || '')}${
      query ? `&${query}` : ''
    }`;

    return api.get(url).then(r => r.data);
  }
};
