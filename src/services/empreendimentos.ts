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
    // tracking is non-critical, silently ignore
  }
}

// Bug fix: was calling wrong path "/registrar-interesse" (404) and missing usuario_id
export async function registrarInteresse(empreendimento_id: string, usuario_id: string): Promise<void> {
  await api.post('/registrar-interesse-pre-lancamento', { empreendimento_id, usuario_id });
}

export async function consultarInteresse(empreendimento_id: string): Promise<boolean> {
  try {
    const response = await api.get<ApiResponse<{ interesse: boolean }>>(
      `/consultar-interesse-pre-lancamento/${empreendimento_id}`
    );
    return response.data.dados?.interesse ?? false;
  } catch {
    return false;
  }
}

export async function esqueceuSenha(email: string, senha_nova: string): Promise<void> {
  await api.post('/esqueci-senha', { email, senha_nova });
}
