import { useEffect, useMemo, useRef, useState } from 'react';
import { useDebounce } from '@/hooks/useDebounce';
import {
  Animated,
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
import { Image } from 'expo-image';
import { Ionicons } from '@expo/vector-icons';
import { useRouter } from 'expo-router';
import { useConstrutoras } from '@/hooks/useConstrutoras';
import { EmptyState } from '@/components/EmptyState';
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

// Considera "Nova" uma construtora cadastrada nos últimos 45 dias — só usa o
// campo criado_em que já vem da API (sem inventar dado). Se a data faltar ou
// for inválida, simplesmente não exibe o selo.
function isRecente(criadoEm?: string): boolean {
  if (!criadoEm) return false;
  const t = new Date(criadoEm).getTime();
  if (Number.isNaN(t)) return false;
  const dias = (Date.now() - t) / 86400000;
  return dias >= 0 && dias <= 45;
}

function ConstrutorCard({ empresa }: { empresa: Empresa }) {
  const router = useRouter();
  const nome = getEmpresaNome(empresa);
  const logo = empresa.anexos?.find((a) => a.categoria === 'logo_empresa')?.link;
  const nova = isRecente(empresa.criado_em);
  const scale = useRef(new Animated.Value(1)).current;

  function pressIn() {
    Animated.spring(scale, { toValue: 0.955, useNativeDriver: true, speed: 40, bounciness: 0 }).start();
  }
  function pressOut() {
    Animated.spring(scale, { toValue: 1, useNativeDriver: true, speed: 30, bounciness: 7 }).start();
  }

  function handlePress() {
    router.push({
      pathname: '/(tabs)/inicio',
      params: { empresa_id: empresa.id, empresa_nome: nome },
    });
  }

  return (
    <Animated.View style={[cardStyles.cardWrap, { transform: [{ scale }] }]}>
      <TouchableOpacity
        style={cardStyles.card}
        onPress={handlePress}
        onPressIn={pressIn}
        onPressOut={pressOut}
        activeOpacity={0.9}
        accessibilityRole="button"
        accessibilityLabel={`Ver empreendimentos de ${nome}${nova ? ', construtora nova' : ''}`}
      >
        <View style={cardStyles.logoBox}>
          {logo ? (
            <Image source={logo} style={cardStyles.logo} contentFit="contain" cachePolicy="memory-disk" />
          ) : (
            <View style={cardStyles.logoPlaceholder}>
              <Ionicons name="business" size={26} color={Palette.primaryMid} />
            </View>
          )}
        </View>
        {nova && (
          <View style={cardStyles.novaBadge} pointerEvents="none">
            <Ionicons name="sparkles" size={9} color={Palette.white} />
            <Text style={cardStyles.novaText}>Nova</Text>
          </View>
        )}
        <Text style={cardStyles.nome} numberOfLines={2}>{nome}</Text>
        <View style={cardStyles.hintRow}>
          <Text style={cardStyles.hint}>Ver imóveis</Text>
          <Ionicons name="arrow-forward" size={11} color={Palette.primary} />
        </View>
      </TouchableOpacity>
    </Animated.View>
  );
}

const cardStyles = StyleSheet.create({
  cardWrap: { flex: 1 },
  // O logo preenche o topo do card de ponta a ponta, sem molduras internas —
  // uma única superfície branca limpa, com um hairline separando do nome.
  card: {
    flex: 1,
    alignItems: 'center',
    gap: 6,
    backgroundColor: Palette.surface,
    borderRadius: Radius.xl,
    overflow: 'hidden',
    paddingBottom: 10,
    ...Shadow.sm,
  },
  logoBox: {
    width: '100%',
    aspectRatio: 1,
    backgroundColor: Palette.white,
    alignItems: 'center',
    justifyContent: 'center',
    padding: 12,
    borderBottomWidth: StyleSheet.hairlineWidth,
    borderBottomColor: Palette.borderLight,
  },
  logo: { width: '100%', height: '100%' },
  logoPlaceholder: {
    width: '100%',
    height: '100%',
    alignItems: 'center',
    justifyContent: 'center',
  },
  novaBadge: {
    position: 'absolute',
    top: 6,
    right: 6,
    flexDirection: 'row',
    alignItems: 'center',
    gap: 2,
    paddingLeft: 5,
    paddingRight: 7,
    paddingVertical: 3,
    borderRadius: Radius.full,
    backgroundColor: Palette.primary,
    zIndex: 2,
    ...Shadow.sm,
  },
  novaText: {
    fontSize: 8.5,
    fontWeight: '800',
    color: Palette.white,
    letterSpacing: 0.3,
    textTransform: 'uppercase',
  },
  nome: {
    fontSize: 11.5,
    fontWeight: '700',
    color: Palette.text,
    textAlign: 'center',
    paddingHorizontal: 8,
    minHeight: 30,
  },
  hintRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 3,
    marginTop: -2,
  },
  hint: {
    fontSize: 10,
    fontWeight: '700',
    color: Palette.primary,
    letterSpacing: 0.2,
  },
});

