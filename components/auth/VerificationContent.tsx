import React from 'react';
import { Text, View } from 'react-native';
import Button from '../Ui/Button';
import { common } from '../Ui/theme';
import CodeInputs from './CodeInputs';
import { verificationStyles as styles } from './verificationStyles';
import { AuthActions } from '../../feature/auth/apis/authApi';
import { useVerification } from '../../feature/auth/hooks/useVerification';

type Props = {
  email: string;
  token: string;
  onBack: () => void;
  wide: boolean;
  actions: AuthActions;
};

export default function VerificationContent({
  email,
  token,
  onBack,
  wide,
  actions,
}: Props) {
  const form = useVerification(email, token, actions.onAuthenticated);

  return (
    <View style={[styles.panel, wide && styles.widePanel]}>
      <View style={styles.content}>
        <Text style={common.eyebrow}>EMAIL CODE</Text>
        <Text accessibilityRole="header" style={common.title}>
          Enter your 6-digit code.
        </Text>
        <Text style={common.body}>
          Verification code for{' '}
          <Text style={common.bold}>{email || 'your email address'}</Text>.
        </Text>
        <View style={styles.card}>
          <Text style={styles.label}>
            VERIFICATION CODE <Text style={styles.required}>*</Text>
          </Text>
          <CodeInputs digits={form.digits} onChange={form.changeDigit} />
          <View style={styles.notice}>
            <Text style={styles.noticeText}>
              Codes are validated by SupplyED before a workspace session is
              created.
            </Text>
          </View>
          {form.error ? <Text style={styles.error}>{form.error}</Text> : null}
          <Button
            title={form.loading ? 'Please wait...' : 'Verify and continue'}
            onPress={form.verify}
          />
          <View style={styles.actions}>
            <Button title="Back" variant="text" onPress={onBack} compact />
            <Button
              title="Resend code"
              variant="link"
              onPress={form.resend}
              compact
            />
          </View>
          <Text style={styles.caption}>
            You can request a new code if the current one expires.
          </Text>
          <View style={styles.footer}>
            <Text style={styles.footerText}>
              After verification, SupplyED signs you in and checks whether
              onboarding is needed.
            </Text>
          </View>
        </View>
      </View>
    </View>
  );
}

