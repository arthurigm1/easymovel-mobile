import { useQuery } from '@tanstack/react-query';
import { getConstrutoras } from '@/services/empresas';

export function useConstrutoras(params?: { regiao?: string }) {
  return useQuery({
    queryKey: ['construtoras', params],
    queryFn: () => getConstrutoras(params),
    staleTime: 1000 * 60 * 10,
  });
}
