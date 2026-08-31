import { useEffect, useMemo, useState } from 'react';
import {
  ActivityIndicator,
  KeyboardAvoidingView,
  Linking,
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
import * as Clipboard from 'expo-clipboard';
import { Ionicons } from '@expo/vector-icons';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import toast from '@/utils/toast';
import { notifySuccess, select, tapMedium } from '@/utils/haptics';
import {
  criarConsumidor,
  criarHotsite,
  getConsumidores,
  hotsiteUrl,
  hotsiteWhatsappText,
  whatsappSendUrl,
  type Consumidor,
} from '@/services/hotsites';
import { Palette, Radius, Shadow, Spacing, DisplayFont } from '@/constants/theme';

// Versão nativa do ModalGerarHotsite do PWA: o corretor escolhe/cadastra o
// cliente, decide se envia valores/apresentação e recebe o link pronto pra
// copiar, abrir ou mandar no WhatsApp.

interface Props {
  visible: boolean;
  onClose: () => void;
  empreendimentoId: string;
  empreendimentoNome: string;
  bairro?: string | null;
  tipoProduto?: string;
}

export function GerarHotsiteSheet({
  visible,
  onClose,
  empreendimentoId,
  empreendimentoNome,
  bairro,
  tipoProduto,
}: Props) {
  const insets = useSafeAreaInsets();
  const isAvulso = tipoProduto === 'imovel-avulso';

  const [nome, setNome] = useState('');
  const [consumidores, setConsumidores] = useState<Consumidor[]>([]);
  const [exibirValores, setExibirValores] = useState(false);
  const [exibirApresentacao, setExibirApresentacao] = useState(false);
  const [gerando, setGerando] = useState(false);
  const [hotsiteId, setHotsiteId] = useState<string | null>(null);
  const [copiado, setCopiado] = useState(false);

  // Lista de clientes já cadastrados — carregada quando o sheet abre.
  useEffect(() => {
    if (!visible) return;
    getConsumidores()
      .then(setConsumidores)
      .catch(() => {});
  }, [visible]);

  const sugestoes = useMemo(() => {
    const termo = nome.trim().toLowerCase();
    if (!termo) return consumidores.slice(0, 4);
    return consumidores
      .filter((c) => c.nome.toLowerCase().includes(termo) && c.nome.toLowerCase() !== termo)
      .slice(0, 4);
  }, [nome, consumidores]);

  function resetAndClose() {
    setNome('');
    setExibirValores(false);
    setExibirApresentacao(false);
    setHotsiteId(null);
    setCopiado(false);
    onClose();
  }

  async function handleGerar() {
    const nomeCliente = nome.trim();
    if (!nomeCliente) return;
    setGerando(true);
    try {
      // Mesmo fluxo do PWA: reusa consumidor com o mesmo nome, senão cria.
      const existente = consumidores.find(
        (c) => c.nome.toLowerCase() === nomeCliente.toLowerCase()
      );
      const consumidorId = existente ? existente.id : (await criarConsumidor(nomeCliente)).id;
      const { id } = await criarHotsite({
        empreendimento_id: empreendimentoId,
        consumidor_id: consumidorId,
        exibir_valores: exibirValores,
        exibir_apresentacao: exibirApresentacao,
      });
      setHotsiteId(id);
      notifySuccess();
    } catch {
      toast.error('Não foi possível gerar o hotsite. Tente novamente.');
    } finally {
      setGerando(false);
    }
  }

  async function handleCopiar() {
    if (!hotsiteId) return;
    await Clipboard.setStringAsync(hotsiteUrl(hotsiteId));
    setCopiado(true);
    select();
    setTimeout(() => setCopiado(false), 2000);
  }

  function handleWhatsapp() {
    if (!hotsiteId) return;
    tapMedium();
    const text = hotsiteWhatsappText({
      id: hotsiteId,
      nomeEmpreendimento: empreendimentoNome,
      bairro,
    });
    Linking.openURL(whatsappSendUrl(text));
  }

  function handleAbrir() {
    if (!hotsiteId) return;
    Linking.openURL(hotsiteUrl(hotsiteId));
  }

  return (
    <Modal
      visible={visible}
      transparent
      animationType="slide"
      statusBarTranslucent
      onRequestClose={resetAndClose}
    >
      <Pressable
        style={styles.backdrop}
        onPress={resetAndClose}
        accessibilityRole="button"
        accessibilityLabel="Fechar geração de hotsite"
      />
      <KeyboardAvoidingView behavior={Platform.OS === 'ios' ? 'padding' : undefined}>
        <View style={[styles.sheet, { paddingBottom: insets.bottom + Spacing.lg }]}>
          <View style={styles.grabber} />

          {/* Header */}
          <View style={styles.header}>
            <View style={styles.headerIcon}>
              <Ionicons name="paper-plane" size={17} color={Palette.white} />
            </View>
            <View style={styles.headerTexts}>
              <Text style={styles.headerTitle}>Gerar Hotsite</Text>
              <Text style={styles.headerSub} numberOfLines={1}>
                {empreendimentoNome}
              </Text>
            </View>
            <TouchableOpacity
              style={styles.closeBtn}
              onPress={resetAndClose}
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
            {hotsiteId == null ? (
              <>
                <Text style={styles.intro}>
                  Gere uma página exclusiva com sua foto e contato e compartilhe este
                  empreendimento com seus clientes.
                </Text>

                {/* Nome do cliente */}
                <View style={styles.field}>
                  <Text style={styles.fieldLabel}>Nome do cliente</Text>
                  <TextInput
                    style={styles.input}
                    value={nome}
                    onChangeText={setNome}
                    placeholder="Ex.: Maria Silva"
                    placeholderTextColor={Palette.textTertiary}
                    autoCapitalize="words"
                    returnKeyType="done"
                    accessibilityLabel="Nome do cliente"
                  />
                  {sugestoes.length > 0 && (
                    <View style={styles.sugestoes}>
                      {sugestoes.map((c) => (
                        <TouchableOpacity
                          key={c.id}
                          style={styles.sugestaoChip}
                          onPress={() => {
                            select();
                            setNome(c.nome);
                          }}
                          activeOpacity={0.8}
                          accessibilityRole="button"
                          accessibilityLabel={`Usar cliente ${c.nome}`}
                        >
                          <Ionicons name="person-outline" size={12} color={Palette.primaryDark} />
                          <Text style={styles.sugestaoText} numberOfLines={1}>
                            {c.nome}
                          </Text>
                        </TouchableOpacity>
                      ))}
                    </View>
                  )}
                </View>

                {/* Opções */}
                <TouchableOpacity
                  style={styles.checkRow}
                  onPress={() => {
                    select();
                    setExibirValores((v) => !v);
                  }}
                  activeOpacity={0.75}
                  accessibilityRole="checkbox"
                  accessibilityState={{ checked: exibirValores }}
                >
                  <View style={[styles.checkbox, exibirValores && styles.checkboxOn]}>
                    {exibirValores && <Ionicons name="checkmark" size={14} color={Palette.white} />}
                  </View>
                  <Text style={styles.checkLabel}>
                    {isAvulso
                      ? 'Enviar as informações com o valor do imóvel'
                      : 'Enviar com valores e condições de pagamento'}
                  </Text>
                </TouchableOpacity>

                {!isAvulso && (
                  <>
                    <TouchableOpacity
                      style={styles.checkRow}
                      onPress={() => {
                        select();
                        setExibirApresentacao((v) => !v);
                      }}
                      activeOpacity={0.75}
                      accessibilityRole="checkbox"
                      accessibilityState={{ checked: exibirApresentacao }}
                    >
                      <View style={[styles.checkbox, exibirApresentacao && styles.checkboxOn]}>
                        {exibirApresentacao && (
                          <Ionicons name="checkmark" size={14} color={Palette.white} />
                        )}
                      </View>
                      <Text style={styles.checkLabel}>Exibir apresentação</Text>
                    </TouchableOpacity>
                    {exibirApresentacao && (
                      <Text style={styles.aviso}>
                        * A apresentação inserida pode conter o telefone da construtora.
                      </Text>
                    )}
                  </>
                )}

                {/* Gerar */}
                <TouchableOpacity
                  style={[styles.gerarBtn, (!nome.trim() || gerando) && styles.gerarBtnDisabled]}
                  onPress={handleGerar}
                  disabled={!nome.trim() || gerando}
                  activeOpacity={0.85}
                  accessibilityRole="button"
                  accessibilityState={{ disabled: !nome.trim() || gerando, busy: gerando }}
                  accessibilityLabel="Gerar hotsite"
                >
                  {gerando ? (
                    <ActivityIndicator size="small" color={Palette.white} />
                  ) : (
                    <>
                      <Ionicons name="sparkles" size={16} color={Palette.white} />
                      <Text style={styles.gerarBtnText}>Gerar hotsite</Text>
                    </>
                  )}
                </TouchableOpacity>
              </>
            ) : (
              <>
                {/* Sucesso */}
                <View style={styles.successBlock}>
                  <View style={styles.successIcon}>
                    <Ionicons name="checkmark" size={30} color={Palette.white} />
                  </View>
                  <Text style={styles.successTitle}>Hotsite pronto!</Text>
                  <Text style={styles.successSub}>
                    Página exclusiva para <Text style={styles.successNome}>{nome.trim()}</Text>
                  </Text>
                </View>

                <View style={styles.linkBox}>
                  <Ionicons name="link-outline" size={15} color={Palette.textTertiary} />
                  <Text style={styles.linkText} numberOfLines={1}>
                    {hotsiteUrl(hotsiteId)}
                  </Text>
                </View>

                <TouchableOpacity
                  style={styles.waBtn}
                  onPress={handleWhatsapp}
                  activeOpacity={0.85}
                  accessibilityRole="button"
                  accessibilityLabel="Enviar hotsite no WhatsApp"
                >
                  <Ionicons name="logo-whatsapp" size={18} color={Palette.white} />
                  <Text style={styles.waBtnText}>Enviar no WhatsApp</Text>
                </TouchableOpacity>

                <View style={styles.secondaryRow}>
                  <TouchableOpacity
                    style={styles.secondaryBtn}
                    onPress={handleCopiar}
                    activeOpacity={0.8}
                    accessibilityRole="button"
                    accessibilityLabel="Copiar link do hotsite"
                  >
                    <Ionicons
                      name={copiado ? 'checkmark' : 'copy-outline'}
                      size={15}
                      color={Palette.primary}
                    />
                    <Text style={styles.secondaryBtnText}>
                      {copiado ? 'Copiado!' : 'Copiar link'}
                    </Text>
                  </TouchableOpacity>
                  <TouchableOpacity
                    style={styles.secondaryBtn}
                    onPress={handleAbrir}
                    activeOpacity={0.8}
                    accessibilityRole="button"
                    accessibilityLabel="Abrir hotsite no navegador"
                  >
                    <Ionicons name="open-outline" size={15} color={Palette.primary} />
                    <Text style={styles.secondaryBtnText}>Abrir</Text>
                  </TouchableOpacity>
                </View>
              </>
            )}
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
  scrollContent: {
    paddingHorizontal: Spacing.xl,
    paddingTop: Spacing.xs,
    gap: Spacing.lg,
  },
  intro: {
    fontSize: 14,
    color: Palette.textSecondary,
    lineHeight: 20,
  },

  field: { gap: 8 },
  fieldLabel: {
    fontSize: 12.5,
    fontWeight: '700',
    color: Palette.textSecondary,
    textTransform: 'uppercase',
    letterSpacing: 0.4,
  },
  input: {
    backgroundColor: Palette.surface,
    borderWidth: 1.5,
    borderColor: Palette.borderLight,
    borderRadius: Radius.lg,
    paddingHorizontal: Spacing.md,
    paddingVertical: 13,
    fontSize: 15,
    color: Palette.text,
  },
  sugestoes: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    gap: 6,
  },
  sugestaoChip: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 5,
    backgroundColor: Palette.primaryLight,
    borderWidth: 1,
    borderColor: Palette.primaryMid,
    borderRadius: Radius.full,
    paddingHorizontal: 10,
    paddingVertical: 6,
    maxWidth: '48%',
  },
  sugestaoText: {
    fontSize: 12.5,
    fontWeight: '600',
    color: Palette.primaryDark,
    flexShrink: 1,
  },

  checkRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 10,
    minHeight: 40,
  },
  checkbox: {
    width: 22,
    height: 22,
    borderRadius: 6,
    borderWidth: 2,
    borderColor: Palette.borderStrong,
    backgroundColor: Palette.surface,
    alignItems: 'center',
    justifyContent: 'center',
  },
  checkboxOn: {
    backgroundColor: Palette.primary,
    borderColor: Palette.primary,
  },
  checkLabel: {
    flex: 1,
    fontSize: 14,
    fontWeight: '500',
    color: Palette.text,
    lineHeight: 19,
  },
  aviso: {
    fontSize: 12,
    color: Palette.warning,
    marginTop: -8,
    marginLeft: 32,
    lineHeight: 16,
  },

  gerarBtn: {
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
  gerarBtnDisabled: { opacity: 0.5 },
  gerarBtnText: {
    fontSize: 15,
    fontWeight: '800',
    color: Palette.white,
  },

  // ── Sucesso ──
  successBlock: {
    alignItems: 'center',
    gap: 6,
    paddingTop: Spacing.sm,
  },
  successIcon: {
    width: 56,
    height: 56,
    borderRadius: Radius.full,
    backgroundColor: Palette.success,
    alignItems: 'center',
    justifyContent: 'center',
    marginBottom: 4,
    ...Shadow.sm,
  },
  successTitle: {
    fontFamily: DisplayFont.bold,
    fontSize: 19,
    color: Palette.text,
    letterSpacing: -0.3,
  },
  successSub: {
    fontSize: 13.5,
    color: Palette.textSecondary,
  },
  successNome: { fontWeight: '700', color: Palette.text },

  linkBox: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 8,
    backgroundColor: Palette.surfaceVariant,
    borderWidth: 1,
    borderColor: Palette.border,
    borderRadius: Radius.md,
    paddingHorizontal: Spacing.md,
    paddingVertical: 11,
  },
  linkText: {
    flex: 1,
    fontSize: 12.5,
    color: Palette.textSecondary,
    fontWeight: '500',
  },

  waBtn: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    gap: 8,
    backgroundColor: '#25D366',
    borderRadius: Radius.lg,
    paddingVertical: 15,
    minHeight: 52,
    ...Shadow.sm,
  },
  waBtnText: {
    fontSize: 15,
    fontWeight: '800',
    color: Palette.white,
  },
  secondaryRow: {
    flexDirection: 'row',
    gap: 10,
  },
  secondaryBtn: {
    flex: 1,
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    gap: 6,
    backgroundColor: Palette.primaryLight,
    borderWidth: 1,
    borderColor: Palette.primaryMid,
    borderRadius: Radius.lg,
    paddingVertical: 12,
    minHeight: 44,
  },
  secondaryBtnText: {
    fontSize: 13.5,
    fontWeight: '700',
    color: Palette.primary,
  },
});
