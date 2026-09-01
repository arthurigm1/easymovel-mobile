import { useState } from 'react';
import {
  ActivityIndicator,
  Modal,
  Pressable,
  ScrollView,
  StyleSheet,
  Text,
  TouchableOpacity,
  View,
} from 'react-native';
import * as DocumentPicker from 'expo-document-picker';
import { Ionicons } from '@expo/vector-icons';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import toast from '@/utils/toast';
import { notifySuccess, tapMedium } from '@/utils/haptics';
import {
  atualizarUnidades,
  processarTabelaVendasIA,
} from '@/services/empreendimentos';
import { getUnitStatus } from '@/constants/status';
import { formatCurrencyExact } from '@/utils/format';
import { Palette, Radius, Shadow, Spacing, DisplayFont } from '@/constants/theme';
import type { UnidadeItem } from '@/types';

// Atualização da tabela de vendas via IA (dono construtora): anexa o PDF ou a
// planilha do mês, a IA lê as unidades, o app mostra o DIFF (status/valor
// antigo → novo) pra conferência e só aplica no "Aplicar" — mesmo desenho do
// ModalUploadTabelaVendas do PWA, no fluxo "atualizando" (metodo status_valor).

interface DiffRow {
  atual: UnidadeItem;
  novoStatus?: string;
  novoValor?: number;
  statusMudou: boolean;
  valorMudou: boolean;
}

interface Props {
  visible: boolean;
  onClose: () => void;
  empreendimentoId: string;
  allUnits: UnidadeItem[];
  onApplied: () => void;
}

function chave(u: { bloco?: string; descricao?: string }): string {
  return `${(u.bloco ?? '').trim().toLowerCase()}|${(u.descricao ?? '').trim().toLowerCase()}`;
}

type Fase = 'idle' | 'processando' | 'revisao' | 'aplicando';

