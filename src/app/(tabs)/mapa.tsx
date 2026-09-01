import { useCallback, useEffect, useMemo, useRef, useState } from 'react';
import {
  ActivityIndicator,
  Platform,
  ScrollView,
  StyleSheet,
  Text,
  TouchableOpacity,
  View,
} from 'react-native';
import { Image } from 'expo-image';
import { useRouter } from 'expo-router';
import { Ionicons } from '@expo/vector-icons';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import Animated, { FadeInDown, FadeOutDown } from 'react-native-reanimated';
import { useEmpreendimentosMapa } from '@/hooks/useEmpreendimentos';
import { LeafletMap, type MapPin, type LeafletMapHandle } from '@/components/LeafletMap';
import { EmptyState } from '@/components/EmptyState';
import { StatusBadge } from '@/components/StatusBadge';
import { formatCurrency, getMainImage, getEmpresaNome } from '@/utils/format';
import { select, tapLight } from '@/utils/haptics';
import { BottomTabInset, DisplayFont, Palette, Radius, Shadow, Spacing } from '@/constants/theme';
import type { Empreendimento } from '@/types';

// Filtros do mapa: status da obra (a pergunta mais frequente ao olhar um mapa
// de lançamentos) + "com unidades disponíveis". Aplicados no cliente, sobre os
// pins já carregados — o mapa não recarrega a cada toque.
type FiltroValor = string;
const FILTROS_STATUS: { value: FiltroValor; label: string; match: string[] }[] = [
  { value: 'pre-lancamento', label: 'Pré-Lanç.', match: ['pre-lancamento', 'Pré-Lançamento', 'pre lancamento'] },
  { value: 'lancamento', label: 'Lançamento', match: ['Lançamento', 'Na Planta'] },
  { value: 'construcao', label: 'Em Obras', match: ['Em Construção', 'Em construção', 'Em Obra'] },
  { value: 'pronto', label: 'Prontos', match: ['Pronto para Morar', 'Concluído', 'Pronto'] },
];

// Estratégia por plataforma:
// - iOS: react-native-maps com Apple Maps (nativo, sem chave, funciona no Expo Go)
// - Android: Leaflet + OpenStreetMap num WebView — o Google Maps exige API key
//   (o Expo Go não embute mais uma) e renderiza em branco sem ela
// - Web: fallback (react-native-maps não tem suporte web)
// eslint-disable-next-line @typescript-eslint/no-require-imports
const Maps = Platform.OS === 'ios' ? require('react-native-maps') : null;
const MapView = Maps?.default;
const Marker = Maps?.Marker;
const USE_WEB_MAP = Platform.OS === 'android';

// Centro-BH como região inicial neutra enquanto os pins carregam.
const INITIAL_REGION = {
  latitude: -19.9167,
  longitude: -43.9345,
  latitudeDelta: 0.12,
  longitudeDelta: 0.12,
};

function PriceMarker({ e, selected }: { e: Empreendimento; selected: boolean }) {
  const hasValor = e.valor != null && !isNaN(Number(e.valor)) && Number(e.valor) > 0;
  return (
    <View style={[styles.pin, selected && styles.pinSelected]}>
      {hasValor ? (
        <Text style={[styles.pinText, selected && styles.pinTextSelected]} numberOfLines={1}>
          {formatCurrency(e.valor)}
        </Text>
      ) : (
        <Ionicons
          name="home"
          size={12}
          color={selected ? Palette.primary : Palette.white}
        />
      )}
    </View>
  );
}

