import { useQuery } from '@tanstack/react-query';
import { getEmpresasExterno } from '@/services/empresas';

export function useConstrutoras(params?: {
  regiao?: string;
  nome_fantasia?: string;
}) {
  return useQuery({
    queryKey: ['construtoras', params],
    queryFn: () => getEmpresasExterno(params),
    staleTime: 1000 * 60 * 10,
  });
}
