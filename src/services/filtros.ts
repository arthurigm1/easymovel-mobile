import { api } from './api';
import type { ApiResponse, SugestoesFiltro } from '@/types';

export async function getSugestoesFiltro(regiao?: string) {
  const response = await api.get<ApiResponse<SugestoesFiltro>>(
    `/sugestoes-filtro/${encodeURIComponent(regiao || 'todas')}`
  );
  return response.data.dados;
}
