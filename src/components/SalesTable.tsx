import { ScrollView, StyleSheet, Text, View } from 'react-native';
import { Palette, Radius, Spacing } from '@/constants/theme';
import { formatCurrency, formatArea } from '@/utils/format';
import type { UnidadeItem } from '@/types';

// Colors matching the frontend exactly
const UNIT_STATUS_COLOR: Record<string, { bg: string; text: string }> = {
  Disponível: { bg: '#D1FAE5', text: '#18bb3c' },
  Decorado: { bg: '#EDE9FE', text: '#9E77ED' },
  Promoção: { bg: '#DBEAFE', text: '#127efc' },
  Modelo: { bg: '#FEF3C7', text: '#F79009' },
};

type BaseColKey = 'tipologia' | 'descricao' | 'area' | 'area_ext' | 'quartos' | 'suites' | 'banheiros' | 'vagas' | 'valor_m2' | 'valor' | 'status';
type ColKey = BaseColKey | 'bloco';

const BASE_COLS: { key: BaseColKey; label: string; width: number }[] = [
  { key: 'tipologia', label: 'Tipologia', width: 110 },
  { key: 'descricao', label: 'Unidade', width: 90 },
  { key: 'area', label: 'Área', width: 75 },
  { key: 'area_ext', label: 'Área Ext.', width: 75 },
  { key: 'quartos', label: 'Qts', width: 46 },
  { key: 'suites', label: 'Suítes', width: 56 },
  { key: 'banheiros', label: 'Banh.', width: 56 },
  { key: 'vagas', label: 'Vagas', width: 56 },
  { key: 'valor_m2', label: 'R$/m²', width: 90 },
  { key: 'valor', label: 'Valor', width: 130 },
  { key: 'status', label: 'Status', width: 110 },
];

function getCell(unit: UnidadeItem, key: ColKey): React.ReactNode {
  switch (key) {
    case 'bloco':
      return unit.bloco ?? '—';
    case 'tipologia':
      return unit.tipologia ?? '—';
    case 'descricao':
      return unit.descricao ?? '—';
    case 'area':
      return formatArea(unit.area) ?? '—';
    case 'area_ext':
      return unit.area_externa != null ? formatArea(unit.area_externa) ?? '—' : '—';
    case 'quartos':
      return unit.quant_quartos != null ? String(unit.quant_quartos) : '—';
    case 'suites':
      return unit.quant_suites != null ? String(unit.quant_suites) : '—';
    case 'banheiros':
      return unit.quant_banheiros != null ? String(unit.quant_banheiros) : '—';
    case 'vagas':
      return unit.quant_vagas != null ? String(unit.quant_vagas) : '—';
    case 'valor_m2': {
      if (unit.valor && unit.area) {
        const m2 = Math.round(Number(unit.valor) / Number(unit.area));
        return formatCurrency(m2) ?? '—';
      }
      return '—';
    }
    case 'valor':
      return formatCurrency(unit.valor);
    case 'status': {
      const cfgFromMap = unit.status ? UNIT_STATUS_COLOR[unit.status] : undefined;
      const cfg = cfgFromMap ?? {
        bg: Palette.surfaceVariant,
        text: Palette.textSecondary,
      };
      return (
        <View style={[styles.statusPill, { backgroundColor: cfg.bg }]}>
          <Text style={[styles.statusText, { color: cfg.text }]}>{unit.status}</Text>
        </View>
      );
    }
    default:
      return '—';
  }
}

interface Props {
  units: UnidadeItem[];
}

export function SalesTable({ units }: Props) {
  const available = units.filter(
    (u) =>
      u.status !== 'Vendido' &&
      u.status !== 'Indisponível' &&
      u.status !== 'Reservado' &&
      u.valor !== 0
  );

  const hasBlocos = available.some((u) => u.bloco);
  const hasAreaExt = available.some((u) => u.area_externa != null && u.area_externa > 0);
  const hasBanheiros = available.some((u) => u.quant_banheiros != null);
  const hasValorM2 = available.some((u) => u.valor && u.area);

  const COLS: { key: ColKey; label: string; width: number }[] = [
    ...(hasBlocos ? [{ key: 'bloco' as ColKey, label: 'Bloco', width: 70 }] : []),
    ...BASE_COLS.filter((c) => {
      if (c.key === 'area_ext' && !hasAreaExt) return false;
      if (c.key === 'banheiros' && !hasBanheiros) return false;
      if (c.key === 'valor_m2' && !hasValorM2) return false;
      return true;
    }),
  ];

  if (available.length === 0) {
    return (
      <View style={styles.empty}>
        <Text style={styles.emptyText}>Sem unidades disponíveis no momento</Text>
      </View>
    );
  }

  return (
    <View style={styles.wrapper}>
      <Text style={styles.count}>{available.length} unidade{available.length !== 1 ? 's' : ''} disponível{available.length !== 1 ? 'veis' : ''}</Text>
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
          {available.map((unit, idx) => (
            <View
              key={unit.id}
              style={[styles.row, idx % 2 === 0 ? styles.rowEven : styles.rowOdd]}
            >
              {COLS.map((col) => {
                const content = getCell(unit, col.key);
                return (
                  <View key={col.key} style={[styles.cell, { width: col.width }]}>
                    {typeof content === 'string' ? (
                      <Text style={styles.cellText} numberOfLines={1}>
                        {content}
                      </Text>
                    ) : (
                      content
                    )}
                  </View>
                );
              })}
            </View>
          ))}
        </View>
      </ScrollView>
    </View>
  );
}

const styles = StyleSheet.create({
  wrapper: {
    gap: 10,
  },
  count: {
    fontSize: 13,
    fontWeight: '600',
    color: Palette.textSecondary,
  },
  row: {
    flexDirection: 'row',
    alignItems: 'center',
  },
  headerRow: {
    backgroundColor: Palette.surfaceVariant,
    borderRadius: Radius.sm,
    paddingVertical: 10,
    marginBottom: 2,
  },
  rowEven: {
    backgroundColor: Palette.surface,
    paddingVertical: 10,
  },
  rowOdd: {
    backgroundColor: Palette.surfaceOverlay,
    paddingVertical: 10,
  },
  headerCell: {
    fontSize: 11,
    fontWeight: '700',
    color: Palette.textTertiary,
    textTransform: 'uppercase',
    letterSpacing: 0.5,
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
    borderRadius: Radius.full,
    paddingHorizontal: 8,
    paddingVertical: 3,
    alignSelf: 'flex-start',
  },
  statusText: {
    fontSize: 11,
    fontWeight: '700',
  },
  empty: {
    padding: Spacing.xxl,
    alignItems: 'center',
  },
  emptyText: {
    fontSize: 14,
    color: Palette.textTertiary,
    textAlign: 'center',
  },
});
