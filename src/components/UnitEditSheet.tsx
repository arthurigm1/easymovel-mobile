import { useEffect, useState } from 'react';
import {
  ActivityIndicator,
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
import { atualizarUnidades } from '@/services/empreendimentos';
import { UNIT_STATUS } from '@/constants/status';
import { formatCurrencyExact } from '@/utils/format';
import { Palette, Radius, Shadow, Spacing, DisplayFont } from '@/constants/theme';
import type { UnidadeItem } from '@/types';

// Edição rápida de unidade (dono construtora) — a ação nº 1 do celular:
// vendeu/reservou → atualiza o status e o valor na hora. Mesmo contrato do
// PWA: PUT /empreendimentos/:id com a lista completa de unidades.

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
  unit: UnidadeItem | null;
  empreendimentoId: string;
  /** Lista completa de unidades do empreendimento (o PUT envia todas). */
  allUnits: UnidadeItem[];
  onSaved: () => void;
}

// "1234,56" | "1.234,56" | "1234.56" → número (ou undefined se vazio/inválido)
function parseValor(raw: string): number | undefined {
  const trimmed = raw.trim();
  if (!trimmed) return undefined;
  const normalized = trimmed.replace(/\./g, '').replace(',', '.');
  const num = Number(normalized);
  return Number.isNaN(num) ? undefined : num;
}

export function UnitEditSheet({
  visible,
  onClose,
  unit,
  empreendimentoId,
  allUnits,
  onSaved,
}: Props) {
  const insets = useSafeAreaInsets();
  const [status, setStatus] = useState<string>('Disponível');
  const [valorText, setValorText] = useState('');
  const [saving, setSaving] = useState(false);

  // Sincroniza o formulário com a unidade selecionada a cada abertura.
  useEffect(() => {
    if (visible && unit) {
      setStatus(unit.status ?? 'Disponível');
      setValorText(
        unit.valor != null && Number(unit.valor) > 0
          ? Number(unit.valor).toLocaleString('pt-BR', {
              minimumFractionDigits: 2,
              maximumFractionDigits: 2,
            })
          : ''
      );
    }
  }, [visible, unit]);

  if (!unit) return null;

  const unitLabel = [unit.tipologia, unit.descricao].filter(Boolean).join(' · ');
  const novoValor = parseValor(valorText);
  const mudou = status !== (unit.status ?? '') || novoValor !== (unit.valor ?? undefined);

  async function handleSave() {
    if (!unit) return;
    setSaving(true);
    try {
      const updated = allUnits.map((u) =>
        u.id === unit.id ? { ...u, status, valor: novoValor } : u
      );
      await atualizarUnidades(empreendimentoId, updated);
      notifySuccess();
      toast.success('Unidade atualizada!');
      onSaved();
      onClose();
    } catch {
      toast.error('Não foi possível salvar. Tente novamente.');
    } finally {
      setSaving(false);
    }
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
              <Ionicons name="create-outline" size={18} color={Palette.primary} />
            </View>
            <View style={styles.headerTexts}>
              <Text style={styles.headerTitle}>Editar unidade</Text>
              <Text style={styles.headerSub} numberOfLines={1}>
                {unitLabel || 'Unidade'}
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
                      {active && (
                        <Ionicons name="checkmark" size={13} color={cfg.text} />
                      )}
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
              style={[styles.saveBtn, (!mudou || saving) && styles.saveBtnDisabled]}
              onPress={handleSave}
              disabled={!mudou || saving}
              activeOpacity={0.85}
              accessibilityRole="button"
              accessibilityState={{ disabled: !mudou || saving, busy: saving }}
              accessibilityLabel="Salvar alterações da unidade"
            >
              {saving ? (
                <ActivityIndicator size="small" color={Palette.white} />
              ) : (
                <>
                  <Ionicons name="checkmark-circle" size={17} color={Palette.white} />
                  <Text style={styles.saveBtnText}>Salvar alterações</Text>
                </>
              )}
            </TouchableOpacity>

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

  field: { gap: 8 },
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
  hint: {
    fontSize: 12,
    color: Palette.textTertiary,
    textAlign: 'center',
    lineHeight: 16,
    paddingBottom: Spacing.sm,
  },
});
