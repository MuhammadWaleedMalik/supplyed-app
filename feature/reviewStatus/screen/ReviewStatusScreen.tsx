import React, { useEffect, useState } from 'react';
import { ActivityIndicator, Modal, StyleSheet, Text, View } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import Button from '../../../components/Ui/Button';
import { colors, common } from '../../../components/Ui/theme';
import { AccountType } from '../../../utils/onboarding/onboardingData';
import {
  getProfile,
  getSignatoryApproval,
  Profile,
  SignatoryApproval,
  submitProfileForReview,
} from '../../onboarding/apis/profileApi';

type Props = {
  type: AccountType;
  email: string;
  onDashboard: () => void;
};

function isMatSchool(type: AccountType, profile: Profile | null) {
  return type === 'school' && profile?.institutionType === 'MAT_SCHOOL';
}

function canOpenDashboard(
  type: AccountType,
  profile: Profile | null,
  approval: SignatoryApproval | null,
) {
  const profileReady = profile?.status === 'ACTIVE';
  const approvalReady = !isMatSchool(type, profile) || approval?.status === 'APPROVED';
  return profileReady && approvalReady;
}

function approvalText(approval: SignatoryApproval | null) {
  if (!approval) return 'Not requested yet';
  if (approval.status === 'PENDING') return 'Waiting for signatory approval';
  if (approval.status === 'APPROVED') return 'Approved';
  if (approval.status === 'DECLINED') return 'Declined';
  if (approval.status === 'EXPIRED') return 'Expired';
  return approval.status;
}

