import { useState } from 'react';
import {
  ActivityIndicator,
  Alert,
  Image,
  Linking,
  ScrollView,
  StyleSheet,
  Text,
  TouchableOpacity,
  View,
} from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { LinearGradient } from 'expo-linear-gradient';
import * as ImagePicker from 'expo-image-picker';
import { Ionicons } from '@expo/vector-icons';
import { useRouter } from 'expo-router';
import Constants from 'expo-constants';
import toast from '@/utils/toast';
import { useAuthStore } from '@/store/auth';
import { AppInput } from '@/components/AppInput';
import { AppButton } from '@/components/AppButton';
import { atualizarUsuario, alterarSenha, substituirFotoUsuario } from '@/services/usuarios';
import { Palette, Radius, Shadow, Spacing, DisplayFont } from '@/constants/theme';

const APP_VERSION = Constants.expoConfig?.version ?? '1.0';

const REGIOES = [
  { value: 'belo horizonte', label: 'Belo Horizonte' },
  { value: 'salvador', label: 'Salvador' },
  { value: 'santa catarina', label: 'Santa Catarina' },
  { value: 'sao paulo', label: 'São Paulo' },
  { value: 'uberlandia', label: 'Uberlândia' },
];

function maskCelular(raw: string): string {
  const d = raw.replace(/\D/g, '').slice(0, 11);
  if (d.length <= 2) return d;
  if (d.length <= 7) return `(${d.slice(0, 2)}) ${d.slice(2)}`;
  return `(${d.slice(0, 2)}) ${d.slice(2, 7)}-${d.slice(7)}`;
}

interface MenuItemProps {
  icon: React.ComponentProps<typeof Ionicons>['name'];
  label: string;
  onPress: () => void;
  danger?: boolean;
  value?: string;
}

function MenuItem({ icon, label, onPress, danger = false, value }: MenuItemProps) {
  return (
    <TouchableOpacity style={styles.menuItem} onPress={onPress} activeOpacity={0.7}>
      <View style={[styles.menuIcon, danger && styles.menuIconDanger]}>
        <Ionicons name={icon} size={18} color={danger ? Palette.error : Palette.primary} />
      </View>
      <Text style={[styles.menuLabel, danger && styles.menuLabelDanger]}>{label}</Text>
      {value ? (
        <Text style={styles.menuValue}>{value}</Text>
      ) : !danger ? (
        <Ionicons name="chevron-forward" size={16} color={Palette.textTertiary} />
      ) : null}
    </TouchableOpacity>
  );
}

function MenuSection({ title, children }: { title: string; children: React.ReactNode }) {
  return (
    <View style={styles.section}>
      <Text style={styles.sectionLabel}>{title}</Text>
      <View style={styles.card}>{children}</View>
    </View>
  );
}

function Divider() {
  return <View style={styles.divider} />;
}

function handleComingSoon() {
  Alert.alert('Em breve', 'Esta seção estará disponível em breve.');
}

