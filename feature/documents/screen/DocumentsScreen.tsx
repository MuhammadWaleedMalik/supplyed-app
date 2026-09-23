import React from 'react';
import {
  KeyboardAvoidingView, Platform, ScrollView, Text, View, useWindowDimensions,
} from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import Button from '../../../components/Ui/Button';
import DocumentsIntro from '../../../components/documents/DocumentsIntro';
import DocumentsUpload from '../../../components/documents/DocumentsUpload';
import { styles } from './documentStyles';
import { useKeyboardScroll } from '../../../utils/ui/useKeyboardScroll';
import { AccountType } from '../../../utils/onboarding/onboardingData';
import { useDocuments } from '../hooks/useDocuments';

type Props = { type: AccountType; onSubmit: () => void; onExit: () => void };

export default function DocumentsScreen({ type, onSubmit, onExit }: Props) {
  const form = useDocuments(type, onSubmit);
  const { width, fontScale } = useWindowDimensions();
  const scrollRef = useKeyboardScroll();
  const wide = width / fontScale >= 850;

  return (
    <SafeAreaView style={styles.safeArea}>
      <View style={styles.topBar}>
        <Text style={styles.brand}>
          Supply<Text style={styles.brandBlue}>ED</Text>
        </Text>
        <Button title="Exit" variant="link" onPress={onExit} compact />
      </View>
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
            <DocumentsIntro type={type} wide={wide} />
            <DocumentsUpload
              requirements={form.requirements}
              documents={form.documents}
              error={form.error}
              loading={form.loading}

              uploadingId={form.uploadingId}
              previewingId={form.previewingId}
              onAdd={form.addDocument}
              onPreview={form.previewDocument}
              onSubmit={form.continueToDashboard}
            />
          </View>
        </ScrollView>
      </KeyboardAvoidingView>
    </SafeAreaView>
  );
}




