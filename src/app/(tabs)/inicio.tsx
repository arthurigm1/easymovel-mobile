import { useCallback, useEffect, useRef, useState } from 'react';
import {
  ActivityIndicator,
  FlatList,
  Image,
  Modal,
  RefreshControl,
  ScrollView,
  StyleSheet,
  Text,
  TouchableOpacity,
  View,
} from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import Animated, {
  FadeInDown,
  Keyframe,
  useAnimatedStyle,
  useReducedMotion,
  useSharedValue,
  withSpring,
} from 'react-native-reanimated';
import { useLocalSearchParams, useRouter } from 'expo-router';
import { Ionicons } from '@expo/vector-icons';
import { useAuthStore } from '@/store/auth';
import { useEmpreendimentos } from '@/hooks/useEmpreendimentos';
import { EmpreendimentoCard } from '@/components/EmpreendimentoCard';
import { FilterSheet, REGIAO_OPTIONS, ORDENAR_OPTIONS } from '@/components/FilterSheet';
import { EmptyState } from '@/components/EmptyState';
import { SkeletonList } from '@/components/SkeletonCard';
import { Palette, Radius, Shadow, Spacing, DisplayFont } from '@/constants/theme';
import type { Empreendimento, FilterState } from '@/types';

const EMPTY_FILTERS: FilterState = {};

const CATEGORIES = [
  { icon: 'rocket-outline' as const, label: 'Pré-Lançamento', field: 'status_construcao' as const, value: 'pre-lancamento' },
  { icon: 'construct-outline' as const, label: 'Em Construção', field: 'status_construcao' as const, value: 'Em Construção' },
  { icon: 'checkmark-circle-outline' as const, label: 'Prontos', field: 'status_construcao' as const, value: 'Pronto para Morar' },
  { icon: 'pricetag-outline' as const, label: 'Lançamentos', field: 'status_construcao' as const, value: 'Lançamento' },
];

// Rótulos legíveis para os chips de filtros ativos
const STATUS_LABELS: Record<string, string> = {
  'pre-lancamento': 'Pré-Lançamento',
  'Lançamento': 'Lançamento',
  'Em Construção': 'Em Construção',
  'Pronto para Morar': 'Pronto para Morar',
};
const TIPO_LABELS: Record<string, string> = {
  empreendimento: 'Condomínios',
  loteamento: 'Loteamentos',
  'imovel-avulso': 'Avulsos',
};

function fmtPreco(v: number): string {
  if (v >= 1_000_000) {
    const m = v / 1_000_000;
    return `R$ ${Number.isInteger(m) ? m : m.toFixed(1)} mi`;
  }
  if (v >= 1000) return `R$ ${Math.round(v / 1000)} mil`;
  return `R$ ${v}`;
}

function rangeLabel(
  min: number | undefined,
  max: number | undefined,
  fmt: (n: number) => string,
): string {
  if (min != null && max != null) return `${fmt(min)} – ${fmt(max)}`;
  if (min != null) return `A partir de ${fmt(min)}`;
  return `Até ${fmt(max as number)}`;
}

type ActiveChip = { key: string; label: string; onRemove: () => void };

// ─── Motion helpers ───────────────────────────────────────────────────────────
const AnimatedTouchable = Animated.createAnimatedComponent(TouchableOpacity);
const SPRING_IN = { damping: 15, stiffness: 320 } as const;
const SPRING_OUT = { damping: 13, stiffness: 260 } as const;

// Fade + scale/slide para o popover de ordenação (respeita reduced-motion no caller).
const SortMenuEnter = new Keyframe({
  0: { opacity: 0, transform: [{ scale: 0.92 }, { translateY: -8 }] },
  100: { opacity: 1, transform: [{ scale: 1 }, { translateY: 0 }] },
}).duration(180);

// Entrada suave e rápida dos blocos do header (sem tocar nos itens da lista).
function headerEnter(reduced: boolean, delay: number) {
  return reduced ? undefined : FadeInDown.duration(380).delay(delay);
}

type PressableScaleProps = React.ComponentProps<typeof TouchableOpacity> & { reduced: boolean };

