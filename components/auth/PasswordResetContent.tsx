import React from 'react';
import { StyleSheet, Text, View } from 'react-native';
import Button from '../Ui/Button';
import Input from '../Ui/Input';
import { colors, common } from '../Ui/theme';
import { usePasswordReset } from '../../feature/auth/hooks/usePasswordReset';

type Props = { onBack: () => void };

export default function PasswordResetContent({ onBack }: Props) {
  const form = usePasswordReset();
  return (
    <View style={styles.content}>
      <Text style={common.eyebrow}>ACCOUNT RECOVERY</Text>
      <Text accessibilityRole="header" style={common.title}>
        Reset your password.
      </Text>
      <View style={styles.card}>
        {form.done ? (
          <Text style={common.body}>
            Your password was reset. Log in with your new password.
          </Text>
        ) : form.token ? (
          <>
            <Text style={common.body}>
              Enter the code sent to {form.email}.
            </Text>
            <Input
              label="SIX-DIGIT CODE"
              value={form.code}
              onChangeText={form.setCode}
              number
            />
            <Input
              label="NEW PASSWORD"
              value={form.password}
              onChangeText={form.setPassword}
              password
            />
            <Input
              label="CONFIRM PASSWORD"
              value={form.confirmation}
              onChangeText={form.setConfirmation}
              password
            />
            <Button
              title={form.loading ? 'Please wait...' : 'Reset password'}
              onPress={form.submit}
              disabled={form.loading}
            />
            <Button
              title="Send new code"
              variant="link"
              onPress={form.requestCode}
              compact
            />
          </>
        ) : (
          <>
            <Text style={common.body}>
              We will email you a six-digit reset code.
            </Text>
            <Input
              label="EMAIL ADDRESS"
              email
              value={form.email}
              onChangeText={form.setEmail}
            />
            <Button
              title={form.loading ? 'Please wait...' : 'Send code'}
              onPress={form.requestCode}
              disabled={form.loading}
            />
          </>
        )}
        {form.error ? <Text style={styles.error}>{form.error}</Text> : null}
        <Button
          title={form.done ? 'Log in' : 'Back'}
          variant="text"
          onPress={onBack}
        />
      </View>
    </View>
  );
}

const styles = StyleSheet.create({
  content: { gap: 16 },
  card: {
    borderWidth: 1,
    borderColor: colors.border,
    borderRadius: 16,
    padding: 20,
    gap: 16,
  },
  error: { color: '#c93251', fontSize: 12 },
});
