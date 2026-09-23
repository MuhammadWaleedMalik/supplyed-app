import React from 'react';
import { StyleSheet, Text, View } from 'react-native';
import { colors, common } from '../Ui/theme';
import AuthSwitch from './AuthSwitch';
import LoginForm from './LoginForm';
import RegisterForm from './RegisterForm';
import SocialProviders from './SocialProviders';
import { AuthActions } from '../../feature/auth/apis/authApi';

type Props = {
  register: boolean;
  wide: boolean;
  onSwitch: () => void;
  actions: AuthActions;
};

export default function AuthContent({
  register,
  wide,
  onSwitch,
  actions,
}: Props) {
  return (
    <View style={[styles.panel, wide && styles.widePanel]}>
      <View style={[styles.content, register && styles.registerContent]}>
        <Text style={common.eyebrow}>
          {register ? 'ACCOUNT DETAILS' : 'SECURE SIGN IN'}
        </Text>
        <Text accessibilityRole="header" style={common.title}>
          {register ? 'Create your SupplyED account.' : 'Log in to SupplyED'}
        </Text>
        <AuthSwitch
          message={register ? 'Already registered?' : 'New to SupplyED?'}
          action={register ? 'Log in' : 'Create an account'}
          onPress={onSwitch}
        />
        <View style={[styles.card, wide && styles.wideCard]}>
          <SocialProviders />
          <View style={styles.divider}>
            <View style={styles.line} />
            <Text style={styles.dividerText}>EMAIL</Text>
            <View style={styles.line} />
          </View>
          {register ? (
            <RegisterForm wide={wide} actions={actions} />
          ) : (
            <LoginForm actions={actions} />
          )}
        </View>
      </View>
    </View>
  );
}

const styles = StyleSheet.create({
  panel: {
    backgroundColor: '#ffffff',
    paddingHorizontal: 20,
    paddingVertical: 36,
  },
  widePanel: { flex: 1, justifyContent: 'center', paddingHorizontal: 48 },
  content: { width: '100%', maxWidth: 490, alignSelf: 'center', gap: 12 },
  registerContent: { maxWidth: 720 },
  card: {
    borderWidth: 1,
    borderColor: colors.border,
    borderRadius: 16,
    backgroundColor: '#ffffff',
    padding: 20,
    gap: 24,
    marginTop: 14,
  },
  wideCard: { padding: 24 },
  divider: { flexDirection: 'row', alignItems: 'center', gap: 12 },
  line: { height: 1, flex: 1, backgroundColor: colors.border },
  dividerText: {
    color: colors.muted,
    fontSize: 10,
    fontWeight: '700',
    letterSpacing: 1.5,
  },
});
