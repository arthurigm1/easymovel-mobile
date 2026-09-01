import { Image } from 'expo-image';
import { useState, useEffect, useRef } from 'react';
import {
  ActivityIndicator,
  Alert,
  Dimensions,
  FlatList,
  Linking,
  Pressable,
  RefreshControl,
  Share,
  StyleSheet,
  Switch,
  Text,
  TouchableOpacity,
  View,
} from 'react-native';
import type { StyleProp, ViewStyle } from 'react-native';
import { SafeAreaView, useSafeAreaInsets } from 'react-native-safe-area-context';
import Animated, {
  Extrapolation,
  FadeInDown,
  interpolate,
  runOnJS,
  useAnimatedScrollHandler,
  useAnimatedStyle,
  useReducedMotion,
  useSharedValue,
  withTiming,
} from 'react-native-reanimated';
import { useLocalSearchParams, useRouter } from 'expo-router';
import { Ionicons } from '@expo/vector-icons';
import { LinearGradient } from 'expo-linear-gradient';
import { useEmpreendimento } from '@/hooks/useEmpreendimentos';
import { useAuthStore } from '@/store/auth';
import { postAcesso, registrarInteresse, setAnuncioPausado } from '@/services/empreendimentos';
import { InteressadosSheet } from '@/components/InteressadosSheet';
import toast from '@/utils/toast';
import { StatusBadge } from '@/components/StatusBadge';
import { EmptyState } from '@/components/EmptyState';
import { ProgressBar } from '@/components/ProgressBar';
import { PhotoLightbox } from '@/components/PhotoLightbox';
import { StatusStepper } from '@/components/StatusStepper';
import { MapPreview } from '@/components/MapPreview';
import { FavoriteButton } from '@/components/FavoriteButton';
import { ContactCTA } from '@/components/ContactCTA';
import { GerarHotsiteSheet } from '@/components/GerarHotsiteSheet';
import { tapLight, tapMedium } from '@/utils/haptics';
import {
  isDonoEmpreendimento,
  podeRegistrarInteresse,
  podeUsarHotsite,
} from '@/utils/permissions';
import {
  formatCurrency,
  formatDate,
  formatAreaRange,
  formatQuartosRange,
  getAllPhotos,
  getPlantasPhotos,
  getDocumentos,
  getDocumentoLabel,
  getEmpresaLogo,
  getEmpresaNome,
  getMainImage,
} from '@/utils/format';
import { Palette, Radius, Shadow, Spacing, DisplayFont, Type } from '@/constants/theme';

const SCREEN_WIDTH = Dimensions.get('window').width;
const HERO_HEIGHT = 400;
const HIT_SLOP = { top: 10, bottom: 10, left: 10, right: 10 };

// Amenidades agrupadas como no PWA ("O que esse empreendimento oferece"). A API
// retorna comodidade.categoria em uma destas três; qualquer outra cai em "Outros".
const AMENITY_GROUPS: { key: string; label: string; icon: IconName }[] = [
  { key: 'Esporte e Lazer', label: 'Esportes e Lazer', icon: 'barbell-outline' },
  { key: 'Segurança', label: 'Segurança', icon: 'shield-checkmark-outline' },
  { key: 'Facilidades', label: 'Facilidades', icon: 'bulb-outline' },
];

function getYoutubeThumbnail(url?: string): string | null {
  if (!url) return null;
  const match = url.match(/(?:v=|youtu\.be\/|embed\/)([A-Za-z0-9_-]{11})/);
  return match ? `https://img.youtube.com/vi/${match[1]}/hqdefault.jpg` : null;
}

type IconName = React.ComponentProps<typeof Ionicons>['name'];
type Fact = { icon: IconName; value: string; label: string };

const AnimatedPressable = Animated.createAnimatedComponent(Pressable);

// Staggered entrance wrapper — sections ease up on mount. Falls back to a plain
// View (no entering) when reduced motion is requested.
function Reveal({
  delay = 0,
  disabled,
  style,
  children,
}: {
  delay?: number;
  disabled?: boolean;
  style?: StyleProp<ViewStyle>;
  children: React.ReactNode;
}) {
  return (
    <Animated.View
      style={style}
      entering={disabled ? undefined : FadeInDown.duration(420).delay(delay)}
    >
      {children}
    </Animated.View>
  );
}

// Gentle press-in scale for tappable rows/CTAs, driven on the UI thread.
function PressableScale({
  onPress,
  disabled,
  reduceMotion,
  style,
  children,
  accessibilityRole,
  accessibilityLabel,
  accessibilityState,
}: {
  onPress?: () => void;
  disabled?: boolean;
  reduceMotion?: boolean;
  style?: StyleProp<ViewStyle>;
  children: React.ReactNode;
  accessibilityRole?: React.ComponentProps<typeof Pressable>['accessibilityRole'];
  accessibilityLabel?: string;
  accessibilityState?: React.ComponentProps<typeof Pressable>['accessibilityState'];
}) {
  const scale = useSharedValue(1);
  const animStyle = useAnimatedStyle(() => ({ transform: [{ scale: scale.value }] }));
  return (
    <AnimatedPressable
      onPress={onPress}
      disabled={disabled}
      onPressIn={() => {
        if (!reduceMotion) scale.value = withTiming(0.97, { duration: 110 });
      }}
      onPressOut={() => {
        if (!reduceMotion) scale.value = withTiming(1, { duration: 150 });
      }}
      style={[style, animStyle]}
      accessibilityRole={accessibilityRole}
      accessibilityLabel={accessibilityLabel}
      accessibilityState={accessibilityState}
    >
      {children}
    </AnimatedPressable>
  );
}

// Calm, minimal section header — a confident title with an optional muted count.
function SectionHeader({ title, count }: { title: string; count?: number }) {
  return (
    <View style={styles.sectionHeader}>
      <Text style={styles.sectionTitle}>{title}</Text>
      {count != null && <Text style={styles.sectionCount}>{count}</Text>}
    </View>
  );
}

function InfoCard({ icon, label, value }: { icon: IconName; label: string; value: string }) {
  return (
    <View style={infoStyles.card} accessible accessibilityLabel={`${label}: ${value}`}>
      <View style={infoStyles.iconWrap}>
        <Ionicons name={icon} size={16} color={Palette.primary} />
      </View>
      <View style={infoStyles.texts}>
        <Text style={infoStyles.label} numberOfLines={2}>{label}</Text>
        <Text style={infoStyles.value} numberOfLines={2}>{value}</Text>
      </View>
    </View>
  );
}

function LoginPrompt({ message, compact }: { message: string; compact?: boolean }) {
  const router = useRouter();
  return (
    <View style={[loginPromptStyles.wrap, compact && loginPromptStyles.wrapCompact]}>
      <Ionicons name="lock-closed-outline" size={compact ? 16 : 22} color={Palette.textTertiary} />
      <Text style={[loginPromptStyles.text, compact && loginPromptStyles.textCompact]}>{message}</Text>
      <TouchableOpacity
        style={[loginPromptStyles.btn, compact && loginPromptStyles.btnCompact]}
        onPress={() => router.push('/login')}
        activeOpacity={0.85}
        accessibilityRole="button"
        accessibilityLabel="Entrar na sua conta"
      >
        <Text style={[loginPromptStyles.btnText, compact && loginPromptStyles.btnTextCompact]}>Entrar</Text>
      </TouchableOpacity>
    </View>
  );
}

const loginPromptStyles = StyleSheet.create({
  wrap: {
    alignItems: 'center',
    gap: 12,
    paddingVertical: 36,
    paddingHorizontal: Spacing.xl,
    backgroundColor: Palette.surface,
    borderRadius: Radius.lg,
    borderWidth: 1,
    borderColor: Palette.borderLight,
    ...Shadow.xs,
  },
  wrapCompact: {
    flex: 1,
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    paddingVertical: 0,
    paddingHorizontal: 0,
    gap: 10,
    backgroundColor: 'transparent',
    borderWidth: 0,
    borderRadius: 0,
    ...Shadow.none,
  },
  text: { fontSize: 14, color: Palette.textSecondary, textAlign: 'center', lineHeight: 20 },
  textCompact: { flex: 1, fontSize: 13, textAlign: 'left' },
  btn: {
    backgroundColor: Palette.primary,
    borderRadius: Radius.md,
    paddingHorizontal: 26,
    paddingVertical: 12,
    marginTop: 4,
    minHeight: 44,
    justifyContent: 'center',
    ...Shadow.sm,
  },
  btnCompact: { paddingHorizontal: 16, paddingVertical: 10, marginTop: 0, minHeight: 40, ...Shadow.none },
  btnText: { fontSize: 14, fontWeight: '700', color: Palette.white },
  btnTextCompact: { fontSize: 13 },
});

