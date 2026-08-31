import { useQuery } from '@tanstack/react-query';
import {
  ActivityIndicator,
  FlatList,
  Linking,
  Modal,
  Pressable,
  StyleSheet,
  Text,
  TouchableOpacity,
  View,
} from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { tapMedium } from '@/utils/haptics';
import {
  getInteressadosPreLancamento,
  type InteressadoPreLancamento,
} from '@/services/empreendimentos';
import { formatDate } from '@/utils/format';
import { Palette, Radius, Shadow, Spacing, DisplayFont } from '@/constants/theme';

// Lista de corretores interessados num pré-lançamento (visão do dono) —
// paridade com o ModalInteressesPreLancamento do PWA, com atalho de WhatsApp
// pra chamar o lead na hora.

interface Props {
  visible: boolean;
  onClose: () => void;
  empreendimentoId: string;
  empreendimentoNome: string;
}

function initials(nome?: string): string {
  if (!nome) return '?';
  const parts = nome.trim().split(/\s+/);
  return ((parts[0]?.[0] ?? '') + (parts.length > 1 ? parts[parts.length - 1][0] : '')).toUpperCase();
}

function empresaNome(i: InteressadoPreLancamento): string {
  const e = i.usuario?.empresa;
  return (
    (e?.nome_mascara?.trim() || undefined) ??
    (e?.nome_fantasia?.trim() || undefined) ??
    (e?.razao_social?.trim() || undefined) ??
    (i.usuario?.tipo_usuario === 'corretor_autonomo' ? 'Corretor autônomo' : '')
  );
}

function waUrl(celular?: string): string | null {
  const d = celular?.replace(/\D/g, '') ?? '';
  if (d.length < 10) return null;
  return `https://wa.me/${d.startsWith('55') ? d : `55${d}`}`;
}

export function InteressadosSheet({
  visible,
  onClose,
  empreendimentoId,
  empreendimentoNome,
}: Props) {
  const insets = useSafeAreaInsets();
  const { data, isLoading, isError, refetch } = useQuery({
    queryKey: ['interessados-pre-lancamento', empreendimentoId],
    queryFn: () => getInteressadosPreLancamento(empreendimentoId),
    enabled: visible,
    staleTime: 1000 * 60,
  });

  const interessados = data ?? [];

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
        accessibilityLabel="Fechar lista de interessados"
      />
      <View style={[styles.sheet, { paddingBottom: insets.bottom + Spacing.lg }]}>
        <View style={styles.grabber} />

        <View style={styles.header}>
          <View style={styles.headerIcon}>
            <Ionicons name="people" size={17} color={Palette.primary} />
          </View>
          <View style={styles.headerTexts}>
            <Text style={styles.headerTitle}>
              Interessados{interessados.length ? ` · ${interessados.length}` : ''}
            </Text>
            <Text style={styles.headerSub} numberOfLines={1}>
              {empreendimentoNome}
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

        {isLoading ? (
          <View style={styles.center}>
            <ActivityIndicator size="small" color={Palette.primary} />
          </View>
        ) : isError ? (
          <View style={styles.center}>
            <Text style={styles.emptyTitle}>Erro ao carregar</Text>
            <TouchableOpacity
              onPress={() => refetch()}
              accessibilityRole="button"
              accessibilityLabel="Tentar novamente"
            >
              <Text style={styles.retry}>Tentar novamente</Text>
            </TouchableOpacity>
          </View>
        ) : interessados.length === 0 ? (
          <View style={styles.center}>
            <Ionicons name="people-outline" size={36} color={Palette.textDisabled} />
            <Text style={styles.emptyTitle}>Nenhum interessado ainda</Text>
            <Text style={styles.emptyText}>
              Quando corretores se inscreverem neste pré-lançamento, eles aparecem aqui.
            </Text>
          </View>
        ) : (
          <FlatList
            data={interessados}
            keyExtractor={(item, i) => item.id ?? item.usuario?.id ?? String(i)}
            contentContainerStyle={styles.list}
            renderItem={({ item }) => {
              const wa = waUrl(item.usuario?.celular);
              const empresa = empresaNome(item);
              return (
                <View style={styles.row}>
                  <View style={styles.avatar}>
                    <Text style={styles.avatarText}>{initials(item.usuario?.nome_completo)}</Text>
                  </View>
                  <View style={styles.rowTexts}>
                    <Text style={styles.nome} numberOfLines={1}>
                      {item.usuario?.nome_completo ?? 'Corretor'}
                    </Text>
                    {empresa ? (
                      <Text style={styles.empresa} numberOfLines={1}>{empresa}</Text>
                    ) : null}
                    {item.criado_em ? (
                      <Text style={styles.data}>Interesse em {formatDate(item.criado_em)}</Text>
                    ) : null}
                  </View>
                  {wa && (
                    <TouchableOpacity
                      style={styles.waBtn}
                      onPress={() => {
                        tapMedium();
                        Linking.openURL(wa);
                      }}
                      activeOpacity={0.8}
                      accessibilityRole="button"
                      accessibilityLabel={`Chamar ${item.usuario?.nome_completo ?? 'corretor'} no WhatsApp`}
                    >
                      <Ionicons name="logo-whatsapp" size={17} color="#189D0E" />
                    </TouchableOpacity>
                  )}
                </View>
              );
            }}
          />
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
    maxHeight: '80%',
    minHeight: 320,
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

  center: {
    flex: 1,
    alignItems: 'center',
    justifyContent: 'center',
    gap: 8,
    paddingHorizontal: Spacing.xxl,
    paddingVertical: Spacing.xxl,
  },
  emptyTitle: {
    fontSize: 15,
    fontWeight: '800',
    color: Palette.text,
  },
  emptyText: {
    fontSize: 13,
    color: Palette.textTertiary,
    textAlign: 'center',
    lineHeight: 18,
  },
  retry: {
    fontSize: 13,
    fontWeight: '800',
    color: Palette.primary,
    paddingVertical: 8,
  },

  list: {
    paddingHorizontal: Spacing.xl,
    paddingBottom: Spacing.sm,
    gap: 8,
  },
  row: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 12,
    backgroundColor: Palette.surface,
    borderRadius: Radius.lg,
    borderWidth: 1,
    borderColor: Palette.borderLight,
    padding: 12,
    minHeight: 64,
    ...Shadow.xs,
  },
  avatar: {
    width: 40,
    height: 40,
    borderRadius: Radius.full,
    backgroundColor: Palette.primaryLight,
    alignItems: 'center',
    justifyContent: 'center',
  },
  avatarText: {
    fontSize: 14,
    fontWeight: '800',
    color: Palette.primaryDark,
  },
  rowTexts: { flex: 1, gap: 1 },
  nome: {
    fontSize: 14.5,
    fontWeight: '700',
    color: Palette.text,
  },
  empresa: {
    fontSize: 12.5,
    color: Palette.textSecondary,
  },
  data: {
    fontSize: 11,
    color: Palette.textTertiary,
  },
  waBtn: {
    width: 38,
    height: 38,
    borderRadius: Radius.full,
    backgroundColor: 'rgba(24, 157, 14, 0.1)',
    alignItems: 'center',
    justifyContent: 'center',
  },
});
