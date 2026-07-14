import { useQuery } from '@tanstack/react-query';
import { getSugestoesFiltro } from '@/services/filtros';

export function useSugestoesFiltro(regiao?: string) {
  return useQuery({
    queryKey: ['sugestoes-filtro', regiao ?? 'todas'],
    queryFn: () => getSugestoesFiltro(regiao),
    staleTime: 1000 * 60 * 10,
  });
}
