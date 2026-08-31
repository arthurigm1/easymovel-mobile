import { Image } from 'expo-image';
import { memo } from 'react';
import { Pressable, StyleSheet, Text, View } from 'react-native';
import Animated, {
  FadeInDown,
  useAnimatedStyle,
  useReducedMotion,
  useSharedValue,
  withSpring,
} from 'react-native-reanimated';
import { LinearGradient } from 'expo-linear-gradient';
import { useRouter } from 'expo-router';
import { Ionicons } from '@expo/vector-icons';
import { StatusBadge } from './StatusBadge';
import { FavoriteButton } from './FavoriteButton';
import {
  getMainImage,
  getEmpresaLogo,
  getEmpresaNome,
  formatCurrency,
  formatAreaRange,
  formatQuartosRange,
  formatPricePerM2,
} from '@/utils/format';
import { Palette, Radius, Shadow, Spacing, DisplayFont } from '@/constants/theme';
import type { Empreendimento } from '@/types';

interface Props {
  empreendimento: Empreendimento;
}

type IoniconName = React.ComponentProps<typeof Ionicons>['name'];
type Spec = { icon: IoniconName; text: string };

// Card do feed da home. Usa SOMENTE campos retornados por GET /filtrar-empreendimentos
// (a rota da listagem é enxuta: não traz final_construcao/entrega, unidades_vagas nem
// coordenadas — esses só existem na rota de detalhe). Não adicionar campos daqui.
export const EmpreendimentoCard = memo(function EmpreendimentoCard({ empreendimento: e }: Props) {
  const router = useRouter();
  const mainImage = getMainImage(e);
  const logoUrl = getEmpresaLogo(e.empresa);
  const empresaNome = getEmpresaNome(e.empresa);

  const areaStr = formatAreaRange(e.unidades_area);
  const quartosStr = formatQuartosRange(e.unidades_quartos);
  const pricePerM2Str = formatPricePerM2(e.valor, e.unidades_area);
  const priceStr = e.valor ? formatCurrency(e.valor) : null;
  const disponiveis = e.unidades_disponiveis ?? 0;

  const fracao = e.fracao_vendida ?? 0;
  const vendido = fracao >= 1;
  const emVenda = fracao > 0 && fracao < 1;
  const pctVendido = Math.round(fracao * 100);

  const bairro = e.bairro ?? e.bairro_comercial;
  const location = [bairro, e.cidade].filter(Boolean).join(', ');

  // Featured = indigo signature. Show at most ONE accent pill: Destaque wins;
  // Promoção only surfaces when the item isn't featured (keeps media uncluttered).
  const featured = !!e.destaque;
  const showPromo = !featured && !!e.unidades_promocao;
  const accentLabel = !vendido ? (featured ? 'Destaque' : showPromo ? 'Promoção' : null) : null;
  const accentIcon: IoniconName = featured ? 'star' : 'pricetag';
  const accentIsPromo = accentLabel === 'Promoção';

  const specs: Spec[] = [
    areaStr ? { icon: 'resize-outline', text: areaStr } : null,
    quartosStr ? { icon: 'bed-outline', text: `${quartosStr} quartos` } : null,
    disponiveis > 0 ? { icon: 'home-outline', text: `${disponiveis} disp.` } : null,
  ].filter(Boolean) as Spec[];

  const reducedMotion = useReducedMotion();
  const scale = useSharedValue(1);
  const pressIn = () => {
    if (reducedMotion) return;
    scale.value = withSpring(0.97, { damping: 20, stiffness: 320 });
  };
  const pressOut = () => {
    if (reducedMotion) return;
    scale.value = withSpring(1, { damping: 15, stiffness: 250 });
  };
  const animatedStyle = useAnimatedStyle(() => ({ transform: [{ scale: scale.value }] }));

  return (
    <Animated.View
      entering={reducedMotion ? undefined : FadeInDown.duration(380).springify().damping(18)}
      style={[styles.shadowWrap, featured && styles.shadowWrapFeatured, animatedStyle]}
    >
      <Pressable
        style={[styles.card, featured && styles.cardFeatured]}
        onPressIn={pressIn}
        onPressOut={pressOut}
        onPress={() => router.push(`/empreendimento/${e.id}`)}
        accessibilityRole="button"
        accessibilityLabel={[
          e.nome_empreendimento,
          empresaNome,
          location,
          priceStr ? `a partir de ${priceStr}` : null,
        ].filter(Boolean).join(', ')}
      >
        {/* ── Media (photo as hero) ── */}
        <View style={styles.media}>
          {mainImage ? (
            <Image
              source={mainImage}
              style={StyleSheet.absoluteFill}
              contentFit="cover"
              transition={250}
              cachePolicy="memory-disk"
            />
          ) : (
            <View style={[StyleSheet.absoluteFill, styles.mediaFallback]}>
              <Ionicons name="business-outline" size={34} color={Palette.textDisabled} />
            </View>
          )}
          {/* Bottom scrim guarantees legibility of the overlay text (not just textShadow). */}
          <LinearGradient
            colors={['rgba(0,0,0,0.30)', 'rgba(0,0,0,0)', 'rgba(0,0,0,0.80)']}
            locations={[0, 0.4, 1]}
            style={StyleSheet.absoluteFill}
            pointerEvents="none"
          />

          {/* Top row: ONE primary badge + ONE accent (left) + construtora logo (right) */}
          <View style={styles.mediaTop}>
            <View style={styles.mediaTopLeft}>
              {vendido ? (
                <View style={styles.soldPill}>
                  <Text style={styles.soldPillText}>100% vendido</Text>
                </View>
              ) : (
                e.status ? <StatusBadge status={e.status} inverted compact /> : null
              )}
              {accentLabel ? (
                <View style={[styles.accentPill, accentIsPromo && styles.promoPill]}>
                  <Ionicons name={accentIcon} size={9} color={Palette.white} />
                  <Text style={styles.accentPillText}>{accentLabel}</Text>
                </View>
              ) : null}
            </View>
            <View style={styles.mediaTopRight}>
              <FavoriteButton id={e.id} size={19} variant="overlay" />
              {logoUrl ? (
                <View style={styles.logoChip}>
                  <Image source={logoUrl} style={styles.logo} contentFit="contain" cachePolicy="memory-disk" />
                </View>
              ) : null}
            </View>
          </View>

          {/* Bottom overlay: construtora + name + location */}
          <View style={styles.mediaBottom}>
            {empresaNome ? (
              <Text style={styles.company} numberOfLines={1}>{empresaNome.toUpperCase()}</Text>
            ) : null}
            <Text style={styles.name} numberOfLines={2}>{e.nome_empreendimento}</Text>
            {location ? (
              <View style={styles.locationRow}>
                <Ionicons name="location-sharp" size={12} color="rgba(255,255,255,0.9)" />
                <Text style={styles.location} numberOfLines={1}>{location}</Text>
              </View>
            ) : null}
          </View>
        </View>

        {/* ── Body: specs + price ── */}
        <View style={styles.body}>
          {specs.length > 0 && (
            <View style={styles.specsRow}>
              {specs.map((s, i) => (
                <View key={s.icon} style={styles.specItem}>
                  {i > 0 && <View style={styles.specDot} />}
                  <Ionicons name={s.icon} size={13} color={Palette.textTertiary} />
                  <Text style={styles.specText}>{s.text}</Text>
                </View>
              ))}
            </View>
          )}

          {priceStr ? (
            <View style={styles.priceRow}>
              <View style={styles.priceBlock}>
                <Text style={styles.priceLabel}>A partir de</Text>
                <Text style={styles.price} numberOfLines={1}>{priceStr}</Text>
              </View>
              {pricePerM2Str ? (
                <View style={styles.perM2Chip}>
                  <Text style={styles.perM2Text}>{pricePerM2Str}</Text>
                </View>
              ) : null}
            </View>
          ) : null}

          {emVenda && (
            <View style={styles.progressRow}>
              <View style={styles.progressTrack}>
                <View style={[styles.progressFill, { width: `${pctVendido}%` as `${number}%` }]} />
              </View>
              <Text style={styles.progressText}>{pctVendido}% vendido</Text>
            </View>
          )}
        </View>
      </Pressable>
    </Animated.View>
  );
});