const infoStyles = StyleSheet.create({
  card: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 12,
    backgroundColor: Palette.surface,
    borderRadius: Radius.lg,
    padding: 14,
    borderWidth: 1,
    borderColor: Palette.borderLight,
    flex: 1,
    minWidth: '47%',
  },
  iconWrap: {
    width: 36,
    height: 36,
    borderRadius: Radius.md,
    backgroundColor: Palette.primaryLight,
    alignItems: 'center',
    justifyContent: 'center',
  },
  texts: { flex: 1 },
  label: {
    fontSize: 11,
    color: Palette.textTertiary,
    fontWeight: '600',
    textTransform: 'uppercase',
    letterSpacing: 0.3,
  },
  value: { fontSize: 14, color: Palette.text, fontWeight: '700', marginTop: 3, lineHeight: 18 },
});

export default function EmpreendimentoDetail() {
  const { id } = useLocalSearchParams<{ id: string }>();
  const router = useRouter();
  const isAuthenticated = useAuthStore((s) => s.isAuthenticated);
  const user = useAuthStore((s) => s.user);
  const userId = user?.id;
  const insets = useSafeAreaInsets();
  const [photoIndex, setPhotoIndex] = useState(0);
  const { data, isLoading, isError, refetch, isRefetching } = useEmpreendimento(id);
  const heroRef = useRef<FlatList>(null);
  const [interesseLoading, setInteresseLoading] = useState(false);
  const [lightboxIndex, setLightboxIndex] = useState(0);
  const [lightboxVisible, setLightboxVisible] = useState(false);
  const [plantasLightboxIndex, setPlantasLightboxIndex] = useState(0);
  const [plantasLightboxVisible, setPlantasLightboxVisible] = useState(false);
  const [descExpanded, setDescExpanded] = useState(false);
  const [hotsiteVisible, setHotsiteVisible] = useState(false);
  const [pausing, setPausing] = useState(false);
  const [interessadosVisible, setInteressadosVisible] = useState(false);

  // ── Motion (60fps, UI-thread) ──
  const reduceMotion = useReducedMotion();
  const scrollY = useSharedValue(0);
  const topInset = insets.top;
  const [headerActive, setHeaderActive] = useState(false);
  const headerActiveSV = useSharedValue(false);

  const scrollHandler = useAnimatedScrollHandler((event) => {
    scrollY.value = event.contentOffset.y;
    const active = event.contentOffset.y > HERO_HEIGHT - topInset - 96;
    if (active !== headerActiveSV.value) {
      headerActiveSV.value = active;
      runOnJS(setHeaderActive)(active);
    }
  });

  // Hero parallax: lags on scroll-down, zooms on over-scroll (pull-to-refresh).
  const heroParallaxStyle = useAnimatedStyle(() => {
    if (reduceMotion) return {};
    return {
      transform: [
        {
          translateY: interpolate(
            scrollY.value,
            [-HERO_HEIGHT, 0, HERO_HEIGHT],
            [-HERO_HEIGHT / 2, 0, HERO_HEIGHT * 0.34],
            Extrapolation.CLAMP,
          ),
        },
        {
          scale: interpolate(
            scrollY.value,
            [-HERO_HEIGHT, 0],
            [1.6, 1],
            Extrapolation.CLAMP,
          ),
        },
      ],
    };
  });

  // Collapsing compact header: fades/slides in once the hero scrolls away.
  const compactHeaderStyle = useAnimatedStyle(() => {
    const start = HERO_HEIGHT - topInset - 150;
    const end = HERO_HEIGHT - topInset - 74;
    return {
      opacity: interpolate(scrollY.value, [start, end], [0, 1], Extrapolation.CLAMP),
      transform: [
        {
          translateY: reduceMotion
            ? 0
            : interpolate(scrollY.value, [start, end], [-10, 0], Extrapolation.CLAMP),
        },
      ],
    };
  });

  function openLightbox(index: number) {
    setLightboxIndex(index);
    setLightboxVisible(true);
  }

  function openPlantasLightbox(index: number) {
    setPlantasLightboxIndex(index);
    setPlantasLightboxVisible(true);
  }

  useEffect(() => {
    if (id) {
      postAcesso({
        tipo: 'Visualizar',
        descricao: 'Visualizou empreendimento',
        empreendimento_id: id,
      });
    }
  }, [id]);

  async function handleShare(nome: string, addr: string, valor?: string | number) {
    const e2 = data?.dados;
    const rawPhone = e2?.telefone_responsavel_empreendimento?.replace(/\D/g, '') ?? '';
    const waNum = rawPhone.length >= 10
      ? (rawPhone.startsWith('55') ? rawPhone : `55${rawPhone}`)
      : null;
    const parts = [
      nome,
      addr,
      valor ? `A partir de ${formatCurrency(valor)}` : null,
      e2?.status ? `Status: ${e2.status}` : null,
      e2?.unidades_quartos && formatQuartosRange(e2.unidades_quartos)
        ? `${formatQuartosRange(e2.unidades_quartos)} quartos` : null,
      e2?.unidades_area && formatAreaRange(e2.unidades_area)
        ? `Área: ${formatAreaRange(e2.unidades_area)}` : null,
      e2?.unidades_vagas && formatQuartosRange(e2.unidades_vagas)
        ? `${formatQuartosRange(e2.unidades_vagas)} vaga(s)` : null,
      e2?.unidades_disponiveis != null
        ? `${e2.unidades_disponiveis} unidades disponíveis` : null,
      waNum ? `Contato: https://wa.me/${waNum}` : null,
    ].filter(Boolean);
    await Share.share({ title: nome, message: parts.join('\n') });
  }

  function handleInteresse(empreendimentoId: string) {
    Alert.alert(
      'Registrar Interesse',
      'Deseja que entremos em contato sobre este empreendimento?',
      [
        { text: 'Cancelar', style: 'cancel' },
        {
          text: 'Confirmar',
          onPress: async () => {
            setInteresseLoading(true);
            try {
              await registrarInteresse(empreendimentoId, userId ?? '');
              Alert.alert('Interesse registrado!', 'Nossa equipe entrará em contato em breve.');
            } catch {
              Alert.alert('Erro', 'Não foi possível registrar seu interesse. Tente novamente.');
            } finally {
              setInteresseLoading(false);
            }
          },
        },
      ]
    );
  }

  if (isLoading) {
    return (
      <View style={[styles.root, { paddingTop: insets.top }]}>
        <View style={styles.skeletonHero} />
        <View style={styles.skeletonBody}>
          <View style={[styles.skeletonLine, { width: '40%', height: 12 }]} />
          <View style={[styles.skeletonLine, { width: '85%', height: 24 }]} />
          <View style={[styles.skeletonLine, { width: '65%', height: 14 }]} />
          <View style={styles.skeletonRow}>
            <View style={styles.skeletonChip} />
            <View style={styles.skeletonChip} />
            <View style={styles.skeletonChip} />
          </View>
          <View style={[styles.skeletonCard, { marginTop: 8 }]} />
          <View style={styles.skeletonGridRow}>
            <View style={styles.skeletonGridItem} />
            <View style={styles.skeletonGridItem} />
          </View>
          <View style={styles.skeletonGridRow}>
            <View style={styles.skeletonGridItem} />
            <View style={styles.skeletonGridItem} />
          </View>
        </View>
        <ActivityIndicator
          size="small"
          color={Palette.primary}
          style={{ position: 'absolute', bottom: 40, alignSelf: 'center' }}
        />
      </View>
    );
  }

  if (isError || !data?.dados) {
    return (
      <SafeAreaView style={styles.center}>
        <EmptyState
          icon="alert-circle-outline"
          title="Erro ao carregar"
          message="Não foi possível carregar os dados deste empreendimento."
          action={{ label: 'Tentar novamente', onPress: () => refetch() }}
        />
      </SafeAreaView>
    );
  }

  const e = data.dados;
  const photos = getAllPhotos(e);
  const plantas = getPlantasPhotos(e);
  const mainImage = getMainImage(e);
  const logoUrl = getEmpresaLogo(e.empresa);
  const empresaNome = getEmpresaNome(e.empresa);
  const isPreLancamento = ['pre-lancamento', 'Pré-Lançamento', 'pre lancamento'].includes(e.status ?? '');
  // lat/lng vêm como Float com default 0 no banco (e podem ser null quando o
  // geocoding cai no centroide do Brasil) — tratar 0 e null como "sem coordenada".
  const lat = e.latitude ?? 0;
  const lng = e.longitude ?? 0;
  const hasCoords = Math.abs(lat) > 0.0001 && Math.abs(lng) > 0.0001;

  // Build contact list: up to 2 responsáveis from the property, fallback to empresa contacts
  type ContactInfo = { nome: string; phone: string };
  function buildContacts(): ContactInfo[] {
    const raw: Array<{ nome?: string; tel?: string }> = [
      { nome: e.nome_responsavel_empreendimento,   tel: e.telefone_responsavel_empreendimento },
      { nome: e.nome_responsavel_empreendimento_2, tel: e.telefone_responsavel_empreendimento_2 },
      { nome: e.empresa?.nome_do_responsavel,      tel: e.empresa?.telefone_do_responsavel },
      { nome: e.empresa?.nome_do_responsavel_2,    tel: e.empresa?.telefone_do_responsavel_2 },
    ];
    const seen = new Set<string>();
    const result: ContactInfo[] = [];
    for (const r of raw) {
      const p = r.tel?.replace(/\D/g, '') ?? '';
      if (p.length >= 10 && !seen.has(p)) {
        seen.add(p);
        result.push({ nome: r.nome ?? '', phone: p });
      }
      if (result.length >= 2) break;
    }
    return result;
  }
  const contacts = buildContacts();

  const bairroNome = e.bairro_comercial || e.bairro;
  const cepFmt = e.cep
    ? e.cep.replace(/\D/g, '').replace(/^(\d{5})(\d{3})$/, '$1-$2')
    : '';
  const cidadeUf = [e.cidade, e.uf].filter(Boolean).join('/');
  const address = [
    [e.endereco, e.numero].filter(Boolean).join(', '),
    bairroNome,
    cidadeUf,
    cepFmt,
  ]
    .filter(Boolean)
    .join(', ');

  // Key facts — airy, essentials only, built directly from data (omit absent fields).
  const facts: Fact[] = ([
    e.unidades_quartos && formatQuartosRange(e.unidades_quartos)
      ? { icon: 'bed-outline', value: formatQuartosRange(e.unidades_quartos)!, label: 'Quartos' }
      : null,
    e.unidades_area && formatAreaRange(e.unidades_area)
      ? { icon: 'resize-outline', value: formatAreaRange(e.unidades_area)!, label: 'Área' }
      : null,
    e.unidades_vagas && formatQuartosRange(e.unidades_vagas)
      ? { icon: 'car-outline', value: formatQuartosRange(e.unidades_vagas)!, label: 'Vagas' }
      : null,
    e.unidades_banheiros && formatQuartosRange(e.unidades_banheiros)
      ? { icon: 'water-outline', value: formatQuartosRange(e.unidades_banheiros)!, label: 'Banheiros' }
      : null,
    e.final_construcao
      ? { icon: 'calendar-outline', value: formatDate(e.final_construcao) ?? e.final_construcao, label: 'Entrega' }
      : null,
    e.unidades_disponiveis != null
      ? { icon: 'home-outline', value: `${e.unidades_disponiveis}`, label: 'Disponíveis' }
      : null,
  ].filter(Boolean)) as Fact[];

  const factRows: Fact[][] = [];
  for (let i = 0; i < facts.length; i += 3) factRows.push(facts.slice(i, i + 3));

  // Ficha técnica — mesmos campos/rótulos da tela pública do PWA (menos comissão,
  // que a API de detalhe não retorna). Usa só campos presentes; nada deduzido.
  const areaTerreno =
    e.area_terreno != null && e.area_terreno > 1
      ? `${e.area_terreno.toLocaleString('pt-BR', { minimumFractionDigits: 2, maximumFractionDigits: 2 })} m²`
      : null;
  const condominio =
    e.valor_condominio != null && e.valor_condominio > 1 ? formatCurrency(e.valor_condominio) : null;
  const parceriasStr = e.parcerias?.length
    ? e.parcerias
        .map((p) => p.empresa.nome_mascara ?? p.empresa.nome_fantasia ?? p.empresa.razao_social ?? '')
        .filter(Boolean)
        .join(', ')
    : null;

  const fichaTecnica: { icon: IconName; label: string; value: string }[] = ([
    e.nome_construtora
      ? { icon: 'construct-outline' as IconName, label: 'Construtora', value: e.nome_construtora }
      : null,
    e.nome_projetista
      ? { icon: 'brush-outline' as IconName, label: 'Projetista', value: e.nome_projetista }
      : null,
    parceriasStr
      ? { icon: 'people-outline' as IconName, label: 'Parceria(s)', value: parceriasStr }
      : null,
    areaTerreno
      ? { icon: 'map-outline' as IconName, label: 'Área do Terreno', value: areaTerreno }
      : null,
    condominio
      ? { icon: 'cash-outline' as IconName, label: 'Condomínio', value: condominio }
      : null,
    e.taxa_enxoval
      ? { icon: 'cart-outline' as IconName, label: 'Taxa de Enxoval', value: formatCurrency(e.taxa_enxoval) }
      : null,
    e.unidades_por_andar
      ? { icon: 'apps-outline' as IconName, label: 'Unidades por Andar', value: `${e.unidades_por_andar}` }
      : null,
    e.quant_andares
      ? { icon: 'business-outline' as IconName, label: 'Número de Andares', value: `${e.quant_andares}` }
      : null,
    e.quant_unidades != null
      ? { icon: 'grid-outline' as IconName, label: 'Número de Unidades', value: `${e.quant_unidades}` }
      : null,
    e.quant_elevadores
      ? { icon: 'swap-vertical-outline' as IconName, label: 'Elevadores', value: `${e.quant_elevadores}` }
      : null,
    e.instalacao_para_ar
      ? { icon: 'snow-outline' as IconName, label: 'Ar Condicionado', value: e.instalacao_para_ar }
      : null,
    e.aquecimento_chuveiro
      ? { icon: 'thermometer-outline' as IconName, label: 'Aquecimento Chuveiro', value: e.aquecimento_chuveiro }
      : null,
    e.medidor_agua_ind != null
      ? { icon: 'water-outline' as IconName, label: 'Medidor de Água', value: e.medidor_agua_ind ? 'Sim' : 'Não' }
      : null,
    e.medidor_gas_ind != null
      ? { icon: 'flame-outline' as IconName, label: 'Medidor de Gás', value: e.medidor_gas_ind ? 'Sim' : 'Não' }
      : null,
  ].filter(Boolean)) as { icon: IconName; label: string; value: string }[];

  const documentos = getDocumentos(e);
  const unitCount = e.unidades?.length ?? 0;
  // Permissões (ver src/utils/permissions.ts): o dono gerencia; imobiliária e
  // corretor têm as ferramentas de venda, que ficam ocultas para a construtora.
  const isOwner = isDonoEmpreendimento(user, e);
  const mostrarHotsite = podeUsarHotsite(user);
  const mostrarInteresse = podeRegistrarInteresse(user);

  async function handleTogglePause(next: boolean) {
    setPausing(true);
    try {
      await setAnuncioPausado(e.id, next);
      await refetch();
      toast.success(next ? 'Anúncio interrompido.' : 'Anúncio publicado!');
    } catch {
      toast.error('Não foi possível alterar o anúncio.');
    } finally {
      setPausing(false);
    }
  }
  const hasHeroCarousel = photos.length > 0;

  return (
    <View style={styles.root}>
      <Animated.ScrollView
        style={styles.scroll}
        showsVerticalScrollIndicator={false}
        onScroll={scrollHandler}
        scrollEventThrottle={16}
        contentContainerStyle={{
          paddingBottom:
            isPreLancamento && mostrarInteresse
              ? 96 + insets.bottom
              : Spacing.xxxl + insets.bottom,
        }}
        refreshControl={
          <RefreshControl
            refreshing={isRefetching}
            onRefresh={refetch}
            tintColor={Palette.primary}
            colors={[Palette.primary]}
          />
        }
      >
        {/* ── Immersive hero gallery ── */}
        <View style={styles.hero}>
          <Animated.View style={[styles.heroMedia, heroParallaxStyle]}>
          {hasHeroCarousel ? (
            <FlatList
              ref={heroRef}
              horizontal
              pagingEnabled
              data={photos}
              keyExtractor={(p) => p.id}
              showsHorizontalScrollIndicator={false}
              onMomentumScrollEnd={(ev) => {
                setPhotoIndex(Math.round(ev.nativeEvent.contentOffset.x / SCREEN_WIDTH));
              }}
              renderItem={({ item, index }) => (
                <TouchableOpacity
                  activeOpacity={0.97}
                  onPress={() => openLightbox(index)}
                  accessibilityRole="imagebutton"
                  accessibilityLabel={`Ampliar foto ${index + 1} de ${photos.length}`}
                >
                  <Image
                    source={item.link}
                    style={styles.heroImage}
                    contentFit="cover"
                    cachePolicy="memory-disk"
                    transition={200}
                  />
                </TouchableOpacity>
              )}
            />
          ) : (
            <TouchableOpacity
              activeOpacity={0.97}
              onPress={() => (mainImage ? openLightbox(0) : undefined)}
              style={StyleSheet.absoluteFill}
              accessibilityRole={mainImage ? 'imagebutton' : 'image'}
              accessibilityLabel="Foto do empreendimento"
            >
              {mainImage ? (
                <Image source={mainImage} style={styles.heroImage} contentFit="cover" cachePolicy="memory-disk" />
              ) : (
                <View style={[styles.heroImage, styles.heroPlaceholder]}>
                  <Ionicons name="home-outline" size={60} color={Palette.textDisabled} />
                </View>
              )}
            </TouchableOpacity>
          )}
          </Animated.View>

          {/* Scrims (over-image only) */}
          <LinearGradient
            colors={['rgba(0,0,0,0.42)', 'rgba(0,0,0,0)']}
            locations={[0, 0.5]}
            style={styles.heroTopScrim}
            pointerEvents="none"
          />
          <LinearGradient
            colors={['rgba(0,0,0,0)', 'rgba(0,0,0,0.55)']}
            locations={[0.35, 1]}
            style={styles.heroBottomScrim}
            pointerEvents="none"
          />

          {/* Floating top bar */}
          <View style={[styles.topBar, { top: insets.top + 8 }]}>
            <TouchableOpacity
              style={styles.circleBtn}
              onPress={() => router.back()}
              hitSlop={HIT_SLOP}
              activeOpacity={0.8}
              accessibilityRole="button"
              accessibilityLabel="Voltar"
            >
              <Ionicons name="chevron-back" size={22} color={Palette.white} />
            </TouchableOpacity>
            <View style={styles.topBarRight}>
              <FavoriteButton id={e.id} size={20} variant="overlay" />
              <TouchableOpacity
                style={styles.circleBtn}
                onPress={() => handleShare(e.nome_empreendimento, address, e.valor)}
                hitSlop={HIT_SLOP}
                activeOpacity={0.8}
                accessibilityRole="button"
                accessibilityLabel="Compartilhar empreendimento"
              >
                <Ionicons name="share-outline" size={20} color={Palette.white} />
              </TouchableOpacity>
            </View>
          </View>

          {/* Bottom-left: single status pill */}
          <View style={styles.heroStatus}>
            {(e.fracao_vendida ?? 0) >= 1 ? (
              <View style={styles.soldPill}>
                <Ionicons name="checkmark-circle" size={13} color={Palette.white} />
                <Text style={styles.soldPillText}>100% Vendido</Text>
              </View>
            ) : (
              e.status && <StatusBadge status={e.status} inverted />
            )}
          </View>

          {/* Page dots + counter */}
          {photos.length > 1 && (
            <>
              {photos.length <= 8 && (
                <View style={styles.dots}>
                  {photos.map((p, i) => (
                    <View key={p.id} style={[styles.dot, i === photoIndex && styles.dotActive]} />
                  ))}
                </View>
              )}
              <View style={styles.counterPill}>
                <Text style={styles.counterPillText}>{photoIndex + 1}/{photos.length}</Text>
              </View>
            </>
          )}
        </View>

        {/* ── Body (single elegant scroll) ── */}
        <View style={styles.content}>
          {/* Title block */}
          <Reveal delay={50} disabled={reduceMotion} style={styles.titleBlock}>
            <View style={styles.companyRow}>
              {logoUrl && (
                <Image
                  source={logoUrl}
                  style={styles.logo}
                  contentFit="contain"
                  cachePolicy="memory-disk"
                />
              )}
              <Text style={styles.companyName} numberOfLines={1}>{empresaNome}</Text>
            </View>
            <Text style={styles.name}>{e.nome_empreendimento}</Text>
            {address ? (
              <View style={styles.addressRow}>
                <Ionicons name="location-outline" size={15} color={Palette.textTertiary} />
                <Text style={styles.address}>{address}</Text>
              </View>
            ) : null}
          </Reveal>

          {/* Key facts — airy grid with hairline dividers */}
          {facts.length > 0 && (
            <Reveal delay={110} disabled={reduceMotion} style={styles.factsBlock}>
              {factRows.map((row, ri) => (
                <View key={ri} style={[styles.factsRow, ri > 0 && styles.factsRowDivider]}>
                  {row.map((f, ci) => (
                    <View
                      key={f.label}
                      style={[styles.factCell, ci > 0 && styles.factCellDivider]}
                      accessible
                      accessibilityLabel={`${f.label}: ${f.value}`}
                    >
                      <Ionicons name={f.icon} size={19} color={Palette.primary} />
                      <Text style={styles.factValue} numberOfLines={1}>{f.value}</Text>
                      <Text style={styles.factLabel} numberOfLines={1}>{f.label}</Text>
                    </View>
                  ))}
                  {row.length < 3 &&
                    Array.from({ length: 3 - row.length }).map((_, k) => (
                      <View key={`pad-${k}`} style={styles.factCell} />
                    ))}
                </View>
              ))}
            </Reveal>
          )}

          {/* Price — prominent, only when a real value exists (never a placeholder) */}
          {e.valor && (
            <Reveal delay={160} disabled={reduceMotion} style={styles.priceBlock}>
              <View style={styles.priceEyebrowRow}>
                <Text style={styles.priceEyebrow}>A partir de</Text>
                {e.unidades_promocao && (
                  <View style={styles.promoTag}>
                    <Ionicons name="pricetag" size={10} color={Palette.white} />
                    <Text style={styles.promoTagText}>Promoção</Text>
                  </View>
                )}
              </View>
              <Text style={styles.priceValue}>{formatCurrency(e.valor)}</Text>
              {e.fracao_vendida != null && e.fracao_vendida > 0 && (
                <View style={styles.progressWrapper}>
                  <ProgressBar value={e.fracao_vendida} />
                </View>
              )}
            </Reveal>
          )}

          {/* Primary contact — WhatsApp */}
          {contacts.length > 0 && (
            <Reveal delay={210} disabled={reduceMotion}>
              <ContactCTA
                phone={contacts[0].phone}
                contactName={contacts[0].nome || undefined}
                empreendimentoName={e.nome_empreendimento}
                isAuthenticated={isAuthenticated}
              />
            </Reveal>
          )}

          {/* Gerar Hotsite — ferramenta de venda: oculta para construtora */}
          {isAuthenticated && mostrarHotsite && (
            <Reveal delay={230} disabled={reduceMotion}>
              <PressableScale
                style={styles.hotsiteBtn}
                onPress={() => {
                  tapMedium();
                  setHotsiteVisible(true);
                }}
                reduceMotion={reduceMotion}
                accessibilityRole="button"
                accessibilityLabel="Gerar hotsite para compartilhar com um cliente"
              >
                <View style={styles.hotsiteIcon}>
                  <Ionicons name="paper-plane" size={16} color={Palette.white} />
                </View>
                <View style={styles.hotsiteTexts}>
                  <Text style={styles.hotsiteTitle}>Gerar Hotsite</Text>
                  <Text style={styles.hotsiteSub} numberOfLines={1}>
                    Página exclusiva com sua foto e contato
                  </Text>
                </View>
                <Ionicons name="chevron-forward" size={17} color={Palette.accent} />
              </PressableScale>
            </Reveal>
          )}

          {/* Gestão do anúncio — só o dono (construtora) vê */}
          {isOwner && (
            <Reveal delay={235} disabled={reduceMotion}>
              <View style={styles.manageCard}>
                <View
                  style={[
                    styles.manageIcon,
                    { backgroundColor: e.anuncio_pausado ? Palette.errorBg : Palette.successBg },
                  ]}
                >
                  <Ionicons
                    name={e.anuncio_pausado ? 'pause' : 'megaphone-outline'}
                    size={17}
                    color={e.anuncio_pausado ? Palette.error : Palette.success}
                  />
                </View>
                <View style={styles.manageTexts}>
                  <Text style={styles.manageTitle}>
                    {e.anuncio_pausado ? 'Anúncio interrompido' : 'Anúncio ativo'}
                  </Text>
                  <Text style={styles.manageSub} numberOfLines={2}>
                    {e.anuncio_pausado
                      ? 'Seu empreendimento não aparece nas buscas.'
                      : 'Visível para corretores e imobiliárias.'}
                  </Text>
                </View>
                <Switch
                  value={!e.anuncio_pausado}
                  onValueChange={(v) => handleTogglePause(!v)}
                  disabled={pausing}
                  trackColor={{ false: Palette.borderStrong, true: Palette.primaryMid }}
                  thumbColor={e.anuncio_pausado ? Palette.surface : Palette.primary}
                  accessibilityLabel={
                    e.anuncio_pausado ? 'Publicar anúncio' : 'Interromper anúncio'
                  }
                />
              </View>
              {isPreLancamento && (
                <TouchableOpacity
                  style={styles.interessadosBtn}
                  onPress={() => {
                    tapLight();
                    setInteressadosVisible(true);
                  }}
                  activeOpacity={0.85}
                  accessibilityRole="button"
                  accessibilityLabel="Ver corretores interessados neste pré-lançamento"
                >
                  <Ionicons name="people-outline" size={16} color={Palette.primary} />
                  <Text style={styles.interessadosBtnText}>Ver interessados</Text>
                  <Ionicons name="chevron-forward" size={14} color={Palette.primary} />
                </TouchableOpacity>
              )}
            </Reveal>
          )}

          {/* Andamento da obra */}
          {e.status && (
            <Reveal delay={240} disabled={reduceMotion} style={styles.section}>
              <SectionHeader title="Andamento da obra" />
              <View style={styles.stepperCard}>
                <StatusStepper
                  status={e.status}
                  dataLancamento={e.data_lancamento}
                  finalConstrucao={e.final_construcao}
                  finalidade={e.finalidade}
                />
              </View>
            </Reveal>
          )}

          {/* Descrição */}
          {e.descricao ? (() => {
            const raw = e.descricao.replace(/<[^>]+>/g, '').trim();
            const LIMIT = 220;
            const isLong = raw.length > LIMIT;
            const shown = !isLong || descExpanded ? raw : raw.slice(0, LIMIT) + '...';
            return (
              <Reveal delay={120} disabled={reduceMotion} style={styles.section}>
                <SectionHeader title="Descrição" />
                <Text style={styles.description}>{shown}</Text>
                {isLong && (
                  <TouchableOpacity
                    style={styles.inlineToggle}
                    onPress={() => setDescExpanded((v) => !v)}
                    activeOpacity={0.7}
                    accessibilityRole="button"
                    accessibilityState={{ expanded: descExpanded }}
                    accessibilityLabel={descExpanded ? 'Ver menos da descrição' : 'Ver descrição completa'}
                  >
                    <Text style={styles.inlineToggleText}>{descExpanded ? 'Ver menos' : 'Ver mais'}</Text>
                    <Ionicons name={descExpanded ? 'chevron-up' : 'chevron-down'} size={15} color={Palette.primary} />
                  </TouchableOpacity>
                )}
              </Reveal>
            );
          })() : null}

          {/* O empreendimento oferece — amenidades agrupadas por categoria (como no PWA) */}
          {e.comodidade_empreendimentos && e.comodidade_empreendimentos.length > 0 && (() => {
            const items = e.comodidade_empreendimentos;
            const known = new Set(AMENITY_GROUPS.map((g) => g.key));
            const groups: { key: string; label: string; icon: IconName; tags: string[] }[] =
              AMENITY_GROUPS.map((g) => ({
                ...g,
                tags: items
                  .filter((c) => c.comodidade.categoria === g.key)
                  .map((c) => c.comodidade.descricao),
              })).filter((g) => g.tags.length > 0);
            const outros = items
              .filter((c) => !known.has(c.comodidade.categoria))
              .map((c) => c.comodidade.descricao);
            if (outros.length > 0) {
              groups.push({ key: 'Outros', label: 'Outros', icon: 'sparkles-outline', tags: outros });
            }
            return (
              <Reveal delay={120} disabled={reduceMotion} style={styles.section}>
                <SectionHeader title="O empreendimento oferece" count={items.length} />
                <View style={styles.amenityGroups}>
                  {groups.map((g) => (
                    <View key={g.key} style={styles.amenityGroup}>
                      <View style={styles.amenityGroupHeader}>
                        <Ionicons name={g.icon} size={18} color={Palette.primary} />
                        <Text style={styles.amenityGroupTitle}>{g.label}</Text>
                      </View>
                      <View style={styles.amenityChips}>
                        {g.tags.map((t) => (
                          <View key={t} style={styles.amenityChip}>
                            <Text style={styles.amenityChipText}>{t}</Text>
                          </View>
                        ))}
                      </View>
                    </View>
                  ))}
                </View>
              </Reveal>
            );
          })()}

          {/* Contato — phone (login-gated) */}
          {contacts.length > 0 && (
            <Reveal delay={120} disabled={reduceMotion} style={styles.section}>
              <SectionHeader title="Contato" />
              <View style={styles.contactList}>
                {contacts.map((c, idx) => {
                  const fmtPhone = c.phone.replace(/(\d{2})(\d{2})(\d{4,5})(\d{4})/, '+$1 ($2) $3-$4');
                  return (
                    <View key={idx} style={styles.contactCard}>
                      <View style={styles.contactAvatar}>
                        <Ionicons name="person" size={20} color={Palette.primary} />
                      </View>
                      {isAuthenticated ? (
                        <View style={styles.contactInfo}>
                          {c.nome ? <Text style={styles.contactName} numberOfLines={1}>{c.nome}</Text> : null}
                          <Text style={styles.contactPhone}>{fmtPhone}</Text>
                        </View>
                      ) : (
                        <LoginPrompt message="Entre para ver o telefone" compact />
                      )}
                    </View>
                  );
                })}
              </View>
            </Reveal>
          )}

          {/* Localização */}
          {hasCoords && (
            <Reveal delay={120} disabled={reduceMotion} style={styles.section}>
              <SectionHeader title="Localização" />
              <MapPreview
                latitude={lat}
                longitude={lng}
                title={e.nome_empreendimento}
                address={address || undefined}
              />
            </Reveal>
          )}

          {/* Ficha Técnica — seção aberta e rotulada (como no PWA) */}
          {fichaTecnica.length > 0 && (
            <Reveal delay={120} disabled={reduceMotion} style={styles.section}>
              <SectionHeader title="Ficha Técnica" />
              <View style={styles.infoGrid}>
                {fichaTecnica.map((card) => (
                  <InfoCard key={card.label} {...card} />
                ))}
              </View>
            </Reveal>
          )}

          {/* Plantas */}
          {plantas.length > 0 && (
            <Reveal delay={120} disabled={reduceMotion} style={styles.section}>
              <SectionHeader title="Plantas" count={plantas.length} />
              <View style={styles.plantasGrid}>
                {plantas.map((p, idx) => (
                  <TouchableOpacity
                    key={p.id}
                    style={styles.plantaItem}
                    onPress={() => openPlantasLightbox(idx)}
                    activeOpacity={0.88}
                    accessibilityRole="imagebutton"
                    accessibilityLabel={`Ampliar ${p.descricao || `planta ${idx + 1}`}`}
                  >
                    <View style={styles.plantaImageWrap}>
                      <Image
                        source={p.link}
                        style={styles.plantaImage}
                        contentFit="contain"
                        cachePolicy="memory-disk"
                      />
                      <View style={styles.plantaExpandHint}>
                        <Ionicons name="expand-outline" size={13} color={Palette.white} />
                      </View>
                    </View>
                    <Text style={styles.plantaLabel} numberOfLines={2}>
                      {p.descricao || `Planta ${idx + 1}`}
                    </Text>
                  </TouchableOpacity>
                ))}
              </View>
            </Reveal>
          )}

          {/* Vídeos */}
          {e.videos && e.videos.length > 0 && (
            <Reveal delay={120} disabled={reduceMotion} style={styles.section}>
              <SectionHeader title="Vídeos" count={e.videos.length} />
              <View style={styles.videoList}>
                {e.videos.map((v, idx) => {
                  const thumb = getYoutubeThumbnail(v.url_youtube);
                  const isYt = !!v.url_youtube;
                  return (
                    <PressableScale
                      key={v.id}
                      style={styles.videoCard}
                      onPress={() => v.url_youtube && Linking.openURL(v.url_youtube)}
                      reduceMotion={reduceMotion}
                      accessibilityRole="button"
                      accessibilityLabel={`Assistir vídeo ${idx + 1}${isYt ? ' no YouTube' : ''}`}
                    >
                      <View style={styles.videoThumbWrapper}>
                        {thumb ? (
                          <Image source={thumb} style={styles.videoThumb} contentFit="cover" />
                        ) : (
                          <View style={[styles.videoThumb, styles.videoThumbPlaceholder]}>
                            <Ionicons name="videocam-outline" size={40} color={Palette.textDisabled} />
                          </View>
                        )}
                        <LinearGradient
                          colors={['rgba(0,0,0,0.10)', 'rgba(0,0,0,0.55)']}
                          style={StyleSheet.absoluteFill}
                          pointerEvents="none"
                        />
                        <View style={styles.videoPlayCenter}>
                          <View style={styles.videoPlayBtn}>
                            <Ionicons name="play" size={22} color={Palette.white} />
                          </View>
                        </View>
                        {isYt && (
                          <View style={styles.ytBadge}>
                            <Ionicons name="logo-youtube" size={14} color="#FF0000" />
                            <Text style={styles.ytBadgeText}>YouTube</Text>
                          </View>
                        )}
                      </View>
                      <View style={styles.videoMeta}>
                        <View style={styles.videoMetaLeft}>
                          <Ionicons name="play-circle-outline" size={16} color={Palette.primary} />
                          <Text style={styles.videoMetaTitle} numberOfLines={1}>
                            {isYt ? `Vídeo ${idx + 1} — YouTube` : `Vídeo ${idx + 1}`}
                          </Text>
                        </View>
                        <View style={styles.videoAssistirBtn}>
                          <Text style={styles.videoAssistirText}>Assistir</Text>
                          <Ionicons name="open-outline" size={13} color={Palette.primary} />
                        </View>
                      </View>
                    </PressableScale>
                  );
                })}
              </View>
            </Reveal>
          )}

          {/* Documentos */}
          {documentos.length > 0 && (
            <Reveal delay={120} disabled={reduceMotion} style={styles.section}>
              <SectionHeader title="Documentos" count={documentos.length} />
              <View style={styles.docsWrapper}>
                {documentos.map((doc) => (
                  <PressableScale
                    key={doc.id}
                    style={styles.docRow}
                    onPress={() => Linking.openURL(doc.link!)}
                    reduceMotion={reduceMotion}
                    accessibilityRole="button"
                    accessibilityLabel={`Abrir documento ${doc.descricao || getDocumentoLabel(doc.categoria)}`}
                  >
                    <View style={styles.docIconWrap}>
                      <Ionicons name="document-text-outline" size={18} color={Palette.primary} />
                    </View>
                    <Text style={styles.docLabel} numberOfLines={1}>
                      {doc.descricao || getDocumentoLabel(doc.categoria)}
                    </Text>
                    <View style={styles.docOpenBtn}>
                      <Ionicons name="open-outline" size={14} color={Palette.primary} />
                      <Text style={styles.docOpenText}>Abrir</Text>
                    </View>
                  </PressableScale>
                ))}
              </View>
            </Reveal>
          )}

          {/* Tabela de vendas — abre em tela própria */}
          {unitCount > 0 && (
            <Reveal delay={120} disabled={reduceMotion} style={styles.section}>
              <SectionHeader title="Tabela de vendas" count={unitCount} />
              {isAuthenticated ? (
                <PressableScale
                  style={styles.tabelaCard}
                  onPress={() => {
                    tapLight();
                    router.push({
                      pathname: '/tabela-vendas/[id]',
                      params: { id: e.id },
                    });
                  }}
                  reduceMotion={reduceMotion}
                  accessibilityRole="button"
                  accessibilityLabel={`Abrir tabela de vendas com ${unitCount} unidades`}
                >
                  <View style={styles.tabelaIcon}>
                    <Ionicons name="grid-outline" size={19} color={Palette.white} />
                  </View>
                  <View style={styles.tabelaTexts}>
                    <Text style={styles.tabelaTitle}>
                      {isOwner ? 'Gerenciar tabela de vendas' : 'Ver tabela de vendas'}
                    </Text>
                    <Text style={styles.tabelaSub} numberOfLines={1}>
                      {e.unidades_disponiveis != null
                        ? `${e.unidades_disponiveis} disponíveis de ${unitCount} unidades`
                        : `${unitCount} unidades`}
                      {isOwner ? ' · editar, adicionar, IA' : ' · preços, plantas e PDF'}
                    </Text>
                  </View>
                  <Ionicons name="chevron-forward" size={18} color={Palette.white} />
                </PressableScale>
              ) : (
                <LoginPrompt message="Entre na sua conta para ver a tabela de vendas com preços e disponibilidade de cada unidade." />
              )}
            </Reveal>
          )}
        </View>
      </Animated.ScrollView>

      {/* Collapsing compact header — appears once the hero scrolls away */}
      <Animated.View
        style={[styles.compactHeader, { paddingTop: insets.top }, compactHeaderStyle]}
        pointerEvents={headerActive ? 'auto' : 'none'}
        accessibilityElementsHidden={!headerActive}
        importantForAccessibility={headerActive ? 'auto' : 'no-hide-descendants'}
      >
        <View style={styles.compactRow}>
          <TouchableOpacity
            style={styles.compactBtn}
            onPress={() => router.back()}
            hitSlop={HIT_SLOP}
            activeOpacity={0.8}
            accessibilityRole="button"
            accessibilityLabel="Voltar"
          >
            <Ionicons name="chevron-back" size={22} color={Palette.text} />
          </TouchableOpacity>
          <Text style={styles.compactTitle} numberOfLines={1}>{e.nome_empreendimento}</Text>
          <View style={styles.compactRight}>
            <FavoriteButton id={e.id} size={20} variant="surface" />
            <TouchableOpacity
              style={styles.compactBtn}
              onPress={() => handleShare(e.nome_empreendimento, address, e.valor)}
              hitSlop={HIT_SLOP}
              activeOpacity={0.8}
              accessibilityRole="button"
              accessibilityLabel="Compartilhar empreendimento"
            >
              <Ionicons name="share-outline" size={20} color={Palette.text} />
            </TouchableOpacity>
          </View>
        </View>
      </Animated.View>

      {/* Full-screen photo lightbox */}
      <PhotoLightbox
        photos={photos}
        initialIndex={lightboxIndex}
        visible={lightboxVisible}
        onClose={() => setLightboxVisible(false)}
      />
      {/* Plantas lightbox */}
      <PhotoLightbox
        photos={plantas}
        initialIndex={plantasLightboxIndex}
        visible={plantasLightboxVisible}
        onClose={() => setPlantasLightboxVisible(false)}
      />

      {/* Interessados no pré-lançamento (dono construtora) */}
      <InteressadosSheet
        visible={interessadosVisible}
        onClose={() => setInteressadosVisible(false)}
        empreendimentoId={e.id}
        empreendimentoNome={e.nome_empreendimento}
      />

      {/* Gerar Hotsite */}
      <GerarHotsiteSheet
        visible={hotsiteVisible}
        onClose={() => setHotsiteVisible(false)}
        empreendimentoId={e.id}
        empreendimentoNome={e.nome_empreendimento}
        bairro={bairroNome}
        tipoProduto={e.tipo_produto}
      />

      {/* Sticky bottom CTA — Tenho interesse (pré-lançamento).
          Só para quem vende: a construtora não se inscreve no próprio anúncio. */}
      {isPreLancamento && mostrarInteresse && (
        <View style={[styles.ctaBar, { paddingBottom: insets.bottom + 12 }]}>
          <PressableScale
            style={[styles.ctaBtn, interesseLoading && styles.ctaBtnDisabled]}
            onPress={() => handleInteresse(e.id)}
            disabled={interesseLoading}
            reduceMotion={reduceMotion}
            accessibilityRole="button"
            accessibilityState={{ disabled: interesseLoading, busy: interesseLoading }}
            accessibilityLabel="Tenho interesse neste empreendimento"
          >
            {interesseLoading
              ? <ActivityIndicator size="small" color={Palette.white} />
              : (
                <>
                  <Ionicons name="heart" size={16} color={Palette.white} />
                  <Text style={styles.ctaBtnText}>Tenho interesse</Text>
                </>
              )
            }
          </PressableScale>
        </View>
      )}
    </View>
  );
}

