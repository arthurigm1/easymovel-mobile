import { api } from './api';
import type {
  ApiResponse,
  Empreendimento,
  FiltrarEmpreendimentosParams,
  PaginatedResponse,
} from '@/types';

export async function filtrarEmpreendimentos(params: FiltrarEmpreendimentosParams) {
  const response = await api.get<PaginatedResponse<Empreendimento[]>>(
    '/filtrar-empreendimentos',
    { params }
  );
  return response.data;
}

export async function getEmpreendimento(id: string) {
  const response = await api.get<ApiResponse<Empreendimento>>(`/empreendimentos/${id}`);
  return response.data;
}
