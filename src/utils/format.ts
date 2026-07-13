export function formatCurrency(value?: number | null): string {
  if (!value) return 'A consultar';
  return new Intl.NumberFormat('pt-BR', {
    style: 'currency',
    currency: 'BRL',
    minimumFractionDigits: 0,
    maximumFractionDigits: 0,
  }).format(value);
}

export function formatArea(area?: number | null): string | null {
  if (!area) return null;
  return `${area}m²`;
}

export function getEmpresaNome(empresa: {
  nome_mascara?: string;
  nome_fantasia?: string;
  razao_social?: string;
}): string {
  return empresa.nome_mascara ?? empresa.nome_fantasia ?? empresa.razao_social ?? '';
}

export function isNew(dateStr?: string | null, days = 30): boolean {
  if (!dateStr) return false;
  const date = new Date(dateStr);
  const diff = Date.now() - date.getTime();
  return diff < days * 24 * 60 * 60 * 1000;
}
