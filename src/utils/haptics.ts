import * as Haptics from 'expo-haptics';
import { Platform } from 'react-native';

// Wrapper cross-platform para feedback tátil. iOS usa o Taptic Engine; Android usa
// os efeitos de vibração do sistema. Em qualquer plataforma sem suporte (ou web) as
// chamadas viram no-op silencioso — nunca lançam para não quebrar a interação.
const supported = Platform.OS === 'ios' || Platform.OS === 'android';

function run(fn: () => Promise<void>) {
  if (!supported) return;
  fn().catch(() => {});
}

// Toque leve — seleção de chips, toggles, troca de aba.
export function tapLight() {
  run(() => Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light));
}

// Toque médio — ações primárias (aplicar filtros, botões de destaque).
export function tapMedium() {
  run(() => Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Medium));
}

// Confirmação de sucesso — favoritar, enviar interesse.
export function notifySuccess() {
  run(() => Haptics.notificationAsync(Haptics.NotificationFeedbackType.Success));
}

// Seleção discreta — navegação entre opções (sort, tabs).
export function select() {
  run(() => Haptics.selectionAsync());
}
