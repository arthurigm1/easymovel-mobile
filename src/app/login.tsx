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
import { Palette, Radius, Spacing, DisplayFont } from '@/constants/theme';

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
      >
        <Ionicons name="close" size={22} color={Palette.textSecondary} />
      </TouchableOpacity>

      <ScrollView
        contentContainerStyle={[styles.scroll, { paddingTop: insets.top + 56 }]}
        keyboardShouldPersistTaps="handled"
        showsVerticalScrollIndicator={false}
      >
        {/* Logo */}
        <View style={styles.brand}>
          <View style={styles.logoWrap}>
            <Image
              source={require('@/assets/images/blow-logo.png')}
              style={styles.logoImg}
              resizeMode="contain"
            />
          </View>
          <Text style={styles.appName}>Blow</Text>
        </View>

        {/* Form */}
        <View style={styles.form}>
          <Text style={styles.formTitle}>Entrar na sua conta</Text>

          {error ? (
            <View style={styles.errorBox}>
              <Ionicons name="alert-circle" size={16} color={Palette.error} />
              <Text style={styles.errorText}>{error}</Text>
            </View>
          ) : null}

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
          >
            <Text style={styles.forgotText}>Esqueci minha senha</Text>
          </TouchableOpacity>

          <AppButton
            label="Entrar"
            onPress={handleLogin}
            loading={loading}
            size="lg"
            fullWidth
          />

          <View style={styles.signupRow}>
            <Text style={styles.signupText}>Não tem conta?</Text>
            <TouchableOpacity onPress={() => router.push('/cadastro')} hitSlop={6}>
              <Text style={styles.signupLink}>Cadastre-se</Text>
            </TouchableOpacity>
          </View>
        </View>
      </ScrollView>
    </KeyboardAvoidingView>
  );
}

const styles = StyleSheet.create({
  flex: { flex: 1, backgroundColor: Palette.bg },
  scroll: {
    flexGrow: 1,
    paddingHorizontal: Spacing.xl,
    paddingBottom: Spacing.xxl,
  },
  closeBtn: {
    position: 'absolute',
    left: 16,
    zIndex: 10,
    width: 36,
    height: 36,
    borderRadius: 18,
    backgroundColor: Palette.surfaceVariant,
    alignItems: 'center',
    justifyContent: 'center',
  },

  brand: {
    alignItems: 'center',
    gap: 6,
    marginBottom: Spacing.xxl,
  },
  logoWrap: {
    width: 76,
    height: 76,
    borderRadius: Radius.xxl,
    backgroundColor: Palette.primaryLight,
    alignItems: 'center',
    justifyContent: 'center',
    marginBottom: Spacing.sm,
  },
  logoImg: {
    width: 42,
    height: 42,
  },
  appName: {
    fontFamily: DisplayFont.extraBold,
    fontSize: 26,
    color: Palette.text,
    letterSpacing: -0.5,
  },

  form: {
    gap: Spacing.lg,
  },
  formTitle: {
    fontFamily: DisplayFont.bold,
    fontSize: 19,
    color: Palette.text,
    letterSpacing: -0.3,
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
    marginTop: 4,
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
