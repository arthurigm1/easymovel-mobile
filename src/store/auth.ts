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
    // Backend returns: { sucesso, dados: { auth, token: "Bearer ...", usuario: { id, nome_completo, email, empresa_id } } }
    const { token, usuario } = response.data.dados as {
      token: string;
      usuario: { id: string; nome_completo: string; email: string; empresa_id?: string };
    };

    const user: User = {
      id: usuario.id,
      email: usuario.email,
      name: usuario.nome_completo,
      empresa_id: usuario.empresa_id,
    };

    await Promise.all([
      SecureStore.setItemAsync(TOKEN_KEY, token),
      SecureStore.setItemAsync(USER_KEY, JSON.stringify(user)),
    ]);

    tokenManager.set(token);
    set({ token, user, isAuthenticated: true });
  },

  logout: () => {
    SecureStore.deleteItemAsync(TOKEN_KEY).catch(() => {});
    SecureStore.deleteItemAsync(USER_KEY).catch(() => {});
    tokenManager.set(null);
    set({ token: null, user: null, isAuthenticated: false });
  },
}));
