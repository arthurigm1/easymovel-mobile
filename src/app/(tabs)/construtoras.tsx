import { useMemo, useState } from 'react';
import { useDebounce } from '@/hooks/useDebounce';
import {
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
import { SkeletonRow } from '@/components/SkeletonCard';
import { Badge } from '@/components/Badge';
import { getEmpresaNome, isNew } from '@/utils/format';
import { Palette, Radius, Shadow, Spacing, DisplayFont } from '@/constants/theme';
import type { Empresa } from '@/types';

// Só regiões com construtoras cadastradas de fato — o backend hoje não tem
// nenhum registro fora de Belo Horizonte (testado exaustivamente).
const REGIOES: { value: string; label: string }[] = [
  { value: '', label: 'Todas' },
  { value: 'belo horizonte', label: 'Belo Horizonte' },
];

function ConstrutorCard({ empresa }: { empresa: Empresa }) {
  const router = useRouter();
  const nome = getEmpresaNome(empresa);
  const logo = empresa.anexos?.find((a) => a.categoria === 'logo_empresa')?.link;
  const nova = isNew(empresa.criado_em, 30);

  function handlePress() {
    router.push({
      pathname: '/(tabs)/inicio',
      params: { empresa_id: empresa.id, empresa_nome: nome },
    });
  }

  return (
    <TouchableOpacity style={cardStyles.cardShadowWrap} onPress={handlePress} activeOpacity={0.85}>
      <View style={cardStyles.card}>
        {nova && (
          <View style={cardStyles.novaBadge}>
            <Badge label="Nova" color={Palette.success} bg={Palette.successBg} size="sm" />
          </View>
        )}
        <View style={cardStyles.logoBox}>
          {logo ? (
            <Image source={logo} style={cardStyles.logo} contentFit="cover" cachePolicy="memory-disk" />
          ) : (
            <View style={cardStyles.logoPlaceholder}>
              <Ionicons name="business-outline" size={30} color={Palette.textTertiary} />
            </View>
          )}
        </View>
        <Text style={cardStyles.nome} numberOfLines={2}>{nome}</Text>
      </View>
    </TouchableOpacity>
  );
}

const cardStyles = StyleSheet.create({
  cardShadowWrap: {
    flex: 1,
    borderRadius: Radius.xl,
    ...Shadow.md,
  },
  card: {
    backgroundColor: Palette.surface,
    borderRadius: Radius.xl,
    padding: 14,
    gap: 10,
    alignItems: 'center',
  },
  novaBadge: {
    position: 'absolute',
    top: 8,
    right: 8,
    zIndex: 1,
  },
  logoBox: {
    width: '100%',
    aspectRatio: 1.4,
    borderRadius: Radius.md,
    overflow: 'hidden',
    backgroundColor: Palette.surfaceVariant,
  },
  logo: { width: '100%', height: '100%' },
  logoPlaceholder: {
    width: '100%',
    height: '100%',
    alignItems: 'center',
    justifyContent: 'center',
    backgroundColor: Palette.surfaceVariant,
  },
  nome: {
    fontSize: 14,
    fontWeight: '700',
    color: Palette.text,
    textAlign: 'center',
  },
});

export default function ConstutorasScreen() {
  const [search, setSearch] = useState('');
  const [regiao, setRegiao] = useState('');
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
          <Text style={styles.subtitle}>{construtoras.length} encontradas</Text>
        )}
      </View>

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

      <View style={styles.regiaoRow}>
        {REGIOES.map((r) => {
          const active = regiao === r.value;
          return (
            <TouchableOpacity
              key={r.value}
              style={[styles.regiaoChip, active && styles.regiaoChipActive]}
              onPress={() => setRegiao(r.value)}
              activeOpacity={0.8}
            >
              {r.value !== '' && (
                <Ionicons
                  name="location-outline"
                  size={12}
                  color={active ? Palette.white : Palette.primary}
                  style={styles.regiaoChipIcon}
                />
              )}
              <Text style={[styles.regiaoChipText, active && styles.regiaoChipTextActive]} numberOfLines={1}>
                {r.label}
              </Text>
            </TouchableOpacity>
          );
        })}
      </View>

      {isLoading ? (
        <View>{Array.from({ length: 5 }).map((_, i) => <SkeletonRow key={i} />)}</View>
      ) : (
        <FlatList
          data={construtoras}
          keyExtractor={(item) => item.id}
          numColumns={2}
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
                message="Tente buscar por outro nome."
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
  subtitle: { fontSize: 12, color: Palette.textTertiary, marginTop: 2, fontWeight: '600' },
  searchBox: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: Palette.surface,
    borderRadius: Radius.lg,
    marginHorizontal: Spacing.lg,
    marginBottom: Spacing.md,
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
  list: { paddingTop: 4, paddingBottom: 32, paddingHorizontal: Spacing.lg },
  gridRow: { gap: 12, marginBottom: 12 },
  regiaoRow: {
    flexDirection: 'row',
    paddingHorizontal: Spacing.lg,
    marginBottom: Spacing.md,
    gap: 8,
  },
  regiaoChip: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingHorizontal: 14,
    paddingVertical: 8,
    borderRadius: Radius.full,
    borderWidth: 1.5,
    borderColor: Palette.primaryMid,
    backgroundColor: Palette.primaryLight,
  },
  regiaoChipIcon: {
    marginRight: 5,
  },
  regiaoChipActive: {
    backgroundColor: Palette.primary,
    borderColor: Palette.primary,
  },
  regiaoChipText: {
    fontSize: 13,
    fontWeight: '600',
    color: Palette.primary,
  },
  regiaoChipTextActive: {
    color: Palette.white,
  },
});
