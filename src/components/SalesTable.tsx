import { ScrollView, StyleSheet, Text, TouchableOpacity, View } from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { Palette, Radius, Spacing } from '@/constants/theme';
import { formatCurrency, formatArea } from '@/utils/format';
import type { UnidadeItem } from '@/types';

// Exact colors from frontend statusEmpreendimentoStyle
const STATUS_CFG: Record<string, { bg: string; text: string; dot: string }> = {
  Disponível:   { bg: '#D1FAE5', text: '#065F46', dot: '#18bb3c' },
  Decorado:     { bg: '#EDE9FE', text: '#4C1D95', dot: '#9E77ED' },
  Promoção:     { bg: '#DBEAFE', text: '#1E40AF', dot: '#127efc' },
  Modelo:       { bg: '#FEF3C7', text: '#92400E', dot: '#F79009' },
  Reservado:    { bg: '#FEF9C3', text: '#713F12', dot: '#e1ca00' },
  Vendido:      { bg: '#F1F5F9', text: '#475569', dot: '#474a51' },
  Indisponível: { bg: '#FEE2E2', text: '#991B1B', dot: '#dc0101' },
};

type BaseColKey = 'tipologia' | 'descricao' | 'area' | 'area_ext' | 'quartos' | 'suites' | 'banheiros' | 'vagas' | 'valor_m2' | 'valor' | 'status';
type ColKey = BaseColKey | 'bloco';

const BASE_COLS: { key: BaseColKey; label: string; width: number }[] = [
  { key: 'tipologia', label: 'Tipologia',  width: 110 },
  { key: 'descricao', label: 'Unidade',    width: 90  },
  { key: 'area',      label: 'Área Int.',  width: 80  },
  { key: 'area_ext',  label: 'Área Ext.', width: 80  },
  { key: 'quartos',   label: 'Qts',       width: 46  },
  { key: 'suites',    label: 'Suítes',    width: 60  },
  { key: 'banheiros', label: 'Banh.',     width: 56  },
  { key: 'vagas',     label: 'Vagas',     width: 56  },
  { key: 'valor_m2',  label: 'R$/m²',    width: 95  },
  { key: 'valor',     label: 'Valor',     width: 130 },
  { key: 'status',    label: 'Status',    width: 115 },
];

// Frontend formula: valor / (area_int + area_ext × 0.3)
function calcValorM2(unit: UnidadeItem): number | null {
  const v = Number(unit.valor);
  const a = Number(unit.area) || 0;
  const aExt = Number(unit.area_externa) || 0;
  const base = a + aExt * 0.3;
  if (!v || !base) return null;
  return Math.round(v / base);
}

function sortUnits(units: UnidadeItem[], hasBlocos: boolean): UnidadeItem[] {
  return [...units].sort((a, b) => {
    if (hasBlocos) {
      const blocoA = (a.bloco ?? '').localeCompare(b.bloco ?? '', 'pt-BR');
      if (blocoA !== 0) return blocoA;
    }
    const da = a.descricao ?? '';
    const db = b.descricao ?? '';
    // Numeric sort when both are purely numeric
    const na = parseInt(da, 10);
    const nb = parseInt(db, 10);
    if (!isNaN(na) && !isNaN(nb)) return na - nb;
    return da.localeCompare(db, 'pt-BR', { numeric: true });
  });
}

function getCell(unit: UnidadeItem, key: ColKey): React.ReactNode {
  switch (key) {
    case 'bloco':     return unit.bloco ?? '—';
    case 'tipologia': return unit.tipologia ?? '—';
    case 'descricao': return unit.descricao ?? '—';
    case 'area':      return formatArea(unit.area) ?? '—';
    case 'area_ext':  return unit.area_externa ? (formatArea(unit.area_externa) ?? '—') : '—';
    case 'quartos':   return unit.quant_quartos != null ? String(unit.quant_quartos) : '—';
    case 'suites':    return unit.quant_suites  != null ? String(unit.quant_suites)  : '—';
    case 'banheiros': return unit.quant_banheiros != null ? String(unit.quant_banheiros) : '—';
    case 'vagas':     return unit.quant_vagas   != null ? String(unit.quant_vagas)   : '—';
    case 'valor_m2': {
      const m2 = calcValorM2(unit);
      return m2 ? formatCurrency(m2) ?? '—' : '—';
    }
    case 'valor': return formatCurrency(unit.valor);
    case 'status': {
      const cfg = unit.status ? (STATUS_CFG[unit.status] ?? { bg: Palette.surfaceVariant, text: Palette.textSecondary, dot: Palette.border }) : { bg: Palette.surfaceVariant, text: Palette.textSecondary, dot: Palette.border };
      return (
        <View style={[styles.statusPill, { backgroundColor: cfg.bg }]}>
          <View style={[styles.statusDot, { backgroundColor: cfg.dot }]} />
          <Text style={[styles.statusText, { color: cfg.text }]} numberOfLines={1}>{unit.status ?? '—'}</Text>
        </View>
      );
    }
    default: return '—';
  }
}

const SHOW_STATUSES = new Set(['Disponível', 'Decorado', 'Promoção', 'Modelo']);

interface Props {
  units: UnidadeItem[];
  varios_blocos?: boolean;
  onUnitPress?: (unit: UnidadeItem) => void;
}

