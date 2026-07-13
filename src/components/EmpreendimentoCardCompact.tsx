import { Image } from 'expo-image';
import { memo } from 'react';
import { StyleSheet, Text, TouchableOpacity, View } from 'react-native';
import { LinearGradient } from 'expo-linear-gradient';
import { useRouter } from 'expo-router';
import { Ionicons } from '@expo/vector-icons';
import { StatusBadge } from './StatusBadge';
import {
  getMainImage,
  getEmpresaNome,
  formatCurrency,
  isNew,
} from '@/utils/format';
import { ProgressBar } from './ProgressBar';
import { Palette, Radius, Shadow } from '@/constants/theme';
import type { Empreendimento } from '@/types';

interface Props {
  empreendimento: Empreendimento;
  fillWidth?: boolean;
}

export const EmpreendimentoCardCompact = memo(function EmpreendimentoCardCompact({ empreendimento: e, fillWidth }: Props) {
  const router = useRouter();
  const mainImage = getMainImage(e);
  const empresaNome = getEmpresaNome(e.empresa);
  const location = [e.bairro ?? e.bairro_comercial, e.cidade].filter(Boolean).join(', ');
  const novo = isNew(e.primeira_publicacao_em);
  const hasProgress = e.fracao_vendida != null && e.fracao_vendida > 0;

  return (
    <TouchableOpacity
      style={[styles.card, fillWidth && styles.cardFill]}
      activeOpacity={0.9}
      onPress={() => router.push(`/empreendimento/${e.id}`)}
    >
      {/* Image */}
      <View style={styles.imageWrapper}>
        {mainImage ? (
          <Image
            source={mainImage}
            style={styles.image}
            contentFit="cover"
            cachePolicy="memory-disk"
            transition={200}
          />
        ) : (
          <View style={[styles.image, styles.imageFallback]}>
            <Ionicons name="home-outline" size={28} color="#CBD5E1" />
          </View>
        )}
        <LinearGradient
          colors={['transparent', 'rgba(0,0,0,0.5)']}
          style={StyleSheet.absoluteFill}
        />
        {e.status && (
          <View style={styles.statusOverlay}>
            <StatusBadge status={e.status} compact inverted />
          </View>
        )}
        {(e.destaque || novo) && (
          <View style={styles.topBadges}>
            {e.destaque && (
              <View style={styles.starBadge}>
                <Ionicons name="star" size={9} color="#F79009" />
              </View>
            )}
            {novo && (
              <View style={styles.novoBadge}>
                <Text style={styles.novoText}>Novo</Text>
              </View>
            )}
          </View>
        )}
      </View>

      {/* Body */}
      <View style={styles.body}>
        {empresaNome ? (
          <Text style={styles.empresa} numberOfLines={1}>{empresaNome}</Text>
        ) : null}
        <Text style={styles.name} numberOfLines={2}>{e.nome_empreendimento}</Text>
        {location ? (
          <View style={styles.locRow}>
            <Ionicons name="location-sharp" size={10} color={Palette.primary} />
            <Text style={styles.loc} numberOfLines={1}>{location}</Text>
          </View>
        ) : null}
        <View style={styles.footer}>
          {e.valor ? (
            <Text style={styles.price}>{formatCurrency(e.valor)}</Text>
          ) : null}
          {e.unidades_disponiveis != null && (
            <View style={styles.dispBadge}>
              <Text style={styles.dispText}>{e.unidades_disponiveis} disp.</Text>
            </View>
          )}
        </View>
        {hasProgress && (
          <ProgressBar value={e.fracao_vendida!} />
        )}
      </View>
    </TouchableOpacity>
  );
});

const styles = StyleSheet.create({
  card: {
    width: 190,
    backgroundColor: Palette.surface,
    borderRadius: Radius.lg,
    overflow: 'hidden',
    ...Shadow.md,
    borderWidth: 1,
    borderColor: Palette.borderLight,
  },
  cardFill: {
    width: undefined,
    flex: 1,
  },
  imageWrapper: {
    height: 120,
    position: 'relative',
    backgroundColor: Palette.borderLight,
  },
  image: {
    width: '100%',
    height: '100%',
  },
  imageFallback: {
    alignItems: 'center',
    justifyContent: 'center',
    backgroundColor: Palette.surfaceVariant,
  },
  statusOverlay: {
    position: 'absolute',
    bottom: 7,
    left: 7,
  },
  topBadges: {
    position: 'absolute',
    top: 7,
    right: 7,
    flexDirection: 'row',
    gap: 4,
    alignItems: 'center',
  },
  starBadge: {
    width: 20,
    height: 20,
    borderRadius: 10,
    backgroundColor: 'rgba(255,255,255,0.9)',
    alignItems: 'center',
    justifyContent: 'center',
  },
  novoBadge: {
    backgroundColor: Palette.success,
    borderRadius: Radius.full,
    paddingHorizontal: 6,
    paddingVertical: 2,
  },
  novoText: {
    fontSize: 9,
    fontWeight: '700',
    color: '#fff',
  },
  body: {
    padding: 10,
    gap: 4,
  },
  empresa: {
    fontSize: 10,
    fontWeight: '700',
    color: Palette.primary,
    textTransform: 'uppercase',
    letterSpacing: 0.4,
  },
  name: {
    fontSize: 13,
    fontWeight: '800',
    color: Palette.text,
    lineHeight: 18,
    letterSpacing: -0.2,
  },
  locRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 2,
  },
  loc: {
    fontSize: 11,
    color: Palette.textSecondary,
    flex: 1,
  },
  footer: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    gap: 4,
    marginTop: 2,
  },
  price: {
    fontSize: 13,
    fontWeight: '900',
    color: Palette.primary,
    letterSpacing: -0.3,
    flex: 1,
  },
  dispBadge: {
    backgroundColor: Palette.successBg,
    borderRadius: Radius.full,
    paddingHorizontal: 6,
    paddingVertical: 2,
  },
  dispText: {
    fontSize: 9,
    fontWeight: '700',
    color: Palette.success,
  },
});
