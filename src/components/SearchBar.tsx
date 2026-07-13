import { useEffect, useRef, useState } from 'react';
import { StyleSheet, TextInput, TouchableOpacity, View } from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { Palette, Radius } from '@/constants/theme';

interface Props {
  placeholder?: string;
  onChangeText: (text: string) => void;
  debounceMs?: number;
}

export function SearchBar({
  placeholder = 'Buscar...',
  onChangeText,
  debounceMs = 400,
}: Props) {
  const [value, setValue] = useState('');
  const timer = useRef<ReturnType<typeof setTimeout> | null>(null);

  useEffect(() => {
    if (timer.current) clearTimeout(timer.current);
    timer.current = setTimeout(() => onChangeText(value), debounceMs);
    return () => {
      if (timer.current) clearTimeout(timer.current);
    };
  }, [value, debounceMs, onChangeText]);

  return (
    <View style={styles.container}>
      <Ionicons name="search-outline" size={18} color={Palette.textTertiary} style={styles.icon} />
      <TextInput
        style={styles.input}
        value={value}
        onChangeText={setValue}
        placeholder={placeholder}
        placeholderTextColor={Palette.textTertiary}
        returnKeyType="search"
        clearButtonMode="while-editing"
      />
      {value.length > 0 && (
        <TouchableOpacity onPress={() => setValue('')} hitSlop={8}>
          <Ionicons name="close-circle" size={18} color={Palette.textTertiary} />
        </TouchableOpacity>
      )}
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: Palette.surfaceVariant,
    borderRadius: Radius.md,
    paddingHorizontal: 12,
    paddingVertical: 11,
    gap: 8,
    borderWidth: 1.5,
    borderColor: Palette.border,
  },
  icon: {
    flexShrink: 0,
  },
  input: {
    flex: 1,
    fontSize: 15,
    color: Palette.text,
    padding: 0,
  },
});
