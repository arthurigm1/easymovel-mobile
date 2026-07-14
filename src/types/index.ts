export interface AnexoItem {
  id: string;
  categoria: string;
  link: string;
  descricao?: string;
  ordenacao?: number;
  criado_em?: string;
}

export interface EmpresaInfo {
  id: string;
  nome_mascara?: string;
  nome_fantasia?: string;
  razao_social?: string;
  anexos?: AnexoItem[];
  link_portal?: string;
  nome_do_responsavel?: string;
  telefone_do_responsavel?: string;
  nome_do_responsavel_2?: string;
  telefone_do_responsavel_2?: string;
}

export interface UnidadeItem {
  id: string;
  descricao?: string;
  tipologia?: string;
  bloco?: string;
  area?: number;
  area_externa?: number;
  quant_quartos?: number;
  quant_suites?: number;
  quant_banheiros?: number;
  quant_vagas?: number;
  valor?: number;
  status?: string;
  ordenacao?: number;
  criado_em?: string;
}

export interface VideoItem {
  id: string;
  url_youtube?: string;
  criado_em?: string;
}

export interface ParcelamentoItem {
  id: string;
  descricao?: string;
  percentual?: number;
  quant_parcelas?: number;
  ordem?: number;
  parcela_id?: string;
}

export interface ComodidadeItem {
  id: string;
  comodidade: {
    id: string;
    descricao: string;
    categoria: 'Esporte e Lazer' | 'Segurança' | 'Facilidades' | string;
  };
}

export interface ParceriaItem {
  id: string;
  empresa: {
    id: string;
    nome_mascara?: string;
    nome_fantasia?: string;
    razao_social?: string;
  };
}

export interface Empreendimento {
  id: string;
  nome_empreendimento: string;
  empresa: EmpresaInfo;
  finalidade?: string;
  status?: string;
  tipo_produto?: string;
  varios_blocos?: boolean;
  oculta_tabela_de_vendas?: boolean;
  endereco?: string;
  numero?: string;
  bairro?: string;
  bairro_comercial?: string;
  cidade?: string;
  uf?: string;
  cep?: string;
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
  quant_lotes?: number;
  quant_blocos?: number;
  quant_elevadores?: number;
  unidades_por_andar?: number;
  area_terreno?: number;
  final_construcao?: string;
  previsao_na_planta?: string;
  valor_condominio?: number;
  valor_iptu?: number;
  taxa_enxoval?: number;
  nome_construtora?: string;
  nome_projetista?: string;
  instalacao_para_ar?: string;
  aquecimento_chuveiro?: string;
  medidor_agua_ind?: boolean;
  medidor_gas_ind?: boolean;
  telefone_responsavel_empreendimento?: string;
  nome_responsavel_empreendimento?: string;
  telefone_responsavel_empreendimento_2?: string;
  nome_responsavel_empreendimento_2?: string;
  comodidade_empreendimentos?: ComodidadeItem[];
  parcerias?: ParceriaItem[];
  parcelamentos?: ParcelamentoItem[];
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

export interface SelectOption {
  id: string;
  label: string;
  group?: string;
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
  bairros?: SelectOption[];
  construtoras?: SelectOption[];
  comodidades?: string[];
  endereco?: string;
}

export interface SugestoesFiltro {
  empreendimento: string[];
  localidade: { bairro_id: string; nome_bairro: string; cidade: string }[];
  construtora: { construtora: string; construtora_id: string }[];
  comodidades: string[];
  enderecos: string[];
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
  bairro_id?: string[];
  construtora?: string[];
  comodidades?: string[];
  endereco?: string;
}

export interface User {
  id: string;
  email: string;
  name: string;
  empresa_id?: string;
  celular?: string;
  regiao?: string;
  link_foto?: string;
  receber_notificacao?: boolean;
}
