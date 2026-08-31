import { memo, useMemo, useRef } from 'react';
import { StyleSheet } from 'react-native';
import { WebView } from 'react-native-webview';

// Mapa Leaflet + OpenStreetMap dentro de um WebView. Usado no Android, onde o
// Google Maps do react-native-maps exige API key (que o Expo Go não embute) e
// renderiza em branco sem ela. Sem chave, sem custo — e com os mesmos pins de
// preço em pílula indigo do design nativo.

export interface MapPin {
  id: string;
  lat: number;
  lng: number;
  /** Texto da pílula (preço formatado). Sem label vira um pin circular. */
  label?: string | null;
}

interface Props {
  pins: MapPin[];
  /** [[latSul, lngOeste], [latNorte, lngLeste]] — enquadramento inicial. */
  bounds?: [[number, number], [number, number]] | null;
  onSelect: (id: string | null) => void;
}

function buildHtml(pins: MapPin[], bounds: Props['bounds']): string {
  const pinsJson = JSON.stringify(pins);
  const boundsJson = JSON.stringify(bounds ?? null);
  return `<!DOCTYPE html>
<html>
<head>
<meta charset="utf-8" />
<meta name="viewport" content="width=device-width, initial-scale=1.0, maximum-scale=1.0, user-scalable=no" />
<link rel="stylesheet" href="https://unpkg.com/leaflet@1.9.4/dist/leaflet.css" />
<script src="https://unpkg.com/leaflet@1.9.4/dist/leaflet.js"></script>
<style>
  html, body, #map { margin: 0; padding: 0; height: 100%; width: 100%; background: #F7F7FA; }
  .pin {
    display: inline-flex; align-items: center; justify-content: center;
    background: #5457F0; color: #fff;
    border: 2px solid #fff; border-radius: 999px;
    padding: 4px 9px; font: 800 11px -apple-system, Roboto, sans-serif;
    letter-spacing: -0.2px; white-space: nowrap;
    box-shadow: 0 2px 8px rgba(22,22,29,0.25);
  }
  .pin.dot { width: 14px; height: 14px; padding: 0; border-radius: 999px; }
  .pin.sel { background: #fff; color: #5457F0; border-color: #5457F0; transform: scale(1.1); }
  .leaflet-div-icon { background: transparent; border: none; }
</style>
</head>
<body>
<div id="map"></div>
<script>
  var PINS = ${pinsJson};
  var BOUNDS = ${boundsJson};
  var map = L.map('map', { zoomControl: false, attributionControl: true })
    .setView([-19.9167, -43.9345], 12);
  L.tileLayer('https://tile.openstreetmap.org/{z}/{x}/{y}.png', {
    maxZoom: 19,
    attribution: '&copy; OpenStreetMap'
  }).addTo(map);

  var selected = null;
  function send(msg) {
    if (window.ReactNativeWebView) window.ReactNativeWebView.postMessage(JSON.stringify(msg));
  }
  function clearSel() {
    if (selected) { selected.getElement().querySelector('.pin').classList.remove('sel'); selected = null; }
  }

  PINS.forEach(function (p) {
    var cls = p.label ? 'pin' : 'pin dot';
    var html = '<div class="' + cls + '">' + (p.label ? p.label : '') + '</div>';
    var icon = L.divIcon({ html: html, iconSize: null, iconAnchor: p.label ? [30, 26] : [7, 14] });
    var m = L.marker([p.lat, p.lng], { icon: icon }).addTo(map);
    m.on('click', function () {
      clearSel();
      selected = m;
      m.getElement().querySelector('.pin').classList.add('sel');
      send({ type: 'pin', id: p.id });
    });
  });

  map.on('click', function () { clearSel(); send({ type: 'map' }); });

  if (BOUNDS) {
    map.fitBounds(BOUNDS, { padding: [70, 40], maxZoom: 15 });
  } else if (PINS.length) {
    map.fitBounds(PINS.map(function (p) { return [p.lat, p.lng]; }), { padding: [70, 40], maxZoom: 15 });
  }
</script>
</body>
</html>`;
}

export const LeafletMap = memo(function LeafletMap({ pins, bounds, onSelect }: Props) {
  const html = useMemo(() => buildHtml(pins, bounds), [pins, bounds]);
  // Evita re-render do WebView por identidade nova do callback.
  const onSelectRef = useRef(onSelect);
  onSelectRef.current = onSelect;

  return (
    <WebView
      originWhitelist={['*']}
      source={{ html }}
      style={styles.web}
      javaScriptEnabled
      domStorageEnabled
      setSupportMultipleWindows={false}
      androidLayerType="hardware"
      onMessage={(event) => {
        try {
          const msg = JSON.parse(event.nativeEvent.data) as { type: string; id?: string };
          onSelectRef.current(msg.type === 'pin' && msg.id ? msg.id : null);
        } catch {
          // mensagem inesperada — ignora
        }
      }}
    />
  );
});

const styles = StyleSheet.create({
  web: { flex: 1, backgroundColor: 'transparent' },
});
