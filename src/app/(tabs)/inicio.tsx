import {
  ActivityIndicator,
  FlatList,
  ScrollView,
  StyleSheet,
  Text,
  TouchableOpacity,
  View,
} from 'react-native';
import { Image } from 'expo-image';
import { LinearGradient } from 'expo-linear-gradient';
import { SafeAreaView } from 'react-native-safe-area-context';
import { useRouter } from 'expo-router';
import { Ionicons } from '@expo/vector-icons';
import { useAuthStore } from '@/store/auth';
import { useEmpreendimentos } from '@/hooks/useEmpreendimentos';
import { EmpreendimentoCardCompact } from '@/components/EmpreendimentoCardCompact';
import { Palette, Radius, Shadow, Spacing } from '@/constants/theme';
import { formatCurrency, getMainImage } from '@/utils/format';
import type { Empreendimento } from '@/types';

type IoniconName = React.ComponentProps<typeof Ionicons>['name'];

// ─── Quick Actions ─────────────────────────────────────────────────────────────

interface QuickAction {
  icon: IoniconName;
  label: string;
  onPress: () => void;
  bg: string;
  color: string;
}

function QuickActions({ actions }: { actions: QuickAction[] }) {
  return (
    <View style={qaStyles.row}>
      {actions.map((a) => (
        <TouchableOpacity
          key={a.label}
          style={qaStyles.btn}
          onPress={a.onPress}
          activeOpacity={0.8}
        >
          <View style={[qaStyles.icon, { backgroundColor: a.bg }]}>
            <Ionicons name={a.icon} size={22} color={a.color} />
          </View>
          <Text style={qaStyles.label}>{a.label}</Text>
        </TouchableOpacity>
      ))}
    </View>
  );
}

const qaStyles = StyleSheet.create({
  row: {
    flexDirection: 'row',
    paddingHorizontal: Spacing.lg,
    gap: 8,
  },
  btn: {
    flex: 1,
    alignItems: 'center',
    gap: 7,
  },
  icon: {
    width: 56,
    height: 56,
    borderRadius: Radius.lg,
    alignItems: 'center',
    justifyContent: 'center',
  },
  label: {
    fontSize: 11,
    fontWeight: '700',
    color: Palette.textSecondary,
    textAlign: 'center',
  },
});

// ─── Section Header ────────────────────────────────────────────────────────────

function Section({
  title,
  subtitle,
  onSeeAll,
  children,
}: {
  title: string;
  subtitle?: string;
  onSeeAll?: () => void;
  children: React.ReactNode;
}) {
  return (
    <View style={secStyles.wrapper}>
      <View style={secStyles.header}>
        <View style={secStyles.titles}>
          <View style={secStyles.titleRow}>
            <View style={secStyles.accent} />
            <Text style={secStyles.title}>{title}</Text>
          </View>
          {subtitle ? <Text style={secStyles.subtitle}>{subtitle}</Text> : null}
        </View>
        {onSeeAll && (
          <TouchableOpacity onPress={onSeeAll} hitSlop={8}>
            <Text style={secStyles.seeAll}>Ver todos →</Text>
          </TouchableOpacity>
        )}
      </View>
      {children}
    </View>
  );
}

const secStyles = StyleSheet.create({
  wrapper: { gap: 14 },
  header: {
    flexDirection: 'row',
    alignItems: 'flex-start',
    justifyContent: 'space-between',
    paddingHorizontal: Spacing.lg,
  },
  titles: { gap: 3 },
  titleRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 8,
  },
  accent: {
    width: 4,
    height: 20,
    borderRadius: Radius.full,
    backgroundColor: Palette.primary,
  },
  title: {
    fontSize: 18,
    fontWeight: '800',
    color: Palette.text,
    letterSpacing: -0.4,
  },
  subtitle: {
    fontSize: 12,
    color: Palette.textTertiary,
    fontWeight: '500',
    paddingLeft: 12,
  },
  seeAll: {
    fontSize: 13,
    fontWeight: '700',
    color: Palette.primary,
    paddingTop: 2,
  },
});

// ─── Carousel Section ──────────────────────────────────────────────────────────

function CarouselSection({
  title,
  subtitle,
  data,
  loading,
  onSeeAll,
}: {
  title: string;
  subtitle?: string;
  data: Empreendimento[];
  loading: boolean;
  onSeeAll?: () => void;
}) {
  return (
    <Section title={title} subtitle={subtitle} onSeeAll={onSeeAll}>
      {loading ? (
        <View style={styles.carouselLoader}>
          <ActivityIndicator color={Palette.primary} />
        </View>
      ) : data.length === 0 ? null : (
        <FlatList
          horizontal
          data={data.slice(0, 8)}
          keyExtractor={(item) => item.id}
          showsHorizontalScrollIndicator={false}
          contentContainerStyle={styles.carouselContent}
          ItemSeparatorComponent={() => <View style={{ width: 12 }} />}
          renderItem={({ item }) => <EmpreendimentoCardCompact empreendimento={item} />}
        />
      )}
    </Section>
  );
}

