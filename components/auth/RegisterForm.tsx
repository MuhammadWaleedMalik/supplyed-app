import React from 'react';
import { StyleSheet, Text, View } from 'react-native';
import Button from '../Ui/Button';
import Input from '../Ui/Input';
import ValidationChecklist from '../Ui/ValidationChecklist';
import AuthOptions from './AuthOptions';
import { useRegister } from '../../feature/auth/hooks/useRegister';
import { AuthActions } from '../../feature/auth/apis/authApi';
export default function RegisterForm({
  wide,
  actions,
}: {
  wide: boolean;
  actions: AuthActions;
}) {
  const form = useRegister(actions.onVerification);

  return (
    <View style={styles.form}>
      <View style={[styles.fields, wide && styles.wideFields]}>
        <Input
          label="EMAIL ADDRESS"
          placeholder="name@example.com"
          email
          half={wide}
          value={form.email}
          onChangeText={form.setEmail}
          onBlur={() => form.setEmailTouched(true)}
          error={form.emailError}
        />
        <View style={[styles.passwordField, wide && styles.half]}>
          <Input
            label="PASSWORD"
            placeholder="Create a password"
            password
            value={form.password}
            onChangeText={form.setPassword}
            onFocus={() => form.setPasswordTouched(true)}
          />
          {form.passwordTouched && <ValidationChecklist items={form.checks} />}
        </View>
      </View>
      <View style={[styles.confirm, wide && styles.wideConfirm]}>
        <Input
          label="CONFIRM PASSWORD"
          placeholder="Repeat your password"
          password
          value={form.confirmation}
          onChangeText={form.setConfirmation}
          onFocus={() => form.setConfirmationTouched(true)}
          error={form.confirmationError}
        />
      </View>
      <AuthOptions register checked={form.agreed} onChange={form.setAgreed} />
      {form.error ? <Text style={styles.error}>{form.error}</Text> : null}
      <Button
        title={form.loading ? 'Please wait...' : 'Create account'}
        onPress={form.submit}
      />
    </View>
  );
}

const styles = StyleSheet.create({
  form: { gap: 17 },
  fields: { gap: 14 },
  wideFields: { flexDirection: 'row', alignItems: 'flex-start' },
  passwordField: { width: '100%', gap: 4 },
  half: { flex: 1, width: 'auto' },
  confirm: { width: '100%' },
  wideConfirm: { width: '49%' },
  error: { color: '#c93251', fontSize: 12 },
});
