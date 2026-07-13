import { useState, useCallback } from 'react';
import {
  ActivityIndicator,
  FlatList,
  RefreshControl,
  StyleSheet,
  Text,
  TextInput,
  TouchableOpacity,
  View,
} from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { Ionicons } from '@expo/vector-icons';
import { useEmpreendimentos } from '@/hooks/useEmpreendimentos';
import { EmpreendimentoCard } from '@/components/EmpreendimentoCard';
import { FilterSheet } from '@/components/FilterSheet';
import { EmptyState } from '@/components/EmptyState';
import { SkeletonList } from '@/components/SkeletonCard';
import { Palette, Radius, Spacing, Shadow } from '@/constants/theme';
import type { Empreendimento, FilterState } from '@/types';

const EMPTY: FilterState = { search: '' };

const QUICK_FILTERS: { label: string; field: keyof FilterState; value: string }[] = [
  { label: 'Pré-Lançamento', field: 'status_construcao', value: 'pre-lancamento' },
  { label: 'Lançamento', field: 'status_construcao', value: 'Lançamento' },
  { label: 'Em Construção', field: 'status_construcao', value: 'Em Construção' },
  { label: 'Pronto', field: 'status_construcao', value: 'Pronto para Morar' },
];

export default function BuscaScreen() {
  const [searchText, setSearchText] = useState('');
  const [committed, setCommitted] = useState('');
  const [filters, setFilters] = useState<FilterState>(EMPTY);
  const [pendingFilters, setPendingFilters] = useState<FilterState>(EMPTY);
  const [filterVisible, setFilterVisible] = useState(false);
  const [hasSearched, setHasSearched] = useState(false);

  const { data, isLoading, isError, isFetchingNextPage, fetchNextPage, hasNextPage, refetch, isRefetching } =
    useEmpreendimentos(
      {
        empreendimento: committed || undefined,
        status_construcao: filters.status_construcao,
        tipo_imovel: filters.tipo_imovel,
        tipologia: filters.tipologia,
        quant_quartos: filters.quant_quartos,
        quant_suites: filters.quant_suites,
        quant_vagas: filters.quant_vagas,
        valor_min: filters.valor_min,
        valor_max: filters.valor_max,
        area_min: filters.area_min,
        area_max: filters.area_max,
        disponiveis: filters.disponiveis,
        regiao: filters.regiao,
        ordenar_por: filters.ordenar_por,
      },
      { enabled: hasSearched }
    );

  const items: Empreendimento[] = data?.pages.flatMap((p) => p.dados) ?? [];
  const total = data?.pages[0]?.paginacao?.quant_registros;

  function doSearch() {
    setCommitted(searchText);
    setHasSearched(true);
  }

  function handleClear() {
    setSearchText('');
    setCommitted('');
    setFilters(EMPTY);
    setPendingFilters(EMPTY);
    setHasSearched(false);
  }

  function toggleQuick(field: keyof FilterState, value: string) {
    const isActive = filters[field] === value;
    setFilters((prev) => ({ ...prev, [field]: isActive ? undefined : value }));
    setHasSearched(true);
  }

  const onEndReached = useCallback(() => {
    if (hasNextPage && !isFetchingNextPage) fetchNextPage();
  }, [hasNextPage, isFetchingNextPage, fetchNextPage]);

  const activeCount = [
    filters.status_construcao,
    filters.tipo_imovel,
    filters.tipologia,
    filters.quant_quartos,
    filters.quant_suites,
    filters.quant_vagas,
    filters.valor_min != null || filters.valor_max != null ? '__val__' : undefined,
    filters.area_min != null || filters.area_max != null ? '__area__' : undefined,
    filters.disponiveis ? '__disp__' : undefined,
    filters.regiao,
  ].filter(Boolean).length;

  return (
    <SafeAreaView style={styles.safe} edges={['top']}>
      {/* Header */}
      <View style={styles.header}>
        <Text style={styles.title}>Buscar</Text>
        {hasSearched && total != null && (
          <Text style={styles.subtitle}>{total} resultado{total !== 1 ? 's' : ''}</Text>
        )}
      </View>

      {/* Search input row */}
      <View style={styles.searchRow}>
        <View style={styles.searchBox}>
          <Ionicons name="search-outline" size={18} color={Palette.textTertiary} />
          <TextInput
            style={styles.searchInput}
            value={searchText}
            onChangeText={setSearchText}
            placeholder="Nome, bairro, cidade..."
            placeholderTextColor={Palette.textTertiary}
            returnKeyType="search"
            onSubmitEditing={doSearch}
            autoFocus={false}
          />
          {searchText.length > 0 && (
            <TouchableOpacity onPress={handleClear} hitSlop={8}>
              <Ionicons name="close-circle" size={18} color={Palette.textTertiary} />
            </TouchableOpacity>
          )}
        </View>

        <TouchableOpacity style={styles.searchBtn} onPress={doSearch} activeOpacity={0.85}>
          <Ionicons name="search" size={18} color={Palette.white} />
        </TouchableOpacity>

        <TouchableOpacity
          style={[styles.filterBtn, activeCount > 0 && styles.filterBtnActive]}
          onPress={() => { setPendingFilters(filters); setFilterVisible(true); }}
          activeOpacity={0.8}
        >
          <Ionicons name="options-outline" size={18} color={activeCount > 0 ? Palette.white : Palette.primary} />
          {activeCount > 0 && (
            <View style={styles.badge}>
              <Text style={styles.badgeText}>{activeCount}</Text>
            </View>
          )}
        </TouchableOpacity>
      </View>

      {/* Quick filters */}
      <FlatList
        horizontal
        data={QUICK_FILTERS}
        keyExtractor={(q) => q.value}
        showsHorizontalScrollIndicator={false}
        contentContainerStyle={styles.quickRow}
        renderItem={({ item: q }) => {
          const active = filters[q.field] === q.value;
          return (
            <TouchableOpacity
              style={[styles.quickChip, active && styles.quickChipActive]}
              onPress={() => toggleQuick(q.field, q.value)}
              activeOpacity={0.8}
            >
              <Text style={[styles.quickText, active && styles.quickTextActive]}>
                {q.label}
              </Text>
            </TouchableOpacity>
          );
        }}
      />

      {/* Results */}
      {!hasSearched ? (
        <View style={styles.promptWrapper}>
          <Text style={styles.promptHeading}>O que você procura?</Text>
          <View style={styles.categoryGrid}>
            {[
              { icon: 'business-outline' as const, label: 'Condomínios', field: 'tipo_imovel' as const, value: 'empreendimento', color: Palette.primary, bg: Palette.primaryLight },
              { icon: 'home-outline' as const, label: 'Loteamentos', field: 'tipo_imovel' as const, value: 'loteamento', color: Palette.success, bg: Palette.successBg },
              { icon: 'rocket-outline' as const, label: 'Pré-Lançamento', field: 'status_construcao' as const, value: 'pre-lancamento', color: Palette.statusPreLancamento, bg: Palette.accentLight },
              { icon: 'construct-outline' as const, label: 'Em Construção', field: 'status_construcao' as const, value: 'Em Construção', color: Palette.statusEmConstrucao, bg: Palette.warningBg },
              { icon: 'checkmark-circle-outline' as const, label: 'Prontos', field: 'status_construcao' as const, value: 'Pronto para Morar', color: Palette.statusPronto, bg: Palette.successBg },
              { icon: 'pricetag-outline' as const, label: 'Promoções', field: 'status_construcao' as const, value: 'Lançamento', color: Palette.statusLancamento, bg: Palette.primaryLight },
            ].map((cat) => (
              <TouchableOpacity
                key={cat.label}
                style={styles.categoryTile}
                onPress={() => {
                  setFilters((prev) => ({ ...prev, [cat.field]: cat.value }));
                  setHasSearched(true);
                }}
                activeOpacity={0.82}
              >
                <View style={[styles.categoryIcon, { backgroundColor: cat.bg }]}>
                  <Ionicons name={cat.icon} size={22} color={cat.color} />
                </View>
                <Text style={styles.categoryLabel}>{cat.label}</Text>
              </TouchableOpacity>
            ))}
          </View>
        </View>
      ) : isLoading ? (
        <View><SkeletonList count={3} /></View>
      ) : (
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
          ListEmptyComponent={
            isError ? (
              <EmptyState
                icon="wifi-outline"
                title="Erro de conexão"
                message="Não foi possível realizar a busca."
                action={{ label: 'Tentar novamente', onPress: () => refetch() }}
              />
            ) : (
              <EmptyState
                icon="home-outline"
                title="Nenhum resultado"
                message="Tente outros termos ou ajuste os filtros."
              />
            )
          }
          ListFooterComponent={
            isFetchingNextPage
              ? <ActivityIndicator color={Palette.primary} style={styles.loader} />
              : null
          }
        />
      )}

      <FilterSheet
        visible={filterVisible}
        filters={pendingFilters}
        onChange={setPendingFilters}
        onClose={() => setFilterVisible(false)}
        onApply={() => {
          setFilters(pendingFilters);
          setHasSearched(true);
          setFilterVisible(false);
        }}
        onClear={() => {
          setFilters(EMPTY);
          setPendingFilters(EMPTY);
          setFilterVisible(false);
        }}
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
  },
  title: {
    fontSize: 30,
    fontWeight: '900',
    color: Palette.text,
    letterSpacing: -0.8,
  },
  subtitle: { fontSize: 13, color: Palette.textTertiary, marginTop: 2 },
  searchRow: {
    flexDirection: 'row',
    paddingHorizontal: Spacing.lg,
    gap: 8,
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
  searchBtn: {
    width: 46,
    height: 46,
    borderRadius: Radius.md,
    backgroundColor: Palette.primary,
    alignItems: 'center',
    justifyContent: 'center',
    ...Shadow.lg,
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
  },
  badge: {
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
  badgeText: { fontSize: 9, fontWeight: '800', color: Palette.white },
  quickRow: {
    paddingHorizontal: Spacing.lg,
    gap: 8,
    marginBottom: Spacing.md,
  },
  quickChip: {
    paddingHorizontal: 14,
    paddingVertical: 8,
    borderRadius: Radius.full,
    borderWidth: 1.5,
    borderColor: Palette.border,
    backgroundColor: Palette.surface,
  },
  quickChipActive: {
    backgroundColor: Palette.primary,
    borderColor: Palette.primary,
  },
  quickText: {
    fontSize: 13,
    fontWeight: '600',
    color: Palette.textSecondary,
  },
  quickTextActive: { color: Palette.white },
  promptWrapper: {
    flex: 1,
    paddingHorizontal: Spacing.lg,
    paddingTop: Spacing.lg,
    gap: 16,
  },
  promptHeading: {
    fontSize: 18,
    fontWeight: '800',
    color: Palette.text,
    letterSpacing: -0.4,
    paddingHorizontal: 4,
  },
  categoryGrid: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    gap: 10,
  },
  categoryTile: {
    width: '47%',
    backgroundColor: Palette.surface,
    borderRadius: Radius.lg,
    padding: 16,
    gap: 10,
    borderWidth: 1,
    borderColor: Palette.borderLight,
    ...Shadow.sm,
  },
  categoryIcon: {
    width: 44,
    height: 44,
    borderRadius: Radius.md,
    alignItems: 'center',
    justifyContent: 'center',
  },
  categoryLabel: {
    fontSize: 13,
    fontWeight: '700',
    color: Palette.text,
    letterSpacing: -0.2,
  },
  list: { paddingTop: 4, paddingBottom: 32 },
  loader: { paddingVertical: 20 },
});
