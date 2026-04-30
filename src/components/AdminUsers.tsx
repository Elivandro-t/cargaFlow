// import { 
//   Search, 
//   Filter, 
//   Plus, 
//   MoreVertical, 
//   Users, 
//   CheckCircle2, 
//   User 
// } from 'lucide-react';

// const USERS_DATA = [
//   { id: 1, name: 'Admin', email: 'admin@helpdesk.com', profile: 'Admin', status: 'Ativo' },
//   { id: 2, name: 'Elivandro', email: 'elivandro88@gmail.com', profile: 'Admin', status: 'Ativo' },
// ];

// export function AdminUsers() {
//   return (
//     <div className="space-y-6">
//       {/* Header */}
//       <div>
//         <h1 className="text-2xl font-bold text-gray-900 dark:text-white">Administração</h1>
//         <p className="text-gray-500 dark:text-slate-400">Gerenciamento de usuários</p>
//       </div>

//       {/* Tabs */}
//       <div className="border-b border-gray-200 dark:border-slate-800">
//         <div className="flex gap-6">
//           <button className="flex items-center gap-2 pb-3 border-b-2 border-blue-600 text-blue-600 font-medium">
//             <Users size={18} /> Usuários <span className="bg-blue-100 text-blue-600 text-xs px-2 py-0.5 rounded-full">2</span>
//           </button>
//         </div>
//       </div>

//       {/* Controls */}
//       <div className="flex items-center justify-between gap-4">
//         <div className="relative flex-1 max-w-md">
//           <Search className="absolute left-3 top-1/2 -translate-y-1/2 text-gray-400" size={18} />
//           <input 
//             type="text" 
//             placeholder="Buscar por nome ou email..." 
//             className="w-full pl-10 pr-4 py-2 border border-gray-200 dark:border-slate-800 rounded-lg bg-white dark:bg-slate-900 focus:ring-2 focus:ring-blue-500 outline-none"
//           />
//         </div>
//         <div className="flex gap-2">
//           <button className="flex items-center gap-2 px-4 py-2 border border-gray-200 dark:border-slate-800 rounded-lg hover:bg-gray-50 dark:hover:bg-slate-800 transition-colors">
//             <Filter size={18} /> Filtros
//           </button>
//           <button className="flex items-center gap-2 px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 transition-colors">
//             <Plus size={18} /> Novo usuário
//           </button>
//         </div>
//       </div>

//       {/* Stats Cards */}
//       <div className="grid grid-cols-5 gap-4">
//         {[
//           { label: 'Total', value: 2, color: 'text-gray-900' },
//           { label: 'Ativos', value: 2, color: 'text-green-600' },
//           { label: 'Pendentes', value: 0, color: 'text-yellow-600' },
//           { label: 'Inativos', value: 0, color: 'text-gray-600' },
//           { label: 'Bloqueados', value: 0, color: 'text-red-600' },
//         ].map((stat) => (
//           <div key={stat.label} className="p-4 bg-white dark:bg-slate-900 border border-gray-200 dark:border-slate-800 rounded-xl">
//             <p className="text-xs font-semibold text-gray-500 uppercase tracking-wider">{stat.label}</p>
//             <p className={`text-2xl font-bold mt-1 ${stat.color}`}>{stat.value}</p>
//           </div>
//         ))}
//       </div>

