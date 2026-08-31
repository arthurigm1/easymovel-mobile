import { memo, useMemo, useState } from 'react';
import { StyleSheet, Text, TouchableOpacity, View, ScrollView } from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { Palette, Radius, Spacing, Shadow, DisplayFont } from '@/constants/theme';
import { UNIT_STATUS, getUnitStatus } from '@/constants/status';
import { formatCurrency, formatArea } from '@/utils/format';
import type { UnidadeItem } from '@/types';

// Ordem canônica de exibição dos status (mais "vendável" primeiro).
// Só entram no filtro os status realmente presentes na lista.
const STATUS_ORDER = [
  'Disponível',
  'Promoção',
  'Decorado',
  'Modelo',
  'Reservado',
  'Vendido',
  'Indisponível',
];

function statusRank(status?: string): number {
  const i = STATUS_ORDER.indexOf(status ?? '');
  return i === -1 ? STATUS_ORDER.length : i;
}

// Ordena por bloco (quando houver) e, dentro do bloco, por identificador da
// unidade — numérico quando ambos forem números ("2" antes de "10").
function compareUnits(a: UnidadeItem, b: UnidadeItem, hasBlocos: boolean): number {
  if (hasBlocos) {
    const bloco = (a.bloco ?? '').localeCompare(b.bloco ?? '', 'pt-BR', { numeric: true });
    if (bloco !== 0) return bloco;
  }
  const da = a.descricao ?? '';
  const db = b.descricao ?? '';
  return da.localeCompare(db, 'pt-BR', { numeric: true });
}

interface Section {
  title: string | null;
  data: UnidadeItem[];
}

function groupByBloco(units: UnidadeItem[], hasBlocos: boolean): Section[] {
  if (!hasBlocos) return units.length ? [{ title: null, data: units }] : [];
  const map = new Map<string, UnidadeItem[]>();
  for (const u of units) {
    const key = u.bloco?.trim() || 'Sem bloco';
    const arr = map.get(key);
    if (arr) arr.push(u);
    else map.set(key, [u]);
  }
  return [...map.keys()]
    .sort((a, b) => a.localeCompare(b, 'pt-BR', { numeric: true }))
    .map((title) => ({ title, data: map.get(title)! }));
}

// ─── Spec (quarto / suíte / vaga / área) ──────────────────────────────────────
function Spec({
  icon,
  value,
  label,
}: {
  icon: keyof typeof Ionicons.glyphMap;
  value: string;
  label: string;
}) {
  return (
    <View style={styles.spec} accessible accessibilityLabel={label}>
      <Ionicons name={icon} size={14} color={Palette.textTertiary} />
      <Text style={styles.specText} numberOfLines={1}>
        {value}
      </Text>
    </View>
  );
}