export default function PerfilScreen() {
  const { user, logout, updateUser } = useAuthStore();
  const router = useRouter();

  const [nome, setNome] = useState(user?.name ?? '');
  const [celular, setCelular] = useState(maskCelular(user?.celular ?? ''));
  const [regiao, setRegiao] = useState(user?.regiao ?? '');
  const [savingDados, setSavingDados] = useState(false);
  const [uploadingFoto, setUploadingFoto] = useState(false);

  const [senhaAtual, setSenhaAtual] = useState('');
  const [senhaNova, setSenhaNova] = useState('');
  const [confirmarSenha, setConfirmarSenha] = useState('');
  const [savingSenha, setSavingSenha] = useState(false);

  function handleLogout() {
    Alert.alert(
      'Sair da conta',
      'Deseja encerrar a sessão atual?',
      [
        { text: 'Cancelar', style: 'cancel' },
        { text: 'Sair', style: 'destructive', onPress: logout },
      ]
    );
  }

  function handleEmail() {
    Linking.openURL('mailto:suporte@blow.com.br?subject=Suporte%20App%20Blow');
  }

  function handleWhatsAppSupport() {
    const msg = encodeURIComponent('Olá! Preciso de suporte com o app Blow.');
    Linking.openURL(`https://wa.me/5500000000000?text=${msg}`);
  }

  async function handleChangePhoto() {
    const permission = await ImagePicker.requestMediaLibraryPermissionsAsync();
    if (!permission.granted) {
      Alert.alert('Permissão necessária', 'Precisamos de acesso às suas fotos para trocar a foto de perfil.');
      return;
    }
    const result = await ImagePicker.launchImageLibraryAsync({
      mediaTypes: ['images'],
      allowsEditing: true,
      aspect: [1, 1],
      quality: 0.8,
    });
    if (result.canceled || !result.assets[0]) return;

    setUploadingFoto(true);
    try {
      const data = await substituirFotoUsuario(result.assets[0].uri);
      const link = data?.dados?.[0]?.link;
      if (link) {
        await updateUser({ link_foto: link });
        toast.success('Foto de perfil atualizada.');
      }
    } catch {
      toast.error('Não foi possível atualizar a foto.');
    } finally {
      setUploadingFoto(false);
    }
  }

  async function handleSalvarDados() {
    if (!user || !nome.trim()) return;
    setSavingDados(true);
    try {
      await atualizarUsuario(user.id, {
        nome_completo: nome.trim(),
        celular: celular.replace(/\D/g, ''),
        regiao: regiao || undefined,
      });
      await updateUser({ name: nome.trim(), celular: celular.replace(/\D/g, ''), regiao });
      toast.success('Dados alterados com sucesso.');
    } catch {
      toast.error('Não foi possível salvar os dados. Tente novamente.');
    } finally {
      setSavingDados(false);
    }
  }

  async function handleRedefinirSenha() {
    if (!senhaAtual || !senhaNova) {
      toast.error('Preencha a senha atual e a nova senha.');
      return;
    }
    if (senhaNova !== confirmarSenha) {
      toast.error('As senhas não são compatíveis.');
      return;
    }
    setSavingSenha(true);
    try {
      await alterarSenha(senhaAtual, senhaNova);
      toast.success('Senha alterada com sucesso.');
      setSenhaAtual('');
      setSenhaNova('');
      setConfirmarSenha('');
    } catch (e: unknown) {
      const msg = (e as { response?: { data?: { mensagem?: string } } })?.response?.data?.mensagem;
      toast.error(msg === 'Senha incorreta.' ? 'Senha atual incorreta.' : 'Não foi possível alterar a senha.');
    } finally {
      setSavingSenha(false);
    }
  }

  const initials = user?.name
    ? user.name
        .split(' ')
        .map((w: string) => w[0])
        .slice(0, 2)
        .join('')
        .toUpperCase()
    : 'U';

  const podeRedefinirSenha = !!senhaAtual && !!senhaNova && !!confirmarSenha;

  if (!user) {
    return (
      <SafeAreaView style={styles.safe} edges={['top']}>
        <View style={styles.loggedOutWrap}>
          <Image
            source={require('@/assets/images/blow-logo.png')}
            style={styles.loggedOutLogo}
            resizeMode="contain"
          />
          <Text style={styles.loggedOutTitle}>Entre na sua conta</Text>
          <Text style={styles.loggedOutSubtitle}>
            Acesse seus dados, salve preferências e fale com a gente.
          </Text>
          <AppButton label="Entrar" onPress={() => router.push('/login')} fullWidth />
        </View>
      </SafeAreaView>
    );
  }

  return (
    <SafeAreaView style={styles.safe} edges={['top']}>
      <ScrollView showsVerticalScrollIndicator={false} keyboardShouldPersistTaps="handled">
        {/* ── Hero ── */}
        <LinearGradient
          colors={[Palette.primaryDark, Palette.primary]}
          start={{ x: 0.1, y: 0 }}
          end={{ x: 0.9, y: 1 }}
          style={styles.hero}
        >
          <View style={styles.heroContent}>
            <TouchableOpacity style={styles.avatar} onPress={handleChangePhoto} activeOpacity={0.85}>
              {user?.link_foto ? (
                <Image source={{ uri: user.link_foto }} style={styles.avatarImage} />
              ) : (
                <Text style={styles.avatarText}>{initials}</Text>
              )}
              <View style={styles.avatarEditBadge}>
                {uploadingFoto ? (
                  <ActivityIndicator size="small" color={Palette.white} />
                ) : (
                  <Ionicons name="camera" size={13} color={Palette.white} />
                )}
              </View>
            </TouchableOpacity>
            <View style={styles.heroInfo}>
              <Text style={styles.heroName}>{user?.name ?? 'Usuário'}</Text>
              <Text style={styles.heroEmail}>{user?.email ?? ''}</Text>
            </View>
          </View>
        </LinearGradient>

        {/* ── Dados pessoais ── */}
        <MenuSection title="Dados pessoais">
          <View style={styles.formCard}>
            <AppInput
              label="Nome completo"
              icon="person-outline"
              value={nome}
              onChangeText={setNome}
              placeholder="Seu nome completo"
            />
            <AppInput
              label="Celular"
              icon="call-outline"
              value={celular}
              onChangeText={(v) => setCelular(maskCelular(v))}
              placeholder="(00) 00000-0000"
              keyboardType="phone-pad"
            />
            <View style={styles.fieldGroup}>
              <Text style={styles.fieldLabel}>Região</Text>
              <View style={styles.regiaoChips}>
                {REGIOES.map((r) => {
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
            <AppButton
              label="Salvar dados"
              onPress={handleSalvarDados}
              loading={savingDados}
              disabled={!nome.trim()}
              fullWidth
            />
          </View>
        </MenuSection>

        {/* ── Redefinir senha ── */}
        <MenuSection title="Redefinir senha">
          <View style={styles.formCard}>
            <AppInput
              label="Senha atual"
              icon="lock-closed-outline"
              value={senhaAtual}
              onChangeText={setSenhaAtual}
              secureTextEntry
              placeholder="••••••••"
            />
            <AppInput
              label="Nova senha"
              icon="lock-open-outline"
              value={senhaNova}
              onChangeText={setSenhaNova}
              secureTextEntry
              placeholder="••••••••"
            />
            <AppInput
              label="Confirmar nova senha"
              icon="lock-closed-outline"
              value={confirmarSenha}
              onChangeText={setConfirmarSenha}
              secureTextEntry
              placeholder="••••••••"
              error={confirmarSenha && senhaNova !== confirmarSenha ? 'As senhas não são compatíveis' : undefined}
            />
            <AppButton
              label="Redefinir senha"
              onPress={handleRedefinirSenha}
              loading={savingSenha}
              disabled={!podeRedefinirSenha}
              variant="secondary"
              fullWidth
            />
          </View>
        </MenuSection>

        {/* ── Ajuda (Suporte + Legal) ── */}
        <MenuSection title="Ajuda">
          <MenuItem
            icon="chatbubble-ellipses-outline"
            label="Falar pelo WhatsApp"
            onPress={handleWhatsAppSupport}
          />
          <Divider />
          <MenuItem
            icon="mail-outline"
            label="Enviar e-mail"
            onPress={handleEmail}
          />
          <Divider />
          <MenuItem
            icon="star-outline"
            label="Avaliar o app"
            onPress={handleComingSoon}
          />
          <Divider />
          <MenuItem
            icon="shield-checkmark-outline"
            label="Política de Privacidade"
            onPress={handleComingSoon}
          />
          <Divider />
          <MenuItem
            icon="document-text-outline"
            label="Termos de Uso"
            onPress={handleComingSoon}
          />
        </MenuSection>

        {/* ── Sobre (app + conta) ── */}
        <MenuSection title="Sobre">
          <MenuItem
            icon="information-circle-outline"
            label="Versão do app"
            value={`v${APP_VERSION}`}
            onPress={() => {}}
          />
          <Divider />
          <MenuItem
            icon="home-outline"
            label="Blow"
            value="Portfólio Imobiliário"
            onPress={() => {}}
          />
          <Divider />
          <MenuItem
            icon="log-out-outline"
            label="Sair da conta"
            onPress={handleLogout}
            danger
          />
        </MenuSection>

        <View style={{ height: 40 }} />
      </ScrollView>
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  safe: { flex: 1, backgroundColor: Palette.bg },

  loggedOutWrap: {
    flex: 1,
    alignItems: 'center',
    justifyContent: 'center',
    paddingHorizontal: Spacing.xxl,
    gap: Spacing.sm,
  },
  loggedOutLogo: {
    width: 56,
    height: 56,
    marginBottom: Spacing.md,
  },
  loggedOutTitle: {
    fontFamily: DisplayFont.extraBold,
    fontSize: 22,
    color: Palette.text,
    letterSpacing: -0.3,
  },
  loggedOutSubtitle: {
    fontSize: 14,
    color: Palette.textSecondary,
    textAlign: 'center',
    marginBottom: Spacing.lg,
  },

  // Hero
  hero: {
    paddingHorizontal: Spacing.xl,
    paddingTop: Spacing.xl,
    paddingBottom: Spacing.xxl,
    gap: Spacing.lg,
  },
  heroContent: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 16,
  },
  avatar: {
    width: 64,
    height: 64,
    borderRadius: Radius.full,
    backgroundColor: 'rgba(255,255,255,0.2)',
    alignItems: 'center',
    justifyContent: 'center',
    borderWidth: 2,
    borderColor: 'rgba(255,255,255,0.35)',
    overflow: 'visible',
  },
  avatarImage: {
    width: '100%',
    height: '100%',
    borderRadius: Radius.full,
  },
  avatarText: {
    fontSize: 22,
    fontWeight: '900',
    color: Palette.white,
    letterSpacing: 1,
  },
  avatarEditBadge: {
    position: 'absolute',
    bottom: -2,
    right: -2,
    width: 24,
    height: 24,
    borderRadius: Radius.full,
    backgroundColor: Palette.primaryHover,
    alignItems: 'center',
    justifyContent: 'center',
    borderWidth: 2,
    borderColor: Palette.primaryDark,
  },
  heroInfo: { flex: 1, gap: 4 },
  heroName: {
    fontFamily: DisplayFont.extraBold,
    fontSize: 20,
    color: Palette.white,
    letterSpacing: -0.3,
  },
  heroEmail: {
    fontSize: 13,
    color: 'rgba(255,255,255,0.7)',
    fontWeight: '400',
  },

  // Sections
  section: {
    marginHorizontal: Spacing.lg,
    marginTop: Spacing.lg,
    gap: 8,
  },
  sectionLabel: {
    fontSize: 11,
    fontWeight: '700',
    color: Palette.textTertiary,
    textTransform: 'uppercase',
    letterSpacing: 0.8,
    paddingHorizontal: 4,
  },
  card: {
    backgroundColor: Palette.surface,
    borderRadius: Radius.lg,
    overflow: 'hidden',
    ...Shadow.sm,
    borderWidth: 1,
    borderColor: Palette.borderLight,
  },
  formCard: {
    backgroundColor: Palette.surface,
    borderRadius: Radius.lg,
    padding: Spacing.lg,
    gap: Spacing.md,
    ...Shadow.sm,
    borderWidth: 1,
    borderColor: Palette.borderLight,
  },
  fieldGroup: { gap: 8 },
  fieldLabel: {
    fontSize: 13,
    fontWeight: '700',
    color: Palette.textSecondary,
  },
  regiaoChips: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    gap: 8,
  },
  regiaoChip: {
    paddingHorizontal: 12,
    paddingVertical: 8,
    borderRadius: Radius.full,
    borderWidth: 1.5,
    borderColor: Palette.border,
    backgroundColor: Palette.surfaceVariant,
  },
  regiaoChipActive: {
    backgroundColor: Palette.primary,
    borderColor: Palette.primary,
  },
  regiaoChipText: {
    fontSize: 12,
    fontWeight: '600',
    color: Palette.textSecondary,
  },
  regiaoChipTextActive: {
    color: Palette.white,
  },

  // Menu items
  menuItem: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingHorizontal: Spacing.lg,
    paddingVertical: 15,
    gap: 12,
  },
  menuIcon: {
    width: 36,
    height: 36,
    borderRadius: Radius.md,
    backgroundColor: Palette.primaryLight,
    alignItems: 'center',
    justifyContent: 'center',
  },
  menuIconDanger: {
    backgroundColor: Palette.errorBg,
  },
  menuLabel: {
    flex: 1,
    fontSize: 15,
    fontWeight: '600',
    color: Palette.text,
  },
  menuLabelDanger: {
    color: Palette.error,
  },
  menuValue: {
    fontSize: 13,
    color: Palette.textTertiary,
    fontWeight: '500',
  },
  divider: {
    height: 1,
    backgroundColor: Palette.borderLight,
    marginHorizontal: Spacing.lg,
  },
});
