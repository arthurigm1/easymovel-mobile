import { useCallback } from 'react';
import { FlatList, RefreshControl, StyleSheet, Text, View } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { useQueries } from '@tanstack/react-query';
import { Ionicons } from '@expo/vector-icons';
import { useFavorites } from '@/store/favorites';
import { getEmpreendimento } from '@/services/empreendimentos';
import { EmpreendimentoCard } from '@/components/EmpreendimentoCard';
import { EmptyState } from '@/components/EmptyState';
import { SkeletonList } from '@/components/SkeletonCard';
import { Palette, Radius, Shadow, Spacing, DisplayFont } from '@/constants/theme';
import type { Empreendimento } from '@/types';

export default function FavoritosScreen() {
  // Favoritos são LOCAIS (SecureStore via store) — sem endpoint de favoritos.
  // Cada id é buscado individualmente via getEmpreendimento; o objeto de detalhe
  // é um superset do card, então renderiza com EmpreendimentoCard.
  const ids = useFavorites((s) => s.ids);
  const hydrated = useFavorites((s) => s.hydrated);

  const results = useQueries({
    queries: ids.map((id) => ({
      queryKey: ['empreendimento', id],
      queryFn: () => getEmpreendimento(id),
      staleTime: 1000 * 60 * 5,
    })),
  });

  const items: Empreendimento[] = results
    .map((r) => r.data?.dados)
    .filter((e): e is Empreendimento => !!e);

  const isLoading = ids.length > 0 && items.length === 0 && results.some((r) => r.isLoading);
  const isRefetching = results.some((r) => r.isRefetching);
  const allErrored = ids.length > 0 && results.length > 0 && results.every((r) => r.isError);

  const onRefresh = useCallback(() => {
    results.forEach((r) => r.refetch());
  }, [results]);

  const count = items.length;

  return (
    <SafeAreaView style={styles.safe} edges={['top']}>
      <FlatList
        data={items}
        keyExtractor={(item) => item.id}
        renderItem={({ item }) => <EmpreendimentoCard empreendimento={item} />}
        contentContainerStyle={styles.list}
        showsVerticalScrollIndicator={false}
        refreshControl={
          <RefreshControl
            refreshing={isRefetching}
            onRefresh={onRefresh}
            tintColor={Palette.primary}
            colors={[Palette.primary]}
          />
        }
        ListHeaderComponent={
          <View
            style={styles.headerArea}
            accessibilityRole="header"
            accessibilityLabel={
              count > 0
                ? `Favoritos, ${count} imóve${count !== 1 ? 'is' : 'l'} salvo${count !== 1 ? 's' : ''}`
                : 'Favoritos'
            }
          >
            <View style={styles.headerRow}>
              <View style={styles.headerTexts}>
                <Text style={styles.eyebrow}>SEUS IMÓVEIS</Text>
                <Text style={styles.title}>Favoritos</Text>
                <Text style={styles.subtitle}>
                  {count > 0 ? (
                    <>
                      <Text style={styles.subtitleStrong}>{count}</Text> imóve{count !== 1 ? 'is' : 'l'}{' '}
                      salvo{count !== 1 ? 's' : ''}
                    </>
                  ) : (
                    'Toque no coração de um imóvel para salvar'
                  )}
                </Text>
              </View>
              <View style={styles.headerIcon}>
                <Ionicons name="heart" size={22} color={Palette.primary} />
              </View>
            </View>
          </View>
        }
        ListEmptyComponent={
          !hydrated || isLoading ? (
            <View style={styles.skeletons}>
              <SkeletonList count={3} />
            </View>
          ) : allErrored ? (
            <EmptyState
              icon="wifi-outline"
              title="Erro de conexão"
              message="Não foi possível carregar seus favoritos."
              action={{ label: 'Tentar novamente', onPress: onRefresh }}
            />
          ) : (
            <EmptyState
              icon="heart-outline"
              title="Nenhum favorito ainda"
              message="Salve os imóveis que você curtir tocando no coração. Eles aparecem aqui quando quiser rever."
            />
          )
        }
      />
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  safe: { flex: 1, backgroundColor: Palette.bg },
  headerArea: {
    paddingTop: Spacing.md,
    paddingBottom: Spacing.lg,
    marginBottom: Spacing.md,
    backgroundColor: Palette.surface,
    borderBottomLeftRadius: Radius.xxl,
    borderBottomRightRadius: Radius.xxl,
    ...Shadow.sm,
  },
  headerRow: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    paddingHorizontal: Spacing.xl,
    gap: Spacing.md,
  },
  headerTexts: { flexShrink: 1, gap: 2 },
  eyebrow: {
    fontSize: 10,
    fontWeight: '700',
    color: Palette.textTertiary,
    letterSpacing: 0.8,
  },
  title: {
    fontFamily: DisplayFont.bold,
    fontSize: 28,
    color: Palette.text,
    letterSpacing: -0.6,
  },
  subtitle: {
    fontSize: 14,
    color: Palette.textSecondary,
    fontWeight: '500',
    marginTop: 1,
  },
  subtitleStrong: { fontWeight: '800', color: Palette.text },
  headerIcon: {
    width: 46,
    height: 46,
    borderRadius: Radius.md,
    backgroundColor: Palette.primaryLight,
    alignItems: 'center',
    justifyContent: 'center',
    borderWidth: 1.5,
    borderColor: Palette.primaryMid,
  },
  skeletons: { paddingTop: Spacing.md },
  list: { paddingTop: Spacing.md, paddingBottom: Spacing.xxxl },
});
