import React from 'react';
import {
  KeyboardAvoidingView,
  Platform,
  ScrollView,
  Text,
  View,
} from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import Button from '../../../components/Ui/Button';
import IdentityVerificationCard from '../../../components/documents/IdentityVerificationCard';
import { useStyles } from '../../documents/screen/documentStyles';

type Props = { onContinue: () => void; onExit: () => void };

export default function IdentityVerificationScreen({
  onContinue,
  onExit,
}: Props) {
  const styles = useStyles();
  return (
    <SafeAreaView style={styles.safeArea}>
      <View style={styles.topBar}>
        <Text style={styles.brand}>Verify your identity</Text>
        <Button title="Logout" variant="link" onPress={onExit} compact />
      </View>
      <KeyboardAvoidingView
        style={styles.keyboard}
        behavior={Platform.OS === 'ios' ? 'padding' : 'height'}
      >
        <ScrollView
          contentContainerStyle={styles.scroll}
          keyboardShouldPersistTaps="handled"
          keyboardDismissMode="on-drag"
        >
          <IdentityVerificationCard setup onContinue={onContinue} />
        </ScrollView>
      </KeyboardAvoidingView>
    </SafeAreaView>
  );
}
