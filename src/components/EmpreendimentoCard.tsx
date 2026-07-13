import { Image } from 'expo-image';
import { StyleSheet, Text, TouchableOpacity, View } from 'react-native';
import { useRouter } from 'expo-router';
import { Ionicons } from '@expo/vector-icons';
import { StatusBadge } from './StatusBadge';
import { formatCurrency, formatArea } from '@/utils/format';
import type { Empreendimento } from '@/types';

interface Props {
  empreendimento: Empreendimento;
}

export function EmpreendimentoCard({ empreendimento: e }: Props) {
  const router = useRouter();

  const specs = [
    e.quartos ? { icon: 'bed-outline' as const, label: `${e.quartos} qts` } : null,
    e.area ? { icon: 'expand-outline' as const, label: formatArea(e.area)! } : null,
    e.unidades_disponiveis
      ? { icon: 'home-outline' as const, label: `${e.unidades_disponiveis} disp.` }
      : null,
  ].filter(Boolean) as { icon: keyof typeof Ionicons.glyphMap; label: string }[];

  return (
    <TouchableOpacity
      style={styles.card}
      activeOpacity={0.92}
      onPress={() => router.push(`/empreendimento/${e.id}`)}
    >
      <View style={styles.imageWrapper}>
        <Image
          source={e.urlImagem ?? require('@/assets/images/icon.png')}
          style={styles.image}
          contentFit="cover"
          transition={300}
          cachePolicy="memory-disk"
        />
        {e.destaque && (
          <View style={styles.destaqueBadge}>
            <Ionicons name="star" size={10} color="#F59E0B" />
            <Text style={styles.destaqueText}>Destaque</Text>
          </View>
        )}
        {e.status && (
          <View style={styles.statusOverlay}>
            <StatusBadge status={e.status} small />
          </View>
        )}
      </View>

      <View style={styles.body}>
        {e.nomeConstrutora && (
          <Text style={styles.construtora} numberOfLines={1}>
            {e.nomeConstrutora}
          </Text>
        )}

        <Text style={styles.nome} numberOfLines={2}>
          {e.nomeEmpreendimento}
        </Text>

        {(e.bairro || e.cidade) && (
          <View style={styles.locationRow}>
            <Ionicons name="location-outline" size={13} color="#94A3B8" />
            <Text style={styles.location} numberOfLines={1}>
              {[e.bairro, e.cidade, e.uf].filter(Boolean).join(', ')}
            </Text>
          </View>
        )}

        <View style={styles.footer}>
          <Text style={styles.price}>{formatCurrency(e.valor)}</Text>

          {specs.length > 0 && (
            <View style={styles.specs}>
              {specs.map((spec) => (
                <View key={String(spec.icon)} style={styles.spec}>
                  <Ionicons name={spec.icon} size={12} color="#64748B" />
                  <Text style={styles.specText}>{spec.label}</Text>
                </View>
              ))}
            </View>
          )}
        </View>
      </View>
    </TouchableOpacity>
  );
}

const styles = StyleSheet.create({
  card: {
    backgroundColor: '#FFFFFF',
    borderRadius: 16,
    marginHorizontal: 16,
    marginBottom: 16,
    overflow: 'hidden',
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.08,
    shadowRadius: 10,
    elevation: 4,
  },
  imageWrapper: {
    position: 'relative',
  },
  image: {
    width: '100%',
    height: 200,
    backgroundColor: '#F1F5F9',
  },
  destaqueBadge: {
    position: 'absolute',
    top: 12,
    left: 12,
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: '#FFFBEB',
    borderRadius: 6,
    paddingHorizontal: 7,
    paddingVertical: 3,
    gap: 3,
  },
  destaqueText: {
    fontSize: 10,
    fontWeight: '700',
    color: '#B45309',
  },
  statusOverlay: {
    position: 'absolute',
    top: 12,
    right: 12,
  },
  body: {
    padding: 14,
    gap: 6,
  },
  construtora: {
    fontSize: 11,
    fontWeight: '600',
    color: '#1A56DB',
    textTransform: 'uppercase',
    letterSpacing: 0.5,
  },
  nome: {
    fontSize: 16,
    fontWeight: '700',
    color: '#0F172A',
    lineHeight: 22,
  },
  locationRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 3,
  },
  location: {
    fontSize: 13,
    color: '#64748B',
    flex: 1,
  },
  footer: {
    marginTop: 4,
    gap: 6,
  },
  price: {
    fontSize: 17,
    fontWeight: '800',
    color: '#0F172A',
  },
  specs: {
    flexDirection: 'row',
    gap: 12,
  },
  spec: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 4,
  },
  specText: {
    fontSize: 12,
    color: '#64748B',
  },
});
