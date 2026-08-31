import { useMemo, useState } from 'react';
import {
  Modal,
  Pressable,
  ScrollView,
  StyleSheet,
  Text,
  TouchableOpacity,
  View,
} from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { FinanciamentoSimulator } from '@/components/FinanciamentoSimulator';
import { formatCurrencyExact } from '@/utils/format';
import { select } from '@/utils/haptics';
import { Palette, Radius, Shadow, Spacing, DisplayFont } from '@/constants/theme';
import type { ParcelamentoItem, UnidadeItem } from '@/types';

interface Props {
  visible: boolean;
  onClose: () => void;
  unit: UnidadeItem | null;
  parcelamentos: ParcelamentoItem[];
  empreendimentoNome: string;
  variosBlocos?: boolean;
}

// Mesma matemática do PWA (ModalTabelaParcelamentos): percentual vem como
// fração (0–1); valor da parcela = valor * percentual / quant_parcelas e o
// total da linha = valor * percentual. O total geral é o valor da unidade.
function fmtPercent(p?: number): string {
  if (p == null) return '—';
  return `${(p * 100).toLocaleString('pt-BR', { maximumFractionDigits: 2 })}%`;
}

export function ParcelamentoSheet({
  visible,
  onClose,
  unit,
  parcelamentos,
  empreendimentoNome,
  variosBlocos,
}: Props) {
  const insets = useSafeAreaInsets();
  const [showSimulator, setShowSimulator] = useState(false);

  const rows = useMemo(
    () => [...parcelamentos].sort((a, b) => (a.ordem ?? 0) - (b.ordem ?? 0)),
    [parcelamentos]
  );

  const valor = unit?.valor != null && !isNaN(Number(unit.valor)) && Number(unit.valor) > 0
    ? Number(unit.valor)
    : null;

  const unitLabel = [
    unit?.tipologia,
    unit?.descricao,
    variosBlocos && unit?.bloco ? `Bloco ${unit.bloco}` : null,
  ]
    .filter(Boolean)
    .join(' · ');

  function handleClose() {
    setShowSimulator(false);
    onClose();
  }

  if (!unit) return null;

  return (
    <Modal
      visible={visible}
      transparent
      animationType="slide"
      statusBarTranslucent
      onRequestClose={handleClose}
    >
      {/* Backdrop */}
      <Pressable
        style={styles.backdrop}
        onPress={handleClose}
        accessibilityRole="button"
        accessibilityLabel="Fechar plano de pagamento"
      />

      {/* Sheet */}
      <View style={[styles.sheet, { paddingBottom: insets.bottom + Spacing.lg }]}>
        <View style={styles.grabber} />

        {/* Header */}
        <View style={styles.header}>
          <View style={styles.headerIcon}>
            <Ionicons name="cash-outline" size={18} color={Palette.primary} />
          </View>
          <View style={styles.headerTexts}>
            <Text style={styles.headerTitle}>Plano de pagamento</Text>
            <Text style={styles.headerSub} numberOfLines={1}>
              {empreendimentoNome}
            </Text>
          </View>
          <TouchableOpacity
            style={styles.closeBtn}
            onPress={handleClose}
            activeOpacity={0.8}
            hitSlop={{ top: 8, bottom: 8, left: 8, right: 8 }}
            accessibilityRole="button"
            accessibilityLabel="Fechar"
          >
            <Ionicons name="close" size={20} color={Palette.textSecondary} />
          </TouchableOpacity>
        </View>

        <ScrollView
          showsVerticalScrollIndicator={false}
          contentContainerStyle={styles.scrollContent}
        >
          {/* Identidade da unidade + valor */}
          <View style={styles.unitCard}>
            <View style={styles.unitCardLeft}>
              {unitLabel ? (
                <Text style={styles.unitName} numberOfLines={2}>{unitLabel}</Text>
              ) : null}
              <Text style={styles.unitValueLabel}>Valor da unidade</Text>
            </View>
            <Text style={styles.unitValue} numberOfLines={1}>
              {valor != null ? formatCurrencyExact(valor) : 'A consultar'}
            </Text>
          </View>

          {/* Parcelas */}
          <View style={styles.table}>
            {rows.map((p, i) => {
              const pct = p.percentual;
              const qtde = p.quant_parcelas;
              const lineTotal = valor != null && pct != null ? valor * pct : null;
              const perInstallment =
                lineTotal != null && qtde != null && qtde > 0 ? lineTotal / qtde : null;
              const a11y = [
                p.descricao ?? `Parcela ${i + 1}`,
                pct != null ? `${fmtPercent(pct)} do valor` : null,
                qtde != null ? `${qtde} ${qtde === 1 ? 'parcela' : 'parcelas'}` : null,
                perInstallment != null ? `de ${formatCurrencyExact(perInstallment)}` : null,
                lineTotal != null ? `total ${formatCurrencyExact(lineTotal)}` : null,
              ]
                .filter(Boolean)
                .join(', ');
              return (
                <View
                  key={p.id}
                  style={[styles.row, i > 0 && styles.rowDivider]}
                  accessible
                  accessibilityLabel={a11y}
                >
                  <View style={styles.rowNum}>
                    <Text style={styles.rowNumText}>{i + 1}</Text>
                  </View>
                  <View style={styles.rowInfo}>
                    <Text style={styles.rowDesc} numberOfLines={1}>
                      {p.descricao ?? `Parcela ${i + 1}`}
                    </Text>
                    <Text style={styles.rowMeta}>
                      {fmtPercent(pct)}
                      {qtde != null ? `  ·  ${qtde}x` : ''}
                    </Text>
                  </View>
                  <View style={styles.rowValues}>
                    <Text style={styles.rowInstallment} numberOfLines={1}>
                      {perInstallment != null ? formatCurrencyExact(perInstallment) : '—'}
                    </Text>
                    {lineTotal != null && qtde != null && qtde > 1 ? (
                      <Text style={styles.rowTotal} numberOfLines={1}>
                        total {formatCurrencyExact(lineTotal)}
                      </Text>
                    ) : null}
                  </View>
                </View>
              );
            })}

            {/* Total geral (= valor da unidade, como no PWA) */}
            {valor != null && (
              <View style={[styles.row, styles.rowDivider, styles.totalRow]}>
                <Text style={styles.totalLabel}>Total</Text>
                <Text style={styles.totalValue}>{formatCurrencyExact(valor)}</Text>
              </View>
            )}
          </View>

          {/* Simular financiamento */}
          {valor != null && (
            <View style={styles.simulatorBlock}>
              <TouchableOpacity
                style={styles.simToggle}
                onPress={() => {
                  select();
                  setShowSimulator((v) => !v);
                }}
                activeOpacity={0.85}
                accessibilityRole="button"
                accessibilityState={{ expanded: showSimulator }}
                accessibilityLabel="Simular financiamento desta unidade"
              >
                <Ionicons name="calculator-outline" size={17} color={Palette.white} />
                <Text style={styles.simToggleText}>Simular financiamento</Text>
                <Ionicons
                  name={showSimulator ? 'chevron-up' : 'chevron-down'}
                  size={16}
                  color={Palette.white}
                />
              </TouchableOpacity>
              {showSimulator && <FinanciamentoSimulator valor={valor} />}
            </View>
          )}

          {/* Disclaimer (mesmo texto do PWA) */}
          <Text style={styles.disclaimer}>
            * Valores sujeitos à aprovação da construtora responsável
          </Text>
        </ScrollView>
      </View>
    </Modal>
  );
}

