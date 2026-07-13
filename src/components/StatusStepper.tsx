import { StyleSheet, Text, View } from 'react-native';
import { Palette, Radius } from '@/constants/theme';

type Stage = {
  key: string[];
  label: string;
  shortLabel: string;
  color: string;
};

const STAGES: Stage[] = [
  {
    key: ['pre-lancamento', 'Pré-Lançamento', 'pre lancamento'],
    label: 'Pré-Lançamento',
    shortLabel: 'Pré',
    color: Palette.statusPreLancamento,
  },
  {
    key: ['Lançamento', 'Na Planta'],
    label: 'Lançamento',
    shortLabel: 'Lanç.',
    color: Palette.statusLancamento,
  },
  {
    key: ['Em Construção', 'Em construção', 'Em Obra'],
    label: 'Em Construção',
    shortLabel: 'Obras',
    color: Palette.statusEmConstrucao,
  },
  {
    key: ['Pronto para Morar', 'Concluído', 'Pronto'],
    label: 'Pronto',
    shortLabel: 'Pronto',
    color: Palette.statusPronto,
  },
];

function getActiveIndex(status?: string): number {
  if (!status) return -1;
  return STAGES.findIndex((s) => s.key.includes(status));
}

interface Props {
  status?: string;
}

export function StatusStepper({ status }: Props) {
  const activeIdx = getActiveIndex(status);

  if (activeIdx === -1) return null;

  const activeStage = STAGES[activeIdx];

  return (
    <View style={styles.wrapper}>
      <View style={styles.stagesRow}>
        {STAGES.map((stage, idx) => {
          const isDone = idx < activeIdx;
          const isActive = idx === activeIdx;
          const lineColor = idx < activeIdx ? activeStage.color : Palette.border;

          return (
            <View key={idx} style={styles.stageWrap}>
              {/* Line before */}
              {idx > 0 && (
                <View
                  style={[
                    styles.line,
                    { backgroundColor: lineColor },
                  ]}
                />
              )}

              {/* Dot */}
              <View style={styles.dotCol}>
                <View
                  style={[
                    styles.dot,
                    isActive && { backgroundColor: activeStage.color, width: 16, height: 16 },
                    isDone && { backgroundColor: activeStage.color },
                    !isActive && !isDone && { backgroundColor: Palette.border },
                    isActive && styles.dotActive,
                  ]}
                >
                  {isActive && <View style={styles.dotInner} />}
                </View>
                <Text
                  style={[
                    styles.label,
                    isActive && { color: activeStage.color, fontWeight: '700' },
                    isDone && { color: activeStage.color },
                    !isActive && !isDone && { color: Palette.textDisabled },
                  ]}
                >
                  {stage.shortLabel}
                </Text>
              </View>
            </View>
          );
        })}
      </View>

      {/* Current stage badge */}
      <View style={[styles.badge, { backgroundColor: activeStage.color + '18', borderColor: activeStage.color + '40' }]}>
        <View style={[styles.badgeDot, { backgroundColor: activeStage.color }]} />
        <Text style={[styles.badgeText, { color: activeStage.color }]}>
          {activeStage.label}
        </Text>
      </View>
    </View>
  );
}

const styles = StyleSheet.create({
  wrapper: {
    gap: 12,
  },
  stagesRow: {
    flexDirection: 'row',
    alignItems: 'center',
  },
  stageWrap: {
    flex: 1,
    flexDirection: 'row',
    alignItems: 'center',
  },
  line: {
    flex: 1,
    height: 2,
    borderRadius: 1,
  },
  dotCol: {
    alignItems: 'center',
    gap: 5,
  },
  dot: {
    width: 12,
    height: 12,
    borderRadius: Radius.full,
    alignItems: 'center',
    justifyContent: 'center',
  },
  dotActive: {
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.2,
    shadowRadius: 4,
    elevation: 3,
  },
  dotInner: {
    width: 6,
    height: 6,
    borderRadius: Radius.full,
    backgroundColor: '#fff',
  },
  label: {
    fontSize: 9,
    fontWeight: '600',
    textAlign: 'center',
    width: 40,
  },
  badge: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 6,
    alignSelf: 'flex-start',
    paddingHorizontal: 12,
    paddingVertical: 6,
    borderRadius: Radius.full,
    borderWidth: 1,
  },
  badgeDot: {
    width: 7,
    height: 7,
    borderRadius: Radius.full,
  },
  badgeText: {
    fontSize: 12,
    fontWeight: '700',
  },
});
