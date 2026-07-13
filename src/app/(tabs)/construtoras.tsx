import { useState } from 'react';
import {
  FlatList,
  RefreshControl,
  StyleSheet,
  Text,
  View,
} from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { useConstrutoras } from '@/hooks/useConstrutoras';
import { ConstrutorCard } from '@/components/ConstrutorCard';
import { EmptyState } from '@/components/EmptyState';
import { SearchBar } from '@/components/SearchBar';
import { SkeletonCard } from '@/components/SkeletonCard';

export default function ConstutorasScreen() {
  const [search, setSearch] = useState('');

  const { data, isLoading, refetch, isRefetching } = useConstrutoras({
    nome_fantasia: search || undefined,
  });

  const construtoras = data?.dados ?? [];

  return (
    <SafeAreaView style={styles.safe} edges={['top']}>
      <View style={styles.header}>
        <Text style={styles.title}>Construtoras</Text>
      </View>

      <View style={styles.searchWrapper}>
        <SearchBar placeholder="Buscar construtora..." onChangeText={setSearch} />
      </View>

      {isLoading ? (
        <View>
          {Array.from({ length: 5 }).map((_, i) => (
            <SkeletonCard key={i} />
          ))}
        </View>
      ) : (
        <FlatList
          data={construtoras}
          keyExtractor={(item) => item.id}
          renderItem={({ item }) => <ConstrutorCard empresa={item} />}
          contentContainerStyle={styles.list}
          refreshControl={
            <RefreshControl
              refreshing={isRefetching}
              onRefresh={refetch}
              tintColor="#1A56DB"
              colors={['#1A56DB']}
            />
          }
          ListEmptyComponent={
            <EmptyState
              icon="business-outline"
              title="Nenhuma construtora encontrada"
              message="Tente buscar por outro nome."
            />
          }
        />
      )}
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  safe: { flex: 1, backgroundColor: '#F8FAFC' },
  header: {
    paddingHorizontal: 20,
    paddingBottom: 12,
    paddingTop: 8,
  },
  title: {
    fontSize: 28,
    fontWeight: '800',
    color: '#0F172A',
    letterSpacing: -0.5,
  },
  searchWrapper: {
    paddingHorizontal: 16,
    marginBottom: 12,
  },
  list: {
    paddingTop: 4,
    paddingBottom: 24,
  },
});
