import { useCallback, useEffect, useState } from 'react';
import { useDebounce } from '@/hooks/useDebounce';
import {
  ActivityIndicator,
  FlatList,
  RefreshControl,
  ScrollView,
  StyleSheet,
  Text,
  TextInput,
  TouchableOpacity,
  View,
} from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { Ionicons } from '@expo/vector-icons';
import { useLocalSearchParams } from 'expo-router';
import { useEmpreendimentos } from '@/hooks/useEmpreendimentos';
import { EmpreendimentoCard } from '@/components/EmpreendimentoCard';
import { EmpreendimentoCardCompact } from '@/components/EmpreendimentoCardCompact';
import { FilterSheet } from '@/components/FilterSheet';
import { EmptyState } from '@/components/EmptyState';
import { SkeletonList } from '@/components/SkeletonCard';
import { Palette, Radius, Shadow, Spacing } from '@/constants/theme';
import type { Empreendimento, FilterState } from '@/types';

type ViewMode = 'list' | 'grid';

type SortOption = { label: string; value?: string; special?: string };

const SORT_OPTIONS: SortOption[] = [
  { label: 'Mais Recentes', value: 'mais recentes primeiro' },
  { label: 'Menor Valor', value: 'menor valor da unidade' },
  { label: 'Maior Valor', value: 'maior valor da unidade' },
  { label: 'Disponíveis', special: 'disponiveis' },
];

const EMPTY_FILTERS: FilterState = { search: '' };

const TIPO_LABELS: Record<string, string> = {
  empreendimento: 'Condomínios',
  loteamento: 'Loteamentos',
  'imovel-avulso': 'Avulsos',
};

const STATUS_LABELS: Record<string, string> = {
  'pre-lancamento': 'Pré-Lançamento',
};

const REGIAO_LABELS: Record<string, string> = {
  'belo horizonte': 'BH',
  'salvador': 'Salvador',
  'santa catarina': 'SC',
  'sao paulo': 'SP',
  'uberlandia': 'Uberlândia',
};

function fmtValor(v: number) {
  if (v >= 1_000_000) return `R$ ${(v / 1_000_000).toFixed(1).replace('.', ',')}M`;
  return `R$ ${Math.round(v / 1000)}k`;
}

