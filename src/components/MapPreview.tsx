import { useMemo } from 'react';
import { Platform, StyleSheet, Text, TouchableOpacity, View } from 'react-native';
import { WebView } from 'react-native-webview';
import { Ionicons } from '@expo/vector-icons';
import * as Linking from 'expo-linking';
import { Palette, Radius, Shadow } from '@/constants/theme';

interface Props {
  latitude: number;
  longitude: number;
  title: string;
  address?: string;
  height?: number;
}

// Mini-mapa embutido via embed oficial do OpenStreetMap (sem chave de API e sem
// script de terceiros injetado — apenas a URL de embed do OSM). Estático de
// propósito (pointerEvents none): arrastar/zoom ficam no app de mapas nativo
// pelo botão abaixo, evitando conflito de gesto com o scroll da tela.
function osmEmbedUrl(lat: number, lng: number): string {
  const d = 0.006; // ~600–800m de raio, nível de rua
  const bbox = [lng - d, lat - d, lng + d, lat + d].join('%2C');
  return (
    `https://www.openstreetmap.org/export/embed.html` +
    `?bbox=${bbox}&layer=mapnik&marker=${lat}%2C${lng}`
  );
}

export function MapPreview({ latitude, longitude, title, address, height = 170 }: Props) {
  const uri = useMemo(() => osmEmbedUrl(latitude, longitude), [latitude, longitude]);

  function openExternal() {
    const label = encodeURIComponent(title);
    const url = Platform.select({
      ios: `maps:0,0?q=${label}@${latitude},${longitude}`,
      android: `geo:${latitude},${longitude}?q=${latitude},${longitude}(${label})`,
      default: `https://www.google.com/maps?q=${latitude},${longitude}`,
    })!;
    Linking.openURL(url);
  }

  return (
    <View style={styles.wrap}>
      <View style={[styles.mapBox, { height }]} pointerEvents="none">
        <WebView
          originWhitelist={['https://*']}
          source={{ uri }}
          style={styles.web}
          scrollEnabled={false}
          androidLayerType="hardware"
        />
      </View>
      <TouchableOpacity
        style={styles.openBtn}
        onPress={openExternal}
        activeOpacity={0.85}
        accessibilityRole="button"
        accessibilityLabel={`Abrir rota para ${title} no aplicativo de mapas`}
      >
        <View style={styles.openIcon}>
          <Ionicons name="navigate" size={16} color={Palette.primary} />
        </View>
        <View style={styles.openInfo}>
          <Text style={styles.openTitle}>Ver rota no mapa</Text>
          {address ? (
            <Text style={styles.openAddr} numberOfLines={1}>{address}</Text>
          ) : null}
        </View>
        <Ionicons name="open-outline" size={16} color={Palette.textTertiary} />
      </TouchableOpacity>
    </View>
  );
}

const styles = StyleSheet.create({
  wrap: {
    borderRadius: Radius.lg,
    overflow: 'hidden',
    backgroundColor: Palette.surface,
    ...Shadow.sm,
  },
  mapBox: {
    width: '100%',
    backgroundColor: Palette.surfaceVariant,
  },
  web: { flex: 1, backgroundColor: 'transparent' },
  openBtn: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 12,
    paddingHorizontal: 14,
    paddingVertical: 12,
    borderTopWidth: 1,
    borderTopColor: Palette.borderLight,
  },
  openIcon: {
    width: 38,
    height: 38,
    borderRadius: Radius.md,
    backgroundColor: Palette.primaryLight,
    alignItems: 'center',
    justifyContent: 'center',
  },
  openInfo: { flex: 1, gap: 2 },
  openTitle: { fontSize: 14, fontWeight: '700', color: Palette.text },
  openAddr: { fontSize: 12, color: Palette.textTertiary },
});
