import { StyleSheet, Text, View } from 'react-native';

const CONFIG: Record<string, { bg: string; text: string; label: string }> = {
  'Pré-Lançamento': { bg: '#F3E8FF', text: '#7C3AED', label: 'Pré-Lançamento' },
  'Lançamento': { bg: '#DBEAFE', text: '#1D4ED8', label: 'Lançamento' },
  'Em Construção': { bg: '#FEF3C7', text: '#B45309', label: 'Em Construção' },
  'Pronto para Morar': { bg: '#D1FAE5', text: '#065F46', label: 'Pronto' },
};

const FALLBACK = { bg: '#F1F5F9', text: '#475569' };

interface Props {
  status?: string;
  small?: boolean;
}

export function StatusBadge({ status, small }: Props) {
  const cfgFromMap = status ? CONFIG[status as keyof typeof CONFIG] : undefined;
  const cfg = cfgFromMap ?? { ...FALLBACK, label: status ?? '' };

  return (
    <View style={[styles.badge, { backgroundColor: cfg.bg }, small && styles.small]}>
      <Text style={[styles.text, { color: cfg.text }, small && styles.smallText]}>
        {cfg.label}
      </Text>
    </View>
  );
}

const styles = StyleSheet.create({
  badge: {
    borderRadius: 6,
    paddingHorizontal: 8,
    paddingVertical: 4,
    alignSelf: 'flex-start',
  },
  text: {
    fontSize: 12,
    fontWeight: '600',
    letterSpacing: 0.2,
  },
  small: {
    paddingHorizontal: 6,
    paddingVertical: 2,
  },
  smallText: {
    fontSize: 10,
  },
});
