import React from 'react';
import {
  KeyboardAvoidingView,
  Platform,
  ScrollView,
  StyleSheet,
  View,
  useWindowDimensions,
} from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { colors } from '../Ui/theme';
import AuthIntro from './AuthIntro';
import AuthContent from './AuthContent';
import VerificationContent from './VerificationContent';
import { useKeyboardScroll } from '../../utils/ui/useKeyboardScroll';
import { AuthActions } from '../../feature/auth/apis/authApi';

type Props = {
  register: boolean;
  verify?: boolean;
  email?: string;
  token?: string;
  onBack: () => void;
  onSwitch: () => void;
  actions: AuthActions;
};

export default function AuthLayout({
  register,
  verify,
  email,
  token,
  onBack,
  onSwitch,
  actions,
}: Props) {
  const { width, fontScale } = useWindowDimensions();
  const scrollRef = useKeyboardScroll();
  const wide = width / fontScale >= 900;

  return (
    <SafeAreaView style={styles.safeArea}>
      <KeyboardAvoidingView
        style={styles.keyboard}
        behavior={Platform.OS === 'ios' ? 'padding' : 'height'}
      >
        <ScrollView
          ref={scrollRef}
          keyboardDismissMode="on-drag"
          keyboardShouldPersistTaps="handled"
          contentContainerStyle={styles.scroll}
        >
          <View style={[styles.panels, wide && styles.widePanels]}>
            <AuthIntro
              register={register}
              verify={verify}
              wide={wide}
              onBack={onBack}
              onSwitch={onSwitch}
            />
            {verify ? (
              <VerificationContent
                email={email || ''}
                token={token || ''}
                actions={actions}
                onBack={onBack}
                wide={wide}
              />
            ) : (
              <AuthContent
                register={register}
                wide={wide}
                onSwitch={onSwitch}
                actions={actions}
              />
            )}
          </View>
        </ScrollView>
      </KeyboardAvoidingView>
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  keyboard: { flex: 1 },
  safeArea: { flex: 1, backgroundColor: colors.dark },
  scroll: { flexGrow: 1, backgroundColor: '#ffffff', paddingBottom: 160 },
  panels: { flexGrow: 1 },
  widePanels: { flexDirection: 'row' },
});


