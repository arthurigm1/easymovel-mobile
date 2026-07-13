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

export async function postAcesso(payload: {
  tipo: string;
  descricao: string;
  empreendimento_id?: string;
  empresa_id?: string;
}) {
  try {
    await api.post('/acesso', { ...payload, origem: 'mobile' });
  } catch {
    // tracking is non-critical, silently ignore errors
  }
}

export async function registrarInteresse(empreendimento_id: string): Promise<void> {
  await api.post('/registrar-interesse', { empreendimento_id, origem: 'mobile' });
}
