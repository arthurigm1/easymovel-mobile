import { Platform } from 'react-native';

// Altere para o endereço do backend em produção
export const API_BASE_URL = Platform.select({
  android: 'http://10.0.2.2:3001',
  default: 'http://localhost:3001',
});

// Base dos hotsites gerados (mesmo VITE_HOTSITE_URL do PWA).
// Em produção, trocar pelo domínio público — os links são enviados a clientes
// finais por WhatsApp, então precisam abrir fora da rede local.
export const HOTSITE_BASE_URL = 'http://localhost:3000';
