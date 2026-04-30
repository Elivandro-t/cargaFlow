import React, { useState, useMemo, useRef, useEffect } from 'react';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { useForm } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import { z } from 'zod';
import { usersApi, authApi } from '../api/services';
import { useAuthStore } from '../store';
import {
  Users, Layers, Plus, Pencil, Trash2, X,
  ShieldCheck, UserCog, User, Search, Filter,
  MoreVertical, Eye, Lock, Unlock, Key,
  CheckCircle, XCircle, UserPlus, ChevronDown,
  Mail, Calendar, Building2, ArrowUpDown,
  UserCheck, Clock, MapPin, Power,
} from 'lucide-react';
import toast from 'react-hot-toast';
import clsx from 'clsx';
import type { User as UserType, UserRole } from '../typess';

type AdminTab = 'users' | 'groups' | 'filiais';

const ROLE_STYLE: Record<string, { light: string; dark: string }> = {
  ADMIN: { light: 'bg-purple-100 text-purple-700 border-purple-200', dark: 'dark:bg-purple-500/15 dark:text-purple-400 dark:border-purple-500/30' },
  SUPERVISOR: { light: 'bg-amber-100 text-amber-700 border-amber-200', dark: 'dark:bg-amber-500/15 dark:text-amber-400 dark:border-amber-500/30' },
  ATTENDANT: { light: 'bg-blue-100 text-blue-700 border-blue-200', dark: 'dark:bg-blue-500/15 dark:text-blue-400 dark:border-blue-500/30' },
};
const ROLE_LABELS: Record<string, string> = {
  ADMIN: 'Admin', SUPERVISOR: 'Supervisor', ATTENDANT: 'Atendente',
};
const ROLE_ICONS: Record<string, React.ReactNode> = {
  ADMIN: <ShieldCheck size={12} />,
  SUPERVISOR: <UserCog size={12} />,
  ATTENDANT: <User size={12} />,
};

// ── Schemas ───────────────────────────────────────────────────
const userSchema = z.object({
  name: z.string().min(2, 'Minimo 2 caracteres'),
  email: z.string().email('Email invalido'),
  password: z.string().min(8, 'Minimo 8 caracteres').optional().or(z.literal('')),
  role: z.enum(['ADMIN', 'SUPERVISOR', 'ATTENDANT']),
  groupId: z.string().optional(),
  isActive: z.boolean().optional(),
});

const groupSchema = z.object({
  name: z.string().min(2, 'Minimo 2 caracteres'),
  description: z.string().optional(),
});

const filialSchema = z.object({
  nome: z.string().min(2, 'Minimo 2 caracteres'),
  numeroFilial: z.coerce.number().min(1, 'Numero obrigatorio'),
  endereco: z.string().optional(),
  cidade: z.string().optional(),
  uf: z.string().optional(),
});

type UserForm = z.infer<typeof userSchema>;

// ── Filter types ─────────────────────────────────────────────
interface UserFilters {
  search: string;
  role: string;
  status: string;
  groupId: string;
}

