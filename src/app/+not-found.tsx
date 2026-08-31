import { StyleSheet, Text, View } from 'react-native';
import { Link, Stack } from 'expo-router';
import { Ionicons } from '@expo/vector-icons';
import { Palette, Radius, Shadow, Spacing, DisplayFont } from '@/constants/theme';

export default function NotFoundScreen() {
  return (
    <>
      <Stack.Screen options={{ title: 'Página não encontrada' }} />
      <View style={styles.container}>
        <View style={styles.iconWrap}>
          <Ionicons name="compass-outline" size={40} color={Palette.primary} />
        </View>
        <Text style={styles.title}>Página não encontrada</Text>
        <Text style={styles.message}>
          Essa tela não existe ou foi movida. Vamos te levar de volta ao início.
        </Text>
        <Link
          href="/(tabs)/inicio"
          style={styles.link}
          accessibilityRole="button"
          accessibilityLabel="Voltar para o início"
        >
          <Text style={styles.linkText}>Voltar para o início</Text>
        </Link>
      </View>
    </>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    alignItems: 'center',
    justifyContent: 'center',
    gap: Spacing.md,
    padding: Spacing.xxxl,
    backgroundColor: Palette.bg,
  },
  iconWrap: {
    width: 84,
    height: 84,
    borderRadius: Radius.xl,
    backgroundColor: Palette.primaryLight,
    borderWidth: 1,
    borderColor: Palette.primaryMid,
    alignItems: 'center',
    justifyContent: 'center',
    marginBottom: Spacing.xs,
    ...Shadow.sm,
  },
  title: {
    fontFamily: DisplayFont.extraBold,
    fontSize: 22,
    color: Palette.text,
    letterSpacing: -0.4,
    textAlign: 'center',
  },
  message: {
    fontSize: 14,
    color: Palette.textSecondary,
    textAlign: 'center',
    lineHeight: 21,
    maxWidth: 300,
  },
  link: {
    marginTop: Spacing.sm,
    paddingHorizontal: Spacing.xxl,
    paddingVertical: Spacing.md,
    borderRadius: Radius.full,
    backgroundColor: Palette.primary,
    ...Shadow.lg,
  },
  linkText: {
    color: Palette.white,
    fontWeight: '800',
    fontSize: 15,
    letterSpacing: 0.1,
  },
});
