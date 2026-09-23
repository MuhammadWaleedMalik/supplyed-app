import React from 'react';
import { StyleSheet, View } from 'react-native';
import Button from '../Ui/Button';
import { colors } from '../Ui/theme';

type Props = { finalStep: boolean; onBack: () => void; onContinue: () => void };

export default function OnboardingFooter({
  finalStep,
  onBack,
  onContinue,
}: Props) {
  return (
    <View style={styles.footer}>
      <Button title="Back" variant="text" onPress={onBack} compact />
      <Button
        title={finalStep ? 'Create profile' : 'Continue'}
        onPress={onContinue}
        compact
      />
    </View>
  );
}

const styles = StyleSheet.create({
  footer: {
    borderTopWidth: 1,
    borderColor: colors.border,
    paddingTop: 20,
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    gap: 12,
  },
});
