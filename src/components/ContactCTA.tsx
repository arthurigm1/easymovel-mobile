import { Linking, Platform, StyleSheet, Text, TouchableOpacity, View } from 'react-native';
import { useRouter } from 'expo-router';
import { Ionicons } from '@expo/vector-icons';
import { tapMedium } from '@/utils/haptics';
import { Palette, Radius, Shadow, Spacing } from '@/constants/theme';

interface Props {
  /** Telefone só com dígitos (>=10), já normalizado pelo detalhe. */
  phone?: string;
  /** Nome do responsável, opcional — exibido como legenda. */
  contactName?: string;
  /** Nome do empreendimento, usado na mensagem pré-preenchida. */
  empreendimentoName: string;
  isAuthenticated: boolean;
}

/** Prefixa 55 (Brasil) quando ainda não presente. */
function toWhatsappNumber(digits: string): string {
  const d = digits.replace(/\D/g, '');
  return d.startsWith('55') ? d : `55${d}`;
}

export function ContactCTA({ phone, contactName, empreendimentoName, isAuthenticated }: Props) {
  const router = useRouter();

  const digits = phone?.replace(/\D/g, '') ?? '';
  if (digits.length < 10) return null;

  // Não autenticado → prompt de login (mesmo padrão do restante da tela).
  if (!isAuthenticated) {
    return (
      <View style={styles.loginCard}>
        <View style={styles.loginIconWrap}>
          <Ionicons name="logo-whatsapp" size={22} color={Palette.success} />
        </View>
        <View style={styles.loginTexts}>
          <Text style={styles.loginTitle}>Fale com o corretor</Text>
          <Text style={styles.loginSub}>Entre para falar no WhatsApp sobre este empreendimento.</Text>
        </View>
        <TouchableOpacity
          style={styles.loginBtn}
          onPress={() => router.push('/login')}
          activeOpacity={0.85}
          accessibilityRole="button"
          accessibilityLabel="Entrar na sua conta para falar no WhatsApp"
        >
          <Text style={styles.loginBtnText}>Entrar</Text>
        </TouchableOpacity>
      </View>
    );
  }

  const waNumber = toWhatsappNumber(digits);
  const message =
    `Olá! Tenho interesse no empreendimento "${empreendimentoName}" que vi no app Blow. ` +
    `Poderia me passar mais informações?`;
  const waUrl = `https://wa.me/${waNumber}?text=${encodeURIComponent(message)}`;

  async function openWhatsapp() {
    tapMedium();
    try {
      await Linking.openURL(waUrl);
    } catch {
      // silencioso — WhatsApp pode não estar instalado; link web abrirá no navegador
    }
  }

  return (
    <TouchableOpacity
      style={styles.cta}
      onPress={openWhatsapp}
      activeOpacity={0.9}
      accessibilityRole="button"
      accessibilityLabel={`Falar no WhatsApp sobre ${empreendimentoName}`}
      accessibilityHint="Abre uma conversa no WhatsApp com mensagem pronta"
    >
      <View style={styles.ctaIconWrap}>
        <Ionicons name="logo-whatsapp" size={24} color={Palette.white} />
      </View>
      <View style={styles.ctaTexts}>
        <Text style={styles.ctaTitle}>Falar no WhatsApp</Text>
        <Text style={styles.ctaSub} numberOfLines={1}>
          {contactName ? `Com ${contactName} · resposta rápida` : 'Tire suas dúvidas · resposta rápida'}
        </Text>
      </View>
      <Ionicons name="chevron-forward" size={20} color={Palette.white} />
    </TouchableOpacity>
  );
}

const styles = StyleSheet.create({
  // Botão principal (autenticado)
  cta: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 12,
    backgroundColor: Palette.success,
    borderRadius: Radius.lg,
    paddingVertical: 14,
    paddingHorizontal: 16,
    minHeight: 60,
    ...Platform.select({ ios: Shadow.sm, android: Shadow.sm }),
  },
  ctaIconWrap: {
    width: 44,
    height: 44,
    borderRadius: Radius.full,
    backgroundColor: 'rgba(255,255,255,0.22)',
    alignItems: 'center',
    justifyContent: 'center',
  },
  ctaTexts: { flex: 1 },
  ctaTitle: {
    fontSize: 15.5,
    fontWeight: '800',
    color: Palette.white,
    letterSpacing: -0.2,
  },
  ctaSub: {
    fontSize: 12.5,
    color: Palette.white,
    opacity: 0.9,
    marginTop: 2,
    fontWeight: '500',
  },

  // Card de login (não autenticado)
  loginCard: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 12,
    backgroundColor: Palette.surface,
    borderRadius: Radius.lg,
    padding: 14,
    borderWidth: 1,
    borderColor: Palette.borderLight,
    minHeight: 68,
    ...Shadow.xs,
  },
  loginIconWrap: {
    width: 44,
    height: 44,
    borderRadius: Radius.full,
    backgroundColor: Palette.successBg,
    alignItems: 'center',
    justifyContent: 'center',
  },
  loginTexts: { flex: 1, gap: 2 },
  loginTitle: {
    fontSize: 14.5,
    fontWeight: '700',
    color: Palette.text,
  },
  loginSub: {
    fontSize: 12.5,
    color: Palette.textSecondary,
    lineHeight: 17,
  },
  loginBtn: {
    backgroundColor: Palette.primary,
    borderRadius: Radius.md,
    paddingHorizontal: 18,
    paddingVertical: 11,
    minHeight: 44,
    justifyContent: 'center',
    ...Shadow.sm,
  },
  loginBtnText: {
    fontSize: 13.5,
    fontWeight: '700',
    color: Palette.white,
  },
});
