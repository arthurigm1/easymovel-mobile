import { useMemo, useState } from 'react';
import { StyleSheet, Text, TouchableOpacity, View } from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { formatCurrency } from '@/utils/format';
import { Palette, Radius, Shadow, DisplayFont } from '@/constants/theme';

interface Props {
  /** e.valor — preço a partir de (string | number). */
  valor: string | number;
}

// Taxa anual ilustrativa (não é uma cotação oficial).
const ANNUAL_RATE = 0.095; // 9,5% a.a.
const MONTHLY_RATE = Math.pow(1 + ANNUAL_RATE, 1 / 12) - 1;

const ENTRADA_OPTIONS = [10, 20, 30, 40] as const;
const PRAZO_OPTIONS = [120, 180, 240, 360] as const;

/** Parcela PRICE (Sistema Francês de Amortização). */
function pricePayment(principal: number, monthlyRate: number, months: number): number {
  if (principal <= 0) return 0;
  if (monthlyRate <= 0) return principal / months;
  const factor = Math.pow(1 + monthlyRate, months);
  return (principal * monthlyRate * factor) / (factor - 1);
}

export function FinanciamentoSimulator({ valor }: Props) {
  const price = typeof valor === 'string' ? parseFloat(valor) : valor;

  const [entradaPct, setEntradaPct] = useState<number>(20);
  const [prazo, setPrazo] = useState<number>(240);

  const { entradaValor, financiado, parcela } = useMemo(() => {
    const base = !price || isNaN(price) ? 0 : price;
    const entrada = base * (entradaPct / 100);
    const fin = base - entrada;
    return {
      entradaValor: entrada,
      financiado: fin,
      parcela: pricePayment(fin, MONTHLY_RATE, prazo),
    };
  }, [price, entradaPct, prazo]);

  if (!price || isNaN(price)) return null;

  return (
    <View style={styles.card}>
      {/* Parcela em destaque */}
      <View style={styles.resultBlock}>
        <Text style={styles.resultLabel}>Parcela estimada</Text>
        <Text style={styles.resultValue}>
          {formatCurrency(parcela)}
          <Text style={styles.resultPerMonth}>/mês</Text>
        </Text>
        <Text style={styles.resultMeta}>
          {prazo} meses · entrada de {formatCurrency(entradaValor)} · taxa ilustrativa de 9,5% a.a.
        </Text>
      </View>

      {/* Entrada */}
      <View style={styles.controlGroup}>
        <Text style={styles.controlLabel}>Entrada</Text>
        <View style={styles.chipRow}>
          {ENTRADA_OPTIONS.map((opt) => {
            const active = opt === entradaPct;
            return (
              <TouchableOpacity
                key={opt}
                style={[styles.chip, active && styles.chipActive]}
                onPress={() => setEntradaPct(opt)}
                activeOpacity={0.8}
                accessibilityRole="button"
                accessibilityState={{ selected: active }}
                accessibilityLabel={`Entrada de ${opt} por cento`}
              >
                <Text style={[styles.chipText, active && styles.chipTextActive]}>{opt}%</Text>
              </TouchableOpacity>
            );
          })}
        </View>
      </View>

      {/* Prazo */}
      <View style={styles.controlGroup}>
        <Text style={styles.controlLabel}>Prazo</Text>
        <View style={styles.chipRow}>
          {PRAZO_OPTIONS.map((opt) => {
            const active = opt === prazo;
            return (
              <TouchableOpacity
                key={opt}
                style={[styles.chip, active && styles.chipActive]}
                onPress={() => setPrazo(opt)}
                activeOpacity={0.8}
                accessibilityRole="button"
                accessibilityState={{ selected: active }}
                accessibilityLabel={`Prazo de ${opt} meses`}
              >
                <Text style={[styles.chipText, active && styles.chipTextActive]}>{opt}x</Text>
              </TouchableOpacity>
            );
          })}
        </View>
      </View>

      {/* Resumo */}
      <View style={styles.summary}>
        <View style={styles.summaryRow}>
          <Text style={styles.summaryLabel}>Valor do imóvel</Text>
          <Text style={styles.summaryValue}>{formatCurrency(price)}</Text>
        </View>
        <View style={styles.summaryRow}>
          <Text style={styles.summaryLabel}>Valor financiado</Text>
          <Text style={styles.summaryValue}>{formatCurrency(financiado)}</Text>
        </View>
      </View>

      {/* Disclaimer */}
      <View style={styles.disclaimer}>
        <Ionicons name="information-circle-outline" size={14} color={Palette.textTertiary} />
        <Text style={styles.disclaimerText}>
          Simulação ilustrativa. Não é uma proposta ou cotação oficial — condições reais dependem do banco,
          renda e análise de crédito.
        </Text>
      </View>
    </View>
  );
}

const styles = StyleSheet.create({
  card: {
    backgroundColor: Palette.surface,
    borderRadius: Radius.xl,
    padding: 18,
    gap: 18,
    borderWidth: 1,
    borderColor: Palette.borderLight,
    ...Shadow.xs,
  },

  resultBlock: {
    backgroundColor: Palette.primaryLight,
    borderRadius: Radius.lg,
    padding: 16,
    gap: 4,
    borderWidth: 1,
    borderColor: Palette.primaryMid,
  },
  resultLabel: {
    fontSize: 12,
    fontWeight: '700',
    color: Palette.primaryDark,
    textTransform: 'uppercase',
    letterSpacing: 0.5,
  },
  resultValue: {
    fontFamily: DisplayFont.extraBold,
    fontSize: 30,
    color: Palette.primary,
    letterSpacing: -1,
  },
  resultPerMonth: {
    fontFamily: DisplayFont.bold,
    fontSize: 15,
    color: Palette.primaryDark,
    letterSpacing: 0,
  },
  resultMeta: {
    fontSize: 12,
    color: Palette.textSecondary,
    lineHeight: 17,
    marginTop: 2,
  },

  controlGroup: { gap: 8 },
  controlLabel: {
    fontSize: 12.5,
    fontWeight: '700',
    color: Palette.textSecondary,
    textTransform: 'uppercase',
    letterSpacing: 0.4,
  },
  chipRow: {
    flexDirection: 'row',
    gap: 8,
  },
  chip: {
    flex: 1,
    alignItems: 'center',
    justifyContent: 'center',
    paddingVertical: 11,
    borderRadius: Radius.md,
    backgroundColor: Palette.surfaceVariant,
    borderWidth: 1,
    borderColor: Palette.border,
    minHeight: 44,
  },
  chipActive: {
    backgroundColor: Palette.primary,
    borderColor: Palette.primary,
    ...Shadow.sm,
  },
  chipText: {
    fontSize: 14,
    fontWeight: '700',
    color: Palette.textSecondary,
  },
  chipTextActive: {
    color: Palette.white,
  },

  summary: {
    gap: 8,
    paddingTop: 14,
    borderTopWidth: 1,
    borderTopColor: Palette.borderLight,
  },
  summaryRow: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
  },
  summaryLabel: {
    fontSize: 13.5,
    color: Palette.textSecondary,
    fontWeight: '500',
  },
  summaryValue: {
    fontSize: 14,
    color: Palette.text,
    fontWeight: '700',
  },

  disclaimer: {
    flexDirection: 'row',
    alignItems: 'flex-start',
    gap: 6,
  },
  disclaimerText: {
    flex: 1,
    fontSize: 11.5,
    color: Palette.textTertiary,
    lineHeight: 16,
  },
});
