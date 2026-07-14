import { useMemo, useState } from 'react';
import {
  ActivityIndicator,
  Modal,
  SectionList,
  StyleSheet,
  Text,
  TextInput,
  TouchableOpacity,
  View,
} from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { Palette, Radius, Spacing } from '@/constants/theme';
import type { SelectOption } from '@/types';

interface Props {
  label: string;
  placeholder?: string;
  options: SelectOption[];
  selected: SelectOption[];
  onChange: (selected: SelectOption[]) => void;
  multi?: boolean;
  loading?: boolean;
}

export function SearchableSelect({
  label,
  placeholder = 'Pesquise',
  options,
  selected,
  onChange,
  multi = true,
  loading,
}: Props) {
  const insets = useSafeAreaInsets();
  const [visible, setVisible] = useState(false);
  const [query, setQuery] = useState('');

  const selectedIds = new Set(selected.map((s) => s.id));

  const sections = useMemo(() => {
    const q = query.trim().toLowerCase();
    const filtered = q
      ? options.filter((o) => o.label.toLowerCase().includes(q))
      : options;
    const byGroup = new Map<string, SelectOption[]>();
    for (const opt of filtered) {
      const key = opt.group ?? '';
      if (!byGroup.has(key)) byGroup.set(key, []);
      byGroup.get(key)!.push(opt);
    }
    return Array.from(byGroup.entries()).map(([title, data]) => ({ title, data }));
  }, [options, query]);

  function toggle(opt: SelectOption) {
    if (!multi) {
      onChange([opt]);
      setVisible(false);
      setQuery('');
      return;
    }
    if (selectedIds.has(opt.id)) {
      onChange(selected.filter((s) => s.id !== opt.id));
    } else {
      onChange([...selected, opt]);
    }
  }

  function close() {
    setVisible(false);
    setQuery('');
  }

  const fieldText =
    selected.length === 0
      ? placeholder
      : selected.length === 1
      ? selected[0].label
      : `${selected[0].label} +${selected.length - 1}`;

  return (
    <>
      <TouchableOpacity
        style={styles.field}
        onPress={() => setVisible(true)}
        activeOpacity={0.7}
      >
        <Text style={[styles.fieldText, selected.length === 0 && styles.fieldPlaceholder]} numberOfLines={1}>
          {fieldText}
        </Text>
        <Ionicons name="chevron-down" size={16} color={Palette.textTertiary} />
      </TouchableOpacity>

      <Modal visible={visible} transparent animationType="slide" statusBarTranslucent onRequestClose={close}>
        <TouchableOpacity style={styles.backdrop} activeOpacity={1} onPress={close} />
        <View style={[styles.sheet, { paddingBottom: insets.bottom + 16 }]}>
          <View style={styles.handle} />
          <View style={styles.header}>
            <Text style={styles.title}>{label}</Text>
            <TouchableOpacity onPress={close} hitSlop={8}>
              <Ionicons name="close" size={22} color={Palette.text} />
            </TouchableOpacity>
          </View>

          <View style={styles.searchBox}>
            <Ionicons name="search-outline" size={16} color={Palette.textTertiary} />
            <TextInput
              style={styles.searchInput}
              value={query}
              onChangeText={setQuery}
              placeholder={placeholder}
              placeholderTextColor={Palette.textTertiary}
              autoFocus
            />
          </View>

          {loading ? (
            <ActivityIndicator color={Palette.primary} style={{ paddingVertical: 24 }} />
          ) : (
            <SectionList
              sections={sections}
              keyExtractor={(item) => item.id}
              style={styles.list}
              keyboardShouldPersistTaps="handled"
              renderSectionHeader={({ section: { title } }) =>
                title ? <Text style={styles.sectionHeader}>{title}</Text> : null
              }
              renderItem={({ item }) => {
                const active = selectedIds.has(item.id);
                return (
                  <TouchableOpacity style={styles.option} onPress={() => toggle(item)} activeOpacity={0.7}>
                    <Text style={[styles.optionText, active && styles.optionTextActive]}>{item.label}</Text>
                    {active && <Ionicons name="checkmark" size={18} color={Palette.primary} />}
                  </TouchableOpacity>
                );
              }}
              ListEmptyComponent={<Text style={styles.empty}>Nenhum resultado</Text>}
            />
          )}

          {multi && (
            <TouchableOpacity style={styles.doneBtn} onPress={close} activeOpacity={0.85}>
              <Text style={styles.doneBtnText}>
                Concluído{selected.length > 0 ? ` (${selected.length})` : ''}
              </Text>
            </TouchableOpacity>
          )}
        </View>
      </Modal>
    </>
  );
}

const styles = StyleSheet.create({
  field: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    borderWidth: 1.5,
    borderColor: Palette.border,
    borderRadius: Radius.md,
    paddingHorizontal: Spacing.md,
    paddingVertical: 12,
  },
  fieldText: {
    flex: 1,
    fontSize: 14,
    fontWeight: '600',
    color: Palette.text,
  },
  fieldPlaceholder: {
    fontWeight: '400',
    color: Palette.textTertiary,
  },
  backdrop: {
    flex: 1,
    backgroundColor: 'rgba(0,0,0,0.5)',
  },
  sheet: {
    backgroundColor: Palette.surface,
    borderTopLeftRadius: 24,
    borderTopRightRadius: 24,
    maxHeight: '75%',
    paddingTop: 12,
  },
  handle: {
    width: 36,
    height: 4,
    borderRadius: 2,
    backgroundColor: Palette.border,
    alignSelf: 'center',
    marginBottom: 12,
  },
  header: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    paddingHorizontal: Spacing.xl,
    paddingBottom: 14,
  },
  title: {
    fontSize: 17,
    fontWeight: '800',
    color: Palette.text,
  },
  searchBox: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 8,
    marginHorizontal: Spacing.xl,
    backgroundColor: Palette.surfaceVariant,
    borderRadius: Radius.md,
    paddingHorizontal: Spacing.md,
    paddingVertical: 10,
    marginBottom: 8,
  },
  searchInput: {
    flex: 1,
    fontSize: 14,
    color: Palette.text,
    padding: 0,
  },
  list: {
    paddingHorizontal: Spacing.xl,
  },
  sectionHeader: {
    fontSize: 11,
    fontWeight: '700',
    color: Palette.textTertiary,
    textTransform: 'uppercase',
    letterSpacing: 0.5,
    paddingTop: 14,
    paddingBottom: 6,
    backgroundColor: Palette.surface,
  },
  option: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    paddingVertical: 12,
    borderBottomWidth: 1,
    borderBottomColor: Palette.borderLight,
  },
  optionText: {
    fontSize: 14.5,
    color: Palette.textSecondary,
    flex: 1,
  },
  optionTextActive: {
    color: Palette.primary,
    fontWeight: '700',
  },
  empty: {
    textAlign: 'center',
    color: Palette.textTertiary,
    fontSize: 13,
    paddingVertical: 24,
  },
  doneBtn: {
    marginHorizontal: Spacing.xl,
    marginTop: 10,
    padding: 14,
    borderRadius: Radius.md,
    backgroundColor: Palette.primary,
    alignItems: 'center',
  },
  doneBtnText: {
    fontSize: 15,
    fontWeight: '700',
    color: Palette.white,
  },
});