const styles = StyleSheet.create({
  shadowWrap: {
    marginHorizontal: Spacing.lg,
    marginBottom: Spacing.md,
    borderRadius: Radius.xl,
    ...Shadow.sm,
  },
  // Featured signature: indigo-tinted glow (Shadow.lg is keyed to Palette.primary).
  shadowWrapFeatured: {
    ...Shadow.lg,
  },
  card: {
    backgroundColor: Palette.surface,
    borderRadius: Radius.xl,
    overflow: 'hidden',
    borderWidth: 1,
    borderColor: Palette.borderLight,
  },
  // Featured signature: subtle indigo ring around the whole card.
  cardFeatured: {
    borderWidth: 1.5,
    borderColor: Palette.primary,
  },

  // Media
  media: {
    aspectRatio: 16 / 10,
    backgroundColor: Palette.surfaceVariant,
    justifyContent: 'space-between',
  },
  mediaFallback: { alignItems: 'center', justifyContent: 'center' },
  mediaTop: {
    flexDirection: 'row',
    alignItems: 'flex-start',
    justifyContent: 'space-between',
    padding: 10,
    gap: 8,
  },
  mediaTopLeft: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 6,
    flexShrink: 1,
    flexWrap: 'wrap',
  },
  mediaTopRight: {
    alignItems: 'flex-end',
    gap: 8,
    flexShrink: 0,
  },
  soldPill: {
    backgroundColor: 'rgba(22,22,29,0.72)',
    borderRadius: Radius.full,
    paddingHorizontal: 10,
    paddingVertical: 4,
  },
  soldPillText: { fontSize: 10.5, fontWeight: '800', color: Palette.white, letterSpacing: 0.2 },
  accentPill: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 3,
    backgroundColor: Palette.primary,
    borderRadius: Radius.full,
    paddingHorizontal: 8,
    paddingVertical: 4,
  },
  promoPill: { backgroundColor: Palette.unitPromocao },
  accentPillText: { fontSize: 9.5, fontWeight: '800', color: Palette.white, letterSpacing: 0.3 },
  logoChip: {
    width: 38,
    height: 38,
    borderRadius: Radius.sm,
    backgroundColor: Palette.white,
    alignItems: 'center',
    justifyContent: 'center',
    padding: 4,
    ...Shadow.xs,
  },
  logo: { width: '100%', height: '100%' },

  mediaBottom: { paddingHorizontal: 14, paddingBottom: 12, gap: 2 },
  company: {
    fontSize: 10.5,
    fontWeight: '700',
    color: 'rgba(255,255,255,0.85)',
    letterSpacing: 0.6,
    textShadowColor: 'rgba(0,0,0,0.5)',
    textShadowOffset: { width: 0, height: 1 },
    textShadowRadius: 3,
  },
  name: {
    fontFamily: DisplayFont.bold,
    fontSize: 21,
    lineHeight: 25,
    color: Palette.white,
    letterSpacing: -0.4,
    textShadowColor: 'rgba(0,0,0,0.55)',
    textShadowOffset: { width: 0, height: 1 },
    textShadowRadius: 4,
  },
  locationRow: { flexDirection: 'row', alignItems: 'center', gap: 3, marginTop: 1 },
  location: {
    fontSize: 12.5,
    color: 'rgba(255,255,255,0.92)',
    fontWeight: '500',
    flexShrink: 1,
    textShadowColor: 'rgba(0,0,0,0.5)',
    textShadowOffset: { width: 0, height: 1 },
    textShadowRadius: 3,
  },

  // Body
  body: { paddingHorizontal: 14, paddingTop: 11, paddingBottom: 13, gap: 10 },
  specsRow: { flexDirection: 'row', alignItems: 'center', flexWrap: 'wrap' },
  specItem: { flexDirection: 'row', alignItems: 'center', gap: 4 },
  specDot: {
    width: 3,
    height: 3,
    borderRadius: 1.5,
    backgroundColor: Palette.borderStrong,
    marginHorizontal: 8,
  },
  specText: { fontSize: 13, fontWeight: '600', color: Palette.textSecondary },

  priceRow: {
    flexDirection: 'row',
    alignItems: 'flex-end',
    justifyContent: 'space-between',
    gap: 10,
  },
  priceBlock: { flexShrink: 1 },
  priceLabel: { fontSize: 10, fontWeight: '600', color: Palette.textTertiary, letterSpacing: 0.2 },
  price: {
    fontFamily: DisplayFont.extraBold,
    fontSize: 18,
    color: Palette.text,
    letterSpacing: -0.4,
    marginTop: 1,
  },
  perM2Chip: {
    backgroundColor: Palette.surfaceVariant,
    borderRadius: Radius.sm,
    paddingHorizontal: 8,
    paddingVertical: 4,
  },
  perM2Text: { fontSize: 11, fontWeight: '700', color: Palette.textSecondary },

  progressRow: { flexDirection: 'row', alignItems: 'center', gap: 8 },
  progressTrack: {
    flex: 1,
    height: 4,
    borderRadius: Radius.full,
    backgroundColor: Palette.border,
    overflow: 'hidden',
  },
  progressFill: { height: '100%', borderRadius: Radius.full, backgroundColor: Palette.primary },
  progressText: { fontSize: 10.5, fontWeight: '700', color: Palette.textTertiary },
});
