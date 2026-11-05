import { create } from 'zustand';
import { UserProfile } from '@smart-parcel-box/shared';
import { api } from '../services/api';

interface AuthState {
  token: string | null;
  user: UserProfile | null;
  isAuthenticated: boolean;
  isLoading: boolean;
  login: (email: string, pass: string) => Promise<{ success: boolean; error?: string }>;
  logout: () => void;
  loadUser: () => Promise<void>;
}

export const useAuthStore = create<AuthState>((set, get) => ({
  token: localStorage.getItem('spb_auth_token'),
  user: null,
  isAuthenticated: !!localStorage.getItem('spb_auth_token'),
  isLoading: false,

  login: async (email, password) => {
    set({ isLoading: true });
    try {
      const res = await api.login(email, password);
      if (res.success && res.data) {
        localStorage.setItem('spb_auth_token', res.data.token);
        set({
          token: res.data.token,
          user: res.data.user,
          isAuthenticated: true,
          isLoading: false
        });
        return { success: true };
      } else {
        set({ isLoading: false });
        return { success: false, error: res.error?.message || 'Authentication failed' };
      }
    } catch (err: any) {
      set({ isLoading: false });
      return { success: false, error: err.message || 'Network connection failed' };
    }
  },

  logout: () => {
    localStorage.removeItem('spb_auth_token');
    set({ token: null, user: null, isAuthenticated: false });
  },

  loadUser: async () => {
    const token = get().token;
    if (!token) return;
    try {
      const res = await api.getMe();
      if (res.success && res.data) {
        set({ user: res.data, isAuthenticated: true });
      } else {
        get().logout();
      }
    } catch {
      // Ignore network errors on init
    }
  }
}));

