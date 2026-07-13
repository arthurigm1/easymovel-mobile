import { Image } from 'expo-image';
import {
  ActivityIndicator,
  Dimensions,
  FlatList,
  ScrollView,
  StyleSheet,
  Text,
  View,
} from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { useLocalSearchParams } from 'expo-router';
import { Ionicons } from '@expo/vector-icons';
import { useEmpreendimento } from '@/hooks/useEmpreendimentos';
import { StatusBadge } from '@/components/StatusBadge';
import { EmptyState } from '@/components/EmptyState';
import { formatCurrency, formatArea } from '@/utils/format';
import type { Unidade } from '@/types';

const { width } = Dimensions.get('window');

function InfoRow({ icon, label, value }: { icon: React.ComponentProps<typeof Ionicons>['name']; label: string; value: string }) {
  return (
    <View style={styles.infoRow}>
      <Ionicons name={icon} size={16} color="#64748B" />
      <Text style={styles.infoLabel}>{label}</Text>
      <Text style={styles.infoValue}>{value}</Text>
    </View>
  );
}

function UnitCard({ unit }: { unit: Unidade }) {
  const specs = [
    unit.quant_quartos ? `${unit.quant_quartos} qts` : null,
    unit.quant_suites ? `${unit.quant_suites} suítes` : null,
    unit.quant_vagas ? `${unit.quant_vagas} vagas` : null,
    unit.area ? formatArea(unit.area) : null,
  ].filter(Boolean);

  const STATUS_COLOR: Record<string, string> = {
    Disponível: '#065F46',
    Decorado: '#1D4ED8',
    Promoção: '#B45309',
    Modelo: '#7C3AED',
  };

  const statusColor = (unit.status && STATUS_COLOR[unit.status]) ?? '#475569';

  return (
    <View style={styles.unitCard}>
      <View style={styles.unitHeader}>
        <Text style={styles.unitType}>{unit.tipologia ?? 'Unidade'}</Text>
        {unit.status && (
          <Text style={[styles.unitStatus, { color: statusColor }]}>{unit.status}</Text>
        )}
      </View>
      {unit.descricao && <Text style={styles.unitDesc}>{unit.descricao}</Text>}
      {specs.length > 0 && (
        <Text style={styles.unitSpecs}>{specs.join(' · ')}</Text>
      )}
      {unit.valor && (
        <Text style={styles.unitPrice}>{formatCurrency(unit.valor)}</Text>
      )}
    </View>
  );
}

export default function EmpreendimentoDetail() {
  const { id } = useLocalSearchParams<{ id: string }>();
  const { data, isLoading, isError } = useEmpreendimento(id);

  if (isLoading) {
    return (
      <SafeAreaView style={styles.center}>
        <ActivityIndicator size="large" color="#1A56DB" />
      </SafeAreaView>
    );
  }

  if (isError || !data?.dados) {
    return (
      <SafeAreaView style={styles.center}>
        <EmptyState
          icon="alert-circle-outline"
          title="Erro ao carregar"
          message="Não foi possível carregar os dados do empreendimento."
        />
      </SafeAreaView>
    );
  }

  const e = data.dados;

  const images = [
    ...(e.urlImagem ? [e.urlImagem] : []),
    ...(e.anexos
      ?.filter((a) => a.categoria === 'imagem' && a.url)
      .sort((a, b) => (a.ordenacao ?? 0) - (b.ordenacao ?? 0))
      .map((a) => a.url!)
      ?? []),
  ];

  const uniqueImages = [...new Set(images)];

  const comodidades =
    e.comodidade_empreendimentos?.map((c) => c.comodidade.nome) ?? [];

  const address = [e.endereco, e.numero, e.bairro, e.cidade, e.uf]
    .filter(Boolean)
    .join(', ');

  return (
    <ScrollView style={styles.scroll} showsVerticalScrollIndicator={false}>
      {/* Image carousel */}
      {uniqueImages.length > 0 ? (
        <FlatList
          horizontal
          pagingEnabled
          data={uniqueImages}
          keyExtractor={(uri, i) => `${uri}-${i}`}
          showsHorizontalScrollIndicator={false}
          renderItem={({ item }) => (
            <Image source={item} style={styles.carouselImage} contentFit="cover" />
          )}
          style={styles.carousel}
        />
      ) : (
        <View style={[styles.carouselImage, styles.carouselPlaceholder]}>
          <Ionicons name="image-outline" size={48} color="#CBD5E1" />
        </View>
      )}

      <View style={styles.content}>
        {/* Title block */}
        <View style={styles.titleBlock}>
          {e.nomeConstrutora && (
            <Text style={styles.construtora}>{e.nomeConstrutora}</Text>
          )}
          <Text style={styles.nome}>{e.nomeEmpreendimento}</Text>
          {e.status && <StatusBadge status={e.status} />}
        </View>

        {/* Price */}
        {e.valor && (
          <View style={styles.priceBlock}>
            <Text style={styles.priceLabel}>A partir de</Text>
            <Text style={styles.price}>{formatCurrency(e.valor)}</Text>
          </View>
        )}

        {/* Info rows */}
        <View style={styles.infoBlock}>
          {address && <InfoRow icon="location-outline" label="Endereço" value={address} />}
          {e.final_construcao && (
            <InfoRow icon="calendar-outline" label="Entrega" value={e.final_construcao} />
          )}
          {e.quant_andares && (
            <InfoRow icon="layers-outline" label="Andares" value={String(e.quant_andares)} />
          )}
          {e.quant_elevadores && (
            <InfoRow icon="arrow-up-outline" label="Elevadores" value={String(e.quant_elevadores)} />
          )}
          {e.valor_condominio && (
            <InfoRow icon="cash-outline" label="Condomínio" value={formatCurrency(e.valor_condominio)} />
          )}
        </View>

        {/* Description */}
        {e.descricao ? (
          <View style={styles.section}>
            <Text style={styles.sectionTitle}>Descrição</Text>
            <Text style={styles.description}>{e.descricao}</Text>
          </View>
        ) : null}

        {/* Amenities */}
        {comodidades.length > 0 && (
          <View style={styles.section}>
            <Text style={styles.sectionTitle}>Comodidades</Text>
            <View style={styles.comodidadesGrid}>
              {comodidades.map((c) => (
                <View key={c} style={styles.comodidade}>
                  <Ionicons name="checkmark-circle" size={16} color="#1A56DB" />
                  <Text style={styles.comodidadeText}>{c}</Text>
                </View>
              ))}
            </View>
          </View>
        )}

        {/* Units */}
        {e.unidades && e.unidades.length > 0 && (
          <View style={styles.section}>
            <Text style={styles.sectionTitle}>
              Unidades ({e.unidades_disponiveis ?? e.unidades.length} disponíveis)
            </Text>
            <View style={styles.unitsWrapper}>
              {e.unidades.map((u) => (
                <UnitCard key={u.id} unit={u} />
              ))}
            </View>
          </View>
        )}

        <View style={styles.bottomPad} />
      </View>
    </ScrollView>
  );
}

