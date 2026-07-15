import { Image } from 'expo-image';
import { memo, useRef } from 'react';
import { Animated, Pressable, StyleSheet, Text, View } from 'react-native';
import { LinearGradient } from 'expo-linear-gradient';
import { useRouter } from 'expo-router';
import { Ionicons } from '@expo/vector-icons';
import { Badge } from './Badge';
import { ProgressBar } from './ProgressBar';
import {
  getMainImage,
  getEmpresaLogo,
  getEmpresaNome,
  formatCurrency,
  formatAreaRange,
  formatQuartosRange,
  formatVagasRange,
  formatEntrega,
  formatRelativeTime,
  formatPricePerM2,
} from '@/utils/format';
import { findConstructionStage } from '@/constants/status';
import { Palette, Radius, Shadow, Spacing, DisplayFont } from '@/constants/theme';
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
  const vagasStr = formatVagasRange(e.unidades_vagas);
  const vendido = (e.fracao_vendida ?? 0) >= 1;
  const endereco = [e.endereco, e.numero, e.bairro ?? e.bairro_comercial, e.cidade, e.uf]
    .filter(Boolean)
    .join(', ');

  // Coluna de meta à direita do preço, no estilo Órulo: entrega, situação, recência.
  const entregaStr = formatEntrega(e.final_construcao);
  const relTimeStr = formatRelativeTime(e.primeira_publicacao_em);
  const pricePerM2Str = formatPricePerM2(e.valor, e.unidades_area);
  const stage = findConstructionStage(e.status);
  const hasMeta = !!(entregaStr || vendido || stage || relTimeStr);

  const scale = useRef(new Animated.Value(1)).current;

  function handlePressIn() {
    Animated.spring(scale, { toValue: 0.97, useNativeDriver: true, speed: 50, bounciness: 0 }).start();
  }
  function handlePressOut() {
    Animated.spring(scale, { toValue: 1, useNativeDriver: true, speed: 30, bounciness: 6 }).start();
  }

  return (
    <Animated.View style={[styles.cardShadowWrap, { transform: [{ scale }] }]}>
      <Pressable
        style={styles.card}
        onPressIn={handlePressIn}
        onPressOut={handlePressOut}
        onPress={() => router.push(`/empreendimento/${e.id}`)}
      >
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
              <Ionicons name="image-outline" size={40} color={Palette.textDisabled} />
            </View>
          )}

          {e.destaque && (
            <View style={styles.destaqueBadge}>
              <Badge label="DESTAQUE" color={Palette.primary} bg={Palette.white} size="sm" />
            </View>
          )}

          <LinearGradient
            colors={['transparent', 'rgba(0,0,0,0.25)']}
            style={styles.imageFooter}
            pointerEvents="none"
          />
        </View>

        <View style={styles.body}>
          <View style={styles.companyRow}>
            {logoUrl ? (
              <Image source={logoUrl} style={styles.logo} contentFit="cover" />
            ) : (
              <View style={[styles.logo, styles.logoPlaceholder]}>
                <Ionicons name="business" size={12} color={Palette.textTertiary} />
              </View>
            )}
            <Text style={styles.companyName} numberOfLines={1}>{empresaNome || '—'}</Text>
          </View>

          <View style={styles.titleBlock}>
            <Text style={styles.name} numberOfLines={2}>{e.nome_empreendimento}</Text>
            {endereco ? (
              <View style={styles.locationRow}>
                <Ionicons name="location-outline" size={13} color={Palette.textSecondary} />
                <Text style={styles.location} numberOfLines={1}>{endereco}</Text>
              </View>
            ) : null}
          </View>

          <View style={styles.specsRow}>
            {areaStr && (
              <View style={styles.specItem}>
                <Ionicons name="resize-outline" size={14} color={Palette.textSecondary} />
                <Text style={styles.specText}>{areaStr}</Text>
              </View>
            )}
            {quartosStr && (
              <View style={styles.specItem}>
                <Ionicons name="bed-outline" size={14} color={Palette.textSecondary} />
                <Text style={styles.specText}>{quartosStr} quartos</Text>
              </View>
            )}
            {vagasStr && (
              <View style={styles.specItem}>
                <Ionicons name="car-outline" size={14} color={Palette.textSecondary} />
                <Text style={styles.specText}>{vagasStr} vagas</Text>
              </View>
            )}
          </View>

          <View style={styles.divider} />

          {(e.valor || hasMeta) && (
            <View style={[styles.bottomRow, !e.valor && styles.bottomRowMetaOnly]}>
              {e.valor ? (
                <View style={styles.priceBlock}>
                  <Text style={styles.priceLabel}>A partir de</Text>
                  <Text style={styles.price}>{formatCurrency(e.valor)}</Text>
                  {pricePerM2Str && <Text style={styles.pricePerM2}>{pricePerM2Str}</Text>}
                </View>
              ) : null}

              {hasMeta && (
                <View style={[styles.metaColumn, !e.valor && styles.metaColumnAlone]}>
                  {entregaStr && (
                    <Text style={styles.metaEntrega} numberOfLines={1}>
                      Entrega: <Text style={styles.metaEntregaValue}>{entregaStr}</Text>
                    </Text>
                  )}
                  {vendido ? (
                    <View style={styles.metaStatusRow}>
                      <Ionicons name="checkmark-circle" size={12} color={Palette.statusPronto} />
                      <Text style={[styles.metaStatusText, { color: Palette.statusPronto }]}>
                        100% VENDIDO
                      </Text>
                    </View>
                  ) : stage ? (
                    <View style={styles.metaStatusRow}>
                      <View style={[styles.metaStatusDot, { backgroundColor: stage.color }]} />
                      <Text style={[styles.metaStatusText, { color: stage.color }]} numberOfLines={1}>
                        {stage.label.toUpperCase()}
                      </Text>
                    </View>
                  ) : null}
                  {relTimeStr && (
                    <Text style={styles.metaTime} numberOfLines={1}>{relTimeStr}</Text>
                  )}
                </View>
              )}
            </View>
          )}

          <ProgressBar value={e.fracao_vendida ?? 0} />
        </View>
      </Pressable>
    </Animated.View>
  );
});

