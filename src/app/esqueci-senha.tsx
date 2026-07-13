import { useRef, useState } from 'react';
import {
  ActivityIndicator,
  Alert,
  KeyboardAvoidingView,
  Platform,
  Pressable,
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
import { Palette, Radius, Shadow, Spacing } from '@/constants/theme';

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
  const [focused, setFocused] = useState<string | null>(null);

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

        {/* Error */}
        {error ? (
          <View style={styles.errorBox}>
            <Ionicons name="alert-circle" size={16} color={Palette.error} />
            <Text style={styles.errorText}>{error}</Text>
          </View>
        ) : null}

        {/* Fields */}
        <View style={styles.fields}>
          <Field
            label="E-mail"
            icon="mail-outline"
            value={email}
            onChangeText={setEmail}
            placeholder="seu@email.com"
            keyboardType="email-address"
            autoCapitalize="none"
            returnKeyType="next"
            focused={focused === 'email'}
            onFocus={() => setFocused('email')}
            onBlur={() => setFocused(null)}
            onSubmitEditing={() => senhaRef.current?.focus()}
          />

          <Field
            label="Nova senha"
            icon="lock-closed-outline"
            value={senha}
            onChangeText={setSenha}
            placeholder="Mínimo 6 caracteres"
            secureTextEntry={!showSenha}
            returnKeyType="next"
            focused={focused === 'senha'}
            onFocus={() => setFocused('senha')}
            onBlur={() => setFocused(null)}
            onSubmitEditing={() => confirmaRef.current?.focus()}
            inputRef={senhaRef}
            rightElement={
              <Pressable onPress={() => setShowSenha((v) => !v)} hitSlop={8}>
                <Ionicons name={showSenha ? 'eye-off-outline' : 'eye-outline'} size={18} color={Palette.textTertiary} />
              </Pressable>
            }
          />

          <Field
            label="Confirmar senha"
            icon="shield-checkmark-outline"
            value={confirma}
            onChangeText={setConfirma}
            placeholder="Repita a nova senha"
            secureTextEntry={!showConfirma}
            returnKeyType="done"
            focused={focused === 'confirma'}
            onFocus={() => setFocused('confirma')}
            onBlur={() => setFocused(null)}
            onSubmitEditing={handleSubmit}
            inputRef={confirmaRef}
            rightElement={
              <Pressable onPress={() => setShowConfirma((v) => !v)} hitSlop={8}>
                <Ionicons name={showConfirma ? 'eye-off-outline' : 'eye-outline'} size={18} color={Palette.textTertiary} />
              </Pressable>
            }
          />
        </View>

        <TouchableOpacity
          style={[styles.btn, loading && styles.btnDisabled]}
          onPress={handleSubmit}
          disabled={loading}
          activeOpacity={0.85}
        >
          {loading
            ? <ActivityIndicator color={Palette.white} />
            : <Text style={styles.btnText}>Redefinir senha</Text>
          }
        </TouchableOpacity>

        <TouchableOpacity
          style={styles.backToLogin}
          onPress={() => router.replace('/login')}
          activeOpacity={0.7}
        >
          <Ionicons name="arrow-back-outline" size={14} color={Palette.primary} />
          <Text style={styles.backToLoginText}>Voltar para o login</Text>
        </TouchableOpacity>
      </ScrollView>
    </KeyboardAvoidingView>
  );
}

function Field({
  label, icon, value, onChangeText, placeholder, keyboardType, autoCapitalize,
  returnKeyType, secureTextEntry, focused, onFocus, onBlur, onSubmitEditing,
  inputRef, rightElement,
}: {
  label: string;
  icon: React.ComponentProps<typeof Ionicons>['name'];
  value: string;
  onChangeText: (v: string) => void;
  placeholder?: string;
  keyboardType?: React.ComponentProps<typeof TextInput>['keyboardType'];
  autoCapitalize?: React.ComponentProps<typeof TextInput>['autoCapitalize'];
  returnKeyType?: React.ComponentProps<typeof TextInput>['returnKeyType'];
  secureTextEntry?: boolean;
  focused: boolean;
  onFocus: () => void;
  onBlur: () => void;
  onSubmitEditing?: () => void;
  inputRef?: React.RefObject<TextInput>;
  rightElement?: React.ReactNode;
}) {
  return (
    <View style={styles.field}>
      <Text style={styles.label}>{label}</Text>
      <View style={[styles.inputWrapper, focused && styles.inputFocused]}>
        <Ionicons name={icon} size={18} color={focused ? Palette.primary : Palette.textTertiary} />
        <TextInput
          ref={inputRef}
          style={styles.input}
          value={value}
          onChangeText={onChangeText}
          placeholder={placeholder}
          placeholderTextColor={Palette.textDisabled}
          keyboardType={keyboardType}
          autoCapitalize={autoCapitalize ?? 'none'}
          autoCorrect={false}
          returnKeyType={returnKeyType}
          secureTextEntry={secureTextEntry}
          onFocus={onFocus}
          onBlur={onBlur}
          onSubmitEditing={onSubmitEditing}
        />
        {rightElement}
      </View>
    </View>
  );
}

const styles = StyleSheet.create({
  flex: { flex: 1, backgroundColor: Palette.bg },
  scroll: {
    flexGrow: 1,
    paddingHorizontal: Spacing.xl,
    paddingBottom: 40,
    gap: 20,
  },
  topRow: { marginBottom: 4 },
  backBtn: {
    width: 38,
    height: 38,
    borderRadius: 19,
    backgroundColor: Palette.surface,
    alignItems: 'center',
    justifyContent: 'center',
    borderWidth: 1,
    borderColor: Palette.border,
    ...Shadow.xs,
  },
  headingBlock: { gap: 10 },
  iconWrap: {
    width: 56,
    height: 56,
    borderRadius: Radius.lg,
    backgroundColor: Palette.primaryLight,
    alignItems: 'center',
    justifyContent: 'center',
    borderWidth: 1,
    borderColor: Palette.primaryMid,
  },
  heading: {
    fontSize: 26,
    fontWeight: '900',
    color: Palette.text,
    letterSpacing: -0.6,
  },
  subheading: {
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
    borderWidth: 1,
    borderColor: '#FECACA',
  },
  errorText: {
    fontSize: 13,
    color: Palette.error,
    flex: 1,
    fontWeight: '500',
  },
  fields: { gap: 16 },
  field: { gap: 7 },
  label: {
    fontSize: 13,
    fontWeight: '700',
    color: Palette.textSecondary,
  },
  inputWrapper: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: Palette.surfaceVariant,
    borderWidth: 1.5,
    borderColor: Palette.border,
    borderRadius: Radius.md,
    paddingHorizontal: 14,
    paddingVertical: 13,
    gap: 10,
  },
  inputFocused: {
    borderColor: Palette.primary,
    backgroundColor: Palette.primaryLight,
  },
  input: {
    flex: 1,
    fontSize: 15,
    color: Palette.text,
    padding: 0,
  },
  btn: {
    backgroundColor: Palette.primary,
    borderRadius: Radius.lg,
    paddingVertical: 16,
    alignItems: 'center',
    ...Shadow.lg,
  },
  btnDisabled: { opacity: 0.65 },
  btnText: {
    fontSize: 16,
    fontWeight: '800',
    color: Palette.white,
    letterSpacing: 0.2,
  },
  backToLogin: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    gap: 6,
    paddingVertical: 8,
  },
  backToLoginText: {
    fontSize: 14,
    fontWeight: '600',
    color: Palette.primary,
  },
});