export default function AdminPage() {
  const [tab, setTab] = useState<AdminTab>('users');
  const [showUserModal, setShowUserModal] = useState(false);
  const [editingUser, setEditingUser] = useState<UserType | null>(null);
  const [showFilters, setShowFilters] = useState(false);
  const [filters, setFilters] = useState<UserFilters>({ search: '', role: '', status: '', groupId: '' });
  const [sortField, setSortField] = useState<'name' | 'email' | 'role' | 'createdAt'>('name');
  const [sortDir, setSortDir] = useState<'asc' | 'desc'>('asc');
  const qc = useQueryClient();

  const { data: users, isLoading: usersLoading } = useQuery({ queryKey: ['users'], queryFn: usersApi.list });

  // ── User actions ──────────────────────────────────────────
  const deleteUser = useMutation({
    mutationFn: (id: string) => usersApi.delete(id),
    onSuccess: () => { toast.success('Usuario removido'); qc.invalidateQueries({ queryKey: ['users'] }); },
    onError: () => toast.error('Erro ao remover usuario'),
  });

  const activateUser = useMutation({
    mutationFn: (id: string) => usersApi.activate(id),
    onSuccess: () => { toast.success('Usuario ativado'); qc.invalidateQueries({ queryKey: ['users'] }); },
    onError: () => toast.error('Erro ao ativar usuario'),
  });

  const deactivateUser = useMutation({
    mutationFn: (id: string) => usersApi.deactivate(id),
    onSuccess: () => { toast.success('Usuario desativado'); qc.invalidateQueries({ queryKey: ['users'] }); },
    onError: () => toast.error('Erro ao desativar usuario'),
  });

  const blockUser = useMutation({
    mutationFn: (id: string) => usersApi.block(id),
    onSuccess: () => { toast.success('Usuario bloqueado'); qc.invalidateQueries({ queryKey: ['users'] }); },
    onError: () => toast.error('Erro ao bloquear usuario'),
  });

  const unblockUser = useMutation({
    mutationFn: (id: string) => usersApi.unblock(id),
    onSuccess: () => { toast.success('Usuario desbloqueado'); qc.invalidateQueries({ queryKey: ['users'] }); },
    onError: () => toast.error('Erro ao desbloquear usuario'),
  });

  const approveUser = useMutation({
    mutationFn: (id: string) => usersApi.approve(id),
    onSuccess: () => { toast.success('Usuario aprovado com sucesso'); qc.invalidateQueries({ queryKey: ['users'] }); },
    onError: () => toast.error('Erro ao aprovar usuario'),
  });

  // ── Filtering & Sorting ───────────────────────────────────
  const filteredUsers = useMemo(() => {
    if (!users) return [];
    let list = [...users] as any[];

    if (filters.search) {
      const s = filters.search.toLowerCase();
      list = list.filter((u: any) =>
        u.name?.toLowerCase().includes(s) || u.email?.toLowerCase().includes(s)
      );
    }
    if (filters.role) list = list.filter((u: any) => u.role === filters.role);
    if (filters.status === 'active') list = list.filter((u: any) => u.active !== false && u.isActive !== false && u.approved !== false);
    if (filters.status === 'inactive') list = list.filter((u: any) => u.active === false || u.isActive === false);
    if (filters.status === 'blocked') list = list.filter((u: any) => u.blocked === true);
    if (filters.status === 'pending') list = list.filter((u: any) => u.approved === false || u.status === 'PENDING');
    if (filters.groupId) list = list.filter((u: any) => u.groupId === filters.groupId);

    list.sort((a: any, b: any) => {
      const av = (a[sortField] ?? '').toString().toLowerCase();
      const bv = (b[sortField] ?? '').toString().toLowerCase();
      return sortDir === 'asc' ? av.localeCompare(bv) : bv.localeCompare(av);
    });

    return list;
  }, [users, filters, sortField, sortDir]);

  const handleSort = (field: typeof sortField) => {
    if (sortField === field) setSortDir(d => d === 'asc' ? 'desc' : 'asc');
    else { setSortField(field); setSortDir('asc'); }
  };

  const activeFiltersCount = [filters.role, filters.status, filters.groupId].filter(Boolean).length;

  return (
    <div className="p-4 lg:p-6 space-y-5">
      {/* Header */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3">
        <div>
          <h1 className="text-xl font-bold text-neutral-800 dark:text-neutral-100">Administracao</h1>
          <p className="mt-0.5 text-sm text-neutral-500 dark:text-neutral-400">Gerenciamento de usuarios, grupos e filiais</p>
        </div>
      </div>

      {/* Tabs */}
      <div className="flex gap-1 border-b border-neutral-200 dark:border-neutral-800 overflow-x-auto">
        {([
          ['users', 'Usuarios', <Users size={15} />, users?.length ?? 0]
        ] as [AdminTab, string, React.ReactNode, number][]).map(
          ([key, label, icon, count]) => (
            <button
              key={key}
              onClick={() => setTab(key)}
              className={clsx(
                'flex items-center gap-2 px-4 py-2.5 text-sm font-medium border-b-2 -mb-px transition-colors whitespace-nowrap',
                tab === key
                  ? 'border-blue-500 text-blue-600 dark:text-blue-400'
                  : 'border-transparent text-neutral-400 hover:text-neutral-700 dark:hover:text-neutral-300'
              )}
            >
              {icon}
              {label}
              <span className={clsx(
                'ml-1 text-[10px] font-bold rounded-full px-1.5 py-0.5',
                tab === key
                  ? 'bg-blue-100 text-blue-600 dark:bg-blue-500/20 dark:text-blue-400'
                  : 'bg-neutral-100 text-neutral-400 dark:bg-neutral-800 dark:text-neutral-500'
              )}>
                {count}
              </span>
            </button>
          )
        )}
      </div>

      {/* ── Users tab ──────────────────────────────────── */}
      {tab === 'users' && (
        <div className="space-y-4">
          {/* Toolbar */}
          <div className="flex flex-col sm:flex-row gap-3">
            {/* Search */}
            <div className="relative flex-1">
              <Search size={16} className="absolute left-3 top-1/2 -translate-y-1/2 text-neutral-400" />
              <input
                type="text"
                placeholder="Buscar por nome ou email..."
                value={filters.search}
                onChange={e => setFilters(f => ({ ...f, search: e.target.value }))}
                className="w-full rounded-xl border border-neutral-200 dark:border-neutral-700 bg-white dark:bg-neutral-800 pl-10 pr-4 py-2.5 text-sm text-neutral-800 dark:text-neutral-200 placeholder-neutral-400 focus:border-blue-500 focus:outline-none focus:ring-2 focus:ring-blue-100 dark:focus:ring-blue-500/20 transition"
              />
            </div>

            {/* Filter toggle */}
            <button
              onClick={() => setShowFilters(!showFilters)}
              className={clsx(
                'flex items-center gap-2 rounded-xl border px-4 py-2.5 text-sm font-medium transition-colors',
                showFilters || activeFiltersCount > 0
                  ? 'border-blue-300 dark:border-blue-500/40 bg-blue-50 dark:bg-blue-500/10 text-blue-600 dark:text-blue-400'
                  : 'border-neutral-200 dark:border-neutral-700 text-neutral-600 dark:text-neutral-400 hover:border-neutral-300 dark:hover:border-neutral-600'
              )}
            >
              <Filter size={15} />
              Filtros
              {activeFiltersCount > 0 && (
                <span className="ml-1 h-5 w-5 rounded-full bg-blue-500 text-white text-[10px] font-bold flex items-center justify-center">
                  {activeFiltersCount}
                </span>
              )}
            </button>

            {/* New user */}
            <button
              onClick={() => { setEditingUser(null); setShowUserModal(true); }}
              className="flex items-center gap-2 rounded-xl bg-blue-500 px-4 py-2.5 text-sm font-semibold text-white hover:bg-blue-600 transition-colors shadow-lg shadow-blue-500/20"
            >
              <UserPlus size={15} /> Novo usuario
            </button>
          </div>

          {/* Filters panel */}
          {showFilters && (
            <div className="flex flex-wrap gap-3 p-4 rounded-xl border border-neutral-200 dark:border-neutral-700 bg-neutral-50 dark:bg-neutral-800/50">
              <div className="space-y-1">
                <label className="text-[10px] font-bold uppercase tracking-wider text-neutral-400">Perfil</label>
                <select
                  value={filters.role}
                  onChange={e => setFilters(f => ({ ...f, role: e.target.value }))}
                  className={selectCls}
                >
                  <option value="">Todos</option>
                  <option value="ADMIN">Admin</option>
                  <option value="SUPERVISOR">Supervisor</option>
                  <option value="ATTENDANT">Atendente</option>
                </select>
              </div>
              <div className="space-y-1">
                <label className="text-[10px] font-bold uppercase tracking-wider text-neutral-400">Status</label>
                <select
                  value={filters.status}
                  onChange={e => setFilters(f => ({ ...f, status: e.target.value }))}
                  className={selectCls}
                >
                  <option value="">Todos</option>
                  <option value="active">Ativo</option>
                  <option value="inactive">Inativo</option>
                  <option value="blocked">Bloqueado</option>
                  <option value="pending">Pendente de Aprovacao</option>
                </select>
              </div>
              {activeFiltersCount > 0 && (
                <div className="flex items-end">
                  <button
                    onClick={() => setFilters({ search: filters.search, role: '', status: '', groupId: '' })}
                    className="text-xs text-red-500 hover:text-red-600 font-medium px-3 py-2"
                  >
                    Limpar filtros
                  </button>
                </div>
              )}
            </div>
          )}

          {/* Stats cards */}
          <div className="grid grid-cols-2 sm:grid-cols-5 gap-3">
            {[
              { label: 'Total', value: users?.length ?? 0, color: 'bg-blue-500', lightBg: 'bg-blue-50 dark:bg-blue-500/10' },
              { label: 'Ativos', value: users?.filter((u: any) => u.active !== false && u.isActive !== false && u.approved !== false).length ?? 0, color: 'bg-green-500', lightBg: 'bg-green-50 dark:bg-green-500/10' },
              { label: 'Pendentes', value: users?.filter((u: any) => u.approved === false || u.status === 'PENDING').length ?? 0, color: 'bg-amber-500', lightBg: 'bg-amber-50 dark:bg-amber-500/10' },
              { label: 'Inativos', value: users?.filter((u: any) => u.active === false || u.isActive === false).length ?? 0, color: 'bg-neutral-400', lightBg: 'bg-neutral-50 dark:bg-neutral-800' },
              { label: 'Bloqueados', value: users?.filter((u: any) => u.blocked === true).length ?? 0, color: 'bg-red-500', lightBg: 'bg-red-50 dark:bg-red-500/10' },
            ].map(s => (
              <div key={s.label} className={`${s.lightBg} rounded-xl p-3 border border-neutral-100 dark:border-neutral-800`}>
                <div className="flex items-center gap-2 mb-1">
                  <div className={`h-2 w-2 rounded-full ${s.color}`} />
                  <span className="text-[10px] font-bold uppercase tracking-wider text-neutral-400">{s.label}</span>
                </div>
                <p className="text-2xl font-black text-neutral-800 dark:text-neutral-100">{s.value}</p>
              </div>
            ))}
          </div>

          {/* Table */}
          <div className="overflow-hidden rounded-xl border border-neutral-200 dark:border-neutral-800 shadow-sm">
            <div className="overflow-x-auto">
              <table className="w-full text-sm">
                <thead className="border-b border-neutral-200 dark:border-neutral-800 bg-neutral-50 dark:bg-neutral-900">
                  <tr>
                    <SortableHeader label="Usuario" field="name" current={sortField} dir={sortDir} onSort={handleSort} />
                    <SortableHeader label="Email" field="email" current={sortField} dir={sortDir} onSort={handleSort} />
                    <SortableHeader label="Perfil" field="role" current={sortField} dir={sortDir} onSort={handleSort} />
                    <th className="px-4 py-3 text-left text-[10px] font-bold uppercase tracking-wider text-neutral-400">Grupo</th>
                    <th className="px-4 py-3 text-left text-[10px] font-bold uppercase tracking-wider text-neutral-400">Status</th>
                    <th className="px-4 py-3 text-right text-[10px] font-bold uppercase tracking-wider text-neutral-400">Acoes</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-neutral-100 dark:divide-neutral-800 bg-white dark:bg-neutral-950">
                  {usersLoading
                    ? Array.from({ length: 5 }).map((_, i) => <SkeletonRow key={i} cols={6} />)
                    : filteredUsers.length === 0
                      ? (
                        <tr>
                          <td colSpan={6} className="px-4 py-12 text-center">
                            <Users size={40} className="mx-auto mb-3 text-neutral-300 dark:text-neutral-600" />
                            <p className="text-sm text-neutral-400">Nenhum usuario encontrado</p>
                          </td>
                        </tr>
                      )
                      : filteredUsers.map((u: any) => (
                        <tr key={u.id} className="hover:bg-neutral-50 dark:hover:bg-neutral-900/60 transition-colors group">
                          <td className="px-4 py-3.5">
                            <div className="flex items-center gap-3">
                              <div className={clsx(
                                'flex h-9 w-9 items-center justify-center rounded-full text-xs font-bold shrink-0',
                                u.active !== false && u.isActive !== false
                                  ? 'bg-blue-100 text-blue-600 dark:bg-blue-500/15 dark:text-blue-400'
                                  : 'bg-neutral-100 text-neutral-400 dark:bg-neutral-800 dark:text-neutral-500'
                              )}>
                                {u.name?.charAt(0).toUpperCase()}
                              </div>
                              <div>
                                <span className="font-semibold text-neutral-800 dark:text-neutral-200">{u.name}</span>
                                <p className="text-[11px] text-neutral-400 sm:hidden">{u.email}</p>
                              </div>
                            </div>
                          </td>
                          <td className="px-4 py-3.5 text-neutral-500 dark:text-neutral-400 hidden sm:table-cell">{u.email}</td>
                          <td className="px-4 py-3.5">
                            <span className={clsx(
                              'inline-flex items-center gap-1 rounded-full border px-2.5 py-1 text-[11px] font-semibold',
                              ROLE_STYLE[u.role]?.light,
                              ROLE_STYLE[u.role]?.dark
                            )}>
                              {ROLE_ICONS[u.role]}{ROLE_LABELS[u.role] ?? u.role}
                            </span>
                          </td>
                          <td className="px-4 py-3.5">
                            <span className="text-xs text-neutral-500 dark:text-neutral-400">
                              {u.groupName ?? <span className="text-neutral-300 dark:text-neutral-600">—</span>}
                            </span>
                          </td>
                          <td className="px-4 py-3.5">
                            <UserStatusBadge user={u} />
                          </td>
                          <td className="px-4 py-3.5 text-right">
                            <UserRowMenu
                              user={u}
                              onEdit={() => { setEditingUser(u); setShowUserModal(true); }}
                              onActivate={() => activateUser.mutate(u.id)}
                              onDeactivate={() => deactivateUser.mutate(u.id)}
                              onBlock={() => blockUser.mutate(u.id)}
                              onUnblock={() => unblockUser.mutate(u.id)}
                              onApprove={() => approveUser.mutate(u.id)}
                              onDelete={() => { if (confirm('Remover usuario permanentemente?')) deleteUser.mutate(u.id); }}
                            />
                          </td>
                        </tr>
                      ))}
                </tbody>
              </table>
            </div>

            {/* Footer */}
            {!usersLoading && filteredUsers.length > 0 && (
              <div className="px-4 py-3 border-t border-neutral-100 dark:border-neutral-800 bg-neutral-50 dark:bg-neutral-900/50 flex items-center justify-between text-xs text-neutral-400">
                <span>Mostrando {filteredUsers.length} de {users?.length ?? 0} usuarios</span>
              </div>
            )}
          </div>
        </div>
      )}

      {/* ── Groups tab ─────────────────────────────────── */}


      {/* ── Modals ──────────────────────────────────────── */}
      {showUserModal && (
        <UserModal editingUser={editingUser}
          onClose={() => setShowUserModal(false)}
          onSaved={() => { qc.invalidateQueries({ queryKey: ['users'] }); setShowUserModal(false); }}
        />
      )}
     
    </div>
  );
}

// ── Sortable Header ─────────────────────────────────────────
function SortableHeader({ label, field, current, dir, onSort }: {
  label: string; field: string; current: string; dir: string; onSort: (f: any) => void;
}) {
  return (
    <th
      className="px-4 py-3 text-left text-[10px] font-bold uppercase tracking-wider text-neutral-400 cursor-pointer select-none hover:text-neutral-600 dark:hover:text-neutral-300 transition-colors"
      onClick={() => onSort(field)}
    >
      <div className="flex items-center gap-1">
        {label}
        <ArrowUpDown size={11} className={clsx(current === field ? 'text-blue-500' : 'opacity-30')} />
      </div>
    </th>
  );
}

// ── User Status Badge ───────────────────────────────────────
function UserStatusBadge({ user }: { user: any }) {
  const isBlocked = user.blocked === true;
  const isPending = user.approved === false || user.status === 'PENDING';
  const isActive = user.active !== false && user.isActive !== false;

  if (isBlocked) {
    return (
      <span className="inline-flex items-center gap-1 rounded-full bg-red-100 dark:bg-red-500/15 text-red-600 dark:text-red-400 border border-red-200 dark:border-red-500/30 px-2.5 py-1 text-[11px] font-semibold">
        <Lock size={10} /> Bloqueado
      </span>
    );
  }
  if (isPending) {
    return (
      <span className="inline-flex items-center gap-1 rounded-full bg-amber-100 dark:bg-amber-500/15 text-amber-600 dark:text-amber-400 border border-amber-200 dark:border-amber-500/30 px-2.5 py-1 text-[11px] font-semibold">
        <Clock size={10} /> Pendente
      </span>
    );
  }
  if (isActive) {
    return (
      <span className="inline-flex items-center gap-1 rounded-full bg-green-100 dark:bg-green-500/15 text-green-600 dark:text-green-400 border border-green-200 dark:border-green-500/30 px-2.5 py-1 text-[11px] font-semibold">
        <CheckCircle size={10} /> Ativo
      </span>
    );
  }
  return (
    <span className="inline-flex items-center gap-1 rounded-full bg-neutral-100 dark:bg-neutral-500/15 text-neutral-500 dark:text-neutral-400 border border-neutral-200 dark:border-neutral-500/30 px-2.5 py-1 text-[11px] font-semibold">
      <XCircle size={10} /> Inativo
    </span>
  );
}

// ── User Row Menu (3-dot submenu) ────────────────────────────
function UserRowMenu({ user, onEdit, onActivate, onDeactivate, onBlock, onUnblock, onApprove, onDelete }: {
  user: any;
  onEdit: () => void;
  onActivate: () => void;
  onDeactivate: () => void;
  onBlock: () => void;
  onUnblock: () => void;
  onApprove: () => void;
  onDelete: () => void;
}) {
  const [open, setOpen] = useState(false);
  const btnRef = useRef<HTMLButtonElement>(null);
  const menuRef = useRef<HTMLDivElement>(null);
  const [pos, setPos] = useState({ top: 0, left: 0, dropUp: false });

  useEffect(() => {
    if (!open) return;
    const handleClick = (e: MouseEvent) => {
      if (!menuRef.current?.contains(e.target as Node) && !btnRef.current?.contains(e.target as Node)) {
        setOpen(false);
      }
    };
    document.addEventListener('mousedown', handleClick);
    return () => document.removeEventListener('mousedown', handleClick);
  }, [open]);

  const handleOpen = () => {
    if (!btnRef.current) return;
    const rect = btnRef.current.getBoundingClientRect();
    const dropUp = rect.bottom + 280 > window.innerHeight;
    setPos({
      top: dropUp ? rect.top - 4 : rect.bottom + 4,
      left: rect.right - 220,
      dropUp,
    });
    setOpen(!open);
  };

  const isActive = user.active !== false && user.isActive !== false;
  const isBlocked = user.blocked === true;
  const isPending = user.approved === false || user.status === 'PENDING';

  const items: { icon: React.ReactNode; label: string; onClick: () => void; danger?: boolean; divider?: boolean; highlight?: boolean }[] = [
    ...(isPending
      ? [{ icon: <UserCheck size={14} />, label: 'Aprovar usuario', onClick: onApprove, highlight: true }]
      : []
    ),
    { icon: <Eye size={14} />, label: 'Visualizar', onClick: onEdit, divider: isPending },
    { icon: <Pencil size={14} />, label: 'Editar', onClick: onEdit },
    { icon: <Key size={14} />, label: 'Redefinir senha', onClick: () => { toast('Funcao em desenvolvimento'); } },
    ...(isActive
      ? [{ icon: <XCircle size={14} />, label: 'Desativar', onClick: onDeactivate, divider: true }]
      : [{ icon: <CheckCircle size={14} />, label: 'Ativar', onClick: onActivate, divider: true }]
    ),
    ...(isBlocked
      ? [{ icon: <Unlock size={14} />, label: 'Desbloquear', onClick: onUnblock }]
      : [{ icon: <Lock size={14} />, label: 'Bloquear', onClick: onBlock }]
    ),
    { icon: <Trash2 size={14} />, label: 'Remover', onClick: onDelete, danger: true, divider: true },
  ];

  return (
    <div className="relative inline-block">
      <button
        ref={btnRef}
        onClick={handleOpen}
        className={clsx(
          'rounded-lg p-2 transition-colors',
          open
            ? 'bg-neutral-100 dark:bg-neutral-800 text-neutral-700 dark:text-neutral-200'
            : 'text-neutral-400 hover:bg-neutral-100 dark:hover:bg-neutral-800 hover:text-neutral-600 dark:hover:text-neutral-300'
        )}
      >
        <MoreVertical size={16} />
      </button>

      {open && (
        <div
          ref={menuRef}
          className="fixed z-[9999] w-[220px] rounded-xl border border-neutral-200 dark:border-neutral-700 bg-white dark:bg-neutral-900 shadow-2xl overflow-hidden"
          style={{
            top: pos.dropUp ? undefined : pos.top,
            bottom: pos.dropUp ? window.innerHeight - pos.top : undefined,
            left: Math.max(8, pos.left),
          }}
        >
          <div className="py-1">
            {items.map((item, i) => (
              <React.Fragment key={i}>
                {item.divider && i > 0 && <div className="my-1 border-t border-neutral-100 dark:border-neutral-800" />}
                <button
                  onClick={() => { setOpen(false); item.onClick(); }}
                  className={clsx(
                    'flex w-full items-center gap-3 px-4 py-2.5 text-sm transition-colors',
                    item.danger
                      ? 'text-red-500 hover:bg-red-50 dark:hover:bg-red-500/10'
                      : item.highlight
                        ? 'text-green-600 dark:text-green-400 hover:bg-green-50 dark:hover:bg-green-500/10 font-semibold'
                        : 'text-neutral-700 dark:text-neutral-300 hover:bg-neutral-50 dark:hover:bg-neutral-800'
                  )}
                >
                  <span className={item.danger ? 'text-red-400' : item.highlight ? 'text-green-500' : 'text-neutral-400 dark:text-neutral-500'}>{item.icon}</span>
                  {item.label}
                </button>
              </React.Fragment>
            ))}
          </div>
        </div>
      )}
    </div>
  );
}

function SkeletonRow({ cols }: { cols: number }) {
  return (
    <tr className="animate-pulse">
      {Array.from({ length: cols }).map((_, i) => (
        <td key={i} className="px-4 py-3.5"><div className="h-4 rounded-lg bg-neutral-100 dark:bg-neutral-800" style={{ width: `${50 + i * 8}%` }} /></td>
      ))}
    </tr>
  );
}

// ── UserModal ─────────────────────────────────────────────────

function UserModal({ editingUser, onClose, onSaved }: {
  editingUser: any; onClose: () => void; onSaved: () => void;
}) {
  const [showPassword, setShowPassword] = useState(false);

  const { register, handleSubmit, watch, formState: { errors } } = useForm<UserForm>({
    resolver: zodResolver(userSchema),
    defaultValues: editingUser
      ? { name: editingUser.name, email: editingUser.email, role: editingUser.role, isActive: editingUser.active !== false }
      : { role: 'ATTENDANT', isActive: true },
  });

  const isActiveValue = watch('isActive');

  const mutation = useMutation({
    mutationFn: async (data: UserForm) => {
      if (editingUser) {
        return usersApi.update(editingUser.id, {
          name: data.name,
          email: data.email,
          role: data.role,
          groupId: data.groupId || undefined,
        });
      } else {
        const user = await authApi.register(data.name, data.email, data.password ?? '');
        if (data.role !== 'ATTENDANT' || data.groupId) {
          try {
            await usersApi.update(user.id ?? user.user?.id, {
              role: data.role,
              groupId: data.groupId || undefined,
            });
          } catch { /* ignore */ }
        }
        return user;
      }
    },
    onSuccess: () => { toast.success(editingUser ? 'Usuario atualizado' : 'Usuario criado com sucesso'); onSaved(); },
    onError: () => toast.error('Erro ao salvar usuario'),
  });

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/50 backdrop-blur-sm p-4" onClick={onClose}>
      <div
        className="w-full max-w-md rounded-2xl border border-neutral-200 dark:border-neutral-800 bg-white dark:bg-neutral-950 p-6 shadow-2xl"
        onClick={e => e.stopPropagation()}
      >
        <div className="mb-5 flex items-center justify-between">
          <div className="flex items-center gap-3">
            <div className="h-10 w-10 rounded-xl bg-blue-100 dark:bg-blue-500/15 flex items-center justify-center">
              {editingUser ? <Pencil size={18} className="text-blue-600 dark:text-blue-400" /> : <UserPlus size={18} className="text-blue-600 dark:text-blue-400" />}
            </div>
            <div>
              <h2 className="text-base font-bold text-neutral-800 dark:text-neutral-100">{editingUser ? 'Editar usuario' : 'Novo usuario'}</h2>
              <p className="text-[11px] text-neutral-400">{editingUser ? 'Altere as informacoes do usuario' : 'Preencha os dados para criar'}</p>
            </div>
          </div>
          <button onClick={onClose} className="text-neutral-400 hover:text-neutral-600 dark:hover:text-neutral-200 transition-colors p-1">
            <X size={18} />
          </button>
        </div>

        <form onSubmit={handleSubmit(d => mutation.mutate(d))} className="space-y-4">
          <Field label="Nome" error={errors.name?.message}>
            <input {...register('name')} className={inputCls} placeholder="Nome completo" />
          </Field>
          <Field label="Email" error={errors.email?.message}>
            <div className="relative">
              <Mail size={15} className="absolute left-3 top-1/2 -translate-y-1/2 text-neutral-400" />
              <input {...register('email')} type="email" className={`${inputCls} pl-10`} placeholder="email@empresa.com" />
            </div>
          </Field>
          {!editingUser && (
            <Field label="Senha" error={errors.password?.message}>
              <div className="relative">
                <input
                  {...register('password')}
                  type={showPassword ? 'text' : 'password'}
                  className={`${inputCls} pr-10`}
                  placeholder="Minimo 8 caracteres"
                />
                <button
                  type="button"
                  onClick={() => setShowPassword(!showPassword)}
                  className="absolute right-3 top-1/2 -translate-y-1/2 text-neutral-400 hover:text-neutral-600 dark:hover:text-neutral-300 transition-colors"
                  tabIndex={-1}
                >
                  {showPassword ? <EyeOff size={16} /> : <Eye size={16} />}
                </button>
              </div>
            </Field>
          )}
          <div className="grid grid-cols-2 gap-3">
            <Field label="Perfil" error={errors.role?.message}>
              <select {...register('role')} className={inputCls}>
                <option value="ATTENDANT">Atendente</option>
                <option value="SUPERVISOR">Supervisor</option>
                <option value="ADMIN">Admin</option>
              </select>
            </Field>
          </div>

          {/* Active toggle */}
          <div className="flex items-center justify-between p-3 rounded-xl border border-neutral-200 dark:border-neutral-700 bg-neutral-50 dark:bg-neutral-800/50">
            <div>
              <p className="text-sm font-medium text-neutral-700 dark:text-neutral-300">Usuario ativo</p>
              <p className="text-[11px] text-neutral-400">
                {isActiveValue ? 'O usuario podera acessar o sistema' : 'O usuario nao conseguira fazer login'}
              </p>
            </div>
            <label className="relative inline-flex cursor-pointer">
              <input type="checkbox" {...register('isActive')} className="sr-only peer" />
              <div className="w-11 h-6 bg-neutral-300 dark:bg-neutral-700 peer-focus:ring-2 peer-focus:ring-blue-300 dark:peer-focus:ring-blue-500/30 rounded-full peer peer-checked:bg-blue-500 transition-colors after:content-[''] after:absolute after:top-[2px] after:left-[2px] after:bg-white after:rounded-full after:h-5 after:w-5 after:transition-all peer-checked:after:translate-x-full" />
            </label>
          </div>

          <div className="flex justify-end gap-2 pt-2">
            <button
              type="button"
              onClick={onClose}
              className="rounded-xl border border-neutral-200 dark:border-neutral-700 px-4 py-2.5 text-sm font-medium text-neutral-600 dark:text-neutral-400 hover:bg-neutral-50 dark:hover:bg-neutral-800 transition-colors"
            >
              Cancelar
            </button>
            <button
              type="submit"
              disabled={mutation.isPending}
              className="rounded-xl bg-blue-500 px-5 py-2.5 text-sm font-semibold text-white hover:bg-blue-600 disabled:opacity-60 transition-colors shadow-lg shadow-blue-500/20"
            >
              {mutation.isPending ? 'Salvando...' : 'Salvar'}
            </button>
          </div>
        </form>
      </div>
    </div>
  );
}

