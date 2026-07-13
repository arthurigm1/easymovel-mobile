import { useInfiniteQuery, useQuery } from '@tanstack/react-query';
import {
  filtrarEmpreendimentos,
  getEmpreendimento,
} from '@/services/empreendimentos';
import type { FiltrarEmpreendimentosParams } from '@/types';

export function useEmpreendimentos(
  params: Omit<FiltrarEmpreendimentosParams, 'pagina'>
) {
  return useInfiniteQuery({
    queryKey: ['empreendimentos', params],
    queryFn: ({ pageParam }) =>
      filtrarEmpreendimentos({ ...params, pagina: pageParam }),
    getNextPageParam: (lastPage) => {
      const { pagina, quant_paginas } = lastPage.paginacao;
      return pagina < quant_paginas ? pagina + 1 : undefined;
    },
    initialPageParam: 1,
    staleTime: 1000 * 60 * 5,
  });
}

export function useEmpreendimento(id: string) {
  return useQuery({
    queryKey: ['empreendimento', id],
    queryFn: () => getEmpreendimento(id),
    enabled: !!id,
    staleTime: 1000 * 60 * 5,
  });
}
