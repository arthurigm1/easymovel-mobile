import {
  KeyboardAvoidingView,
  Modal,
  Platform,
  Pressable,
  ScrollView,
  StyleSheet,
  Text,
  TextInput,
  TouchableOpacity,
  View,
} from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { select, tapMedium } from '@/utils/haptics';
import { Palette, Radius, Shadow, Spacing, DisplayFont } from '@/constants/theme';
import { useSugestoesFiltro } from '@/hooks/useSugestoesFiltro';
import { SearchableSelect } from './SearchableSelect';
import { AppButton } from './AppButton';
import { Badge } from './Badge';
import type { FilterState, SelectOption } from '@/types';

type IoniconName = React.ComponentProps<typeof Ionicons>['name'];

const STATUS_OPTIONS = [
  { value: 'pre-lancamento', label: 'Pré-Lançamento', color: Palette.statusPreLancamento },
  { value: 'Lançamento', label: 'Lançamento', color: Palette.statusLancamento },
  { value: 'Em Construção', label: 'Em Construção', color: Palette.statusEmConstrucao },
  { value: 'Pronto para Morar', label: 'Pronto para Morar', color: Palette.statusPronto },
];

const QUARTOS_OPTIONS = ['1', '2', '3', '4+'];
const SUITES_OPTIONS = ['1', '2', '3', '4+'];
const VAGAS_OPTIONS = ['1', '2', '3', '4+'];

const TIPO_OPTIONS = [
  { value: 'empreendimento', label: 'Condomínios' },
  { value: 'loteamento', label: 'Loteamentos' },
  { value: 'imovel-avulso', label: 'Avulsos' },
];

const TIPOLOGIA_OPTIONS = [
  'Apto. Tipo', 'Casa', 'Cobertura', 'Duplex', 'Loja', 'Lote', 'Sala', 'Terreno',
];

export const REGIAO_OPTIONS = [
  { value: 'belo horizonte', label: 'Belo Horizonte' },
  { value: 'salvador', label: 'Salvador' },
  { value: 'santa catarina', label: 'Santa Catarina' },
  { value: 'sao paulo', label: 'São Paulo' },
  { value: 'uberlandia', label: 'Uberlândia' },
];

export const ORDENAR_OPTIONS = [
  { value: '', label: 'Automática' },
  { value: 'mais recentes primeiro', label: 'Mais recentes' },
  { value: 'menor valor da unidade', label: 'Menor preço' },
  { value: 'maior valor da unidade', label: 'Maior preço' },
];

function SectionTitle({ title, icon }: { title: string; icon: IoniconName }) {
  return (
    <View style={styles.sectionHeader}>
      <View style={styles.sectionIcon}>
        <Ionicons name={icon} size={14} color={Palette.primary} />
      </View>
      <Text style={styles.sectionTitle}>{title}</Text>
    </View>
  );
}

function OptionChip({
  label,
  active,
  color,
  onPress,
}: {
  label: string;
  active: boolean;
  color?: string;
  onPress: () => void;
}) {
  return (
    <TouchableOpacity
      style={[
        styles.chip,
        active && { backgroundColor: color ?? Palette.primary, borderColor: color ?? Palette.primary },
      ]}
      onPress={onPress}
      activeOpacity={0.8}
      accessibilityRole="button"
      accessibilityState={{ selected: active }}
      accessibilityLabel={label}
    >
      {active && (
        <Ionicons name="checkmark" size={14} color={Palette.white} style={styles.chipCheck} />
      )}
      <Text style={[styles.chipText, active && styles.chipTextActive]}>{label}</Text>
    </TouchableOpacity>
  );
}

/** Segmented toggle group for quartos/suítes/vagas — connected equal segments. */
function SegmentedGroup({
  options,
  value,
  onSelect,
  label,
}: {
  options: string[];
  value: string | undefined;
  onSelect: (v: string) => void;
  label: string;
}) {
  return (
    <View style={styles.segment} accessibilityRole="radiogroup" accessibilityLabel={label}>
      {options.map((opt) => {
        const active = value === opt;
        return (
          <TouchableOpacity
            key={opt}
            style={[styles.segmentItem, active && styles.segmentItemActive]}
            onPress={() => onSelect(opt)}
            activeOpacity={0.85}
            accessibilityRole="radio"
            accessibilityState={{ selected: active, checked: active }}
            accessibilityLabel={`${label}: ${opt}`}
          >
            <Text style={[styles.segmentText, active && styles.segmentTextActive]}>{opt}</Text>
          </TouchableOpacity>
        );
      })}
    </View>
  );
}

