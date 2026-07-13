import { useState } from 'react';
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
import { getEmpresaNome, isNew } from '@/utils/format';
import { Palette, Radius, Shadow, Spacing } from '@/constants/theme';
import type { Empresa } from '@/types';

const REGIOES: { value: string; label: string }[] = [
  { value: '', label: 'Todas' },
  { value: 'belo horizonte', label: 'Belo Horizonte' },
  { value: 'salvador', label: 'Salvador' },
  { value: 'santa catarina', label: 'Santa Catarina' },
  { value: 'sao paulo', label: 'São Paulo' },
  { value: 'uberlandia', label: 'Uberlândia' },
];

function ConstrutorCard({ empresa }: { empresa: Empresa }) {
  const router = useRouter();
  const nome = getEmpresaNome(empresa);
  const logo = empresa.anexos?.find((a) => a.categoria === 'logo_empresa')?.link;
  const nova = isNew(empresa.criado_em, 30);

  function handlePress() {
    router.push({
      pathname: '/(tabs)/empreendimentos',
      params: { empresa_id: empresa.id, empresa_nome: nome },
    });
  }

  return (
    <TouchableOpacity style={cardStyles.card} onPress={handlePress} activeOpacity={0.85}>
      <View style={cardStyles.logoBox}>
        {logo ? (
          <Image source={logo} style={cardStyles.logo} contentFit="contain" cachePolicy="memory-disk" />
        ) : (
          <View style={cardStyles.logoPlaceholder}>
            <Ionicons name="business-outline" size={26} color={Palette.textTertiary} />
          </View>
        )}
      </View>
      <View style={cardStyles.info}>
        <Text style={cardStyles.nome} numberOfLines={2}>{nome}</Text>
        {empresa._count?.empreendimentos != null && (
          <Text style={cardStyles.count}>
            {empresa._count.empreendimentos} empreendimento{empresa._count.empreendimentos !== 1 ? 's' : ''}
          </Text>
        )}
        {empresa.regiao && (
          <View style={cardStyles.regiao}>
            <Ionicons name="location-outline" size={11} color={Palette.textTertiary} />
            <Text style={cardStyles.regiaoText}>{empresa.regiao}</Text>
          </View>
        )}
      </View>
      {nova && (
        <View style={cardStyles.novaBadge}>
          <Text style={cardStyles.novaText}>Nova</Text>
        </View>
      )}
      <Ionicons name="chevron-forward" size={16} color={Palette.textTertiary} />
    </TouchableOpacity>
  );
}

const cardStyles = StyleSheet.create({
  card: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: Palette.surface,
    borderRadius: Radius.lg,
    marginHorizontal: Spacing.lg,
    marginBottom: 10,
    padding: 14,
    gap: 14,
    ...Shadow.sm,
    borderWidth: 1,
    borderColor: Palette.borderLight,
  },
  logoBox: {
    width: 60,
    height: 60,
    borderRadius: Radius.md,
    overflow: 'hidden',
    borderWidth: 1,
    borderColor: Palette.border,
    backgroundColor: Palette.surfaceVariant,
  },
  logo: { width: 60, height: 60 },
  logoPlaceholder: {
    width: 60,
    height: 60,
    alignItems: 'center',
    justifyContent: 'center',
    backgroundColor: Palette.surfaceVariant,
  },
  info: { flex: 1, gap: 3 },
  nome: { fontSize: 15, fontWeight: '700', color: Palette.text },
  count: { fontSize: 12, color: Palette.textTertiary },
  regiao: { flexDirection: 'row', alignItems: 'center', gap: 3, marginTop: 2 },
  regiaoText: { fontSize: 11, color: Palette.textTertiary },
  novaBadge: {
    backgroundColor: Palette.successBg,
    borderRadius: Radius.full,
    paddingHorizontal: 8,
    paddingVertical: 3,
  },
  novaText: { fontSize: 11, fontWeight: '700', color: Palette.success },
});

export default function ConstutorasScreen() {
  const [search, setSearch] = useState('');
  const [regiao, setRegiao] = useState('');
  const debouncedSearch = useDebounce(search, 400);
  const { data, isLoading, isError, refetch, isRefetching } = useConstrutoras({
    nome_fantasia: debouncedSearch || undefined,
    regiao: regiao || undefined,
  });

  const construtoras: Empresa[] = data?.dados ?? [];

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

      <ScrollView
        horizontal
        showsHorizontalScrollIndicator={false}
        style={styles.regiaoScroll}
        contentContainerStyle={styles.regiaoContent}
      >
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
                  size={11}
                  color={active ? Palette.white : Palette.primary}
                />
              )}
              <Text style={[styles.regiaoChipText, active && styles.regiaoChipTextActive]}>
                {r.label}
              </Text>
            </TouchableOpacity>
          );
        })}
      </ScrollView>

      {isLoading ? (
        <View>{Array.from({ length: 5 }).map((_, i) => <SkeletonRow key={i} />)}</View>
      ) : (
        <FlatList
          data={construtoras}
          keyExtractor={(item) => item.id}
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
    fontSize: 30,
    fontWeight: '900',
    color: Palette.text,
    letterSpacing: -0.8,
  },
  subtitle: { fontSize: 13, color: Palette.textTertiary, marginTop: 2 },
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
  list: { paddingTop: 4, paddingBottom: 32 },
  regiaoScroll: { marginBottom: Spacing.md },
  regiaoContent: {
    paddingHorizontal: Spacing.lg,
    gap: 8,
  },
  regiaoChip: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 5,
    paddingHorizontal: 14,
    paddingVertical: 8,
    borderRadius: Radius.full,
    borderWidth: 1.5,
    borderColor: Palette.primaryMid,
    backgroundColor: Palette.primaryLight,
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
