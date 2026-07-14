import { Palette } from './theme';

// ─── Status de construção (obra) ─────────────────────────────────────────────
// Fonte única usada por StatusBadge e StatusStepper — antes cada um tinha seu
// próprio mapa de aliases/cores, divergentes entre si.

export interface ConstructionStage {
  match: string[];
  label: string;
  shortLabel: string;
  color: string;
  bg: string;
}

export const CONSTRUCTION_STAGES: ConstructionStage[] = [
  {
    match: ['pre-lancamento', 'Pré-Lançamento', 'pre lancamento'],
    label: 'Pré-Lançamento',
    shortLabel: 'Pré',
    color: Palette.statusPreLancamento,
    bg: Palette.statusPreLancamentoBg,
  },
  {
    match: ['Lançamento', 'Na Planta'],
    label: 'Lançamento',
    shortLabel: 'Lanç.',
    color: Palette.statusLancamento,
    bg: Palette.statusLancamentoBg,
  },
  {
    match: ['Em Construção', 'Em construção', 'Em Obra'],
    label: 'Em Construção',
    shortLabel: 'Obras',
    color: Palette.statusEmConstrucao,
    bg: Palette.statusEmConstrucaoBg,
  },
  {
    match: ['Pronto para Morar', 'Concluído', 'Pronto'],
    label: 'Pronto',
    shortLabel: 'Pronto',
    color: Palette.statusPronto,
    bg: Palette.statusProntoBg,
  },
];

export function findConstructionStage(status?: string): ConstructionStage | undefined {
  if (!status) return undefined;
  return CONSTRUCTION_STAGES.find((s) => s.match.includes(status));
}

export function getConstructionStageIndex(status?: string): number {
  if (!status) return -1;
  return CONSTRUCTION_STAGES.findIndex((s) => s.match.includes(status));
}

// ─── Status de unidade (venda) ────────────────────────────────────────────────
// Usado por SalesTable (e disponível para qualquer chip de status de unidade).

export interface UnitStatusConfig {
  bg: string;
  text: string;
  dot: string;
}

export const UNIT_STATUS: Record<string, UnitStatusConfig> = {
  Disponível: { bg: '#D1FAE5', text: '#065F46', dot: '#18BB3C' },
  Decorado: { bg: '#EDE9FE', text: '#4C1D95', dot: '#9E77ED' },
  Promoção: { bg: '#DBEAFE', text: '#1E40AF', dot: '#127EFC' },
  Modelo: { bg: '#FEF3C7', text: '#92400E', dot: '#F79009' },
  Reservado: { bg: '#FEF9C3', text: '#713F12', dot: '#E1CA00' },
  Vendido: { bg: '#F1F5F9', text: '#475569', dot: '#474A51' },
  Indisponível: { bg: '#FEE2E2', text: '#991B1B', dot: '#DC0101' },
};

export const UNIT_STATUS_FALLBACK: UnitStatusConfig = {
  bg: Palette.surfaceVariant,
  text: Palette.textSecondary,
  dot: Palette.border,
};

export function getUnitStatus(status?: string): UnitStatusConfig {
  return (status && UNIT_STATUS[status]) || UNIT_STATUS_FALLBACK;
}
