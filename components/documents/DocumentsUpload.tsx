import React from 'react';
import { Text, View } from 'react-native';
import {
  Document,
  Requirement,
} from '../../feature/documents/apis/documentApi';
import { requiredDocumentCount } from '../../utils/documents/documentUtils';
import Button from '../Ui/Button';
import { useCommonStyles } from '../Ui/theme';
import DocumentCard from './DocumentCard';
import { useStyles } from './documentsUploadStyles';

type Props = {
  requirements: Requirement[];
  documents: Document[];
  error: string;
  loading: boolean;
  submitting: boolean;
  uploadingIds: string[];
  uploadErrors: Record<string, string>;
  onRetryUpload: (requirement: Requirement) => void;
  previewingId: string;
  signatoryPanel?: React.ReactNode;
  onAdd: (requirement: Requirement) => void;
  onPreview: (document: Document) => void;
  onSubmit: () => void;
  onRetry?: () => void;
};

export default function DocumentsUpload(props: Props) {
  const common = useCommonStyles();
  const styles = useStyles();

  const count = requiredDocumentCount(props.requirements, props.documents);
  const progress = props.loading
    ? 0
    : count.total
    ? Math.round((count.ready / count.total) * 100)
    : 100;
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
        <Text style={styles.small}>{progress}%</Text>
      </View>
      <View style={styles.track}>
        <View style={[styles.fill, { width: `${progress}%` }]} />
      </View>
      <View style={styles.notice}>
        <Text style={styles.noticeTitle}>Profile created</Text>
        <Text style={styles.noticeText}>
          {props.loading
            ? 'Loading required documents...'
            : count.ready +
              ' of ' +
              count.total +
              ' required documents ready. ' +
              'Remaining uploads or replacements: ' +
              count.remaining +
              '.'}
        </Text>
      </View>
      {!props.loading && !props.error && !props.requirements.length ? (
        <Text style={common.body}>
          No documents are currently required for this profile.
        </Text>
      ) : null}
      {props.requirements.map(requirement => (
        <DocumentCard
          key={requirement.id}
          requirement={requirement}
          documents={props.documents}
          uploading={props.uploadingIds.includes(requirement.id)}
          error={props.uploadErrors[requirement.id]}
          onRetry={() => props.onRetryUpload(requirement)}
          busy={props.submitting || props.uploadingIds.includes(requirement.id)}
          previewing={props.previewingId !== ''}
          onAdd={props.onAdd}
          onPreview={props.onPreview}
        />
      ))}
      {props.signatoryPanel}
      {props.error ? <Text style={styles.error}>{props.error}</Text> : null}
      {props.error && !props.loading && props.onRetry ? (
        <Button
          title="Retry loading documents"
          onPress={props.onRetry}
          compact
        />
      ) : null}
      <View style={styles.footer}>
        <Text style={styles.footerNote}>
          You can check status after sending for review.
        </Text>
        <Button
          title={props.submitting ? 'Sending...' : 'Send for review'}
          onPress={props.onSubmit}
          disabled={
            props.loading ||
            props.submitting ||
            props.uploadingIds.length > 0 ||
            count.remaining > 0 ||
            Object.values(props.uploadErrors).some(Boolean)
          }
          compact
        />
      </View>
    </View>
  );
}
