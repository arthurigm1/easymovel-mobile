export interface Empreendimento {
  id: string;
  nomeEmpreendimento: string;
  nomeConstrutora?: string;
  nomeIncorporadora?: string;
  endereco?: string;
  numero?: string;
  bairro?: string;
  cidade?: string;
  uf?: string;
  latitude?: number;
  longitude?: number;
  descricao?: string;
  status?: string;
  finalidade?: string;
  tipo_produto?: string;
  tipoProduto?: string;
  publicado?: boolean;
  destaque?: boolean;
  anuncio_pausado?: boolean;
  pausado?: boolean;
  promocao?: boolean;
  urlImagem?: string;
  logoConstrutora?: string;
  quartos?: number;
  area?: number;
  valor?: number;
  unidades_disponiveis?: number;
  fracao_vendida?: number;
  primeiraPublicacao?: string;
  empresa_id?: string;
  ano_construcao?: string;
  final_construcao?: string;
  valor_condominio?: number;
  quant_andares?: number;
  quant_blocos?: number;
  quant_elevadores?: number;
  anexos?: Anexo[];
  unidades?: Unidade[];
  comodidade_empreendimentos?: ComodidadeEmpreendimento[];
}

export interface Empresa {
  id: string;
  nome_mascara?: string;
  nome_fantasia?: string;
  razao_social?: string;
  tipo?: string;
  regiao?: string;
  criado_em?: string;
  anexos?: Anexo[];
  _count?: { empreendimentos: number };
}

export interface Anexo {
  id: string;
  categoria: string;
  caminho_s3?: string;
  bucket?: string;
  nome_original?: string;
  mimetype?: string;
  ordenacao?: number;
  url?: string;
}

export interface Unidade {
  id: string;
  descricao?: string;
  status?: string;
  tipologia?: string;
  area?: number;
  area_externa?: number;
  quant_quartos?: number;
  quant_banheiros?: number;
  quant_suites?: number;
  quant_vagas?: number;
  valor?: number;
  bloco?: string;
}

export interface Comodidade {
  id: string;
  nome: string;
  icone?: string;
}

export interface ComodidadeEmpreendimento {
  comodidade: Comodidade;
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

export interface FiltrarEmpreendimentosParams {
  pagina?: number;
  empreendimento?: string;
  localidade?: string;
  construtora?: string;
  tipo_imovel?: string;
  status_construcao?: string;
  quant_quartos?: string;
  quant_suites?: string;
  quant_vagas?: string;
  tipologia?: string;
  comodidades?: string;
  valor_min?: number;
  valor_max?: number;
  area_min?: number;
  area_max?: number;
  disponiveis?: boolean;
  regiao?: string;
  ordenar_por?: string;
}

export interface User {
  id: string;
  email: string;
  name: string;
  empresa_id?: string;
}
