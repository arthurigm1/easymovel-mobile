import { useMemo, useState } from 'react';
import { useDebounce } from '@/hooks/useDebounce';
import {
  FlatList,
  Modal,
  RefreshControl,
  StyleSheet,
  Text,
  TextInput,
  TouchableOpacity,
  View,
} from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { Image } from 'expo-image';
import { Ionicons } from '@expo/vector-icons';
import { useRouter } from 'expo-router';
import { useConstrutoras } from '@/hooks/useConstrutoras';
import { EmptyState } from '@/components/EmptyState';
import { SkeletonRow } from '@/components/SkeletonCard';
import { REGIAO_OPTIONS } from '@/components/FilterSheet';
import { getEmpresaNome } from '@/utils/format';
import { Palette, Radius, Shadow, Spacing, DisplayFont } from '@/constants/theme';
import type { Empresa } from '@/types';

// Mesmas regiões oferecidas no filtro de Início — se uma região não tiver
// construtoras cadastradas, a lista simplesmente aparece vazia (estado normal),
// em vez de esconder a opção e parecer que não há filtro de região.
const REGIOES: { value: string; label: string }[] = [
  { value: '', label: 'Todas' },
  ...REGIAO_OPTIONS,
];

function ConstrutorCard({ empresa }: { empresa: Empresa }) {
  const router = useRouter();
  const nome = getEmpresaNome(empresa);
  const logo = empresa.anexos?.find((a) => a.categoria === 'logo_empresa')?.link;

  function handlePress() {
    router.push({
      pathname: '/(tabs)/inicio',
      params: { empresa_id: empresa.id, empresa_nome: nome },
    });
  }

  return (
    <TouchableOpacity style={cardStyles.card} onPress={handlePress} activeOpacity={0.8}>
      <View style={cardStyles.logoBox}>
        {logo ? (
          <Image source={logo} style={cardStyles.logo} contentFit="contain" cachePolicy="memory-disk" />
        ) : (
          <View style={cardStyles.logoPlaceholder}>
            <Ionicons name="business-outline" size={22} color={Palette.textTertiary} />
          </View>
        )}
      </View>
      <Text style={cardStyles.nome} numberOfLines={2}>{nome}</Text>
    </TouchableOpacity>
  );
}

const cardStyles = StyleSheet.create({
  card: {
    flex: 1,
    gap: 6,
  },
  logoBox: {
    width: '100%',
    aspectRatio: 1,
    borderRadius: Radius.lg,
    overflow: 'hidden',
    backgroundColor: Palette.surfaceVariant,
    alignItems: 'center',
    justifyContent: 'center',
  },
  logo: { width: '100%', height: '100%' },
  logoPlaceholder: {
    width: '100%',
    height: '100%',
    alignItems: 'center',
    justifyContent: 'center',
  },
  nome: {
    fontSize: 11.5,
    fontWeight: '600',
    color: Palette.textSecondary,
    textAlign: 'center',
  },
});

