import type { AnexoItem, EmpresaInfo, Empreendimento } from '@/types';

export function formatCurrency(value?: string | number | null): string {
  const num = typeof value === 'string' ? parseFloat(value) : value;
  if (!num || isNaN(num)) return 'A consultar';
  return new Intl.NumberFormat('pt-BR', {
    style: 'currency',
    currency: 'BRL',
    minimumFractionDigits: 0,
    maximumFractionDigits: 0,
  }).format(num);
}

export function formatArea(area?: number | null): string | null {
  if (!area) return null;
  return `${Math.trunc(area).toLocaleString('pt-BR')}m²`;
}

export function formatAreaRange(
  range?: { minimo: number; maximo: number } | null
): string | null {
  if (!range) return null;
  const { minimo, maximo } = range;
  const fmt = (v: number) => Math.trunc(v).toLocaleString('pt-BR');
  if (minimo === maximo) return `${fmt(minimo)}m²`;
  return `${fmt(minimo)}–${fmt(maximo)}m²`;
}

export function formatQuartosRange(
  range?: { minimo: number; maximo: number } | null
): string | null {
  if (!range || (range.minimo === 0 && range.maximo === 0)) return null;
  if (range.minimo === range.maximo) return `${range.minimo}`;
  return `${range.minimo}–${range.maximo}`;
}

export function getEmpresaNome(empresa?: EmpresaInfo | null): string {
  if (!empresa) return '';
  return empresa.nome_mascara ?? empresa.nome_fantasia ?? empresa.razao_social ?? '';
}

export function getMainImage(empreendimento: Empreendimento): string | null {
  return (
    empreendimento.anexos?.find((a) => a.categoria === 'foto_principal')?.link ?? null
  );
}

export function getEmpresaLogo(empresa?: EmpresaInfo | null): string | null {
  return empresa?.anexos?.find((a) => a.categoria === 'logo_empresa')?.link ?? null;
}

export function getAllPhotos(empreendimento: Empreendimento): AnexoItem[] {
  return (
    empreendimento.anexos
      ?.filter((a) => ['foto_principal', 'foto', 'fotos'].includes(a.categoria))
      .sort((a, b) => (a.ordenacao ?? 0) - (b.ordenacao ?? 0)) ?? []
  );
}

export function getPlantasPhotos(empreendimento: Empreendimento): AnexoItem[] {
  return (
    empreendimento.anexos
      ?.filter((a) => a.categoria === 'plantas')
      .sort((a, b) => (a.ordenacao ?? 0) - (b.ordenacao ?? 0)) ?? []
  );
}

const PHOTO_CATS = new Set([
  'foto_principal', 'foto', 'fotos', 'plantas', 'logo_empresa', 'logo',
  'logo_empreendimento', 'capa', 'banner',
]);

const CAT_LABEL: Record<string, string> = {
  apresentacao: 'Apresentação',
  manual_corretor: 'Manual do Corretor',
  material_venda: 'Material de Venda',
  tabela_preco: 'Tabela de Preços',
  memorial_descritivo: 'Memorial Descritivo',
  planta_baixa: 'Planta Baixa',
  contrato: 'Contrato',
  prospecto: 'Prospecto',
  documento: 'Documento',
  pdf: 'Arquivo PDF',
};

export function getDocumentos(empreendimento: Empreendimento): AnexoItem[] {
  return (
    empreendimento.anexos
      ?.filter((a) => !PHOTO_CATS.has(a.categoria) && a.link)
      .sort((a, b) => (a.ordenacao ?? 0) - (b.ordenacao ?? 0)) ?? []
  );
}

export function getDocumentoLabel(categoria: string): string {
  return CAT_LABEL[categoria] ?? categoria.replace(/_/g, ' ').replace(/\b\w/g, (c) => c.toUpperCase());
}

export function isNew(dateStr?: string | null, days = 21): boolean {
  if (!dateStr) return false;
  return Date.now() - new Date(dateStr).getTime() < days * 86400000;
}

export function formatPercent(value?: number | null): string {
  if (value == null) return '0%';
  return `${Math.round(value * 100)}%`;
}

export function formatDate(dateStr?: string | null): string | null {
  if (!dateStr) return null;
  try {
    return new Intl.DateTimeFormat('pt-BR', {
      month: 'short',
      year: 'numeric',
    }).format(new Date(dateStr));
  } catch {
    return null;
  }
}