/** Presentational min/max numeric field with an adornment (R$ / m²). */
function RangeField({
  label,
  affix,
  affixSide,
  value,
  placeholder,
  onChangeText,
}: {
  label: string;
  affix: string;
  affixSide: 'left' | 'right';
  value: string;
  placeholder: string;
  onChangeText: (v: string) => void;
}) {
  return (
    <View style={styles.rangeInput}>
      <Text style={styles.rangeLabel}>{label}</Text>
      <View style={styles.rangeFieldRow}>
        {affixSide === 'left' && <Text style={styles.affix}>{affix}</Text>}
        <TextInput
          style={styles.rangeField}
          value={value}
          onChangeText={onChangeText}
          placeholder={placeholder}
          placeholderTextColor={Palette.textTertiary}
          keyboardType="numeric"
          accessibilityLabel={label}
        />
        {affixSide === 'right' && <Text style={styles.affix}>{affix}</Text>}
      </View>
    </View>
  );
}

interface Props {
  visible: boolean;
  filters: FilterState;
  onChange: (filters: FilterState) => void;
  onClose: () => void;
  onApply: () => void;
  onClear: () => void;
}

export function FilterSheet({ visible, filters, onChange, onClose, onApply, onClear }: Props) {
  const insets = useSafeAreaInsets();
  const { data: sugestoes, isLoading: sugestoesLoading } = useSugestoesFiltro(filters.regiao);

  function toggle(key: keyof FilterState, value: string | boolean | undefined) {
    select();
    onChange({
      ...filters,
      [key]: filters[key] === value ? undefined : value,
    });
  }

  const empreendimentoOptions: SelectOption[] =
    sugestoes?.empreendimento.map((nome) => ({ id: nome, label: nome })) ?? [];
  const bairroOptions: SelectOption[] =
    sugestoes?.localidade.map((b) => ({ id: b.bairro_id, label: b.nome_bairro, group: b.cidade })) ?? [];
  const construtoraOptions: SelectOption[] =
    sugestoes?.construtora.map((c) => ({ id: c.construtora_id, label: c.construtora })) ?? [];
  const comodidadeOptions: SelectOption[] =
    sugestoes?.comodidades.map((c) => ({ id: c, label: c })) ?? [];
  const enderecoOptions: SelectOption[] =
    sugestoes?.enderecos.map((e) => ({ id: e, label: e })) ?? [];
  const enderecoSelected: SelectOption[] = filters.endereco
    ? [{ id: filters.endereco, label: filters.endereco }]
    : [];

  // Display-only: count of active filters for the header badge + apply button.
  const activeCount = [
    filters.empreendimentos?.length,
    filters.regiao,
    filters.bairros?.length,
    filters.endereco,
    filters.construtoras?.length,
    filters.tipo_imovel,
    filters.tipologia,
    filters.status_construcao,
    filters.quant_quartos,
    filters.quant_suites,
    filters.quant_vagas,
    filters.valor_min,
    filters.valor_max,
    filters.area_min,
    filters.area_max,
    filters.comodidades?.length,
    filters.disponiveis || undefined,
    filters.ordenar_por,
  ].filter(Boolean).length;

  return (
    <Modal
      visible={visible}
      transparent
      animationType="slide"
      statusBarTranslucent
      onRequestClose={onClose}
    >
      <View style={styles.root}>
        <Pressable
          style={styles.backdrop}
          onPress={onClose}
          accessibilityRole="button"
          accessibilityLabel="Fechar filtros"
        />

        <KeyboardAvoidingView
          behavior={Platform.OS === 'ios' ? 'padding' : undefined}
          style={styles.kav}
        >
          <View style={[styles.sheet, { paddingBottom: insets.bottom + Spacing.md }]}>
            {/* Handle */}
            <View style={styles.handle} />

            {/* Header */}
            <View style={styles.sheetHeader}>
              <View style={styles.sheetTitleRow}>
                <Text style={styles.sheetTitle}>Filtros</Text>
                {activeCount > 0 && (
                  <Badge label={`${activeCount} ${activeCount === 1 ? 'ativo' : 'ativos'}`} size="sm" />
                )}
              </View>
              <TouchableOpacity
                onPress={onClose}
                style={styles.closeBtn}
                hitSlop={8}
                accessibilityRole="button"
                accessibilityLabel="Fechar filtros"
              >
                <Ionicons name="close" size={22} color={Palette.textSecondary} />
              </TouchableOpacity>
            </View>

            <ScrollView
              showsVerticalScrollIndicator={false}
              style={styles.scroll}
              contentContainerStyle={styles.scrollContent}
              keyboardShouldPersistTaps="handled"
              keyboardDismissMode="on-drag"
            >
              {/* ── Localização ─────────────────────────────── */}
              <View style={styles.card}>
                <SectionTitle title="Empreendimento" icon="business-outline" />
                <SearchableSelect
                  label="Empreendimento"
                  placeholder="Pesquise"
                  options={empreendimentoOptions}
                  selected={filters.empreendimentos ?? []}
                  onChange={(sel) => onChange({ ...filters, empreendimentos: sel })}
                  loading={sugestoesLoading}
                />

                <SectionTitle title="Região" icon="location-outline" />
                <View style={styles.chipRow}>
                  {REGIAO_OPTIONS.map((opt) => (
                    <OptionChip
                      key={opt.value}
                      label={opt.label}
                      active={filters.regiao === opt.value}
                      onPress={() => toggle('regiao', opt.value)}
                    />
                  ))}
                </View>

                <SectionTitle title="Bairros" icon="map-outline" />
                <SearchableSelect
                  label="Bairros"
                  placeholder="Pesquise"
                  options={bairroOptions}
                  selected={filters.bairros ?? []}
                  onChange={(sel) => onChange({ ...filters, bairros: sel })}
                  loading={sugestoesLoading}
                />

                <SectionTitle title="Avenida/Rua" icon="navigate-outline" />
                <SearchableSelect
                  label="Avenida/Rua"
                  placeholder="Pesquise"
                  options={enderecoOptions}
                  selected={enderecoSelected}
                  onChange={(sel) => onChange({ ...filters, endereco: sel[0]?.label })}
                  multi={false}
                  loading={sugestoesLoading}
                />

                <SectionTitle title="Construtoras" icon="construct-outline" />
                <SearchableSelect
                  label="Construtoras"
                  placeholder="Pesquise"
                  options={construtoraOptions}
                  selected={filters.construtoras ?? []}
                  onChange={(sel) => onChange({ ...filters, construtoras: sel })}
                  loading={sugestoesLoading}
                />
              </View>

              {/* ── Imóvel ──────────────────────────────────── */}
              <View style={styles.card}>
                <SectionTitle title="Tipo de Imóvel" icon="home-outline" />
                <View style={styles.chipRow}>
                  {TIPO_OPTIONS.map((opt) => (
                    <OptionChip
                      key={opt.value}
                      label={opt.label}
                      active={filters.tipo_imovel === opt.value}
                      onPress={() => toggle('tipo_imovel', opt.value)}
                    />
                  ))}
                </View>

                <SectionTitle title="Tipologia" icon="grid-outline" />
                <View style={styles.chipRow}>
                  {TIPOLOGIA_OPTIONS.map((t) => (
                    <OptionChip
                      key={t}
                      label={t}
                      active={filters.tipologia === t}
                      onPress={() => toggle('tipologia', t)}
                    />
                  ))}
                </View>

                <SectionTitle title="Status da Obra" icon="hammer-outline" />
                <View style={styles.chipRow}>
                  {STATUS_OPTIONS.map((opt) => (
                    <OptionChip
                      key={opt.value}
                      label={opt.label}
                      active={filters.status_construcao === opt.value}
                      color={opt.color}
                      onPress={() => toggle('status_construcao', opt.value)}
                    />
                  ))}
                </View>
              </View>

              {/* ── Ambientes ───────────────────────────────── */}
              <View style={styles.card}>
                <SectionTitle title="Quartos" icon="bed-outline" />
                <SegmentedGroup
                  label="Quartos"
                  options={QUARTOS_OPTIONS}
                  value={filters.quant_quartos}
                  onSelect={(v) => toggle('quant_quartos', v)}
                />

                <SectionTitle title="Suítes" icon="star-outline" />
                <SegmentedGroup
                  label="Suítes"
                  options={SUITES_OPTIONS}
                  value={filters.quant_suites}
                  onSelect={(v) => toggle('quant_suites', v)}
                />

                <SectionTitle title="Vagas de Garagem" icon="car-outline" />
                <SegmentedGroup
                  label="Vagas de Garagem"
                  options={VAGAS_OPTIONS}
                  value={filters.quant_vagas}
                  onSelect={(v) => toggle('quant_vagas', v)}
                />
              </View>

              {/* ── Faixas ──────────────────────────────────── */}
              <View style={styles.card}>
                <SectionTitle title="Valor" icon="cash-outline" />
                <View style={styles.rangeRow}>
                  <RangeField
                    label="Mínimo"
                    affix="R$"
                    affixSide="left"
                    value={filters.valor_min != null ? String(filters.valor_min) : ''}
                    placeholder="0"
                    onChangeText={(v) => onChange({ ...filters, valor_min: v ? Number(v.replace(/\D/g, '')) : undefined })}
                  />
                  <Text style={styles.rangeSep}>–</Text>
                  <RangeField
                    label="Máximo"
                    affix="R$"
                    affixSide="left"
                    value={filters.valor_max != null ? String(filters.valor_max) : ''}
                    placeholder="Sem limite"
                    onChangeText={(v) => onChange({ ...filters, valor_max: v ? Number(v.replace(/\D/g, '')) : undefined })}
                  />
                </View>

                <SectionTitle title="Área" icon="resize-outline" />
                <View style={styles.rangeRow}>
                  <RangeField
                    label="Mínima"
                    affix="m²"
                    affixSide="right"
                    value={filters.area_min != null ? String(filters.area_min) : ''}
                    placeholder="0"
                    onChangeText={(v) => onChange({ ...filters, area_min: v ? Number(v.replace(/\D/g, '')) : undefined })}
                  />
                  <Text style={styles.rangeSep}>–</Text>
                  <RangeField
                    label="Máxima"
                    affix="m²"
                    affixSide="right"
                    value={filters.area_max != null ? String(filters.area_max) : ''}
                    placeholder="Sem limite"
                    onChangeText={(v) => onChange({ ...filters, area_max: v ? Number(v.replace(/\D/g, '')) : undefined })}
                  />
                </View>
              </View>

              {/* ── Extras ──────────────────────────────────── */}
              <View style={styles.card}>
                <SectionTitle title="Comodidades" icon="sparkles-outline" />
                <SearchableSelect
                  label="Comodidades"
                  placeholder="Pesquise"
                  options={comodidadeOptions}
                  selected={(filters.comodidades ?? []).map((c) => ({ id: c, label: c }))}
                  onChange={(sel) => onChange({ ...filters, comodidades: sel.map((s) => s.label) })}
                  loading={sugestoesLoading}
                />

                <SectionTitle title="Disponibilidade" icon="checkmark-done-outline" />
                <TouchableOpacity
                  style={[styles.toggleRow, filters.disponiveis && styles.toggleRowActive]}
                  onPress={() => {
                    select();
                    onChange({ ...filters, disponiveis: !filters.disponiveis });
                  }}
                  activeOpacity={0.8}
                  accessibilityRole="switch"
                  accessibilityState={{ checked: !!filters.disponiveis }}
                  accessibilityLabel="Somente unidades disponíveis"
                >
                  <View style={styles.toggleLeft}>
                    <Ionicons
                      name="checkmark-circle"
                      size={18}
                      color={filters.disponiveis ? Palette.primary : Palette.textTertiary}
                    />
                    <Text style={[styles.toggleText, filters.disponiveis && styles.toggleTextActive]}>
                      Somente unidades disponíveis
                    </Text>
                  </View>
                  <View style={[styles.toggleSwitch, filters.disponiveis && styles.toggleSwitchActive]}>
                    <View style={[styles.toggleKnob, filters.disponiveis && styles.toggleKnobActive]} />
                  </View>
                </TouchableOpacity>

                <SectionTitle title="Ordenar por" icon="swap-vertical-outline" />
                <View style={styles.chipRow}>
                  {ORDENAR_OPTIONS.map((opt) => (
                    <OptionChip
                      key={opt.value}
                      label={opt.label}
                      active={(filters.ordenar_por ?? '') === opt.value}
                      onPress={() => {
                        select();
                        onChange({ ...filters, ordenar_por: opt.value || undefined });
                      }}
                    />
                  ))}
                </View>
              </View>
            </ScrollView>

            {/* Footer buttons */}
            <View style={styles.footer}>
              <TouchableOpacity
                style={styles.clearBtn}
                onPress={() => {
                  tapMedium();
                  onClear();
                }}
                activeOpacity={0.8}
                accessibilityRole="button"
                accessibilityLabel="Limpar filtros"
              >
                <Ionicons name="refresh-outline" size={16} color={Palette.textSecondary} />
                <Text style={styles.clearBtnText}>Limpar</Text>
              </TouchableOpacity>
              <View style={styles.applyWrap}>
                <AppButton
                  label={activeCount > 0 ? `Aplicar (${activeCount})` : 'Aplicar filtros'}
                  onPress={onApply}
                  variant="primary"
                  size="lg"
                  fullWidth
                  iconLeft={<Ionicons name="search" size={17} color={Palette.white} />}
                />
              </View>
            </View>
          </View>
        </KeyboardAvoidingView>
      </View>
    </Modal>
  );
}

