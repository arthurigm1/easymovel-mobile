export interface AnexoItem {
  id: string;
  categoria: string;
  link: string;
  descricao?: string;
  ordenacao?: number;
}

export interface EmpresaInfo {
  id: string;
  nome_mascara?: string;
  nome_fantasia?: string;
  razao_social?: string;
  anexos?: AnexoItem[];
  link_portal?: string;
}

export interface UnidadeItem {
  id: string;
  descricao?: string;
  tipologia?: string;
  area?: number;
  area_externa?: number;
  quant_quartos?: number;
  quant_suites?: number;
  quant_banheiros?: number;
  quant_vagas?: number;
  valor?: number;
  status?: string;
  bloco?: string;
}

export interface VideoItem {
  id: string;
  url_youtube?: string;
  criado_em?: string;
}

export interface Empreendimento {
  id: string;
  nome_empreendimento: string;
  empresa: EmpresaInfo;
  finalidade?: string;
  status?: string;
  tipo_produto?: string;
  endereco?: string;
  numero?: string;
  bairro?: string;
  bairro_comercial?: string;
  cidade?: string;
  uf?: string;
  latitude?: number;
  longitude?: number;
  descricao?: string;
  destaque?: boolean;
  publicado?: boolean;
  anuncio_pausado?: boolean;
  primeira_publicacao_em?: string;
  parceria_housi?: boolean;
  unidades_promocao?: boolean;
  fracao_vendida?: number;
  unidades_disponiveis?: number;
  valor?: string | number;
  unidades_quartos?: { minimo: number; maximo: number };
  unidades_area?: { minimo: number; maximo: number };
  unidades_vagas?: { minimo: number; maximo: number };
  unidades_banheiros?: { minimo: number; maximo: number };
  quant_andares?: number;
  quant_unidades?: number;
  quant_elevadores?: number;
  final_construcao?: string;
  previsao_na_planta?: string;
  valor_condominio?: number;
  taxa_enxoval?: number;
  nome_construtora?: string;
  nome_projetista?: string;
  telefone_responsavel_empreendimento?: string;
  nome_responsavel_empreendimento?: string;
  anexos?: AnexoItem[];
  unidades?: UnidadeItem[];
  videos?: VideoItem[];
}

export interface Empresa {
  id: string;
  nome_mascara?: string;
  nome_fantasia?: string;
  razao_social?: string;
  tipo?: string;
  regiao?: string;
  criado_em?: string;
  anexos?: AnexoItem[];
  _count?: { empreendimentos: number };
}

export interface ApiResponse<T> {
  sucesso: boolean;
  mensagem?: string;
  dados: T;
}

export interface PaginatedResponse<T> {
  sucesso: boolean;
  mensagem?: string;
  dados: T;
  paginacao: {
    pagina: number;
    quant_paginas: number;
    quant_registros: number;
  };
}

export interface FilterState {
  search: string;
  status_construcao?: string;
  tipo_imovel?: string;
  tipologia?: string;
  quant_quartos?: string;
  quant_suites?: string;
  quant_vagas?: string;
  valor_min?: number;
  valor_max?: number;
  area_min?: number;
  area_max?: number;
  disponiveis?: boolean;
  regiao?: string;
  empresa_id?: string;
  empresa_nome?: string;
  ordenar_por?: string;
}

export interface FiltrarEmpreendimentosParams {
  pagina?: number;
  empreendimento?: string;
  status_construcao?: string;
  tipo_imovel?: string;
  quant_quartos?: string;
  quant_suites?: string;
  quant_vagas?: string;
  tipologia?: string;
  valor_min?: number;
  valor_max?: number;
  area_min?: number;
  area_max?: number;
  disponiveis?: boolean;
  regiao?: string;
  empresa_id?: string;
  ordenar_por?: string;
}

export interface User {
  id: string;
  email: string;
  name: string;
  empresa_id?: string;
}
