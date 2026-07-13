import { Image } from 'expo-image';
import { StyleSheet, Text, TouchableOpacity, View } from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { getEmpresaNome, isNew } from '@/utils/format';
import type { Empresa } from '@/types';

interface Props {
  empresa: Empresa;
  onPress?: () => void;
}

export function ConstrutorCard({ empresa, onPress }: Props) {
  const nome = getEmpresaNome(empresa);
  const logoAnexo = empresa.anexos?.find((a) => a.categoria === 'logo_empresa');
  const nova = isNew(empresa.criado_em);

  return (
    <TouchableOpacity style={styles.card} activeOpacity={0.88} onPress={onPress}>
      <View style={styles.logoWrapper}>
        {logoAnexo?.url ? (
          <Image
            source={logoAnexo.url}
            style={styles.logo}
            contentFit="contain"
            cachePolicy="memory-disk"
          />
        ) : (
          <View style={styles.logoPlaceholder}>
            <Ionicons name="business-outline" size={28} color="#94A3B8" />
          </View>
        )}
      </View>

      <View style={styles.info}>
        <Text style={styles.nome} numberOfLines={2}>
          {nome}
        </Text>
        {empresa._count?.empreendimentos != null && (
          <Text style={styles.count}>
            {empresa._count.empreendimentos} empreendimento
            {empresa._count.empreendimentos !== 1 ? 's' : ''}
          </Text>
        )}
      </View>

      {nova && (
        <View style={styles.newBadge}>
          <Text style={styles.newText}>Nova</Text>
        </View>
      )}
    </TouchableOpacity>
  );
}

const styles = StyleSheet.create({
  card: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: '#FFFFFF',
    borderRadius: 14,
    marginHorizontal: 16,
    marginBottom: 12,
    padding: 14,
    gap: 14,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 1 },
    shadowOpacity: 0.06,
    shadowRadius: 6,
    elevation: 2,
  },
  logoWrapper: {
    width: 56,
    height: 56,
    borderRadius: 12,
    overflow: 'hidden',
    backgroundColor: '#F8FAFC',
    borderWidth: 1,
    borderColor: '#E2E8F0',
  },
  logo: {
    width: 56,
    height: 56,
  },
  logoPlaceholder: {
    width: 56,
    height: 56,
    alignItems: 'center',
    justifyContent: 'center',
    backgroundColor: '#F1F5F9',
  },
  info: {
    flex: 1,
    gap: 3,
  },
  nome: {
    fontSize: 15,
    fontWeight: '700',
    color: '#0F172A',
  },
  count: {
    fontSize: 12,
    color: '#64748B',
  },
  newBadge: {
    backgroundColor: '#D1FAE5',
    borderRadius: 6,
    paddingHorizontal: 8,
    paddingVertical: 3,
  },
  newText: {
    fontSize: 11,
    fontWeight: '700',
    color: '#065F46',
  },
});