// ─── Spotlight Card ────────────────────────────────────────────────────────────

function SpotlightCard({ item }: { item: Empreendimento }) {
  const router = useRouter();
  const mainImage = getMainImage(item);
  const location = [item.bairro ?? item.bairro_comercial, item.cidade]
    .filter(Boolean)
    .join(', ');

  return (
    <TouchableOpacity
      style={spotStyles.card}
      onPress={() => router.push(`/empreendimento/${item.id}`)}
      activeOpacity={0.92}
    >
      {mainImage ? (
        <Image
          source={mainImage}
          style={spotStyles.image}
          contentFit="cover"
          cachePolicy="memory-disk"
          transition={300}
        />
      ) : (
        <View style={[spotStyles.image, { backgroundColor: Palette.surfaceVariant, alignItems: 'center', justifyContent: 'center' }]}>
          <Ionicons name="home-outline" size={52} color={Palette.textDisabled} />
        </View>
      )}
      <LinearGradient
        colors={['transparent', 'rgba(10,14,40,0.85)']}
        style={spotStyles.gradient}
        start={{ x: 0, y: 0.3 }}
        end={{ x: 0, y: 1 }}
      />
      <View style={spotStyles.badge}>
        <Ionicons name="star" size={10} color="#F59E0B" />
        <Text style={spotStyles.badgeText}>Em Destaque</Text>
      </View>
      <View style={spotStyles.info}>
        {location ? (
          <View style={spotStyles.locRow}>
            <Ionicons name="location-sharp" size={12} color="rgba(255,255,255,0.7)" />
            <Text style={spotStyles.loc}>{location}</Text>
          </View>
        ) : null}
        <Text style={spotStyles.name} numberOfLines={2}>{item.nome_empreendimento}</Text>
        {item.valor ? (
          <Text style={spotStyles.price}>A partir de {formatCurrency(item.valor)}</Text>
        ) : null}
      </View>
    </TouchableOpacity>
  );
}

const spotStyles = StyleSheet.create({
  card: {
    marginHorizontal: Spacing.lg,
    height: 220,
    borderRadius: Radius.xl,
    overflow: 'hidden',
    ...Shadow.lg,
  },
  image: {
    ...StyleSheet.absoluteFill,
  },
  gradient: {
    ...StyleSheet.absoluteFill,
  },
  badge: {
    position: 'absolute',
    top: 14,
    left: 14,
    flexDirection: 'row',
    alignItems: 'center',
    gap: 5,
    backgroundColor: 'rgba(0,0,0,0.45)',
    borderRadius: Radius.full,
    paddingHorizontal: 10,
    paddingVertical: 5,
    borderWidth: 1,
    borderColor: 'rgba(255,255,255,0.15)',
  },
  badgeText: {
    fontSize: 11,
    fontWeight: '700',
    color: '#F59E0B',
  },
  info: {
    position: 'absolute',
    bottom: 0,
    left: 0,
    right: 0,
    padding: 16,
    gap: 5,
  },
  locRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 4,
  },
  loc: {
    fontSize: 12,
    color: 'rgba(255,255,255,0.7)',
    fontWeight: '500',
  },
  name: {
    fontSize: 20,
    fontWeight: '900',
    color: '#fff',
    letterSpacing: -0.4,
    lineHeight: 26,
  },
  price: {
    fontSize: 13,
    color: 'rgba(255,255,255,0.8)',
    fontWeight: '600',
  },
});

// ─── Stats Row ────────────────────────────────────────────────────────────────

function StatsRow({
  total,
  destaqueCount,
  comDisponiveis,
  loading,
}: {
  total?: number;
  destaqueCount: number;
  comDisponiveis: number;
  loading: boolean;
}) {
  if (loading || total == null) return null;

  const stats = [
    { label: 'Imóveis', value: String(total), icon: 'business-outline' as IoniconName },
    { label: 'Disponíveis', value: String(comDisponiveis) + '+', icon: 'home-outline' as IoniconName },
    { label: 'Destaques', value: destaqueCount > 0 ? String(destaqueCount) + '+' : '—', icon: 'star-outline' as IoniconName },
  ];

  return (
    <View style={statsStyles.row}>
      {stats.map((s, idx) => (
        <View key={idx} style={statsStyles.card}>
          <Ionicons name={s.icon} size={16} color={Palette.primary} />
          <Text style={statsStyles.value}>{s.value}</Text>
          <Text style={statsStyles.label}>{s.label}</Text>
        </View>
      ))}
    </View>
  );
}

