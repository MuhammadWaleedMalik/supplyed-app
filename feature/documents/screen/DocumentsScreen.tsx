import React from 'react';
import {
  KeyboardAvoidingView,
  Platform,
  ScrollView,
  Text,
  View,
  useWindowDimensions,
} from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import Button from '../../../components/Ui/Button';
import DocumentsIntro from '../../../components/documents/DocumentsIntro';
import DocumentsUpload from '../../../components/documents/DocumentsUpload';
import SignatoryApprovalPanel from '../../../components/documents/SignatoryApprovalPanel';
import OptionalPhoneVerification from '../../../components/documents/OptionalPhoneVerification';
import { useStyles } from './documentStyles';
import { AccountType } from '../../../utils/onboarding/onboardingData';
import { useDocuments } from '../hooks/useDocuments';

type Props = {
  type: AccountType;
  onReviewStatus: () => void;
  onExit: () => void;
};

export default function DocumentsScreen({
  type,
  onReviewStatus,
  onExit,
}: Props) {
  const styles = useStyles();

  const form = useDocuments(type, onReviewStatus);
  const { width, fontScale } = useWindowDimensions();
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
              onRetry={!form.loaded ? form.retryLoad : undefined}
              submitting={form.submitting}
              uploadingIds={form.uploadingIds}
              uploadErrors={form.uploadErrors}
              onRetryUpload={form.retryDocument}
              previewingId={form.previewingId}
              signatoryPanel={
                <>
                  <OptionalPhoneVerification />
                  <SignatoryApprovalPanel
                    visible={form.needsTrustApproval}
                    approval={form.approval}
                    refreshing={form.refreshingApproval}
                    onRefresh={form.refreshApprovalStatus}
                    onUpdated={form.updateApproval}
                  />
                </>
              }
              onAdd={form.addDocument}
              onPreview={form.previewDocument}
              onSubmit={form.continueToReviewStatus}
            />
          </View>
        </ScrollView>
      </KeyboardAvoidingView>
    </SafeAreaView>
  );
}
