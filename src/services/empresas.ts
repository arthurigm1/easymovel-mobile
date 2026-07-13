import { api } from './api';
import type { ApiResponse, Empresa } from '@/types';

export async function getEmpresasExterno(params?: {
  regiao?: string;
  nome_fantasia?: string;
}) {
  const response = await api.get<ApiResponse<Empresa[]>>('/empresas-externo', { params });
  return response.data;
}
