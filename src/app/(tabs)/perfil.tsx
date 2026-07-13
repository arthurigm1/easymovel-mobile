import {
  Alert,
  Linking,
  ScrollView,
  StyleSheet,
  Text,
  TouchableOpacity,
  View,
} from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { LinearGradient } from 'expo-linear-gradient';
import { Ionicons } from '@expo/vector-icons';
import Constants from 'expo-constants';
import { useAuthStore } from '@/store/auth';
import { Palette, Radius, Shadow, Spacing } from '@/constants/theme';

const APP_VERSION = Constants.expoConfig?.version ?? '1.0';

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
  const { user, logout } = useAuthStore();

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
    Linking.openURL('mailto:suporte@easymovel.com.br?subject=Suporte%20App%20Easymovel');
  }

  function handleWhatsAppSupport() {
    const msg = encodeURIComponent('Olá! Preciso de suporte com o app Easymovel.');
    Linking.openURL(`https://wa.me/5500000000000?text=${msg}`);
  }

  const initials = user?.name
    ? user.name
        .split(' ')
        .map((w: string) => w[0])
        .slice(0, 2)
        .join('')
        .toUpperCase()
    : 'U';

  const firstName = user?.name?.split(' ')[0] ?? 'Usuário';

  return (
    <SafeAreaView style={styles.safe} edges={['top']}>
      <ScrollView showsVerticalScrollIndicator={false}>
        {/* ── Hero ── */}
        <LinearGradient
          colors={[Palette.primaryDark, Palette.primary]}
          start={{ x: 0.1, y: 0 }}
          end={{ x: 0.9, y: 1 }}
          style={styles.hero}
        >
          <View style={styles.heroContent}>
            <View style={styles.avatar}>
              <Text style={styles.avatarText}>{initials}</Text>
            </View>
            <View style={styles.heroInfo}>
              <Text style={styles.heroName}>{user?.name ?? 'Usuário'}</Text>
              <Text style={styles.heroEmail}>{user?.email ?? ''}</Text>
            </View>
          </View>

          <View style={styles.heroStats}>
            <View style={styles.heroStat}>
              <Text style={styles.heroStatLabel}>Versão</Text>
              <Text style={styles.heroStatValue}>v{APP_VERSION}</Text>
            </View>
            <View style={styles.heroStatDivider} />
            <View style={styles.heroStat}>
              <Text style={styles.heroStatLabel}>Ambiente</Text>
              <Text style={styles.heroStatValue}>Mobile</Text>
            </View>
            <View style={styles.heroStatDivider} />
            <View style={styles.heroStat}>
              <Text style={styles.heroStatLabel}>Usuário</Text>
              <Text style={styles.heroStatValue}>{firstName}</Text>
            </View>
          </View>
        </LinearGradient>

        {/* ── Suporte ── */}
        <MenuSection title="Suporte">
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
        </MenuSection>

        {/* ── Legal ── */}
        <MenuSection title="Legal">
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

        {/* ── Sobre o app ── */}
        <MenuSection title="Sobre o app">
          <MenuItem
            icon="information-circle-outline"
            label="Versão do app"
            value={`v${APP_VERSION}`}
            onPress={() => {}}
          />
          <Divider />
          <MenuItem
            icon="home-outline"
            label="Easymovel"
            value="Portfólio Imobiliário"
            onPress={() => {}}
          />
        </MenuSection>

        {/* ── Conta ── */}
        <MenuSection title="Conta">
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
  },
  avatarText: {
    fontSize: 22,
    fontWeight: '900',
    color: Palette.white,
    letterSpacing: 1,
  },
  heroInfo: { flex: 1, gap: 4 },
  heroName: {
    fontSize: 20,
    fontWeight: '800',
    color: Palette.white,
    letterSpacing: -0.3,
  },
  heroEmail: {
    fontSize: 13,
    color: 'rgba(255,255,255,0.7)',
    fontWeight: '400',
  },

  heroStats: {
    flexDirection: 'row',
    backgroundColor: 'rgba(255,255,255,0.12)',
    borderRadius: Radius.lg,
    paddingVertical: 14,
    borderWidth: 1,
    borderColor: 'rgba(255,255,255,0.15)',
  },
  heroStat: {
    flex: 1,
    alignItems: 'center',
    gap: 4,
  },
  heroStatLabel: {
    fontSize: 10,
    fontWeight: '600',
    color: 'rgba(255,255,255,0.6)',
    textTransform: 'uppercase',
    letterSpacing: 0.5,
  },
  heroStatValue: {
    fontSize: 14,
    fontWeight: '800',
    color: Palette.white,
  },
  heroStatDivider: {
    width: 1,
    backgroundColor: 'rgba(255,255,255,0.2)',
    marginVertical: 4,
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