export default function ReviewStatusScreen({ type, email, onDashboard }: Props) {
  const [profile, setProfile] = useState<Profile | null>(null);
  const [approval, setApproval] = useState<SignatoryApproval | null>(null);
  const [loading, setLoading] = useState(true);
  const [profileBusy, setProfileBusy] = useState(false);
  const [approvalBusy, setApprovalBusy] = useState(false);
  const [error, setError] = useState('');

  const matSchool = isMatSchool(type, profile);
  const profileReady = profile?.status === 'ACTIVE';
  const approvalReady = !matSchool || approval?.status === 'APPROVED';

  async function submitIfReady(nextProfile: Profile, nextApproval: SignatoryApproval | null) {
    const trustReady = !isMatSchool(type, nextProfile) || nextApproval?.status === 'APPROVED';

    if (nextProfile.status === 'INCOMPLETE' && trustReady) {
      return submitProfileForReview(type);
    }

    return nextProfile;
  }

  async function loadAll() {
    setLoading(true);
    setError('');
    try {
      let nextProfile = await getProfile(type);
      let nextApproval: SignatoryApproval | null = null;

      if (isMatSchool(type, nextProfile)) {
        nextApproval = await getSignatoryApproval();
      }

      nextProfile = await submitIfReady(nextProfile, nextApproval);
      setProfile(nextProfile);
      setApproval(nextApproval);

      if (canOpenDashboard(type, nextProfile, nextApproval)) {
        onDashboard();
      }
    } catch (problem) {
      setError(problem instanceof Error ? problem.message : 'Unable to check status.');
    }
    setLoading(false);
  }

  async function refreshProfileStatus() {
    setProfileBusy(true);
    setError('');
    try {
      let nextProfile = await getProfile(type);
      nextProfile = await submitIfReady(nextProfile, approval);
      setProfile(nextProfile);

      if (canOpenDashboard(type, nextProfile, approval)) {
        onDashboard();
      }
    } catch (problem) {
      setError(problem instanceof Error ? problem.message : 'Unable to refresh profile status.');
    }
    setProfileBusy(false);
  }

  async function refreshApprovalStatus() {
    if (!matSchool) return;

    setApprovalBusy(true);
    setError('');
    try {
      const nextApproval = await getSignatoryApproval();
      let nextProfile = profile;

      if (nextProfile) {
        nextProfile = await submitIfReady(nextProfile, nextApproval);
        setProfile(nextProfile);
      }

      setApproval(nextApproval);

      if (canOpenDashboard(type, nextProfile, nextApproval)) {
        onDashboard();
      }
    } catch (problem) {
      setError(problem instanceof Error ? problem.message : 'Unable to refresh approval status.');
    }
    setApprovalBusy(false);
  }

  useEffect(() => {
    loadAll();
  }, []);

  return (
    <SafeAreaView style={styles.safeArea}>
      <View style={styles.topBar}>
        <Text style={styles.brand}>Supply<Text style={styles.brandBlue}>ED</Text></Text>
        <Text numberOfLines={1} style={styles.email}>{email}</Text>
      </View>

      <Modal visible transparent animationType="fade" onRequestClose={() => {}}>
        <View style={styles.overlay}>
          <View style={styles.dialog}>
            <Text style={styles.badge}>PROFILE REVIEW</Text>
            <Text style={common.cardTitle}>Your dashboard is locked</Text>
            <Text style={common.body}>
              You can access the dashboard after the profile is active{matSchool ? ' and the MAT signatory has approved it.' : '.'}
            </Text>

            <View style={styles.statusBox}>
              <View style={styles.statusRow}>
                <Text style={styles.statusLabel}>Profile status</Text>
                <Text style={[styles.statusValue, profileReady && styles.good]}>
                  {profile?.status || 'Checking'}
                </Text>
              </View>
              <View style={styles.statusRow}>
                <Text style={styles.statusLabel}>Signatory approval</Text>
                <Text style={[styles.statusValue, approvalReady && styles.good]}>
                  {matSchool ? approvalText(approval) : 'Not required'}
                </Text>
              </View>
            </View>

            {loading ? (
              <View style={styles.loadingRow}>
                <ActivityIndicator color={colors.blue} />
                <Text style={styles.small}>Checking latest status...</Text>
              </View>
            ) : null}

            {error ? <Text style={styles.error}>{error}</Text> : null}

            <View style={styles.actions}>
              <Button
                title={profileBusy ? 'Refreshing...' : 'Refetch profile status'}
                onPress={refreshProfileStatus}
                disabled={loading || profileBusy || approvalBusy}
                compact
              />
              {matSchool ? (
                <Button
                  title={approvalBusy ? 'Refreshing...' : 'Refetch approval'}
                  variant="text"
                  onPress={refreshApprovalStatus}
                  disabled={loading || profileBusy || approvalBusy}
                  compact
                />
              ) : null}
            </View>
          </View>
        </View>
      </Modal>
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  safeArea: {
    flex: 1,
    backgroundColor: '#f4f6f8',
  },
  topBar: {
    minHeight: 60,
    paddingHorizontal: 16,
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    borderBottomWidth: 1,
    borderColor: colors.border,
    backgroundColor: '#ffffff',
  },
  brand: {
    fontSize: 19,
    fontWeight: '800',
    color: colors.ink,
  },
  brandBlue: {
    color: colors.blue,
  },
  email: {
    maxWidth: 180,
    color: colors.muted,
    fontSize: 12,
  },
  overlay: {
    flex: 1,
    backgroundColor: 'rgba(0, 0, 0, 0.45)',
    justifyContent: 'center',
    alignItems: 'center',
    padding: 18,
  },
  dialog: {
    width: '100%',
    maxWidth: 520,
    borderRadius: 8,
    backgroundColor: '#ffffff',
    padding: 22,
    gap: 14,
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
  statusBox: {
    borderWidth: 1,
    borderColor: colors.border,
    borderRadius: 8,
    overflow: 'hidden',
  },
  statusRow: {
    minHeight: 48,
    paddingHorizontal: 12,
    paddingVertical: 10,
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    gap: 10,
    borderBottomWidth: 1,
    borderColor: colors.border,
  },
  statusLabel: {
    color: colors.muted,
    fontSize: 12,
    fontWeight: '700',
  },
  statusValue: {
    color: colors.ink,
    fontSize: 12,
    fontWeight: '800',
    textAlign: 'right',
    flexShrink: 1,
  },
  good: {
    color: '#198742',
  },
  loadingRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 8,
  },
  small: {
    color: colors.muted,
    fontSize: 12,
  },
  error: {
    color: '#c93251',
    fontSize: 12,
    lineHeight: 18,
  },
  actions: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    gap: 10,
  },
});