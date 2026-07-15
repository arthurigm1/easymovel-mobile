import {
  Modal,
  ScrollView,
  StyleSheet,
  Text,
  TextInput,
  TouchableOpacity,
  View,
} from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { Palette, Radius, Spacing } from '@/constants/theme';
import { useSugestoesFiltro } from '@/hooks/useSugestoesFiltro';
import { SearchableSelect } from './SearchableSelect';
import type { FilterState, SelectOption } from '@/types';

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

function SectionTitle({ title }: { title: string }) {
  return <Text style={styles.sectionTitle}>{title}</Text>;
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
    >
      <Text style={[styles.chipText, active && styles.chipTextActive]}>{label}</Text>
    </TouchableOpacity>
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

  return (
    <Modal
      visible={visible}
      transparent
      animationType="slide"
      statusBarTranslucent
      onRequestClose={onClose}
    >
      <TouchableOpacity style={styles.backdrop} activeOpacity={1} onPress={onClose} />

      <View style={[styles.sheet, { paddingBottom: insets.bottom + 16 }]}>
        {/* Handle */}
        <View style={styles.handle} />

        {/* Header */}
        <View style={styles.sheetHeader}>
          <Text style={styles.sheetTitle}>Filtros</Text>
          <TouchableOpacity onPress={onClose}>
            <Ionicons name="close" size={22} color={Palette.text} />
          </TouchableOpacity>
        </View>

        <ScrollView showsVerticalScrollIndicator={false} style={styles.scroll}>
          {/* Empreendimento */}
          <SectionTitle title="Empreendimento" />
          <SearchableSelect
            label="Empreendimento"
            placeholder="Pesquise"
            options={empreendimentoOptions}
            selected={filters.empreendimentos ?? []}
            onChange={(sel) => onChange({ ...filters, empreendimentos: sel })}
            loading={sugestoesLoading}
          />

          {/* Região */}
          <SectionTitle title="Região" />
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

          {/* Bairro */}
          <SectionTitle title="Bairros" />
          <SearchableSelect
            label="Bairros"
            placeholder="Pesquise"
            options={bairroOptions}
            selected={filters.bairros ?? []}
            onChange={(sel) => onChange({ ...filters, bairros: sel })}
            loading={sugestoesLoading}
          />

          {/* Avenida/Rua */}
          <SectionTitle title="Avenida/Rua" />
          <SearchableSelect
            label="Avenida/Rua"
            placeholder="Pesquise"
            options={enderecoOptions}
            selected={enderecoSelected}
            onChange={(sel) => onChange({ ...filters, endereco: sel[0]?.label })}
            multi={false}
            loading={sugestoesLoading}
          />

          {/* Construtora */}
          <SectionTitle title="Construtoras" />
          <SearchableSelect
            label="Construtoras"
            placeholder="Pesquise"
            options={construtoraOptions}
            selected={filters.construtoras ?? []}
            onChange={(sel) => onChange({ ...filters, construtoras: sel })}
            loading={sugestoesLoading}
          />

          {/* Tipo */}
          <SectionTitle title="Tipo de Imóvel" />
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

          {/* Tipologia */}
          <SectionTitle title="Tipologia" />
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

          {/* Status */}
          <SectionTitle title="Status da Obra" />
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

          {/* Quartos */}
          <SectionTitle title="Quartos" />
          <View style={styles.chipRow}>
            {QUARTOS_OPTIONS.map((q) => (
              <OptionChip
                key={q}
                label={q}
                active={filters.quant_quartos === q}
                onPress={() => toggle('quant_quartos', q)}
              />
            ))}
          </View>

          {/* Suítes */}
          <SectionTitle title="Suítes" />
          <View style={styles.chipRow}>
            {SUITES_OPTIONS.map((s) => (
              <OptionChip
                key={s}
                label={s}
                active={filters.quant_suites === s}
                onPress={() => toggle('quant_suites', s)}
              />
            ))}
          </View>

          {/* Vagas */}
          <SectionTitle title="Vagas de Garagem" />
          <View style={styles.chipRow}>
            {VAGAS_OPTIONS.map((v) => (
              <OptionChip
                key={v}
                label={v}
                active={filters.quant_vagas === v}
                onPress={() => toggle('quant_vagas', v)}
              />
            ))}
          </View>

          {/* Faixa de valor */}
          <SectionTitle title="Valor (R$)" />
          <View style={styles.rangeRow}>
            <View style={styles.rangeInput}>
              <Text style={styles.rangeLabel}>Mínimo</Text>
              <TextInput
                style={styles.rangeField}
                value={filters.valor_min != null ? String(filters.valor_min) : ''}
                onChangeText={(v) => onChange({ ...filters, valor_min: v ? Number(v.replace(/\D/g, '')) : undefined })}
                placeholder="0"
                placeholderTextColor={Palette.textTertiary}
                keyboardType="numeric"
              />
            </View>
            <Text style={styles.rangeSep}>–</Text>
            <View style={styles.rangeInput}>
              <Text style={styles.rangeLabel}>Máximo</Text>
              <TextInput
                style={styles.rangeField}
                value={filters.valor_max != null ? String(filters.valor_max) : ''}
                onChangeText={(v) => onChange({ ...filters, valor_max: v ? Number(v.replace(/\D/g, '')) : undefined })}
                placeholder="Sem limite"
                placeholderTextColor={Palette.textTertiary}
                keyboardType="numeric"
              />
            </View>
          </View>

          {/* Faixa de área */}
          <SectionTitle title="Área (m²)" />
          <View style={styles.rangeRow}>
            <View style={styles.rangeInput}>
              <Text style={styles.rangeLabel}>Mínima</Text>
              <TextInput
                style={styles.rangeField}
                value={filters.area_min != null ? String(filters.area_min) : ''}
                onChangeText={(v) => onChange({ ...filters, area_min: v ? Number(v.replace(/\D/g, '')) : undefined })}
                placeholder="0"
                placeholderTextColor={Palette.textTertiary}
                keyboardType="numeric"
              />
            </View>
            <Text style={styles.rangeSep}>–</Text>
            <View style={styles.rangeInput}>
              <Text style={styles.rangeLabel}>Máxima</Text>
              <TextInput
                style={styles.rangeField}
                value={filters.area_max != null ? String(filters.area_max) : ''}
                onChangeText={(v) => onChange({ ...filters, area_max: v ? Number(v.replace(/\D/g, '')) : undefined })}
                placeholder="Sem limite"
                placeholderTextColor={Palette.textTertiary}
                keyboardType="numeric"
              />
            </View>
          </View>

          {/* Comodidades */}
          <SectionTitle title="Comodidades" />
          <SearchableSelect
            label="Comodidades"
            placeholder="Pesquise"
            options={comodidadeOptions}
            selected={(filters.comodidades ?? []).map((c) => ({ id: c, label: c }))}
            onChange={(sel) => onChange({ ...filters, comodidades: sel.map((s) => s.label) })}
            loading={sugestoesLoading}
          />

          {/* Disponíveis */}
          <SectionTitle title="Disponibilidade" />
          <TouchableOpacity
            style={[styles.toggleRow, filters.disponiveis && styles.toggleRowActive]}
            onPress={() => onChange({ ...filters, disponiveis: !filters.disponiveis })}
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

          {/* Ordenar */}
          <SectionTitle title="Ordenar por" />
          <View style={styles.chipRow}>
            {ORDENAR_OPTIONS.map((opt) => (
              <OptionChip
                key={opt.value}
                label={opt.label}
                active={(filters.ordenar_por ?? '') === opt.value}
                onPress={() => onChange({ ...filters, ordenar_por: opt.value || undefined })}
              />
            ))}
          </View>

          <View style={{ height: 16 }} />
        </ScrollView>

        {/* Footer buttons */}
        <View style={styles.footer}>
          <TouchableOpacity style={styles.clearBtn} onPress={onClear}>
            <Text style={styles.clearBtnText}>Limpar</Text>
          </TouchableOpacity>
          <TouchableOpacity style={styles.applyBtn} onPress={onApply}>
            <Text style={styles.applyBtnText}>Aplicar filtros</Text>
          </TouchableOpacity>
        </View>
      </View>
    </Modal>
  );
}

