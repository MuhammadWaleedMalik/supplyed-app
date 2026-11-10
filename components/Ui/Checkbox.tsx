import React from 'react';
import { Pressable, Text, View } from 'react-native';
import { Check } from 'lucide-react-native';
import { createThemedStyles } from './theme';

type Props = {
  label: string;
  checked: boolean;
  disabled?: boolean;
  onChange: (checked: boolean) => void;
};

export default function Checkbox({ label, checked, disabled, onChange }: Props) {
  const styles = useStyles();

  return (
    <Pressable
      accessibilityRole="checkbox"
      accessibilityState={{ checked, disabled }}
      disabled={disabled}
      onPress={() => onChange(!checked)}
      style={styles.row}
    >
      <View style={[styles.box, checked && styles.selected]}>
        {checked ? <Check size={14} color="#ffffff" /> : null}
      </View>
      <Text style={styles.label}>{label}</Text>
    </Pressable>
  );
}

const useStyles = createThemedStyles((colors, common) => ({
  row: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 9,
    minHeight: 44,
    flexShrink: 1,
  },
  box: {
    width: 18,
    height: 18,
    borderRadius: 9,
    borderWidth: 1,
    borderColor: '#bdcbd6',
    flexShrink: 0,
    alignItems: 'center',
    justifyContent: 'center',
  },
  selected: { borderColor: colors.brand, backgroundColor: colors.brand },
  label: { ...common.body, fontSize: 13, lineHeight: 19, flexShrink: 1 },
}));
