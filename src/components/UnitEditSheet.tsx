import { useEffect, useState } from 'react';
import {
  ActivityIndicator,
  Alert,
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
import toast from '@/utils/toast';
import { notifySuccess, select } from '@/utils/haptics';
import {
  atualizarUnidades,
  criarUnidade,
  excluirUnidade,
} from '@/services/empreendimentos';
import { UNIT_STATUS } from '@/constants/status';
import { formatCurrencyExact } from '@/utils/format';
import { Palette, Radius, Shadow, Spacing, DisplayFont } from '@/constants/theme';
import type { UnidadeItem } from '@/types';

// Edição/criação rápida de unidade (dono construtora) — vendeu/reservou →
// atualiza na hora. Mesmos contratos do PWA:
//  - editar: PUT /empreendimentos/:id com a lista completa de unidades
//  - criar:  POST /unidades/:empreendimento_id
//  - excluir: DELETE /unidades/:id

const STATUS_OPTIONS = [
  'Disponível',
  'Reservado',
  'Vendido',
  'Promoção',
  'Decorado',
  'Modelo',
  'Indisponível',
];

interface Props {
  visible: boolean;
  onClose: () => void;
  /** Unidade em edição — null com visible=true entra no modo "nova unidade". */
  unit: UnidadeItem | null;
  empreendimentoId: string;
  /** Lista completa de unidades do empreendimento (o PUT de edição envia todas). */
  allUnits: UnidadeItem[];
  variosBlocos?: boolean;
  onSaved: () => void;
}

// "1234,56" | "1.234,56" → número (ou undefined se vazio/inválido)
function parseValor(raw: string): number | undefined {
  const trimmed = raw.trim();
  if (!trimmed) return undefined;
  const normalized = trimmed.replace(/\./g, '').replace(',', '.');
  const num = Number(normalized);
  return Number.isNaN(num) ? undefined : num;
}

function parseIntOr(raw: string): number | undefined {
  const n = Number(raw.trim());
  return raw.trim() && Number.isInteger(n) && n >= 0 ? n : undefined;
}

export function UnitEditSheet({
  visible,
  onClose,
  unit,
  empreendimentoId,
  allUnits,
  variosBlocos,
  onSaved,
}: Props) {
  const insets = useSafeAreaInsets();
  const isNew = unit == null;

  const [status, setStatus] = useState<string>('Disponível');
  const [valorText, setValorText] = useState('');
  const [descricao, setDescricao] = useState('');
  const [tipologia, setTipologia] = useState('');
  const [bloco, setBloco] = useState('');
  const [areaText, setAreaText] = useState('');
  const [quartosText, setQuartosText] = useState('');
  const [vagasText, setVagasText] = useState('');
  const [saving, setSaving] = useState(false);
  const [deleting, setDeleting] = useState(false);

  // Sincroniza o formulário a cada abertura.
  useEffect(() => {
    if (!visible) return;
    setStatus(unit?.status ?? 'Disponível');
    setValorText(
      unit?.valor != null && Number(unit.valor) > 0
        ? Number(unit.valor).toLocaleString('pt-BR', {
            minimumFractionDigits: 2,
            maximumFractionDigits: 2,
          })
        : ''
    );
    setDescricao(unit?.descricao ?? '');
    setTipologia(unit?.tipologia ?? '');
    setBloco(unit?.bloco ?? '');
    setAreaText(unit?.area != null ? String(unit.area) : '');
    setQuartosText(unit?.quant_quartos != null ? String(unit.quant_quartos) : '');
    setVagasText(unit?.quant_vagas != null ? String(unit.quant_vagas) : '');
  }, [visible, unit]);

  const unitLabel = isNew
    ? 'Nova unidade'
    : [unit?.tipologia, unit?.descricao].filter(Boolean).join(' · ') || 'Unidade';
  const novoValor = parseValor(valorText);
  const canSave = isNew
    ? descricao.trim().length > 0
    : status !== (unit?.status ?? '') || novoValor !== (unit?.valor ?? undefined);

  async function handleSave() {
    setSaving(true);
    try {
      if (isNew) {
        await criarUnidade(empreendimentoId, {
          descricao: descricao.trim(),
          tipologia: tipologia.trim() || undefined,
          bloco: variosBlocos ? bloco.trim() || undefined : undefined,
          status,
          valor: novoValor,
          area: parseValor(areaText),
          quant_quartos: parseIntOr(quartosText),
          quant_vagas: parseIntOr(vagasText),
        });
        toast.success('Unidade adicionada!');
      } else {
        const updated = allUnits.map((u) =>
          u.id === unit!.id ? { ...u, status, valor: novoValor } : u
        );
        await atualizarUnidades(empreendimentoId, updated);
        toast.success('Unidade atualizada!');
      }
      notifySuccess();
      onSaved();
      onClose();
    } catch {
      toast.error('Não foi possível salvar. Tente novamente.');
    } finally {
      setSaving(false);
    }
  }

  function handleDelete() {
    if (!unit) return;
    Alert.alert(
      'Excluir unidade',
      `Excluir a unidade ${unit.descricao ?? ''}? Essa ação não pode ser desfeita.`,
      [
        { text: 'Cancelar', style: 'cancel' },
        {
          text: 'Excluir',
          style: 'destructive',
          onPress: async () => {
            setDeleting(true);
            try {
              await excluirUnidade(unit.id);
              toast.success('Unidade excluída.');
              onSaved();
              onClose();
            } catch {
              toast.error('Não foi possível excluir. Tente novamente.');
            } finally {
              setDeleting(false);
            }
          },
        },
      ]
    );
  }

  return (
    <Modal
      visible={visible}
      transparent
      animationType="slide"
      statusBarTranslucent
      onRequestClose={onClose}
    >
      <Pressable
        style={styles.backdrop}
        onPress={onClose}
        accessibilityRole="button"
        accessibilityLabel="Fechar edição de unidade"
      />
      <KeyboardAvoidingView behavior={Platform.OS === 'ios' ? 'padding' : undefined}>
        <View style={[styles.sheet, { paddingBottom: insets.bottom + Spacing.lg }]}>
          <View style={styles.grabber} />

          {/* Header */}
          <View style={styles.header}>
            <View style={styles.headerIcon}>
              <Ionicons
                name={isNew ? 'add' : 'create-outline'}
                size={18}
                color={Palette.primary}
              />
            </View>
            <View style={styles.headerTexts}>
              <Text style={styles.headerTitle}>
                {isNew ? 'Adicionar unidade' : 'Editar unidade'}
              </Text>
              <Text style={styles.headerSub} numberOfLines={1}>
                {unitLabel}
              </Text>
            </View>
            <TouchableOpacity
              style={styles.closeBtn}
              onPress={onClose}
              activeOpacity={0.8}
              hitSlop={{ top: 8, bottom: 8, left: 8, right: 8 }}
              accessibilityRole="button"
              accessibilityLabel="Fechar"
            >
              <Ionicons name="close" size={20} color={Palette.textSecondary} />
            </TouchableOpacity>
          </View>

          <ScrollView
            keyboardShouldPersistTaps="handled"
            contentContainerStyle={styles.scrollContent}
          >
            {/* Identificação (só no modo novo) */}
            {isNew && (
              <>
                <View style={styles.rowFields}>
                  <View style={[styles.field, styles.fieldFlex]}>
                    <Text style={styles.fieldLabel}>Unidade *</Text>
                    <TextInput
                      style={styles.input}
                      value={descricao}
                      onChangeText={setDescricao}
                      placeholder="Ex.: 502"
                      placeholderTextColor={Palette.textTertiary}
                      accessibilityLabel="Identificação da unidade"
                    />
                  </View>
                  {variosBlocos ? (
                    <View style={[styles.field, styles.fieldFlex]}>
                      <Text style={styles.fieldLabel}>Bloco</Text>
                      <TextInput
                        style={styles.input}
                        value={bloco}
                        onChangeText={setBloco}
                        placeholder="Ex.: A"
                        placeholderTextColor={Palette.textTertiary}
                        accessibilityLabel="Bloco"
                      />
                    </View>
                  ) : null}
                </View>
                <View style={styles.field}>
                  <Text style={styles.fieldLabel}>Tipologia</Text>
                  <TextInput
                    style={styles.input}
                    value={tipologia}
                    onChangeText={setTipologia}
                    placeholder="Ex.: Apto. Tipo"
                    placeholderTextColor={Palette.textTertiary}
                    accessibilityLabel="Tipologia"
                  />
                </View>
                <View style={styles.rowFields}>
                  <View style={[styles.field, styles.fieldFlex]}>
                    <Text style={styles.fieldLabel}>Área (m²)</Text>
                    <TextInput
                      style={styles.input}
                      value={areaText}
                      onChangeText={setAreaText}
                      placeholder="0"
                      placeholderTextColor={Palette.textTertiary}
                      keyboardType="decimal-pad"
                      accessibilityLabel="Área interna em metros quadrados"
                    />
                  </View>
                  <View style={[styles.field, styles.fieldFlex]}>
                    <Text style={styles.fieldLabel}>Quartos</Text>
                    <TextInput
                      style={styles.input}
                      value={quartosText}
                      onChangeText={setQuartosText}
                      placeholder="0"
                      placeholderTextColor={Palette.textTertiary}
                      keyboardType="number-pad"
                      accessibilityLabel="Quantidade de quartos"
                    />
                  </View>
                  <View style={[styles.field, styles.fieldFlex]}>
                    <Text style={styles.fieldLabel}>Vagas</Text>
                    <TextInput
                      style={styles.input}
                      value={vagasText}
                      onChangeText={setVagasText}
                      placeholder="0"
                      placeholderTextColor={Palette.textTertiary}
                      keyboardType="number-pad"
                      accessibilityLabel="Quantidade de vagas"
                    />
                  </View>
                </View>
              </>
            )}

            {/* Status */}
            <View style={styles.field}>
              <Text style={styles.fieldLabel}>Status</Text>
              <View style={styles.statusGrid}>
                {STATUS_OPTIONS.map((s) => {
                  const cfg = UNIT_STATUS[s];
                  const active = status === s;
                  return (
                    <TouchableOpacity
                      key={s}
                      style={[
                        styles.statusChip,
                        { borderColor: active ? cfg.dot : Palette.border },
                        active && { backgroundColor: cfg.bg },
                      ]}
                      onPress={() => {
                        select();
                        setStatus(s);
                      }}
                      activeOpacity={0.8}
                      accessibilityRole="radio"
                      accessibilityState={{ checked: active }}
                      accessibilityLabel={`Status ${s}`}
                    >
                      <View style={[styles.statusDot, { backgroundColor: cfg.dot }]} />
                      <Text
                        style={[
                          styles.statusText,
                          active && { color: cfg.text, fontWeight: '800' },
                        ]}
                      >
                        {s}
                      </Text>
                      {active && <Ionicons name="checkmark" size={13} color={cfg.text} />}
                    </TouchableOpacity>
                  );
                })}
              </View>
            </View>

            {/* Valor */}
            <View style={styles.field}>
              <Text style={styles.fieldLabel}>Valor (R$)</Text>
              <TextInput
                style={styles.input}
                value={valorText}
                onChangeText={setValorText}
                placeholder="Ex.: 450.000,00"
                placeholderTextColor={Palette.textTertiary}
                keyboardType="decimal-pad"
                returnKeyType="done"
                accessibilityLabel="Valor da unidade em reais"
              />
              {novoValor != null && (
                <Text style={styles.valorPreview}>{formatCurrencyExact(novoValor)}</Text>
              )}
            </View>

            {/* Salvar */}
            <TouchableOpacity
              style={[styles.saveBtn, (!canSave || saving) && styles.saveBtnDisabled]}
              onPress={handleSave}
              disabled={!canSave || saving}
              activeOpacity={0.85}
              accessibilityRole="button"
              accessibilityState={{ disabled: !canSave || saving, busy: saving }}
              accessibilityLabel={isNew ? 'Adicionar unidade' : 'Salvar alterações da unidade'}
            >
              {saving ? (
                <ActivityIndicator size="small" color={Palette.white} />
              ) : (
                <>
                  <Ionicons
                    name={isNew ? 'add-circle' : 'checkmark-circle'}
                    size={17}
                    color={Palette.white}
                  />
                  <Text style={styles.saveBtnText}>
                    {isNew ? 'Adicionar unidade' : 'Salvar alterações'}
                  </Text>
                </>
              )}
            </TouchableOpacity>

            {/* Excluir (só edição) */}
            {!isNew && (
              <TouchableOpacity
                style={styles.deleteBtn}
                onPress={handleDelete}
                disabled={deleting}
                activeOpacity={0.8}
                accessibilityRole="button"
                accessibilityState={{ disabled: deleting, busy: deleting }}
                accessibilityLabel="Excluir esta unidade"
              >
                {deleting ? (
                  <ActivityIndicator size="small" color={Palette.error} />
                ) : (
                  <>
                    <Ionicons name="trash-outline" size={15} color={Palette.error} />
                    <Text style={styles.deleteBtnText}>Excluir unidade</Text>
                  </>
                )}
              </TouchableOpacity>
            )}

            <Text style={styles.hint}>
              A tabela de vendas é atualizada na hora para todos os corretores.
            </Text>
          </ScrollView>
        </View>
      </KeyboardAvoidingView>
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
    maxHeight: '90%',
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

  rowFields: {
    flexDirection: 'row',
    gap: 10,
  },
  field: { gap: 8 },
  fieldFlex: { flex: 1 },
  fieldLabel: {
    fontSize: 12.5,
    fontWeight: '700',
    color: Palette.textSecondary,
    textTransform: 'uppercase',
    letterSpacing: 0.4,
  },
  statusGrid: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    gap: 8,
  },
  statusChip: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 6,
    minHeight: 40,
    paddingHorizontal: 12,
    borderRadius: Radius.full,
    backgroundColor: Palette.surface,
    borderWidth: 1.5,
  },
  statusDot: {
    width: 8,
    height: 8,
    borderRadius: 4,
  },
  statusText: {
    fontSize: 13,
    fontWeight: '600',
    color: Palette.textSecondary,
  },
  input: {
    backgroundColor: Palette.surface,
    borderWidth: 1.5,
    borderColor: Palette.borderLight,
    borderRadius: Radius.lg,
    paddingHorizontal: Spacing.md,
    paddingVertical: 13,
    fontSize: 16,
    fontWeight: '600',
    color: Palette.text,
  },
  valorPreview: {
    fontFamily: DisplayFont.bold,
    fontSize: 14,
    color: Palette.primary,
    letterSpacing: -0.2,
  },

  saveBtn: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    gap: 8,
    backgroundColor: Palette.primary,
    borderRadius: Radius.lg,
    paddingVertical: 15,
    minHeight: 52,
    marginTop: 4,
    ...Shadow.sm,
  },
  saveBtnDisabled: { opacity: 0.5 },
  saveBtnText: {
    fontSize: 15,
    fontWeight: '800',
    color: Palette.white,
  },
  deleteBtn: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    gap: 6,
    minHeight: 44,
    borderRadius: Radius.lg,
    backgroundColor: Palette.errorBg,
  },
  deleteBtnText: {
    fontSize: 13.5,
    fontWeight: '800',
    color: Palette.error,
  },
  hint: {
    fontSize: 12,
    color: Palette.textTertiary,
    textAlign: 'center',
    lineHeight: 16,
    paddingBottom: Spacing.sm,
  },
});