const inputCls = 'w-full rounded-xl border border-neutral-200 dark:border-neutral-700 bg-white dark:bg-neutral-800 px-3 py-2.5 text-sm text-neutral-800 dark:text-neutral-200 placeholder-neutral-400 focus:border-blue-500 focus:outline-none focus:ring-2 focus:ring-blue-100 dark:focus:ring-blue-500/20 transition';

const selectCls = 'rounded-xl border border-neutral-200 dark:border-neutral-700 bg-white dark:bg-neutral-800 px-3 py-2 text-sm text-neutral-800 dark:text-neutral-200 focus:border-blue-500 focus:outline-none focus:ring-2 focus:ring-blue-100 dark:focus:ring-blue-500/20 transition min-w-[140px]';

function Field({ label, error, children }: { label: string; error?: string; children: React.ReactNode }) {
  return (
    <div>
      <label className="mb-1.5 block text-[11px] font-bold uppercase tracking-wider text-neutral-400">{label}</label>
      {children}
      {error && <p className="mt-1 text-xs text-red-500">{error}</p>}
    </div>
  );
}
function EyeOff(props: any) {
  return (
    <svg xmlns="http://www.w3.org/2000/svg" width={props.size ?? 24} height={props.size ?? 24} viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
      <path d="M9.88 9.88a3 3 0 1 0 4.24 4.24" />
      <path d="M10.73 5.08A10.43 10.43 0 0 1 12 5c7 0 10 7 10 7a13.16 13.16 0 0 1-1.67 2.68" />
      <path d="M6.61 6.61A13.526 13.526 0 0 0 2 12s3 7 10 7a9.74 9.74 0 0 0 5.39-1.61" />
      <line x1="2" x2="22" y1="2" y2="22" />
    </svg>
  );
}