//       {/* Table */}
//       <div className="bg-white dark:bg-slate-900 border border-gray-200 dark:border-slate-800 rounded-xl overflow-hidden">
//         <table className="w-full text-left text-sm">
//           <thead className="bg-gray-50 dark:bg-slate-800/50 text-gray-500 uppercase">
//             <tr>
//               <th className="px-6 py-4 font-semibold">Usuário</th>
//               <th className="px-6 py-4 font-semibold">Email</th>
//               <th className="px-6 py-4 font-semibold">Perfil</th>
//               <th className="px-6 py-4 font-semibold">Status</th>
//               <th className="px-6 py-4 font-semibold text-right">Ações</th>
//             </tr>
//           </thead>
//           <tbody className="divide-y divide-gray-100 dark:divide-slate-800">
//             {USERS_DATA.map((user) => (
//               <tr key={user.id} className="hover:bg-gray-50 dark:hover:bg-slate-800/50 transition-colors">
//                 <td className="px-6 py-4 flex items-center gap-3">
//                   <div className="w-8 h-8 rounded-full bg-blue-100 dark:bg-blue-900 text-blue-600 dark:text-blue-200 flex items-center justify-center font-bold">
//                     {user.name.charAt(0)}
//                   </div>
//                   <span className="font-medium text-gray-900 dark:text-white">{user.name}</span>
//                 </td>
//                 <td className="px-6 py-4 text-gray-600 dark:text-slate-400">{user.email}</td>
//                 <td className="px-6 py-4">
//                   <span className="px-2.5 py-1 bg-purple-100 dark:bg-purple-900/30 text-purple-700 dark:text-purple-300 rounded-full text-xs font-medium">
//                     {user.profile}
//                   </span>
//                 </td>
//                 <td className="px-6 py-4">
//                   <span className="inline-flex items-center gap-1.5 px-2.5 py-1 bg-green-100 dark:bg-green-900/30 text-green-700 dark:text-green-300 rounded-full text-xs font-medium">
//                     <CheckCircle2 size={12} /> {user.status}
//                   </span>
//                 </td>
//                 <td className="px-6 py-4 text-right">
//                   <button className="text-gray-400 hover:text-gray-600 dark:hover:text-slate-200">
//                     <MoreVertical size={18} />
//                   </button>
//                 </td>
//               </tr>
//             ))}
//           </tbody>
//         </table>
        
//         {/* Footer */}
//         <div className="px-6 py-4 border-t border-gray-100 dark:border-slate-800 text-sm text-gray-500">
//           Mostrando 2 de 2 usuários
//         </div>
//       </div>
//     </div>
//   );
// }



import React, { useState } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import { useQuery } from '@tanstack/react-query';
import { ArrowLeft, Mail, Shield, Users, Calendar, MessageSquare, Send } from 'lucide-react';
import { usersApi, ticketApi } from '../api/services';
import { format } from 'date-fns';
import { ptBR } from 'date-fns/locale';
import clsx from 'clsx';

const ROLE_LABELS: Record<string, string> = {
  ADMIN: 'Administrador',
  SUPERVISOR: 'Supervisor',
  ATTENDANT: 'Atendente',
};