const styles = StyleSheet.create({
  root: { flex: 1, backgroundColor: Palette.bg },
  scroll: { flex: 1 },
  center: {
    flex: 1,
    alignItems: 'center',
    justifyContent: 'center',
    backgroundColor: Palette.bg,
  },

  // ── Hero ──
  hero: {
    height: HERO_HEIGHT,
    position: 'relative',
    backgroundColor: Palette.border,
    overflow: 'hidden',
  },
  heroMedia: {
    position: 'absolute',
    top: 0,
    left: 0,
    right: 0,
    bottom: 0,
  },
  heroImage: {
    width: SCREEN_WIDTH,
    height: HERO_HEIGHT,
  },

  // ── Collapsing compact header ──
  compactHeader: {
    position: 'absolute',
    top: 0,
    left: 0,
    right: 0,
    backgroundColor: Palette.surface,
    borderBottomWidth: 1,
    borderBottomColor: Palette.borderLight,
    zIndex: 20,
    ...Shadow.sm,
  },
  compactRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 10,
    height: 52,
    paddingHorizontal: Spacing.lg,
  },
  compactBtn: {
    width: 40,
    height: 40,
    borderRadius: Radius.full,
    alignItems: 'center',
    justifyContent: 'center',
    backgroundColor: Palette.surfaceVariant,
  },
  compactTitle: {
    flex: 1,
    fontFamily: DisplayFont.bold,
    fontSize: 16,
    color: Palette.text,
    letterSpacing: -0.2,
  },
  compactRight: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 6,
  },
  heroPlaceholder: {
    backgroundColor: Palette.surfaceVariant,
    alignItems: 'center',
    justifyContent: 'center',
  },
  heroTopScrim: {
    position: 'absolute',
    top: 0,
    left: 0,
    right: 0,
    height: 140,
  },
  heroBottomScrim: {
    position: 'absolute',
    bottom: 0,
    left: 0,
    right: 0,
    height: 160,
  },
  topBar: {
    position: 'absolute',
    left: Spacing.lg,
    right: Spacing.lg,
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
  },
  topBarRight: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 8,
  },
  circleBtn: {
    width: 38,
    height: 38,
    borderRadius: 19,
    backgroundColor: 'rgba(0,0,0,0.32)',
    alignItems: 'center',
    justifyContent: 'center',
  },
  heroStatus: {
    position: 'absolute',
    left: Spacing.lg,
    bottom: Spacing.lg,
  },
  soldPill: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 5,
    backgroundColor: Palette.textSecondary,
    borderRadius: Radius.full,
    paddingHorizontal: 11,
    paddingVertical: 6,
  },
  soldPillText: { fontSize: 12, fontWeight: '700', color: Palette.white },
  dots: {
    position: 'absolute',
    bottom: Spacing.lg + 6,
    left: 0,
    right: 0,
    flexDirection: 'row',
    justifyContent: 'center',
    alignItems: 'center',
    gap: 6,
  },
  dot: {
    width: 6,
    height: 6,
    borderRadius: 3,
    backgroundColor: 'rgba(255,255,255,0.45)',
  },
  dotActive: {
    width: 18,
    backgroundColor: 'rgba(255,255,255,0.95)',
  },
  counterPill: {
    position: 'absolute',
    right: Spacing.lg,
    bottom: Spacing.lg,
    backgroundColor: 'rgba(0,0,0,0.5)',
    borderRadius: Radius.full,
    paddingHorizontal: 11,
    paddingVertical: 5,
  },
  counterPillText: { fontSize: 12, color: Palette.white, fontWeight: '600' },

  // ── Body ──
  content: {
    paddingHorizontal: Spacing.lg,
    paddingTop: Spacing.xl,
    gap: Spacing.xxl,
  },

  // Title
  titleBlock: { gap: 6 },
  companyRow: { flexDirection: 'row', alignItems: 'center', gap: 8 },
  logo: {
    width: 24,
    height: 24,
    borderRadius: Radius.sm,
    backgroundColor: Palette.white,
    borderWidth: 1,
    borderColor: Palette.borderLight,
  },
  companyName: {
    flex: 1,
    ...Type.overline,
    color: Palette.textTertiary,
    textTransform: 'uppercase',
  },
  name: {
    ...Type.title,
    fontSize: 26,
    color: Palette.text,
    lineHeight: 32,
  },
  addressRow: { flexDirection: 'row', alignItems: 'flex-start', gap: 5, marginTop: 2 },
  address: { ...Type.meta, color: Palette.textSecondary, flex: 1, lineHeight: 19 },

  // Key facts
  factsBlock: {
    backgroundColor: Palette.surface,
    borderRadius: Radius.xl,
    borderWidth: 1,
    borderColor: Palette.borderLight,
    paddingVertical: 6,
    ...Shadow.xs,
  },
  factsRow: {
    flexDirection: 'row',
    alignItems: 'stretch',
  },
  factsRowDivider: {
    borderTopWidth: 1,
    borderTopColor: Palette.borderLight,
  },
  factCell: {
    flex: 1,
    alignItems: 'center',
    justifyContent: 'center',
    gap: 5,
    paddingVertical: 16,
    paddingHorizontal: 6,
    minHeight: 92,
  },
  factCellDivider: {
    borderLeftWidth: 1,
    borderLeftColor: Palette.borderLight,
  },
  factValue: {
    ...Type.heading,
    fontSize: 16,
    color: Palette.text,
    textAlign: 'center',
  },
  factLabel: {
    ...Type.overline,
    fontSize: 10,
    color: Palette.textTertiary,
    textTransform: 'uppercase',
    textAlign: 'center',
  },

  // Price
  priceBlock: {
    gap: 6,
    paddingVertical: Spacing.lg,
    paddingHorizontal: Spacing.xl,
    backgroundColor: Palette.primaryLight,
    borderRadius: Radius.xl,
    borderWidth: 1,
    borderColor: Palette.primaryMid,
  },
  priceEyebrowRow: { flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between' },
  priceEyebrow: {
    ...Type.overline,
    color: Palette.primaryDark,
    textTransform: 'uppercase',
  },
  promoTag: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 4,
    backgroundColor: Palette.unitPromocao,
    borderRadius: Radius.full,
    paddingHorizontal: 9,
    paddingVertical: 4,
  },
  promoTagText: { fontSize: 10, fontWeight: '700', color: Palette.white },
  priceValue: {
    fontFamily: DisplayFont.extraBold,
    fontSize: 32,
    color: Palette.primary,
    letterSpacing: -1.1,
    lineHeight: 38,
  },
  progressWrapper: { marginTop: 8 },

  // Sections
  section: { gap: Spacing.md },
  sectionHeader: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 8,
  },
  sectionTitle: {
    ...Type.heading,
    color: Palette.text,
  },
  sectionCount: {
    ...Type.meta,
    color: Palette.textTertiary,
  },
  sectionHint: {
    ...Type.caption,
    fontWeight: '500',
    color: Palette.textTertiary,
    marginTop: -6,
  },

  // Description
  description: { fontSize: 14.5, color: Palette.textSecondary, lineHeight: 23 },
  inlineToggle: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 4,
    alignSelf: 'flex-start',
    minHeight: 32,
  },
  inlineToggleText: { fontSize: 13, fontWeight: '700', color: Palette.primary },

  infoGrid: { flexDirection: 'row', flexWrap: 'wrap', gap: 8 },

  // Amenidades agrupadas ("O empreendimento oferece") — categorias + chips indigo
  amenityGroups: { gap: Spacing.lg },
  amenityGroup: { gap: 10 },
  amenityGroupHeader: { flexDirection: 'row', alignItems: 'center', gap: 8 },
  amenityGroupTitle: {
    fontSize: 14,
    fontWeight: '700',
    color: Palette.text,
    letterSpacing: -0.1,
  },
  amenityChips: { flexDirection: 'row', flexWrap: 'wrap', gap: 8 },
  amenityChip: {
    backgroundColor: Palette.primaryLight,
    borderWidth: 1,
    borderColor: Palette.primaryMid,
    borderRadius: Radius.full,
    paddingHorizontal: 12,
    paddingVertical: 8,
  },
  amenityChipText: {
    fontSize: 13,
    fontWeight: '600',
    color: Palette.primaryDark,
  },

  // Contact
  contactList: { gap: 8 },
  contactCard: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 12,
    backgroundColor: Palette.surface,
    borderRadius: Radius.lg,
    padding: 14,
    borderWidth: 1,
    borderColor: Palette.borderLight,
    ...Shadow.xs,
    minHeight: 68,
  },
  contactAvatar: {
    width: 44,
    height: 44,
    borderRadius: Radius.full,
    backgroundColor: Palette.primaryLight,
    alignItems: 'center',
    justifyContent: 'center',
  },
  contactInfo: { flex: 1, gap: 3 },
  contactName: { fontSize: 14.5, fontWeight: '700', color: Palette.text },
  contactPhone: { fontSize: 13.5, color: Palette.textSecondary, fontWeight: '500' },

  // Gestão do anúncio (dono)
  manageCard: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 12,
    backgroundColor: Palette.surface,
    borderWidth: 1,
    borderColor: Palette.borderLight,
    borderRadius: Radius.lg,
    paddingHorizontal: 14,
    paddingVertical: 12,
    minHeight: 64,
    ...Shadow.xs,
  },
  manageIcon: {
    width: 40,
    height: 40,
    borderRadius: Radius.full,
    alignItems: 'center',
    justifyContent: 'center',
  },
  manageTexts: { flex: 1, gap: 2 },
  manageTitle: {
    fontSize: 15,
    fontWeight: '800',
    color: Palette.text,
    letterSpacing: -0.2,
  },
  manageSub: {
    fontSize: 12.5,
    color: Palette.textSecondary,
    lineHeight: 17,
  },
  interessadosBtn: {
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
    marginTop: 8,
  },
  interessadosBtnText: {
    fontSize: 13.5,
    fontWeight: '800',
    color: Palette.primary,
  },
  // Entrada para a tela dedicada da tabela de vendas
  tabelaCard: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 12,
    backgroundColor: Palette.primary,
    borderRadius: Radius.lg,
    paddingHorizontal: 14,
    paddingVertical: 14,
    minHeight: 68,
    ...Shadow.sm,
  },
  tabelaIcon: {
    width: 40,
    height: 40,
    borderRadius: Radius.md,
    backgroundColor: 'rgba(255,255,255,0.18)',
    alignItems: 'center',
    justifyContent: 'center',
  },
  tabelaTexts: { flex: 1, gap: 2 },
  tabelaTitle: {
    fontSize: 15,
    fontWeight: '800',
    color: Palette.white,
    letterSpacing: -0.2,
  },
  tabelaSub: {
    fontSize: 12.5,
    color: 'rgba(255,255,255,0.82)',
  },

  // Hotsite CTA
  hotsiteBtn: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 12,
    backgroundColor: Palette.accentLight,
    borderWidth: 1,
    borderColor: Palette.accentMid,
    borderRadius: Radius.lg,
    paddingHorizontal: 14,
    paddingVertical: 12,
    minHeight: 64,
  },
  hotsiteIcon: {
    width: 40,
    height: 40,
    borderRadius: Radius.full,
    backgroundColor: Palette.accent,
    alignItems: 'center',
    justifyContent: 'center',
  },
  hotsiteTexts: { flex: 1, gap: 2 },
  hotsiteTitle: {
    fontSize: 15,
    fontWeight: '800',
    color: Palette.text,
    letterSpacing: -0.2,
  },
  hotsiteSub: {
    fontSize: 12.5,
    color: Palette.textSecondary,
  },

  // Stepper
  stepperCard: {
    backgroundColor: Palette.surface,
    borderRadius: Radius.lg,
    padding: Spacing.lg,
    borderWidth: 1,
    borderColor: Palette.borderLight,
    ...Shadow.xs,
  },

  // Documents
  docsWrapper: { gap: 8 },
  docRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 12,
    backgroundColor: Palette.surface,
    borderRadius: Radius.lg,
    padding: 12,
    borderWidth: 1,
    borderColor: Palette.borderLight,
    ...Shadow.xs,
    minHeight: 60,
  },
  docIconWrap: {
    width: 40,
    height: 40,
    borderRadius: Radius.md,
    backgroundColor: Palette.primaryLight,
    alignItems: 'center',
    justifyContent: 'center',
  },
  docLabel: { flex: 1, fontSize: 14, fontWeight: '600', color: Palette.text },
  docOpenBtn: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 4,
    paddingHorizontal: 12,
    paddingVertical: 8,
    borderRadius: Radius.full,
    backgroundColor: Palette.primaryLight,
  },
  docOpenText: { fontSize: 12, fontWeight: '700', color: Palette.primary },

  // Videos
  videoList: { gap: 12 },
  videoCard: {
    borderRadius: Radius.lg,
    overflow: 'hidden',
    backgroundColor: Palette.surface,
    borderWidth: 1,
    borderColor: Palette.borderLight,
    ...Shadow.sm,
  },
  videoThumbWrapper: {
    position: 'relative',
    width: '100%',
    aspectRatio: 16 / 9,
    backgroundColor: Palette.border,
  },
  videoThumb: { width: '100%', height: '100%', backgroundColor: Palette.border },
  videoThumbPlaceholder: {
    alignItems: 'center',
    justifyContent: 'center',
    backgroundColor: Palette.surfaceVariant,
  },
  videoPlayCenter: {
    ...StyleSheet.absoluteFill,
    alignItems: 'center',
    justifyContent: 'center',
  },
  videoPlayBtn: {
    width: 56,
    height: 56,
    borderRadius: 28,
    backgroundColor: 'rgba(0,0,0,0.5)',
    alignItems: 'center',
    justifyContent: 'center',
    borderWidth: 2,
    borderColor: 'rgba(255,255,255,0.45)',
  },
  ytBadge: {
    position: 'absolute',
    top: 10,
    right: 10,
    flexDirection: 'row',
    alignItems: 'center',
    gap: 4,
    backgroundColor: 'rgba(255,255,255,0.94)',
    borderRadius: Radius.full,
    paddingHorizontal: 9,
    paddingVertical: 5,
  },
  ytBadgeText: { fontSize: 11, fontWeight: '700', color: '#FF0000' },
  videoMeta: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    paddingHorizontal: 14,
    paddingVertical: 13,
    gap: 8,
  },
  videoMetaLeft: { flexDirection: 'row', alignItems: 'center', gap: 8, flex: 1 },
  videoMetaTitle: { fontSize: 13.5, fontWeight: '600', color: Palette.text, flex: 1 },
  videoAssistirBtn: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 4,
    paddingHorizontal: 12,
    paddingVertical: 8,
    borderRadius: Radius.full,
    backgroundColor: Palette.primaryLight,
  },
  videoAssistirText: { fontSize: 12, fontWeight: '700', color: Palette.primary },

  // Plantas
  plantasGrid: { flexDirection: 'row', flexWrap: 'wrap', gap: 12 },
  plantaItem: { width: '47%', gap: 8 },
  plantaImageWrap: {
    position: 'relative',
    borderRadius: Radius.lg,
    overflow: 'hidden',
    borderWidth: 1,
    borderColor: Palette.borderLight,
    backgroundColor: Palette.surface,
    ...Shadow.xs,
  },
  plantaImage: { width: '100%', aspectRatio: 1, backgroundColor: Palette.surfaceVariant },
  plantaExpandHint: {
    position: 'absolute',
    bottom: 8,
    right: 8,
    width: 28,
    height: 28,
    borderRadius: Radius.full,
    backgroundColor: 'rgba(0,0,0,0.5)',
    alignItems: 'center',
    justifyContent: 'center',
  },
  plantaLabel: {
    fontSize: 12.5,
    color: Palette.textSecondary,
    fontWeight: '600',
    textAlign: 'center',
  },

  // Loading skeleton
  skeletonHero: { height: HERO_HEIGHT, backgroundColor: Palette.surfaceVariant },
  skeletonBody: { padding: Spacing.lg, gap: 12 },
  skeletonLine: { borderRadius: Radius.full, backgroundColor: Palette.border },
  skeletonRow: { flexDirection: 'row', gap: 8, marginTop: 4 },
  skeletonChip: {
    width: 72,
    height: 30,
    borderRadius: Radius.full,
    backgroundColor: Palette.border,
  },
  skeletonCard: {
    height: 92,
    borderRadius: Radius.xl,
    backgroundColor: Palette.surfaceVariant,
    borderWidth: 1,
    borderColor: Palette.borderLight,
  },
  skeletonGridRow: { flexDirection: 'row', gap: 8 },
  skeletonGridItem: {
    flex: 1,
    height: 66,
    borderRadius: Radius.lg,
    backgroundColor: Palette.surfaceVariant,
    borderWidth: 1,
    borderColor: Palette.borderLight,
  },

  // Sticky CTA bar
  ctaBar: {
    backgroundColor: Palette.surface,
    borderTopWidth: 1,
    borderTopColor: Palette.borderLight,
    paddingTop: 12,
    paddingHorizontal: Spacing.lg,
    ...Shadow.lg,
  },
  ctaBtn: {
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
  ctaBtnDisabled: { opacity: 0.6 },
  ctaBtnText: { color: Palette.white, fontSize: 15, fontWeight: '800' },
});
