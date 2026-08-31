import { useQuery } from '@tanstack/react-query';
import {
  ActivityIndicator,
  FlatList,
  Linking,
  RefreshControl,
  StyleSheet,
  Text,
  TouchableOpacity,
  View,
} from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import * as Clipboard from 'expo-clipboard';
import { Ionicons } from '@expo/vector-icons';
import { useRouter } from 'expo-router';
import toast from '@/utils/toast';
import { select, tapMedium } from '@/utils/haptics';
import { EmptyState } from '@/components/EmptyState';
import {
  getMeusHotsites,
  hotsiteUrl,
  hotsiteWhatsappText,
  whatsappSendUrl,
  type HotsiteResumo,
} from '@/services/hotsites';
import { formatDate } from '@/utils/format';
import { Palette, Radius, Shadow, Spacing, DisplayFont } from '@/constants/theme';

// "Meus Hotsites" — a caixa de saída do corretor (paridade com o modal
// compartilhamentos-corretor do PWA): cada link gerado, pra quem foi, e
// quantas vezes o cliente abriu. Acesso > 0 é sinal de interesse → follow-up.

function initials(nome?: string): string {
  if (!nome) return '?';
  const parts = nome.trim().split(/\s+/);
  const first = parts[0]?.[0] ?? '';
  const last = parts.length > 1 ? parts[parts.length - 1][0] : '';
  return (first + last).toUpperCase();
}

function HotsiteCard({ item }: { item: HotsiteResumo }) {
  const acessos = item.hotsite_empreendimento_acessos ?? 0;
  const aberto = acessos > 0;

  async function copiar() {
    await Clipboard.setStringAsync(hotsiteUrl(item.id));
    select();
    toast.success('Link copiado!');
  }

  function whatsapp() {
    tapMedium();
    const text = hotsiteWhatsappText({
      id: item.id,
      nomeEmpreendimento: item.nome_empreendimento ?? 'nosso empreendimento',
    });
    Linking.openURL(whatsappSendUrl(text));
  }

  function abrir() {
    Linking.openURL(hotsiteUrl(item.id));
  }

  return (
    <View style={styles.card}>
      <View style={styles.cardTop}>
        <View style={styles.avatar}>
          <Text style={styles.avatarText}>{initials(item.nome_consumidor)}</Text>
        </View>
        <View style={styles.cardInfo}>
          <Text style={styles.cliente} numberOfLines={1}>
            {item.nome_consumidor ?? 'Cliente'}
          </Text>
          <Text style={styles.empreendimento} numberOfLines={1}>
            {item.nome_empreendimento ?? '—'}
          </Text>
          {item.criado_em ? (
            <Text style={styles.data}>Enviado em {formatDate(item.criado_em)}</Text>
          ) : null}
        </View>
        <View
          style={[styles.acessosPill, aberto ? styles.acessosPillOn : null]}
          accessible
          accessibilityLabel={`${acessos} ${acessos === 1 ? 'acesso' : 'acessos'} do cliente`}
        >
          <Ionicons
            name={aberto ? 'eye' : 'eye-off-outline'}
            size={13}
            color={aberto ? Palette.success : Palette.textTertiary}
          />
          <Text style={[styles.acessosText, aberto ? styles.acessosTextOn : null]}>
            {acessos}
          </Text>
        </View>
      </View>

      <View style={styles.actions}>
        <TouchableOpacity
          style={styles.actionBtn}
          onPress={copiar}
          activeOpacity={0.8}
          accessibilityRole="button"
          accessibilityLabel="Copiar link"
        >
          <Ionicons name="copy-outline" size={15} color={Palette.primary} />
          <Text style={styles.actionText}>Copiar</Text>
        </TouchableOpacity>
        <TouchableOpacity
          style={[styles.actionBtn, styles.actionBtnWa]}
          onPress={whatsapp}
          activeOpacity={0.8}
          accessibilityRole="button"
          accessibilityLabel="Reenviar no WhatsApp"
        >
          <Ionicons name="logo-whatsapp" size={15} color="#189D0E" />
          <Text style={[styles.actionText, styles.actionTextWa]}>WhatsApp</Text>
        </TouchableOpacity>
        <TouchableOpacity
          style={styles.actionBtn}
          onPress={abrir}
          activeOpacity={0.8}
          accessibilityRole="button"
          accessibilityLabel="Abrir hotsite"
        >
          <Ionicons name="open-outline" size={15} color={Palette.primary} />
          <Text style={styles.actionText}>Abrir</Text>
        </TouchableOpacity>
      </View>
    </View>
  );
}