// ─── Card de unidade (memoizado — mantém a lista leve em listas longas) ────────
const UnitCard = memo(function UnitCard({
  unit,
  onPress,
}: {
  unit: UnidadeItem;
  onPress?: (unit: UnidadeItem) => void;
}) {
  const cfg = getUnitStatus(unit.status);
  const hasValor = unit.valor != null && !isNaN(Number(unit.valor)) && Number(unit.valor) > 0;
  const valor = formatCurrency(unit.valor);
  const area = formatArea(unit.area);

  const q = unit.quant_quartos;
  const s = unit.quant_suites;
  const v = unit.quant_vagas;

  const a11yLabel = [
    unit.descricao ? `Unidade ${unit.descricao}` : 'Unidade',
    unit.tipologia,
    area ? `área ${area}` : null,
    q != null ? `${q} quartos` : null,
    s ? `${s} suítes` : null,
    v != null ? `${v} vagas` : null,
    unit.status,
    hasValor ? valor : 'valor a consultar',
  ]
    .filter(Boolean)
    .join(', ');

  return (
    <TouchableOpacity
      style={styles.card}
      onPress={onPress ? () => onPress(unit) : undefined}
      activeOpacity={onPress ? 0.7 : 1}
      disabled={!onPress}
      accessibilityRole={onPress ? 'button' : undefined}
      accessibilityLabel={a11yLabel}
    >
      <View style={styles.cardTop}>
        <View style={styles.cardId}>
          <Ionicons name="home-outline" size={13} color={Palette.textTertiary} />
          <Text style={styles.cardIdText} numberOfLines={1}>
            {unit.descricao ?? '—'}
          </Text>
        </View>
        <View style={[styles.statusPill, { backgroundColor: cfg.bg }]}>
          <View style={[styles.statusDot, { backgroundColor: cfg.dot }]} />
          <Text style={[styles.statusText, { color: cfg.text }]} numberOfLines={1}>
            {unit.status ?? '—'}
          </Text>
        </View>
      </View>

      {unit.tipologia ? (
        <Text style={styles.cardTipologia} numberOfLines={1}>
          {unit.tipologia}
        </Text>
      ) : null}

      <View style={styles.specsRow}>
        {area ? <Spec icon="resize-outline" value={area} label={`Área ${area}`} /> : null}
        {q != null ? (
          <Spec icon="bed-outline" value={`${q} qts`} label={`${q} quartos`} />
        ) : null}
        {s ? (
          <Spec icon="bed" value={`${s} suíte${s > 1 ? 's' : ''}`} label={`${s} suítes`} />
        ) : null}
        {v != null ? (
          <Spec icon="car-outline" value={`${v} vaga${v !== 1 ? 's' : ''}`} label={`${v} vagas`} />
        ) : null}
      </View>

      <View style={styles.cardBottom}>
        <Text
          style={[styles.valor, !hasValor && styles.valorMuted]}
          numberOfLines={1}
          accessibilityLabel={hasValor ? `Valor ${valor}` : 'Valor a consultar'}
        >
          {valor}
        </Text>
        {onPress ? (
          <Ionicons name="chevron-forward" size={16} color={Palette.textTertiary} />
        ) : null}
      </View>
    </TouchableOpacity>
  );
});

// ─── Chip de filtro por status ────────────────────────────────────────────────
function FilterChip({
  label,
  count,
  active,
  dotColor,
  onPress,
}: {
  label: string;
  count: number;
  active: boolean;
  dotColor?: string;
  onPress: () => void;
}) {
  return (
    <TouchableOpacity
      style={[styles.chip, active && styles.chipActive]}
      onPress={onPress}
      activeOpacity={0.75}
      hitSlop={{ top: 6, bottom: 6, left: 2, right: 2 }}
      accessibilityRole="button"
      accessibilityState={{ selected: active }}
      accessibilityLabel={`${label}, ${count} ${count === 1 ? 'unidade' : 'unidades'}`}
    >
      {dotColor ? <View style={[styles.chipDot, { backgroundColor: dotColor }]} /> : null}
      <Text style={[styles.chipText, active && styles.chipTextActive]} numberOfLines={1}>
        {label}
      </Text>
      <Text style={[styles.chipCount, active && styles.chipCountActive]}>{count}</Text>
    </TouchableOpacity>
  );
}

interface Props {
  units: UnidadeItem[];
  varios_blocos?: boolean;
  onUnitPress?: (unit: UnidadeItem) => void;
}

