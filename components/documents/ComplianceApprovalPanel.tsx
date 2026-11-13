import React, { useEffect, useRef, useState } from 'react';
import { Text, View } from 'react-native';
import {
  ComplianceApproval,
  requestComplianceApproval,
  updateSchoolComplianceEmail,
} from '../../feature/onboarding/apis/profileApi';
import { getSessionVersion } from '../../utils/api/session';
import Button from '../Ui/Button';
import Input from '../Ui/Input';
import { createThemedStyles, useCommonStyles } from '../Ui/theme';

type Props = {
  visible: boolean;
  approvalRequired: boolean;
  approval: ComplianceApproval | null;
  complianceEmail: string;
  refreshing: boolean;
  onRefresh: () => void;
  onUpdated: (approval: ComplianceApproval) => void;
  onEmailChanged: (email: string) => void;
};

function statusText(approval: ComplianceApproval | null) {
  if (!approval) return 'Ready to request approval';
  if (approval.status === 'PENDING')
    return `Waiting for ${approval.complianceName}`;
  if (approval.status === 'APPROVED') return 'Compliance approved';
  if (approval.status === 'DECLINED')
    return approval.declineReason || 'The compliance contact declined this request.';
  if (approval.status === 'EXPIRED') return 'The approval link expired before a decision was made.';
  return 'This approval request is no longer active.';
}

export default function ComplianceApprovalPanel(props: Props) {
  const common = useCommonStyles();
  const styles = useStyles();
  const [sending, setSending] = useState(false);
  const [saving, setSaving] = useState(false);
  const [email, setEmail] = useState(props.complianceEmail);
  const [error, setError] = useState('');
  const lock = useRef(false);

  useEffect(() => setEmail(props.complianceEmail), [props.complianceEmail]);

  async function saveEmail() {
    const value = email.trim().toLowerCase();
    if (value === props.complianceEmail.trim().toLowerCase()) return true;
    const version = getSessionVersion();
    setSaving(true);
    setError('');
    try {
      const profile = await updateSchoolComplianceEmail(value);
      if (version !== getSessionVersion()) return false;
      props.onEmailChanged(profile.complianceEmail || value);
      return true;
    } catch (problem) {
      if (version === getSessionVersion())
        setError(
          problem instanceof Error
            ? problem.message
            : 'Unable to save the compliance email.',
        );
      return false;
    } finally {
      if (version === getSessionVersion()) setSaving(false);
    }
  }

  async function send() {
    if (lock.current) return;
    lock.current = true;
    const version = getSessionVersion();
    setSending(true);
    setError('');
    try {
      if (!(await saveEmail())) return;
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
      <Text style={styles.badge}>
        {props.approvalRequired ? 'COMPLIANCE APPROVAL' : 'COMPLIANCE CONTACT'}
      </Text>
      <Text style={styles.title}>
        {props.approvalRequired
          ? 'Who should approve your school?'
          : 'School compliance email'}
      </Text>
      <Text style={common.body}>
        {props.approvalRequired
          ? 'We’ll email this person a secure approval link. You can update the address here before sending.'
          : 'Keep the safeguarding and compliance contact address up to date.'}
      </Text>
      <Input
        label="COMPLIANCE EMAIL"
        placeholder="safeguarding@school.org.uk"
        email
        value={email}
        disabled={sending || saving}
        onChangeText={setEmail}
      />
      {email.trim().toLowerCase() !==
      props.complianceEmail.trim().toLowerCase() ? (
        <Button
          title={saving ? 'Saving...' : 'Save email'}
          variant="social"
          disabled={saving || sending}
          onPress={() => {
            saveEmail().catch(() => {});
          }}
        />
      ) : null}
      {props.approvalRequired ? <View style={styles.statusRow}>
        <View
          style={[
            styles.statusDot,
            props.approval?.status === 'APPROVED' && styles.statusDotApproved,
          ]}
        />
        <View style={styles.statusCopy}>
          <Text style={styles.statusLabel}>REVIEW STATUS</Text>
          <Text style={styles.statusText}>{statusText(props.approval)}</Text>
        </View>
      </View> : null}
      {props.approval?.expiresAt ? (
        <Text style={styles.meta}>Expires {props.approval.expiresAt.slice(0, 10)}</Text>
      ) : null}
      {props.approvalRequired && props.approval?.status !== 'APPROVED' ? (
        <Button
          title={sending ? 'Sending request...' : props.approval ? 'Send a new approval request' : 'Send approval request'}
          disabled={sending || saving || props.refreshing || !email.trim()}
          onPress={send}
        />
      ) : null}
      {props.approvalRequired ? <Button
        title={props.refreshing ? 'Refreshing...' : 'Refresh approval status'}
        variant="social"
        disabled={sending || saving || props.refreshing}
        onPress={props.onRefresh}
      /> : null}
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
  statusRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 11,
    padding: 13,
    borderRadius: 12,
    backgroundColor: colors.soft,
  },
  statusDot: {
    width: 10,
    height: 10,
    borderRadius: 5,
    backgroundColor: '#d59a18',
  },
  statusDotApproved: { backgroundColor: colors.brandDark },
  statusCopy: { flex: 1, gap: 2 },
  statusLabel: {
    color: colors.muted,
    fontSize: 9,
    fontWeight: '800',
    letterSpacing: 1,
  },
  statusText: { color: colors.ink, fontSize: 13, fontWeight: '700' },
  error: { color: '#b4233f', fontSize: 12, lineHeight: 18 },
}));
