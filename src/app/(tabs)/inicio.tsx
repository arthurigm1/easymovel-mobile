import { useCallback, useEffect, useRef, useState } from 'react';
import {
  ActivityIndicator,
  FlatList,
  Image,
  Modal,
  RefreshControl,
  StyleSheet,
  Text,
  TouchableOpacity,
  View,
} from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
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

export default function InicioScreen() {
  const router = useRouter();
  const user = useAuthStore((s) => s.user);
  const params = useLocalSearchParams<{
    empresa_id?: string;
    empresa_nome?: string;
    status_construcao?: string;
    regiao?: string;
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

  // Navegação vinda de Construtoras (empresa_id) ou de outros pontos com filtro pré-definido
  useEffect(() => {
    if (params.empresa_id || params.status_construcao || params.regiao) {
      setActiveFilters((prev) => ({
        ...prev,
        ...(params.empresa_id ? { empresa_id: params.empresa_id, empresa_nome: params.empresa_nome } : {}),
        ...(params.status_construcao ? { status_construcao: params.status_construcao } : {}),
        ...(params.regiao ? { regiao: params.regiao } : {}),
      }));
    }
  }, [params.empresa_id, params.status_construcao, params.regiao]);

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
          <View style={styles.headerArea}>
            {/* Logo + região */}
            <View style={styles.topRow}>
              <TouchableOpacity
                style={styles.regiaoBtn}
                onPress={() => { setPendingFilters(activeFilters); setFilterVisible(true); }}
                activeOpacity={0.7}
              >
                <View style={styles.logoWrap}>
                  <Image source={require('@/assets/images/blow-logo.png')} style={styles.logo} resizeMode="contain" />
                </View>
                <View style={styles.regiaoTexts}>
                  <Text style={styles.regiaoEyebrow}>SUA REGIÃO</Text>
                  <View style={styles.regiaoValueRow}>
                    <Text style={styles.regiaoText} numberOfLines={1}>{regiaoLabel}</Text>
                    <Ionicons name="chevron-down" size={16} color={Palette.textSecondary} />
                  </View>
                </View>
              </TouchableOpacity>

              <TouchableOpacity
                style={styles.filtrosBtn}
                onPress={() => { setPendingFilters(activeFilters); setFilterVisible(true); }}
                activeOpacity={0.85}
              >
                <Ionicons name="options-outline" size={17} color={Palette.white} />
                {activeCount > 0 && (
                  <View style={styles.badge}>
                    <Text style={styles.badgeText}>{activeCount}</Text>
                  </View>
                )}
              </TouchableOpacity>
            </View>

            {activeFilters.empresa_id && (
              <TouchableOpacity style={styles.empresaBanner} onPress={removeEmpresaFilter} activeOpacity={0.85}>
                <Ionicons name="business" size={14} color={Palette.primaryDark} />
                <Text style={styles.empresaBannerText} numberOfLines={1}>
                  {activeFilters.empresa_nome ?? 'Construtora'}
                </Text>
                <Ionicons name="close-circle" size={16} color={Palette.primaryDark} />
              </TouchableOpacity>
            )}

            {/* Categorias rápidas */}
            <FlatList
              horizontal
              data={CATEGORIES}
              keyExtractor={(c) => c.value}
              showsHorizontalScrollIndicator={false}
              contentContainerStyle={styles.categoryRow}
              renderItem={({ item: cat }) => {
                const active = activeFilters[cat.field] === cat.value;
                return (
                  <TouchableOpacity
                    style={[styles.categoryChip, active && styles.categoryChipActive]}
                    onPress={() => toggleCategory(cat.field, cat.value)}
                    activeOpacity={0.8}
                  >
                    <Ionicons
                      name={cat.icon}
                      size={14}
                      color={active ? Palette.white : Palette.primary}
                    />
                    <Text style={[styles.categoryText, active && styles.categoryTextActive]}>{cat.label}</Text>
                  </TouchableOpacity>
                );
              }}
            />

            <View style={styles.countRow}>
              {total != null ? (
                <Text style={styles.countText}>
                  <Text style={styles.countNumber}>{total}</Text> imóve{total !== 1 ? 'is' : 'l'} encontrado{total !== 1 ? 's' : ''}
                </Text>
              ) : <View />}
              <TouchableOpacity
                style={styles.sortBtn}
                onPress={() => setSortVisible(true)}
                activeOpacity={0.7}
              >
                <Ionicons name="swap-vertical" size={13} color={Palette.textSecondary} />
                <Text style={styles.sortBtnText}>{ordenarLabel}</Text>
              </TouchableOpacity>
            </View>
          </View>
        }
        ListEmptyComponent={
          isLoading ? (
            <View style={styles.skeletons}><SkeletonList count={3} /></View>
          ) : isError ? (
            <EmptyState
              icon="wifi-outline"
              title="Erro de conexão"
              message="Não foi possível carregar os imóveis."
              action={{ label: 'Tentar novamente', onPress: () => refetch() }}
            />
          ) : (
            <EmptyState
              icon="home-outline"
              title="Nenhum imóvel encontrado"
              message="Tente ajustar a busca ou os filtros."
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
        <TouchableOpacity style={styles.sortBackdrop} activeOpacity={1} onPress={() => setSortVisible(false)}>
          <View style={styles.sortMenu}>
            <Text style={styles.sortMenuTitle}>Ordenar por</Text>
            {ORDENAR_OPTIONS.map((opt) => {
              const active = (activeFilters.ordenar_por ?? '') === opt.value;
              return (
                <TouchableOpacity
                  key={opt.value}
                  style={styles.sortOption}
                  onPress={() => selectOrdenar(opt.value)}
                  activeOpacity={0.7}
                >
                  <Text style={[styles.sortOptionText, active && styles.sortOptionTextActive]}>{opt.label}</Text>
                  {active && <Ionicons name="checkmark" size={16} color={Palette.primary} />}
                </TouchableOpacity>
              );
            })}
          </View>
        </TouchableOpacity>
      </Modal>
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  safe: { flex: 1, backgroundColor: Palette.bg },
  headerArea: {
    paddingTop: Spacing.sm,
    paddingBottom: Spacing.md,
    gap: Spacing.lg,
    backgroundColor: Palette.bg,
    borderBottomLeftRadius: Radius.xl,
    borderBottomRightRadius: Radius.xl,
    ...Shadow.xs,
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
    gap: 10,
    flexShrink: 1,
  },
  logoWrap: {
    width: 40,
    height: 40,
    borderRadius: Radius.md,
    backgroundColor: Palette.primaryLight,
    alignItems: 'center',
    justifyContent: 'center',
  },
  logo: {
    width: 24,
    height: 24,
  },
  regiaoTexts: {
    flexShrink: 1,
    gap: 1,
  },
  regiaoEyebrow: {
    fontSize: 10,
    fontWeight: '700',
    color: Palette.textTertiary,
    letterSpacing: 0.6,
  },
  regiaoValueRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 2,
  },
  regiaoText: {
    fontFamily: DisplayFont.bold,
    fontSize: 19,
    color: Palette.text,
    letterSpacing: -0.3,
    flexShrink: 1,
  },
  filtrosBtn: {
    width: 44,
    height: 44,
    borderRadius: Radius.md,
    backgroundColor: Palette.primary,
    alignItems: 'center',
    justifyContent: 'center',
    ...Shadow.sm,
  },
  countRow: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    paddingHorizontal: Spacing.xl,
  },
  countText: {
    fontSize: 13,
    color: Palette.textSecondary,
    fontWeight: '500',
  },
  countNumber: {
    fontWeight: '800',
    color: Palette.text,
  },
  sortBtn: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 5,
    borderWidth: 1.5,
    borderColor: Palette.border,
    borderRadius: Radius.full,
    paddingHorizontal: 12,
    paddingVertical: 6,
  },
  sortBtnText: {
    fontSize: 12.5,
    fontWeight: '700',
    color: Palette.textSecondary,
  },
  sortBackdrop: {
    flex: 1,
    backgroundColor: 'rgba(0,0,0,0.3)',
    justifyContent: 'flex-start',
    alignItems: 'flex-end',
    padding: Spacing.xl,
    paddingTop: 90,
  },
  sortMenu: {
    width: 200,
    backgroundColor: Palette.surface,
    borderRadius: Radius.lg,
    paddingVertical: Spacing.sm,
    ...Shadow.lg,
  },
  sortMenuTitle: {
    fontSize: 11,
    fontWeight: '700',
    color: Palette.textTertiary,
    textTransform: 'uppercase',
    letterSpacing: 0.5,
    paddingHorizontal: Spacing.md,
    paddingTop: Spacing.xs,
    paddingBottom: Spacing.sm,
  },
  sortOption: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    paddingHorizontal: Spacing.md,
    paddingVertical: 10,
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
  empresaBanner: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 6,
    marginHorizontal: Spacing.lg,
    backgroundColor: Palette.primaryLight,
    borderRadius: Radius.full,
    borderWidth: 1,
    borderColor: Palette.primaryMid,
    paddingHorizontal: 12,
    paddingVertical: 7,
    alignSelf: 'flex-start',
  },
  empresaBannerText: {
    fontSize: 12,
    fontWeight: '700',
    color: Palette.primaryDark,
    flexShrink: 1,
  },
  categoryRow: {
    paddingHorizontal: Spacing.lg,
    gap: 8,
  },
  categoryChip: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 6,
    paddingHorizontal: 14,
    paddingVertical: 9,
    borderRadius: Radius.full,
    borderWidth: 1.5,
    borderColor: Palette.border,
    backgroundColor: Palette.surface,
  },
  categoryChipActive: {
    borderColor: Palette.primary,
    backgroundColor: Palette.primary,
    ...Shadow.xs,
  },
  categoryText: {
    fontSize: 13,
    fontWeight: '600',
    color: Palette.textSecondary,
  },
  categoryTextActive: { color: Palette.white, fontWeight: '700' },

  badge: {
    position: 'absolute',
    top: -4,
    right: -4,
    minWidth: 18,
    height: 18,
    borderRadius: 9,
    paddingHorizontal: 4,
    backgroundColor: Palette.white,
    alignItems: 'center',
    justifyContent: 'center',
    borderWidth: 2,
    borderColor: Palette.primary,
  },
  badgeText: { fontSize: 9.5, fontWeight: '800', color: Palette.primary },

  skeletons: { paddingTop: 4 },
  list: { paddingTop: 4, paddingBottom: 32 },
  footerLoader: { paddingVertical: 20 },
});