export function SalesTable({ units, varios_blocos, onUnitPress }: Props) {
  const [activeStatus, setActiveStatus] = useState<string | null>(null); // null = Todos

  // Unidades "reais" (algo que valha a pena exibir).
  const allUnits = useMemo(
    () => units.filter((u) => u.status || u.descricao || u.valor != null),
    [units]
  );

  const hasBlocos = useMemo(
    () => !!varios_blocos || allUnits.some((u) => u.bloco),
    [varios_blocos, allUnits]
  );

  // Contagem por status (para os chips) + total de disponíveis (para o resumo).
  const { statusCounts, statusList, dispCount } = useMemo(() => {
    const counts = new Map<string, number>();
    for (const u of allUnits) {
      const key = u.status ?? 'Indisponível';
      counts.set(key, (counts.get(key) ?? 0) + 1);
    }
    const list = [...counts.keys()].sort((a, b) => statusRank(a) - statusRank(b));
    return {
      statusCounts: counts,
      statusList: list,
      dispCount: counts.get('Disponível') ?? 0,
    };
  }, [allUnits]);

  // Filtra + ordena + agrupa.
  const sections = useMemo(() => {
    const filtered = activeStatus
      ? allUnits.filter((u) => (u.status ?? 'Indisponível') === activeStatus)
      : allUnits;
    const sorted = [...filtered].sort((a, b) => compareUnits(a, b, hasBlocos));
    return groupByBloco(sorted, hasBlocos);
  }, [allUnits, activeStatus, hasBlocos]);

  // Estado vazio global — nenhuma unidade cadastrada.
  if (allUnits.length === 0) {
    return (
      <View style={styles.empty}>
        <Ionicons name="home-outline" size={40} color={Palette.textDisabled} />
        <Text style={styles.emptyTitle}>Nenhuma unidade cadastrada</Text>
        <Text style={styles.emptyText}>
          A tabela de vendas deste empreendimento ainda não possui unidades.
        </Text>
      </View>
    );
  }

  return (
    <View style={styles.wrapper}>
      {/* Resumo */}
      <View style={styles.summary}>
        <Text style={styles.summaryDisp}>{dispCount}</Text>
        <Text style={styles.summaryText}>
          {dispCount === 1 ? 'disponível' : 'disponíveis'} de {allUnits.length}{' '}
          {allUnits.length === 1 ? 'unidade' : 'unidades'}
        </Text>
      </View>

      {/* Filtros por status */}
      <ScrollView
        horizontal
        showsHorizontalScrollIndicator={false}
        contentContainerStyle={styles.chipsRow}
        accessibilityRole="tablist"
      >
        <FilterChip
          label="Todas"
          count={allUnits.length}
          active={activeStatus === null}
          onPress={() => setActiveStatus(null)}
        />
        {statusList.map((status) => (
          <FilterChip
            key={status}
            label={status}
            count={statusCounts.get(status) ?? 0}
            active={activeStatus === status}
            dotColor={getUnitStatus(status).dot}
            onPress={() => setActiveStatus((cur) => (cur === status ? null : status))}
          />
        ))}
      </ScrollView>

      {/* Lista agrupada por bloco */}
      {sections.length === 0 ? (
        <View style={styles.emptyFilter}>
          <Ionicons name="filter-outline" size={28} color={Palette.textDisabled} />
          <Text style={styles.emptyFilterText}>Nenhuma unidade neste status.</Text>
          <TouchableOpacity
            style={styles.clearBtn}
            onPress={() => setActiveStatus(null)}
            accessibilityRole="button"
            accessibilityLabel="Ver todas as unidades"
          >
            <Text style={styles.clearBtnText}>Ver todas</Text>
          </TouchableOpacity>
        </View>
      ) : (
        sections.map((section) => (
          <View key={section.title ?? '__all__'} style={styles.section}>
            {section.title ? (
              <View style={styles.sectionHeader} accessibilityRole="header">
                <View style={styles.sectionAccent} />
                <Ionicons name="business-outline" size={14} color={Palette.primary} />
                <Text style={styles.sectionTitle} numberOfLines={1}>
                  Bloco {section.title}
                </Text>
                <View style={styles.sectionCountPill}>
                  <Text style={styles.sectionCountText}>
                    {section.data.length} {section.data.length === 1 ? 'un.' : 'uns.'}
                  </Text>
                </View>
              </View>
            ) : null}

            {section.data.map((unit) => (
              <UnitCard key={unit.id} unit={unit} onPress={onUnitPress} />
            ))}
          </View>
        ))
      )}
    </View>
  );
}