const styles = StyleSheet.create({
  root: {
    flex: 1,
    justifyContent: 'flex-end',
  },
  backdrop: {
    position: 'absolute',
    top: 0,
    left: 0,
    right: 0,
    bottom: 0,
    backgroundColor: Palette.overlay,
  },
  kav: {
    width: '100%',
  },
  sheet: {
    backgroundColor: Palette.bg,
    borderTopLeftRadius: Radius.xxxl,
    borderTopRightRadius: Radius.xxxl,
    maxHeight: '90%',
    paddingTop: Spacing.md,
    ...Shadow.xl,
  },
  handle: {
    width: 44,
    height: 5,
    borderRadius: Radius.full,
    backgroundColor: Palette.borderStrong,
    alignSelf: 'center',
    marginBottom: Spacing.md,
  },
  sheetHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    paddingHorizontal: Spacing.xl,
    paddingBottom: Spacing.lg,
  },
  sheetTitleRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: Spacing.sm,
  },
  sheetTitle: {
    fontFamily: DisplayFont.bold,
    fontSize: 24,
    letterSpacing: -0.5,
    color: Palette.text,
  },
  closeBtn: {
    width: 40,
    height: 40,
    borderRadius: Radius.full,
    backgroundColor: Palette.surfaceVariant,
    alignItems: 'center',
    justifyContent: 'center',
  },
  scroll: {
    paddingHorizontal: Spacing.lg,
  },
  scrollContent: {
    paddingBottom: Spacing.lg,
  },
  card: {
    backgroundColor: Palette.surface,
    borderRadius: Radius.xl,
    borderWidth: StyleSheet.hairlineWidth,
    borderColor: Palette.borderLight,
    paddingHorizontal: Spacing.lg,
    paddingBottom: Spacing.xl,
    marginBottom: Spacing.md,
    ...Shadow.xs,
  },
  sectionHeader: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: Spacing.sm,
    marginTop: Spacing.xl,
    marginBottom: Spacing.md,
  },
  sectionIcon: {
    width: 26,
    height: 26,
    borderRadius: Radius.sm,
    backgroundColor: Palette.primaryLight,
    alignItems: 'center',
    justifyContent: 'center',
  },
  sectionTitle: {
    fontSize: 13,
    fontWeight: '700',
    color: Palette.text,
    letterSpacing: 0.2,
  },
  chipRow: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    gap: Spacing.sm,
  },
  chip: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingHorizontal: 16,
    paddingVertical: 10,
    borderRadius: Radius.full,
    borderWidth: 1.5,
    borderColor: Palette.border,
    backgroundColor: Palette.surface,
    minHeight: 44,
    justifyContent: 'center',
  },
  chipCheck: {
    marginRight: 5,
    marginLeft: -2,
  },
  chipText: {
    fontSize: 14,
    fontWeight: '600',
    color: Palette.textSecondary,
  },
  chipTextActive: {
    color: Palette.white,
    fontWeight: '700',
  },
  segment: {
    flexDirection: 'row',
    backgroundColor: Palette.surfaceVariant,
    borderRadius: Radius.md,
    padding: 4,
    gap: 4,
  },
  segmentItem: {
    flex: 1,
    minHeight: 44,
    borderRadius: Radius.sm,
    alignItems: 'center',
    justifyContent: 'center',
  },
  segmentItemActive: {
    backgroundColor: Palette.primary,
    ...Shadow.sm,
  },
  segmentText: {
    fontSize: 15,
    fontWeight: '700',
    color: Palette.textSecondary,
  },
  segmentTextActive: {
    color: Palette.white,
  },
  toggleRow: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    padding: Spacing.lg,
    borderRadius: Radius.lg,
    borderWidth: 1.5,
    borderColor: Palette.border,
    backgroundColor: Palette.surface,
    minHeight: 56,
  },
  toggleRowActive: {
    borderColor: Palette.primary,
    backgroundColor: Palette.primaryLight,
  },
  toggleLeft: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: Spacing.sm,
    flex: 1,
  },
  toggleText: {
    fontSize: 14,
    fontWeight: '600',
    color: Palette.textSecondary,
  },
  toggleTextActive: {
    color: Palette.primaryDark,
  },
  toggleSwitch: {
    width: 46,
    height: 28,
    borderRadius: Radius.full,
    backgroundColor: Palette.borderStrong,
    justifyContent: 'center',
    paddingHorizontal: 3,
  },
  toggleSwitchActive: {
    backgroundColor: Palette.primary,
  },
  toggleKnob: {
    width: 22,
    height: 22,
    borderRadius: Radius.full,
    backgroundColor: Palette.white,
    ...Shadow.xs,
  },
  toggleKnobActive: {
    alignSelf: 'flex-end',
  },
  rangeRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: Spacing.sm,
  },
  rangeInput: {
    flex: 1,
    borderWidth: 1.5,
    borderColor: Palette.border,
    borderRadius: Radius.md,
    paddingHorizontal: Spacing.md,
    paddingVertical: 10,
    backgroundColor: Palette.surfaceVariant,
  },
  rangeLabel: {
    fontSize: 11,
    fontWeight: '700',
    color: Palette.textTertiary,
    textTransform: 'uppercase',
    letterSpacing: 0.5,
    marginBottom: 4,
  },
  rangeFieldRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: Spacing.xs,
  },
  affix: {
    fontSize: 14,
    fontWeight: '700',
    color: Palette.textTertiary,
  },
  rangeField: {
    flex: 1,
    fontSize: 16,
    color: Palette.text,
    padding: 0,
    fontWeight: '600',
  },
  rangeSep: {
    fontSize: 18,
    color: Palette.textTertiary,
    fontWeight: '400',
  },
  footer: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: Spacing.md,
    paddingHorizontal: Spacing.xl,
    paddingTop: Spacing.md,
    borderTopWidth: StyleSheet.hairlineWidth,
    borderTopColor: Palette.border,
    backgroundColor: Palette.surface,
  },
  clearBtn: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: Spacing.xs,
    paddingHorizontal: Spacing.lg,
    paddingVertical: 15,
    borderRadius: Radius.lg,
    borderWidth: 1.5,
    borderColor: Palette.border,
    justifyContent: 'center',
    minHeight: 52,
  },
  clearBtnText: {
    fontSize: 15,
    fontWeight: '700',
    color: Palette.textSecondary,
  },
  applyWrap: {
    flex: 1,
  },
});
