import axios from 'axios';
import { API_BASE_URL } from '@/constants/config';
import { tokenManager } from './tokenManager';

export const api = axios.create({
  baseURL: API_BASE_URL,
  timeout: 15000,
  headers: { 'Content-Type': 'application/json' },
});

api.interceptors.request.use((config) => {
  const token = tokenManager.get();
  if (token) {
    config.headers.Authorization = token;
  }
  return config;
});

api.interceptors.response.use(
  (response) => response,
  async (error) => {
    if (error.response?.status === 401) {
      const { useAuthStore } = await import('@/store/auth');
      useAuthStore.getState().logout();
    }
    return Promise.reject(error);
  }
);
