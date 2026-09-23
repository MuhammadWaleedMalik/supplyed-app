import React from 'react';
import { Text, View } from 'react-native';
import Button from '../Ui/Button';
import { Document, Requirement } from '../../feature/documents/apis/documentApi';
import { findDocument } from '../../utils/documents/documentUtils';
import { styles } from './documentsUploadStyles';

type Props = {
  requirement: Requirement;
  documents: Document[];
  uploading: boolean;
  busy: boolean;
  previewing: boolean;
  onAdd: (requirement: Requirement) => void;
  onPreview: (document: Document) => void;
};

export default function DocumentCard({
  requirement, documents, uploading, busy, previewing, onAdd, onPreview,
}: Props) {
  const document = findDocument(requirement.id, documents);
  const hasFile = Boolean(document?.fileKey && document.uploadedAt);
  const rejected = ['REJECTED', 'REQUIRES_INFO'].includes(
    (document?.status || '').toUpperCase(),
  );
  return (
    <View style={[styles.card, hasFile && styles.uploadedCard, rejected && styles.rejectedCard]}>
      <View style={styles.cardHeading}>
        <Text style={styles.fileIcon}>{'\u25A4'}</Text>
        <View style={styles.cardCopy}>
          <Text style={styles.cardTitle}>
            {requirement.documentType.name}{' '}
            {requirement.isRequired ? <Text style={styles.required}>REQUIRED</Text> : null}
          </Text>
          <Text style={styles.cardText}>
            {requirement.documentType.description ||
              'Add this document before continuing to your dashboard.'}
          </Text>
          <Text style={styles.hint}>
            {hasFile ? document?.originalName || 'Document uploaded' : 'No file uploaded yet'}
          </Text>
          {hasFile ? (
            <Text style={rejected ? styles.rejectedText : styles.added}>
              {rejected ? 'Needs replacement' : 'Sent for review'}
              {document?.status ? ' - ' + document.status.replace('_', ' ').toLowerCase() : ''}
            </Text>
          ) : null}
        </View>
      </View>
      {rejected && document?.rejectionComment ? (
        <View style={styles.rejectionNote}>
          <Text style={styles.rejectedText}>Review note: {document.rejectionComment}</Text>
        </View>
      ) : null}
      <Button
        title={uploading ? 'Uploading...' : hasFile ? 'Replace document' : 'Upload document'}
        variant={hasFile ? 'social' : 'primary'}
        onPress={() => onAdd(requirement)}
        disabled={busy || previewing}
      />
      {hasFile && document ? (
        <Button
          title={previewing ? 'Opening...' : 'Preview document'}
          variant="link"
          onPress={() => onPreview(document)}
          disabled={busy || previewing}
        />
      ) : null}
    </View>
  );
}