export default function HotsitesScreen() {
  const router = useRouter();
  const { data, isLoading, isError, refetch, isRefetching } = useQuery({
    queryKey: ['meus-hotsites'],
    queryFn: getMeusHotsites,
    staleTime: 1000 * 60,
  });

  const hotsites = data ?? [];
  const totalAcessos = hotsites.reduce(
    (acc, h) => acc + (h.hotsite_empreendimento_acessos ?? 0),
    0
  );

  return (
    <SafeAreaView style={styles.safe} edges={['top']}>
      {/* Header */}
      <View style={styles.header}>
        <TouchableOpacity
          style={styles.backBtn}
          onPress={() => router.back()}
          activeOpacity={0.8}
          hitSlop={{ top: 8, bottom: 8, left: 8, right: 8 }}
          accessibilityRole="button"
          accessibilityLabel="Voltar"
        >
          <Ionicons name="chevron-back" size={22} color={Palette.text} />
        </TouchableOpacity>
        <View style={styles.headerTexts}>
          <Text style={styles.title}>Meus Hotsites</Text>
          {hotsites.length > 0 && (
            <Text style={styles.subtitle}>
              {hotsites.length} {hotsites.length === 1 ? 'link enviado' : 'links enviados'} ·{' '}
              {totalAcessos} {totalAcessos === 1 ? 'acesso' : 'acessos'}
            </Text>
          )}
        </View>
      </View>

      {isLoading ? (
        <View style={styles.center}>
          <ActivityIndicator size="small" color={Palette.primary} />
        </View>
      ) : (
        <FlatList
          data={hotsites}
          keyExtractor={(item) => item.id}
          renderItem={({ item }) => <HotsiteCard item={item} />}
          contentContainerStyle={styles.list}
          showsVerticalScrollIndicator={false}
          refreshControl={
            <RefreshControl
              refreshing={isRefetching}
              onRefresh={refetch}
              tintColor={Palette.primary}
              colors={[Palette.primary]}
            />
          }
          ListEmptyComponent={
            isError ? (
              <EmptyState
                icon="wifi-outline"
                title="Erro ao carregar"
                message="Não foi possível carregar seus hotsites."
                action={{ label: 'Tentar novamente', onPress: () => refetch() }}
              />
            ) : (
              <EmptyState
                icon="paper-plane-outline"
                title="Nenhum hotsite ainda"
                message="Abra um empreendimento e toque em Gerar Hotsite para criar uma página exclusiva com sua foto e contato — e enviar ao seu cliente pelo WhatsApp."
                action={{ label: 'Explorar imóveis', onPress: () => router.push('/(tabs)/inicio') }}
              />
            )
          }
        />
      )}
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  safe: { flex: 1, backgroundColor: Palette.bg },
  center: { flex: 1, alignItems: 'center', justifyContent: 'center' },
  header: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 10,
    paddingHorizontal: Spacing.lg,
    paddingTop: Spacing.sm,
    paddingBottom: Spacing.md,
  },
  backBtn: {
    width: 40,
    height: 40,
    borderRadius: Radius.full,
    backgroundColor: Palette.surfaceVariant,
    alignItems: 'center',
    justifyContent: 'center',
  },
  headerTexts: { flex: 1, gap: 2 },
  title: {
    fontFamily: DisplayFont.extraBold,
    fontSize: 22,
    color: Palette.text,
    letterSpacing: -0.5,
  },
  subtitle: {
    fontSize: 12.5,
    fontWeight: '600',
    color: Palette.textTertiary,
  },
  list: {
    paddingHorizontal: Spacing.lg,
    paddingBottom: 32,
    gap: 10,
    flexGrow: 1,
  },

  card: {
    backgroundColor: Palette.surface,
    borderRadius: Radius.lg,
    borderWidth: 1,
    borderColor: Palette.borderLight,
    padding: Spacing.md,
    gap: Spacing.md,
    ...Shadow.xs,
  },
  cardTop: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 12,
  },
  avatar: {
    width: 44,
    height: 44,
    borderRadius: Radius.full,
    backgroundColor: Palette.primaryLight,
    alignItems: 'center',
    justifyContent: 'center',
  },
  avatarText: {
    fontSize: 15,
    fontWeight: '800',
    color: Palette.primaryDark,
  },
  cardInfo: { flex: 1, gap: 1 },
  cliente: {
    fontSize: 15,
    fontWeight: '700',
    color: Palette.text,
    letterSpacing: -0.1,
  },
  empreendimento: {
    fontSize: 13,
    fontWeight: '500',
    color: Palette.textSecondary,
  },
  data: {
    fontSize: 11.5,
    color: Palette.textTertiary,
    marginTop: 1,
  },
  acessosPill: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 4,
    backgroundColor: Palette.surfaceVariant,
    borderRadius: Radius.full,
    paddingHorizontal: 9,
    paddingVertical: 5,
  },
  acessosPillOn: {
    backgroundColor: Palette.successBg,
  },
  acessosText: {
    fontSize: 12,
    fontWeight: '800',
    color: Palette.textTertiary,
  },
  acessosTextOn: {
    color: Palette.success,
  },

  actions: {
    flexDirection: 'row',
    gap: 8,
  },
  actionBtn: {
    flex: 1,
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    gap: 5,
    backgroundColor: Palette.primaryLight,
    borderRadius: Radius.md,
    paddingVertical: 10,
    minHeight: 40,
  },
  actionBtnWa: {
    backgroundColor: 'rgba(24, 157, 14, 0.1)',
  },
  actionText: {
    fontSize: 12.5,
    fontWeight: '700',
    color: Palette.primary,
  },
  actionTextWa: {
    color: '#189D0E',
  },
});
