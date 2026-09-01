import { useState } from 'react';
import {
  KeyboardAvoidingView,
  Platform,
  ScrollView,
  StyleSheet,
  Text,
  TextInput,
  TouchableOpacity,
  View,
} from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { useRouter } from 'expo-router';
import { Ionicons } from '@expo/vector-icons';
import { FinanciamentoSimulator } from '@/components/FinanciamentoSimulator';
import { EmptyState } from '@/components/EmptyState';
import { useAuthStore } from '@/store/auth';
import { podeSimularFinanciamento } from '@/utils/permissions';
import { Palette, Radius, Shadow, Spacing, DisplayFont } from '@/constants/theme';

// Simulador de financiamento — ferramenta de venda (imobiliária / corretor).
// No PWA é o item "Simular Financiamento" do menu, escondido da construtora.

function parseValor(raw: string): number | undefined {
  const t = raw.trim();
  if (!t) return undefined;
  const n = Number(t.replace(/\./g, '').replace(',', '.'));
  return Number.isNaN(n) || n <= 0 ? undefined : n;
}

export default function SimuladorScreen() {
  const router = useRouter();
  const user = useAuthStore((s) => s.user);
  const permitido = podeSimularFinanciamento(user);
  const [valorText, setValorText] = useState('');
  const valor = parseValor(valorText);

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
        <View style={styles.headerTexts}>
          <Text style={styles.title}>Simular financiamento</Text>
          <Text style={styles.subtitle}>Estimativa de parcela para seu cliente</Text>
        </View>
      </View>

      {!permitido ? (
        <View style={styles.center}>
          <EmptyState
            icon="lock-closed-outline"
            title="Indisponível"
            message="A simulação de financiamento é uma ferramenta de venda, disponível para imobiliárias e corretores."
          />
        </View>
      ) : (
        <KeyboardAvoidingView
          style={styles.flex}
          behavior={Platform.OS === 'ios' ? 'padding' : undefined}
        >
          <ScrollView
            contentContainerStyle={styles.content}
            keyboardShouldPersistTaps="handled"
            showsVerticalScrollIndicator={false}
          >
            <View style={styles.field}>
              <Text style={styles.fieldLabel}>Valor do imóvel (R$)</Text>
              <TextInput
                style={styles.input}
                value={valorText}
                onChangeText={setValorText}
                placeholder="Ex.: 450.000,00"
                placeholderTextColor={Palette.textTertiary}
                keyboardType="decimal-pad"
                returnKeyType="done"
                accessibilityLabel="Valor do imóvel em reais"
              />
            </View>

            {valor != null ? (
              <FinanciamentoSimulator valor={valor} />
            ) : (
              <View style={styles.placeholder}>
                <Ionicons name="calculator-outline" size={34} color={Palette.textDisabled} />
                <Text style={styles.placeholderText}>
                  Informe o valor do imóvel para ver a parcela estimada.
                </Text>
              </View>
            )}
          </ScrollView>
        </KeyboardAvoidingView>
      )}
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  safe: { flex: 1, backgroundColor: Palette.bg },
  flex: { flex: 1 },
  center: { flex: 1, alignItems: 'center', justifyContent: 'center' },
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
  headerTexts: { flex: 1, gap: 2 },
  title: {
    fontFamily: DisplayFont.extraBold,
    fontSize: 20,
    color: Palette.text,
    letterSpacing: -0.4,
  },
  subtitle: {
    fontSize: 12.5,
    fontWeight: '600',
    color: Palette.textTertiary,
  },
  content: {
    paddingHorizontal: Spacing.lg,
    paddingBottom: 32,
    gap: Spacing.lg,
  },
  field: { gap: 8 },
  fieldLabel: {
    fontSize: 12.5,
    fontWeight: '700',
    color: Palette.textSecondary,
    textTransform: 'uppercase',
    letterSpacing: 0.4,
  },
  input: {
    backgroundColor: Palette.surface,
    borderWidth: 1.5,
    borderColor: Palette.borderLight,
    borderRadius: Radius.lg,
    paddingHorizontal: Spacing.md,
    paddingVertical: 14,
    fontSize: 17,
    fontWeight: '700',
    color: Palette.text,
    ...Shadow.xs,
  },
  placeholder: {
    alignItems: 'center',
    gap: 10,
    paddingVertical: Spacing.xxxl,
    paddingHorizontal: Spacing.xl,
  },
  placeholderText: {
    fontSize: 13.5,
    color: Palette.textTertiary,
    textAlign: 'center',
    lineHeight: 19,
  },
});