export default function EmpreendimentosScreen() {
  const params = useLocalSearchParams<{ empresa_id?: string; empresa_nome?: string; status_construcao?: string; regiao?: string }>();
  const [searchText, setSearchText] = useState('');
  const [filterVisible, setFilterVisible] = useState(false);
  const [pendingFilters, setPendingFilters] = useState<FilterState>(EMPTY_FILTERS);
  const [activeFilters, setActiveFilters] = useState<FilterState>(EMPTY_FILTERS);
  const [viewMode, setViewMode] = useState<ViewMode>('list');

  const debouncedSearch = useDebounce(searchText, 400);

  // Apply navigation params (empresa_id from construtoras, status_construcao/regiao from home)
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

  // Count unique filter dimensions (valor range = 1, area range = 1)
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
  ].filter(Boolean).length;

  const { data, isLoading, isError, isFetchingNextPage, fetchNextPage, hasNextPage, refetch, isRefetching } =
    useEmpreendimentos({
      empreendimento: debouncedSearch || undefined,
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
      ordenar_por: activeFilters.ordenar_por,
    });

  const items: Empreendimento[] = data?.pages.flatMap((p) => p.dados) ?? [];
  const total = data?.pages[0]?.paginacao?.quant_registros;

  const onEndReached = useCallback(() => {
    if (hasNextPage && !isFetchingNextPage) fetchNextPage();
  }, [hasNextPage, isFetchingNextPage, fetchNextPage]);

  function handleApply() {
    setActiveFilters(pendingFilters);
    setFilterVisible(false);
  }

  function handleClear() {
    setPendingFilters(EMPTY_FILTERS);
    setActiveFilters(EMPTY_FILTERS);
    setFilterVisible(false);
  }

  function removeFilter(key: keyof FilterState | string) {
    setActiveFilters((f) => {
      if (key === '__valor__') return { ...f, valor_min: undefined, valor_max: undefined };
      if (key === '__area__') return { ...f, area_min: undefined, area_max: undefined };
      if (key === '__empresa__') return { ...f, empresa_id: undefined, empresa_nome: undefined };
      return { ...f, [key]: undefined };
    });
  }

  const hasEmpresaFilter = !!activeFilters.empresa_id;

  return (
    <SafeAreaView style={styles.safe} edges={['top']}>
      {/* ── Header ── */}
      <View style={styles.header}>
        <View>
          <Text style={styles.title}>
            {hasEmpresaFilter && activeFilters.empresa_nome
              ? activeFilters.empresa_nome
              : 'Imóveis'}
          </Text>
          {total != null && (
            <Text style={styles.subtitle}>{total} empreendimento{total !== 1 ? 's' : ''}</Text>
          )}
        </View>
        {hasEmpresaFilter && (
          <TouchableOpacity
            style={styles.clearEmpresaBtn}
            onPress={() => removeFilter('__empresa__')}
          >
            <Ionicons name="close" size={14} color={Palette.primary} />
            <Text style={styles.clearEmpresaText}>Limpar filtro</Text>
          </TouchableOpacity>
        )}
      </View>

      {/* ── Search + Filter row ── */}
      <View style={styles.searchRow}>
        <View style={styles.searchBox}>
          <Ionicons name="search-outline" size={18} color={Palette.textTertiary} />
          <TextInput
            style={styles.searchInput}
            value={searchText}
            onChangeText={setSearchText}
            placeholder="Buscar empreendimento..."
            placeholderTextColor={Palette.textTertiary}
            returnKeyType="search"
          />
          {searchText.length > 0 && (
            <TouchableOpacity onPress={() => setSearchText('')} hitSlop={8}>
              <Ionicons name="close-circle" size={18} color={Palette.textTertiary} />
            </TouchableOpacity>
          )}
        </View>

        <TouchableOpacity
          style={[styles.filterBtn, activeCount > 0 && styles.filterBtnActive]}
          onPress={() => {
            setPendingFilters(activeFilters);
            setFilterVisible(true);
          }}
          activeOpacity={0.8}
        >
          <Ionicons
            name="options-outline"
            size={18}
            color={activeCount > 0 ? Palette.white : Palette.primary}
          />
          {activeCount > 0 && (
            <View style={styles.filterBadge}>
              <Text style={styles.filterBadgeText}>{activeCount}</Text>
            </View>
          )}
        </TouchableOpacity>

        <TouchableOpacity
          style={styles.viewToggle}
          onPress={() => setViewMode((m) => m === 'list' ? 'grid' : 'list')}
          activeOpacity={0.8}
        >
          <Ionicons
            name={viewMode === 'list' ? 'grid-outline' : 'list-outline'}
            size={18}
            color={Palette.primary}
          />
        </TouchableOpacity>
      </View>

      {/* ── Sort chips ── */}
      <ScrollView
        horizontal
        showsHorizontalScrollIndicator={false}
        style={styles.sortScroll}
        contentContainerStyle={styles.sortContent}
      >
        {SORT_OPTIONS.map((opt) => {
          const isActive = opt.special === 'disponiveis'
            ? activeFilters.disponiveis === true
            : activeFilters.ordenar_por === opt.value;
          return (
            <TouchableOpacity
              key={opt.label}
              style={[styles.sortChip, isActive && styles.sortChipActive]}
              onPress={() => {
                if (opt.special === 'disponiveis') {
                  setActiveFilters((f) => ({ ...f, disponiveis: isActive ? undefined : true }));
                } else {
                  setActiveFilters((f) => ({ ...f, ordenar_por: isActive ? undefined : opt.value }));
                }
              }}
              activeOpacity={0.8}
            >
              <Text style={[styles.sortChipText, isActive && styles.sortChipTextActive]}>
                {opt.label}
              </Text>
            </TouchableOpacity>
          );
        })}
      </ScrollView>

      {/* ── Active filter chips (horizontal scroll) ── */}
      {activeCount > 0 && (
        <ScrollView
          horizontal
          showsHorizontalScrollIndicator={false}
          style={styles.chipsScroll}
          contentContainerStyle={styles.chipsContent}
        >
          {activeFilters.status_construcao && (
            <TouchableOpacity
              style={styles.activeChip}
              onPress={() => removeFilter('status_construcao')}
            >
              <Text style={styles.activeChipText}>
                {STATUS_LABELS[activeFilters.status_construcao] ?? activeFilters.status_construcao}
              </Text>
              <Ionicons name="close" size={11} color={Palette.primary} />
            </TouchableOpacity>
          )}
          {activeFilters.tipo_imovel && (
            <TouchableOpacity
              style={styles.activeChip}
              onPress={() => removeFilter('tipo_imovel')}
            >
              <Text style={styles.activeChipText}>
                {TIPO_LABELS[activeFilters.tipo_imovel] ?? activeFilters.tipo_imovel}
              </Text>
              <Ionicons name="close" size={11} color={Palette.primary} />
            </TouchableOpacity>
          )}
          {activeFilters.tipologia && (
            <TouchableOpacity
              style={styles.activeChip}
              onPress={() => removeFilter('tipologia')}
            >
              <Text style={styles.activeChipText}>{activeFilters.tipologia}</Text>
              <Ionicons name="close" size={11} color={Palette.primary} />
            </TouchableOpacity>
          )}
          {activeFilters.quant_quartos && (
            <TouchableOpacity
              style={styles.activeChip}
              onPress={() => removeFilter('quant_quartos')}
            >
              <Text style={styles.activeChipText}>{activeFilters.quant_quartos} quartos</Text>
              <Ionicons name="close" size={11} color={Palette.primary} />
            </TouchableOpacity>
          )}
          {activeFilters.quant_suites && (
            <TouchableOpacity
              style={styles.activeChip}
              onPress={() => removeFilter('quant_suites')}
            >
              <Text style={styles.activeChipText}>{activeFilters.quant_suites} suíte(s)</Text>
              <Ionicons name="close" size={11} color={Palette.primary} />
            </TouchableOpacity>
          )}
          {activeFilters.quant_vagas && (
            <TouchableOpacity
              style={styles.activeChip}
              onPress={() => removeFilter('quant_vagas')}
            >
              <Ionicons name="car-outline" size={11} color={Palette.primary} />
              <Text style={styles.activeChipText}>{activeFilters.quant_vagas} vagas</Text>
              <Ionicons name="close" size={11} color={Palette.primary} />
            </TouchableOpacity>
          )}
          {(activeFilters.valor_min != null || activeFilters.valor_max != null) && (
            <TouchableOpacity
              style={styles.activeChip}
              onPress={() => removeFilter('__valor__')}
            >
              <Ionicons name="cash-outline" size={11} color={Palette.primary} />
              <Text style={styles.activeChipText}>
                {activeFilters.valor_min != null && activeFilters.valor_max != null
                  ? `${fmtValor(activeFilters.valor_min)} – ${fmtValor(activeFilters.valor_max)}`
                  : activeFilters.valor_min != null
                  ? `A partir de ${fmtValor(activeFilters.valor_min)}`
                  : `Até ${fmtValor(activeFilters.valor_max!)}`}
              </Text>
              <Ionicons name="close" size={11} color={Palette.primary} />
            </TouchableOpacity>
          )}
          {(activeFilters.area_min != null || activeFilters.area_max != null) && (
            <TouchableOpacity
              style={styles.activeChip}
              onPress={() => removeFilter('__area__')}
            >
              <Ionicons name="expand-outline" size={11} color={Palette.primary} />
              <Text style={styles.activeChipText}>
                {activeFilters.area_min != null && activeFilters.area_max != null
                  ? `${activeFilters.area_min}–${activeFilters.area_max}m²`
                  : activeFilters.area_min != null
                  ? `Min ${activeFilters.area_min}m²`
                  : `Máx ${activeFilters.area_max}m²`}
              </Text>
              <Ionicons name="close" size={11} color={Palette.primary} />
            </TouchableOpacity>
          )}
          {activeFilters.regiao && (
            <TouchableOpacity
              style={styles.activeChip}
              onPress={() => removeFilter('regiao')}
            >
              <Ionicons name="location-outline" size={11} color={Palette.primary} />
              <Text style={styles.activeChipText}>
                {REGIAO_LABELS[activeFilters.regiao] ?? activeFilters.regiao}
              </Text>
              <Ionicons name="close" size={11} color={Palette.primary} />
            </TouchableOpacity>
          )}
          {activeFilters.disponiveis && (
            <TouchableOpacity
              style={styles.activeChip}
              onPress={() => removeFilter('disponiveis')}
            >
              <Text style={styles.activeChipText}>Disponíveis</Text>
              <Ionicons name="close" size={11} color={Palette.primary} />
            </TouchableOpacity>
          )}
          {activeFilters.empresa_id && (
            <TouchableOpacity
              style={[styles.activeChip, styles.activeChipEmpresa]}
              onPress={() => removeFilter('__empresa__')}
            >
              <Ionicons name="business-outline" size={11} color={Palette.primaryDark} />
              <Text style={[styles.activeChipText, styles.activeChipEmpresaText]}>
                {activeFilters.empresa_nome ?? 'Construtora'}
              </Text>
              <Ionicons name="close" size={11} color={Palette.primaryDark} />
            </TouchableOpacity>
          )}
        </ScrollView>
      )}

      {/* ── List / Grid ── */}
      {isLoading ? (
        <View style={styles.skeletons}>
          <SkeletonList count={3} />
        </View>
      ) : (
        <FlatList
          key={viewMode}
          data={items}
          keyExtractor={(item) => item.id}
          numColumns={viewMode === 'grid' ? 2 : 1}
          columnWrapperStyle={viewMode === 'grid' ? styles.gridRow : undefined}
          renderItem={({ item }) =>
            viewMode === 'grid' ? (
              <EmpreendimentoCardCompact empreendimento={item} fillWidth />
            ) : (
              <EmpreendimentoCard empreendimento={item} />
            )
          }
          contentContainerStyle={viewMode === 'grid' ? styles.gridList : styles.list}
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
          ListEmptyComponent={
            isError ? (
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
                message="Tente ajustar os filtros ou buscar por outro termo."
              />
            )
          }
          ListFooterComponent={
            isFetchingNextPage ? (
              <ActivityIndicator color={Palette.primary} style={styles.footerLoader} />
            ) : null
          }
        />
      )}

      {/* ── Filter bottom sheet ── */}
      <FilterSheet
        visible={filterVisible}
        filters={pendingFilters}
        onChange={setPendingFilters}
        onClose={() => setFilterVisible(false)}
        onApply={handleApply}
        onClear={handleClear}
      />
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  safe: { flex: 1, backgroundColor: Palette.bg },
  header: {
    paddingHorizontal: Spacing.xl,
    paddingTop: Spacing.sm,
    paddingBottom: Spacing.md,
    flexDirection: 'row',
    alignItems: 'flex-end',
    justifyContent: 'space-between',
  },
  title: {
    fontSize: 30,
    fontWeight: '900',
    color: Palette.text,
    letterSpacing: -0.8,
  },
  subtitle: { fontSize: 13, color: Palette.textTertiary, marginTop: 2 },
  clearEmpresaBtn: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 4,
    paddingBottom: 2,
  },
  clearEmpresaText: {
    fontSize: 13,
    color: Palette.primary,
    fontWeight: '600',
  },
  searchRow: {
    flexDirection: 'row',
    paddingHorizontal: Spacing.lg,
    gap: 10,
    marginBottom: Spacing.md,
  },
  searchBox: {
    flex: 1,
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: Palette.surface,
    borderRadius: Radius.lg,
    paddingHorizontal: Spacing.md,
    paddingVertical: 11,
    gap: 8,
    borderWidth: 1.5,
    borderColor: Palette.border,
  },
  searchInput: {
    flex: 1,
    fontSize: 15,
    color: Palette.text,
    padding: 0,
  },
  filterBtn: {
    width: 46,
    height: 46,
    borderRadius: Radius.md,
    borderWidth: 1.5,
    borderColor: Palette.primary,
    alignItems: 'center',
    justifyContent: 'center',
  },
  filterBtnActive: {
    backgroundColor: Palette.primary,
    borderColor: Palette.primary,
  },
  filterBadge: {
    position: 'absolute',
    top: -5,
    right: -5,
    width: 16,
    height: 16,
    borderRadius: 8,
    backgroundColor: Palette.error,
    alignItems: 'center',
    justifyContent: 'center',
  },
  filterBadgeText: { fontSize: 9, fontWeight: '800', color: Palette.white },
  viewToggle: {
    width: 46,
    height: 46,
    borderRadius: Radius.md,
    borderWidth: 1.5,
    borderColor: Palette.border,
    alignItems: 'center',
    justifyContent: 'center',
    backgroundColor: Palette.surface,
  },
  sortScroll: { marginBottom: Spacing.sm },
  sortContent: {
    paddingHorizontal: Spacing.lg,
    gap: 6,
  },
  sortChip: {
    paddingHorizontal: 14,
    paddingVertical: 7,
    borderRadius: Radius.full,
    borderWidth: 1.5,
    borderColor: Palette.border,
    backgroundColor: Palette.surface,
  },
  sortChipActive: {
    backgroundColor: Palette.primaryLight,
    borderColor: Palette.primaryMid,
  },
  sortChipText: {
    fontSize: 13,
    fontWeight: '600',
    color: Palette.textSecondary,
  },
  sortChipTextActive: {
    color: Palette.primary,
  },
  gridRow: {
    gap: 10,
    paddingHorizontal: Spacing.lg,
  },
  gridList: { paddingTop: 4, paddingBottom: 32 },
  chipsScroll: { marginBottom: Spacing.sm },
  chipsContent: {
    paddingHorizontal: Spacing.lg,
    gap: 6,
  },
  activeChip: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 4,
    backgroundColor: Palette.primaryLight,
    borderRadius: Radius.full,
    paddingHorizontal: 10,
    paddingVertical: 5,
    borderWidth: 1,
    borderColor: Palette.primaryMid,
  },
  activeChipText: { fontSize: 12, fontWeight: '600', color: Palette.primary },
  activeChipEmpresa: {
    backgroundColor: Palette.primaryMid,
    borderColor: Palette.primaryDark,
  },
  activeChipEmpresaText: { color: Palette.primaryDark },
  skeletons: { paddingTop: 4 },
  list: { paddingTop: 4, paddingBottom: 32 },
  footerLoader: { paddingVertical: 20 },
});
