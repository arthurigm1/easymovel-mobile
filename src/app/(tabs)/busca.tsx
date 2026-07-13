import { useState } from 'react';
import {
  ActivityIndicator,
  FlatList,
  ScrollView,
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
import { SearchBar } from '@/components/SearchBar';
import type { FiltrarEmpreendimentosParams } from '@/types';

const TIPO_OPTIONS = ['Condomínios', 'Loteamentos', 'Avulsos'];
const QUARTOS_OPTIONS = ['1', '2', '3', '4+'];
const STATUS_OPTIONS = ['Pré-Lançamento', 'Lançamento', 'Em Construção', 'Pronto para Morar'];

function FilterSection({ title, children }: { title: string; children: React.ReactNode }) {
  return (
    <View style={styles.section}>
      <Text style={styles.sectionTitle}>{title}</Text>
      <View style={styles.sectionContent}>{children}</View>
    </View>
  );
}

function FilterChip({
  label,
  active,
  onPress,
}: {
  label: string;
  active: boolean;
  onPress: () => void;
}) {
  return (
    <TouchableOpacity
      style={[styles.chip, active && styles.chipActive]}
      onPress={onPress}
      activeOpacity={0.8}
    >
      <Text style={[styles.chipText, active && styles.chipTextActive]}>{label}</Text>
    </TouchableOpacity>
  );
}

type Filters = Pick<
  FiltrarEmpreendimentosParams,
  'empreendimento' | 'status_construcao' | 'quant_quartos' | 'disponiveis'
>;

export default function BuscaScreen() {
  const [search, setSearch] = useState('');
  const [filters, setFilters] = useState<Filters>({});
  const [hasSearched, setHasSearched] = useState(false);

  const { data, isLoading, isFetchingNextPage, fetchNextPage, hasNextPage } =
    useEmpreendimentos(
      hasSearched
        ? { empreendimento: search || undefined, ...filters }
        : { empreendimento: '__noop__' }
    );

  const items = data?.pages.flatMap((p) => p.dados) ?? [];

  function toggle<K extends keyof Filters>(key: K, value: Filters[K]) {
    setFilters((prev) => ({ ...prev, [key]: prev[key] === value ? undefined : value }));
  }

  function handleSearch() {
    setHasSearched(true);
  }

  function handleClear() {
    setSearch('');
    setFilters({});
    setHasSearched(false);
  }

  return (
    <SafeAreaView style={styles.safe} edges={['top']}>
      {/* Fixed top: search + filters */}
      <View style={styles.topArea}>
        <View style={styles.header}>
          <Text style={styles.title}>Buscar</Text>
          {hasSearched && (
            <TouchableOpacity onPress={handleClear}>
              <Text style={styles.clearText}>Limpar</Text>
            </TouchableOpacity>
          )}
        </View>

        <View style={styles.searchRow}>
          <View style={styles.searchFlex}>
            <SearchBar
              placeholder="Nome, bairro, cidade..."
              onChangeText={setSearch}
            />
          </View>
          <TouchableOpacity style={styles.searchBtn} onPress={handleSearch} activeOpacity={0.85}>
            <Ionicons name="search" size={20} color="#FFFFFF" />
          </TouchableOpacity>
        </View>

        <ScrollView style={styles.filtersScroll} showsVerticalScrollIndicator={false}>
          <FilterSection title="Status">
            <View style={styles.chipRow}>
              {STATUS_OPTIONS.map((s) => (
                <FilterChip
                  key={s}
                  label={s}
                  active={filters.status_construcao === s}
                  onPress={() => toggle('status_construcao', s)}
                />
              ))}
            </View>
          </FilterSection>

          <FilterSection title="Quartos">
            <View style={styles.chipRow}>
              {QUARTOS_OPTIONS.map((q) => (
                <FilterChip
                  key={q}
                  label={q}
                  active={filters.quant_quartos === q}
                  onPress={() => toggle('quant_quartos', q)}
                />
              ))}
            </View>
          </FilterSection>

          <FilterSection title="Disponibilidade">
            <FilterChip
              label="Somente disponíveis"
              active={!!filters.disponiveis}
              onPress={() => toggle('disponiveis', filters.disponiveis ? undefined : true)}
            />
          </FilterSection>
        </ScrollView>
      </View>

      {/* Results */}
      {!hasSearched ? (
        <View style={styles.prompt}>
          <Ionicons name="search-outline" size={48} color="#CBD5E1" />
          <Text style={styles.promptText}>Configure os filtros e toque em Buscar</Text>
        </View>
      ) : isLoading ? (
        <ActivityIndicator color="#1A56DB" style={styles.loader} />
      ) : (
        <FlatList
          data={items}
          keyExtractor={(item) => item.id}
          renderItem={({ item }) => <EmpreendimentoCard empreendimento={item} />}
          contentContainerStyle={styles.list}
          onEndReached={() => hasNextPage && !isFetchingNextPage && fetchNextPage()}
          onEndReachedThreshold={0.5}
          ListEmptyComponent={
            <EmptyState
              title="Sem resultados"
              message="Tente ajustar os filtros de busca."
            />
          }
          ListFooterComponent={
            isFetchingNextPage ? (
              <ActivityIndicator color="#1A56DB" style={{ paddingVertical: 20 }} />
            ) : null
          }
        />
      )}
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  safe: { flex: 1, backgroundColor: '#F8FAFC' },
  topArea: {
    backgroundColor: '#FFFFFF',
    paddingBottom: 8,
    borderBottomWidth: 1,
    borderBottomColor: '#E2E8F0',
    maxHeight: '55%',
  },
  header: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    paddingHorizontal: 20,
    paddingTop: 8,
    paddingBottom: 12,
  },
  title: {
    fontSize: 28,
    fontWeight: '800',
    color: '#0F172A',
    letterSpacing: -0.5,
  },
  clearText: {
    fontSize: 14,
    color: '#1A56DB',
    fontWeight: '600',
  },
  searchRow: {
    flexDirection: 'row',
    paddingHorizontal: 16,
    gap: 10,
    marginBottom: 12,
  },
  searchFlex: { flex: 1 },
  searchBtn: {
    backgroundColor: '#1A56DB',
    borderRadius: 12,
    width: 46,
    alignItems: 'center',
    justifyContent: 'center',
  },
  filtersScroll: { paddingHorizontal: 16 },
  section: { marginBottom: 16 },
  sectionTitle: {
    fontSize: 13,
    fontWeight: '700',
    color: '#374151',
    marginBottom: 8,
    textTransform: 'uppercase',
    letterSpacing: 0.5,
  },
  sectionContent: {},
  chipRow: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    gap: 8,
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
  prompt: {
    flex: 1,
    alignItems: 'center',
    justifyContent: 'center',
    gap: 12,
    paddingHorizontal: 32,
  },
  promptText: {
    fontSize: 14,
    color: '#94A3B8',
    textAlign: 'center',
  },
  loader: {
    flex: 1,
    paddingVertical: 40,
  },
  list: {
    paddingTop: 16,
    paddingBottom: 24,
  },
});
