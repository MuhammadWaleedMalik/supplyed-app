import { useGoogleLogin } from '../../feature/auth/hooks/useGoogleLogin';
import { AuthActions } from '../../feature/auth/apis/authApi';
import { googleSignInAvailable } from '../../feature/auth/apis/googleApi';
import React from 'react';
import { Text, View } from 'react-native';
import Button from '../Ui/Button';
import Icon from '../Ui/Icon';
import { createThemedStyles } from '../Ui/theme';
import { AccountType } from '../../utils/onboarding/onboardingData';

type Props = {
  role?: AccountType | null;
  actions: AuthActions;
  disabled?: boolean;
};

export default function SocialProviders({ role, actions, disabled }: Props) {
  const styles = useStyles();
  const google = useGoogleLogin(actions, role);

  const note = !googleSignInAvailable
    ? 'Google sign-in is currently unavailable. Use email to continue.'
    : disabled
    ? 'Choose your profile type and agree to the terms to continue with Google.'
    : '';

  return (
    <View style={styles.content}>
      <View style={styles.buttons}>
        <Button
          title={google.loading ? 'Signing in...' : 'Continue with Google'}
          disabled={disabled || google.loading || !googleSignInAvailable}
          icon={<Icon name="google" />}
          variant="social"
          onPress={google.signIn}
        />
      </View>
      {note ? <Text style={styles.note}>{note}</Text> : null}
      {google.error ? (
        <Text accessibilityRole="alert" style={styles.note}>
          {google.error}
        </Text>
      ) : null}
    </View>
  );
}

const useStyles = createThemedStyles(colors => ({
  content: { gap: 10 },
  buttons: { gap: 10 },
  note: { color: colors.muted, fontSize: 11, lineHeight: 17 },
}));