export default function MapaScreen() {
  const router = useRouter();
  const insets = useSafeAreaInsets();
  const mapRef = useRef<any>(null);
  const webMapRef = useRef<LeafletMapHandle>(null);
  const [selected, setSelected] = useState<Empreendimento | null>(null);
  const [statusFiltro, setStatusFiltro] = useState<FiltroValor | null>(null);
  const [soDisponiveis, setSoDisponiveis] = useState(false);
  const { data, isLoading, isError, refetch } = useEmpreendimentosMapa({
    enabled: Platform.OS !== 'web',
  });

  const todos = useMemo(() => data ?? [], [data]);

  const pins = useMemo(() => {
    const cfg = FILTROS_STATUS.find((f) => f.value === statusFiltro);
    return todos.filter((e) => {
      if (cfg && !cfg.match.includes(e.status ?? '')) return false;
      if (soDisponiveis && (e.unidades_disponiveis ?? 0) <= 0) return false;
      return true;
    });
  }, [todos, statusFiltro, soDisponiveis]);

  // Ao trocar o filtro, o pin selecionado pode ter saído do mapa.
  useEffect(() => {
    if (selected && !pins.some((p) => p.id === selected.id)) setSelected(null);
  }, [pins, selected]);

  // Cluster principal dos pins: um outlier isolado (ex.: um empreendimento em
  // outro país) não pode arrastar a câmera pro meio do oceano — o enquadramento
  // considera só os pins a até ~2° da mediana.
  const mainCluster = useMemo(() => {
    if (!pins.length) return [];
    const lats = pins.map((e) => e.latitude!).sort((a, b) => a - b);
    const lngs = pins.map((e) => e.longitude!).sort((a, b) => a - b);
    const midLat = lats[Math.floor(lats.length / 2)];
    const midLng = lngs[Math.floor(lngs.length / 2)];
    return pins.filter(
      (e) => Math.abs(e.latitude! - midLat) < 2 && Math.abs(e.longitude! - midLng) < 2
    );
  }, [pins]);

  const webBounds = useMemo<[[number, number], [number, number]] | null>(() => {
    if (!mainCluster.length) return null;
    const lats = mainCluster.map((e) => e.latitude!);
    const lngs = mainCluster.map((e) => e.longitude!);
    return [
      [Math.min(...lats), Math.min(...lngs)],
      [Math.max(...lats), Math.max(...lngs)],
    ];
  }, [mainCluster]);

  const webPins = useMemo<MapPin[]>(
    () =>
      pins.map((e) => {
        const hasValor = e.valor != null && !isNaN(Number(e.valor)) && Number(e.valor) > 0;
        return {
          id: e.id,
          lat: e.latitude!,
          lng: e.longitude!,
          label: hasValor ? formatCurrency(e.valor) : null,
        };
      }),
    [pins]
  );

  // Enquadra o cluster principal no mapa nativo (iOS) assim que os pins chegam.
  useEffect(() => {
    if (!mainCluster.length || !mapRef.current) return;
    const coords = mainCluster.map((e) => ({
      latitude: e.latitude!,
      longitude: e.longitude!,
    }));
    // pequeno delay pro mapa terminar o primeiro layout
    const t = setTimeout(() => {
      mapRef.current?.fitToCoordinates(coords, {
        edgePadding: { top: 120, right: 60, bottom: 220, left: 60 },
        animated: true,
      });
    }, 350);
    return () => clearTimeout(t);
  }, [mainCluster]);

  const handleMarkerPress = useCallback((e: Empreendimento) => {
    tapLight();
    setSelected(e);
  }, []);

  const handleWebSelect = useCallback(
    (id: string | null) => {
      if (id == null) {
        setSelected(null);
        return;
      }
      const e = pins.find((p) => p.id === id);
      if (e) {
        tapLight();
        setSelected(e);
      }
    },
    [pins]
  );

  if (Platform.OS === 'web' || (!USE_WEB_MAP && !MapView)) {
    return (
      <View style={styles.center}>
        <EmptyState
          icon="map-outline"
          title="Mapa disponível no app"
          message="Abra o aplicativo no seu celular para explorar os empreendimentos no mapa."
        />
      </View>
    );
  }

  const selectedImage = selected ? getMainImage(selected) : null;
  const selectedLocal = selected
    ? [selected.bairro_comercial || selected.bairro, selected.cidade].filter(Boolean).join(', ')
    : '';
  const selectedHasValor =
    selected?.valor != null && !isNaN(Number(selected.valor)) && Number(selected.valor) > 0;

  return (
    <View style={styles.root}>
      {USE_WEB_MAP ? (
        <LeafletMap
          ref={webMapRef}
          pins={webPins}
          bounds={webBounds}
          onSelect={handleWebSelect}
        />
      ) : (
        <MapView
          ref={mapRef}
          style={StyleSheet.absoluteFill}
          initialRegion={INITIAL_REGION}
          showsCompass={false}
          showsMyLocationButton={false}
          toolbarEnabled={false}
          onPress={() => setSelected(null)}
        >
          {pins.map((e) => (
            <Marker
              key={e.id}
              coordinate={{ latitude: e.latitude!, longitude: e.longitude! }}
              onPress={() => handleMarkerPress(e)}
              tracksViewChanges={false}
              anchor={{ x: 0.5, y: 1 }}
              accessibilityLabel={`${e.nome_empreendimento}, ${e.status ?? ''}`}
            >
              <PriceMarker e={e} selected={selected?.id === e.id} />
            </Marker>
          ))}
        </MapView>
      )}

      {/* Filtros + contagem, flutuando sobre o mapa */}
      <View style={[styles.topBar, { top: insets.top + Spacing.sm }]}>
        <ScrollView
          horizontal
          showsHorizontalScrollIndicator={false}
          contentContainerStyle={styles.filtersRow}
        >
          <View style={styles.countChip} pointerEvents="none">
            <Ionicons name="location" size={13} color={Palette.primary} />
            <Text style={styles.countChipText}>
              {isLoading ? '…' : pins.length}
            </Text>
          </View>

          {FILTROS_STATUS.map((f) => {
            const active = statusFiltro === f.value;
            return (
              <TouchableOpacity
                key={f.value}
                style={[styles.filterChip, active && styles.filterChipActive]}
                onPress={() => {
                  select();
                  setStatusFiltro(active ? null : f.value);
                }}
                activeOpacity={0.85}
                accessibilityRole="button"
                accessibilityState={{ selected: active }}
                accessibilityLabel={`Filtrar por ${f.label}`}
              >
                <Text style={[styles.filterChipText, active && styles.filterChipTextActive]}>
                  {f.label}
                </Text>
              </TouchableOpacity>
            );
          })}

          <TouchableOpacity
            style={[styles.filterChip, soDisponiveis && styles.filterChipActive]}
            onPress={() => {
              select();
              setSoDisponiveis((v) => !v);
            }}
            activeOpacity={0.85}
            accessibilityRole="button"
            accessibilityState={{ selected: soDisponiveis }}
            accessibilityLabel="Mostrar só com unidades disponíveis"
          >
            <Ionicons
              name="checkmark-circle"
              size={13}
              color={soDisponiveis ? Palette.white : Palette.textTertiary}
            />
            <Text style={[styles.filterChipText, soDisponiveis && styles.filterChipTextActive]}>
              Disponíveis
            </Text>
          </TouchableOpacity>
        </ScrollView>
      </View>

      {/* Recentrar — o mapa é arrastável, precisa de volta para o conjunto */}
      {USE_WEB_MAP && pins.length > 0 && (
        <TouchableOpacity
          style={[
            styles.recenterBtn,
            { bottom: BottomTabInset + insets.bottom + (selected ? 150 : Spacing.xl) },
          ]}
          onPress={() => {
            tapLight();
            webMapRef.current?.fitAll();
          }}
          activeOpacity={0.85}
          accessibilityRole="button"
          accessibilityLabel="Enquadrar todos os empreendimentos"
        >
          <Ionicons name="scan-outline" size={19} color={Palette.primary} />
        </TouchableOpacity>
      )}

      {/* Nenhum resultado para os filtros */}
      {!isLoading && !isError && pins.length === 0 && (
        <View style={styles.noResults} pointerEvents="box-none">
          <View style={styles.noResultsCard}>
            <Ionicons name="filter-outline" size={22} color={Palette.textTertiary} />
            <Text style={styles.noResultsText}>Nenhum empreendimento com esses filtros.</Text>
            <TouchableOpacity
              onPress={() => {
                setStatusFiltro(null);
                setSoDisponiveis(false);
              }}
              accessibilityRole="button"
              accessibilityLabel="Limpar filtros do mapa"
            >
              <Text style={styles.noResultsClear}>Limpar filtros</Text>
            </TouchableOpacity>
          </View>
        </View>
      )}

      {/* Loading overlay discreto */}
      {isLoading && (
        <View style={styles.loadingOverlay} pointerEvents="none">
          <ActivityIndicator size="small" color={Palette.primary} />
        </View>
      )}

      {/* Erro */}
      {isError && !isLoading && (
        <View style={[styles.errorBar, { top: insets.top + 60 }]}>
          <Text style={styles.errorText}>Não foi possível carregar o mapa.</Text>
          <TouchableOpacity
            onPress={() => refetch()}
            accessibilityRole="button"
            accessibilityLabel="Tentar carregar o mapa novamente"
          >
            <Text style={styles.errorRetry}>Tentar novamente</Text>
          </TouchableOpacity>
        </View>
      )}

      {/* Card do empreendimento selecionado */}
      {selected && (
        <Animated.View
          entering={FadeInDown.duration(260)}
          exiting={FadeOutDown.duration(200)}
          style={[styles.cardWrap, { bottom: BottomTabInset + insets.bottom + Spacing.lg }]}
        >
          <TouchableOpacity
            style={styles.card}
            activeOpacity={0.92}
            onPress={() => router.push(`/empreendimento/${selected.id}`)}
            accessibilityRole="button"
            accessibilityLabel={`Ver detalhes de ${selected.nome_empreendimento}`}
          >
            {selectedImage ? (
              <Image
                source={selectedImage}
                style={styles.cardImage}
                contentFit="cover"
                cachePolicy="memory-disk"
                transition={150}
              />
            ) : (
              <View style={[styles.cardImage, styles.cardImagePlaceholder]}>
                <Ionicons name="home-outline" size={26} color={Palette.textDisabled} />
              </View>
            )}
            <View style={styles.cardInfo}>
              <Text style={styles.cardCompany} numberOfLines={1}>
                {getEmpresaNome(selected.empresa)}
              </Text>
              <Text style={styles.cardName} numberOfLines={1}>
                {selected.nome_empreendimento}
              </Text>
              {selectedLocal ? (
                <Text style={styles.cardLocal} numberOfLines={1}>
                  {selectedLocal}
                </Text>
              ) : null}
              <View style={styles.cardBottomRow}>
                {selectedHasValor ? (
                  <Text style={styles.cardValor} numberOfLines={1}>
                    {formatCurrency(selected.valor)}
                  </Text>
                ) : selected.status ? (
                  <StatusBadge status={selected.status} />
                ) : (
                  <View />
                )}
                <View style={styles.cardCta}>
                  <Text style={styles.cardCtaText}>Detalhes</Text>
                  <Ionicons name="chevron-forward" size={13} color={Palette.primary} />
                </View>
              </View>
            </View>
            <TouchableOpacity
              style={styles.cardClose}
              onPress={() => setSelected(null)}
              hitSlop={{ top: 8, bottom: 8, left: 8, right: 8 }}
              accessibilityRole="button"
              accessibilityLabel="Fechar prévia"
            >
              <Ionicons name="close" size={15} color={Palette.textSecondary} />
            </TouchableOpacity>
          </TouchableOpacity>
        </Animated.View>
      )}
    </View>
  );
}

