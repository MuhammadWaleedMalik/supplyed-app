import React, { useState } from 'react';
import { StyleSheet, View } from 'react-native';
import Button from '../Ui/Button';
import Checkbox from '../Ui/Checkbox';

export default function AuthOptions({
  register,
  onForgotPassword,
  checked: selected,
  onChange,
}: {
  register: boolean;
  onForgotPassword?: () => void;
  checked?: boolean;
  onChange?: (value: boolean) => void;
}) {
  const [localChecked, setLocalChecked] = useState(!register);
  const checked = selected === undefined ? localChecked : selected;
  const change = onChange || setLocalChecked;
  const label = register
    ? "I agree to SupplyED's verification, privacy, and marketplace terms."
    : 'Remember this device';

  return (
    <View style={styles.row}>
      <Checkbox label={label} checked={checked} onChange={change} />
      {!register && (
        <Button
          title="Forgot password?"
          variant="link"
          compact
          onPress={onForgotPassword || (() => {})}
        />
      )}
    </View>
  );
}

const styles = StyleSheet.create({
  row: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    alignItems: 'center',
    justifyContent: 'space-between',
    gap: 8,
  },
});
