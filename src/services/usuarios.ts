import { api } from './api';

export interface AtualizarUsuarioBody {
  nome_completo?: string;
  celular?: string;
  regiao?: string;
  receber_notificacao?: boolean;
  creci?: string;
}

export async function atualizarUsuario(id: string, body: AtualizarUsuarioBody) {
  const response = await api.put(`/usuarios/${id}`, body);
  return response.data;
}

export async function alterarSenha(senha_atual: string, senha_nova: string) {
  const response = await api.post('/alterar-senha', { senha_atual, senha_nova });
  return response.data;
}

export async function substituirFotoUsuario(uri: string) {
  const formData = new FormData();
  const filename = uri.split('/').pop() ?? 'foto.jpg';
  const match = /\.(\w+)$/.exec(filename);
  const ext = match?.[1] ?? 'jpg';
  formData.append('foto_usuario', {
    uri,
    name: filename,
    type: `image/${ext === 'jpg' ? 'jpeg' : ext}`,
  } as unknown as Blob);

  const response = await api.put('/substituir-foto-usuario', formData, {
    headers: { 'Content-Type': 'multipart/form-data' },
  });
  return response.data;
}
