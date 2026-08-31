import { useRef, useState } from 'react';
import {
  Alert,
  KeyboardAvoidingView,
  Platform,
  ScrollView,
  StyleSheet,
  Text,
  TextInput,
  TouchableOpacity,
  View,
} from 'react-native';
import { useRouter } from 'expo-router';
import { Ionicons } from '@expo/vector-icons';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { esqueceuSenha } from '@/services/empreendimentos';
import { AppInput } from '@/components/AppInput';
import { AppButton } from '@/components/AppButton';
import { Palette, Radius, Shadow, Spacing, DisplayFont } from '@/constants/theme';

export default function EsqueciSenhaScreen() {
  const router = useRouter();
  const insets = useSafeAreaInsets();
  const senhaRef = useRef<TextInput>(null);
  const confirmaRef = useRef<TextInput>(null);

  const [email, setEmail] = useState('');
  const [senha, setSenha] = useState('');
  const [confirma, setConfirma] = useState('');
  const [showSenha, setShowSenha] = useState(false);
  const [showConfirma, setShowConfirma] = useState(false);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');

  async function handleSubmit() {
    setError('');
    if (!email.trim()) { setError('Informe seu e-mail.'); return; }
    if (senha.length < 6) { setError('A nova senha deve ter no mínimo 6 caracteres.'); return; }
    if (senha !== confirma) { setError('As senhas não coincidem.'); return; }

    setLoading(true);
    try {
      await esqueceuSenha(email.trim().toLowerCase(), senha);
      Alert.alert(
        'Senha alterada!',
        'Sua senha foi atualizada com sucesso. Faça login com a nova senha.',
        [{ text: 'Ir para Login', onPress: () => router.replace('/login') }]
      );
    } catch (e: unknown) {
      const msg = (e as { response?: { data?: { mensagem?: string } } })?.response?.data?.mensagem;
      setError(msg ?? 'Não foi possível redefinir a senha. Verifique seus dados.');
    } finally {
      setLoading(false);
    }
  }

  return (
    <KeyboardAvoidingView
      style={styles.flex}
      behavior={Platform.OS === 'ios' ? 'padding' : undefined}
    >
      <ScrollView
        contentContainerStyle={[styles.scroll, { paddingTop: insets.top + 16 }]}
        keyboardShouldPersistTaps="handled"
        showsVerticalScrollIndicator={false}
      >
        {/* Header */}
        <View style={styles.topRow}>
          <TouchableOpacity
            style={styles.backBtn}
            onPress={() => router.back()}
            hitSlop={12}
            accessibilityRole="button"
            accessibilityLabel="Voltar"
          >
            <Ionicons name="chevron-back" size={20} color={Palette.text} />
          </TouchableOpacity>
        </View>

        <View style={styles.headingBlock}>
          <View style={styles.iconWrap}>
            <Ionicons name="lock-open-outline" size={28} color={Palette.primary} />
          </View>
          <Text style={styles.heading}>Redefinir senha</Text>
          <Text style={styles.subheading}>
            Informe seu e-mail cadastrado e escolha uma nova senha.
          </Text>
        </View>

        {/* Card do formulário */}
        <View style={styles.card}>
          {/* Error */}
          {error ? (
            <View style={styles.errorBox}>
              <Ionicons name="alert-circle" size={16} color={Palette.error} />
              <Text style={styles.errorText}>{error}</Text>
            </View>
          ) : null}

          {/* Fields */}
          <View style={styles.fields}>
            <AppInput
              label="E-mail"
              icon="mail-outline"
              value={email}
              onChangeText={setEmail}
              placeholder="seu@email.com"
              keyboardType="email-address"
              autoCapitalize="none"
              autoCorrect={false}
              returnKeyType="next"
              accessibilityLabel="E-mail"
              onSubmitEditing={() => senhaRef.current?.focus()}
            />

            <AppInput
              ref={senhaRef}
              label="Nova senha"
              icon="lock-closed-outline"
              iconRight={showSenha ? 'eye-off-outline' : 'eye-outline'}
              onIconRightPress={() => setShowSenha((v) => !v)}
              value={senha}
              onChangeText={setSenha}
              placeholder="Mínimo 6 caracteres"
              secureTextEntry={!showSenha}
              returnKeyType="next"
              accessibilityLabel="Nova senha"
              onSubmitEditing={() => confirmaRef.current?.focus()}
            />

            <AppInput
              ref={confirmaRef}
              label="Confirmar senha"
              icon="shield-checkmark-outline"
              iconRight={showConfirma ? 'eye-off-outline' : 'eye-outline'}
              onIconRightPress={() => setShowConfirma((v) => !v)}
              value={confirma}
              onChangeText={setConfirma}
              placeholder="Repita a nova senha"
              secureTextEntry={!showConfirma}
              returnKeyType="done"
              accessibilityLabel="Confirmar senha"
              onSubmitEditing={handleSubmit}
            />
          </View>

          <View style={styles.divider} />

          <AppButton
            label="Redefinir senha"
            onPress={handleSubmit}
            loading={loading}
            size="lg"
            fullWidth
          />
        </View>

        <TouchableOpacity
          style={styles.backToLogin}
          onPress={() => router.replace('/login')}
          activeOpacity={0.7}
          accessibilityRole="link"
          accessibilityLabel="Voltar para o login"
        >
          <Ionicons name="arrow-back-outline" size={14} color={Palette.primary} />
          <Text style={styles.backToLoginText}>Voltar para o login</Text>
        </TouchableOpacity>
      </ScrollView>
    </KeyboardAvoidingView>
  );
}

