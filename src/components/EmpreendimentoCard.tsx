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
import { Palette, Radius, Shadow, Spacing, Type } from '@/constants/theme';
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

  // A animação de entrada e o transform de toque vivem em camadas separadas:
  // no mesmo nó, a layout animation sobrescreve o transform e o card pode
  // ficar preso invisível (o aviso do Reanimated sobre isso é literal).
  return (
    <Animated.View
      entering={reducedMotion ? undefined : FadeInDown.duration(380).springify().damping(18)}
      style={[styles.shadowWrap, featured && styles.shadowWrapFeatured]}
    >
      <Animated.View style={animatedStyle}>
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
        {/* ── Media: só a foto e os selos. Nome/construtora foram para o corpo,
             onde texto escuro sobre branco é sempre legível. ── */}
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
          {/* Scrim leve só no topo, para os selos não sumirem em fotos claras. */}
          <LinearGradient
            colors={['rgba(0,0,0,0.34)', 'rgba(0,0,0,0)']}
            locations={[0, 0.55]}
            style={styles.mediaScrim}
            pointerEvents="none"
          />

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
            <FavoriteButton id={e.id} size={19} variant="overlay" />
          </View>
        </View>

        {/* ── Corpo ── */}
        <View style={styles.body}>
          {/* Construtora: logo + nome juntos, em superfície branca. É a primeira
              informação do card — o corretor filtra mentalmente por marca. */}
          {empresaNome ? (
            <View style={styles.companyRow}>
              {logoUrl ? (
                <View style={styles.logoChip}>
                  <Image
                    source={logoUrl}
                    style={styles.logo}
                    contentFit="contain"
                    cachePolicy="memory-disk"
                  />
                </View>
              ) : (
                <View style={[styles.logoChip, styles.logoChipEmpty]}>
                  <Ionicons name="business" size={13} color={Palette.primaryMid} />
                </View>
              )}
              <Text style={styles.company} numberOfLines={1}>{empresaNome}</Text>
            </View>
          ) : null}

          <Text style={styles.name} numberOfLines={2}>{e.nome_empreendimento}</Text>

          {location ? (
            <View style={styles.locationRow}>
              <Ionicons name="location-sharp" size={13} color={Palette.textTertiary} />
              <Text style={styles.location} numberOfLines={1}>{location}</Text>
            </View>
          ) : null}

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

          {(priceStr || emVenda) && (
            <View style={styles.footer}>
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
                    <View
                      style={[styles.progressFill, { width: `${pctVendido}%` as `${number}%` }]}
                    />
                  </View>
                  <Text style={styles.progressText}>{pctVendido}% vendido</Text>
                </View>
              )}
            </View>
          )}
        </View>
      </Pressable>
      </Animated.View>
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
  // Sem borda: sobre o fundo tonal, a sombra sozinha já destaca o card —
  // borda + sombra + contraste de fundo somados só endurecem a silhueta.
  card: {
    backgroundColor: Palette.surface,
    borderRadius: Radius.xl,
    overflow: 'hidden',
  },
  // Featured signature: subtle indigo ring around the whole card.
  cardFeatured: {
    borderWidth: 1.5,
    borderColor: Palette.primary,
  },

  // Media
  media: {
    aspectRatio: 16 / 9,
    backgroundColor: Palette.surfaceVariant,
  },
  mediaFallback: { alignItems: 'center', justifyContent: 'center' },
  mediaScrim: {
    position: 'absolute',
    top: 0,
    left: 0,
    right: 0,
    height: 84,
  },
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
  soldPill: {
    backgroundColor: 'rgba(22,22,29,0.72)',
    borderRadius: Radius.full,
    paddingHorizontal: 10,
    paddingVertical: 4,
  },
  soldPillText: { ...Type.caption, color: Palette.white },
  accentPill: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 4,
    backgroundColor: Palette.primary,
    borderRadius: Radius.full,
    paddingHorizontal: 8,
    paddingVertical: 4,
  },
  promoPill: { backgroundColor: Palette.unitPromocao },
  accentPillText: { ...Type.caption, color: Palette.white },

  // Body — 16px de respiro lateral, ritmo vertical em múltiplos de 4
  body: { paddingHorizontal: 16, paddingTop: 14, paddingBottom: 14, gap: 4 },

  // Construtora — logo + nome, legíveis sobre o branco
  companyRow: { flexDirection: 'row', alignItems: 'center', gap: 8, marginBottom: 4 },
  logoChip: {
    width: 24,
    height: 24,
    borderRadius: Radius.sm,
    backgroundColor: Palette.white,
    borderWidth: 1,
    borderColor: Palette.borderLight,
    alignItems: 'center',
    justifyContent: 'center',
    padding: 3,
  },
  logoChipEmpty: { backgroundColor: Palette.primaryLight, borderColor: Palette.primarySubtle },
  logo: { width: '100%', height: '100%' },
  company: {
    flex: 1,
    ...Type.overline,
    color: Palette.textTertiary,
    textTransform: 'uppercase',
  },

  name: {
    ...Type.heading,
    fontSize: 19,
    lineHeight: 24,
    color: Palette.text,
  },
  locationRow: { flexDirection: 'row', alignItems: 'center', gap: 4 },
  location: {
    ...Type.meta,
    color: Palette.textSecondary,
    flexShrink: 1,
  },

  footer: {
    borderTopWidth: 1,
    borderTopColor: Palette.borderLight,
    paddingTop: 12,
    marginTop: 8,
    gap: 8,
  },
  specsRow: { flexDirection: 'row', alignItems: 'center', flexWrap: 'wrap', marginTop: 8 },
  specItem: { flexDirection: 'row', alignItems: 'center', gap: 5 },
  specDot: {
    width: 3,
    height: 3,
    borderRadius: 1.5,
    backgroundColor: Palette.borderStrong,
    marginHorizontal: 8,
  },
  specText: { ...Type.meta, color: Palette.textSecondary },

  priceRow: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    gap: 12,
  },
  priceBlock: { flexShrink: 1, flexDirection: 'row', alignItems: 'baseline', gap: 6 },
  priceLabel: { ...Type.caption, color: Palette.textTertiary },
  price: {
    ...Type.numeric,
    fontSize: 19,
    color: Palette.text,
  },
  perM2Chip: {
    backgroundColor: Palette.surfaceVariant,
    borderRadius: Radius.sm,
    paddingHorizontal: 8,
    paddingVertical: 4,
  },
  perM2Text: { ...Type.caption, color: Palette.textSecondary },

  progressRow: { flexDirection: 'row', alignItems: 'center', gap: 8 },
  progressTrack: {
    flex: 1,
    height: 4,
    borderRadius: Radius.full,
    backgroundColor: Palette.border,
    overflow: 'hidden',
  },
  progressFill: { height: '100%', borderRadius: Radius.full, backgroundColor: Palette.primary },
  progressText: { ...Type.caption, color: Palette.textTertiary },
});
