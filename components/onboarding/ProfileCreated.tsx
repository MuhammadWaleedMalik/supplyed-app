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
import { User } from '../../feature/auth/apis/authApi';
import PhoneVerificationCard from '../auth/PhoneVerificationCard';
import Button from '../Ui/Button';
import { colors } from '../Ui/theme';

type Props = {
  user?: User;
  creating: boolean;
  needsSignatory: boolean;
  signatorySent: boolean;
  sendingSignatory: boolean;
  signatoryError: string;
  onVerified: (user: User) => void;
  onRetrySignatory: () => void;
  onContinue: () => void;
  onExit: () => void;
};

export default function ProfileCreated(props: Props) {
  const waiting = props.creating || props.sendingSignatory;
  const emailRequired = props.needsSignatory && !props.signatorySent;

  return (
    <SafeAreaView style={styles.safeArea}>
      <View style={styles.topBar}>
        <Text style={styles.brand}>Supply<Text style={styles.brandBlue}>ED</Text></Text>
        <Button title="Exit" variant="link" compact onPress={props.onExit} />
      </View>
      <KeyboardAvoidingView
        style={styles.keyboard}
        behavior={Platform.OS === 'ios' ? 'padding' : 'height'}
      >
        <ScrollView keyboardShouldPersistTaps="handled" contentContainerStyle={styles.page}>
          <View style={styles.card}>
            <Text style={styles.title}>Your profile is created</Text>
            <Text style={styles.note}>
              Verify your phone, then continue to the required documents and approval steps.
              Your profile will be sent for review after those steps are complete.
            </Text>
            <PhoneVerificationCard user={props.user} onVerified={props.onVerified} />
            {props.needsSignatory ? (
              <Text style={styles.note}>
                {props.sendingSignatory
                  ? 'Sending the trust signatory email...'
                  : props.signatorySent
                    ? 'The trust signatory email has been sent. Track its approval on the documents screen.'
                    : 'Send the trust signatory email before continuing.'}
              </Text>
            ) : null}
            {props.signatoryError ? (
              <>
                <Text style={styles.error}>{props.signatoryError}</Text>
                <Button
                  title="Retry signatory email"
                  variant="link"
                  onPress={props.onRetrySignatory}
                  disabled={waiting}
                />
              </>
            ) : null}
            <Button
              title="Continue to documents"
              onPress={props.onContinue}
              disabled={waiting || emailRequired}
            />
            {!props.user?.phoneVerified ? (
              <Text style={styles.note}>You can also verify your phone later in Settings.</Text>
            ) : null}
          </View>
        </ScrollView>
      </KeyboardAvoidingView>
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  safeArea: { flex: 1, backgroundColor: '#fbfcfd' },
  keyboard: { flex: 1 },
  topBar: {
    minHeight: 58,
    paddingHorizontal: 18,
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    backgroundColor: '#ffffff',
    borderBottomWidth: 1,
    borderBottomColor: colors.border,
  },
  brand: { color: colors.ink, fontSize: 20, fontWeight: '700' },
  brandBlue: { color: colors.blue },
  page: { flexGrow: 1, padding: 20, paddingBottom: 60, justifyContent: 'center' },
  card: {
    width: '100%',
    maxWidth: 560,
    alignSelf: 'center',
    padding: 22,
    gap: 20,
    borderWidth: 1,
    borderColor: colors.border,
    borderRadius: 12,
    backgroundColor: '#ffffff',
  },
  title: { color: colors.ink, fontSize: 25, fontWeight: '700' },
  note: { color: colors.muted, fontSize: 12, lineHeight: 18 },
  error: { color: '#b4233f', fontSize: 12, lineHeight: 18 },
});
