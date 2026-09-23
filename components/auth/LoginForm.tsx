import React from 'react';
import { StyleSheet, Text, View } from 'react-native';
import Button from '../Ui/Button';
import Input from '../Ui/Input';
import AuthOptions from './AuthOptions';
import { useLogin } from '../../feature/auth/hooks/useLogin';
import { AuthActions } from '../../feature/auth/apis/authApi';

export default function LoginForm({ actions }: { actions: AuthActions }) {
  const form = useLogin(
    actions.onVerification,
    actions.onAuthenticated,
    actions.onTwoFactor,
  );

  return (
    <View style={styles.form}>
      <Input
        label="EMAIL ADDRESS"
        placeholder="name@example.com"
        email
        value={form.email}
        onChangeText={form.setEmail}
      />
      <Input
        label="PASSWORD"
        placeholder="Enter your password"
        password
        value={form.password}
        onChangeText={form.setPassword}
      />
      <AuthOptions
        register={false}
        onForgotPassword={actions.onForgotPassword}
      />
      {form.error ? <Text style={styles.error}>{form.error}</Text> : null}
      <Button
        title={form.loading ? 'Please wait...' : 'Continue securely'}
        onPress={form.submit}
      />
    </View>
  );
}

const styles = StyleSheet.create({
  form: { gap: 17 },
  error: { color: '#c93251', fontSize: 12 },
});


