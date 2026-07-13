import { Image } from 'expo-image';
import { memo } from 'react';
import { StyleSheet, Text, TouchableOpacity, View } from 'react-native';
import { LinearGradient } from 'expo-linear-gradient';
import { useRouter } from 'expo-router';
import { Ionicons } from '@expo/vector-icons';
import { StatusBadge } from './StatusBadge';
import { ProgressBar } from './ProgressBar';
import {
  getMainImage,
  getEmpresaLogo,
  getEmpresaNome,
  formatCurrency,
  formatAreaRange,
  formatQuartosRange,
  isNew,
} from '@/utils/format';
import { Palette, Radius, Shadow, Spacing } from '@/constants/theme';
import type { Empreendimento } from '@/types';

interface Props {
  empreendimento: Empreendimento;
}

export const EmpreendimentoCard = memo(function EmpreendimentoCard({ empreendimento: e }: Props) {
  const router = useRouter();
  const mainImage = getMainImage(e);
  const logoUrl = getEmpresaLogo(e.empresa);
  const empresaNome = getEmpresaNome(e.empresa);
  const quartosStr = formatQuartosRange(e.unidades_quartos);
  const areaStr = formatAreaRange(e.unidades_area);
  const vagasStr = formatQuartosRange(e.unidades_vagas);
  const novo = isNew(e.primeira_publicacao_em);

  return (
    <TouchableOpacity
      style={styles.card}
      activeOpacity={0.93}
      onPress={() => router.push(`/empreendimento/${e.id}`)}
    >
      {/* ── Image area ── */}
      <View style={styles.imageWrapper}>
        {mainImage ? (
          <Image
            source={mainImage}
            style={styles.image}
            contentFit="cover"
            transition={250}
            cachePolicy="memory-disk"
          />
        ) : (
          <View style={[styles.image, styles.imageFallback]}>
            <Ionicons name="home-outline" size={44} color="#CBD5E1" />
          </View>
        )}

        {/* Gradient overlay */}
        <LinearGradient
          colors={['transparent', 'rgba(0,0,0,0.55)']}
          style={StyleSheet.absoluteFill}
          start={{ x: 0, y: 0.4 }}
          end={{ x: 0, y: 1 }}
        />

        {/* Top-left badges */}
        <View style={styles.topBadgesLeft}>
          {e.unidades_promocao && (
            <View style={styles.promocaoBadge}>
              <Ionicons name="pricetag" size={9} color="#fff" />
              <Text style={styles.promocaoText}>Promoção</Text>
            </View>
          )}
          {e.tipo_produto === 'loteamento' && (
            <View style={styles.loteamentoBadge}>
              <Text style={styles.loteamentoText}>Loteamento</Text>
            </View>
          )}
          {e.tipo_produto === 'imovel-avulso' && (
            <View style={styles.avulsoBadge}>
              <Text style={styles.avulsoText}>Avulso</Text>
            </View>
          )}
        </View>

        {/* Top-right badges */}
        <View style={styles.topBadges}>
          {e.parceria_housi && (
            <View style={styles.housiBadge}>
              <Text style={styles.housiText}>HOUSI</Text>
            </View>
          )}
          {e.destaque && (
            <View style={styles.destaqueBadge}>
              <Ionicons name="star" size={9} color="#F79009" />
              <Text style={styles.destaqueText}>Destaque</Text>
            </View>
          )}
          {novo && (
            <View style={styles.novoBadge}>
              <Text style={styles.novoText}>Novo</Text>
            </View>
          )}
        </View>

        {/* Bottom of image: status + 100% vendido */}
        <View style={styles.imageFooter}>
          {e.status && <StatusBadge status={e.status} compact inverted />}
          {(e.fracao_vendida ?? 0) >= 1 && (
            <View style={styles.vendidoBadge}>
              <Text style={styles.vendidoText}>100% Vendido</Text>
            </View>
          )}
        </View>
      </View>

      {/* ── Card body ── */}
      <View style={styles.body}>
        {/* Company */}
        <View style={styles.companyRow}>
          {logoUrl ? (
            <Image
              source={logoUrl}
              style={styles.logo}
              contentFit="contain"
              cachePolicy="memory-disk"
            />
          ) : (
            <View style={styles.logoPlaceholder}>
              <Ionicons name="business" size={10} color={Palette.primary} />
            </View>
          )}
          <Text style={styles.companyName} numberOfLines={1}>
            {empresaNome}
          </Text>
        </View>

        {/* Name */}
        <Text style={styles.name} numberOfLines={2}>
          {e.nome_empreendimento}
        </Text>

        {/* Location */}
        {(e.bairro || e.cidade) && (
          <View style={styles.locationRow}>
            <Ionicons name="location-sharp" size={12} color={Palette.primary} />
            <Text style={styles.location} numberOfLines={1}>
              {[e.bairro ?? e.bairro_comercial, e.cidade].filter(Boolean).join(', ')}
            </Text>
          </View>
        )}

        {/* Specs */}
        {(quartosStr || areaStr || vagasStr || e.unidades_disponiveis != null) && (
          <View style={styles.specsRow}>
            {quartosStr && (
              <View style={styles.specChip}>
                <Ionicons name="bed-outline" size={11} color={Palette.primary} />
                <Text style={styles.specText}>{quartosStr} qts</Text>
              </View>
            )}
            {areaStr && (
              <View style={styles.specChip}>
                <Ionicons name="expand-outline" size={11} color={Palette.primary} />
                <Text style={styles.specText}>{areaStr}</Text>
              </View>
            )}
            {vagasStr && (
              <View style={styles.specChip}>
                <Ionicons name="car-outline" size={11} color={Palette.primary} />
                <Text style={styles.specText}>{vagasStr} vagas</Text>
              </View>
            )}
            {e.unidades_disponiveis != null && (
              <View style={[styles.specChip, styles.specChipDisp]}>
                <Ionicons name="home" size={11} color={Palette.success} />
                <Text style={[styles.specText, styles.specTextDisp]}>{e.unidades_disponiveis} disp.</Text>
              </View>
            )}
          </View>
        )}

        {/* Price + CTA row */}
        <View style={styles.priceCtaRow}>
          {e.valor ? (
            <View style={styles.priceBlock}>
              <Text style={styles.priceLabel}>A partir de</Text>
              <Text style={styles.price}>{formatCurrency(e.valor)}</Text>
            </View>
          ) : <View style={{ flex: 1 }} />}
          <View style={styles.ctaArrow}>
            <Text style={styles.ctaArrowText}>Ver</Text>
            <Ionicons name="arrow-forward" size={13} color={Palette.primary} />
          </View>
        </View>

        {/* Progress bar */}
        {e.fracao_vendida != null && e.fracao_vendida > 0 && (
          <ProgressBar value={e.fracao_vendida} />
        )}
      </View>
    </TouchableOpacity>
  );
});