export default function UserInfoPage() {
  const { id } = useParams<{ id: string }>();
  const navigate = useNavigate();
  const [chatMessage, setChatMessage] = useState('');
  const [chatMessages, setChatMessages] = useState<{ content: string; fromMe: boolean; time: string }[]>([]);

  const { data: user, isLoading } = useQuery({
    queryKey: ['user-info', id],
    queryFn: () => usersApi.getById(id!),
    enabled: !!id,
  });
  if (isLoading) {
    return (
      <div className="flex items-center justify-center h-full">
        <div className="h-10 w-10 animate-spin rounded-full border-4 border-blue-500 border-t-transparent" />
      </div>
    );
  }

  if (!user) {
    return (
      <div className="flex flex-col items-center justify-center h-full gap-4">
        <p className="text-slate-500">Usuário não encontrado.</p>
        <button onClick={() => navigate(-1)} className="text-blue-500 hover:underline text-sm">Voltar</button>
      </div>
    );
  }

  return (
    <div className="flex flex-col h-full overflow-hidden bg-slate-50 dark:bg-neutral-950 p-3 md:p-6">
      {/* Header */}
      <div className="flex items-center gap-3 mb-6 shrink-0">
        <button onClick={() => navigate(-1)} className="p-2 rounded-lg hover:bg-slate-200 dark:hover:bg-neutral-800 transition-colors">
          <ArrowLeft size={20} className="text-slate-600 dark:text-neutral-400" />
        </button>
        <h1 className="text-lg font-bold text-slate-900 dark:text-white">Informações do Usuário</h1>
      </div>

      <div className="flex-1 overflow-y-auto">
        <div className="grid grid-cols-1 lg:grid-cols-3 gap-4 md:gap-6">

          {/* Info Card */}
          <div className="lg:col-span-1 space-y-4">
            <div className="bg-white dark:bg-neutral-900 rounded-xl border border-slate-200 dark:border-neutral-800 p-6 shadow-sm">
              <div className="flex flex-col items-center text-center mb-6">
                <div className="h-20 w-20 rounded-full bg-blue-500 flex items-center justify-center text-2xl font-black text-white mb-3 shadow-lg shadow-blue-500/20">
                  {user.name?.slice(0, 2).toUpperCase()}
                </div>
                <h2 className="text-lg font-bold text-slate-900 dark:text-white">{user.name}</h2>
                <span className={clsx(
                  'mt-1 px-3 py-0.5 rounded-full text-[10px] font-bold uppercase tracking-wider',
                  user.role === 'ADMIN' ? 'bg-purple-100 text-purple-700 dark:bg-purple-500/15 dark:text-purple-400'
                    : user.role === 'SUPERVISOR' ? 'bg-amber-100 text-amber-700 dark:bg-amber-500/15 dark:text-amber-400'
                    : 'bg-blue-100 text-blue-700 dark:bg-blue-500/15 dark:text-blue-400'
                )}>
                  {ROLE_LABELS[user.role] || user.role}
                </span>
              </div>

              <div className="space-y-3">
                <InfoRow icon={<Mail size={16} />} label="Email" value={user.email} />
                <InfoRow icon={<Shield size={16} />} label="Status" value={user.isActive ? 'Ativo' : 'Inativo'} />
                <InfoRow icon={<Users size={16} />} label="Grupo" value={user.groupName || 'Sem grupo'} />
                <InfoRow icon={<Calendar size={16} />} label="Último login" value={user.lastLoginAt ? format(new Date(user.lastLoginAt), "dd/MM/yyyy 'às' HH:mm", { locale: ptBR }) : 'Nunca'} />
                <InfoRow icon={<Calendar size={16} />} label="Criado em" value={format(new Date(user.createdAt), "dd/MM/yyyy", { locale: ptBR })} />
              </div>
            </div>

            {/* Tickets do usuário */}
          </div>

          {/* Chat / Conversa */}
          <div className="lg:col-span-2">
            <div className="bg-white dark:bg-neutral-900 rounded-xl border border-slate-200 dark:border-neutral-800 shadow-sm flex flex-col h-[500px] lg:h-full">
              <div className="flex items-center gap-2 p-4 border-b border-slate-100 dark:border-neutral-800 shrink-0">
                <MessageSquare size={18} className="text-blue-500" />
                <h3 className="text-sm font-bold text-slate-900 dark:text-white">Conversa com {user.name}</h3>
              </div>

              <div className="flex-1 overflow-y-auto p-4 space-y-3">
                {chatMessages.length === 0 ? (
                  <div className="flex flex-col items-center justify-center h-full text-center">
                    <MessageSquare size={40} className="text-slate-200 dark:text-neutral-700 mb-3" />
                    <p className="text-sm text-slate-400 dark:text-neutral-500">Nenhuma mensagem ainda.</p>
                    <p className="text-xs text-slate-300 dark:text-neutral-600 mt-1">Envie uma mensagem para iniciar a conversa.</p>
                  </div>
                ) : (
                  chatMessages.map((msg, i) => (
                    <div key={i} className={clsx('flex', msg.fromMe ? 'justify-end' : 'justify-start')}>
                      <div className={clsx(
                        'max-w-[75%] px-3 py-2 rounded-xl text-sm',
                        msg.fromMe
                          ? 'bg-blue-500 text-white rounded-br-sm'
                          : 'bg-slate-100 dark:bg-neutral-800 text-slate-800 dark:text-neutral-200 rounded-bl-sm'
                      )}>
                        <p>{msg.content}</p>
                        <p className={clsx('text-[10px] mt-1', msg.fromMe ? 'text-blue-200' : 'text-slate-400 dark:text-neutral-500')}>{msg.time}</p>
                      </div>
                    </div>
                  ))
                )}
              </div>

            </div>
          </div>
        </div>
      </div>
    </div>
  );
}

function InfoRow({ icon, label, value }: { icon: React.ReactNode; label: string; value: string }) {
  return (
    <div className="flex items-center gap-3 py-2 border-b border-slate-50 dark:border-neutral-800 last:border-0">
      <span className="text-slate-400 dark:text-neutral-500 shrink-0">{icon}</span>
      <div className="min-w-0">
        <p className="text-[10px] text-slate-400 dark:text-neutral-500 uppercase tracking-wider font-medium">{label}</p>
        <p className="text-sm text-slate-800 dark:text-neutral-200 font-medium truncate">{value}</p>
      </div>
    </div>
  );
}
