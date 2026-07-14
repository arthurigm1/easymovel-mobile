import { StyleSheet, Text, View } from 'react-native';
import { Link, Stack } from 'expo-router';
import { Ionicons } from '@expo/vector-icons';
import { Palette, Radius, Spacing } from '@/constants/theme';

export default function NotFoundScreen() {
  return (
    <>
      <Stack.Screen options={{ title: 'Página não encontrada' }} />
      <View style={styles.container}>
        <Ionicons name="compass-outline" size={48} color={Palette.textDisabled} />
        <Text style={styles.title}>Página não encontrada</Text>
        <Text style={styles.message}>Essa tela não existe ou foi movida.</Text>
        <Link href="/(tabs)/inicio" style={styles.link}>
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
    gap: Spacing.sm,
    padding: Spacing.xxl,
    backgroundColor: Palette.bg,
  },
  title: {
    fontSize: 18,
    fontWeight: '800',
    color: Palette.text,
  },
  message: {
    fontSize: 14,
    color: Palette.textTertiary,
    textAlign: 'center',
  },
  link: {
    marginTop: Spacing.md,
    paddingHorizontal: Spacing.xl,
    paddingVertical: Spacing.md,
    borderRadius: Radius.md,
    backgroundColor: Palette.primary,
  },
  linkText: {
    color: Palette.white,
    fontWeight: '700',
    fontSize: 14,
  },
});
