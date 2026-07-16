import { useRef, useState } from 'react';
import {
  KeyboardAvoidingView,
  Linking,
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
import { criarUsuario } from '@/services/usuarios';
import { enviarCodigoEmail, validarCodigoEmail } from '@/services/codigos';
import { REGIAO_OPTIONS } from '@/components/FilterSheet';
import { Palette, Radius, Spacing, DisplayFont } from '@/constants/theme';

type TipoUsuario = 'imobiliaria' | 'corretor_autonomo';

function onlyDigits(v: string) {
  return v.replace(/\D/g, '');
}

function maskCelular(raw: string): string {
  const d = onlyDigits(raw).slice(0, 11);
  if (d.length <= 2) return d;
  if (d.length <= 7) return `(${d.slice(0, 2)}) ${d.slice(2)}`;
  return `(${d.slice(0, 2)}) ${d.slice(2, 7)}-${d.slice(7)}`;
}

function maskCPF(raw: string): string {
  const d = onlyDigits(raw).slice(0, 11);
  if (d.length <= 3) return d;
  if (d.length <= 6) return `${d.slice(0, 3)}.${d.slice(3)}`;
  if (d.length <= 9) return `${d.slice(0, 3)}.${d.slice(3, 6)}.${d.slice(6)}`;
  return `${d.slice(0, 3)}.${d.slice(3, 6)}.${d.slice(6, 9)}-${d.slice(9)}`;
}

function maskCNPJ(raw: string): string {
  const d = onlyDigits(raw).slice(0, 14);
  if (d.length <= 2) return d;
  if (d.length <= 5) return `${d.slice(0, 2)}.${d.slice(2)}`;
  if (d.length <= 8) return `${d.slice(0, 2)}.${d.slice(2, 5)}.${d.slice(5)}`;
  if (d.length <= 12) return `${d.slice(0, 2)}.${d.slice(2, 5)}.${d.slice(5, 8)}/${d.slice(8)}`;
  return `${d.slice(0, 2)}.${d.slice(2, 5)}.${d.slice(5, 8)}/${d.slice(8, 12)}-${d.slice(12)}`;
}

const EMAIL_RE = /^[\w.-]+@[a-zA-Z\d.-]+\.[a-zA-Z]{2,}$/;

const TIPOS: { value: TipoUsuario; label: string; icon: React.ComponentProps<typeof Ionicons>['name'] }[] = [
  { value: 'corretor_autonomo', label: 'Corretor(a) autônomo(a)', icon: 'person-outline' },
  { value: 'imobiliaria', label: 'Imobiliária', icon: 'business-outline' },
];

export default function CadastroScreen() {
  const { login } = useAuthStore();
  const router = useRouter();
  const insets = useSafeAreaInsets();
  const canGoBack = router.canGoBack();

  const [tipo, setTipo] = useState<TipoUsuario>('corretor_autonomo');
  const [nome, setNome] = useState('');
  const [celular, setCelular] = useState('');
  const [email, setEmail] = useState('');
  const [senha, setSenha] = useState('');
  const [confirmarSenha, setConfirmarSenha] = useState('');
  const [showSenha, setShowSenha] = useState(false);
  const [cpf, setCpf] = useState('');
  const [cnpj, setCnpj] = useState('');
  const [creci, setCreci] = useState('');
  const [regiao, setRegiao] = useState('');
  const [policy, setPolicy] = useState(false);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');

  const [step, setStep] = useState<'form' | 'codigo'>('form');
  const [codigo, setCodigo] = useState('');
  const [resendMsg, setResendMsg] = useState('');

  const celularRef = useRef<TextInput>(null);
  const emailRef = useRef<TextInput>(null);
  const senhaRef = useRef<TextInput>(null);
  const confirmarRef = useRef<TextInput>(null);
  const docRef = useRef<TextInput>(null);
  const creciRef = useRef<TextInput>(null);

  function validar(): string | null {
    if (!nome.trim()) return 'Preencha seu nome completo.';
    if (onlyDigits(celular).length !== 11) return 'Celular inválido — inclua DDD + número.';
    if (!EMAIL_RE.test(email.trim())) return 'E-mail inválido.';
    if (senha.length < 6) return 'A senha deve ter pelo menos 6 caracteres.';
    if (senha !== confirmarSenha) return 'As senhas não são compatíveis.';
    if (tipo === 'imobiliaria' && onlyDigits(cnpj).length !== 14) return 'CNPJ inválido.';
    if (tipo === 'corretor_autonomo' && onlyDigits(cpf).length !== 11) return 'CPF inválido.';
    if (!creci.trim()) return 'Preencha o CRECI.';
    if (!policy) return 'Você precisa aceitar os Termos de Uso e a Política de Privacidade.';
    return null;
  }

  function extractError(e: unknown, fallback: string): string {
    const msg = (e as { response?: { data?: { mensagem?: string } } })?.response?.data?.mensagem;
    return msg ?? fallback;
  }

  // Etapa 1: valida os dados e dispara o código de verificação pro e-mail —
  // o backend só cria o usuário se o e-mail já tiver sido validado por código.
  async function handleContinuar() {
    const validationError = validar();
    if (validationError) {
      setError(validationError);
      return;
    }
    setError('');
    setLoading(true);
    try {
      await enviarCodigoEmail(email.trim().toLowerCase());
      setStep('codigo');
    } catch (e: unknown) {
      setError(extractError(e, 'Não foi possível enviar o código. Tente novamente.'));
    } finally {
      setLoading(false);
    }
  }

  async function handleReenviarCodigo() {
    setResendMsg('');
    setError('');
    try {
      await enviarCodigoEmail(email.trim().toLowerCase());
      setResendMsg('Código reenviado.');
    } catch (e: unknown) {
      setError(extractError(e, 'Não foi possível reenviar o código.'));
    }
  }

  // Etapa 2: confirma o código e só então cria a conta de fato.
  async function handleConfirmarCodigo() {
    if (codigo.trim().length !== 6) {
      setError('Digite o código de 6 dígitos enviado por e-mail.');
      return;
    }
    setError('');
    setLoading(true);
    try {
      await validarCodigoEmail(email.trim().toLowerCase(), codigo.trim());
      await criarUsuario({
        nome_completo: nome.trim(),
        celular: onlyDigits(celular),
        email: email.trim().toLowerCase(),
        senha,
        tipo_usuario: tipo,
        cnpj: tipo === 'imobiliaria' ? onlyDigits(cnpj) : undefined,
        cpf: tipo === 'corretor_autonomo' ? onlyDigits(cpf) : undefined,
        creci: creci.trim(),
        regiao: regiao || undefined,
      });
      await login(email.trim().toLowerCase(), senha);
      router.replace('/(tabs)/inicio');
    } catch (e: unknown) {
      setError(extractError(e, 'Não foi possível concluir o cadastro. Tente novamente.'));
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
        onPress={() =>
          step === 'codigo'
            ? setStep('form')
            : canGoBack
            ? router.back()
            : router.replace('/login')
        }
        hitSlop={10}
      >
        <Ionicons name={step === 'codigo' ? 'arrow-back' : 'close'} size={22} color={Palette.textSecondary} />
      </TouchableOpacity>

      <ScrollView
        contentContainerStyle={[styles.scroll, { paddingTop: insets.top + 56 }]}
        keyboardShouldPersistTaps="handled"
        showsVerticalScrollIndicator={false}
      >
        {step === 'form' ? (
        <>
        <View style={styles.header}>
          <Text style={styles.title}>Criar conta</Text>
          <Text style={styles.subtitle}>
            Cadastro para corretores(as) autônomos(as) e imobiliárias parceiras.
          </Text>
        </View>

        {error ? (
          <View style={styles.errorBox}>
            <Ionicons name="alert-circle" size={16} color={Palette.error} />
            <Text style={styles.errorText}>{error}</Text>
          </View>
        ) : null}

        <View style={styles.form}>
          <View style={styles.field}>
            <Text style={styles.fieldLabel}>Você trabalha em uma...</Text>
            <View style={styles.tipoRow}>
              {TIPOS.map((t) => {
                const active = tipo === t.value;
                return (
                  <TouchableOpacity
                    key={t.value}
                    style={[styles.tipoCard, active && styles.tipoCardActive]}
                    onPress={() => setTipo(t.value)}
                    activeOpacity={0.8}
                  >
                    <Ionicons name={t.icon} size={18} color={active ? Palette.primary : Palette.textTertiary} />
                    <Text style={[styles.tipoCardText, active && styles.tipoCardTextActive]}>{t.label}</Text>
                  </TouchableOpacity>
                );
              })}
            </View>
          </View>

          <AppInput
            label="Nome completo"
            icon="person-outline"
            value={nome}
            onChangeText={setNome}
            placeholder="Seu nome completo"
            returnKeyType="next"
            onSubmitEditing={() => celularRef.current?.focus()}
          />

          <AppInput
            ref={celularRef}
            label="Celular"
            icon="call-outline"
            value={celular}
            onChangeText={(v) => setCelular(maskCelular(v))}
            placeholder="(00) 00000-0000"
            keyboardType="phone-pad"
            returnKeyType="next"
            onSubmitEditing={() => emailRef.current?.focus()}
          />

          <AppInput
            ref={emailRef}
            label="E-mail"
            icon="mail-outline"
            value={email}
            onChangeText={setEmail}
            placeholder="seu@email.com"
            keyboardType="email-address"
            autoCapitalize="none"
            autoCorrect={false}
            returnKeyType="next"
            onSubmitEditing={() => senhaRef.current?.focus()}
          />

          <AppInput
            ref={senhaRef}
            label="Senha"
            icon="lock-closed-outline"
            iconRight={showSenha ? 'eye-off-outline' : 'eye-outline'}
            onIconRightPress={() => setShowSenha((v) => !v)}
            value={senha}
            onChangeText={setSenha}
            placeholder="Mínimo 6 caracteres"
            secureTextEntry={!showSenha}
            returnKeyType="next"
            onSubmitEditing={() => confirmarRef.current?.focus()}
          />

          <AppInput
            ref={confirmarRef}
            label="Confirmar senha"
            icon="lock-closed-outline"
            value={confirmarSenha}
            onChangeText={setConfirmarSenha}
            placeholder="Repita a senha"
            secureTextEntry={!showSenha}
            returnKeyType="next"
            onSubmitEditing={() => docRef.current?.focus()}
          />

          {tipo === 'imobiliaria' ? (
            <AppInput
              ref={docRef}
              label="CNPJ da imobiliária"
              icon="document-text-outline"
              value={cnpj}
              onChangeText={(v) => setCnpj(maskCNPJ(v))}
              placeholder="00.000.000/0000-00"
              keyboardType="numeric"
              returnKeyType="next"
              onSubmitEditing={() => creciRef.current?.focus()}
            />
          ) : (
            <AppInput
              ref={docRef}
              label="CPF"
              icon="document-text-outline"
              value={cpf}
              onChangeText={(v) => setCpf(maskCPF(v))}
              placeholder="000.000.000-00"
              keyboardType="numeric"
              returnKeyType="next"
              onSubmitEditing={() => creciRef.current?.focus()}
            />
          )}

          <AppInput
            ref={creciRef}
            label="CRECI"
            icon="ribbon-outline"
            value={creci}
            onChangeText={setCreci}
            placeholder="Seu número de CRECI"
            returnKeyType="done"
            onSubmitEditing={handleContinuar}
          />

          <View style={styles.field}>
            <Text style={styles.fieldLabel}>Região (opcional)</Text>
            <View style={styles.tipoRow}>
              {REGIAO_OPTIONS.map((r) => {
                const active = regiao === r.value;
                return (
                  <TouchableOpacity
                    key={r.value}
                    style={[styles.regiaoChip, active && styles.regiaoChipActive]}
                    onPress={() => setRegiao(active ? '' : r.value)}
                    activeOpacity={0.8}
                  >
                    <Text style={[styles.regiaoChipText, active && styles.regiaoChipTextActive]}>
                      {r.label}
                    </Text>
                  </TouchableOpacity>
                );
              })}
            </View>
          </View>

          <TouchableOpacity style={styles.policyRow} onPress={() => setPolicy((v) => !v)} activeOpacity={0.8}>
            <View style={[styles.checkbox, policy && styles.checkboxActive]}>
              {policy && <Ionicons name="checkmark" size={13} color={Palette.white} />}
            </View>
            <Text style={styles.policyText}>
              Li e concordo com os{' '}
              <Text style={styles.policyLink} onPress={() => Linking.openURL('https://www.blow.com.br/termos-de-uso.html')}>
                Termos de Uso
              </Text>{' '}
              e a{' '}
              <Text style={styles.policyLink} onPress={() => Linking.openURL('https://www.blow.com.br/politica-de-privacidade.html')}>
                Política de Privacidade
              </Text>
              .
            </Text>
          </TouchableOpacity>

          <AppButton
            label="Continuar"
            onPress={handleContinuar}
            loading={loading}
            size="lg"
            fullWidth
          />

          <View style={styles.signupRow}>
            <Text style={styles.signupText}>Já tem conta?</Text>
            <TouchableOpacity onPress={() => (canGoBack ? router.back() : router.replace('/login'))} hitSlop={6}>
              <Text style={styles.signupLink}>Entrar</Text>
            </TouchableOpacity>
          </View>
        </View>
        </>
        ) : (
        <>
          <View style={styles.header}>
            <Text style={styles.title}>Confirme seu e-mail</Text>
            <Text style={styles.subtitle}>
              Enviamos um código de 6 dígitos para{'\n'}
              <Text style={styles.emailHighlight}>{email.trim().toLowerCase()}</Text>
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
              label="Código de verificação"
              icon="key-outline"
              value={codigo}
              onChangeText={(v) => setCodigo(onlyDigits(v).slice(0, 6))}
              placeholder="000000"
              keyboardType="numeric"
              maxLength={6}
              returnKeyType="done"
              onSubmitEditing={handleConfirmarCodigo}
            />

            <View style={styles.resendRow}>
              <Text style={styles.signupText}>Não recebeu?</Text>
              <TouchableOpacity onPress={handleReenviarCodigo} hitSlop={6}>
                <Text style={styles.signupLink}>Reenviar código</Text>
              </TouchableOpacity>
            </View>
            {resendMsg ? <Text style={styles.resendMsg}>{resendMsg}</Text> : null}

            <AppButton
              label="Confirmar e criar conta"
              onPress={handleConfirmarCodigo}
              loading={loading}
              size="lg"
              fullWidth
            />
          </View>
        </>
        )}
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

  header: {
    marginBottom: Spacing.lg,
    gap: 4,
  },
  title: {
    fontFamily: DisplayFont.extraBold,
    fontSize: 24,
    color: Palette.text,
    letterSpacing: -0.4,
  },
  subtitle: {
    fontSize: 13.5,
    color: Palette.textSecondary,
    lineHeight: 19,
  },
  emailHighlight: {
    fontWeight: '700',
    color: Palette.text,
  },
  resendRow: {
    flexDirection: 'row',
    justifyContent: 'center',
    gap: 5,
  },
  resendMsg: {
    fontSize: 12.5,
    color: Palette.statusPronto,
    fontWeight: '600',
    textAlign: 'center',
    marginTop: -8,
  },

  errorBox: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: Palette.errorBg,
    borderRadius: Radius.md,
    padding: 12,
    gap: 8,
    marginBottom: Spacing.lg,
  },
  errorText: {
    fontSize: 13,
    color: Palette.error,
    flex: 1,
    fontWeight: '500',
  },

  form: {
    gap: Spacing.lg,
  },
  field: { gap: 8 },
  fieldLabel: {
    fontSize: 13,
    fontWeight: '700',
    color: Palette.textSecondary,
  },
  tipoRow: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    gap: 8,
  },
  tipoCard: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 7,
    paddingHorizontal: 14,
    paddingVertical: 11,
    borderRadius: Radius.md,
    borderWidth: 1.5,
    borderColor: Palette.border,
    backgroundColor: Palette.surface,
  },
  tipoCardActive: {
    borderColor: Palette.primary,
    backgroundColor: Palette.primaryLight,
  },
  tipoCardText: {
    fontSize: 13,
    fontWeight: '600',
    color: Palette.textSecondary,
  },
  tipoCardTextActive: {
    color: Palette.primary,
  },
  regiaoChip: {
    paddingHorizontal: 13,
    paddingVertical: 9,
    borderRadius: Radius.full,
    borderWidth: 1.5,
    borderColor: Palette.border,
    backgroundColor: Palette.surface,
  },
  regiaoChipActive: {
    backgroundColor: Palette.primary,
    borderColor: Palette.primary,
  },
  regiaoChipText: {
    fontSize: 12.5,
    fontWeight: '600',
    color: Palette.textSecondary,
  },
  regiaoChipTextActive: {
    color: Palette.white,
  },

  policyRow: {
    flexDirection: 'row',
    alignItems: 'flex-start',
    gap: 10,
  },
  checkbox: {
    width: 22,
    height: 22,
    borderRadius: Radius.xs,
    borderWidth: 1.5,
    borderColor: Palette.border,
    alignItems: 'center',
    justifyContent: 'center',
    marginTop: 1,
  },
  checkboxActive: {
    backgroundColor: Palette.primary,
    borderColor: Palette.primary,
  },
  policyText: {
    flex: 1,
    fontSize: 12.5,
    color: Palette.textSecondary,
    lineHeight: 18,
  },
  policyLink: {
    color: Palette.primary,
    fontWeight: '700',
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
