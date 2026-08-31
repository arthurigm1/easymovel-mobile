import * as Crypto from 'expo-crypto';
import { api } from './api';
import { HOTSITE_BASE_URL } from '@/constants/config';
import type { ApiResponse } from '@/types';

// Mesmos contratos do PWA (src/Pages/Hotsite/services.js e
// src/Pages/compartilhamentos-corretor/service.js).

export interface Consumidor {
  id: string;
  nome: string;
}

export interface HotsiteResumo {
  id: string;
  nome_consumidor?: string;
  nome_empreendimento?: string;
  hotsite_empreendimento_acessos?: number;
  criado_em?: string;
}

export async function getConsumidores(): Promise<Consumidor[]> {
  const response = await api.get<ApiResponse<Consumidor[]>>('/consumidor');
  return response.data.dados ?? [];
}

export async function criarConsumidor(nome: string): Promise<Consumidor> {
  const response = await api.post<ApiResponse<Consumidor>>('/consumidor', { nome });
  return response.data.dados;
}

export async function criarHotsite(params: {
  empreendimento_id: string;
  consumidor_id: string;
  exibir_valores: boolean;
  exibir_apresentacao: boolean;
}): Promise<{ id: string }> {
  const response = await api.post<ApiResponse<{ id: string }>>('/hotsite', {
    id: Crypto.randomUUID(),
    ...params,
  });
  return response.data.dados;
}

export async function getMeusHotsites(): Promise<HotsiteResumo[]> {
  const response = await api.get<ApiResponse<HotsiteResumo[]>>('/hotsite-por-usuario');
  return response.data.dados ?? [];
}

export function hotsiteUrl(id: string): string {
  return `${HOTSITE_BASE_URL}/hotsite/${id}`;
}

// Link usado nas mensagens de WhatsApp (mesmo formato /share/ do PWA).
export function hotsiteShareUrl(id: string): string {
  return `${HOTSITE_BASE_URL}/share/hotsite/${id}`;
}

// Texto idêntico ao do PWA (gerarHotsite.jsx) — com bairro quando disponível.
export function hotsiteWhatsappText(params: {
  id: string;
  nomeEmpreendimento: string;
  bairro?: string | null;
}): string {
  const { id, nomeEmpreendimento, bairro } = params;
  if (bairro) {
    return (
      `Confira o empreendimento ${nomeEmpreendimento}.\n` +
      `Ótima opção para lazer e moradia no bairro ${bairro}.\n` +
      `*Acesse através do link:* ${hotsiteShareUrl(id)}`
    );
  }
  // Variante usada em "Meus Hotsites" (ModaCompartilhamentosCorretor.jsx)
  return `Confira o empreendimento ${nomeEmpreendimento}.\n*Acesse através do link:* ${hotsiteShareUrl(id)}`;
}

export function whatsappSendUrl(text: string): string {
  return `https://api.whatsapp.com/send?${new URLSearchParams({ text }).toString()}`;
}
