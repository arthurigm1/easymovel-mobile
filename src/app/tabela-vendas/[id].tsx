import { useMemo, useState } from 'react';
import {
  ActivityIndicator,
  RefreshControl,
  ScrollView,
  StyleSheet,
  Text,
  TouchableOpacity,
  View,
} from 'react-native';
import { SafeAreaView, useSafeAreaInsets } from 'react-native-safe-area-context';
import { useLocalSearchParams, useRouter } from 'expo-router';
import { Ionicons } from '@expo/vector-icons';
import { useEmpreendimento } from '@/hooks/useEmpreendimentos';
import { useAuthStore } from '@/store/auth';
import { SalesTable } from '@/components/SalesTable';
import { EmptyState } from '@/components/EmptyState';
import { ProgressBar } from '@/components/ProgressBar';
import { UnitEditSheet } from '@/components/UnitEditSheet';
import { TabelaIASheet } from '@/components/TabelaIASheet';
import { gerarPdfTabelaVendas } from '@/utils/tabelaPdf';
import toast from '@/utils/toast';
import { tapLight, tapMedium } from '@/utils/haptics';
import { isDonoEmpreendimento, podeVerTabelaVendas } from '@/utils/permissions';
import { Palette, Radius, Shadow, Spacing, DisplayFont } from '@/constants/theme';
import type { UnidadeItem } from '@/types';

// Tela dedicada da tabela de vendas (rota própria, como /empreendimentos/:id/
// tabela-unidades no PWA). Aqui a tabela tem espaço para respirar: resumo de
// vendas, filtros, ações do dono e o PDF para enviar ao cliente.

