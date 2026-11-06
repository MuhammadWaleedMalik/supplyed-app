import React, { useRef, useState } from 'react';
import { Text, View } from 'react-native';
import {
  ComplianceApproval,
  requestComplianceApproval,
} from '../../feature/onboarding/apis/profileApi';
import { getSessionVersion } from '../../utils/api/session';
import Button from '../Ui/Button';
import { createThemedStyles, useCommonStyles } from '../Ui/theme';

type Props = {
  visible: boolean;
  approval: ComplianceApproval | null;
  refreshing: boolean;
  onRefresh: () => void;
  onUpdated: (approval: ComplianceApproval) => void;
};

function statusText(approval: ComplianceApproval | null) {
  if (!approval) return 'Send an approval request to the compliance contact saved on the school profile.';
  if (approval.status === 'PENDING')
    return `Waiting for ${approval.complianceName} to approve this school.`;
  if (approval.status === 'APPROVED') return 'Approved by the school compliance contact.';
  if (approval.status === 'DECLINED')
    return approval.declineReason || 'The compliance contact declined this request.';
  if (approval.status === 'EXPIRED') return 'The approval link expired before a decision was made.';
  return 'This approval request is no longer active.';
}

export default function ComplianceApprovalPanel(props: Props) {
  const common = useCommonStyles();
  const styles = useStyles();
  const [sending, setSending] = useState(false);
  const [error, setError] = useState('');
  const lock = useRef(false);

  async function send() {
    if (lock.current) return;
    lock.current = true;
    const version = getSessionVersion();
    setSending(true);
    setError('');
    try {
      const result = await requestComplianceApproval();
      if (version === getSessionVersion()) props.onUpdated(result);
    } catch (problem) {
      if (version === getSessionVersion())
        setError(problem instanceof Error ? problem.message : 'Unable to send the compliance request.');
    } finally {
      lock.current = false;
      if (version === getSessionVersion()) setSending(false);
    }
  }

  if (!props.visible) return null;
  return (
    <View style={styles.card}>
      <Text style={styles.badge}>COMPLIANCE APPROVAL</Text>
      <Text style={styles.title}>School compliance contact</Text>
      <Text style={common.body}>{statusText(props.approval)}</Text>
      {props.approval?.complianceEmail ? (
        <Text style={styles.meta}>{props.approval.complianceEmail}</Text>
      ) : null}
      {props.approval?.expiresAt ? (
        <Text style={styles.meta}>Expires {props.approval.expiresAt.slice(0, 10)}</Text>
      ) : null}
      {props.approval?.status !== 'APPROVED' ? (
        <Button
          title={sending ? 'Sending request...' : props.approval ? 'Send a new approval request' : 'Send approval request'}
          disabled={sending || props.refreshing}
          onPress={send}
        />
      ) : null}
      <Button
        title={props.refreshing ? 'Refreshing...' : 'Refresh approval status'}
        variant="social"
        disabled={sending || props.refreshing}
        onPress={props.onRefresh}
      />
      {error ? <Text accessibilityRole="alert" style={styles.error}>{error}</Text> : null}
    </View>
  );
}

const useStyles = createThemedStyles(colors => ({
  card: {
    borderWidth: 1,
    borderColor: colors.brandBorder,
    borderRadius: 8,
    backgroundColor: '#ffffff',
    padding: 15,
    gap: 10,
  },
  badge: {
    alignSelf: 'flex-start',
    borderRadius: 8,
    backgroundColor: colors.brandTint,
    color: colors.brandDark,
    fontSize: 10,
    fontWeight: '800',
    paddingHorizontal: 8,
    paddingVertical: 3,
  },
  title: { color: colors.ink, fontSize: 16, fontWeight: '800' },
  meta: { color: colors.muted, fontSize: 12 },
  error: { color: '#b4233f', fontSize: 12, lineHeight: 18 },
}));
