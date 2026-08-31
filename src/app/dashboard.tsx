import { useQuery } from '@tanstack/react-query';
import {
  ActivityIndicator,
  Linking,
  RefreshControl,
  ScrollView,
  StyleSheet,
  Text,
  TouchableOpacity,
  View,
} from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { Ionicons } from '@expo/vector-icons';
import { useRouter } from 'expo-router';
import { EmptyState } from '@/components/EmptyState';
import { getDashboardAcessos, type BarItem } from '@/services/dashboard';
import { Palette, Radius, Shadow, Spacing, DisplayFont } from '@/constants/theme';

// Dashboard de acessos (construtora) — recorte mobile do dashboard do PWA:
// KPIs de audiência, ranking de empreendimentos/imobiliárias e atividade
// recente com atalho de WhatsApp. Sem os gráficos pesados do desktop.

function StatTile({
  label,
  value,
  comparativo,
}: {
  label: string;
  value?: number | string;
  comparativo?: number | string;
}) {
  // A API manda o comparativo como delta numérico (ex.: 3 / -2); o PWA monta o
  // texto no cliente. Strings antigas ("3 a mais...") também são aceitas.
  let up = false;
  let down = false;
  let compText = '';
  if (typeof comparativo === 'number' && comparativo !== 0) {
    up = comparativo > 0;
    down = comparativo < 0;
    compText = `${Math.abs(comparativo)} ${up ? 'a mais' : 'a menos'}`;
  } else if (typeof comparativo === 'string' && comparativo) {
    up = comparativo.includes('a mais');
    down = comparativo.includes('a menos');
    compText = comparativo;
  }
  return (
    <View style={styles.statTile} accessible accessibilityLabel={`${label}: ${value ?? 0}`}>
      <Text style={styles.statValue}>{value ?? 0}</Text>
      <Text style={styles.statLabel} numberOfLines={1}>{label}</Text>
      {compText ? (
        <View style={styles.statCompareRow}>
          {(up || down) && (
            <Ionicons
              name={up ? 'arrow-up' : 'arrow-down'}
              size={10}
              color={up ? Palette.success : Palette.error}
            />
          )}
          <Text
            style={[
              styles.statCompare,
              up ? { color: Palette.success } : null,
              down ? { color: Palette.error } : null,
            ]}
            numberOfLines={1}
          >
            {compText}
          </Text>
        </View>
      ) : null}
    </View>
  );
}

function BarList({ title, items }: { title: string; items: BarItem[] }) {
  const top = items
    .filter((i) => i.categoria && (i.valor ?? 0) > 0)
    .slice(0, 6);
  if (!top.length) return null;
  const max = Math.max(...top.map((i) => i.valor ?? 0), 1);
  return (
    <View style={styles.section}>
      <Text style={styles.sectionTitle}>{title}</Text>
      <View style={styles.card}>
        {top.map((item, i) => (
          <View
            key={`${item.categoria}-${i}`}
            style={[styles.barRow, i > 0 && styles.barRowDivider]}
            accessible
            accessibilityLabel={`${item.categoria}: ${item.valor} acessos`}
          >
            <Text style={styles.barLabel} numberOfLines={1}>
              {item.categoria}
            </Text>
            <View style={styles.barTrack}>
              <View
                style={[styles.barFill, { width: `${((item.valor ?? 0) / max) * 100}%` }]}
              />
            </View>
            <Text style={styles.barValue}>{item.valor}</Text>
          </View>
        ))}
      </View>
    </View>
  );
}

function waLink(telefone?: string): string | null {
  const digits = telefone?.replace(/\D/g, '') ?? '';
  if (digits.length < 10) return null;
  return `https://wa.me/${digits.startsWith('55') ? digits : `55${digits}`}`;
}