const styles = StyleSheet.create({
  backdrop: {
    flex: 1,
    backgroundColor: Palette.overlay,
  },
  sheet: {
    backgroundColor: Palette.bg,
    borderTopLeftRadius: Radius.xxl,
    borderTopRightRadius: Radius.xxl,
    maxHeight: '88%',
    ...Shadow.xl,
  },
  grabber: {
    alignSelf: 'center',
    width: 40,
    height: 4,
    borderRadius: Radius.full,
    backgroundColor: Palette.borderStrong,
    marginTop: 10,
    marginBottom: 4,
  },

  // ── Header ──
  header: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 12,
    paddingHorizontal: Spacing.xl,
    paddingVertical: Spacing.md,
  },
  headerIcon: {
    width: 38,
    height: 38,
    borderRadius: Radius.md,
    backgroundColor: Palette.primaryLight,
    alignItems: 'center',
    justifyContent: 'center',
  },
  headerTexts: { flex: 1, gap: 1 },
  headerTitle: {
    fontFamily: DisplayFont.bold,
    fontSize: 17,
    color: Palette.text,
    letterSpacing: -0.3,
  },
  headerSub: {
    fontSize: 12,
    fontWeight: '600',
    color: Palette.textTertiary,
  },
  closeBtn: {
    width: 36,
    height: 36,
    borderRadius: Radius.full,
    backgroundColor: Palette.surfaceVariant,
    alignItems: 'center',
    justifyContent: 'center',
  },

  scrollContent: {
    paddingHorizontal: Spacing.xl,
    paddingTop: Spacing.xs,
    gap: Spacing.lg,
  },

  // ── Unidade + valor ──
  unitCard: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    gap: Spacing.md,
    backgroundColor: Palette.primaryLight,
    borderWidth: 1,
    borderColor: Palette.primaryMid,
    borderRadius: Radius.lg,
    paddingHorizontal: Spacing.lg,
    paddingVertical: 14,
  },
  unitCardLeft: { flex: 1, gap: 2 },
  unitName: {
    fontFamily: DisplayFont.bold,
    fontSize: 15,
    color: Palette.text,
    letterSpacing: -0.2,
  },
  unitValueLabel: {
    fontSize: 11,
    fontWeight: '700',
    color: Palette.primaryDark,
    textTransform: 'uppercase',
    letterSpacing: 0.4,
  },
  unitValue: {
    fontFamily: DisplayFont.extraBold,
    fontSize: 20,
    color: Palette.primary,
    letterSpacing: -0.6,
  },

  // ── Tabela ──
  table: {
    backgroundColor: Palette.surface,
    borderRadius: Radius.lg,
    borderWidth: 1,
    borderColor: Palette.borderLight,
    ...Shadow.xs,
  },
  row: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 12,
    paddingHorizontal: Spacing.lg,
    paddingVertical: 13,
    minHeight: 56,
  },
  rowDivider: {
    borderTopWidth: 1,
    borderTopColor: Palette.borderLight,
  },
  rowNum: {
    width: 24,
    height: 24,
    borderRadius: Radius.full,
    backgroundColor: Palette.surfaceVariant,
    alignItems: 'center',
    justifyContent: 'center',
  },
  rowNumText: {
    fontSize: 11,
    fontWeight: '800',
    color: Palette.textSecondary,
  },
  rowInfo: { flex: 1, gap: 2 },
  rowDesc: {
    fontSize: 14,
    fontWeight: '700',
    color: Palette.text,
    letterSpacing: -0.1,
  },
  rowMeta: {
    fontSize: 12,
    fontWeight: '600',
    color: Palette.textTertiary,
  },
  rowValues: { alignItems: 'flex-end', gap: 2 },
  rowInstallment: {
    fontFamily: DisplayFont.bold,
    fontSize: 14.5,
    color: Palette.text,
    letterSpacing: -0.2,
  },
  rowTotal: {
    fontSize: 11.5,
    fontWeight: '600',
    color: Palette.textTertiary,
  },
  totalRow: {
    justifyContent: 'space-between',
    backgroundColor: Palette.surfaceOverlay,
    borderBottomLeftRadius: Radius.lg,
    borderBottomRightRadius: Radius.lg,
  },
  totalLabel: {
    fontSize: 13,
    fontWeight: '800',
    color: Palette.textSecondary,
    textTransform: 'uppercase',
    letterSpacing: 0.4,
  },
  totalValue: {
    fontFamily: DisplayFont.extraBold,
    fontSize: 17,
    color: Palette.primary,
    letterSpacing: -0.4,
  },

  // ── Simulador ──
  simulatorBlock: { gap: Spacing.md },
  simToggle: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    gap: 8,
    backgroundColor: Palette.primary,
    borderRadius: Radius.lg,
    paddingVertical: 14,
    minHeight: 48,
    ...Shadow.sm,
  },
  simToggleText: {
    fontSize: 14,
    fontWeight: '800',
    color: Palette.white,
  },

  disclaimer: {
    fontSize: 11.5,
    fontStyle: 'italic',
    color: Palette.error,
    textAlign: 'center',
    paddingBottom: Spacing.sm,
  },
});
