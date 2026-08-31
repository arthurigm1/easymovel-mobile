import { create } from 'zustand';
import * as SecureStore from 'expo-secure-store';

const FAV_KEY = 'em_favorites';

interface FavoritesState {
  ids: string[];
  hydrated: boolean;
  hydrate: () => Promise<void>;
  isFavorite: (id: string) => boolean;
  toggle: (id: string) => void;
}

// Favoritos ficam SÓ no dispositivo (SecureStore) — não há endpoint de favoritos
// no backend, então não inventamos um. Persistência local, igual ao padrão de auth.
export const useFavorites = create<FavoritesState>((set, get) => ({
  ids: [],
  hydrated: false,

  hydrate: async () => {
    try {
      const raw = await SecureStore.getItemAsync(FAV_KEY);
      const ids: string[] = raw ? JSON.parse(raw) : [];
      set({ ids: Array.isArray(ids) ? ids : [], hydrated: true });
    } catch {
      set({ hydrated: true });
    }
  },

  isFavorite: (id) => get().ids.includes(id),

  toggle: (id) => {
    const current = get().ids;
    const ids = current.includes(id)
      ? current.filter((x) => x !== id)
      : [id, ...current];
    set({ ids });
    SecureStore.setItemAsync(FAV_KEY, JSON.stringify(ids)).catch(() => {});
  },
}));

// Hidrata uma vez no primeiro import (fire-and-forget).
useFavorites.getState().hydrate();
