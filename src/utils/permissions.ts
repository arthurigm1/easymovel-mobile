import type { Empreendimento, User } from '@/types';

// Fonte única de verdade das permissões por tipo de usuário.
// Espelha o gating do PWA (CASL + checagens de tipoUsuario espalhadas pelo
// top-nav, account-popover e páginas). Regra geral:
//
//   construtora        → gestão do próprio portfólio (editar tabela, pausar
//                        anúncio, dashboard, interessados, marketing)
//   imobiliaria        → ferramentas de venda (hotsite, simulação), sem gestão
//   corretor_autonomo  → igual imobiliária, sem área de empresa
//
// Ferramentas de venda são explicitamente ESCONDIDAS da construtora no PWA
// (ela é a anunciante, não quem vende ao cliente final).

export type TipoUsuario = 'construtora' | 'imobiliaria' | 'corretor_autonomo';

export function isConstrutora(user?: User | null): boolean {
  return user?.tipo_usuario === 'construtora';
}

export function isImobiliaria(user?: User | null): boolean {
  return user?.tipo_usuario === 'imobiliaria';
}

export function isCorretorAutonomo(user?: User | null): boolean {
  return user?.tipo_usuario === 'corretor_autonomo';
}

/** Quem vende para o cliente final: imobiliária e corretor autônomo. */
export function isVendedor(user?: User | null): boolean {
  return !!user && !isConstrutora(user);
}

// ─── Ferramentas de venda (ocultas para construtora, como no PWA) ────────────

/** Gerar hotsite / Meus Hotsites — top-nav.jsx:488 esconde para construtora. */
export function podeUsarHotsite(user?: User | null): boolean {
  return isVendedor(user);
}

/** Simular financiamento — ModalTabelaParcelamentos.jsx:274 esconde p/ construtora. */
export function podeSimularFinanciamento(user?: User | null): boolean {
  return isVendedor(user);
}

/** Inscrever-se em pré-lançamento — Edit/index.jsx:2343 esconde p/ construtora. */
export function podeRegistrarInteresse(user?: User | null): boolean {
  return isVendedor(user);
}

// ─── Gestão (construtora) ────────────────────────────────────────────────────

/** Dashboard de acessos — can('read','DashboardAcessos') no PWA. */
export function podeVerDashboard(user?: User | null): boolean {
  return isConstrutora(user) && !!user?.empresa_id;
}

/** "Meus Empreendimentos" (empresa_id + incluir_nao_publicados). */
export function podeVerMeusEmpreendimentos(user?: User | null): boolean {
  return isConstrutora(user) && !!user?.empresa_id;
}

/**
 * Dono do anúncio: só a construtora da empresa que publicou pode editar
 * unidades, pausar o anúncio, ver interessados e atualizar a tabela por IA.
 * O detalhe da API expõe `empresa_id` na raiz (empresa.id não vem).
 */
export function isDonoEmpreendimento(
  user: User | null | undefined,
  empreendimento: Pick<Empreendimento, 'empresa_id' | 'empresa'> | null | undefined
): boolean {
  if (!isConstrutora(user) || !user?.empresa_id || !empreendimento) return false;
  const donoId = empreendimento.empresa_id ?? empreendimento.empresa?.id;
  return !!donoId && donoId === user.empresa_id;
}

/** Área da empresa — corretor autônomo não tem (Configuracao/index.jsx). */
export function podeVerAreaEmpresa(user?: User | null): boolean {
  return !!user && !isCorretorAutonomo(user);
}

// ─── Tabela de vendas ────────────────────────────────────────────────────────

/**
 * Ver a tabela de vendas com preços: exige login. A construtora dona vê para
 * gerir; imobiliária/corretor veem para vender. `oculta_tabela_de_vendas` da
 * empresa esconde de quem não é dono (regra do PWA).
 */
export function podeVerTabelaVendas(
  user: User | null | undefined,
  empreendimento: Empreendimento | null | undefined,
  isAuthenticated: boolean
): boolean {
  if (!isAuthenticated || !empreendimento) return false;
  if (isDonoEmpreendimento(user, empreendimento)) return true;
  return !empreendimento.empresa?.oculta_tabela_de_vendas;
}
