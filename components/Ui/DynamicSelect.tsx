import React from 'react';
import { Text, View } from 'react-native';
import { useDropdown } from '../../feature/dropdowns/hooks/useDropdown';
import type { DropdownName } from '../../feature/dropdowns/apis/dropdownsApi';
import Button from './Button';
import Select from './Select';
import { createThemedStyles } from './theme';

type Props = {
  name: DropdownName;
  label: string;
  value: string;
  onChange: (value: string) => void;
  multiple?: boolean;
  maxSelections?: number;
  disabled?: boolean;
  placeholder?: string;
  required?: boolean;
  error?: string;
  exclude?: string[];
  allowed?: string[];
};

export default function DynamicSelect(props: Props) {
  const dropdown = useDropdown(props.name);
  const styles = useStyles();
  const options = dropdown.options.filter(
    option =>
      !props.exclude?.includes(option.value) &&
      (!props.allowed || props.allowed.includes(option.value)),
  );
  return (
    <View style={styles.field}>
      <Select
        {...props}
        options={options}
        disabled={props.disabled || !dropdown.data || !!dropdown.error}
        placeholder={props.placeholder || 'Choose an option'}
      />
      {dropdown.loading && !dropdown.data ? (
        <Text accessibilityLiveRegion="polite" style={styles.hint}>
          Loading choices...
        </Text>
      ) : null}
      {dropdown.error ? (
        <View>
          <Text accessibilityRole="alert" style={styles.error}>
            {dropdown.error}
          </Text>
          <Button
            title="Retry choices"
            variant="link"
            onPress={dropdown.retry}
          />
        </View>
      ) : null}
    </View>
  );
}

const useStyles = createThemedStyles(colors => ({
  field: { gap: 6 },
  hint: { color: colors.muted, fontSize: 12, lineHeight: 18 },
  error: { color: '#c93652', fontSize: 12, lineHeight: 18 },
}));
