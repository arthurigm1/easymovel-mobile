import { StyleSheet, Text, View } from 'react-native';
import { Palette, Radius } from '@/constants/theme';

interface StatusConfig {
  bg: string;
  text: string;
  label: string;
}

const STATUS_MAP: Record<string, StatusConfig> = {
  'pre-lancamento': { bg: Palette.statusPreLancamentoBg, text: Palette.statusPreLancamento, label: 'Pré-Lançamento' },
  'Pré-Lançamento': { bg: Palette.statusPreLancamentoBg, text: Palette.statusPreLancamento, label: 'Pré-Lançamento' },
  'pre lancamento': { bg: Palette.statusPreLancamentoBg, text: Palette.statusPreLancamento, label: 'Pré-Lançamento' },
  'Lançamento':     { bg: Palette.statusLancamentoBg, text: Palette.statusLancamento, label: 'Lançamento' },
  'Na Planta':      { bg: Palette.statusLancamentoBg, text: Palette.statusLancamento, label: 'Lançamento' },
  'Em Construção':  { bg: Palette.statusEmConstrucaoBg, text: Palette.statusEmConstrucao, label: 'Em Construção' },
  'Em construção':  { bg: Palette.statusEmConstrucaoBg, text: Palette.statusEmConstrucao, label: 'Em Construção' },
  'Em Obra':        { bg: Palette.statusEmConstrucaoBg, text: Palette.statusEmConstrucao, label: 'Em Construção' },
  'Pronto para Morar': { bg: Palette.statusProntoBg, text: Palette.statusPronto, label: 'Pronto' },
  'Concluído':      { bg: Palette.statusProntoBg, text: Palette.statusPronto, label: 'Pronto' },
  'Pronto':         { bg: Palette.statusProntoBg, text: Palette.statusPronto, label: 'Pronto' },
};

interface Props {
  status?: string;
  compact?: boolean;
  inverted?: boolean;
}

export function StatusBadge({ status, compact, inverted }: Props) {
  const cfg: StatusConfig = (status ? STATUS_MAP[status] : undefined) ?? {
    bg: Palette.surfaceVariant,
    text: Palette.textSecondary,
    label: status ?? '',
  };

  if (inverted) {
    return (
      <View style={[styles.badge, compact && styles.compact, { backgroundColor: cfg.text }]}>
        <Text style={[styles.text, compact && styles.compactText, { color: '#fff' }]}>
          {cfg.label}
        </Text>
      </View>
    );
  }

  return (
    <View style={[styles.badge, compact && styles.compact, { backgroundColor: cfg.bg }]}>
      <Text style={[styles.text, compact && styles.compactText, { color: cfg.text }]}>
        {cfg.label}
      </Text>
    </View>
  );
}

const styles = StyleSheet.create({
  badge: {
    borderRadius: Radius.full,
    paddingHorizontal: 10,
    paddingVertical: 4,
    alignSelf: 'flex-start',
  },
  text: {
    fontSize: 11,
    fontWeight: '700',
    letterSpacing: 0.2,
  },
  compact: {
    paddingHorizontal: 8,
    paddingVertical: 3,
  },
  compactText: {
    fontSize: 10,
  },
});