export default function TabelaVendasScreen() {
  const { id } = useLocalSearchParams<{ id: string }>();
  const router = useRouter();
  const insets = useSafeAreaInsets();
  const user = useAuthStore((s) => s.user);
  const isAuthenticated = useAuthStore((s) => s.isAuthenticated);
  const { data, isLoading, isError, refetch, isRefetching } = useEmpreendimento(id);

  const [editUnit, setEditUnit] = useState<UnidadeItem | null>(null);
  const [addingUnit, setAddingUnit] = useState(false);
  const [tabelaIAVisible, setTabelaIAVisible] = useState(false);
  const [gerandoPdf, setGerandoPdf] = useState(false);

  const e = data?.dados;
  const units = useMemo(() => e?.unidades ?? [], [e]);
  const isOwner = isDonoEmpreendimento(user, e);
  const podeVer = podeVerTabelaVendas(user, e, isAuthenticated);

  const { disponiveis, vendidas } = useMemo(() => {
    let disp = 0;
    let vend = 0;
    for (const u of units) {
      if (u.status === 'Disponível') disp++;
      if (u.status === 'Vendido') vend++;
    }
    return { disponiveis: disp, vendidas: vend };
  }, [units]);

  async function handlePdf() {
    if (!e) return;
    tapMedium();
    setGerandoPdf(true);
    try {
      await gerarPdfTabelaVendas(e, units);
    } catch {
      toast.error('Não foi possível gerar o PDF.');
    } finally {
      setGerandoPdf(false);
    }
  }

  // ── Header (sempre visível) ──
  const header = (
    <View style={styles.header}>
      <TouchableOpacity
        style={styles.backBtn}
        onPress={() => router.back()}
        activeOpacity={0.8}
        hitSlop={{ top: 8, bottom: 8, left: 8, right: 8 }}
        accessibilityRole="button"
        accessibilityLabel="Voltar"
      >
        <Ionicons name="chevron-back" size={22} color={Palette.text} />
      </TouchableOpacity>
      <View style={styles.headerTexts}>
        <Text style={styles.title}>Tabela de vendas</Text>
        {e ? (
          <Text style={styles.subtitle} numberOfLines={1}>
            {e.nome_empreendimento}
          </Text>
        ) : null}
      </View>
      {podeVer && units.length > 0 && (
        <TouchableOpacity
          style={styles.pdfBtn}
          onPress={handlePdf}
          disabled={gerandoPdf}
          activeOpacity={0.85}
          accessibilityRole="button"
          accessibilityState={{ disabled: gerandoPdf, busy: gerandoPdf }}
          accessibilityLabel="Baixar tabela de vendas em PDF"
        >
          {gerandoPdf ? (
            <ActivityIndicator size="small" color={Palette.primary} />
          ) : (
            <>
              <Ionicons name="document-text-outline" size={16} color={Palette.primary} />
              <Text style={styles.pdfBtnText}>PDF</Text>
            </>
          )}
        </TouchableOpacity>
      )}
    </View>
  );

  if (isLoading) {
    return (
      <SafeAreaView style={styles.safe} edges={['top']}>
        {header}
        <View style={styles.center}>
          <ActivityIndicator size="small" color={Palette.primary} />
        </View>
      </SafeAreaView>
    );
  }

  if (isError || !e) {
    return (
      <SafeAreaView style={styles.safe} edges={['top']}>
        {header}
        <View style={styles.center}>
          <EmptyState
            icon="alert-circle-outline"
            title="Erro ao carregar"
            message="Não foi possível carregar a tabela de vendas."
            action={{ label: 'Tentar novamente', onPress: () => refetch() }}
          />
        </View>
      </SafeAreaView>
    );
  }

  // Login/permissão — quem não pode ver não recebe preços.
  if (!podeVer) {
    return (
      <SafeAreaView style={styles.safe} edges={['top']}>
        {header}
        <View style={styles.center}>
          <EmptyState
            icon="lock-closed-outline"
            title={isAuthenticated ? 'Tabela indisponível' : 'Entre para ver a tabela'}
            message={
              isAuthenticated
                ? 'A construtora optou por não exibir a tabela de vendas deste empreendimento.'
                : 'Faça login na sua conta para ver preços e disponibilidade de cada unidade.'
            }
            action={
              isAuthenticated
                ? undefined
                : { label: 'Entrar', onPress: () => router.push('/login') }
            }
          />
        </View>
      </SafeAreaView>
    );
  }

  return (
    <SafeAreaView style={styles.safe} edges={['top']}>
      {header}

      <ScrollView
        contentContainerStyle={[
          styles.content,
          { paddingBottom: insets.bottom + Spacing.xxxl },
        ]}
        showsVerticalScrollIndicator={false}
        refreshControl={
          <RefreshControl
            refreshing={isRefetching}
            onRefresh={refetch}
            tintColor={Palette.primary}
            colors={[Palette.primary]}
          />
        }
      >
        {units.length > 0 && (
          <>
            {/* Resumo de vendas */}
            <View style={styles.summaryCard}>
              <View style={styles.summaryRow}>
                <View style={styles.summaryItem}>
                  <Text style={[styles.summaryValue, { color: Palette.success }]}>
                    {disponiveis}
                  </Text>
                  <Text style={styles.summaryLabel}>Disponíveis</Text>
                </View>
                <View style={styles.summaryDivider} />
                <View style={styles.summaryItem}>
                  <Text style={styles.summaryValue}>{vendidas}</Text>
                  <Text style={styles.summaryLabel}>Vendidas</Text>
                </View>
                <View style={styles.summaryDivider} />
                <View style={styles.summaryItem}>
                  <Text style={styles.summaryValue}>{units.length}</Text>
                  <Text style={styles.summaryLabel}>Total</Text>
                </View>
              </View>
              {e.fracao_vendida != null && e.fracao_vendida > 0 && (
                <View style={styles.progressWrap}>
                  <ProgressBar value={e.fracao_vendida} />
                </View>
              )}
            </View>

            {/* Ações do dono */}
            {isOwner && (
              <View style={styles.ownerActions}>
                <TouchableOpacity
                  style={styles.ownerAction}
                  onPress={() => {
                    tapLight();
                    setAddingUnit(true);
                  }}
                  activeOpacity={0.85}
                  accessibilityRole="button"
                  accessibilityLabel="Adicionar nova unidade"
                >
                  <Ionicons name="add-circle-outline" size={17} color={Palette.primary} />
                  <Text style={styles.ownerActionText}>Adicionar</Text>
                </TouchableOpacity>
                <TouchableOpacity
                  style={[styles.ownerAction, styles.ownerActionIA]}
                  onPress={() => {
                    tapLight();
                    setTabelaIAVisible(true);
                  }}
                  activeOpacity={0.85}
                  accessibilityRole="button"
                  accessibilityLabel="Atualizar tabela de vendas com IA"
                >
                  <Ionicons name="sparkles" size={15} color={Palette.accent} />
                  <Text style={[styles.ownerActionText, styles.ownerActionIAText]}>
                    Atualizar com IA
                  </Text>
                </TouchableOpacity>
              </View>
            )}

            <Text style={styles.hint}>
              {isOwner
                ? 'Toque em uma unidade para editar status e valor.'
                : 'Baixe o PDF para enviar a tabela ao seu cliente.'}
            </Text>
          </>
        )}

        <SalesTable
          units={units}
          varios_blocos={e.varios_blocos}
          onUnitPress={
            isOwner
              ? (unit) => {
                  tapLight();
                  setEditUnit(unit);
                }
              : undefined
          }
        />
      </ScrollView>

      {/* Edição/criação de unidade (dono) */}
      <UnitEditSheet
        visible={editUnit != null || addingUnit}
        onClose={() => {
          setEditUnit(null);
          setAddingUnit(false);
        }}
        unit={editUnit}
        empreendimentoId={e.id}
        allUnits={units}
        variosBlocos={e.varios_blocos}
        onSaved={() => refetch()}
      />

      {/* Atualização por IA (dono) */}
      <TabelaIASheet
        visible={tabelaIAVisible}
        onClose={() => setTabelaIAVisible(false)}
        empreendimentoId={e.id}
        allUnits={units}
        onApplied={() => refetch()}
      />
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  safe: { flex: 1, backgroundColor: Palette.bg },
  center: { flex: 1, alignItems: 'center', justifyContent: 'center' },

  header: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 10,
    paddingHorizontal: Spacing.lg,
    paddingTop: Spacing.sm,
    paddingBottom: Spacing.md,
    borderBottomWidth: StyleSheet.hairlineWidth,
    borderBottomColor: Palette.border,
  },
  backBtn: {
    width: 40,
    height: 40,
    borderRadius: Radius.full,
    backgroundColor: Palette.surfaceVariant,
    alignItems: 'center',
    justifyContent: 'center',
  },
  headerTexts: { flex: 1, gap: 1 },
  title: {
    fontFamily: DisplayFont.extraBold,
    fontSize: 20,
    color: Palette.text,
    letterSpacing: -0.4,
  },
  subtitle: {
    fontSize: 12.5,
    fontWeight: '600',
    color: Palette.textTertiary,
  },
  pdfBtn: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 5,
    height: 40,
    minWidth: 40,
    paddingHorizontal: 12,
    borderRadius: Radius.full,
    backgroundColor: Palette.primaryLight,
    borderWidth: 1,
    borderColor: Palette.primaryMid,
    justifyContent: 'center',
  },
  pdfBtnText: {
    fontSize: 13,
    fontWeight: '800',
    color: Palette.primary,
  },

  content: {
    paddingHorizontal: Spacing.lg,
    paddingTop: Spacing.lg,
    gap: Spacing.md,
  },

  summaryCard: {
    backgroundColor: Palette.surface,
    borderRadius: Radius.xl,
    borderWidth: 1,
    borderColor: Palette.borderLight,
    padding: Spacing.lg,
    gap: Spacing.md,
    ...Shadow.xs,
  },
  summaryRow: {
    flexDirection: 'row',
    alignItems: 'center',
  },
  summaryItem: { flex: 1, alignItems: 'center', gap: 2 },
  summaryDivider: {
    width: 1,
    height: 32,
    backgroundColor: Palette.borderLight,
  },
  summaryValue: {
    fontFamily: DisplayFont.extraBold,
    fontSize: 24,
    color: Palette.text,
    letterSpacing: -0.6,
  },
  summaryLabel: {
    fontSize: 11,
    fontWeight: '700',
    color: Palette.textTertiary,
    textTransform: 'uppercase',
    letterSpacing: 0.4,
  },
  progressWrap: {
    borderTopWidth: 1,
    borderTopColor: Palette.borderLight,
    paddingTop: Spacing.md,
  },

  ownerActions: {
    flexDirection: 'row',
    gap: 8,
  },
  ownerAction: {
    flex: 1,
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    gap: 6,
    minHeight: 46,
    borderRadius: Radius.lg,
    borderWidth: 1.5,
    borderColor: Palette.primaryMid,
    borderStyle: 'dashed',
    backgroundColor: Palette.primaryLight,
  },
  ownerActionText: {
    fontSize: 13.5,
    fontWeight: '800',
    color: Palette.primary,
  },
  ownerActionIA: {
    borderColor: Palette.accentMid,
    backgroundColor: Palette.accentLight,
  },
  ownerActionIAText: { color: Palette.accent },

  hint: {
    fontSize: 12.5,
    color: Palette.textTertiary,
    paddingHorizontal: 2,
  },
});
