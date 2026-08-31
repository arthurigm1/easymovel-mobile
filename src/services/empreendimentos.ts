import { api } from './api';
import type {
  ApiResponse,
  Empreendimento,
  FiltrarEmpreendimentosParams,
  PaginatedResponse,
  UnidadeItem,
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

// ─── Gestão (dono construtora) ───────────────────────────────────────────────

// Mesmo contrato do PWA (Unidades/Edit/services.js): envia a lista completa de
// unidades com os campos editáveis + tabela_atualizada.
export async function atualizarUnidades(
  empreendimentoId: string,
  unidades: UnidadeItem[]
): Promise<void> {
  await api.put(`/empreendimentos/${empreendimentoId}`, {
    unidades: unidades.map((u) => ({
      id: u.id,
      bloco: u.bloco,
      descricao: u.descricao,
      tipologia: u.tipologia,
      area: u.area,
      area_externa: u.area_externa,
      quant_quartos: u.quant_quartos,
      quant_suites: u.quant_suites,
      quant_banheiros: u.quant_banheiros,
      quant_vagas: u.quant_vagas,
      status: u.status,
      valor: u.valor,
    })),
    tabela_atualizada: new Date().toISOString(),
  });
}

// Pausar/publicar anúncio — mesmo handlePause do PWA.
export async function setAnuncioPausado(
  empreendimentoId: string,
  pausado: boolean
): Promise<void> {
  await api.put(`/empreendimentos/${empreendimentoId}`, { anuncio_pausado: pausado });
}

// Corretores interessados num pré-lançamento (visão do dono).
export interface InteressadoPreLancamento {
  id?: string;
  criado_em?: string;
  usuario?: {
    id: string;
    nome_completo?: string;
    email?: string;
    celular?: string;
    tipo_usuario?: string;
    empresa?: {
      nome_mascara?: string;
      nome_fantasia?: string;
      razao_social?: string;
    };
  };
}

export async function getInteressadosPreLancamento(
  empreendimentoId: string
): Promise<InteressadoPreLancamento[]> {
  const response = await api.get<ApiResponse<InteressadoPreLancamento[]>>(
    `/consultar-interesses-pre-lancamento/${empreendimentoId}`
  );
  return response.data.dados ?? [];
}