function GridSkeleton() {
  const pulse = useRef(new Animated.Value(0.5)).current;

  useEffect(() => {
    const loop = Animated.loop(
      Animated.sequence([
        Animated.timing(pulse, { toValue: 1, duration: 700, useNativeDriver: true }),
        Animated.timing(pulse, { toValue: 0.5, duration: 700, useNativeDriver: true }),
      ])
    );
    loop.start();
    return () => loop.stop();
  }, [pulse]);

  return (
    <View style={styles.list}>
      <View style={styles.skeletonGrid}>
        {Array.from({ length: 9 }).map((_, i) => (
          <View key={i} style={styles.skeletonCard}>
            <Animated.View style={[styles.skeletonLogo, { opacity: pulse }]} />
            <Animated.View style={[styles.skeletonLine, { opacity: pulse }]} />
          </View>
        ))}
      </View>
    </View>
  );
}

export default function ConstutorasScreen() {
  const [search, setSearch] = useState('');
  const [searchFocused, setSearchFocused] = useState(false);
  const [regiao, setRegiao] = useState('');
  const [sortAsc, setSortAsc] = useState(true);
  const debouncedSearch = useDebounce(search, 400);
  const { data, isLoading, isError, refetch, isRefetching } = useConstrutoras({
    regiao: regiao || undefined,
  });

  const all: Empresa[] = data?.dados ?? [];
  const construtoras = useMemo(() => {
    const term = debouncedSearch.trim().toLowerCase();
    const filtered = term
      ? all.filter((e) => getEmpresaNome(e).toLowerCase().includes(term))
      : all;
    const sorted = [...filtered].sort((a, b) => {
      const cmp = getEmpresaNome(a).localeCompare(getEmpresaNome(b), 'pt-BR', { sensitivity: 'base' });
      return sortAsc ? cmp : -cmp;
    });
    return sorted;
  }, [all, debouncedSearch, sortAsc]);

  return (
    <SafeAreaView style={styles.safe} edges={['top']}>
      <View style={styles.header}>
        <View style={styles.headerTop}>
          <View style={styles.headerTitleWrap}>
            <Text style={styles.title}>Construtoras</Text>
            {construtoras.length > 0 && (
              <Text style={styles.subtitle}>
                {construtoras.length} parceira{construtoras.length !== 1 ? 's' : ''}
                {regiao ? ` · ${REGIOES.find((r) => r.value === regiao)?.label}` : ''}
              </Text>
            )}
          </View>
          <TouchableOpacity
            style={styles.sortBtn}
            onPress={() => setSortAsc((v) => !v)}
            activeOpacity={0.8}
            accessibilityRole="button"
            accessibilityLabel={sortAsc ? 'Ordenar de Z a A' : 'Ordenar de A a Z'}
            accessibilityState={{ selected: true }}
          >
            <Ionicons name="swap-vertical" size={15} color={Palette.primary} />
            <Text style={styles.sortBtnText}>{sortAsc ? 'A–Z' : 'Z–A'}</Text>
          </TouchableOpacity>
        </View>
      </View>

      <View style={styles.searchRow}>
        <View style={[styles.searchBox, searchFocused && styles.searchBoxFocused]}>
          <Ionicons
            name="search-outline"
            size={18}
            color={searchFocused ? Palette.primary : Palette.textTertiary}
          />
          <TextInput
            style={styles.searchInput}
            value={search}
            onChangeText={setSearch}
            onFocus={() => setSearchFocused(true)}
            onBlur={() => setSearchFocused(false)}
            placeholder="Buscar construtora..."
            placeholderTextColor={Palette.textTertiary}
            returnKeyType="search"
            accessibilityLabel="Buscar construtora"
          />
          {search.length > 0 && (
            <TouchableOpacity
              onPress={() => setSearch('')}
              hitSlop={10}
              accessibilityRole="button"
              accessibilityLabel="Limpar busca"
            >
              <Ionicons name="close-circle" size={18} color={Palette.textTertiary} />
            </TouchableOpacity>
          )}
        </View>
      </View>

      <View style={styles.pillsWrap}>
        <ScrollView
          horizontal
          showsHorizontalScrollIndicator={false}
          contentContainerStyle={styles.pills}
        >
          {REGIOES.map((r) => {
            const active = regiao === r.value;
            return (
              <TouchableOpacity
                key={r.value || 'todas'}
                style={[styles.pill, active && styles.pillActive]}
                onPress={() => setRegiao(r.value)}
                activeOpacity={0.85}
                accessibilityRole="button"
                accessibilityState={{ selected: active }}
                accessibilityLabel={`Filtrar por ${r.label}`}
              >
                {r.value === '' && (
                  <Ionicons
                    name="apps"
                    size={13}
                    color={active ? Palette.white : Palette.textTertiary}
                  />
                )}
                <Text style={[styles.pillText, active && styles.pillTextActive]}>{r.label}</Text>
              </TouchableOpacity>
            );
          })}
        </ScrollView>
      </View>

      {isLoading ? (
        <GridSkeleton />
      ) : (
        <FlatList
          key="grid-3"
          data={construtoras}
          keyExtractor={(item) => item.id}
          numColumns={3}
          columnWrapperStyle={styles.gridRow}
          renderItem={({ item }) => <ConstrutorCard empresa={item} />}
          contentContainerStyle={styles.list}
          showsVerticalScrollIndicator={false}
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
  headerTop: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    gap: Spacing.md,
  },
  headerTitleWrap: { flex: 1, gap: 2 },
  title: {
    fontFamily: DisplayFont.extraBold,
    fontSize: 24,
    color: Palette.text,
    letterSpacing: -0.5,
  },
  subtitle: {
    fontSize: 12.5,
    fontWeight: '600',
    color: Palette.textTertiary,
  },
  sortBtn: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 5,
    height: 40,
    paddingHorizontal: Spacing.md,
    borderRadius: Radius.full,
    backgroundColor: Palette.primaryLight,
    borderWidth: 1,
    borderColor: Palette.primarySubtle,
  },
  sortBtnText: {
    fontSize: 12.5,
    fontWeight: '800',
    color: Palette.primaryDark,
    letterSpacing: 0.2,
  },
  searchRow: {
    paddingHorizontal: Spacing.lg,
    marginBottom: Spacing.sm,
  },
  searchBox: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: Palette.surface,
    borderRadius: Radius.lg,
    paddingHorizontal: Spacing.md,
    paddingVertical: 12,
    gap: 8,
    borderWidth: 1.5,
    borderColor: 'transparent',
    ...Shadow.sm,
  },
  searchBoxFocused: {
    borderColor: Palette.primary,
  },
  searchInput: {
    flex: 1,
    fontSize: 15,
    color: Palette.text,
    padding: 0,
  },
  pillsWrap: {
    marginBottom: Spacing.md,
  },
  pills: {
    flexDirection: 'row',
    gap: 8,
    paddingHorizontal: Spacing.lg,
    paddingVertical: 2,
  },
  pill: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 5,
    height: 36,
    paddingHorizontal: Spacing.md,
    borderRadius: Radius.full,
    backgroundColor: Palette.surface,
    ...Shadow.xs,
  },
  pillActive: {
    backgroundColor: Palette.primary,
  },
  pillText: {
    fontSize: 13,
    fontWeight: '600',
    color: Palette.textSecondary,
  },
  pillTextActive: {
    color: Palette.white,
    fontWeight: '700',
  },
  list: { paddingTop: 2, paddingBottom: 32, paddingHorizontal: Spacing.lg },
  gridRow: { gap: 10, marginBottom: 10 },

  // Skeleton
  skeletonGrid: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    gap: 10,
  },
  skeletonCard: {
    width: '31.5%',
    alignItems: 'center',
    gap: Spacing.sm,
    backgroundColor: Palette.surface,
    borderRadius: Radius.xl,
    borderWidth: 1,
    borderColor: Palette.borderLight,
    padding: Spacing.sm,
  },
  skeletonLogo: {
    width: '100%',
    aspectRatio: 1,
    borderRadius: Radius.lg,
    backgroundColor: Palette.surfaceVariant,
  },
  skeletonLine: {
    width: '70%',
    height: 10,
    borderRadius: Radius.full,
    backgroundColor: Palette.surfaceVariant,
    marginBottom: 4,
  },
});
