import React from 'react';
import { Text, View } from 'react-native';
import Button from '../Ui/Button';
import Icon from '../Ui/Icon';
import { createThemedStyles } from '../Ui/theme';
import { showAuthMessage } from '../../utils/auth/authUtils';
import { AccountType } from '../../utils/onboarding/onboardingData';

type Props = {
  role?: AccountType | null;
};

export default function SocialProviders({ role }: Props) {
  const styles = useStyles();

  const note = role
    ? 'Use email to sign up with your selected profile type.'
    : 'Social sign-in is currently unavailable. Use email to continue.';

  return (
    <View style={styles.content}>
      <View style={styles.buttons}>
        <Button
          title="Continue with Google"
          icon={<Icon name="google" />}
          variant="social"
          onPress={() => showAuthMessage('social')}
        />
        <Button
          title="Continue with Microsoft"
          icon={<Icon name="microsoft" />}
          variant="social"
          onPress={() => showAuthMessage('social')}
        />
      </View>
      <Text style={styles.note}>{note}</Text>
    </View>
  );
}

const useStyles = createThemedStyles(colors => ({
  content: { gap: 10 },
  buttons: { gap: 10 },
  note: { color: colors.muted, fontSize: 11, lineHeight: 17 },
}));
