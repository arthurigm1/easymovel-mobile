import { api } from './api';
import type { ApiResponse } from '@/types';

// GET /dashboards/acessos — mesmo endpoint do dashboard do PWA (construtora).
// Tipagem defensiva: o payload é grande e o mobile consome só um recorte
// (KPIs, ranking de empreendimentos e atividade recente).

export interface DashboardCard {
  valor?: number | string;
  /** Delta numérico vs. período anterior (a API manda número; o texto é montado no cliente). */
  comparativo?: number | string;
}

export interface BarItem {
  categoria?: string;
  valor?: number;
  dica_de_ferramenta?: string;
}

export interface AtividadeRecente {
  data?: string;
  empreendimento?: string;
  usuario?: string;
  empresa?: string;
  telefone?: string;
  atividade?: string;
}

export interface DashboardAcessos {
  cabecalho?: {
    card_acessos_hoje?: DashboardCard;
    card_acessos_7_dias?: DashboardCard;
    card_acessos_30_dias?: DashboardCard;
    card_quant_empreendimentos?: DashboardCard;
    card_quant_compartilhamentos?: DashboardCard;
    card_quant_imobiliarias_integradas?: DashboardCard;
  };
  corpo?: {
    secao_acessos_por_empreendimento?: {
      grafico_barras_quant_acessos_por_empreendimento?: { dados?: BarItem[] };
    };
    grafico_barras_quant_acessos_por_imobiliaria?: { dados?: BarItem[] };
    grafico_barras_quant_acessos_por_corretor?: { dados?: BarItem[] };
    tabela_atividade_recente?: { dados?: AtividadeRecente[] };
  };
}

export async function getDashboardAcessos(): Promise<DashboardAcessos> {
  const response = await api.get<ApiResponse<DashboardAcessos>>('/dashboards/acessos', {
    // dashboards agregam muita coisa — dá mais folga que os 15s padrão
    timeout: 30000,
  });
  return response.data.dados ?? {};
}