const styles = StyleSheet.create({
  scroll: { flex: 1, backgroundColor: '#F8FAFC' },
  center: { flex: 1, justifyContent: 'center', alignItems: 'center', backgroundColor: '#F8FAFC' },
  carousel: { backgroundColor: '#E2E8F0' },
  carouselImage: {
    width,
    height: 260,
    backgroundColor: '#F1F5F9',
  },
  carouselPlaceholder: {
    alignItems: 'center',
    justifyContent: 'center',
  },
  content: { padding: 20, gap: 20 },
  titleBlock: { gap: 8 },
  construtora: {
    fontSize: 12,
    fontWeight: '700',
    color: '#1A56DB',
    textTransform: 'uppercase',
    letterSpacing: 0.5,
  },
  nome: {
    fontSize: 22,
    fontWeight: '800',
    color: '#0F172A',
    lineHeight: 28,
  },
  priceBlock: {
    backgroundColor: '#EBF0FF',
    borderRadius: 14,
    padding: 16,
    gap: 4,
  },
  priceLabel: {
    fontSize: 12,
    color: '#4B6FA8',
    fontWeight: '600',
  },
  price: {
    fontSize: 26,
    fontWeight: '900',
    color: '#1A56DB',
  },
  infoBlock: {
    backgroundColor: '#FFFFFF',
    borderRadius: 14,
    padding: 16,
    gap: 12,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 1 },
    shadowOpacity: 0.04,
    shadowRadius: 4,
    elevation: 2,
  },
  infoRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 8,
  },
  infoLabel: {
    fontSize: 13,
    color: '#64748B',
    width: 80,
    flexShrink: 0,
  },
  infoValue: {
    fontSize: 13,
    color: '#0F172A',
    fontWeight: '600',
    flex: 1,
  },
  section: { gap: 12 },
  sectionTitle: {
    fontSize: 16,
    fontWeight: '800',
    color: '#0F172A',
    letterSpacing: -0.2,
  },
  description: {
    fontSize: 14,
    color: '#475569',
    lineHeight: 22,
  },
  comodidadesGrid: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    gap: 10,
  },
  comodidade: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 6,
    backgroundColor: '#EBF0FF',
    borderRadius: 8,
    paddingHorizontal: 10,
    paddingVertical: 6,
  },
  comodidadeText: {
    fontSize: 13,
    color: '#1A56DB',
    fontWeight: '600',
  },
  unitsWrapper: { gap: 10 },
  unitCard: {
    backgroundColor: '#FFFFFF',
    borderRadius: 12,
    padding: 14,
    gap: 6,
    borderWidth: 1,
    borderColor: '#E2E8F0',
  },
  unitHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
  },
  unitType: {
    fontSize: 14,
    fontWeight: '700',
    color: '#0F172A',
  },
  unitStatus: {
    fontSize: 12,
    fontWeight: '600',
  },
  unitDesc: {
    fontSize: 13,
    color: '#64748B',
  },
  unitSpecs: {
    fontSize: 13,
    color: '#475569',
  },
  unitPrice: {
    fontSize: 16,
    fontWeight: '800',
    color: '#0F172A',
  },
  bottomPad: { height: 32 },
});