const statsStyles = StyleSheet.create({
  row: {
    flexDirection: 'row',
    paddingHorizontal: Spacing.lg,
    gap: 10,
  },
  card: {
    flex: 1,
    backgroundColor: Palette.surface,
    borderRadius: Radius.lg,
    padding: 12,
    alignItems: 'center',
    gap: 4,
    borderWidth: 1,
    borderColor: Palette.borderLight,
  },
  value: {
    fontSize: 18,
    fontWeight: '900',
    color: Palette.text,
    letterSpacing: -0.5,
  },
  label: {
    fontSize: 10,
    fontWeight: '600',
    color: Palette.textTertiary,
    textAlign: 'center',
  },
});

function getGreeting(): string {
  const h = new Date().getHours();
  if (h < 12) return 'Bom dia';
  if (h < 18) return 'Boa tarde';
  return 'Boa noite';
}

// ─── Main Screen ───────────────────────────────────────────────────────────────

export default function InicioScreen() {
  const router = useRouter();
  const user = useAuthStore((s) => s.user);

  const firstName = user?.name?.split(' ')[0];
  const initials = user?.name
    ? user.name.split(' ').map((w: string) => w[0]).slice(0, 2).join('').toUpperCase()
    : '?';

  const greeting = getGreeting();

  const { data: destaqueData, isLoading: loadingDestaque } = useEmpreendimentos({});
  const { data: recentesData, isLoading: loadingRecentes } = useEmpreendimentos({
    ordenar_por: 'mais recentes primeiro',
  });
  const { data: precoData, isLoading: loadingPreco } = useEmpreendimentos({
    ordenar_por: 'menor valor da unidade',
  });
  const { data: preLancData, isLoading: loadingPreLanc } = useEmpreendimentos({
    status_construcao: 'pre-lancamento',
  });

  const destaques: Empreendimento[] = destaqueData?.pages[0]?.dados ?? [];
  const recentes: Empreendimento[] = recentesData?.pages[0]?.dados ?? [];
  const menorPreco: Empreendimento[] = precoData?.pages[0]?.dados ?? [];
  const preLancamentos: Empreendimento[] = preLancData?.pages[0]?.dados ?? [];

  const spotlight = destaques.find((e) => e.destaque) ?? destaques[0];
  const total = destaqueData?.pages[0]?.paginacao?.quant_registros;
  const destaqueCount = destaques.filter((e) => e.destaque).length;
  const comDisponiveis = destaques.filter((e) => (e.unidades_disponiveis ?? 0) > 0).length;

  const quickActions: QuickAction[] = [
    {
      icon: 'search-outline',
      label: 'Buscar',
      bg: Palette.primaryLight,
      color: Palette.primary,
      onPress: () => router.push('/(tabs)/busca'),
    },
    {
      icon: 'business-outline',
      label: 'Construtoras',
      bg: Palette.successBg,
      color: Palette.success,
      onPress: () => router.push('/(tabs)/construtoras'),
    },
    {
      icon: 'list-outline',
      label: 'Todos',
      bg: Palette.warningBg,
      color: Palette.warning,
      onPress: () => router.push('/(tabs)/empreendimentos'),
    },
    {
      icon: 'rocket-outline',
      label: 'Lançamentos',
      bg: Palette.accentLight,
      color: Palette.accent,
      onPress: () =>
        router.push({
          pathname: '/(tabs)/empreendimentos',
          params: { status_construcao: 'pre-lancamento' },
        }),
    },
  ];

  return (
    <SafeAreaView style={styles.safe} edges={['top']}>
      <ScrollView
        showsVerticalScrollIndicator={false}
        contentContainerStyle={styles.scroll}
      >
        {/* ── Header ── */}
        <View style={styles.header}>
          <View style={styles.headerLeft}>
            <Text style={styles.greeting}>
              {firstName ? `${greeting}, ${firstName}` : greeting}
            </Text>
            <Text style={styles.tagline}>
              {total != null ? `${total} imóveis no portfólio` : 'Encontre seu imóvel ideal'}
            </Text>
          </View>
          <TouchableOpacity
            style={styles.avatar}
            onPress={() => router.push('/(tabs)/perfil')}
            activeOpacity={0.8}
          >
            <Text style={styles.avatarText}>{initials}</Text>
          </TouchableOpacity>
        </View>

        {/* ── Search shortcut ── */}
        <TouchableOpacity
          style={styles.searchBar}
          onPress={() => router.push('/(tabs)/busca')}
          activeOpacity={0.8}
        >
          <View style={styles.searchIconWrap}>
            <Ionicons name="search-outline" size={16} color={Palette.primary} />
          </View>
          <Text style={styles.searchBarText}>Buscar por nome, bairro ou cidade...</Text>
          <View style={styles.searchArrow}>
            <Ionicons name="arrow-forward" size={14} color={Palette.primary} />
          </View>
        </TouchableOpacity>

        {/* ── Quick Actions ── */}
        <QuickActions actions={quickActions} />

        {/* ── Stats ── */}
        <StatsRow
          total={total}
          destaqueCount={destaqueCount}
          comDisponiveis={comDisponiveis}
          loading={loadingDestaque}
        />

        {/* ── Spotlight ── */}
        {spotlight && !loadingDestaque ? (
          <Section title="Destaque do Dia" subtitle="Selecionado para você">
            <SpotlightCard item={spotlight} />
          </Section>
        ) : null}

        {/* ── Destaques ── */}
        <CarouselSection
          title="Em Destaque"
          subtitle="Curadoria especial"
          data={destaques}
          loading={loadingDestaque}
          onSeeAll={() => router.push('/(tabs)/empreendimentos')}
        />

        {/* ── Mais Recentes ── */}
        <CarouselSection
          title="Mais Recentes"
          subtitle="Novidades no portfólio"
          data={recentes}
          loading={loadingRecentes}
          onSeeAll={() => router.push('/(tabs)/empreendimentos')}
        />

        {/* ── Oportunidades ── */}
        <CarouselSection
          title="Oportunidades"
          subtitle="Menor valor da unidade"
          data={menorPreco}
          loading={loadingPreco}
          onSeeAll={() => router.push('/(tabs)/empreendimentos')}
        />

        {/* ── Pré-Lançamentos ── */}
        {(preLancamentos.length > 0 || loadingPreLanc) && (
          <CarouselSection
            title="Pré-Lançamentos"
            subtitle="Garanta condições exclusivas"
            data={preLancamentos}
            loading={loadingPreLanc}
            onSeeAll={() =>
              router.push({
                pathname: '/(tabs)/empreendimentos',
                params: { status_construcao: 'pre-lancamento' },
              })
            }
          />
        )}

        <View style={{ height: 40 }} />
      </ScrollView>
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  safe: { flex: 1, backgroundColor: Palette.bg },
  scroll: { gap: Spacing.xxl, paddingTop: Spacing.sm },

  // Header
  header: {
    flexDirection: 'row',
    alignItems: 'flex-start',
    justifyContent: 'space-between',
    paddingHorizontal: Spacing.xl,
    paddingBottom: 4,
  },
  headerLeft: { flex: 1, gap: 3 },
  greeting: {
    fontSize: 28,
    fontWeight: '900',
    color: Palette.text,
    letterSpacing: -0.7,
  },
  tagline: {
    fontSize: 13,
    color: Palette.textTertiary,
    fontWeight: '500',
  },
  avatar: {
    width: 46,
    height: 46,
    borderRadius: Radius.full,
    backgroundColor: Palette.primary,
    alignItems: 'center',
    justifyContent: 'center',
    ...Shadow.sm,
  },
  avatarText: {
    fontSize: 17,
    fontWeight: '800',
    color: Palette.white,
    letterSpacing: 0.5,
  },

  // Search bar
  searchBar: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 10,
    marginHorizontal: Spacing.lg,
    backgroundColor: Palette.surface,
    borderRadius: Radius.lg,
    paddingHorizontal: 14,
    paddingVertical: 13,
    borderWidth: 1.5,
    borderColor: Palette.border,
    ...Shadow.sm,
  },
  searchIconWrap: {
    width: 28,
    height: 28,
    borderRadius: Radius.sm,
    backgroundColor: Palette.primaryLight,
    alignItems: 'center',
    justifyContent: 'center',
  },
  searchBarText: {
    fontSize: 14,
    color: Palette.textTertiary,
    flex: 1,
  },
  searchArrow: {
    width: 24,
    height: 24,
    borderRadius: Radius.full,
    backgroundColor: Palette.primaryLight,
    alignItems: 'center',
    justifyContent: 'center',
  },

  // Carousel
  carouselContent: {
    paddingHorizontal: Spacing.lg,
  },
  carouselLoader: {
    height: 180,
    alignItems: 'center',
    justifyContent: 'center',
  },
});
