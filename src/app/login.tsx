import { useRef, useState } from 'react';
import {
  Image,
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
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { Ionicons } from '@expo/vector-icons';
import { useAuthStore } from '@/store/auth';
import { AppInput } from '@/components/AppInput';
import { AppButton } from '@/components/AppButton';
import { Palette, Radius, Shadow, Spacing, DisplayFont } from '@/constants/theme';

export default function LoginScreen() {
  const { login } = useAuthStore();
  const router = useRouter();
  const insets = useSafeAreaInsets();
  const canGoBack = router.canGoBack();

  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [showPassword, setShowPassword] = useState(false);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');

  const passwordRef = useRef<TextInput>(null);

  async function handleLogin() {
    if (!email.trim() || !password) {
      setError('Preencha e-mail e senha.');
      return;
    }
    setError('');
    setLoading(true);
    try {
      await login(email.trim().toLowerCase(), password);
      if (router.canGoBack()) {
        router.back();
      } else {
        router.replace('/(tabs)/inicio');
      }
    } catch (e: unknown) {
      const msg =
        (e as { response?: { data?: { mensagem?: string } } })?.response?.data?.mensagem;
      setError(msg ?? 'E-mail ou senha incorretos.');
    } finally {
      setLoading(false);
    }
  }

  return (
    <KeyboardAvoidingView
      style={styles.flex}
      behavior={Platform.OS === 'ios' ? 'padding' : undefined}
    >
      <TouchableOpacity
        style={[styles.closeBtn, { top: insets.top + 8 }]}
        onPress={() => (canGoBack ? router.back() : router.replace('/(tabs)/inicio'))}
        hitSlop={10}
        accessibilityRole="button"
        accessibilityLabel="Fechar"
      >
        <Ionicons name="close" size={22} color={Palette.textSecondary} />
      </TouchableOpacity>

      <View style={[styles.heroGlow, { top: -insets.top - 40 }]} pointerEvents="none" />

      <ScrollView
        contentContainerStyle={[styles.scroll, { paddingTop: insets.top + 64 }]}
        keyboardShouldPersistTaps="handled"
        showsVerticalScrollIndicator={false}
      >
        {/* Hero / marca */}
        <View style={styles.brand}>
          <View style={styles.logoWrap}>
            <Image
              source={require('@/assets/images/blow-logo.png')}
              style={styles.logoImg}
              resizeMode="contain"
              accessibilityIgnoresInvertColors
            />
          </View>
          <Text style={styles.appName}>Blow</Text>
          <Text style={styles.brandTagline}>Lançamentos imobiliários</Text>
        </View>

        {/* Card do formulário — assinatura visual do PWA */}
        <View style={styles.card}>
          <View style={styles.formHead}>
            <Text style={styles.formTitle}>Entrar na sua conta</Text>
            <Text style={styles.formSubtitle}>
              Acesse para continuar acompanhando os lançamentos.
            </Text>
          </View>

          {error ? (
            <View style={styles.errorBox}>
              <Ionicons name="alert-circle" size={16} color={Palette.error} />
              <Text style={styles.errorText}>{error}</Text>
            </View>
          ) : null}

          <View style={styles.form}>
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
              onSubmitEditing={() => passwordRef.current?.focus()}
            />

            <AppInput
              ref={passwordRef}
              label="Senha"
              icon="lock-closed-outline"
              iconRight={showPassword ? 'eye-off-outline' : 'eye-outline'}
              onIconRightPress={() => setShowPassword((v) => !v)}
              value={password}
              onChangeText={setPassword}
              placeholder="••••••••"
              secureTextEntry={!showPassword}
              returnKeyType="done"
              onSubmitEditing={handleLogin}
            />

            <TouchableOpacity
              style={styles.forgotBtn}
              onPress={() => router.push('/esqueci-senha')}
              hitSlop={6}
              accessibilityRole="button"
              accessibilityLabel="Esqueci minha senha"
            >
              <Text style={styles.forgotText}>Esqueci minha senha</Text>
            </TouchableOpacity>
          </View>

          <View style={styles.divider} />

          <AppButton
            label="Entrar"
            onPress={handleLogin}
            loading={loading}
            size="lg"
            fullWidth
          />
        </View>

        <View style={styles.signupRow}>
          <Text style={styles.signupText}>Não tem conta?</Text>
          <TouchableOpacity
            onPress={() => router.push('/cadastro')}
            hitSlop={6}
            accessibilityRole="link"
            accessibilityLabel="Cadastre-se"
          >
            <Text style={styles.signupLink}>Cadastre-se</Text>
          </TouchableOpacity>
        </View>
      </ScrollView>
    </KeyboardAvoidingView>
  );
}

const styles = StyleSheet.create({
  flex: { flex: 1, backgroundColor: Palette.bg, overflow: 'hidden' },
  heroGlow: {
    position: 'absolute',
    alignSelf: 'center',
    width: 460,
    height: 460,
    borderRadius: Radius.full,
    backgroundColor: Palette.primaryLight,
    opacity: 0.55,
  },
  scroll: {
    flexGrow: 1,
    justifyContent: 'center',
    paddingHorizontal: Spacing.xl,
    paddingBottom: Spacing.xxl,
  },
  closeBtn: {
    position: 'absolute',
    left: Spacing.lg,
    zIndex: 10,
    width: 40,
    height: 40,
    borderRadius: Radius.full,
    backgroundColor: Palette.surface,
    borderWidth: 1,
    borderColor: Palette.borderLight,
    alignItems: 'center',
    justifyContent: 'center',
    ...Shadow.xs,
  },

  brand: {
    alignItems: 'center',
    gap: 4,
    marginBottom: Spacing.xl,
  },
  logoWrap: {
    width: 96,
    height: 96,
    borderRadius: Radius.xxl,
    backgroundColor: Palette.surface,
    borderWidth: 1,
    borderColor: Palette.primaryMid,
    alignItems: 'center',
    justifyContent: 'center',
    marginBottom: Spacing.md,
    ...Shadow.lg,
  },
  logoImg: {
    width: 54,
    height: 54,
  },
  appName: {
    fontFamily: DisplayFont.extraBold,
    fontSize: 30,
    color: Palette.text,
    letterSpacing: -0.5,
  },
  brandTagline: {
    fontSize: 13,
    fontWeight: '600',
    color: Palette.textTertiary,
    letterSpacing: 0.2,
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
  form: {
    gap: Spacing.lg,
  },
  formHead: {
    gap: 5,
  },
  formTitle: {
    fontFamily: DisplayFont.bold,
    fontSize: 21,
    color: Palette.text,
    letterSpacing: -0.3,
  },
  formSubtitle: {
    fontSize: 14,
    color: Palette.textSecondary,
    lineHeight: 20,
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
  divider: {
    height: 1,
    backgroundColor: Palette.borderLight,
    marginTop: -2,
  },
  forgotBtn: {
    alignSelf: 'flex-end',
    marginTop: -8,
  },
  forgotText: {
    fontSize: 13,
    fontWeight: '700',
    color: Palette.primary,
  },
  signupRow: {
    flexDirection: 'row',
    justifyContent: 'center',
    gap: 5,
    marginTop: Spacing.xl,
  },
  signupText: {
    fontSize: 13.5,
    color: Palette.textSecondary,
    fontWeight: '500',
  },
  signupLink: {
    fontSize: 13.5,
    fontWeight: '700',
    color: Palette.primary,
  },
});
