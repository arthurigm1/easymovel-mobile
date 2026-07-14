import { Platform } from 'react-native';

// Altere para o endereço do backend em produção
export const API_BASE_URL = Platform.select({
  android: 'http://10.0.2.2:3001',
  default: 'http://localhost:3001',
});
