import { useInfiniteQuery, useQuery } from '@tanstack/react-query';
import {
  filtrarEmpreendimentos,
  getEmpreendimento,
} from '@/services/empreendimentos';
import type { FiltrarEmpreendimentosParams } from '@/types';

export function useEmpreendimentos(
  params: Omit<FiltrarEmpreendimentosParams, 'pagina'>,
  options?: { enabled?: boolean }
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
    enabled: options?.enabled !== false,
  });
}

// Carrega todas as páginas de uma vez (limitado a 10) para plotar os pins do
// mapa. Reusa o mesmo endpoint da listagem — que agora retorna latitude e
// longitude — e descarta itens sem coordenada.
const MAX_MAP_PAGES = 10;

export function useEmpreendimentosMapa(options?: { enabled?: boolean }) {
  return useQuery({
    queryKey: ['empreendimentos-mapa'],
    queryFn: async () => {
      const first = await filtrarEmpreendimentos({ pagina: 1 });
      const totalPages = Math.min(first.paginacao.quant_paginas, MAX_MAP_PAGES);
      const rest = await Promise.all(
        Array.from({ length: Math.max(totalPages - 1, 0) }, (_, i) =>
          filtrarEmpreendimentos({ pagina: i + 2 })
        )
      );
      return [first, ...rest]
        .flatMap((page) => page.dados)
        .filter(
          (e) =>
            e.latitude != null &&
            e.longitude != null &&
            Math.abs(e.latitude) > 0.0001 &&
            Math.abs(e.longitude) > 0.0001
        );
    },
    staleTime: 1000 * 60 * 5,
    enabled: options?.enabled !== false,
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
