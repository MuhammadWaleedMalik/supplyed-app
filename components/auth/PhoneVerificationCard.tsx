import React from 'react';
import { Text, View } from 'react-native';
import { User } from '../../feature/auth/apis/authApi';
import { usePhoneVerification } from '../../feature/auth/hooks/usePhoneVerification';
import Button from '../Ui/Button';
import Input from '../Ui/Input';
import { createThemedStyles } from '../Ui/theme';

type Props = {
  user?: User;
  editable?: boolean;
  disabled?: boolean;
  onVerified: (user: User) => void;
};

export default function PhoneVerificationCard({
  user,
  editable = false,
  disabled = false,
  onVerified,
}: Props) {
  const styles = useStyles();

  const form = usePhoneVerification(user, onVerified);
  const busy = disabled || form.loading;
  const expiryMinutes = Math.ceil(form.expirySeconds / 60);

  return (
    <View style={styles.card}>
      <Text style={styles.title}>Phone verification</Text>
      {editable ? (
        <Input
          label="PHONE"
          placeholder="+44 7700 900000"
          phone
          required={false}
          value={form.phone}
          disabled={!user || busy || form.savedVerified}
          onChangeText={form.changePhone}
        />
      ) : (
        <Text style={styles.phone}>
          {form.phone || 'No saved phone number'}
        </Text>
      )}
      {form.verified ? (
        <Text style={styles.success}>Phone verified</Text>
      ) : (
        <>
          <Text style={styles.note}>
            {editable
              ? 'Verification is optional. Save your number in Settings before verifying it.'
              : 'Verify your saved phone number to help complete your account verification.'}
          </Text>
          {editable && form.savedVerified && form.phone !== form.savedPhone ? (
            <Text style={styles.note}>
              Current verified phone: {form.savedPhone}
            </Text>
          ) : null}
          {!editable && !form.phone ? (
            <Text style={styles.note}>
              Add and verify your phone later in Settings.
            </Text>
          ) : null}
          <Button
            title={
              form.loading
                ? 'Please wait...'
                : form.resendSeconds > 0
                ? `Send code in ${form.resendSeconds}s`
                : form.sentPhone
                ? 'Resend code'
                : 'Verify phone'
            }
            onPress={form.send}
            disabled={
              !user || busy || !form.phone.trim() || form.resendSeconds > 0
            }
            compact
          />
          {form.sentPhone ? (
            <View style={styles.code}>
              <Text style={styles.note}>Code sent to {form.sentPhone}.</Text>
              <Input
                label="SIX-DIGIT SMS CODE"
                placeholder="123456"
                number
                value={form.code}
                onChangeText={form.changeCode}
                disabled={busy || form.expirySeconds === 0}
              />
              <Text style={styles.note}>
                {form.expirySeconds > 0
                  ? `Code expires in ${expiryMinutes} minute${
                      expiryMinutes === 1 ? '' : 's'
                    }.`
                  : 'This code has expired. Request a new code.'}
              </Text>
              <Button
                title={form.loading ? 'Verifying...' : 'Verify code'}
                onPress={form.verify}
                disabled={busy || !form.canVerify}
                compact
              />
            </View>
          ) : null}
        </>
      )}
      {form.error ? (
        <Text accessibilityRole="alert" style={styles.error}>
          {form.error}
        </Text>
      ) : null}
    </View>
  );
}

const useStyles = createThemedStyles(colors => ({
  card: { gap: 12 },
  title: { color: colors.ink, fontSize: 17, fontWeight: '700' },
  phone: { color: colors.ink, fontSize: 15, fontWeight: '600' },
  note: { color: colors.muted, fontSize: 12, lineHeight: 18 },
  code: { gap: 10 },
  success: { color: '#17783b', fontSize: 14, fontWeight: '700' },
  error: { color: '#b4233f', fontSize: 12, lineHeight: 18 },
}));
