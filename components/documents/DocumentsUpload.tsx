import React from 'react';
import { Text, View } from 'react-native';
import Button from '../Ui/Button';
import DocumentCard from './DocumentCard';
import { common } from '../Ui/theme';
import { Document, Requirement } from '../../feature/documents/apis/documentApi';
import { requiredDocumentCount } from '../../utils/documents/documentUtils';
import { styles } from './documentsUploadStyles';

type Props = {
  requirements: Requirement[];
  documents: Document[];
  error: string;
  loading: boolean;
  uploadingId: string;
  previewingId: string;
  onAdd: (requirement: Requirement) => void;
  onPreview: (document: Document) => void;
  onSubmit: () => void;
};

export default function DocumentsUpload({
  requirements, documents, error, loading, uploadingId,
  previewingId, onAdd, onPreview, onSubmit,
}: Props) {
  const count = requiredDocumentCount(requirements, documents);
  return (
    <View style={styles.main}>
      <Text style={styles.badge}>REQUIRED DOCUMENTS</Text>
      <Text accessibilityRole="header" style={common.title}>
        Upload required documents
      </Text>
      <Text style={common.body}>
        Your profile has been created. Each document is sent for review as soon
        as its upload finishes.
      </Text>
      <View style={styles.progressLabel}>
        <Text style={styles.small}>PROGRESS</Text>
        <Text style={styles.small}>100%</Text>
      </View>
      <View style={styles.track}><View style={styles.fill} /></View>
      <View style={styles.notice}>
        <Text style={styles.noticeTitle}>Profile created</Text>
        <Text style={styles.noticeText}>
          {loading ? 'Loading required documents...' :
            count.ready + ' of ' + count.total + ' required documents ready. ' +
            'Remaining uploads or replacements: ' + count.remaining + '.'}
        </Text>
      </View>
      {!loading && !error && requirements.length === 0 ? (
        <Text style={common.body}>No documents are currently required for this profile.</Text>
      ) : null}
      {requirements.map(requirement => (
        <DocumentCard
          key={requirement.id}
          requirement={requirement}
          documents={documents}
          uploading={uploadingId === requirement.id}
          busy={uploadingId !== ''}
          previewing={previewingId !== ''}
          onAdd={onAdd}
          onPreview={onPreview}
        />
      ))}
      {error ? <Text style={styles.error}>{error}</Text> : null}
      <View style={styles.footer}>
        <Text style={styles.footerNote}>Uploaded files are sent for review immediately. Tap to continue.</Text>
        <Button
          title="Send for review"
          onPress={onSubmit}
          disabled={loading || uploadingId !== ''}
          compact
        />
      </View>
    </View>
  );
}

