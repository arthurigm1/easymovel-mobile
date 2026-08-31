import { StyleSheet, Text, TouchableOpacity, View } from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { Palette, Radius, Shadow } from '@/constants/theme';

interface Props {
  icon?: keyof typeof Ionicons.glyphMap;
  title?: string;
  message: string;
  action?: { label: string; onPress: () => void };
}

export function EmptyState({ icon = 'search-outline', title, message, action }: Props) {
  return (
    <View style={styles.container}>
      <View style={styles.iconHalo}>
        <View style={styles.iconWrap}>
          <Ionicons name={icon} size={34} color={Palette.primary} />
        </View>
      </View>
      {title && <Text style={styles.title}>{title}</Text>}
      <Text style={styles.message}>{message}</Text>
      {action && (
        <TouchableOpacity
          style={styles.btn}
          onPress={action.onPress}
          activeOpacity={0.85}
          accessibilityRole="button"
          accessibilityLabel={action.label}
        >
          <Text style={styles.btnText}>{action.label}</Text>
        </TouchableOpacity>
      )}
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    alignItems: 'center',
    justifyContent: 'center',
    paddingVertical: 64,
    paddingHorizontal: 32,
    gap: 14,
  },
  iconHalo: {
    width: 96,
    height: 96,
    borderRadius: Radius.xxl,
    backgroundColor: Palette.primarySubtle,
    alignItems: 'center',
    justifyContent: 'center',
    marginBottom: 4,
  },
  iconWrap: {
    width: 72,
    height: 72,
    borderRadius: Radius.xl,
    backgroundColor: Palette.surface,
    alignItems: 'center',
    justifyContent: 'center',
    borderWidth: 1.5,
    borderColor: Palette.primaryMid,
    ...Shadow.sm,
  },
  title: {
    fontSize: 18,
    fontWeight: '800',
    color: Palette.text,
    textAlign: 'center',
    letterSpacing: -0.3,
  },
  message: {
    fontSize: 14,
    color: Palette.textSecondary,
    textAlign: 'center',
    lineHeight: 21,
    fontWeight: '400',
  },
  btn: {
    marginTop: 4,
    backgroundColor: Palette.primary,
    borderRadius: Radius.md,
    paddingHorizontal: 24,
    minHeight: 48,
    justifyContent: 'center',
    ...Shadow.md,
  },
  btnText: {
    fontSize: 14,
    fontWeight: '700',
    color: Palette.white,
  },
});
