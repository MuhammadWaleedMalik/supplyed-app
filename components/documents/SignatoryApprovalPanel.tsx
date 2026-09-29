import React from 'react';
import { StyleSheet, Text, View } from 'react-native';
import type { SignatoryApproval } from '../../feature/onboarding/apis/profileApi';
import Button from '../Ui/Button';
import { colors, common } from '../Ui/theme';

type Props = {
  visible: boolean;
  approval: SignatoryApproval | null;
  refreshing: boolean;
  onRefresh: () => void;
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
        disabled={props.refreshing}
        compact
      />
    </View>
  );
}

const styles = StyleSheet.create({
  card: {
    borderWidth: 1,
    borderColor: colors.border,
    borderRadius: 8,
    backgroundColor: '#ffffff',
    padding: 15,
    gap: 10,
  },
  badge: {
    alignSelf: 'flex-start',
    borderRadius: 8,
    backgroundColor: colors.paleBlue,
    color: '#006b93',
    fontSize: 10,
    fontWeight: '800',
    paddingHorizontal: 8,
    paddingVertical: 3,
  },
  title: { color: colors.ink, fontSize: 16, fontWeight: '800' },
  meta: { color: colors.muted, fontSize: 12 },
});