export default function DashboardScreen() {
  const router = useRouter();
  const { data, isLoading, isError, refetch, isRefetching } = useQuery({
    queryKey: ['dashboard-acessos'],
    queryFn: getDashboardAcessos,
    staleTime: 1000 * 60 * 5,
  });

  const cab = data?.cabecalho;
  const corpo = data?.corpo;
  const atividades = corpo?.tabela_atividade_recente?.dados ?? [];

  return (
    <SafeAreaView style={styles.safe} edges={['top']}>
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
          <Text style={styles.title}>Dashboard</Text>
          <Text style={styles.subtitle}>Quem está olhando seus empreendimentos</Text>
        </View>
      </View>

      {isLoading ? (
        <View style={styles.center}>
          <ActivityIndicator size="small" color={Palette.primary} />
        </View>
      ) : isError ? (
        <View style={styles.center}>
          <EmptyState
            icon="alert-circle-outline"
            title="Erro ao carregar"
            message="Não foi possível carregar o dashboard. Verifique sua permissão de acesso."
            action={{ label: 'Tentar novamente', onPress: () => refetch() }}
          />
        </View>
      ) : (
        <ScrollView
          contentContainerStyle={styles.content}
          showsVerticalScrollIndicator={false}
          refreshControl={
            <RefreshControl
              refreshing={isRefetching}
              onRefresh={refetch}
              tintColor={Palette.primary}
              colors={[Palette.primary]}
            />
          }
        >
          {/* KPIs de acesso */}
          <View style={styles.statsRow}>
            <StatTile
              label="Hoje"
              value={cab?.card_acessos_hoje?.valor}
              comparativo={cab?.card_acessos_hoje?.comparativo}
            />
            <StatTile
              label="7 dias"
              value={cab?.card_acessos_7_dias?.valor}
              comparativo={cab?.card_acessos_7_dias?.comparativo}
            />
            <StatTile
              label="30 dias"
              value={cab?.card_acessos_30_dias?.valor}
              comparativo={cab?.card_acessos_30_dias?.comparativo}
            />
          </View>

          {/* Contadores gerais */}
          <View style={styles.countersRow}>
            <View style={styles.counter}>
              <Ionicons name="business-outline" size={15} color={Palette.primary} />
              <Text style={styles.counterValue}>
                {cab?.card_quant_empreendimentos?.valor ?? 0}
              </Text>
              <Text style={styles.counterLabel}>empreend.</Text>
            </View>
            <View style={styles.counter}>
              <Ionicons name="paper-plane-outline" size={15} color={Palette.primary} />
              <Text style={styles.counterValue}>
                {cab?.card_quant_compartilhamentos?.valor ?? 0}
              </Text>
              <Text style={styles.counterLabel}>compartilh.</Text>
            </View>
            <View style={styles.counter}>
              <Ionicons name="link-outline" size={15} color={Palette.primary} />
              <Text style={styles.counterValue}>
                {cab?.card_quant_imobiliarias_integradas?.valor ?? 0}
              </Text>
              <Text style={styles.counterLabel}>integradas</Text>
            </View>
          </View>

          <BarList
            title="Empreendimentos mais acessados"
            items={
              corpo?.secao_acessos_por_empreendimento
                ?.grafico_barras_quant_acessos_por_empreendimento?.dados ?? []
            }
          />
          <BarList
            title="Acessos por imobiliária"
            items={corpo?.grafico_barras_quant_acessos_por_imobiliaria?.dados ?? []}
          />

          {/* Atividade recente */}
          {atividades.length > 0 && (
            <View style={styles.section}>
              <Text style={styles.sectionTitle}>Atividade recente</Text>
              <View style={styles.card}>
                {atividades.slice(0, 12).map((a, i) => {
                  const wa = waLink(a.telefone);
                  return (
                    <View
                      key={i}
                      style={[styles.actRow, i > 0 && styles.barRowDivider]}
                    >
                      <View style={styles.actIcon}>
                        <Ionicons name="pulse-outline" size={15} color={Palette.primary} />
                      </View>
                      <View style={styles.actTexts}>
                        <Text style={styles.actTitle} numberOfLines={1}>
                          {a.usuario ?? 'Usuário'}
                          {a.empresa ? (
                            <Text style={styles.actEmpresa}> · {a.empresa}</Text>
                          ) : null}
                        </Text>
                        <Text style={styles.actDesc} numberOfLines={2}>
                          {[a.atividade, a.empreendimento].filter(Boolean).join(' — ')}
                        </Text>
                        {a.data ? <Text style={styles.actData}>{a.data}</Text> : null}
                      </View>
                      {wa && (
                        <TouchableOpacity
                          style={styles.actWa}
                          onPress={() => Linking.openURL(wa)}
                          activeOpacity={0.8}
                          accessibilityRole="button"
                          accessibilityLabel={`Chamar ${a.usuario ?? 'usuário'} no WhatsApp`}
                        >
                          <Ionicons name="logo-whatsapp" size={16} color="#189D0E" />
                        </TouchableOpacity>
                      )}
                    </View>
                  );
                })}
              </View>
            </View>
          )}

          {!atividades.length && (
            <EmptyState
              icon="pulse-outline"
              title="Sem atividade ainda"
              message="Quando corretores acessarem seus empreendimentos, os dados aparecem aqui."
            />
          )}
        </ScrollView>
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
  content: {
    paddingHorizontal: Spacing.lg,
    paddingBottom: 32,
    gap: Spacing.lg,
  },

  statsRow: {
    flexDirection: 'row',
    gap: 8,
  },
  statTile: {
    flex: 1,
    backgroundColor: Palette.surface,
    borderRadius: Radius.lg,
    borderWidth: 1,
    borderColor: Palette.borderLight,
    padding: Spacing.md,
    gap: 2,
    ...Shadow.xs,
  },
  statValue: {
    fontFamily: DisplayFont.extraBold,
    fontSize: 26,
    color: Palette.primary,
    letterSpacing: -0.8,
  },
  statLabel: {
    fontSize: 11,
    fontWeight: '700',
    color: Palette.textTertiary,
    textTransform: 'uppercase',
    letterSpacing: 0.4,
  },
  statCompareRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 2,
    marginTop: 2,
  },
  statCompare: {
    flex: 1,
    fontSize: 10,
    fontWeight: '600',
    color: Palette.textTertiary,
  },

  countersRow: {
    flexDirection: 'row',
    gap: 8,
  },
  counter: {
    flex: 1,
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    gap: 5,
    backgroundColor: Palette.primaryLight,
    borderRadius: Radius.full,
    paddingVertical: 9,
    paddingHorizontal: 6,
  },
  counterValue: {
    fontSize: 14,
    fontWeight: '800',
    color: Palette.primaryDark,
  },
  counterLabel: {
    fontSize: 10.5,
    fontWeight: '600',
    color: Palette.primaryDark,
  },

  section: { gap: 8 },
  sectionTitle: {
    fontFamily: DisplayFont.bold,
    fontSize: 16,
    color: Palette.text,
    letterSpacing: -0.2,
  },
  card: {
    backgroundColor: Palette.surface,
    borderRadius: Radius.lg,
    borderWidth: 1,
    borderColor: Palette.borderLight,
    paddingHorizontal: Spacing.md,
    ...Shadow.xs,
  },

  barRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 10,
    paddingVertical: 12,
    minHeight: 44,
  },
  barRowDivider: {
    borderTopWidth: 1,
    borderTopColor: Palette.borderLight,
  },
  barLabel: {
    width: '38%',
    fontSize: 12.5,
    fontWeight: '600',
    color: Palette.text,
  },
  barTrack: {
    flex: 1,
    height: 8,
    borderRadius: Radius.full,
    backgroundColor: Palette.surfaceVariant,
    overflow: 'hidden',
  },
  barFill: {
    height: '100%',
    borderRadius: Radius.full,
    backgroundColor: Palette.primary,
  },
  barValue: {
    minWidth: 26,
    textAlign: 'right',
    fontSize: 12.5,
    fontWeight: '800',
    color: Palette.textSecondary,
  },

  actRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 10,
    paddingVertical: 11,
  },
  actIcon: {
    width: 32,
    height: 32,
    borderRadius: Radius.full,
    backgroundColor: Palette.primaryLight,
    alignItems: 'center',
    justifyContent: 'center',
  },
  actTexts: { flex: 1, gap: 1 },
  actTitle: {
    fontSize: 13.5,
    fontWeight: '700',
    color: Palette.text,
  },
  actEmpresa: {
    fontWeight: '500',
    color: Palette.textTertiary,
  },
  actDesc: {
    fontSize: 12,
    color: Palette.textSecondary,
    lineHeight: 16,
  },
  actData: {
    fontSize: 10.5,
    color: Palette.textTertiary,
  },
  actWa: {
    width: 34,
    height: 34,
    borderRadius: Radius.full,
    backgroundColor: 'rgba(24, 157, 14, 0.1)',
    alignItems: 'center',
    justifyContent: 'center',
  },
});
