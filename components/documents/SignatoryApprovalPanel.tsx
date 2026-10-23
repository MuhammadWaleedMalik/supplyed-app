import React, { useEffect, useState } from 'react';
import { Text, View } from 'react-native';
import type { SignatoryApproval } from '../../feature/onboarding/apis/profileApi';
import { requestSignatoryApproval } from '../../feature/onboarding/apis/profileApi';
import { useAuthAttempt } from '../../utils/auth/useAuthAttempt';
import Button from '../Ui/Button';
import Input from '../Ui/Input';
import { createThemedStyles, useCommonStyles } from '../Ui/theme';

type Props = {
  visible: boolean;
  approval: SignatoryApproval | null;
  refreshing: boolean;
  onRefresh: () => void;
  onUpdated: (approval: SignatoryApproval) => void;
};

function statusText(approval: SignatoryApproval | null) {
  if (!approval) return 'The trust approval email was not found yet.';
  if (approval.status === 'PENDING') {
    return 'Waiting for ' + approval.signatoryName + ' to approve this school.';
  }
  if (approval.status === 'APPROVED') {
    return approval.approvedByAdmin
      ? 'Approved by SupplyED after trust confirmation.'
      : 'Approved by your trust.';
  }
  if (approval.status === 'DECLINED') {
    return approval.declineReason || 'The signatory declined this request.';
  }
  if (approval.status === 'EXPIRED') {
    return 'The link expired before the signatory responded.';
  }
  return 'This request is no longer valid.';
}

export default function SignatoryApprovalPanel(props: Props) {
  const common = useCommonStyles();
  const styles = useStyles();
  const attempt = useAuthAttempt();
  const [editing, setEditing] = useState(false);
  const [sending, setSending] = useState(false);
  const [error, setError] = useState('');
  const [fields, setFields] = useState({
    signatoryName: '',
    signatoryEmail: '',
    signatoryJobTitle: '',
  });

  useEffect(() => {
    if (props.approval)
      setFields({
        signatoryName: props.approval.signatoryName,
        signatoryEmail: props.approval.signatoryEmail,
        signatoryJobTitle: props.approval.signatoryJobTitle,
      });
  }, [props.approval]);

  async function sendRequest() {
    const active = attempt.begin();
    if (!active) return;
    setSending(true);
    setError('');
    try {
      const next = await requestSignatoryApproval(fields);
      if (!active()) return;
      props.onUpdated(next);
      setEditing(false);
    } catch (problem) {
      if (active())
        setError(
          problem instanceof Error
            ? problem.message
            : 'Unable to send the approval request.',
        );
    } finally {
      attempt.finish();
      if (active()) setSending(false);
    }
  }

  if (!props.visible) return null;

  return (
    <View style={styles.card}>
      <Text style={styles.badge}>TRUST APPROVAL</Text>
      <Text style={styles.title}>MAT signatory approval</Text>
      <Text style={common.body}>{statusText(props.approval)}</Text>
      {props.approval?.signatoryEmail ? (
        <Text style={styles.meta}>{props.approval.signatoryEmail}</Text>
      ) : null}
      {props.approval?.expiresAt ? (
        <Text style={styles.meta}>
          Expires {props.approval.expiresAt.slice(0, 10)}
        </Text>
      ) : null}
      <Button
        title={props.refreshing ? 'Refreshing...' : 'Refresh approval status'}
        variant="text"
        onPress={props.onRefresh}
        disabled={props.refreshing || sending}
        compact
      />
      {props.approval?.status !== 'APPROVED' ? (
        <>
          {!editing && props.approval ? (
            <Button
              title="Update signatory or send a new request"
              variant="link"
              onPress={() => setEditing(true)}
              disabled={props.refreshing}
            />
          ) : (
            <View style={styles.form}>
              <Text style={styles.meta}>
                Choose a trust signatory other than the account owner. A new
                request replaces the previous link.
              </Text>
              <Input
                label="Signatory name"
                value={fields.signatoryName}
                disabled={sending}
                onChangeText={value =>
                  setFields(current => ({ ...current, signatoryName: value }))
                }
              />
              <Input
                label="Signatory email"
                email
                value={fields.signatoryEmail}
                disabled={sending}
                onChangeText={value =>
                  setFields(current => ({ ...current, signatoryEmail: value }))
                }
              />
              <Input
                label="Signatory job title"
                value={fields.signatoryJobTitle}
                disabled={sending}
                onChangeText={value =>
                  setFields(current => ({
                    ...current,
                    signatoryJobTitle: value,
                  }))
                }
              />
              {error ? (
                <Text accessibilityRole="alert" style={styles.error}>
                  {error}
                </Text>
              ) : null}
              <Button
                title={sending ? 'Sending request...' : 'Send approval request'}
                onPress={sendRequest}
                disabled={sending || props.refreshing}
              />
              {props.approval ? (
                <Button
                  title="Cancel"
                  variant="link"
                  onPress={() => setEditing(false)}
                  disabled={sending}
                />
              ) : null}
            </View>
          )}
        </>
      ) : null}
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
  form: { gap: 12 },
  error: { color: '#b4233f', fontSize: 12, lineHeight: 18 },
}));
