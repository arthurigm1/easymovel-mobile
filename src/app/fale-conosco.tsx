import {
  Linking,
  ScrollView,
  StyleSheet,
  Text,
  TouchableOpacity,
  View,
} from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { Ionicons } from '@expo/vector-icons';
import { useRouter } from 'expo-router';
import { tapLight } from '@/utils/haptics';
import { Palette, Radius, Shadow, Spacing, DisplayFont } from '@/constants/theme';

// Mesmos canais do PWA (Pages/FaleConosco): suporte, integração CRM,
// anúncios e redes sociais — cada linha abre o app certo direto.

type IconName = React.ComponentProps<typeof Ionicons>['name'];

interface Canal {
  icon: IconName;
  iconColor: string;
  iconBg: string;
  titulo: string;
  descricao: string;
  acao: string;
  url: string;
}

const WHATS = (num: string) => `https://wa.me/55${num}`;

const CANAIS: Canal[] = [
  {
    icon: 'logo-whatsapp',
    iconColor: '#189D0E',
    iconBg: 'rgba(24, 157, 14, 0.1)',
    titulo: 'Suporte',
    descricao: 'Dúvidas sobre o app e sua conta',
    acao: '(31) 2342-2272',
    url: WHATS('3123422272'),
  },
  {
    icon: 'sync-outline',
    iconColor: Palette.primary,
    iconBg: Palette.primaryLight,
    titulo: 'Integração CRM',
    descricao: 'Fale com nosso time de integrações',
    acao: '(31) 99263-1550',
    url: WHATS('31992631550'),
  },
  {
    icon: 'megaphone-outline',
    iconColor: Palette.accent,
    iconBg: Palette.accentLight,
    titulo: 'Anúncios',
    descricao: 'Anuncie seus empreendimentos na Blow',
    acao: '(31) 99808-9745',
    url: WHATS('31998089745'),
  },
];

const SOCIAIS: Canal[] = [
  {
    icon: 'logo-instagram',
    iconColor: '#E1306C',
    iconBg: 'rgba(225, 48, 108, 0.1)',
    titulo: 'Instagram',
    descricao: '@blow.app',
    acao: 'Seguir',
    url: 'https://www.instagram.com/blow.app/',
  },
  {
    icon: 'logo-linkedin',
    iconColor: '#0A66C2',
    iconBg: 'rgba(10, 102, 194, 0.1)',
    titulo: 'LinkedIn',
    descricao: 'Blow Empreendimentos',
    acao: 'Seguir',
    url: 'https://www.linkedin.com/company/blowempreendimentos',
  },
];

function CanalRow({ canal }: { canal: Canal }) {
  return (
    <TouchableOpacity
      style={styles.row}
      onPress={() => {
        tapLight();
        Linking.openURL(canal.url);
      }}
      activeOpacity={0.75}
      accessibilityRole="button"
      accessibilityLabel={`${canal.titulo}: ${canal.acao}`}
    >
      <View style={[styles.rowIcon, { backgroundColor: canal.iconBg }]}>
        <Ionicons name={canal.icon} size={20} color={canal.iconColor} />
      </View>
      <View style={styles.rowTexts}>
        <Text style={styles.rowTitle}>{canal.titulo}</Text>
        <Text style={styles.rowDesc} numberOfLines={1}>{canal.descricao}</Text>
      </View>
      <View style={styles.rowAction}>
        <Text style={styles.rowActionText}>{canal.acao}</Text>
        <Ionicons name="chevron-forward" size={14} color={Palette.textTertiary} />
      </View>
    </TouchableOpacity>
  );
}

export default function FaleConoscoScreen() {
  const router = useRouter();

  return (
    <SafeAreaView style={styles.safe} edges={['top']}>
      <View style={styles.header}>
        <TouchableOpacity
          style={styles.backBtn}
          onPress={() => router.back()}
          activeOpacity={0.8}
          hitSlop={{ top: 8, bottom: 8, left: 8, right: 8 }}
          accessibilityRole="button"
          accessibilityLabel="Voltar"
        >
          <Ionicons name="chevron-back" size={22} color={Palette.text} />
        </TouchableOpacity>
        <Text style={styles.title}>Fale Conosco</Text>
      </View>

      <ScrollView contentContainerStyle={styles.content} showsVerticalScrollIndicator={false}>
        <Text style={styles.sectionLabel}>Atendimento</Text>
        <View style={styles.card}>
          {CANAIS.map((c, i) => (
            <View key={c.titulo}>
              {i > 0 && <View style={styles.divider} />}
              <CanalRow canal={c} />
            </View>
          ))}
        </View>

        <Text style={styles.sectionLabel}>Redes sociais</Text>
        <View style={styles.card}>
          {SOCIAIS.map((c, i) => (
            <View key={c.titulo}>
              {i > 0 && <View style={styles.divider} />}
              <CanalRow canal={c} />
            </View>
          ))}
        </View>
      </ScrollView>
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  safe: { flex: 1, backgroundColor: Palette.bg },
  header: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 10,
    paddingHorizontal: Spacing.lg,
    paddingTop: Spacing.sm,
    paddingBottom: Spacing.md,
  },
  backBtn: {
    width: 40,
    height: 40,
    borderRadius: Radius.full,
    backgroundColor: Palette.surfaceVariant,
    alignItems: 'center',
    justifyContent: 'center',
  },
  title: {
    fontFamily: DisplayFont.extraBold,
    fontSize: 22,
    color: Palette.text,
    letterSpacing: -0.5,
  },
  content: {
    paddingHorizontal: Spacing.lg,
    paddingBottom: 32,
    gap: Spacing.sm,
  },
  sectionLabel: {
    fontSize: 12,
    fontWeight: '700',
    color: Palette.textTertiary,
    textTransform: 'uppercase',
    letterSpacing: 0.5,
    marginTop: Spacing.md,
    marginBottom: 2,
    paddingHorizontal: 2,
  },
  card: {
    backgroundColor: Palette.surface,
    borderRadius: Radius.lg,
    borderWidth: 1,
    borderColor: Palette.borderLight,
    ...Shadow.xs,
  },
  divider: {
    height: 1,
    backgroundColor: Palette.borderLight,
    marginLeft: 66,
  },
  row: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 12,
    paddingHorizontal: 14,
    paddingVertical: 13,
    minHeight: 64,
  },
  rowIcon: {
    width: 40,
    height: 40,
    borderRadius: Radius.md,
    alignItems: 'center',
    justifyContent: 'center',
  },
  rowTexts: { flex: 1, gap: 2 },
  rowTitle: {
    fontSize: 14.5,
    fontWeight: '700',
    color: Palette.text,
  },
  rowDesc: {
    fontSize: 12.5,
    color: Palette.textSecondary,
  },
  rowAction: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 4,
  },
  rowActionText: {
    fontSize: 12.5,
    fontWeight: '700',
    color: Palette.primary,
  },
});
