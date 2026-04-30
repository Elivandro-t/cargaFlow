import { create } from 'zustand';
import { persist } from 'zustand/middleware';
import type { User, AuthResponse } from './typess';
import { authApi } from './api/services';

// ── Auth store ───────────────────────────────────────────────

interface AuthState {
  user: User | null;
  accessToken: string | null;
  refreshToken: string | null;
  isAuthenticated: boolean;
  isLoading: boolean;

  login:  (email: string, password: string) => Promise<void>;
  logout: () => Promise<void>;
  setAuth:(data: AuthResponse) => void;
}


// ── Notification store ────────────────────────────────────────

export type NotificationType = 'system' | 'chat_message' | 'mention';

interface Notification {
  id: string;
  title: string;
  body: string;
  isRead: boolean;
  ticketId?: string;
  createdAt: string;
  type?: NotificationType;
  /** Quem enviou (para mensagens de chat) */
  senderName?: string;
  senderId?: string;
}

interface NotificationState {
  notifications: Notification[];
  unreadCount: number;
  /** Contagem de mensagens de chat não lidas */
  unreadChatCount: number;
  addNotification: (n: Notification) => void;
  addChatNotification: (ticketId: string, senderName: string, senderId: string, content: string) => void;
  markAsRead: (id: string) => void;
  markAllAsRead: () => void;
}

export const useAuthStore = create<AuthState>()(
  persist(
    (set, get) => ({
      user: null,
      accessToken: null,
      refreshToken: null,
      isAuthenticated: false,
      isLoading: false,

      setAuth: (data: AuthResponse) => {
        localStorage.setItem('access_token', data.accessToken);
        localStorage.setItem('refresh_token', data.refreshToken);
        set({
          user: data.user,
          accessToken: data.accessToken,
          refreshToken: data.refreshToken,
          isAuthenticated: true,
        });
      },

      login: async (email, password) => {
        set({ isLoading: true });
        console.log('Tentando login com', email)
        try {
          const data: AuthResponse = await authApi.login(email, password);
          get().setAuth(data);
          console.log('Login bem-sucedido:', data);
        } finally {
          set({ isLoading: false });
        }
      },

      logout: async () => {
        try { await authApi.logout(); } catch { /* ignore */ }
        // Remove apenas dados sensíveis — mantém navegação e histórico
        localStorage.removeItem('access_token');
        localStorage.removeItem('refresh_token');
        set({ user: null, accessToken: null, refreshToken: null, isAuthenticated: false });
      },
    }),
    {
      name: 'helpdesk-auth',
      partialize: (state) => ({
        user: state.user,
        accessToken: state.accessToken,
        refreshToken: state.refreshToken,
        isAuthenticated: state.isAuthenticated,
      }),
    }
  )
);


export const useNotificationStore = create<NotificationState>((set, get) => ({
  notifications: [],
  unreadCount: 0,
  unreadChatCount: 0,

  addNotification: (n) =>
    set((s) => ({
      notifications: [n, ...s.notifications].slice(0, 50),
      unreadCount: s.unreadCount + (n.isRead ? 0 : 1),
    })),

  addChatNotification: (ticketId, senderName, senderId, content) => {
    const n: Notification = {
      id: `chat-${Date.now()}-${Math.random().toString(36).slice(2, 6)}`,
      title: `Nova mensagem de ${senderName}`,
      body: content.length > 80 ? content.slice(0, 80) + '…' : content,
      isRead: false,
      ticketId,
      createdAt: new Date().toISOString(),
      type: 'chat_message',
      senderName,
      senderId,
    };
    set((s) => ({
      notifications: [n, ...s.notifications].slice(0, 50),
      unreadCount: s.unreadCount + 1,
      unreadChatCount: s.unreadChatCount + 1,
    }));
  },

  markAsRead: (id) =>
    set((s) => {
      const notification = s.notifications.find(n => n.id === id);
      if (!notification || notification.isRead) return s;
      const isChatMsg = notification.type === 'chat_message';
      return {
        notifications: s.notifications.map((n) =>
          n.id === id ? { ...n, isRead: true } : n
        ),
        unreadCount: Math.max(0, s.unreadCount - 1),
        unreadChatCount: isChatMsg ? Math.max(0, s.unreadChatCount - 1) : s.unreadChatCount,
      };
    }),

  markAllAsRead: () =>
    set((s) => ({
      notifications: s.notifications.map((n) => ({ ...n, isRead: true })),
      unreadCount: 0,
      unreadChatCount: 0,
    })),
}));