export default function ConstutorasScreen() {
  const [search, setSearch] = useState('');
  const [regiao, setRegiao] = useState('');
  const [regiaoVisible, setRegiaoVisible] = useState(false);
  const debouncedSearch = useDebounce(search, 400);
  const { data, isLoading, isError, refetch, isRefetching } = useConstrutoras({
    regiao: regiao || undefined,
  });

  const all: Empresa[] = data?.dados ?? [];
  const construtoras = useMemo(() => {
    const term = debouncedSearch.trim().toLowerCase();
    if (!term) return all;
    return all.filter((e) => getEmpresaNome(e).toLowerCase().includes(term));
  }, [all, debouncedSearch]);

  return (
    <SafeAreaView style={styles.safe} edges={['top']}>
      <View style={styles.header}>
        <Text style={styles.title}>Construtoras</Text>
        {construtoras.length > 0 && (
          <Text style={styles.subtitle}>
            <Text style={styles.subtitleNumber}>{construtoras.length}</Text> encontrada{construtoras.length !== 1 ? 's' : ''}
          </Text>
        )}
      </View>

      <View style={styles.searchRow}>
        <View style={styles.searchBox}>
          <Ionicons name="search-outline" size={18} color={Palette.textTertiary} />
          <TextInput
            style={styles.searchInput}
            value={search}
            onChangeText={setSearch}
            placeholder="Buscar construtora..."
            placeholderTextColor={Palette.textTertiary}
          />
          {search.length > 0 && (
            <TouchableOpacity onPress={() => setSearch('')} hitSlop={8}>
              <Ionicons name="close-circle" size={18} color={Palette.textTertiary} />
            </TouchableOpacity>
          )}
        </View>

        <TouchableOpacity
          style={[styles.filterBtn, regiao && styles.filterBtnActive]}
          onPress={() => setRegiaoVisible(true)}
          activeOpacity={0.8}
        >
          <Ionicons name="options-outline" size={19} color={regiao ? Palette.white : Palette.textSecondary} />
          {regiao && <View style={styles.filterDot} />}
        </TouchableOpacity>
      </View>

      <Modal visible={regiaoVisible} transparent animationType="fade" onRequestClose={() => setRegiaoVisible(false)}>
        <TouchableOpacity style={styles.menuBackdrop} activeOpacity={1} onPress={() => setRegiaoVisible(false)}>
          <View style={styles.menu}>
            <Text style={styles.menuTitle}>Região</Text>
            {REGIOES.map((r) => {
              const active = regiao === r.value;
              return (
                <TouchableOpacity
                  key={r.value}
                  style={styles.menuOption}
                  onPress={() => { setRegiao(r.value); setRegiaoVisible(false); }}
                  activeOpacity={0.7}
                >
                  <Text style={[styles.menuOptionText, active && styles.menuOptionTextActive]}>
                    {r.label}
                  </Text>
                  {active && <Ionicons name="checkmark" size={16} color={Palette.primary} />}
                </TouchableOpacity>
              );
            })}
          </View>
        </TouchableOpacity>
      </Modal>

      {isLoading ? (
        <View>{Array.from({ length: 5 }).map((_, i) => <SkeletonRow key={i} />)}</View>
      ) : (
        <FlatList
          key="grid-3"
          data={construtoras}
          keyExtractor={(item) => item.id}
          numColumns={3}
          columnWrapperStyle={styles.gridRow}
          renderItem={({ item }) => <ConstrutorCard empresa={item} />}
          contentContainerStyle={styles.list}
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
                message="Não foi possível carregar as construtoras."
                action={{ label: 'Tentar novamente', onPress: () => refetch() }}
              />
            ) : (
              <EmptyState
                icon="business-outline"
                title="Nenhuma construtora encontrada"
                message={
                  regiao
                    ? 'Ainda não há construtoras cadastradas nessa região.'
                    : 'Tente buscar por outro nome.'
                }
              />
            )
          }
        />
      )}
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
    fontFamily: DisplayFont.extraBold,
    fontSize: 24,
    color: Palette.text,
    letterSpacing: -0.5,
  },
  subtitle: { fontSize: 13, color: Palette.textSecondary, marginTop: 3, fontWeight: '500' },
  subtitleNumber: { fontWeight: '800', color: Palette.text },
  searchRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 10,
    paddingHorizontal: Spacing.lg,
    marginBottom: Spacing.md,
  },
  searchBox: {
    flex: 1,
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: Palette.surface,
    borderRadius: Radius.lg,
    paddingHorizontal: Spacing.md,
    paddingVertical: 12,
    gap: 8,
    ...Shadow.xs,
  },
  searchInput: {
    flex: 1,
    fontSize: 15,
    color: Palette.text,
    padding: 0,
  },
  filterBtn: {
    width: 44,
    height: 44,
    borderRadius: Radius.lg,
    alignItems: 'center',
    justifyContent: 'center',
    backgroundColor: Palette.surface,
    ...Shadow.xs,
  },
  filterBtnActive: {
    backgroundColor: Palette.primary,
  },
  filterDot: {
    position: 'absolute',
    top: 8,
    right: 8,
    width: 7,
    height: 7,
    borderRadius: 4,
    backgroundColor: Palette.white,
    borderWidth: 1.5,
    borderColor: Palette.primary,
  },
  list: { paddingTop: 4, paddingBottom: 32, paddingHorizontal: Spacing.lg },
  gridRow: { gap: 10, marginBottom: 16 },

  menuBackdrop: {
    flex: 1,
    backgroundColor: 'rgba(22,22,29,0.3)',
    alignItems: 'flex-end',
    padding: Spacing.xl,
    paddingTop: 96,
  },
  menu: {
    width: 210,
    backgroundColor: Palette.surface,
    borderRadius: Radius.lg,
    paddingVertical: Spacing.sm,
    ...Shadow.lg,
  },
  menuTitle: {
    fontSize: 11,
    fontWeight: '700',
    color: Palette.textTertiary,
    textTransform: 'uppercase',
    letterSpacing: 0.5,
    paddingHorizontal: Spacing.md,
    paddingTop: Spacing.xs,
    paddingBottom: Spacing.sm,
  },
  menuOption: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    paddingHorizontal: Spacing.md,
    paddingVertical: 10,
  },
  menuOptionText: {
    fontSize: 14,
    color: Palette.textSecondary,
    fontWeight: '500',
  },
  menuOptionTextActive: {
    color: Palette.primary,
    fontWeight: '700',
  },
});
