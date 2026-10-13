import React from 'react';
import { View } from 'react-native';
import Button from '../Ui/Button';
import { createThemedStyles } from '../Ui/theme';

type Props = { finalStep: boolean; onBack: () => void; onContinue: () => void };

export default function OnboardingFooter({
  finalStep,
  onBack,
  onContinue,
}: Props) {
  const styles = useStyles();

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

const useStyles = createThemedStyles(colors => ({
  footer: {
    borderTopWidth: 1,
    borderColor: colors.brandBorder,
    paddingTop: 20,
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    gap: 12,
  },
}));
