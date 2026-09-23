import React from 'react';
import {
  KeyboardAvoidingView,
  Platform,
  ScrollView,
  StyleSheet,
} from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import PasswordResetContent from '../../../components/auth/PasswordResetContent';
import { useKeyboardScroll } from '../../../utils/ui/useKeyboardScroll';

type Props = { onBack: () => void };

export default function ForgotPasswordScreen({ onBack }: Props) {
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
          <PasswordResetContent onBack={onBack} />
        </ScrollView>
      </KeyboardAvoidingView>
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  safeArea: { flex: 1, backgroundColor: '#ffffff' },
  keyboard: { flex: 1 },
  page: { flexGrow: 1, padding: 24, paddingBottom: 170, justifyContent: 'center' },
});

