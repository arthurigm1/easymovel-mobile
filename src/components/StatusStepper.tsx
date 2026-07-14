import { StyleSheet, Text, View } from 'react-native';
import { Palette, Radius } from '@/constants/theme';
import { CONSTRUCTION_STAGES, getConstructionStageIndex } from '@/constants/status';

interface Props {
  status?: string;
}

export function StatusStepper({ status }: Props) {
  const activeIdx = getConstructionStageIndex(status);

  if (activeIdx === -1) return null;

  const STAGES = CONSTRUCTION_STAGES;
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
                    isActive && [styles.dotActive, { shadowColor: activeStage.color }],
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
      <View style={[styles.badge, { backgroundColor: activeStage.bg, borderColor: activeStage.color }]}>
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