const styles = StyleSheet.create({
  backdrop: {
    flex: 1,
    backgroundColor: 'rgba(0,0,0,0.5)',
  },
  sheet: {
    backgroundColor: Palette.surface,
    borderTopLeftRadius: 24,
    borderTopRightRadius: 24,
    maxHeight: '80%',
    paddingTop: 12,
  },
  handle: {
    width: 36,
    height: 4,
    borderRadius: 2,
    backgroundColor: Palette.border,
    alignSelf: 'center',
    marginBottom: 12,
  },
  sheetHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    paddingHorizontal: Spacing.xl,
    paddingBottom: 16,
    borderBottomWidth: 1,
    borderBottomColor: Palette.borderLight,
  },
  sheetTitle: {
    fontSize: 18,
    fontWeight: '800',
    color: Palette.text,
  },
  scroll: {
    paddingHorizontal: Spacing.xl,
  },
  sectionTitle: {
    fontSize: 12,
    fontWeight: '700',
    color: Palette.textTertiary,
    textTransform: 'uppercase',
    letterSpacing: 0.8,
    marginTop: 20,
    marginBottom: 10,
  },
  chipRow: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    gap: 8,
  },
  chip: {
    paddingHorizontal: 14,
    paddingVertical: 8,
    borderRadius: Radius.full,
    borderWidth: 1.5,
    borderColor: Palette.border,
    backgroundColor: Palette.surface,
  },
  chipText: {
    fontSize: 13,
    fontWeight: '600',
    color: Palette.textSecondary,
  },
  chipTextActive: {
    color: Palette.white,
  },
  toggleRow: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    padding: 14,
    borderRadius: Radius.md,
    borderWidth: 1.5,
    borderColor: Palette.border,
  },
  toggleRowActive: {
    borderColor: Palette.primary,
    backgroundColor: Palette.primaryLight,
  },
  toggleLeft: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 8,
    flex: 1,
  },
  toggleText: {
    fontSize: 14,
    fontWeight: '600',
    color: Palette.textSecondary,
  },
  toggleTextActive: {
    color: Palette.primary,
  },
  toggleSwitch: {
    width: 40,
    height: 22,
    borderRadius: 11,
    backgroundColor: Palette.border,
    justifyContent: 'center',
    paddingHorizontal: 2,
  },
  toggleSwitchActive: {
    backgroundColor: Palette.primary,
  },
  toggleKnob: {
    width: 18,
    height: 18,
    borderRadius: 9,
    backgroundColor: Palette.white,
  },
  toggleKnobActive: {
    alignSelf: 'flex-end',
  },
  rangeRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 8,
  },
  rangeInput: {
    flex: 1,
    borderWidth: 1.5,
    borderColor: Palette.border,
    borderRadius: Radius.md,
    padding: 10,
    backgroundColor: Palette.surface,
  },
  rangeLabel: {
    fontSize: 10,
    fontWeight: '700',
    color: Palette.textTertiary,
    textTransform: 'uppercase',
    letterSpacing: 0.5,
    marginBottom: 2,
  },
  rangeField: {
    fontSize: 14,
    color: Palette.text,
    padding: 0,
    fontWeight: '600',
  },
  rangeSep: {
    fontSize: 18,
    color: Palette.textTertiary,
    fontWeight: '300',
  },
  footer: {
    flexDirection: 'row',
    gap: 10,
    paddingHorizontal: Spacing.xl,
    paddingTop: 16,
    borderTopWidth: 1,
    borderTopColor: Palette.borderLight,
  },
  clearBtn: {
    flex: 1,
    padding: 14,
    borderRadius: Radius.md,
    borderWidth: 1.5,
    borderColor: Palette.border,
    alignItems: 'center',
  },
  clearBtnText: {
    fontSize: 15,
    fontWeight: '700',
    color: Palette.textSecondary,
  },
  applyBtn: {
    flex: 2,
    padding: 14,
    borderRadius: Radius.md,
    backgroundColor: Palette.primary,
    alignItems: 'center',
  },
  applyBtnText: {
    fontSize: 15,
    fontWeight: '700',
    color: Palette.white,
  },
});