const styles = StyleSheet.create({
  card: {
    backgroundColor: Palette.surface,
    borderRadius: Radius.xl,
    marginHorizontal: Spacing.lg,
    marginBottom: Spacing.lg,
    overflow: 'hidden',
    ...Shadow.md,
    borderWidth: 1,
    borderColor: Palette.borderLight,
  },
  imageWrapper: {
    position: 'relative',
    height: 210,
  },
  image: {
    width: '100%',
    height: '100%',
    backgroundColor: Palette.borderLight,
  },
  imageFallback: {
    alignItems: 'center',
    justifyContent: 'center',
    backgroundColor: Palette.surfaceVariant,
  },
  topBadgesLeft: {
    position: 'absolute',
    top: 12,
    left: 12,
    flexDirection: 'column',
    gap: 5,
    alignItems: 'flex-start',
  },
  topBadges: {
    position: 'absolute',
    top: 12,
    right: 12,
    flexDirection: 'row',
    gap: 6,
  },
  housiBadge: {
    backgroundColor: Palette.text,
    borderRadius: Radius.full,
    paddingHorizontal: 7,
    paddingVertical: 3,
  },
  housiText: {
    fontSize: 9,
    fontWeight: '800',
    color: '#fff',
    letterSpacing: 0.5,
  },
  destaqueBadge: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: 'rgba(255,255,255,0.92)',
    borderRadius: Radius.full,
    paddingHorizontal: 7,
    paddingVertical: 3,
    gap: 3,
  },
  destaqueText: {
    fontSize: 10,
    fontWeight: '700',
    color: '#92400E',
  },
  novoBadge: {
    backgroundColor: Palette.success,
    borderRadius: Radius.full,
    paddingHorizontal: 8,
    paddingVertical: 3,
  },
  novoText: {
    fontSize: 10,
    fontWeight: '700',
    color: '#fff',
  },
  promocaoBadge: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: Palette.unitPromocao,
    borderRadius: Radius.full,
    paddingHorizontal: 8,
    paddingVertical: 3,
    gap: 3,
  },
  promocaoText: { fontSize: 10, fontWeight: '700', color: '#fff' },
  loteamentoBadge: {
    backgroundColor: Palette.success,
    borderRadius: Radius.full,
    paddingHorizontal: 8,
    paddingVertical: 3,
  },
  loteamentoText: { fontSize: 10, fontWeight: '700', color: '#fff' },
  avulsoBadge: {
    backgroundColor: 'rgba(0,0,0,0.55)',
    borderRadius: Radius.full,
    paddingHorizontal: 8,
    paddingVertical: 3,
  },
  avulsoText: { fontSize: 10, fontWeight: '700', color: '#fff' },
  vendidoBadge: {
    backgroundColor: Palette.textSecondary,
    borderRadius: Radius.full,
    paddingHorizontal: 8,
    paddingVertical: 3,
  },
  vendidoText: { fontSize: 10, fontWeight: '700', color: '#fff' },
  imageFooter: {
    position: 'absolute',
    bottom: 12,
    left: 12,
    right: 12,
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'flex-end',
  },
  body: {
    padding: Spacing.lg,
    gap: 8,
  },
  companyRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 6,
  },
  logo: {
    width: 20,
    height: 20,
    borderRadius: 4,
    backgroundColor: Palette.borderLight,
  },
  logoPlaceholder: {
    width: 20,
    height: 20,
    borderRadius: 4,
    backgroundColor: Palette.primaryLight,
    alignItems: 'center',
    justifyContent: 'center',
  },
  companyName: {
    fontSize: 11,
    fontWeight: '700',
    color: Palette.primary,
    textTransform: 'uppercase',
    letterSpacing: 0.5,
    flex: 1,
  },
  name: {
    fontSize: 17,
    fontWeight: '800',
    color: Palette.text,
    lineHeight: 23,
    letterSpacing: -0.3,
  },
  locationRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 3,
  },
  location: {
    fontSize: 12,
    color: Palette.textSecondary,
    flex: 1,
  },
  specsRow: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    gap: 6,
  },
  specChip: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 4,
    backgroundColor: Palette.primaryLight,
    borderRadius: Radius.full,
    paddingHorizontal: 8,
    paddingVertical: 4,
  },
  specChipDisp: {
    backgroundColor: Palette.successBg,
  },
  specText: {
    fontSize: 11,
    fontWeight: '600',
    color: Palette.primaryDark,
  },
  specTextDisp: {
    color: Palette.success,
  },
  priceCtaRow: {
    flexDirection: 'row',
    alignItems: 'flex-end',
    justifyContent: 'space-between',
  },
  priceBlock: { gap: 0 },
  priceLabel: {
    fontSize: 10,
    fontWeight: '600',
    color: Palette.textTertiary,
    textTransform: 'uppercase',
    letterSpacing: 0.3,
  },
  price: {
    fontSize: 20,
    fontWeight: '900',
    color: Palette.primary,
    letterSpacing: -0.6,
  },
  ctaArrow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 4,
    paddingHorizontal: 10,
    paddingVertical: 6,
    borderRadius: Radius.full,
    borderWidth: 1.5,
    borderColor: Palette.primaryMid,
    backgroundColor: Palette.primaryLight,
  },
  ctaArrowText: {
    fontSize: 12,
    fontWeight: '700',
    color: Palette.primary,
  },
});
