import { useCallback, useState } from 'react';
import {
  ActivityIndicator,
  FlatList,
  RefreshControl,
  StyleSheet,
  Text,
  TouchableOpacity,
  View,
} from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { Ionicons } from '@expo/vector-icons';
import { useEmpreendimentos } from '@/hooks/useEmpreendimentos';
import { EmpreendimentoCard } from '@/components/EmpreendimentoCard';
import { EmptyState } from '@/components/EmptyState';
import { SkeletonCard } from '@/components/SkeletonCard';
import { SearchBar } from '@/components/SearchBar';
import type { Empreendimento } from '@/types';

const STATUS_FILTERS = [
  'Pré-Lançamento',
  'Lançamento',
  'Em Construção',
  'Pronto para Morar',
];

export default function EmpreendimentosScreen() {
  const [search, setSearch] = useState('');
  const [statusFilter, setStatusFilter] = useState<string | null>(null);

  const { data, isLoading, isFetchingNextPage, fetchNextPage, hasNextPage, refetch, isRefetching } =
    useEmpreendimentos({
      empreendimento: search || undefined,
      status_construcao: statusFilter ?? undefined,
    });

  const items: Empreendimento[] = data?.pages.flatMap((p) => p.dados) ?? [];

  const onEndReached = useCallback(() => {
    if (hasNextPage && !isFetchingNextPage) fetchNextPage();
  }, [hasNextPage, isFetchingNextPage, fetchNextPage]);

  return (
    <SafeAreaView style={styles.safe} edges={['top']}>
      {/* Header */}
      <View style={styles.header}>
        <Text style={styles.title}>Imóveis</Text>
      </View>

      {/* Search */}
      <View style={styles.searchWrapper}>
        <SearchBar
          placeholder="Buscar empreendimento..."
          onChangeText={setSearch}
        />
      </View>

      {/* Status filter chips */}
      <FlatList
        horizontal
        data={STATUS_FILTERS}
        keyExtractor={(s) => s}
        contentContainerStyle={styles.chips}
        showsHorizontalScrollIndicator={false}
        renderItem={({ item }) => {
          const active = statusFilter === item;
          return (
            <TouchableOpacity
              style={[styles.chip, active && styles.chipActive]}
              onPress={() => setStatusFilter(active ? null : item)}
              activeOpacity={0.8}
            >
              <Text style={[styles.chipText, active && styles.chipTextActive]}>
                {item}
              </Text>
            </TouchableOpacity>
          );
        }}
      />

      {/* List */}
      {isLoading ? (
        <View>
          {Array.from({ length: 3 }).map((_, i) => (
            <SkeletonCard key={i} />
          ))}
        </View>
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
              tintColor="#1A56DB"
              colors={['#1A56DB']}
            />
          }
          ListEmptyComponent={
            <EmptyState
              icon="home-outline"
              title="Nenhum imóvel encontrado"
              message="Tente ajustar os filtros ou buscar por outro termo."
            />
          }
          ListFooterComponent={
            isFetchingNextPage ? (
              <ActivityIndicator color="#1A56DB" style={styles.footerLoader} />
            ) : null
          }
        />
      )}
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  safe: { flex: 1, backgroundColor: '#F8FAFC' },
  header: {
    paddingHorizontal: 20,
    paddingBottom: 12,
    paddingTop: 8,
  },
  title: {
    fontSize: 28,
    fontWeight: '800',
    color: '#0F172A',
    letterSpacing: -0.5,
  },
  searchWrapper: {
    paddingHorizontal: 16,
    marginBottom: 12,
  },
  chips: {
    paddingHorizontal: 16,
    gap: 8,
    marginBottom: 12,
  },
  chip: {
    paddingHorizontal: 14,
    paddingVertical: 7,
    borderRadius: 20,
    backgroundColor: '#F1F5F9',
    borderWidth: 1.5,
    borderColor: '#E2E8F0',
  },
  chipActive: {
    backgroundColor: '#EBF0FF',
    borderColor: '#1A56DB',
  },
  chipText: {
    fontSize: 13,
    fontWeight: '600',
    color: '#64748B',
  },
  chipTextActive: {
    color: '#1A56DB',
  },
  list: {
    paddingTop: 4,
    paddingBottom: 24,
  },
  footerLoader: {
    paddingVertical: 20,
  },
});