const styles = StyleSheet.create({
  cardShadowWrap: {
    marginHorizontal: Spacing.lg,
    marginBottom: Spacing.md,
    borderRadius: Radius.xl,
    ...Shadow.sm,
  },
  card: {
    backgroundColor: Palette.surface,
    borderRadius: Radius.xl,
    overflow: 'hidden',
  },
  imageWrapper: {
    position: 'relative',
    aspectRatio: 4 / 3,
    backgroundColor: Palette.surfaceVariant,
  },
  image: {
    width: '100%',
    height: '100%',
  },
  imageFallback: {
    alignItems: 'center',
    justifyContent: 'center',
  },
  destaqueBadge: {
    position: 'absolute',
    top: 12,
    left: 12,
  },
  imageFooter: {
    position: 'absolute',
    left: 0,
    right: 0,
    bottom: 0,
    height: 56,
  },
  body: {
    padding: Spacing.md,
    gap: Spacing.sm,
  },
  companyRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: Spacing.xs,
  },
  logo: {
    width: 18,
    height: 18,
    borderRadius: Radius.xs,
  },
  logoPlaceholder: {
    backgroundColor: Palette.surfaceVariant,
    alignItems: 'center',
    justifyContent: 'center',
  },
  companyName: {
    flex: 1,
    fontSize: 11.5,
    fontWeight: '600',
    color: Palette.textTertiary,
    letterSpacing: 0.1,
  },
  titleBlock: {
    gap: 3,
  },
  name: {
    fontFamily: DisplayFont.bold,
    fontSize: 17,
    color: Palette.text,
    letterSpacing: -0.3,
  },
  locationRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 4,
  },
  location: {
    flex: 1,
    fontSize: 12,
    color: Palette.textSecondary,
  },
  specsRow: {
    flexDirection: 'row',
    gap: Spacing.md,
  },
  specItem: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 4,
  },
  specText: {
    fontSize: 12,
    fontWeight: '600',
    color: Palette.textSecondary,
  },
  divider: {
    height: 1,
    backgroundColor: Palette.borderLight,
  },
  bottomRow: {
    flexDirection: 'row',
    alignItems: 'flex-end',
    justifyContent: 'space-between',
    gap: Spacing.sm,
  },
  bottomRowMetaOnly: {
    justifyContent: 'flex-start',
  },
  priceBlock: {
    gap: 1,
  },
  priceLabel: {
    fontSize: 10,
    color: Palette.textTertiary,
    fontWeight: '600',
  },
  price: {
    fontFamily: DisplayFont.extraBold,
    fontSize: 17,
    color: Palette.text,
    letterSpacing: -0.3,
  },
  pricePerM2: {
    fontSize: 11,
    color: Palette.textTertiary,
    fontWeight: '500',
    marginTop: 1,
  },
  metaColumn: {
    alignItems: 'flex-end',
    gap: 3,
  },
  metaColumnAlone: {
    alignItems: 'flex-start',
  },
  metaEntrega: {
    fontSize: 11,
    color: Palette.textTertiary,
    fontWeight: '500',
  },
  metaEntregaValue: {
    fontWeight: '700',
    color: Palette.textSecondary,
  },
  metaStatusRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 4,
  },
  metaStatusDot: {
    width: 5,
    height: 5,
    borderRadius: 3,
  },
  metaStatusText: {
    fontSize: 10.5,
    fontWeight: '700',
    letterSpacing: 0.2,
  },
  metaTime: {
    fontSize: 10,
    color: Palette.textDisabled,
    fontWeight: '500',
  },
});