export function TabelaIASheet({ visible, onClose, empreendimentoId, allUnits, onApplied }: Props) {
  const insets = useSafeAreaInsets();
  const [fase, setFase] = useState<Fase>('idle');
  const [diffs, setDiffs] = useState<DiffRow[]>([]);
  const [naoEncontradas, setNaoEncontradas] = useState(0);
  const [fileName, setFileName] = useState('');

  function reset() {
    setFase('idle');
    setDiffs([]);
    setNaoEncontradas(0);
    setFileName('');
  }

  function handleClose() {
    if (fase === 'processando' || fase === 'aplicando') return; // não abandona no meio
    reset();
    onClose();
  }

  async function escolherArquivo() {
    const result = await DocumentPicker.getDocumentAsync({
      type: [
        'application/pdf',
        'text/csv',
        'application/vnd.ms-excel',
        'application/vnd.openxmlformats-officedocument.spreadsheetml.sheet',
      ],
      copyToCacheDirectory: true,
    });
    if (result.canceled || !result.assets?.[0]) return;
    const asset = result.assets[0];
    setFileName(asset.name);
    setFase('processando');
    try {
      const resposta = await processarTabelaVendasIA(
        empreendimentoId,
        { uri: asset.uri, name: asset.name, mimeType: asset.mimeType },
        'status_valor'
      );
      const lidas = resposta.unidades ?? [];
      if (!lidas.length) {
        toast.error('A IA não encontrou unidades no arquivo. Confira o documento.');
        setFase('idle');
        return;
      }
      // Monta o diff casando por bloco+unidade com a tabela atual.
      const porChave = new Map(lidas.map((u) => [chave(u), u]));
      const rows: DiffRow[] = [];
      for (const atual of allUnits) {
        const nova = porChave.get(chave(atual));
        if (!nova) continue;
        porChave.delete(chave(atual));
        const novoStatus = nova.status ?? undefined;
        const novoValor =
          nova.valor != null && !Number.isNaN(Number(nova.valor)) ? Number(nova.valor) : undefined;
        rows.push({
          atual,
          novoStatus,
          novoValor,
          statusMudou: !!novoStatus && novoStatus !== (atual.status ?? ''),
          valorMudou: novoValor != null && novoValor !== (atual.valor ?? undefined),
        });
      }
      setDiffs(rows);
      setNaoEncontradas(porChave.size);
      setFase('revisao');
      notifySuccess();
    } catch {
      toast.error('Não foi possível processar o arquivo. Tente novamente.');
      setFase('idle');
    }
  }

  const mudancas = diffs.filter((d) => d.statusMudou || d.valorMudou);

  async function aplicar() {
    setFase('aplicando');
    try {
      const porId = new Map(
        diffs
          .filter((d) => d.statusMudou || d.valorMudou)
          .map((d) => [d.atual.id, d])
      );
      const atualizadas = allUnits.map((u) => {
        const d = porId.get(u.id);
        if (!d) return u;
        return {
          ...u,
          status: d.statusMudou ? d.novoStatus : u.status,
          valor: d.valorMudou ? d.novoValor : u.valor,
        };
      });
      await atualizarUnidades(empreendimentoId, atualizadas);
      notifySuccess();
      toast.success(`Tabela atualizada! ${mudancas.length} unidade(s) alterada(s).`);
      onApplied();
      reset();
      onClose();
    } catch {
      toast.error('Não foi possível aplicar as mudanças.');
      setFase('revisao');
    }
  }

  return (
    <Modal
      visible={visible}
      transparent
      animationType="slide"
      statusBarTranslucent
      onRequestClose={handleClose}
    >
      <Pressable
        style={styles.backdrop}
        onPress={handleClose}
        accessibilityRole="button"
        accessibilityLabel="Fechar atualização por IA"
      />
      <View style={[styles.sheet, { paddingBottom: insets.bottom + Spacing.lg }]}>
        <View style={styles.grabber} />

        {/* Header */}
        <View style={styles.header}>
          <View style={styles.headerIcon}>
            <Ionicons name="sparkles" size={17} color={Palette.white} />
          </View>
          <View style={styles.headerTexts}>
            <Text style={styles.headerTitle}>Atualizar com IA</Text>
            <Text style={styles.headerSub} numberOfLines={1}>
              {fase === 'revisao' ? fileName : 'Tabela de vendas em PDF ou planilha'}
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

        {fase === 'idle' && (
          <View style={styles.body}>
            <Text style={styles.intro}>
              Anexe a tabela de vendas do mês (PDF, CSV ou Excel). A IA lê o arquivo e mostra o
              que mudou — nada é aplicado sem a sua confirmação.
            </Text>
            <TouchableOpacity
              style={styles.pickBtn}
              onPress={() => {
                tapMedium();
                escolherArquivo();
              }}
              activeOpacity={0.85}
              accessibilityRole="button"
              accessibilityLabel="Escolher arquivo da tabela de vendas"
            >
              <Ionicons name="document-attach-outline" size={18} color={Palette.white} />
              <Text style={styles.pickBtnText}>Escolher arquivo</Text>
            </TouchableOpacity>
          </View>
        )}

        {(fase === 'processando' || fase === 'aplicando') && (
          <View style={[styles.body, styles.centerBody]}>
            <ActivityIndicator size="large" color={Palette.primary} />
            <Text style={styles.processandoTitle}>
              {fase === 'processando' ? 'A IA está lendo a tabela…' : 'Aplicando mudanças…'}
            </Text>
            {fase === 'processando' && (
              <Text style={styles.processandoSub}>
                Isso pode levar alguns minutos em arquivos grandes.
              </Text>
            )}
          </View>
        )}

        {fase === 'revisao' && (
          <>
            <ScrollView contentContainerStyle={styles.diffList}>
              {mudancas.length === 0 ? (
                <View style={styles.centerBody}>
                  <Ionicons name="checkmark-circle-outline" size={36} color={Palette.success} />
                  <Text style={styles.processandoTitle}>Nenhuma mudança encontrada</Text>
                  <Text style={styles.processandoSub}>
                    A tabela lida está igual à cadastrada.
                  </Text>
                </View>
              ) : (
                mudancas.map((d) => {
                  const de = getUnitStatus(d.atual.status);
                  const para = getUnitStatus(d.novoStatus);
                  return (
                    <View key={d.atual.id} style={styles.diffRow}>
                      <Text style={styles.diffUnidade} numberOfLines={1}>
                        {[d.atual.bloco ? `Bloco ${d.atual.bloco}` : null, d.atual.descricao]
                          .filter(Boolean)
                          .join(' · ')}
                      </Text>
                      {d.statusMudou && (
                        <View style={styles.diffLine}>
                          <View style={[styles.diffPill, { backgroundColor: de.bg }]}>
                            <Text style={[styles.diffPillText, { color: de.text }]}>
                              {d.atual.status ?? '—'}
                            </Text>
                          </View>
                          <Ionicons name="arrow-forward" size={13} color={Palette.textTertiary} />
                          <View style={[styles.diffPill, { backgroundColor: para.bg }]}>
                            <Text style={[styles.diffPillText, { color: para.text }]}>
                              {d.novoStatus}
                            </Text>
                          </View>
                        </View>
                      )}
                      {d.valorMudou && (
                        <View style={styles.diffLine}>
                          <Text style={styles.diffValorDe}>
                            {d.atual.valor != null ? formatCurrencyExact(d.atual.valor) : '—'}
                          </Text>
                          <Ionicons name="arrow-forward" size={13} color={Palette.textTertiary} />
                          <Text style={styles.diffValorPara}>
                            {formatCurrencyExact(d.novoValor)}
                          </Text>
                        </View>
                      )}
                    </View>
                  );
                })
              )}
              {naoEncontradas > 0 && (
                <Text style={styles.aviso}>
                  {naoEncontradas} unidade(s) do arquivo não casaram com a tabela atual e foram
                  ignoradas.
                </Text>
              )}
            </ScrollView>

            <View style={styles.footer}>
              <TouchableOpacity
                style={styles.discardBtn}
                onPress={() => {
                  reset();
                }}
                activeOpacity={0.8}
                accessibilityRole="button"
                accessibilityLabel="Descartar leitura da IA"
              >
                <Text style={styles.discardBtnText}>Descartar</Text>
              </TouchableOpacity>
              <TouchableOpacity
                style={[styles.applyBtn, mudancas.length === 0 && styles.applyBtnDisabled]}
                onPress={aplicar}
                disabled={mudancas.length === 0}
                activeOpacity={0.85}
                accessibilityRole="button"
                accessibilityState={{ disabled: mudancas.length === 0 }}
                accessibilityLabel={`Aplicar ${mudancas.length} mudanças`}
              >
                <Ionicons name="checkmark-circle" size={16} color={Palette.white} />
                <Text style={styles.applyBtnText}>
                  Aplicar{mudancas.length ? ` (${mudancas.length})` : ''}
                </Text>
              </TouchableOpacity>
            </View>
          </>
        )}
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
    maxHeight: '85%',
    minHeight: 300,
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
    borderRadius: Radius.full,
    backgroundColor: Palette.accent,
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

  body: {
    paddingHorizontal: Spacing.xl,
    gap: Spacing.lg,
    paddingBottom: Spacing.sm,
  },
  centerBody: {
    alignItems: 'center',
    justifyContent: 'center',
    gap: 8,
    paddingVertical: Spacing.xxl,
  },
  intro: {
    fontSize: 14,
    color: Palette.textSecondary,
    lineHeight: 20,
  },
  pickBtn: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    gap: 8,
    backgroundColor: Palette.primary,
    borderRadius: Radius.lg,
    paddingVertical: 15,
    minHeight: 52,
    ...Shadow.sm,
  },
  pickBtnText: {
    fontSize: 15,
    fontWeight: '800',
    color: Palette.white,
  },
  processandoTitle: {
    fontSize: 15,
    fontWeight: '800',
    color: Palette.text,
    marginTop: 6,
  },
  processandoSub: {
    fontSize: 13,
    color: Palette.textTertiary,
    textAlign: 'center',
  },

  diffList: {
    paddingHorizontal: Spacing.xl,
    gap: 8,
    paddingBottom: Spacing.sm,
  },
  diffRow: {
    backgroundColor: Palette.surface,
    borderRadius: Radius.lg,
    borderWidth: 1,
    borderColor: Palette.borderLight,
    padding: 12,
    gap: 6,
    ...Shadow.xs,
  },
  diffUnidade: {
    fontSize: 14,
    fontWeight: '800',
    color: Palette.text,
    letterSpacing: -0.1,
  },
  diffLine: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 8,
  },
  diffPill: {
    borderRadius: Radius.full,
    paddingHorizontal: 9,
    paddingVertical: 3,
  },
  diffPillText: {
    fontSize: 11.5,
    fontWeight: '800',
  },
  diffValorDe: {
    fontSize: 13,
    fontWeight: '600',
    color: Palette.textTertiary,
    textDecorationLine: 'line-through',
  },
  diffValorPara: {
    fontFamily: DisplayFont.bold,
    fontSize: 13.5,
    color: Palette.primary,
  },
  aviso: {
    fontSize: 12,
    color: Palette.warning,
    lineHeight: 16,
    paddingTop: 4,
  },

  footer: {
    flexDirection: 'row',
    gap: 10,
    paddingHorizontal: Spacing.xl,
    paddingTop: Spacing.md,
  },
  discardBtn: {
    flex: 1,
    alignItems: 'center',
    justifyContent: 'center',
    minHeight: 48,
    borderRadius: Radius.lg,
    backgroundColor: Palette.surfaceVariant,
    borderWidth: 1,
    borderColor: Palette.border,
  },
  discardBtnText: {
    fontSize: 14,
    fontWeight: '700',
    color: Palette.textSecondary,
  },
  applyBtn: {
    flex: 2,
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    gap: 6,
    minHeight: 48,
    borderRadius: Radius.lg,
    backgroundColor: Palette.primary,
    ...Shadow.sm,
  },
  applyBtnDisabled: { opacity: 0.5 },
  applyBtnText: {
    fontSize: 14,
    fontWeight: '800',
    color: Palette.white,
  },
});