export function SalesTable({ units, varios_blocos, onUnitPress }: Props) {
  const available = units.filter((u) => SHOW_STATUSES.has(u.status ?? '') && u.valor);
  const sorted = sortUnits(available, !!(varios_blocos || available.some((u) => u.bloco)));

  const hasBlocos    = sorted.some((u) => u.bloco);
  const hasAreaExt   = sorted.some((u) => (u.area_externa ?? 0) > 0);
  const hasBanheiros = sorted.some((u) => u.quant_banheiros != null);
  const hasValorM2   = sorted.some((u) => calcValorM2(u) !== null);
  const hasTipologia = sorted.some((u) => u.tipologia);

  const COLS: { key: ColKey; label: string; width: number }[] = [
    ...(hasBlocos ? [{ key: 'bloco' as ColKey, label: 'Bloco', width: 70 }] : []),
    ...BASE_COLS.filter((c) => {
      if (c.key === 'tipologia' && !hasTipologia) return false;
      if (c.key === 'area_ext'  && !hasAreaExt)   return false;
      if (c.key === 'banheiros' && !hasBanheiros)  return false;
      if (c.key === 'valor_m2'  && !hasValorM2)   return false;
      return true;
    }),
  ];

  if (sorted.length === 0) {
    return (
      <View style={styles.empty}>
        <Ionicons name="home-outline" size={40} color={Palette.textDisabled} />
        <Text style={styles.emptyTitle}>Sem unidades disponíveis</Text>
        <Text style={styles.emptyText}>Todas as unidades estão vendidas ou indisponíveis no momento.</Text>
      </View>
    );
  }

  const dispCount = sorted.filter((u) => u.status === 'Disponível').length;

  return (
    <View style={styles.wrapper}>
      {/* Summary bar */}
      <View style={styles.summaryBar}>
        <View style={styles.summaryItem}>
          <Text style={styles.summaryValue}>{sorted.length}</Text>
          <Text style={styles.summaryLabel}>Listadas</Text>
        </View>
        <View style={styles.summaryDivider} />
        <View style={styles.summaryItem}>
          <Text style={[styles.summaryValue, { color: STATUS_CFG.Disponível.dot }]}>{dispCount}</Text>
          <Text style={styles.summaryLabel}>Disponíveis</Text>
        </View>
        <View style={styles.summaryDivider} />
        <View style={styles.summaryItem}>
          <Text style={styles.summaryValue}>{sorted.filter((u) => u.status === 'Promoção').length}</Text>
          <Text style={styles.summaryLabel}>Promoção</Text>
        </View>
      </View>

      <ScrollView horizontal showsHorizontalScrollIndicator={false}>
        <View>
          {/* Header */}
          <View style={[styles.row, styles.headerRow]}>
            {COLS.map((col) => (
              <Text key={col.key} style={[styles.headerCell, { width: col.width }]}>
                {col.label}
              </Text>
            ))}
          </View>

          {/* Rows */}
          {sorted.map((unit, idx) => (
            <TouchableOpacity
              key={unit.id}
              style={[styles.row, idx % 2 === 0 ? styles.rowEven : styles.rowOdd]}
              onPress={() => onUnitPress?.(unit)}
              activeOpacity={onUnitPress ? 0.7 : 1}
            >
              {COLS.map((col) => {
                const content = getCell(unit, col.key);
                return (
                  <View key={col.key} style={[styles.cell, { width: col.width }]}>
                    {typeof content === 'string' ? (
                      <Text style={styles.cellText} numberOfLines={1}>{content}</Text>
                    ) : (
                      content
                    )}
                  </View>
                );
              })}
            </TouchableOpacity>
          ))}
        </View>
      </ScrollView>
    </View>
  );
}

const styles = StyleSheet.create({
  wrapper: { gap: 12 },

  summaryBar: {
    flexDirection: 'row',
    backgroundColor: Palette.surface,
    borderRadius: Radius.lg,
    borderWidth: 1,
    borderColor: Palette.borderLight,
    paddingVertical: 12,
  },
  summaryItem: {
    flex: 1,
    alignItems: 'center',
    gap: 2,
  },
  summaryValue: {
    fontSize: 20,
    fontWeight: '900',
    color: Palette.text,
    letterSpacing: -0.5,
  },
  summaryLabel: {
    fontSize: 10,
    fontWeight: '600',
    color: Palette.textTertiary,
    textTransform: 'uppercase',
    letterSpacing: 0.4,
  },
  summaryDivider: {
    width: 1,
    backgroundColor: Palette.borderLight,
    marginVertical: 4,
  },

  row: {
    flexDirection: 'row',
    alignItems: 'center',
  },
  headerRow: {
    backgroundColor: Palette.primaryLight,
    borderRadius: Radius.sm,
    paddingVertical: 10,
    marginBottom: 2,
  },
  rowEven: {
    backgroundColor: Palette.surface,
    paddingVertical: 10,
  },
  rowOdd: {
    backgroundColor: Palette.surfaceVariant,
    paddingVertical: 10,
  },
  headerCell: {
    fontSize: 10,
    fontWeight: '800',
    color: Palette.primaryDark,
    textTransform: 'uppercase',
    letterSpacing: 0.6,
    paddingHorizontal: 10,
  },
  cell: {
    paddingHorizontal: 10,
    justifyContent: 'center',
  },
  cellText: {
    fontSize: 13,
    color: Palette.text,
    fontWeight: '500',
  },

  statusPill: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 5,
    borderRadius: Radius.full,
    paddingHorizontal: 8,
    paddingVertical: 4,
    alignSelf: 'flex-start',
  },
  statusDot: {
    width: 6,
    height: 6,
    borderRadius: 3,
  },
  statusText: {
    fontSize: 11,
    fontWeight: '700',
  },

  empty: {
    paddingVertical: Spacing.xxl,
    alignItems: 'center',
    gap: 10,
  },
  emptyTitle: {
    fontSize: 16,
    fontWeight: '800',
    color: Palette.text,
  },
  emptyText: {
    fontSize: 13,
    color: Palette.textTertiary,
    textAlign: 'center',
    lineHeight: 18,
    paddingHorizontal: Spacing.xl,
  },
});