// Toque com spring press-scale tátil, preservando estados visuais e a11y do filho.
function PressableScale({ reduced, style, children, onPressIn, onPressOut, ...rest }: PressableScaleProps) {
  const scale = useSharedValue(1);
  const animStyle = useAnimatedStyle(() => ({ transform: [{ scale: scale.value }] }));
  return (
    <AnimatedTouchable
      {...rest}
      style={[style, animStyle]}
      onPressIn={(e) => {
        if (!reduced) scale.value = withSpring(0.93, SPRING_IN);
        onPressIn?.(e);
      }}
      onPressOut={(e) => {
        if (!reduced) scale.value = withSpring(1, SPRING_OUT);
        onPressOut?.(e);
      }}
    >
      {children}
    </AnimatedTouchable>
  );
}

export default function InicioScreen() {
  const router = useRouter();
  const reduced = useReducedMotion();
  const user = useAuthStore((s) => s.user);
  const params = useLocalSearchParams<{
    empresa_id?: string;
    empresa_nome?: string;
    status_construcao?: string;
    regiao?: string;
    bairro_id?: string;
    bairro_nome?: string;
    empreendimento_nome?: string;
    endereco?: string;
    meus?: string;
  }>();

  const [filterVisible, setFilterVisible] = useState(false);
  const [sortVisible, setSortVisible] = useState(false);
  const [pendingFilters, setPendingFilters] = useState<FilterState>(EMPTY_FILTERS);
  const [activeFilters, setActiveFilters] = useState<FilterState>(EMPTY_FILTERS);

  const regiaoLabel = activeFilters.regiao
    ? REGIAO_OPTIONS.find((r) => r.value === activeFilters.regiao)?.label ?? activeFilters.regiao
    : user?.regiao
    ? REGIAO_OPTIONS.find((r) => r.value === user.regiao)?.label ?? user.regiao
    : 'Todas as regiões';

  const ordenarLabel =
    ORDENAR_OPTIONS.find((o) => o.value === (activeFilters.ordenar_por ?? ''))?.label ?? 'Automática';

  function selectOrdenar(value: string) {
    setActiveFilters((f) => ({ ...f, ordenar_por: value || undefined }));
    setSortVisible(false);
  }

  // Navegação vinda da Busca (bairro / empreendimento / endereço / construtora) ou de
  // outros pontos com filtro pré-definido. Merge — cada parâmetro popula apenas o seu
  // próprio filtro, preservando os demais já ativos.
  useEffect(() => {
    if (
      params.empresa_id ||
      params.status_construcao ||
      params.regiao ||
      params.bairro_id ||
      params.empreendimento_nome ||
      params.endereco ||
      params.meus
    ) {
      setActiveFilters((prev) => ({
        ...prev,
        ...(params.empresa_id ? { empresa_id: params.empresa_id, empresa_nome: params.empresa_nome } : {}),
        ...(params.status_construcao ? { status_construcao: params.status_construcao } : {}),
        ...(params.regiao ? { regiao: params.regiao } : {}),
        ...(params.bairro_id
          ? { bairros: [{ id: params.bairro_id, label: params.bairro_nome ?? params.bairro_id }] }
          : {}),
        ...(params.empreendimento_nome
          ? { empreendimentos: [{ id: params.empreendimento_nome, label: params.empreendimento_nome }] }
          : {}),
        ...(params.endereco ? { endereco: params.endereco } : {}),
        // "Meus Empreendimentos" (construtora): mesma query do PWA —
        // empresa_id do usuário + incluir_nao_publicados=true.
        ...(params.meus ? { incluir_nao_publicados: true } : {}),
      }));
    }
  }, [
    params.empresa_id,
    params.status_construcao,
    params.regiao,
    params.bairro_id,
    params.empreendimento_nome,
    params.endereco,
    params.meus,
  ]);

  const activeCount = [
    activeFilters.status_construcao,
    activeFilters.tipo_imovel,
    activeFilters.tipologia,
    activeFilters.quant_quartos,
    activeFilters.quant_suites,
    activeFilters.quant_vagas,
    activeFilters.valor_min != null || activeFilters.valor_max != null ? '__val__' : undefined,
    activeFilters.area_min != null || activeFilters.area_max != null ? '__area__' : undefined,
    activeFilters.disponiveis ? '__disp__' : undefined,
    activeFilters.regiao,
    activeFilters.empresa_id,
    activeFilters.empreendimentos?.length ? '__empreendimentos__' : undefined,
    activeFilters.bairros?.length ? '__bairros__' : undefined,
    activeFilters.construtoras?.length ? '__construtoras__' : undefined,
    activeFilters.comodidades?.length ? '__comodidades__' : undefined,
    activeFilters.endereco,
  ].filter(Boolean).length;


  const { data, isLoading, isError, isFetchingNextPage, fetchNextPage, hasNextPage, refetch, isRefetching } =
    useEmpreendimentos({
      empreendimento: activeFilters.empreendimentos?.map((e) => e.label),
      status_construcao: activeFilters.status_construcao,
      tipo_imovel: activeFilters.tipo_imovel,
      tipologia: activeFilters.tipologia,
      quant_quartos: activeFilters.quant_quartos,
      quant_suites: activeFilters.quant_suites,
      quant_vagas: activeFilters.quant_vagas,
      valor_min: activeFilters.valor_min,
      valor_max: activeFilters.valor_max,
      area_min: activeFilters.area_min,
      area_max: activeFilters.area_max,
      disponiveis: activeFilters.disponiveis,
      regiao: activeFilters.regiao,
      empresa_id: activeFilters.empresa_id,
      ordenar_por: activeFilters.ordenar_por ?? 'mais recentes primeiro',
      bairro_id: activeFilters.bairros?.map((b) => b.id),
      construtora: activeFilters.construtoras?.map((c) => c.id),
      comodidades: activeFilters.comodidades,
      endereco: activeFilters.endereco,
      incluir_nao_publicados: activeFilters.incluir_nao_publicados,
    });

  const items: Empreendimento[] = data?.pages.flatMap((p) => p.dados) ?? [];
  const total = data?.pages[0]?.paginacao?.quant_registros;

  const onEndReached = useCallback(() => {
    if (hasNextPage && !isFetchingNextPage) fetchNextPage();
  }, [hasNextPage, isFetchingNextPage, fetchNextPage]);

  function removeEmpresaFilter() {
    setActiveFilters((f) => ({ ...f, empresa_id: undefined, empresa_nome: undefined }));
  }

  function toggleCategory(field: keyof FilterState, value: string) {
    setActiveFilters((prev) => ({
      ...prev,
      [field]: prev[field] === value ? undefined : value,
    }));
  }

  function clearAllFilters() {
    setActiveFilters((f) => (f.ordenar_por ? { ordenar_por: f.ordenar_por } : EMPTY_FILTERS));
  }

  // Constrói um chip removível por filtro ativo. Cada onRemove limpa apenas o
  // próprio filtro atualizando `activeFilters` (modelo de estado inalterado).
  const patch = (p: Partial<FilterState>) => setActiveFilters((f) => ({ ...f, ...p }));
  const activeChips: ActiveChip[] = [];

  if (activeFilters.regiao) {
    activeChips.push({
      key: 'regiao',
      label: REGIAO_OPTIONS.find((r) => r.value === activeFilters.regiao)?.label ?? activeFilters.regiao,
      onRemove: () => patch({ regiao: undefined }),
    });
  }
  if (activeFilters.status_construcao) {
    activeChips.push({
      key: 'status',
      label: STATUS_LABELS[activeFilters.status_construcao] ?? activeFilters.status_construcao,
      onRemove: () => patch({ status_construcao: undefined }),
    });
  }
  if (activeFilters.tipo_imovel) {
    activeChips.push({
      key: 'tipo',
      label: TIPO_LABELS[activeFilters.tipo_imovel] ?? activeFilters.tipo_imovel,
      onRemove: () => patch({ tipo_imovel: undefined }),
    });
  }
  if (activeFilters.tipologia) {
    activeChips.push({ key: 'tipologia', label: activeFilters.tipologia, onRemove: () => patch({ tipologia: undefined }) });
  }
  if (activeFilters.quant_quartos) {
    const v = activeFilters.quant_quartos;
    activeChips.push({ key: 'quartos', label: `${v} quarto${v === '1' ? '' : 's'}`, onRemove: () => patch({ quant_quartos: undefined }) });
  }
  if (activeFilters.quant_suites) {
    const v = activeFilters.quant_suites;
    activeChips.push({ key: 'suites', label: `${v} suíte${v === '1' ? '' : 's'}`, onRemove: () => patch({ quant_suites: undefined }) });
  }
  if (activeFilters.quant_vagas) {
    const v = activeFilters.quant_vagas;
    activeChips.push({ key: 'vagas', label: `${v} vaga${v === '1' ? '' : 's'}`, onRemove: () => patch({ quant_vagas: undefined }) });
  }
  if (activeFilters.valor_min != null || activeFilters.valor_max != null) {
    activeChips.push({
      key: 'valor',
      label: rangeLabel(activeFilters.valor_min, activeFilters.valor_max, fmtPreco),
      onRemove: () => patch({ valor_min: undefined, valor_max: undefined }),
    });
  }
  if (activeFilters.area_min != null || activeFilters.area_max != null) {
    activeChips.push({
      key: 'area',
      label: rangeLabel(activeFilters.area_min, activeFilters.area_max, (n) => `${n} m²`),
      onRemove: () => patch({ area_min: undefined, area_max: undefined }),
    });
  }
  if (activeFilters.disponiveis) {
    activeChips.push({ key: 'disp', label: 'Só disponíveis', onRemove: () => patch({ disponiveis: undefined }) });
  }
  if (activeFilters.empresa_id) {
    activeChips.push({ key: 'empresa', label: activeFilters.empresa_nome ?? 'Construtora', onRemove: removeEmpresaFilter });
  }
  activeFilters.empreendimentos?.forEach((e) => {
    activeChips.push({
      key: `emp-${e.id}`,
      label: e.label,
      onRemove: () =>
        setActiveFilters((f) => {
          const next = f.empreendimentos?.filter((x) => x.id !== e.id);
          return { ...f, empreendimentos: next?.length ? next : undefined };
        }),
    });
  });
  activeFilters.bairros?.forEach((b) => {
    activeChips.push({
      key: `bairro-${b.id}`,
      label: b.label,
      onRemove: () =>
        setActiveFilters((f) => {
          const next = f.bairros?.filter((x) => x.id !== b.id);
          return { ...f, bairros: next?.length ? next : undefined };
        }),
    });
  });
  activeFilters.construtoras?.forEach((c) => {
    activeChips.push({
      key: `constr-${c.id}`,
      label: c.label,
      onRemove: () =>
        setActiveFilters((f) => {
          const next = f.construtoras?.filter((x) => x.id !== c.id);
          return { ...f, construtoras: next?.length ? next : undefined };
        }),
    });
  });
  activeFilters.comodidades?.forEach((com) => {
    activeChips.push({
      key: `com-${com}`,
      label: com,
      onRemove: () =>
        setActiveFilters((f) => {
          const next = (f.comodidades ?? []).filter((x) => x !== com);
          return { ...f, comodidades: next.length ? next : undefined };
        }),
    });
  });
  if (activeFilters.endereco) {
    activeChips.push({ key: 'endereco', label: activeFilters.endereco, onRemove: () => patch({ endereco: undefined }) });
  }

  return (
    <SafeAreaView style={styles.safe} edges={['top']}>
      <FlatList
        data={items}
        keyExtractor={(item) => item.id}
        renderItem={({ item }) => <EmpreendimentoCard empreendimento={item} />}
        contentContainerStyle={styles.list}
        onEndReached={onEndReached}
        onEndReachedThreshold={0.5}
        refreshControl={
          <RefreshControl
            refreshing={isRefetching}
            onRefresh={refetch}
            tintColor={Palette.primary}
            colors={[Palette.primary]}
          />
        }
        ListHeaderComponent={
          <>
          <View style={styles.headerArea}>
            {/* Logo + região */}
            <Animated.View style={styles.topRow} entering={headerEnter(reduced, 0)}>
              <TouchableOpacity
                style={styles.regiaoBtn}
                onPress={() => { setPendingFilters(activeFilters); setFilterVisible(true); }}
                activeOpacity={0.7}
                accessibilityRole="button"
                accessibilityLabel={`Sua região: ${regiaoLabel}. Toque para abrir os filtros`}
              >
                <View style={styles.logoWrap}>
                  <Image source={require('@/assets/images/blow-logo.png')} style={styles.logo} resizeMode="contain" />
                </View>
                <View style={styles.regiaoTexts}>
                  <Text style={styles.regiaoEyebrow}>SUA REGIÃO</Text>
                  <Text style={styles.regiaoText} numberOfLines={1}>{regiaoLabel}</Text>
                </View>
                <View style={styles.regiaoChevron}>
                  <Ionicons name="chevron-down" size={15} color={Palette.primaryDark} />
                </View>
              </TouchableOpacity>

              <TouchableOpacity
                style={styles.filtrosBtn}
                onPress={() => { setPendingFilters(activeFilters); setFilterVisible(true); }}
                activeOpacity={0.85}
                accessibilityRole="button"
                accessibilityLabel={activeCount > 0 ? `Filtros, ${activeCount} ativos` : 'Abrir filtros'}
              >
                <Ionicons name="options-outline" size={20} color={Palette.white} />
                {activeCount > 0 && (
                  <View style={styles.badge}>
                    <Text style={styles.badgeText}>{activeCount}</Text>
                  </View>
                )}
              </TouchableOpacity>
            </Animated.View>

            {/* Categorias rápidas */}
            <Animated.View entering={headerEnter(reduced, 70)}>
            <FlatList
              horizontal
              data={CATEGORIES}
              keyExtractor={(c) => c.value}
              showsHorizontalScrollIndicator={false}
              contentContainerStyle={styles.categoryRow}
              renderItem={({ item: cat }) => {
                const active = activeFilters[cat.field] === cat.value;
                return (
                  <PressableScale
                    reduced={reduced}
                    style={[styles.categoryChip, active && styles.categoryChipActive]}
                    onPress={() => toggleCategory(cat.field, cat.value)}
                    activeOpacity={0.8}
                    accessibilityRole="button"
                    accessibilityState={{ selected: active }}
                    accessibilityLabel={cat.label}
                  >
                    <Ionicons
                      name={cat.icon}
                      size={15}
                      color={active ? Palette.white : Palette.primary}
                    />
                    <Text style={[styles.categoryText, active && styles.categoryTextActive]}>{cat.label}</Text>
                  </PressableScale>
                );
              }}
            />
            </Animated.View>

            {/* Chips de filtros ativos — remove cada filtro individualmente */}
            {activeChips.length > 0 && (
              <ScrollView
                horizontal
                showsHorizontalScrollIndicator={false}
                contentContainerStyle={styles.chipsRow}
                keyboardShouldPersistTaps="handled"
              >
                {activeChips.map((chip) => (
                  <TouchableOpacity
                    key={chip.key}
                    style={styles.activeChip}
                    onPress={chip.onRemove}
                    activeOpacity={0.75}
                    accessibilityRole="button"
                    accessibilityLabel={`Filtro ${chip.label}. Toque para remover`}
                  >
                    <Text style={styles.activeChipText} numberOfLines={1}>{chip.label}</Text>
                    <Ionicons name="close" size={14} color={Palette.primaryDark} />
                  </TouchableOpacity>
                ))}
                <TouchableOpacity
                  style={styles.clearChip}
                  onPress={clearAllFilters}
                  activeOpacity={0.75}
                  accessibilityRole="button"
                  accessibilityLabel="Limpar todos os filtros"
                >
                  <Ionicons name="close-circle-outline" size={15} color={Palette.textSecondary} />
                  <Text style={styles.clearChipText}>Limpar tudo</Text>
                </TouchableOpacity>
              </ScrollView>
            )}

            <Animated.View style={styles.countRow} entering={headerEnter(reduced, 130)}>
              {total != null ? (
                <Text style={styles.countText}>
                  <Text style={styles.countNumber}>{total}</Text> imóve{total !== 1 ? 'is' : 'l'} encontrado{total !== 1 ? 's' : ''}
                </Text>
              ) : <View />}
              <PressableScale
                reduced={reduced}
                style={styles.sortBtn}
                onPress={() => setSortVisible(true)}
                activeOpacity={0.7}
                accessibilityRole="button"
                accessibilityLabel={`Ordenar por ${ordenarLabel}`}
              >
                <Ionicons name="swap-vertical" size={14} color={Palette.primary} />
                <Text style={styles.sortBtnText}>{ordenarLabel}</Text>
              </PressableScale>
            </Animated.View>
          </View>

          </>
        }
        ListEmptyComponent={
          isLoading ? (
            <View style={styles.skeletons}><SkeletonList count={3} /></View>
          ) : isError ? (
            <EmptyState
              icon="cloud-offline-outline"
              title="Não foi possível carregar"
              message="Verifique sua conexão e tente novamente."
              action={{ label: 'Tentar novamente', onPress: () => refetch() }}
            />
          ) : activeCount > 0 ? (
            <EmptyState
              icon="search-outline"
              title="Nenhum imóvel encontrado"
              message="Nenhum resultado para esses filtros. Tente ampliar sua busca."
              action={{ label: 'Limpar filtros', onPress: clearAllFilters }}
            />
          ) : (
            <EmptyState
              icon="home-outline"
              title="Nenhum imóvel por aqui"
              message="Ainda não há empreendimentos para exibir. Puxe para atualizar."
            />
          )
        }
        ListFooterComponent={
          isFetchingNextPage ? (
            <ActivityIndicator color={Palette.primary} style={styles.footerLoader} />
          ) : null
        }
      />

      <FilterSheet
        visible={filterVisible}
        filters={pendingFilters}
        onChange={setPendingFilters}
        onClose={() => setFilterVisible(false)}
        onApply={() => {
          setActiveFilters(pendingFilters);
          setFilterVisible(false);
        }}
        onClear={() => {
          setPendingFilters(EMPTY_FILTERS);
          setActiveFilters(EMPTY_FILTERS);
          setFilterVisible(false);
        }}
      />

      <Modal visible={sortVisible} transparent animationType="fade" onRequestClose={() => setSortVisible(false)}>
        <TouchableOpacity
          style={styles.sortBackdrop}
          activeOpacity={1}
          onPress={() => setSortVisible(false)}
          accessibilityRole="button"
          accessibilityLabel="Fechar menu de ordenação"
        >
          <Animated.View style={styles.sortMenu} entering={reduced ? undefined : SortMenuEnter}>
            <Text style={styles.sortMenuTitle}>ORDENAR POR</Text>
            {ORDENAR_OPTIONS.map((opt) => {
              const active = (activeFilters.ordenar_por ?? '') === opt.value;
              return (
                <TouchableOpacity
                  key={opt.value}
                  style={styles.sortOption}
                  onPress={() => selectOrdenar(opt.value)}
                  activeOpacity={0.7}
                  accessibilityRole="button"
                  accessibilityState={{ selected: active }}
                  accessibilityLabel={opt.label}
                >
                  <Text style={[styles.sortOptionText, active && styles.sortOptionTextActive]}>{opt.label}</Text>
                  {active && <Ionicons name="checkmark" size={18} color={Palette.primary} />}
                </TouchableOpacity>
              );
            })}
          </Animated.View>
        </TouchableOpacity>
      </Modal>
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  safe: { flex: 1, backgroundColor: Palette.bg },
  headerArea: {
    paddingTop: Spacing.lg,
    paddingBottom: Spacing.xl,
    gap: Spacing.lg,
    backgroundColor: Palette.surface,
    borderBottomLeftRadius: Radius.xxxl,
    borderBottomRightRadius: Radius.xxxl,
    ...Shadow.md,
  },
  topRow: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    paddingHorizontal: Spacing.xl,
    gap: Spacing.md,
  },
  regiaoBtn: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: Spacing.md,
    flexShrink: 1,
    minHeight: 48,
  },
  logoWrap: {
    width: 48,
    height: 48,
    borderRadius: Radius.lg,
    backgroundColor: Palette.primaryLight,
    borderWidth: 1,
    borderColor: Palette.primarySubtle,
    alignItems: 'center',
    justifyContent: 'center',
    ...Shadow.xs,
  },
  logo: {
    width: 28,
    height: 28,
  },
  regiaoTexts: {
    flexShrink: 1,
    gap: 3,
  },
  regiaoEyebrow: {
    fontSize: 10,
    fontWeight: '800',
    color: Palette.primary,
    letterSpacing: 1.2,
  },
  regiaoText: {
    fontFamily: DisplayFont.bold,
    fontSize: 21,
    color: Palette.text,
    letterSpacing: -0.4,
    flexShrink: 1,
  },
  regiaoChevron: {
    width: 24,
    height: 24,
    borderRadius: Radius.full,
    backgroundColor: Palette.primaryLight,
    alignItems: 'center',
    justifyContent: 'center',
  },
  filtrosBtn: {
    width: 48,
    height: 48,
    borderRadius: Radius.lg,
    backgroundColor: Palette.primary,
    alignItems: 'center',
    justifyContent: 'center',
    ...Shadow.lg,
  },
  countRow: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    paddingHorizontal: Spacing.xl,
    minHeight: 38,
  },
  countText: {
    fontSize: 14,
    color: Palette.textSecondary,
    fontWeight: '600',
  },
  countNumber: {
    fontFamily: DisplayFont.bold,
    fontWeight: '800',
    fontSize: 16,
    color: Palette.text,
  },
  sortBtn: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 6,
    borderWidth: 1.5,
    borderColor: Palette.primarySubtle,
    backgroundColor: Palette.primaryLight,
    borderRadius: Radius.full,
    paddingHorizontal: 14,
    paddingVertical: 9,
    minHeight: 38,
  },
  sortBtnText: {
    fontSize: 13,
    fontWeight: '800',
    color: Palette.primaryDark,
  },
  sortBackdrop: {
    flex: 1,
    backgroundColor: Palette.overlayLight,
    justifyContent: 'flex-start',
    alignItems: 'flex-end',
    padding: Spacing.xl,
    paddingTop: 100,
  },
  sortMenu: {
    width: 220,
    backgroundColor: Palette.surface,
    borderRadius: Radius.lg,
    paddingVertical: Spacing.sm,
    borderWidth: 1,
    borderColor: Palette.borderLight,
    ...Shadow.lg,
  },
  sortMenuTitle: {
    fontSize: 11,
    fontWeight: '700',
    color: Palette.textTertiary,
    letterSpacing: 0.8,
    paddingHorizontal: Spacing.lg,
    paddingTop: Spacing.sm,
    paddingBottom: Spacing.sm,
  },
  sortOption: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    paddingHorizontal: Spacing.lg,
    paddingVertical: 12,
    minHeight: 44,
  },
  sortOptionText: {
    fontSize: 14,
    color: Palette.textSecondary,
    fontWeight: '500',
  },
  sortOptionTextActive: {
    color: Palette.primary,
    fontWeight: '700',
  },
  chipsRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: Spacing.sm,
    paddingHorizontal: Spacing.xl,
  },
  activeChip: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 6,
    maxWidth: 220,
    backgroundColor: Palette.primaryLight,
    borderRadius: Radius.full,
    borderWidth: 1,
    borderColor: Palette.primaryMid,
    paddingLeft: 14,
    paddingRight: 10,
    paddingVertical: 8,
    minHeight: 36,
  },
  activeChipText: {
    flexShrink: 1,
    fontSize: 13,
    fontWeight: '700',
    color: Palette.primaryDark,
  },
  clearChip: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 5,
    borderRadius: Radius.full,
    borderWidth: 1.5,
    borderColor: Palette.borderStrong,
    backgroundColor: Palette.surface,
    paddingHorizontal: 14,
    paddingVertical: 8,
    minHeight: 36,
  },
  clearChipText: {
    fontSize: 13,
    fontWeight: '700',
    color: Palette.textSecondary,
  },
  categoryRow: {
    paddingHorizontal: Spacing.xl,
    gap: Spacing.sm,
  },
  categoryChip: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 7,
    paddingHorizontal: 16,
    paddingVertical: 10,
    borderRadius: Radius.full,
    borderWidth: 1.5,
    borderColor: Palette.borderLight,
    backgroundColor: Palette.surfaceVariant,
    minHeight: 42,
  },
  categoryChipActive: {
    borderColor: Palette.primary,
    backgroundColor: Palette.primary,
    ...Shadow.md,
  },
  categoryText: {
    fontSize: 13,
    fontWeight: '700',
    color: Palette.textSecondary,
  },
  categoryTextActive: { color: Palette.white, fontWeight: '800' },

  badge: {
    position: 'absolute',
    top: -5,
    right: -5,
    minWidth: 19,
    height: 19,
    borderRadius: 10,
    paddingHorizontal: 4,
    backgroundColor: Palette.white,
    alignItems: 'center',
    justifyContent: 'center',
    borderWidth: 2,
    borderColor: Palette.primary,
  },
  badgeText: { fontSize: 10, fontWeight: '800', color: Palette.primary },

  skeletons: { paddingTop: Spacing.md },
  list: { paddingTop: Spacing.md, paddingBottom: Spacing.xxxl },
  footerLoader: { paddingVertical: Spacing.xl },

});
