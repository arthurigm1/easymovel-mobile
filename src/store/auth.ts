import { create } from 'zustand';
import * as SecureStore from 'expo-secure-store';
import { tokenManager } from '@/services/tokenManager';
import type { User } from '@/types';

const TOKEN_KEY = 'em_auth_token';
const USER_KEY = 'em_auth_user';

interface AuthState {
  token: string | null;
  user: User | null;
  isAuthenticated: boolean;
  isLoading: boolean;
  initialize: () => Promise<void>;
  login: (email: string, password: string) => Promise<void>;
  logout: () => void;
}

export const useAuthStore = create<AuthState>((set) => ({
  token: null,
  user: null,
  isAuthenticated: false,
  isLoading: true,

  initialize: async () => {
    try {
      const [token, userStr] = await Promise.all([
        SecureStore.getItemAsync(TOKEN_KEY),
        SecureStore.getItemAsync(USER_KEY),
      ]);
      if (token && userStr) {
        const user: User = JSON.parse(userStr);
        tokenManager.set(token);
        set({ token, user, isAuthenticated: true });
      }
    } catch {
      // silently ignore corrupted storage
    } finally {
      set({ isLoading: false });
    }
  },

  login: async (email: string, password: string) => {
    const { api } = await import('@/services/api');
    const response = await api.post('/login', { email, senha: password });
    const { accessToken, id, name, empresa_id } = response.data;

    const user: User = { id, email, name, empresa_id };

    await Promise.all([
      SecureStore.setItemAsync(TOKEN_KEY, accessToken),
      SecureStore.setItemAsync(USER_KEY, JSON.stringify(user)),
    ]);

    tokenManager.set(accessToken);
    set({ token: accessToken, user, isAuthenticated: true });
  },

  logout: () => {
    SecureStore.deleteItemAsync(TOKEN_KEY).catch(() => {});
    SecureStore.deleteItemAsync(USER_KEY).catch(() => {});
    tokenManager.set(null);
    set({ token: null, user: null, isAuthenticated: false });
  },
}));
