import { api } from './api';
import type { ApiResponse, Empresa } from '@/types';

// `/empresas-externo` só retorna id/tipo/cnpj/nome_empresa (sem logo, região etc.).
// `/empresas` traz os dados completos (nome_mascara/fantasia, região, anexos/logo) —
// filtramos por tipo=construtora para restringir à listagem de construtoras.
export async function getConstrutoras(params?: { regiao?: string }) {
  const response = await api.get<ApiResponse<Empresa[]>>('/empresas', {
    params: { tipo: 'construtora', ...params },
  });
  return response.data;
}