const styles = StyleSheet.create({
  flex: { flex: 1, backgroundColor: Palette.bg },
  scroll: {
    flexGrow: 1,
    paddingHorizontal: Spacing.xl,
    paddingBottom: Spacing.xxxl,
    gap: Spacing.xl,
  },
  topRow: { marginBottom: Spacing.xs },
  backBtn: {
    width: 40,
    height: 40,
    borderRadius: Radius.full,
    backgroundColor: Palette.surface,
    alignItems: 'center',
    justifyContent: 'center',
    borderWidth: 1,
    borderColor: Palette.borderLight,
    ...Shadow.xs,
  },
  headingBlock: { gap: Spacing.md },
  iconWrap: {
    width: 64,
    height: 64,
    borderRadius: Radius.xl,
    backgroundColor: Palette.primaryLight,
    alignItems: 'center',
    justifyContent: 'center',
    borderWidth: 1,
    borderColor: Palette.primaryMid,
    ...Shadow.sm,
  },
  heading: {
    fontFamily: DisplayFont.extraBold,
    fontSize: 26,
    color: Palette.text,
    letterSpacing: -0.5,
  },
  subheading: {
    fontSize: 14,
    color: Palette.textSecondary,
    lineHeight: 20,
  },
  card: {
    backgroundColor: Palette.surface,
    borderRadius: Radius.xl,
    borderWidth: 1,
    borderColor: Palette.borderLight,
    padding: Spacing.xl,
    gap: Spacing.lg,
    ...Shadow.md,
  },
  divider: {
    height: 1,
    backgroundColor: Palette.borderLight,
    marginTop: -2,
  },
  errorBox: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: Palette.errorBg,
    borderRadius: Radius.md,
    padding: 12,
    gap: 8,
  },
  errorText: {
    fontSize: 13,
    color: Palette.error,
    flex: 1,
    fontWeight: '500',
  },
  fields: { gap: Spacing.lg },
  backToLogin: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    gap: 6,
    paddingVertical: Spacing.sm,
  },
  backToLoginText: {
    fontSize: 14,
    fontWeight: '700',
    color: Palette.primary,
  },
});