const styles = StyleSheet.create({
  wrapper: { gap: Spacing.md },

  // ── Resumo ──
  summary: {
    flexDirection: 'row',
    alignItems: 'baseline',
    gap: 6,
    paddingHorizontal: 2,
  },
  summaryDisp: {
    fontSize: 22,
    fontFamily: DisplayFont.bold,
    color: UNIT_STATUS.Disponível.dot,
    letterSpacing: -0.5,
  },
  summaryText: {
    fontSize: 14,
    fontWeight: '600',
    color: Palette.textSecondary,
  },

  // ── Chips de filtro ──
  chipsRow: {
    gap: Spacing.sm,
    paddingHorizontal: 2,
    paddingVertical: 2,
  },
  chip: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 6,
    minHeight: 40,
    paddingHorizontal: 14,
    borderRadius: Radius.full,
    backgroundColor: Palette.surfaceVariant,
    borderWidth: 1,
    borderColor: Palette.border,
  },
  chipActive: {
    backgroundColor: Palette.primary,
    borderColor: Palette.primary,
  },
  chipDot: {
    width: 8,
    height: 8,
    borderRadius: 4,
  },
  chipText: {
    fontSize: 13,
    fontWeight: '700',
    color: Palette.textSecondary,
  },
  chipTextActive: {
    color: Palette.textInverse,
  },
  chipCount: {
    fontSize: 12,
    fontWeight: '800',
    color: Palette.textTertiary,
    marginLeft: 1,
  },
  chipCountActive: {
    color: Palette.textInverse,
  },

  // ── Seção (bloco) ──
  section: { gap: Spacing.sm },
  sectionHeader: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 7,
    paddingVertical: 6,
    paddingHorizontal: 2,
    marginTop: 2,
  },
  sectionAccent: {
    width: 3,
    height: 16,
    borderRadius: Radius.full,
    backgroundColor: Palette.primary,
  },
  sectionTitle: {
    flex: 1,
    fontSize: 15,
    fontWeight: '800',
    color: Palette.text,
    letterSpacing: -0.2,
  },
  sectionCountPill: {
    backgroundColor: Palette.primaryLight,
    borderRadius: Radius.full,
    paddingHorizontal: 8,
    paddingVertical: 2,
  },
  sectionCountText: {
    fontSize: 11,
    fontWeight: '800',
    color: Palette.primaryDark,
  },

  // ── Card de unidade ──
  card: {
    backgroundColor: Palette.surface,
    borderRadius: Radius.lg,
    borderWidth: 1,
    borderColor: Palette.borderLight,
    padding: Spacing.md,
    gap: 8,
    ...Shadow.xs,
  },
  cardTop: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    gap: Spacing.sm,
  },
  cardId: {
    flexDirection: 'row',
    flexShrink: 1,
    alignItems: 'center',
    gap: 5,
  },
  cardIdText: {
    fontSize: 16,
    fontWeight: '800',
    color: Palette.text,
    letterSpacing: -0.2,
  },
  cardTipologia: {
    fontSize: 14,
    fontWeight: '500',
    color: Palette.textSecondary,
    marginTop: -2,
  },

  specsRow: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    alignItems: 'center',
    gap: 14,
    paddingTop: 2,
  },
  spec: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 4,
  },
  specText: {
    fontSize: 13,
    fontWeight: '600',
    color: Palette.textSecondary,
  },

  cardBottom: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    borderTopWidth: 1,
    borderTopColor: Palette.borderLight,
    paddingTop: 8,
    marginTop: 2,
  },
  valor: {
    fontSize: 17,
    fontFamily: DisplayFont.bold,
    color: Palette.primary,
    letterSpacing: -0.3,
  },
  valorMuted: {
    color: Palette.textTertiary,
  },

  // ── Status pill ──
  statusPill: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 5,
    borderRadius: Radius.full,
    paddingHorizontal: 9,
    paddingVertical: 4,
  },
  statusDot: {
    width: 6,
    height: 6,
    borderRadius: 3,
  },
  statusText: {
    fontSize: 11,
    fontWeight: '800',
  },

  // ── Estados vazios ──
  empty: {
    paddingVertical: Spacing.xxxl,
    alignItems: 'center',
    gap: 10,
  },
  emptyTitle: {
    fontSize: 16,
    fontWeight: '800',
    color: Palette.text,
  },
  emptyText: {
    fontSize: 14,
    color: Palette.textTertiary,
    textAlign: 'center',
    lineHeight: 20,
    paddingHorizontal: Spacing.xl,
  },
  emptyFilter: {
    paddingVertical: Spacing.xl,
    alignItems: 'center',
    gap: 8,
  },
  emptyFilterText: {
    fontSize: 14,
    fontWeight: '600',
    color: Palette.textSecondary,
  },
  clearBtn: {
    minHeight: 40,
    justifyContent: 'center',
    paddingHorizontal: 18,
    borderRadius: Radius.full,
    backgroundColor: Palette.primaryLight,
  },
  clearBtnText: {
    fontSize: 13,
    fontWeight: '800',
    color: Palette.primaryDark,
  },
});
