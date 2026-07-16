import { api } from './api';

export async function enviarCodigoEmail(email: string) {
  const response = await api.post('/reenviar-codigo-email', {
    email,
    conta_cadastrada: false,
  });
  return response.data;
}

export async function validarCodigoEmail(email: string, codigo: string) {
  const response = await api.post('/validar-codigo-email', { email, codigo });
  return response.data;
}
