import React from 'react';
import {
  KeyboardAvoidingView,
  Platform,
  ScrollView,
  StyleSheet,
  Text,
  View,
} from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import Button from '../../../components/Ui/Button';
import Input from '../../../components/Ui/Input';
import { colors, common } from '../../../components/Ui/theme';
import { User } from '../apis/authApi';
import { useTwoFactor } from '../hooks/useTwoFactor';
import { useKeyboardScroll } from '../../../utils/ui/useKeyboardScroll';

type Props = {
  token: string;
  onBack: () => void;
  onAuthenticated: (user: User) => Promise<void> | void;
};

export default function TwoFactorScreen({
  token,
  onBack,
  onAuthenticated,
}: Props) {
  const form = useTwoFactor(token, onAuthenticated);
  const scrollRef = useKeyboardScroll();

  return (
    <SafeAreaView style={styles.safeArea}>
      <KeyboardAvoidingView
        style={styles.keyboard}
        behavior={Platform.OS === 'ios' ? 'padding' : 'height'}
      >
        <ScrollView
          ref={scrollRef}
          keyboardShouldPersistTaps="handled"
          contentContainerStyle={styles.page}
        >
          <Text style={common.eyebrow}>SECURE SIGN IN</Text>
          <Text accessibilityRole="header" style={common.title}>
            Enter your security code.
          </Text>
          <Text style={common.body}>
            Use your authenticator code or a recovery code.
          </Text>
          <View style={styles.card}>
            <Input
              label="SECURITY CODE"
              placeholder="Six digits or recovery code"
              value={form.code}
              onChangeText={form.setCode}
            />
            {form.error ? <Text style={styles.error}>{form.error}</Text> : null}
            <Button
              title={form.loading ? 'Please wait...' : 'Verify and continue'}
              onPress={form.verify}
            />
            <Button title="Back" variant="text" onPress={onBack} />
          </View>
        </ScrollView>
      </KeyboardAvoidingView>
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  safeArea: { flex: 1, backgroundColor: '#ffffff' },
  keyboard: { flex: 1 },
  page: { flexGrow: 1, padding: 24, paddingBottom: 170, justifyContent: 'center', gap: 16 },
  card: {
    borderWidth: 1,
    borderColor: colors.border,
    borderRadius: 16,
    padding: 20,
    gap: 16,
  },
  error: { color: '#c93251', fontSize: 12 },
});