const styles = StyleSheet.create({
  root: { flex: 1, backgroundColor: Palette.bg },
  center: { flex: 1, alignItems: 'center', justifyContent: 'center', backgroundColor: Palette.bg },

  // ── Pin ──
  pin: {
    backgroundColor: Palette.primary,
    borderRadius: Radius.full,
    paddingHorizontal: 10,
    paddingVertical: 5,
    borderWidth: 2,
    borderColor: Palette.white,
    ...Shadow.sm,
  },
  pinSelected: {
    backgroundColor: Palette.white,
    borderColor: Palette.primary,
    transform: [{ scale: 1.08 }],
  },
  pinText: {
    fontSize: 11,
    fontWeight: '800',
    color: Palette.white,
    letterSpacing: -0.2,
  },
  pinTextSelected: {
    color: Palette.primary,
  },

  // ── Top: filtros ──
  topBar: {
    position: 'absolute',
    left: 0,
    right: 0,
  },
  filtersRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 7,
    paddingHorizontal: Spacing.lg,
    paddingVertical: 4,
  },
  countChip: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 4,
    backgroundColor: Palette.primaryLight,
    borderRadius: Radius.full,
    paddingHorizontal: 11,
    height: 34,
    borderWidth: 1,
    borderColor: Palette.primaryMid,
    ...Shadow.sm,
  },
  countChipText: {
    fontSize: 13,
    fontWeight: '800',
    color: Palette.primaryDark,
  },
  filterChip: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 5,
    justifyContent: 'center',
    height: 34,
    paddingHorizontal: 13,
    borderRadius: Radius.full,
    backgroundColor: Palette.surface,
    borderWidth: 1,
    borderColor: Palette.border,
    ...Shadow.sm,
  },
  filterChipActive: {
    backgroundColor: Palette.primary,
    borderColor: Palette.primary,
  },
  filterChipText: {
    fontSize: 12.5,
    fontWeight: '700',
    color: Palette.textSecondary,
  },
  filterChipTextActive: { color: Palette.white },

  recenterBtn: {
    position: 'absolute',
    right: Spacing.lg,
    width: 44,
    height: 44,
    borderRadius: Radius.full,
    backgroundColor: Palette.surface,
    borderWidth: 1,
    borderColor: Palette.borderLight,
    alignItems: 'center',
    justifyContent: 'center',
    ...Shadow.md,
  },

  noResults: {
    position: 'absolute',
    top: 0,
    left: 0,
    right: 0,
    bottom: 0,
    alignItems: 'center',
    justifyContent: 'center',
    paddingHorizontal: Spacing.xxl,
  },
  noResultsCard: {
    alignItems: 'center',
    gap: 8,
    backgroundColor: Palette.surface,
    borderRadius: Radius.xl,
    borderWidth: 1,
    borderColor: Palette.borderLight,
    paddingHorizontal: Spacing.xl,
    paddingVertical: Spacing.lg,
    ...Shadow.md,
  },
  noResultsText: {
    fontSize: 13.5,
    fontWeight: '600',
    color: Palette.textSecondary,
    textAlign: 'center',
  },
  noResultsClear: {
    fontSize: 13,
    fontWeight: '800',
    color: Palette.primary,
    paddingVertical: 4,
  },

  loadingOverlay: {
    position: 'absolute',
    top: 0,
    left: 0,
    right: 0,
    bottom: 0,
    alignItems: 'center',
    justifyContent: 'center',
  },

  errorBar: {
    position: 'absolute',
    left: Spacing.lg,
    right: Spacing.lg,
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    gap: 8,
    backgroundColor: Palette.errorBg,
    borderRadius: Radius.lg,
    borderWidth: 1,
    borderColor: '#FECACA',
    paddingHorizontal: 14,
    paddingVertical: 12,
  },
  errorText: { flex: 1, fontSize: 13, color: Palette.error, fontWeight: '600' },
  errorRetry: { fontSize: 13, fontWeight: '800', color: Palette.error },

  // ── Preview card ──
  cardWrap: {
    position: 'absolute',
    left: Spacing.lg,
    right: Spacing.lg,
  },
  card: {
    flexDirection: 'row',
    gap: 12,
    backgroundColor: Palette.surface,
    borderRadius: Radius.xl,
    borderWidth: 1,
    borderColor: Palette.borderLight,
    padding: 10,
    ...Shadow.lg,
  },
  cardImage: {
    width: 88,
    height: 88,
    borderRadius: Radius.lg,
    backgroundColor: Palette.surfaceVariant,
  },
  cardImagePlaceholder: {
    alignItems: 'center',
    justifyContent: 'center',
  },
  cardInfo: { flex: 1, justifyContent: 'center', gap: 2, paddingRight: 20 },
  cardCompany: {
    fontSize: 10.5,
    fontWeight: '700',
    color: Palette.textTertiary,
    textTransform: 'uppercase',
    letterSpacing: 0.5,
  },
  cardName: {
    fontFamily: DisplayFont.serifSemiBold,
    fontSize: 16.5,
    color: Palette.text,
    letterSpacing: -0.2,
  },
  cardLocal: { fontSize: 12, color: Palette.textSecondary },
  cardBottomRow: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    marginTop: 4,
    gap: 8,
  },
  cardValor: {
    fontFamily: DisplayFont.bold,
    fontSize: 15,
    color: Palette.primary,
    letterSpacing: -0.3,
    flexShrink: 1,
  },
  cardCta: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 2,
    backgroundColor: Palette.primaryLight,
    borderRadius: Radius.full,
    paddingHorizontal: 10,
    paddingVertical: 6,
  },
  cardCtaText: { fontSize: 12, fontWeight: '800', color: Palette.primary },
  cardClose: {
    position: 'absolute',
    top: 8,
    right: 8,
    width: 26,
    height: 26,
    borderRadius: Radius.full,
    backgroundColor: Palette.surfaceVariant,
    alignItems: 'center',
    justifyContent: 'center',
  },
});
